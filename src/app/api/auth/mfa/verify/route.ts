import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Verify MFA code
 *     description: Verifies the MFA code sent to user's email and completes the authentication process
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - code
 *             properties:
 *               token:
 *                 type: string
 *                 description: MFA challenge token received from login endpoint
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               code:
 *                 type: string
 *                 description: 6-digit verification code sent to user's email
 *                 example: "123456"
 *                 pattern: "^[0-9]{6}$"
 *     responses:
 *       200:
 *         description: MFA verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   description: User information for NextAuth
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user123"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Doe"
 *                     image:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/avatar.jpg"
 *                 token:
 *                   type: string
 *                   description: Verification token proof for NextAuth
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token and code are required"
 *       401:
 *         description: Unauthorized - invalid, expired, or already used verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     invalid_token:
 *                       value: "Invalid or expired verification code"
 *                     expired_code:
 *                       value: "Verification code has expired"
 *                     used_code:
 *                       value: "Verification code has already been used"
 *                     invalid_code:
 *                       value: "Invalid verification code"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
export async function POST(request: NextRequest) {
  try {
    const { token, code } = await request.json();

    if (!token || !code) {
      return NextResponse.json(
        { error: 'Token and code are required' },
        { status: 400 }
      );
    }

    // Find the MFA challenge
    const challenge = await prisma.mfaChallenge.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      );
    }

    // Check if challenge is expired
    if (challenge.expiresAt < new Date()) {
      await prisma.mfaChallenge.delete({ where: { id: challenge.id } });
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 401 }
      );
    }

    // Check if challenge is already used
    if (challenge.used) {
      return NextResponse.json(
        { error: 'Verification code has already been used' },
        { status: 401 }
      );
    }

    // Verify the code
    if (challenge.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    // Mark challenge as used
    await prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { used: true }
    });

    // Return success with user info for NextAuth
    return NextResponse.json({
      success: true,
      user: {
        id: challenge.user.id,
        email: challenge.user.email,
        name: challenge.user.name,
        image: challenge.user.image
      },
      token // This will be used as proof in NextAuth
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
