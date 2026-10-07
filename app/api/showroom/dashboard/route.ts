import { NextResponse } from 'next/server';
import { getDashboard } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    return NextResponse.json(await getDashboard(ctx.showroomId));
  } catch (error) {
    return handleShowroomError(error);
  }
}
