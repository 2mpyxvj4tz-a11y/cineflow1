import { useEffect, useState } from "react";

interface Props {
  actors: string[];
}

function colorFor(name: string): string {
  const hue = (name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;
  return `hsl(${hue} 70% 45%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

// In-memory + localStorage cache to avoid refetching
const memCache = new Map<string, string | null>();

async function fetchActorImage(name: string): Promise<string | null> {
  if (memCache.has(name)) return memCache.get(name)!;
  const cacheKey = `actor-img:${name}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      const val = cached === "" ? null : cached;
      memCache.set(name, val);
      return val;
    }
  } catch {}

  // Try Wikipedia (English, then Vietnamese) – free, CORS enabled, no key
  const tryWiki = async (lang: "en" | "vi") => {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}?redirect=true`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const url: string | undefined = data?.thumbnail?.source || data?.originalimage?.source;
      if (!url) return null;
      // Heuristic: must be person-related
      const desc = (data?.description || "").toLowerCase();
      const extract = (data?.extract || "").toLowerCase();
      const personHints = ["actor", "actress", "diễn viên", "born", "sinh ", "người"];
      if (!personHints.some((h) => desc.includes(h) || extract.includes(h))) return null;
      return url;
    } catch {
      return null;
    }
  };

  let img = await tryWiki("en");
  if (!img) img = await tryWiki("vi");

  memCache.set(name, img);
  try {
    localStorage.setItem(cacheKey, img ?? "");
  } catch {}
  return img;
}

function ActorAvatar({ name }: { name: string }) {
  const [img, setImg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActorImage(name).then((url) => {
      if (!cancelled) {
        setImg(url);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div className="flex w-20 shrink-0 flex-col items-center text-center">
      <div
        className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white shadow-md ring-2 ring-border transition-transform hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${colorFor(name)}, ${colorFor(name + "x")})` }}
        aria-label={name}
      >
        {img ? (
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImg(null)}
          />
        ) : (
          <span>{initials(name) || "?"}</span>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-xs text-foreground/80">{name}</div>
    </div>
  );
}

export function ActorAvatars({ actors }: Props) {
  const list = (actors ?? []).filter(Boolean).slice(0, 20);
  if (list.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold">Diễn viên</h2>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {list.map((name) => (
          <ActorAvatar key={name} name={name} />
        ))}
      </div>
    </section>
  );
}
