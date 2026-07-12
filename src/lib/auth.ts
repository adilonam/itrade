import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { DEFAULT_USER_BALANCE_SEED } from './balance';
import { prisma } from './prisma';
import { getProfileImageUrl } from './profile-image';

const sharedCallbacks: NextAuthOptions['callbacks'] = {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      if (user.image) token.image = user.image;
    }

    if (token.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          role: true,
          leverage: true,
          image: true,
          profileImageContentType: true,
          balances: {
            select: { type: true, amount: true }
          }
        }
      });

      if (dbUser) {
        const selectedBalance = dbUser.balances.find(
          (balance) => balance.type === 'REAL'
        );
        token.role = dbUser.role;
        token.balance = selectedBalance?.amount ?? 0;
        token.leverage = dbUser.leverage;
        token.image = getProfileImageUrl({
          id: token.id as string,
          ...dbUser
        });
      }
    }

    return token;
  },
  async session({ session, token }) {
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.role = (token.role as string) || 'USER';
      session.user.balance = (token.balance as number) || 0;
      session.user.leverage = (token.leverage as number) || 1;
      session.user.image = (token.image as string | null) ?? null;
    }
    return session;
  }
};

export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const providers: NextAuthOptions['providers'] = [
    CredentialsProvider({
      id: 'mfa',
      name: 'MFA',
      credentials: {
        token: { label: 'Token', type: 'text' },
        code: { label: 'Code', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.token || !credentials?.code) {
          return null;
        }

        const challenge = await prisma.mfaChallenge.findUnique({
          where: { token: credentials.token },
          include: { user: true }
        });

        if (!challenge) {
          return null;
        }

        if (challenge.expiresAt < new Date()) {
          await prisma.mfaChallenge.delete({ where: { id: challenge.id } });
          return null;
        }

        if (challenge.used) {
          return null;
        }

        if (challenge.code !== credentials.code) {
          return null;
        }

        await prisma.$transaction([
          prisma.mfaChallenge.update({
            where: { id: challenge.id },
            data: { used: true }
          }),
          prisma.user.update({
            where: { id: challenge.user.id },
            data: { emailVerified: new Date() }
          })
        ]);

        return {
          id: challenge.user.id,
          email: challenge.user.email,
          name: challenge.user.name,
          image: getProfileImageUrl(challenge.user)
        };
      }
    })
  ];

  const gid = process.env.GOOGLE_CLIENT_ID?.trim();
  const gsec = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (gid && gsec) {
    providers.unshift(
      GoogleProvider({
        clientId: gid,
        clientSecret: gsec
      })
    );
  }

  return {
    adapter: PrismaAdapter(prisma),
    providers,
    session: {
      strategy: 'jwt'
    },
    pages: {
      signIn: '/auth/sign-in'
    },
    callbacks: sharedCallbacks,
    events: {
      async createUser({ user }) {
        if (!user?.id) return;

        await prisma.userBalance.createMany({
          data: DEFAULT_USER_BALANCE_SEED.map((balance) => ({
            userId: user.id,
            ...balance
          })),
          skipDuplicates: true
        });
      }
    },
    secret: process.env.NEXTAUTH_SECRET
  };
}

export async function getAuthSession() {
  return getServerSession(await buildAuthOptions());
}
