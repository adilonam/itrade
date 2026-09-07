import bcrypt from 'bcryptjs';
import { DEFAULT_USER_BALANCE_SEED } from '@/lib/balance';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function normalizePhone(phone: unknown): string | null {
  if (typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();
    const normalizedPhone = normalizePhone(phone);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: normalizedPhone,
        balances: {
          create: [...DEFAULT_USER_BALANCE_SEED]
        }
      }
    });

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
