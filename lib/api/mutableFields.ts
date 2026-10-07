/**
 * Explicit allow-lists for PATCH payloads.
 *
 * These endpoints used to hand the parsed request body straight to
 * `prisma.update({ data })`. That is mass assignment: the caller chooses which
 * columns to write, so a showroom user could PATCH `showroomId` and move a lead
 * into someone else's showroom, or rewrite `createdAt` and corrupt reporting.
 * The route's own ownership check passes, because it runs before the write and
 * only looks at the row as it is now.
 *
 * Ownership and identity columns are therefore never mutable from a payload.
 * They are set by the server, from the session, or not at all.
 */

/**
 * Keeps only the listed keys, dropping `undefined` so no column is nulled by
 * omission.
 *
 * `TShape` is the Prisma update input the result feeds, so the filtered object
 * stays typed rather than being cast back in at the call site. Values are not
 * type-checked here — Prisma rejects a wrong type at the boundary — but the
 * SET of writable columns is fixed by this function, which is the part that
 * matters for security.
 */
export function pickAllowed<TShape, T extends Extract<keyof TShape, string>>(
  body: unknown,
  allowed: readonly T[]
): Partial<Pick<TShape, T>> {
  if (!body || typeof body !== 'object') return {};
  const source = body as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in source && source[key] !== undefined) result[key] = source[key];
  }
  return result as Partial<Pick<TShape, T>>;
}

/** Master product data. Admin-only — a showroom prices through ShowroomProductOffer. */
export const PRODUCT_MUTABLE_FIELDS = [
  'name', 'brand', 'category', 'priceMin', 'priceMax', 'priceRange',
  'material', 'finish', 'dimensions', 'warranty', 'imageUrl', 'sourceUrl',
  'slug', 'status',
] as const;

export const CONCEPT_MUTABLE_FIELDS = [
  'title', 'slug', 'description', 'style', 'roomType', 'imageUrl',
  'budgetRange', 'areaRange', 'status',
] as const;

/** True when the allow-list filtered the payload down to nothing worth writing. */
export function isEmptyUpdate(data: Record<string, unknown>): boolean {
  return Object.keys(data).length === 0;
}
