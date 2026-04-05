import {
  getPublicSettingValue,
  isPublicAppSettingLabel,
  pickPublicAppSettings
} from '@/lib/app-settings';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const label = request.nextUrl.searchParams.get('label');
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' }
    });

    if (label) {
      if (!isPublicAppSettingLabel(label)) {
        return NextResponse.json(
          { error: 'Unknown label or label is not public.' },
          { status: 400 }
        );
      }
      const value = getPublicSettingValue(settings, label);
      return NextResponse.json({ label, value });
    }

    return NextResponse.json(pickPublicAppSettings(settings));
  } catch {
    return NextResponse.json(pickPublicAppSettings(null), { status: 200 });
  }
}
