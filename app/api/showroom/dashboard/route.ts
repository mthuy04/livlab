import { NextResponse } from 'next/server';
import { getDashboard } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const requested = Number(new URL(request.url).searchParams.get('days'));
    const days = [7, 30, 90].includes(requested) ? requested : 30;
    return NextResponse.json(await getDashboard(ctx.showroomId, days));
  } catch (error) {
    return handleShowroomError(error);
  }
}
