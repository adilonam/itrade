import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'node:crypto';

const RESET_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a reset link.' },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    const result = await sendPasswordResetEmail(
      user.email,
      resetLink,
      user.name ?? undefined
    );

    if (!result.success) {
      await prisma.passwordResetToken.deleteMany({
        where: { token }
      });
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a reset link.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
