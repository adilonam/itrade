import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
