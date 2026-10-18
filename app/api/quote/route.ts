import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import {
  createPublicQuoteRequest,
  PublicQuoteError,
  type PublicQuoteBody,
} from '@/lib/showroom/publicQuoteService';
import { isMissingSchemaError } from '@/lib/showroom/guards';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PublicQuoteBody;
    const tenant = await resolveTenant();
    const lead = await createPublicQuoteRequest(
      tenant,
      body,
      request.headers.get('idempotency-key')
    );
    return NextResponse.json(
      { success: true, requestCode: lead.requestCode, lead: { id: lead.id, requestCode: lead.requestCode } },
      { status: lead.duplicate ? 200 : 201, headers: { 'cache-control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof PublicQuoteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (isMissingSchemaError(error)) {
      return NextResponse.json(
        { error: 'Hệ thống tiếp nhận yêu cầu đang được nâng cấp.', code: 'MIGRATION_PENDING' },
        { status: 503 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[quote] database error', error.code);
    } else {
      console.error('[quote] unexpected error', error);
    }
    return NextResponse.json({ error: 'Chưa thể gửi yêu cầu. Vui lòng thử lại.' }, { status: 500 });
  }
}
