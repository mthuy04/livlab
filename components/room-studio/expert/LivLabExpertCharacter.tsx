'use client';

import Image from 'next/image';

interface LivLabExpertCharacterProps {
  onClick: () => void;
  /** Sizes are set by the parent so the entry owns its own responsive scale. */
  className?: string;
}

/**
 * The LivLab Expert character — the single visible entry point into the Expert.
 *
 * The source asset is a full waist-up figure (1086×1448). Rendering it whole
 * would put a tall body in the corner of the studio, so the frame crops it to a
 * bust: the image is laid in at its natural aspect ratio, wider than the frame
 * is tall, and the frame clips the bottom. Cropping this way rather than with
 * `object-cover` guarantees the figure is never stretched, and an explicit
 * intrinsic size means no layout shift while it loads.
 *
 * A mask fades the cut edge out instead of ending on a hard horizontal line,
 * which is what makes it read as a person standing in the interface rather than
 * as a photo in a box.
 *
 * The button is sized to the visible figure only. The surrounding wrapper is
 * pointer-events-none, so the transparent corners of the PNG never swallow a
 * click meant for the 3D canvas behind it.
 */
export default function LivLabExpertCharacter({ onClick, className = '' }: LivLabExpertCharacterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Mở LivLab Expert"
      className={`group pointer-events-auto relative block overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100 ${className}`}
      style={{
        // Softens the bottom crop. Applied inline because both vendor spellings
        // are needed and Tailwind would emit only one.
        maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
      }}
    >
      <Image
        src="/images/expert/livlab-expert.png"
        alt="Chuyên gia tư vấn LivLab"
        width={1086}
        height={1448}
        sizes="(max-width: 767px) 90px, (max-width: 1279px) 130px, 156px"
        priority={false}
        className="pointer-events-none absolute inset-x-0 top-0 h-auto w-full select-none object-contain"
        draggable={false}
      />
    </button>
  );
}
