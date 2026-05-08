import { useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";
import { Settings, RotateCcw, RotateCw } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  /** Ngưỡng độ phân giải tối thiểu mong muốn (vd 1080, 2160). Player sẽ chọn level thấp nhất ≥ ngưỡng, nếu không có thì rơi về cao nhất. */
  preferredMinHeight?: number;
}

interface QualityOption {
  label: string;
  index: number; // -1 = auto
  height?: number;
}

function labelForHeight(h: number): string {
  if (h >= 2160) return "4K";
  if (h >= 1440) return "2K";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  return `${h}p`;
}

export function HlsPlayer({ src, poster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<QualityOption[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    setLevels([]);
    setCurrentLevel(-1);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        // Ưu tiên chất lượng cao: bắt đầu từ level cao nhất, ABR sẽ điều chỉnh xuống nếu băng thông yếu
        startLevel: -1,
        capLevelToPlayerSize: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        abrEwmaDefaultEstimate: 5_000_000, // giả định băng thông tốt → chọn level cao
        testBandwidth: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        const opts: QualityOption[] = (data.levels as Level[])
          .map((lv, i) => ({ label: labelForHeight(lv.height || 0), index: i, height: lv.height }))
          .sort((a, b) => (b.height || 0) - (a.height || 0));
        // chọn mức cao nhất theo mặc định
        const top = opts[0];
        if (top && hls) {
          hls.currentLevel = top.index;
          setCurrentLevel(top.index);
        }
        setLevels([{ label: "Tự động", index: -1 }, ...opts]);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        setCurrentLevel(hls?.autoLevelEnabled ? -1 : data.level);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    return () => {
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  const selectLevel = (idx: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    if (idx === -1) {
      hls.currentLevel = -1; // bật auto ABR
    } else {
      hls.currentLevel = idx;
    }
    setCurrentLevel(idx);
    setMenuOpen(false);
  };

  const currentLabel =
    currentLevel === -1
      ? "Tự động"
      : levels.find((l) => l.index === currentLevel)?.label || "—";

  const seekBy = (sec: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || Infinity), v.currentTime + sec));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = ref.current;
      if (!v) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-5); }
      else if (e.key === "ArrowRight") { e.preventDefault(); seekBy(5); }
      else if (e.code === "Space") { e.preventDefault(); v.paused ? v.play() : v.pause(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative h-full w-full bg-black group">
      <video
        ref={ref}
        controls
        autoPlay
        poster={poster}
        className="h-full w-full bg-black"
        playsInline
      />
      {/* Tua ±5s */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 md:px-16 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => seekBy(-5)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 hover:scale-110 transition"
          aria-label="Lùi 5 giây"
          title="Lùi 5s (←)"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => seekBy(5)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 hover:scale-110 transition"
          aria-label="Tới 5 giây"
          title="Tới 5s (→)"
        >
          <RotateCw className="h-6 w-6" />
        </button>
      </div>
      {levels.length > 1 && (
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/90"
            aria-label="Chọn chất lượng"
          >
            <Settings className="h-3.5 w-3.5" />
            {currentLabel}
          </button>
          {menuOpen && (
            <div className="mt-1 w-32 overflow-hidden rounded-md border border-white/10 bg-black/90 shadow-xl backdrop-blur">
              {levels.map((lv) => (
                <button
                  key={lv.index}
                  onClick={() => selectLevel(lv.index)}
                  className={`block w-full px-3 py-2 text-left text-xs ${
                    (currentLevel === lv.index)
                      ? "bg-primary text-primary-foreground"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {lv.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
