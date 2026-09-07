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
      name: 'Staff Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Ensure StaffUser table exists (shared DB)
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "StaffUser" (
              "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
              "email" TEXT NOT NULL,
              "name" TEXT,
              "passwordHash" TEXT NOT NULL,
              "role" TEXT NOT NULL DEFAULT 'staff',
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL,
              CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
            );
          `);
          await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "StaffUser_email_key" ON "StaffUser"("email");
          `);
        } catch (e) {
          console.error('[Auth] Table creation error:', e);
        }

        // Auto-create staff user if none exists
        const userCount = await prisma.staffUser.count();
        if (userCount === 0) {
          const passwordHash = await bcrypt.hash('staff123', 12);
          await prisma.staffUser.create({
            data: {
              email: 'staff@copytrading.local',
              name: 'Staff',
              passwordHash,
              role: 'staff',
            },
          });
        }

        const user = await prisma.staffUser.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        if (!await bcrypt.compare(credentials.password, user.passwordHash)) return null;

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
    signIn: '/staff/login',
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
