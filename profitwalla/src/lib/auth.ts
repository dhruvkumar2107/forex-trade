import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      role: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Constant-time comparison to prevent user enumeration
          await bcrypt.hash('dummy', 12);
          return null;
        }

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          console.warn(`[Auth] Account locked: ${credentials.email}`);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          const attempts = (user.failedLoginAttempts || 0) + 1;
          const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_DURATION_MS)
            : null;

          await prisma.adminUser.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts, lockedUntil: lockUntil },
          });

          if (lockUntil) {
            console.warn(`[Auth] Account locked after ${attempts} failed attempts: ${credentials.email}`);
          }
          return null;
        }

        // Successful login — reset failed attempts
        await prisma.adminUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 hours
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
