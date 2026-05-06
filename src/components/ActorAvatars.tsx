interface Props {
  actors: string[];
}

// Generate consistent color from name
function colorFor(name: string): string {
  const hue = (name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;
  return `hsl(${hue} 70% 45%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function ActorAvatars({ actors }: Props) {
  const list = (actors ?? []).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold">Diễn viên</h2>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {list.slice(0, 20).map((name) => (
          <div key={name} className="flex w-20 shrink-0 flex-col items-center text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-md ring-2 ring-border transition-transform hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${colorFor(name)}, ${colorFor(name + "x")})` }}
              aria-label={name}
            >
              {initials(name) || "?"}
            </div>
            <div className="mt-2 line-clamp-2 text-xs text-foreground/80">{name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
