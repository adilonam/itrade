import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize() {
        // This provider is only used to initiate MFA flow
        // It should never actually authenticate the user
        return null;
      }
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

        // Mark challenge as used
        await prisma.mfaChallenge.update({
          where: { id: challenge.id },
          data: { used: true }
        });

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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
