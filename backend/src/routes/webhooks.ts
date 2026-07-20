import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyWebhookSignature } from '../services/monnify';
import { computeScore } from '../services/scoring';

const router = Router();

/**
 * @swagger
 * /api/webhooks/monnify:
 *   post:
 *     tags: [Webhooks]
 *     summary: Monnify webhook receiver
 *     description: |
 *       Production webhook endpoint called by Monnify on every transaction event.
 *       **Signature verification:** Validates `monnify-signature` header (HMAC-SHA512).
 *       **Idempotency:** Checks `WebhookLog` before processing — safe to retry.
 *       On `SUCCESSFUL_TRANSACTION`, finds the matching virtual account,
 *       records a Contribution, and recomputes the member's credit score.
 *       Configure this URL in your Monnify dashboard:
 *       `https://your-render-url.onrender.com/api/webhooks/monnify`
 *     security: []
 *     parameters:
 *       - in: header
 *         name: monnify-signature
 *         required: false
 *         schema: { type: string }
 *         description: HMAC-SHA512 hex signature of the raw request body
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType: { type: string, example: "SUCCESSFUL_TRANSACTION" }
 *               eventData: { type: object }
 *     responses:
 *       200:
 *         description: Processed (or already processed — idempotent)
 *       401:
 *         description: Invalid HMAC signature
 */
router.post('/monnify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['monnify-signature'] as string;
    const secretKey = process.env.MONNIFY_SECRET_KEY || '';

    if (signature && !verifyWebhookSignature(rawBody, signature, secretKey)) {
      return res.status(401).send('Unauthorized: Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    const { eventType, eventData } = payload;
    const monnifyRef = eventData?.transactionReference || `wh-${Date.now()}`;

    const existingLog = await prisma.webhookLog.findUnique({ where: { monnifyRef } });
    if (existingLog) {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    await prisma.webhookLog.create({
      data: { monnifyRef, eventType, payloadJson: rawBody },
    });

    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      const accountNumber =
        eventData.destinationAccountInformation?.accountNumber ||
        eventData.product?.reference;

      if (accountNumber) {
        const virtualAccount = await prisma.virtualAccount.findFirst({
          where: { accountNumber },
        });

        if (virtualAccount) {
          const amount = parseFloat(eventData.amountPaid || eventData.amount || '0');
          await prisma.contribution.create({
            data: {
              memberId: virtualAccount.memberId,
              amount,
              monnifyTxnRef: monnifyRef,
              narration: eventData.paymentDescription || 'Webhook deposit',
              status: 'confirmed',
            },
          });
          await computeScore(virtualAccount.memberId);
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/webhooks/simulate:
 *   post:
 *     tags: [Webhooks]
 *     summary: Simulate a member contribution (sandbox/demo)
 *     description: |
 *       **For judges and sandbox testing only.**
 *       Directly creates a Contribution record and recomputes the member's score
 *       without going through Monnify. Equivalent to what happens when a real
 *       `SUCCESSFUL_TRANSACTION` webhook fires.
 *       Use this to demonstrate the score updating live during your demo video.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SimulateRequest'
 *           examples:
 *             basic:
 *               summary: Simulate ₦5,000 contribution
 *               value: { memberId: "clx...", amount: 5000 }
 *     responses:
 *       200:
 *         description: Contribution recorded + updated score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     contribution: { $ref: '#/components/schemas/Contribution' }
 *                     score: { $ref: '#/components/schemas/Score' }
 *       400:
 *         description: memberId or amount missing
 *       404:
 *         description: Member not found
 */
router.post('/simulate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let body: any;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf8'));
    } else {
      body = req.body;
    }

    const { memberId, amount, reference } = body;

    if (!memberId || !amount) {
      return res.status(400).json({ success: false, error: 'memberId and amount are required' });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const monnifyRef = reference || `sim-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const contribution = await prisma.contribution.create({
      data: {
        memberId,
        amount: parseFloat(amount),
        monnifyTxnRef: monnifyRef,
        narration: 'Simulated contribution (demo)',
        status: 'confirmed',
      },
    });

    const score = await computeScore(memberId);

    res.json({ success: true, data: { contribution, score } });
  } catch (error) {
    next(error);
  }
});

export default router;
