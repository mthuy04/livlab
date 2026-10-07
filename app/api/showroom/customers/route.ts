import { NextResponse } from 'next/server';
import { listCustomers } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    return NextResponse.json({ customers: await listCustomers(ctx.showroomId) });
  } catch (error) { return handleShowroomError(error); }
}
