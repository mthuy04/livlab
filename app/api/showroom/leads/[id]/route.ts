import { NextResponse } from 'next/server';
import { LeadStage } from '@prisma/client';
import { getLeadDetail } from '@/lib/showroom/showroomRepository';
import { changeStage, assignLead } from '@/lib/showroom/leadStageService';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const { id } = await params;
    const lead = await getLeadDetail(id, ctx.showroomId);
    if (!lead) return NextResponse.json({ error: 'Không tìm thấy lead.' }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    return handleShowroomError(error);
  }
}

/**
 * Stage and assignment only, each validated and each routed through its
 * service. The services own the dual status/stage rule and the assignee
 * tenancy check — a route that wrote these columns directly would bypass both.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const { id } = await params;
    const body = await request.json();

    if (body?.stage !== undefined) {
      if (!Object.values(LeadStage).includes(body.stage)) {
        return NextResponse.json({ error: 'Giai đoạn không hợp lệ.' }, { status: 400 });
      }
      await changeStage({
        leadId: id,
        showroomId: ctx.showroomId,
        toStage: body.stage,
        createdById: ctx.user.id,
        reason: typeof body.reason === 'string' ? body.reason : null,
      });
    }

    if (body?.assignedToId !== undefined) {
      await assignLead({
        leadId: id,
        showroomId: ctx.showroomId,
        assignedToId: typeof body.assignedToId === 'string' ? body.assignedToId : null,
      });
    }

    const lead = await getLeadDetail(id, ctx.showroomId);
    return NextResponse.json({ lead });
  } catch (error) {
    return handleShowroomError(error);
  }
}
