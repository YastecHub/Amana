import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { calculateMemberScore } from '../services/scoring';
import { generateLoanExplanation } from '../services/ai';
import { initiateSingleTransfer } from '../services/monnify';

const router = Router();

const loanRequestSchema = z.object({
  memberId: z.string(),
  amount: z.number().positive(),
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, amount } = loanRequestSchema.parse(req.body);

    const score = await calculateMemberScore(memberId);

    if (amount > score.availableLoan) {
      return res.status(400).json({ 
        success: false, 
        error: \`Requested amount exceeds available loan capacity (NGN \${score.availableLoan})\`
      });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!member) throw new Error('Member not found');

    const explanation = await generateLoanExplanation({
      memberName: member.user.name,
      score: score.value,
      band: score.band,
      breakdown: score.breakdown,
      loanAmount: amount,
      availableLoan: score.availableLoan,
      isThinFile: score.isThinFile
    });

    const loan = await prisma.loan.create({
      data: {
        memberId,
        principal: amount,
        scoreAtDecision: score.value,
        breakdownJson: JSON.stringify(score.breakdown),
        aiExplanation: explanation,
        status: 'requested'
      }
    });

    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        member: {
          include: { user: { select: { name: true, phone: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: { repayments: true }
    });
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.update({
      where: { id: req.params.id },
      data: { status: 'approved' }
    });
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/disburse', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: { member: { include: { virtualAccount: true, user: true } } }
    });

    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    if (loan.status !== 'approved') return res.status(400).json({ success: false, error: 'Loan must be approved before disbursement' });
    if (loan.disbursementRef) return res.status(400).json({ success: false, error: 'Loan already disbursed' });

    const virtualAccount = loan.member.virtualAccount;
    if (!virtualAccount) return res.status(400).json({ success: false, error: 'Member has no virtual account to disburse to' });

    const ref = \`disb-\${loan.id}-\${Date.now()}\`;

    // Attempt Monnify Disbursement
    try {
      await initiateSingleTransfer({
        amount: loan.principal,
        reference: ref,
        narration: 'Amana Cooperative Loan Disbursement',
        destinationBankCode: virtualAccount.bankCode,
        destinationAccountNumber: virtualAccount.accountNumber,
        currency: 'NGN',
        sourceAccountNumber: process.env.MONNIFY_WALLET_ACCOUNT_NUMBER || ''
      });
    } catch (err) {
      console.error('Monnify disbursement failed', err);
      // Fallback or record failed attempt could be handled here
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'disbursed', disbursementRef: ref }
    });

    res.json({ success: true, data: updatedLoan });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/explanation', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id }
    });
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    
    res.json({ success: true, data: loan.aiExplanation });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/repay', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);
    
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: { repayments: true }
    });

    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

    const repayment = await prisma.repayment.create({
      data: {
        loanId: loan.id,
        amount,
        status: 'paid',
        paidAt: new Date()
      }
    });

    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0) + amount;
    
    if (totalPaid >= loan.principal) {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: 'closed' }
      });
    } else if (loan.status === 'disbursed') {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: 'repaying' }
      });
    }

    await calculateMemberScore(loan.memberId);

    res.json({ success: true, data: repayment });
  } catch (error) {
    next(error);
  }
});

export default router;
