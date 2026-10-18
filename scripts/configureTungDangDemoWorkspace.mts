import { PrismaClient } from '@prisma/client';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const workspaceId = 'workspace-demo-tungdang';
const email = process.env.DEMO_SHOWROOM_USER_EMAIL?.trim().toLowerCase();

if (process.env.ALLOW_DEMO_WORKSPACE_CONFIG !== '1') {
  throw new Error('Set ALLOW_DEMO_WORKSPACE_CONFIG=1 only for an authorized isolated demo database.');
}
if (!email) throw new Error('DEMO_SHOWROOM_USER_EMAIL is required. The script never invents an account.');

try {
  await prisma.$transaction(async (tx) => {
    const workspace = await tx.showroom.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.tenantKey !== 'tungdang' || workspace.workspaceKind !== 'DEMO') {
      throw new Error('The reviewed V3 migration must create the isolated Tùng Đăng demo workspace first.');
    }

    const user = await tx.user.findUnique({ where: { email } });
    if (!user) throw new Error('No existing authorized user matches DEMO_SHOWROOM_USER_EMAIL.');
    if (user.role !== 'SHOWROOM') throw new Error('The selected account must already have the SHOWROOM role.');
    if (user.showroomId && user.showroomId !== workspaceId) {
      throw new Error('Refusing to move an account that already belongs to another showroom.');
    }

    await tx.user.update({ where: { id: user.id }, data: { showroomId: workspaceId } });
    console.log(JSON.stringify({ configured: true, workspaceId, userId: user.id }, null, 2));
  });
} finally {
  await prisma.$disconnect();
}
