import { PrismaClient } from '@prisma/client';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const requiredTables = ['Quote', 'QuoteLine', 'LeadActivity', 'ShowroomProductOffer'];
const requiredLeadColumns = ['stage', 'requestCode', 'normalizedPhone', 'submissionKey', 'sourceTenantId'];
const requiredShowroomColumns = ['tenantKey', 'workspaceKind'];

try {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = ANY(${requiredTables}::text[])
  `;
  const columns = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND (
        (table_name = 'QuoteLead' AND column_name = ANY(${requiredLeadColumns}::text[]))
        OR (table_name = 'Showroom' AND column_name = ANY(${requiredShowroomColumns}::text[]))
      )
  `;

  const tableSet = new Set(tables.map((row) => row.table_name));
  const columnSet = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  const missing = [
    ...requiredTables.filter((table) => !tableSet.has(table)).map((table) => `table:${table}`),
    ...requiredLeadColumns.filter((column) => !columnSet.has(`QuoteLead.${column}`)).map((column) => `column:QuoteLead.${column}`),
    ...requiredShowroomColumns.filter((column) => !columnSet.has(`Showroom.${column}`)).map((column) => `column:Showroom.${column}`),
  ];

  console.log(JSON.stringify({ ready: missing.length === 0, missing }, null, 2));
  if (missing.length > 0) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
