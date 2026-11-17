import { serializeJsonLd, type JsonLdObject } from '@/lib/seo/structuredData';

/** Structured data for the page it is rendered in. Server-rendered, so it is in the HTML crawlers read. */
export default function JsonLd({ data }: { data: (JsonLdObject | null)[] }) {
  const items = data.filter((d): d is JsonLdObject => d !== null);
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </>
  );
}
