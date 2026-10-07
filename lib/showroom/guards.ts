import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionUser } from '@/lib/auth/session';

/**
 * Cross-tenant invariants the database cannot enforce.
 *
 * A foreign key guarantees a row points at something real — not at something
 * this caller may touch. `Quote.showroomId` referencing a showroom says nothing
 * about whether it is the SAME showroom as the lead it quotes. Those rules live
 * here and every write goes through them.
 */

export class ShowroomAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShowroomAccessError';
  }
}

/**
 * Thrown when the Workspace V2 tables are not in the database yet.
 *
 * The migration is applied by hand (see db/migrations/README.md), so a Preview
 * can legitimately run this code against a database that predates it. Callers
 * turn this into a stated "migration chưa chạy" message instead of a 500 that
 * looks like a bug.
 */
export class MigrationPendingError extends Error {
  constructor(message = 'Showroom Workspace V2 cần chạy migration cơ sở dữ liệu.') {
    super(message);
    this.name = 'MigrationPendingError';
  }
}

/** P2021: table does not exist. P2022: column does not exist. */
export function isMissingSchemaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2022')
  );
}

/** Runs `fn`, converting a missing-table error into MigrationPendingError. */
export async function withSchemaGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isMissingSchemaError(error)) throw new MigrationPendingError();
    throw error;
  }
}

/**
 * The showroom this user acts as.
 *
 * An ADMIN has no showroom of their own, so they must name one explicitly
 * rather than silently acting as whichever showroom happens to be first.
 */
export function requireShowroomId(user: SessionUser, explicit?: string | null): string {
  if (user.role === 'ADMIN') {
    const id = explicit ?? user.showroomId;
    if (!id) throw new ShowroomAccessError('Cần chỉ định showroom.');
    return id;
  }
  if (!user.showroomId) {
    throw new ShowroomAccessError('Tài khoản chưa được gán showroom.');
  }
  // A showroom user may never act for another showroom, whatever the payload says.
  if (explicit && explicit !== user.showroomId) {
    throw new ShowroomAccessError('Không thể thao tác trên showroom khác.');
  }
  return user.showroomId;
}

/** Loads a lead and proves it belongs to `showroomId`. */
export async function requireOwnedLead(leadId: string, showroomId: string) {
  const lead = await prisma.quoteLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ShowroomAccessError('Không tìm thấy lead.');
  if (lead.showroomId !== showroomId) {
    throw new ShowroomAccessError('Lead này không thuộc showroom của bạn.');
  }
  return lead;
}

/**
 * Proves an assignee is a real user of THIS showroom.
 *
 * Without this, assignedToId would accept any user id in the system — the
 * foreign key only checks the user exists.
 */
export async function requireShowroomMember(
  userId: string | null | undefined,
  showroomId: string
): Promise<string | null> {
  if (!userId) return null;
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, showroomId: true },
  });
  if (!member) throw new ShowroomAccessError('Không tìm thấy nhân viên được giao.');
  if (member.role === 'ADMIN') return member.id;
  if (member.showroomId !== showroomId) {
    throw new ShowroomAccessError('Nhân viên này không thuộc showroom của bạn.');
  }
  return member.id;
}
