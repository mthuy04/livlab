/**
 * Recognising internal test records without deleting them.
 *
 * The shared database holds rows created by QA — `[QA TEST - xoa duoc] Claude`
 * and `DEMO Showroom V2` among them. They sit in the partner's lead list
 * between real customers, which costs the workspace its credibility the moment
 * a showroom owner looks at it.
 *
 * Deleting them is not this layer's call: they live in a database other people
 * and other environments share, and "xoa duoc" is someone's note to themselves,
 * not an instruction to us. So they are recognised, hidden from the operational
 * views by default, and counted honestly — with a control to show them, because
 * a hidden row a QA engineer is looking for is its own kind of bug.
 *
 * Matching is deliberately narrow. Every rule below keys on a marker a person
 * deliberately typed; nothing infers "looks like a test" from shape, because a
 * real customer called Demo with a round phone number must never disappear.
 */

/** Explicit markers someone wrote into the record on purpose. */
const NAME_MARKERS = [
  /\bqa\s*test\b/i,
  /\[\s*test\b/i,
  /\bdemo\b.*\bv\d\b/i,
  /\btest\s*lead\b/i,
  /\bxoa\s*duoc\b/i,
  /\bxoá\s*được\b/i,
];

/**
 * The reserved test range. 0900000xxx is not an allocated Vietnamese mobile
 * prefix, so no real customer can be reached on one — which is presumably why
 * QA picked it.
 */
const TEST_PHONE = /^0?90{6}\d{0,3}$/;

export interface TestRecordCandidate {
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export function isTestRecord(record: TestRecordCandidate): boolean {
  const name = (record.customerName ?? '').trim();
  if (name && NAME_MARKERS.some((re) => re.test(name))) return true;

  const phone = (record.phone ?? '').replace(/[\s.-]/g, '');
  if (phone && TEST_PHONE.test(phone)) return true;

  const email = (record.email ?? '').toLowerCase();
  if (email && (email.endsWith('@example.com') || email.includes('+qatest@'))) return true;

  return false;
}

/** Why a record was classified as a test, for the dev-facing explanation. */
export function testRecordReason(record: TestRecordCandidate): string | null {
  const name = (record.customerName ?? '').trim();
  if (name && NAME_MARKERS.some((re) => re.test(name))) return 'Tên có dấu hiệu bản ghi kiểm thử';
  const phone = (record.phone ?? '').replace(/[\s.-]/g, '');
  if (phone && TEST_PHONE.test(phone)) return 'Số điện thoại thuộc dải kiểm thử 0900000xxx';
  const email = (record.email ?? '').toLowerCase();
  if (email && (email.endsWith('@example.com') || email.includes('+qatest@'))) return 'Email kiểm thử';
  return null;
}

export function partitionTestRecords<T extends TestRecordCandidate>(rows: T[]): {
  real: T[];
  test: T[];
} {
  const real: T[] = [];
  const test: T[] = [];
  for (const row of rows) (isTestRecord(row) ? test : real).push(row);
  return { real, test };
}
