import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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

        // Ensure AdminUser table exists (shared DB)
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "AdminUser" (
              "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
              "email" TEXT NOT NULL,
              "name" TEXT,
              "passwordHash" TEXT NOT NULL,
              "role" TEXT NOT NULL DEFAULT 'admin',
              "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
              "twoFactorSecret" TEXT,
              "lastLoginAt" TIMESTAMP(3),
              "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
              "lockedUntil" TIMESTAMP(3),
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL,
              CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");
          `);
        } catch (e) {
          console.error('[Auth] Table creation error:', e);
        }

        // Auto-create admin user if none exists
        const userCount = await prisma.adminUser.count();
        if (userCount === 0) {
          const passwordHash = await bcrypt.hash('admin123', 12);
          await prisma.adminUser.create({
            data: {
              email: 'admin@profitwalla.com',
              name: 'Admin',
              passwordHash,
              role: 'admin',
            },
          });
        }

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account locked. Try again later.');
        }

        if (!await bcrypt.compare(credentials.password, user.passwordHash)) {
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const lockedUntil = failedAttempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null;

          await prisma.adminUser.update({
            where: { id: user.id },
            data: { failedLoginAttempts: failedAttempts, lockedUntil },
          });

          if (failedAttempts >= 5) {
            throw new Error('Account locked due to too many failed attempts.');
          }
          return null;
        }

        await prisma.adminUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
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
  session: { strategy: 'jwt' },
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
