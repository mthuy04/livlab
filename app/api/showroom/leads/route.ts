import { NextResponse } from 'next/server';
import { LeadStage, LeadRequestType } from '@prisma/client';
import { listLeads } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

/**
 * The showroom's lead inbox.
 *
 * Scoped to the session's showroom. Replaces the previous response shape,
 * which flattened everything into display strings and dropped the LivLab
 * context the workspace now shows.
 */
export async function GET(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;

  try {
    const params = new URL(request.url).searchParams;
    const stage = params.get('stage');
    const requestType = params.get('requestType');

    const result = await listLeads({
      showroomId: ctx.showroomId,
      stage: stage && Object.values(LeadStage).includes(stage as LeadStage) ? (stage as LeadStage) : null,
      requestType:
        requestType && Object.values(LeadRequestType).includes(requestType as LeadRequestType)
          ? (requestType as LeadRequestType)
          : null,
      search: params.get('q'),
      take: Math.min(Number(params.get('take')) || 50, 200),
      skip: Math.max(Number(params.get('skip')) || 0, 0),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleShowroomError(error);
  }
}
