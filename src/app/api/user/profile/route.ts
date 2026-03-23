import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { put } from '@vercel/blob';
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
    const name = formData.get('name') as string | null;
    const imageFile = formData.get('image') as File | null;
    const phone = formData.get('phone') as string | null;
    const dateOfBirthRaw = formData.get('dateOfBirth') as string | null;
    const address = formData.get('address') as string | null;
    const postalCode = formData.get('postalCode') as string | null;
    const city = formData.get('city') as string | null;

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

    const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : undefined;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name != null && { name: name || null }),
        ...(imageLink && { image: imageLink }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(address !== undefined && { address: address || null }),
        ...(postalCode !== undefined && { postalCode: postalCode || null }),
        ...(city !== undefined && { city: city || null })
      }
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
      city: user.city
    };
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
