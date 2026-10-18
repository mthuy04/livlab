import { NextResponse } from 'next/server';
import { getDashboard } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const rawDays = new URL(request.url).searchParams.get('days');
    const requested = rawDays === null ? 30 : Number(rawDays);
    const days = [0, 7, 30, 90].includes(requested) ? requested : 30;
    return NextResponse.json(await getDashboard(ctx.showroomId, days));
  } catch (error) {
    return handleShowroomError(error);
  }
}
