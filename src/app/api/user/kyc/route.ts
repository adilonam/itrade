import { getAuthSession } from '@/lib/auth';
import { fileToKycPayload } from '@/lib/kyc-file';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const DOC_TYPES = ['passport', 'national_id', 'drivers_license'] as const;

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
        kycDocumentType: true
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

    const [frontFile, backFile, selfieFile, billFile] = await Promise.all([
      fileToKycPayload(front),
      fileToKycPayload(back),
      fileToKycPayload(selfie),
      fileToKycPayload(utilityBill)
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          kycDocumentType: documentType,
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
              {
                kind: 'FRONT',
                fileContent: frontFile.fileContent,
                contentType: frontFile.contentType,
                fileName: frontFile.fileName
              },
              {
                kind: 'BACK',
                fileContent: backFile.fileContent,
                contentType: backFile.contentType,
                fileName: backFile.fileName
              },
              {
                kind: 'SELFIE',
                fileContent: selfieFile.fileContent,
                contentType: selfieFile.contentType,
                fileName: selfieFile.fileName
              },
              {
                kind: 'UTILITY_BILL',
                fileContent: billFile.fileContent,
                contentType: billFile.contentType,
                fileName: billFile.fileName
              }
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
