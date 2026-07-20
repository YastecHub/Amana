import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { verifyBVN, createReservedAccount } from '../services/monnify';
import { computeScore } from '../services/scoring';

const router = Router();

const onboardSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  bvn: z.string().min(11).max(11),
  password: z.string().min(6),
  cooperativeId: z.string().optional(),
});

/**
 * @swagger
 * /api/members:
 *   post:
 *     tags: [Members]
 *     summary: Onboard a new member
 *     description: |
 *       Creates a User + Member record, mocks BVN verification via Monnify KYC,
 *       and issues a dedicated Monnify Reserved Account (virtual bank account).
 *       An initial credit score is computed immediately (thin-file / provisional).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OnboardRequest'
 *     responses:
 *       201:
 *         description: Member onboarded — returns member, virtual account, and initial score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     member: { $ref: '#/components/schemas/Member' }
 *                     virtualAccount: { $ref: '#/components/schemas/VirtualAccount' }
 *                     score: { $ref: '#/components/schemas/Score' }
 *       409:
 *         description: Phone number already registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = onboardSchema.parse(req.body);

    let cooperativeId = data.cooperativeId;
    if (!cooperativeId) {
      const coop = await prisma.cooperative.findFirst();
      if (!coop) return res.status(400).json({ success: false, error: 'No cooperative found' });
      cooperativeId = coop.id;
    }

    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this phone number already exists' });
    }

    const bvnResult = await verifyBVN(data.bvn, data.name);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: data.name, phone: data.phone, role: 'member', passwordHash },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          cooperativeId: cooperativeId!,
          bvnStatus: bvnResult.verified ? 'mocked' : 'pending',
        },
      });

      const account = await createReservedAccount({
        accountReference: `amana-${member.id}`,
        accountName: data.name,
        customerEmail: `${data.phone}@amana.local`,
        customerName: data.name,
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE || '',
      });

      const virtualAccount = await tx.virtualAccount.create({
        data: {
          memberId: member.id,
          monnifyAccountReference: account.accountReference,
          accountNumber: account.accountNumber,
          bankName: account.bankName,
          bankCode: account.bankCode || '035',
        },
      });

      return { user, member, virtualAccount };
    });

    const score = await computeScore(result.member.id);

    res.status(201).json({
      success: true,
      data: {
        member: result.member,
        user: { id: result.user.id, name: result.user.name, phone: result.user.phone },
        virtualAccount: result.virtualAccount,
        score,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/members:
 *   get:
 *     tags: [Members]
 *     summary: List all members
 *     description: Returns all cooperative members with their latest credit score, virtual account, and total savings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Member' }
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.member.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        virtualAccount: true,
        scores: { orderBy: { computedAt: 'desc' }, take: 1 },
        contributions: true,
        loans: { where: { status: { in: ['disbursed', 'repaying'] } } },
      },
      orderBy: { joinDate: 'desc' },
    });

    const formatted = members.map((m) => {
      const totalContributed = m.contributions.reduce((acc, c) => acc + c.amount, 0);
      const latestScore = m.scores[0] || null;
      const outstandingBalance = m.loans.reduce((sum, l) => sum + l.principal, 0);
      return { ...m, contributions: undefined, totalContributed, latestScore, outstandingBalance };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/members/{id}:
 *   get:
 *     tags: [Members]
 *     summary: Get member detail
 *     description: Returns full member profile including contribution history, loan history, and last 5 score snapshots.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Full member record
 *       404:
 *         description: Member not found
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, phone: true } },
        virtualAccount: true,
        contributions: { orderBy: { paidAt: 'desc' } },
        loans: { include: { repayments: true }, orderBy: { createdAt: 'desc' } },
        scores: { orderBy: { computedAt: 'desc' }, take: 5 },
      },
    });

    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });

    const totalContributed = member.contributions.reduce((acc, c) => acc + c.amount, 0);
    res.json({ success: true, data: { ...member, totalContributed } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/members/{id}/score:
 *   get:
 *     tags: [Score]
 *     summary: Compute & return current credit score
 *     description: |
 *       Recomputes the member's credit score from live data and persists a new snapshot.
 *       Returns full breakdown per factor, band, loan eligibility, and available loan amount.
 *       Uses thin-file weights (no repayment factor) if the member has no prior loan history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full score result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Score' }
 */
router.get('/:id/score', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const score = await computeScore(req.params.id);
    res.json({ success: true, data: score });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/members/{id}/contributions:
 *   get:
 *     tags: [Members]
 *     summary: Get contribution history
 *     description: Returns all confirmed contributions for a member, newest first.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contribution list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Contribution' }
 */
router.get('/:id/contributions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contributions = await prisma.contribution.findMany({
      where: { memberId: req.params.id },
      orderBy: { paidAt: 'desc' },
    });
    res.json({ success: true, data: contributions });
  } catch (error) {
    next(error);
  }
});

export default router;
