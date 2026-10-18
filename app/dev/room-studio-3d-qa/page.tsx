import type { Metadata } from 'next';
import ReconstructionQaClient from './ReconstructionQaClient';

/**
 * Runtime QA for LivLab's reconstructed 3D models.
 *
 * Loads every registered reconstruction through the real Room Studio scene
 * and reports what the renderer measured, so the readiness recorded in
 * `lib/room-studio/reconstructionRegistry.ts` is a result, not a claim.
 */
export const metadata: Metadata = {
  title: 'Room Studio — QA mô hình tái tạo (dev)',
  robots: { index: false, follow: false },
};

export default function RoomStudio3DQaPage() {
  return <ReconstructionQaClient />;
}
