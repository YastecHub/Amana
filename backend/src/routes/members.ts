import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { verifyBVN, createReservedAccount } from '../services/monnify';
import { calculateMemberScore } from '../services/scoring';

const router = Router();

const onboardSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  bvn: z.string().min(11).max(11),
  password: z.string().min(6),
  cooperativeId: z.string()
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = onboardSchema.parse(req.body);

    const bvnResult = await verifyBVN(data.bvn, data.name);
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Create User & Member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          role: 'member',
          passwordHash
        }
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          cooperativeId: data.cooperativeId,
          bvnStatus: bvnResult.verified ? 'mocked' : 'pending'
        }
      });

      // Monnify Account creation
      let account;
      try {
        account = await createReservedAccount({
          accountReference: \`ref-\${member.id}\`,
          accountName: data.name,
          customerEmail: \`\${data.phone}@amana.local\`,
          customerName: data.name,
          currencyCode: 'NGN',
          contractCode: process.env.MONNIFY_CONTRACT_CODE || '',
          getAllAvailableBanks: false
        });
      } catch (err) {
        console.error('Failed to create Monnify account', err);
        throw new Error('Failed to create Monnify account');
      }

      const virtualAccount = await tx.virtualAccount.create({
        data: {
          memberId: member.id,
          monnifyAccountReference: account.accountReference,
          accountNumber: account.accountNumber,
          bankName: account.bankName,
          bankCode: account.bankCode || '035'
        }
      });

      return { user, member, virtualAccount };
    });

    // Compute initial score
    const score = await calculateMemberScore(result.member.id);

    res.status(201).json({
      success: true,
      data: {
        member: result.member,
        user: { id: result.user.id, name: result.user.name, phone: result.user.phone },
        virtualAccount: result.virtualAccount,
        score
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.member.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        virtualAccount: true,
        scores: { orderBy: { computedAt: 'desc' }, take: 1 },
        contributions: true
      }
    });

    const formattedMembers = members.map(m => {
      const totalContributed = m.contributions.reduce((acc, c) => acc + c.amount, 0);
      const latestScore = m.scores[0] || null;
      return {
        ...m,
        totalContributed,
        latestScore
      };
    });

    res.json({ success: true, data: formattedMembers });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, phone: true } },
        virtualAccount: true,
        contributions: { orderBy: { paidAt: 'desc' } },
        loans: { orderBy: { createdAt: 'desc' } },
        scores: { orderBy: { computedAt: 'desc' }, take: 1 }
      }
    });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/score', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const score = await prisma.score.findFirst({
      where: { memberId: req.params.id },
      orderBy: { computedAt: 'desc' }
    });

    res.json({ success: true, data: score });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/contributions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contributions = await prisma.contribution.findMany({
      where: { memberId: req.params.id },
      orderBy: { paidAt: 'desc' }
    });

    res.json({ success: true, data: contributions });
  } catch (error) {
    next(error);
  }
});

export default router;
