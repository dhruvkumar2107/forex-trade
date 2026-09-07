import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith('/admin')) return !!token;
      if (req.nextUrl.pathname.startsWith('/ct/staff') || req.nextUrl.pathname.startsWith('/ct/dashboard')) return !!token;
      return true;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
});

export const config = {
  matcher: ['/admin/:path*', '/ct/staff/:path*', '/ct/dashboard/:path*'],
};
