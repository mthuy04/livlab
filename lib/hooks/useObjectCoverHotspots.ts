'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CoverBox {
  containerWidth: number;
  containerHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Corrects hotspot percentages (measured against a photo's natural/original
 * dimensions) into the percentages needed to place a dot inside an
 * `object-fit: cover` image container — accounting for the crop introduced
 * whenever the container's aspect ratio differs from the photo's. Assumes
 * the default `object-position: 50% 50%` (centered crop).
 *
 * Recomputes on every container resize via ResizeObserver, so positions
 * stay correct across viewport/orientation changes, not just at mount.
 */
export function useObjectCoverHotspots<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [box, setBox] = useState<CoverBox | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return;
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    setBox((prev) => {
      if (
        prev &&
        prev.containerWidth === clientWidth &&
        prev.containerHeight === clientHeight &&
        prev.naturalWidth === img.naturalWidth &&
        prev.naturalHeight === img.naturalHeight
      ) {
        return prev;
      }
      return {
        containerWidth: clientWidth,
        containerHeight: clientHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      };
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    // Cached images can already be `complete` before this effect runs.
    if (imgRef.current?.complete) measure();
    return () => observer.disconnect();
  }, [measure]);

  const onImageLoad = useCallback(() => measure(), [measure]);

  const toDisplayPercent = useCallback(
    (xPercent: number, yPercent: number): { left: number; top: number } => {
      if (!box) return { left: xPercent, top: yPercent };
      const { containerWidth, containerHeight, naturalWidth, naturalHeight } = box;
      const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
      const displayedWidth = naturalWidth * scale;
      const displayedHeight = naturalHeight * scale;
      const cropX = (displayedWidth - containerWidth) / 2;
      const cropY = (displayedHeight - containerHeight) / 2;
      return {
        left: ((xPercent / 100) * displayedWidth - cropX) / containerWidth * 100,
        top: ((yPercent / 100) * displayedHeight - cropY) / containerHeight * 100,
      };
    },
    [box]
  );

  // Inverse of toDisplayPercent: given a % position on the RENDERED (cropped) container,
  // returns the equivalent % against the image's natural dimensions — i.e. what should
  // actually be stored as xPercent/yPercent so toDisplayPercent reproduces this same spot.
  const toNaturalPercent = useCallback(
    (displayLeftPercent: number, displayTopPercent: number): { xPercent: number; yPercent: number } => {
      if (!box) return { xPercent: displayLeftPercent, yPercent: displayTopPercent };
      const { containerWidth, containerHeight, naturalWidth, naturalHeight } = box;
      const scale = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
      const displayedWidth = naturalWidth * scale;
      const displayedHeight = naturalHeight * scale;
      const cropX = (displayedWidth - containerWidth) / 2;
      const cropY = (displayedHeight - containerHeight) / 2;
      return {
        xPercent: (((displayLeftPercent / 100) * containerWidth + cropX) / displayedWidth) * 100,
        yPercent: (((displayTopPercent / 100) * containerHeight + cropY) / displayedHeight) * 100,
      };
    },
    [box]
  );

  return { containerRef, imgRef, onImageLoad, toDisplayPercent, toNaturalPercent, isMeasured: box !== null };
}
