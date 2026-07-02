'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

function normalizeConceptName(name: string): string {
  return name.trim().toLowerCase();
}

// Module-scoped so every badge instance on a page (e.g. a grid of concept
// cards) shares one fetch instead of one request per card.
let popularityPromise: Promise<Record<string, number>> | null = null;

function getPopularityMap(): Promise<Record<string, number>> {
  if (!popularityPromise) {
    popularityPromise = fetch('/api/stats/concept-popularity')
      .then((res) => (res.ok ? res.json() : { counts: {} }))
      .then((data) => data.counts || {})
      .catch(() => ({}));
  }
  return popularityPromise;
}

interface ConceptPopularityBadgeProps {
  title: string;
  className?: string;
}

export default function ConceptPopularityBadge({ title, className = '' }: ConceptPopularityBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPopularityMap().then((counts) => {
      if (cancelled) return;
      setCount(counts[normalizeConceptName(title)] || 0);
    });
    return () => {
      cancelled = true;
    };
  }, [title]);

  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#123C5A] bg-[#EEF4F7] px-2.5 py-1 rounded-full ${className}`}
    >
      <Users className="w-3 h-3" />
      Đã có {count} khách chọn
    </span>
  );
}
