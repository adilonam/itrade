import { buildAuthOptions } from '@/lib/auth';
import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return NextAuth(req, context, await buildAuthOptions());
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return NextAuth(req, context, await buildAuthOptions());
}
