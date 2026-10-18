import { DIVIDER, TEXT, TEXT_FAINT, TEXT_MUTED } from '@/components/storefront/home/editorial';

/**
 * The design idea, after the room rather than before it.
 *
 * A reader who has just looked at the photograph and opened a hotspot or two
 * is ready to be told why the room is like this; the same paragraphs above
 * the image would be text standing between them and the thing they came to
 * see.
 *
 * Two columns, no cards: the story at a readable measure on the left and the
 * three principles as a short list on the right, separated by a rule rather
 * than by a surface. Shared by both concept page treatments.
 */
export default function ConceptStory({
  heading,
  story,
  principles,
}: {
  heading: string;
  story: string;
  principles: readonly string[];
}) {
  return (
    <section className="home-container" style={{ paddingTop: 44 }}>
      <div style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', color: TEXT_FAINT }}>
          Ý TƯỞNG THIẾT KẾ
        </p>

        <h2
          style={{
            marginTop: 12,
            fontSize: 'clamp(22px, 1.2rem + .6vw, 31px)',
            fontWeight: 500,
            lineHeight: 1.14,
            letterSpacing: '.008em',
            color: TEXT,
          }}
        >
          {heading}
        </h2>

        <div className="concept-story">
          <div className="concept-story-body">
            {story.split('\n\n').map((para) => (
              <p key={para.slice(0, 24)} style={{ fontSize: 15.5, lineHeight: 1.78, color: TEXT_MUTED }}>
                {para}
              </p>
            ))}
          </div>

          <aside className="concept-story-principles">
            <ul>
              {principles.map((point, i) => (
                <li key={point}>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: 7,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '.1em',
                      color: TEXT_FAINT,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.62, color: TEXT }}>{point}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
