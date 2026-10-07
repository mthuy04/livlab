# Manual SQL migrations

## Why this directory exists

The production database **predates Prisma Migrate**. It has no `_prisma_migrations`
table and the repository has never contained a `prisma/migrations/` directory —
the schema has been maintained with `prisma db push`.

That matters: `prisma migrate deploy` on a database with no migration history
tries to establish a baseline, and against a database that already holds real
data that is not a safe first move.

So schema changes live here as **reviewed SQL, applied by hand**.

## Rules

- **Do NOT run `prisma migrate deploy`** against production.
- **Do NOT run `prisma db push`** against production either: it diffs the whole
  schema and will happily drop whatever does not match.
- Every file here is generated with `prisma migrate diff`, which only *reads*
  the target database, then reviewed before it is applied.
- Each file wraps its statements in `BEGIN; … COMMIT;`. PostgreSQL DDL is
  transactional, so a failure half-way rolls back instead of leaving the schema
  in a partial state.
- `prisma/schema.prisma` stays the source of truth for Prisma Client and is
  updated in the same commit as the SQL.

Giving this database a formal Prisma baseline is a **separate future task**, not
something to improvise inside a feature branch.

## Applying a migration

Preferred order — do not skip to the last step:

1. `npx prisma validate`
2. Read the generated SQL in full.
3. Create a **Neon branch** of production (Neon Console → Branches → New branch).
4. Apply the migration to the branch:
   ```bash
   psql "<branch-connection-string>" -f db/migrations/<file>.sql
   ```
5. Point the app at the branch (`DATABASE_URL`) and exercise the affected flows.
6. `npm run lint && npx tsc --noEmit && npm run build`
7. Deploy a Vercel Preview configured against the branch database.
8. Test the full workflow on that Preview.
9. Confirm production backup / point-in-time restore is enabled and within range.
10. Only then apply the **exact same reviewed file** to production.

## Regenerating the SQL for review

Read-only against the target; it changes nothing:

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

## Checking a migration is additive

Comments are stripped first, because a header that *describes* destructive
statements otherwise matches a search for them:

```bash
grep -v '^--' db/migrations/<file>.sql \
  | grep -icE 'DROP |TRUNCATE|RENAME|ALTER COLUMN|SET NOT NULL'   # expect 0
```

## History

| File | Date | Summary | Applied to production |
|------|------|---------|----------------------|
| `20261007_showroom_workspace_v2.sql` | 2026-10-07 | Showroom Workspace V2: 7 enums, 4 tables (`Quote`, `QuoteLine`, `LeadActivity`, `ShowroomProductOffer`), 8 nullable columns on `QuoteLead`. Additive only. **Schema frozen.** | **No — awaiting approval** |

## Invariants the database cannot enforce

Foreign keys guarantee that a row points at *something* real, not that it points
at something the caller is allowed to touch. These are enforced in
`lib/showroom/` services and must stay there:

- `Quote.showroomId` equals the owning lead's `showroomId`.
- `LeadActivity.showroomId` equals its lead's `showroomId`.
- `ShowroomProductOffer.showroomId` is always the authenticated showroom.
- `QuoteLead.assignedToId` is a user belonging to that same showroom.
- `QuoteLead.firstContactAt` is written only when currently NULL.
- `QuoteLead.nextAction*` is written only by the activity service, in the same
  transaction as the `LeadActivity` it summarises.
