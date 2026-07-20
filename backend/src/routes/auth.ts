import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signToken } from '../lib/jwt';

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin or member login
 *     description: Authenticates a user by phone + password and returns a signed JWT valid for 7 days.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Admin login
 *               value: { phone: "08000000001", password: "admin123" }
 *             member:
 *               summary: Member login
 *               value: { phone: "08000000002", password: "member123" }
 *     responses:
 *       200:
 *         description: Login successful — returns JWT + user info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid phone or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid phone or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid phone or password' });
    }

    const token = signToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    next(error);
  }
});

export default router;
