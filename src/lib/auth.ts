import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
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

        // Find the MFA challenge
        const challenge = await prisma.mfaChallenge.findUnique({
          where: { token: credentials.token },
          include: { user: true }
        });

        if (!challenge) {
          return null;
        }

        // Check if challenge is expired
        if (challenge.expiresAt < new Date()) {
          await prisma.mfaChallenge.delete({ where: { id: challenge.id } });
          return null;
        }

        // Check if challenge is already used
        if (challenge.used) {
          return null;
        }

        // Verify the code
        if (challenge.code !== credentials.code) {
          return null;
        }

        // Mark challenge as used and verify user's email
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
          image: challenge.user.image
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/sign-in'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.image) token.image = user.image;
      }

      // Fetch user data from database and add to token
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            leverage: true,
            image: true,
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
          token.image = dbUser.image ?? token.image;
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
        session.user.image = (token.image as string) ?? session.user.image;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      if (!user?.id) return;

      await prisma.userBalance.createMany({
        data: [
          { userId: user.id, type: 'REAL', amount: 0 },
          { userId: user.id, type: 'DEMO', amount: 10000 },
          { userId: user.id, type: 'INSTITUTIONAL', amount: 0 },
        ],
        skipDuplicates: true
      });
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
