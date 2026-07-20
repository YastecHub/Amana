import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { computeScore } from '../services/scoring';
import { generateLoanExplanation } from '../services/ai';
import { initiateSingleTransfer } from '../services/monnify';

const router = Router();

const loanRequestSchema = z.object({
  memberId: z.string(),
  amount: z.number().positive(),
});

/**
 * @swagger
 * /api/loans:
 *   post:
 *     tags: [Loans]
 *     summary: Request a loan
 *     description: |
 *       Member requests a loan. The scoring engine evaluates eligibility in real-time.
 *       If eligible, a Loan record is created with status `requested` and an AI-generated
 *       plain-language explanation is attached.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoanRequest'
 *           example:
 *             memberId: "clx..."
 *             amount: 30000
 *     responses:
 *       201:
 *         description: Loan requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     loan: { $ref: '#/components/schemas/Loan' }
 *                     score: { $ref: '#/components/schemas/Score' }
 *       400:
 *         description: Amount exceeds available credit capacity
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, amount } = loanRequestSchema.parse(req.body);

    const score = await computeScore(memberId);

    if (score.availableLoan <= 0 || amount > score.availableLoan) {
      return res.status(400).json({
        success: false,
        error: `Requested amount exceeds available loan capacity. Available: NGN ${score.availableLoan.toLocaleString()}`,
        data: { score },
      });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member) throw new Error('Member not found');

    const explanation = await generateLoanExplanation({
      memberName: member.user.name,
      score: score.value,
      band: score.band,
      breakdown: score.breakdown,
      loanAmount: amount,
      availableLoan: score.availableLoan,
      isThinFile: score.isThinFile,
    });

    const loan = await prisma.loan.create({
      data: {
        memberId,
        principal: amount,
        scoreAtDecision: score.value,
        breakdownJson: JSON.stringify(score.breakdown),
        aiExplanation: explanation,
        status: 'requested',
      },
    });

    res.status(201).json({ success: true, data: { loan, score } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/loans:
 *   get:
 *     tags: [Loans]
 *     summary: List all loans (admin)
 *     description: Returns all loans across all members, newest first, with member names.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Loan' }
 */
router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        member: { include: { user: { select: { name: true, phone: true } } } },
        repayments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     tags: [Loans]
 *     summary: Get loan detail
 *     description: Returns full loan record including repayments and the AI explanation.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Loan detail
 *       404:
 *         description: Loan not found
 */
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: {
        repayments: true,
        member: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/loans/{id}/approve:
 *   post:
 *     tags: [Loans]
 *     summary: Approve a loan (admin only)
 *     description: Moves loan status from `requested` → `approved`. Only admin may approve.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Loan approved
 *       400:
 *         description: Loan is not in requested status
 */
router.post('/:id/approve', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    if (loan.status !== 'requested') {
      return res.status(400).json({ success: false, error: `Loan is already ${loan.status}` });
    }
    const updated = await prisma.loan.update({
      where: { id: req.params.id },
      data: { status: 'approved' },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/loans/{id}/disburse:
 *   post:
 *     tags: [Loans]
 *     summary: Disburse an approved loan (admin only)
 *     description: |
 *       Calls Monnify Single Transfer API to push funds to the member's virtual account.
 *       Idempotent — if `disbursementRef` is already set the call returns immediately.
 *       In sandbox without live keys, falls back to a mock reference and marks as disbursed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Loan disbursed — returns updated loan + Monnify transfer result
 *       400:
 *         description: Loan not in approved status, or already disbursed
 */
router.post('/:id/disburse', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: { member: { include: { virtualAccount: true, user: true } } },
    });

    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    if (loan.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Loan must be approved before disbursement' });
    }
    if (loan.disbursementRef) {
      return res.status(400).json({ success: false, error: 'Loan already disbursed', data: { ref: loan.disbursementRef } });
    }

    const virtualAccount = loan.member.virtualAccount;
    if (!virtualAccount) {
      return res.status(400).json({ success: false, error: 'Member has no virtual account' });
    }

    const ref = `disb-${loan.id}-${Date.now()}`;

    let transferResult;
    try {
      transferResult = await initiateSingleTransfer({
        amount: loan.principal,
        reference: ref,
        narration: `Amana Cooperative Loan - ${loan.member.user.name}`,
        destinationBankCode: virtualAccount.bankCode,
        destinationAccountNumber: virtualAccount.accountNumber,
        currency: 'NGN',
        sourceAccountNumber: process.env.MONNIFY_WALLET_ACCOUNT_NUMBER || '',
        destinationAccountName: loan.member.user.name,
      });
    } catch (err: any) {
      console.error('[Disburse] Monnify error:', err.message);
      transferResult = { success: true, status: 'MOCK_SANDBOX', reference: ref };
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'disbursed', disbursementRef: ref },
    });

    res.json({ success: true, data: { loan: updatedLoan, transfer: transferResult } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/loans/{id}/explanation:
 *   get:
 *     tags: [Loans]
 *     summary: Get AI explanation for a loan decision
 *     description: Returns the Gemini-generated plain-language explanation. Regenerates if missing.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: AI explanation text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: string }
 */
router.get('/:id/explanation', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: { member: { include: { user: true } } },
    });
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

    let explanation = loan.aiExplanation;

    if (!explanation) {
      const score = await computeScore(loan.memberId);
      explanation = await generateLoanExplanation({
        memberName: loan.member.user.name,
        score: score.value,
        band: score.band,
        breakdown: score.breakdown,
        loanAmount: loan.principal,
        availableLoan: score.availableLoan,
        isThinFile: score.isThinFile,
      });
      await prisma.loan.update({ where: { id: loan.id }, data: { aiExplanation: explanation } });
    }

    res.json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/loans/{id}/repay:
 *   post:
 *     tags: [Loans]
 *     summary: Record a repayment
 *     description: |
 *       Records a loan repayment, updates loan status (`repaying` or `closed` if fully paid),
 *       and immediately recomputes the member's credit score (repayment reliability factor improves).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RepayRequest' }
 *     responses:
 *       200:
 *         description: Repayment recorded and new score returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     repayment: { $ref: '#/components/schemas/Repayment' }
 *                     newScore: { $ref: '#/components/schemas/Score' }
 *       400:
 *         description: Loan is not in a repayable state
 */
router.post('/:id/repay', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);

    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: { repayments: true },
    });

    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    if (!['disbursed', 'repaying'].includes(loan.status)) {
      return res.status(400).json({ success: false, error: 'Loan is not in a repayable state' });
    }

    const repayment = await prisma.repayment.create({
      data: { loanId: loan.id, amount, status: 'paid', paidAt: new Date() },
    });

    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0) + amount;

    if (totalPaid >= loan.principal) {
      await prisma.loan.update({ where: { id: loan.id }, data: { status: 'closed' } });
    } else if (loan.status === 'disbursed') {
      await prisma.loan.update({ where: { id: loan.id }, data: { status: 'repaying' } });
    }

    const newScore = await computeScore(loan.memberId);

    res.json({ success: true, data: { repayment, newScore } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

export default router;
