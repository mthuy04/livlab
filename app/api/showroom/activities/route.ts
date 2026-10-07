import { NextResponse } from 'next/server';
import { LeadActivityType } from '@prisma/client';
import { logActivity, completeActivity } from '@/lib/showroom/leadActivityService';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

/** Adds a timeline entry or schedules a follow-up. */
export async function POST(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const body = await request.json();

    if (typeof body?.leadId !== 'string') {
      return NextResponse.json({ error: 'Thiếu lead.' }, { status: 400 });
    }
    if (!Object.values(LeadActivityType).includes(body?.type)) {
      return NextResponse.json({ error: 'Loại hoạt động không hợp lệ.' }, { status: 400 });
    }

    const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: 'Thời gian không hợp lệ.' }, { status: 400 });
    }

    const activity = await logActivity({
      leadId: body.leadId,
      // From the session, never the payload.
      showroomId: ctx.showroomId,
      type: body.type,
      body: typeof body.body === 'string' ? body.body : null,
      dueAt,
      createdById: ctx.user.id,
    });
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return handleShowroomError(error);
  }
}

/** Marks a scheduled action done; the service re-points the lead at what is next. */
export async function PATCH(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const body = await request.json();
    if (typeof body?.activityId !== 'string') {
      return NextResponse.json({ error: 'Thiếu hoạt động.' }, { status: 400 });
    }
    const activity = await completeActivity(body.activityId, ctx.showroomId);
    return NextResponse.json({ activity });
  } catch (error) {
    return handleShowroomError(error);
  }
}
