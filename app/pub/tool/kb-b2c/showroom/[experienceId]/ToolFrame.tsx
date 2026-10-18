'use client';

import { useEffect, useRef, useState } from 'react';
import { TEXT, TEXT_MUTED } from '@/components/storefront/home/editorial';

/**
 * The manufacturer's tool, framed.
 *
 * Headers are checked before a tool is marked EMBED_ALLOWED, but headers are
 * not the only thing that can stop a frame: a corporate network, an extension
 * or an offline machine will leave it blank. Rather than show an empty page,
 * this waits for the frame to load and falls back to the same external link
 * the EXTERNAL_ONLY tools use.
 *
 * Nothing is bypassed. If the provider refuses to be framed, the fallback is
 * what the customer gets.
 */
export default function ToolFrame({
  src,
  title,
  attribution,
}: {
  src: string;
  title: string;
  attribution: string;
}) {
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded.current) setFailed(true);
    }, 12_000);
    return () => clearTimeout(timer);
  }, []);

  if (failed) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-[460px] text-center">
          <h1 style={{ fontSize: 24, fontWeight: 500, color: TEXT }}>{title}</h1>
          <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.65, color: TEXT_MUTED }}>
            Công cụ này sẽ được mở từ nền tảng mô phỏng của hãng.
          </p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center transition-opacity hover:opacity-85"
            style={{
              height: 43,
              paddingInline: 24,
              backgroundColor: 'var(--tenant-accent, #123F5D)',
              color: 'var(--tenant-accent-contrast, #FFFFFF)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.08em',
            }}
          >
            MỞ MÔ PHỎNG →
          </a>
          <p className="mt-6" style={{ fontSize: 11, color: TEXT_MUTED }}>{attribution}</p>
        </div>
      </main>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      onLoad={() => {
        loaded.current = true;
      }}
      className="w-full flex-1"
      style={{ border: 0 }}
      allow="fullscreen; clipboard-write"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
