import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { answerAssistantQuery } from '../services/ai';

const router = Router();

const querySchema = z.object({
  question: z.string().min(3),
});

/**
 * @swagger
 * /api/assistant/query:
 *   post:
 *     tags: [Assistant]
 *     summary: Ask the AI assistant about cooperative data
 *     description: |
 *       Natural-language Q&A over the cooperative's live data.
 *       Powered by Gemini 1.5 Flash. The model is grounded strictly on the data
 *       passed in the prompt — it cannot invent member details or scores.
 *       If GEMINI_API_KEY is not set, returns a sensible fallback message.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssistantRequest'
 *           examples:
 *             highestScore:
 *               summary: Who has the best score?
 *               value: { question: "Which members have the highest credit scores?" }
 *             eligibility:
 *               summary: Loan eligibility check
 *               value: { question: "Is Fatima eligible for a loan of ₦50,000?" }
 *     responses:
 *       200:
 *         description: AI-generated answer grounded in cooperative data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: string, description: "Plain-text answer from Gemini" }
 *       400:
 *         description: Question too short (< 3 characters)
 */
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
