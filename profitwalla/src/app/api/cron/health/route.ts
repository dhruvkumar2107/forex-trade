import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    success: true,
    message: 'Health checks are handled by the copytrading service.',
    timestamp: new Date().toISOString(),
  });
}
