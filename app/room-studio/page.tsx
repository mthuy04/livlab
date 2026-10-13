import type { Metadata } from 'next';
import { resolveTenant } from '@/lib/storefront/resolveTenant';
import RoomStudioClient from './RoomStudioClient';

/**
 * Tenant-aware, and specific about what the tool does.
 *
 * "Room Studio - LivLab" announced the platform to a customer who arrived at a
 * showroom's storefront, and the description sold interior design. What this
 * page does is narrower and more useful: it places this showroom's real
 * products at their real size in the customer's own room.
 */
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  return {
    title: `Room Studio | ${tenant.brand.name}`,
    description:
      'Phối thử thiết bị phòng tắm theo kích thước không gian trước khi yêu cầu báo giá.',
    alternates: { canonical: '/room-studio' },
  };
}

export default function RoomStudioPage() {
  return <RoomStudioClient />;
}
