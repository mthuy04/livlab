'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ExternalLink, Play } from 'lucide-react';
import { facebookPlayerUrl, type ShowroomVideo } from '@/lib/storefront/showroomMedia';
import styles from './ArchitecturalLanding.module.css';

/**
 * The showroom's own Facebook videos, played in Facebook's embedded player.
 *
 * Nothing loads from Facebook until the visitor presses play: the card is the
 * poster, so the page stays fast and no third-party request is made for a
 * visitor who never watches. Sound starts only from that press.
 */
function VideoCard({ video }: { video: ShowroomVideo }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article className={styles.videoCard}>
      <div className={styles.videoFrame}>
        {playing ? (
          <iframe
            src={facebookPlayerUrl(video.facebookUrl)}
            title={video.title}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            className={styles.videoIframe}
          />
        ) : (
          <button type="button" className={styles.videoPoster} onClick={() => setPlaying(true)}>
            <span className={styles.videoPosterHint}>Video · Facebook</span>
            <span className={styles.videoPlay} aria-hidden="true">
              <Play />
            </span>
            <span className={styles.videoPosterTitle}>{video.title}</span>
            <span className="sr-only">Phát video {video.title}</span>
          </button>
        )}
      </div>
      <div className={styles.videoCopy}>
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        <div className={styles.videoLinks}>
          {video.next.href.startsWith('/') ? (
            <Link href={video.next.href as Route} className={styles.productLink}>
              {video.next.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : null}
          <a href={video.facebookUrl} target="_blank" rel="noreferrer" className={styles.videoExternal}>
            Xem trên Facebook
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ShowroomVideos({ videos }: { videos: ShowroomVideo[] }) {
  return (
    <div className={styles.videoGrid}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
