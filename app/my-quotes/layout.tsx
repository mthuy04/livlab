import type { Metadata } from 'next';

// A personal working page — a basket, a lookup, an account — not a search
// result. Links out of it are still followed.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
