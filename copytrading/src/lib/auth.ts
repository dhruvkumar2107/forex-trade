import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

declare module 'next-auth' {
  interface User {
    role?: string;
    permissions?: string[];
  }
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      role: string;
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    permissions?: string[];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Staff Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.staffUser.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Constant-time comparison to prevent user enumeration
          await bcrypt.hash('dummy', 12);
          return null;
        }

        if (!user.isActive) return null;

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          console.warn(`[Auth] Account locked: ${credentials.email}`);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1;
          const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_DURATION_MS)
            : null;

          await prisma.staffUser.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: lockUntil,
            },
          });

          if (lockUntil) {
            console.warn(`[Auth] Account locked after ${attempts} failed attempts: ${credentials.email}`);
          }
          return null;
        }

        // Successful login — reset failed attempts
        await prisma.staffUser.update({
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
          permissions: user.permissions,
        };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 hours
  pages: {
    signIn: '/staff/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.permissions = (user as unknown as { permissions: string[] }).permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.permissions = (token.permissions as string[]) || [];
      }
      return session;
    },
  },
};
