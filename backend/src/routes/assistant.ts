import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { answerAssistantQuery } from '../services/ai';

const router = Router();

const querySchema = z.object({
  question: z.string().min(3),
});

router.post('/query', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = querySchema.parse(req.body);

    const cooperative = await prisma.cooperative.findFirst();
    const members = await prisma.member.findMany({
      take: 10,
      include: { user: { select: { name: true, role: true } } }
    });
    const recentContributions = await prisma.contribution.findMany({
      take: 10,
      orderBy: { paidAt: 'desc' }
    });
    const recentLoans = await prisma.loan.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const answer = await answerAssistantQuery(question, {
      cooperative,
      members,
      recentContributions,
      recentLoans
    });

    res.json({ success: true, data: answer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

export default router;
