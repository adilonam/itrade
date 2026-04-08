import { getBlobPutOptions } from '@/lib/blob-upload';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const DOC_TYPES = ['passport', 'national_id', 'drivers_license'] as const;

async function uploadKycFile(userId: string, label: string, ts: number, file: File) {
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `kyc-${userId}-${label}-${ts}.${ext}`;
  const blobOpts = await getBlobPutOptions();
  const blob = await put(filename, file, {
    access: 'private',
    addRandomSuffix: true,
    ...blobOpts
  });
  return blob.url;
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kycStatus: true,
        kycDocumentType: true,
        kycFrontImageUrl: true,
        kycBackImageUrl: true,
        kycSelfieUrl: true,
        kycUtilityBillUrl: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requests = await prisma.kycVerificationRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        documentType: true,
        createdAt: true,
        reviewedAt: true
      }
    });

    return NextResponse.json({
      kycStatus: user.kycStatus,
      kycDocumentType: user.kycDocumentType,
      hasFront: !!user.kycFrontImageUrl,
      hasBack: !!user.kycBackImageUrl,
      hasSelfie: !!user.kycSelfieUrl,
      hasUtilityBill: !!user.kycUtilityBillUrl,
      requests
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load KYC status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existing.kycStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'Your documents are already under review.' },
        { status: 400 }
      );
    }

    if (existing.kycStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Your identity is already verified.' },
        { status: 400 }
      );
    }

    const activeRequest = await prisma.kycVerificationRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      select: { id: true }
    });

    if (activeRequest) {
      return NextResponse.json(
        { error: 'A verification request is already in progress.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const documentType = formData.get('documentType') as string | null;
    const front = formData.get('front') as File | null;
    const back = formData.get('back') as File | null;
    const selfie = formData.get('selfie') as File | null;
    const utilityBill = formData.get('utilityBill') as File | null;

    if (
      !documentType ||
      !DOC_TYPES.includes(documentType as (typeof DOC_TYPES)[number])
    ) {
      return NextResponse.json(
        { error: 'Select a valid document type.' },
        { status: 400 }
      );
    }

    if (!front?.size || !back?.size || !selfie?.size) {
      return NextResponse.json(
        { error: 'Front, back, and selfie images are required.' },
        { status: 400 }
      );
    }

    if (!utilityBill?.size) {
      return NextResponse.json(
        { error: 'A proof of address (utility bill) is required.' },
        { status: 400 }
      );
    }

    const uid = session.user.id;
    const ts = Date.now();

    const [frontUrl, backUrl, selfieUrl, billUrl] = await Promise.all([
      uploadKycFile(uid, 'front', ts, front),
      uploadKycFile(uid, 'back', ts, back),
      uploadKycFile(uid, 'selfie', ts, selfie),
      uploadKycFile(uid, 'utility', ts, utilityBill)
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          kycDocumentType: documentType,
          kycFrontImageUrl: frontUrl,
          kycBackImageUrl: backUrl,
          kycSelfieUrl: selfieUrl,
          kycUtilityBillUrl: billUrl,
          kycStatus: 'PENDING'
        }
      });

      await tx.kycVerificationRequest.create({
        data: {
          userId: session.user.id,
          documentType,
          status: 'PENDING',
          documents: {
            create: [
              { kind: 'FRONT', fileUrl: frontUrl },
              { kind: 'BACK', fileUrl: backUrl },
              { kind: 'SELFIE', fileUrl: selfieUrl },
              { kind: 'UTILITY_BILL', fileUrl: billUrl }
            ]
          }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit KYC documents' },
      { status: 500 }
    );
  }
}
