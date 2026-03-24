import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { put } from '@vercel/blob';
import type { Prisma } from '@/lib/prisma/generated/client';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { parseBalanceType } from '@/lib/balance';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balanceType = parseBalanceType(
      request.nextUrl.searchParams.get('balanceType')
    );
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: { select: { provider: true, providerAccountId: true } },
        balances: {
          where: { type: balanceType },
          select: { amount: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      balance: user.balances[0]?.amount ?? 0,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      postalCode: user.postalCode,
      city: user.city,
      country: user.country,
      gender: user.gender,
      kycStatus: user.kycStatus,
      kycDocumentType: user.kycDocumentType,
      kycFrontImageUrl: user.kycFrontImageUrl,
      kycBackImageUrl: user.kycBackImageUrl,
      kycSelfieUrl: user.kycSelfieUrl,
      kycUtilityBillUrl: user.kycUtilityBillUrl,
      accounts: user.accounts,
      hasPassword: !!user.password
    };

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return NextResponse.json({
        error: 'JSON profile updates are not supported'
      }, { status: 400 });
    }

    const formData = await request.formData();
    const section = (formData.get('section') as string | null) ?? 'profile';

    const firstName = formData.get('firstName') as string | null;
    const lastName = formData.get('lastName') as string | null;
    const name = formData.get('name') as string | null;
    const imageFile = formData.get('image') as File | null;
    const phone = formData.get('phone') as string | null;
    const address = formData.get('address') as string | null;
    const postalCode = formData.get('postalCode') as string | null;
    const city = formData.get('city') as string | null;
    const country = formData.get('country') as string | null;
    const gender = formData.get('gender') as string | null;

    let imageLink: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `profile-${session.user.id}-${Date.now()}.${ext}`;
      const blob = await put(filename, imageFile, {
        access: 'public',
        addRandomSuffix: true
      });
      imageLink = blob.url;
    }

    let resolvedName: string | null | undefined;
    if (firstName != null || lastName != null) {
      resolvedName = [firstName, lastName]
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
      resolvedName = resolvedName.length > 0 ? resolvedName : null;
    } else if (name != null) {
      resolvedName = name.trim() || null;
    }

    const data: Prisma.UserUpdateInput = {};

    if (section === 'profile') {
      if (resolvedName !== undefined) {
        data.name = resolvedName;
      }
      if (imageLink) {
        data.image = imageLink;
      }
      if (phone !== null) {
        data.phone = phone || null;
      }
      if (formData.has('dateOfBirth')) {
        const raw = formData.get('dateOfBirth') as string | null;
        data.dateOfBirth =
          raw && raw.trim() !== '' ? new Date(raw) : null;
      }
      if (gender !== null) {
        data.gender = gender || null;
      }
    } else if (section === 'address') {
      if (address !== null) {
        data.address = address || null;
      }
      if (postalCode !== null) {
        data.postalCode = postalCode || null;
      }
      if (city !== null) {
        data.city = city || null;
      }
      if (country !== null) {
        data.country = country || null;
      }
    }

    if (Object.keys(data).length === 0) {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      if (!existing) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          image: existing.image,
          phone: existing.phone,
          dateOfBirth: existing.dateOfBirth,
          address: existing.address,
          postalCode: existing.postalCode,
          city: existing.city,
          country: existing.country,
          gender: existing.gender
        }
      });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      postalCode: user.postalCode,
      city: user.city,
      country: user.country,
      gender: user.gender
    };
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
