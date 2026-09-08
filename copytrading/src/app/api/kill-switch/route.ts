import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized, apiForbidden } from '@/lib/api';
import { killSwitch } from '@/lib/kill-switch';
import { activateKillSwitchSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const status = await killSwitch.getStatus();
    return apiSuccess(status);
  } catch (error) {
    console.error('[Kill Switch GET Error]', error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    if (!session.user.permissions?.includes('EMERGENCY_STOP')) {
      return apiForbidden();
    }

    const body = await request.json();
    const parsed = activateKillSwitchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    await killSwitch.activate(
      {
        name: parsed.data.name,
        description: parsed.data.description,
        scope: parsed.data.scope,
        targetClientId: parsed.data.targetClientId,
        targetSymbol: parsed.data.targetSymbol,
        targetStrategy: parsed.data.targetStrategy,
        activatedBy: session.user.id,
        reason: parsed.data.reason,
      },
      session.user.role,
    );

    const status = await killSwitch.getStatus();
    return apiSuccess({
      message: `Kill switch "${parsed.data.name}" activated`,
      status,
    });
  } catch (error) {
    console.error('[Kill Switch POST Error]', error);
    const message = error instanceof Error ? error.message : 'Failed to activate kill switch';
    return apiError(message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    if (!session.user.permissions?.includes('EMERGENCY_STOP')) {
      return apiForbidden();
    }

    const body = await request.json();
    const { name, reason } = body as { name: string; reason: string };

    if (!name || !reason) {
      return apiError('name and reason are required');
    }

    await killSwitch.deactivate(name, session.user.id, reason, session.user.role);

    const status = await killSwitch.getStatus();
    return apiSuccess({
      message: `Kill switch "${name}" deactivated`,
      status,
    });
  } catch (error) {
    console.error('[Kill Switch DELETE Error]', error);
    const message = error instanceof Error ? error.message : 'Failed to deactivate kill switch';
    return apiError(message);
  }
}
