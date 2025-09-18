import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  sendMfaVerificationEmail,
  cleanupExpiredMfaChallenges
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate MFA code and token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing unused challenges for this user
    await prisma.mfaChallenge.deleteMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { lt: new Date() }
      }
    });

    // Clean up all expired challenges
    await cleanupExpiredMfaChallenges();

    // Create new MFA challenge
    await prisma.mfaChallenge.create({
      data: {
        userId: user.id,
        token,
        code,
        expiresAt
      }
    });

    // Send MFA email
    const emailResult = await sendMfaVerificationEmail(
      user.email,
      code,
      user.name || undefined
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.log('MFA login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
