import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyWebhookSignature } from '../services/monnify';
import { calculateMemberScore } from '../services/scoring';

const router = Router();

router.post('/monnify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = req.body.toString('utf8');
    const signature = req.headers['monnify-signature'] as string;
    const secretKey = process.env.MONNIFY_SECRET_KEY || '';

    if (!signature || !verifyWebhookSignature(rawBody, signature, secretKey)) {
      return res.status(401).send('Unauthorized: Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    const { eventType, eventData } = payload;
    const monnifyRef = eventData.transactionReference;

    const existingLog = await prisma.webhookLog.findUnique({
      where: { monnifyRef }
    });

    if (existingLog) {
      return res.status(200).send('OK'); // Idempotency
    }

    await prisma.webhookLog.create({
      data: {
        monnifyRef,
        eventType,
        payloadJson: rawBody
      }
    });

    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      const accountNumber = eventData.destinationAccountInformation?.accountNumber || eventData.product?.reference;
      
      if (accountNumber) {
        const virtualAccount = await prisma.virtualAccount.findFirst({
          where: { accountNumber }
        });

        if (virtualAccount) {
          const amount = parseFloat(eventData.amountPaid);
          
          await prisma.contribution.create({
            data: {
              memberId: virtualAccount.memberId,
              amount,
              monnifyTxnRef: monnifyRef,
              narration: eventData.paymentDescription || 'Webhook deposit',
              status: 'confirmed'
            }
          });

          // Recompute score
          await calculateMemberScore(virtualAccount.memberId);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    next(error);
  }
});

// For sandbox simulation
router.post('/simulate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In simulate, the body is usually JSON because it might not hit the raw body middleware if not configured well for this specific path. 
    // Since we used raw body on the whole /api/webhooks, we need to handle it.
    let body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf8'));
    } else {
      body = req.body;
    }

    const { memberId, amount, reference } = body;
    
    if (!memberId || !amount) {
      return res.status(400).json({ success: false, error: 'memberId and amount are required' });
    }

    const monnifyRef = reference || \`sim-\${Date.now()}\`;

    const contribution = await prisma.contribution.create({
      data: {
        memberId,
        amount: parseFloat(amount),
        monnifyTxnRef: monnifyRef,
        narration: 'Simulated contribution',
        status: 'confirmed'
      }
    });

    const score = await calculateMemberScore(memberId);

    res.json({ success: true, data: { contribution, score } });
  } catch (error) {
    next(error);
  }
});

export default router;
