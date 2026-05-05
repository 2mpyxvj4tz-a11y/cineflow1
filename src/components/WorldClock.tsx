import { useEffect, useState } from "react";
import { Clock, Globe } from "lucide-react";

interface Zone {
  label: string;
  tz: string;
  flag: string;
}

const ZONES: Zone[] = [
  { label: "Việt Nam", tz: "Asia/Ho_Chi_Minh", flag: "🇻🇳" },
  { label: "Hoa Kỳ (NY)", tz: "America/New_York", flag: "🇺🇸" },
  { label: "Hoa Kỳ (LA)", tz: "America/Los_Angeles", flag: "🇺🇸" },
  { label: "Anh Quốc", tz: "Europe/London", flag: "🇬🇧" },
  { label: "Pháp", tz: "Europe/Paris", flag: "🇫🇷" },
  { label: "Đức", tz: "Europe/Berlin", flag: "🇩🇪" },
  { label: "Hàn Quốc", tz: "Asia/Seoul", flag: "🇰🇷" },
  { label: "Nhật Bản", tz: "Asia/Tokyo", flag: "🇯🇵" },
  { label: "Trung Quốc", tz: "Asia/Shanghai", flag: "🇨🇳" },
  { label: "Đài Loan", tz: "Asia/Taipei", flag: "🇹🇼" },
  { label: "Hồng Kông", tz: "Asia/Hong_Kong", flag: "🇭🇰" },
  { label: "Thái Lan", tz: "Asia/Bangkok", flag: "🇹🇭" },
  { label: "Singapore", tz: "Asia/Singapore", flag: "🇸🇬" },
  { label: "Úc (Sydney)", tz: "Australia/Sydney", flag: "🇦🇺" },
  { label: "UAE (Dubai)", tz: "Asia/Dubai", flag: "🇦🇪" },
  { label: "Ấn Độ", tz: "Asia/Kolkata", flag: "🇮🇳" },
];

function formatTime(tz: string, now: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(now);
}

function formatDate(tz: string, now: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: tz,
  }).format(now);
}

export function WorldClock() {
  const saved = typeof window !== "undefined" ? localStorage.getItem("cf_clock_zones") : null;
  const initial: string[] = saved ? JSON.parse(saved) : ["Asia/Ho_Chi_Minh", "America/Los_Angeles", "Europe/London"];
  const [active, setActive] = useState<string[]>(initial);
  const [offset, setOffset] = useState(0); // serverTime - clientTime (ms)
  const [now, setNow] = useState(new Date());
  const [picker, setPicker] = useState(false);

  // Đồng bộ giờ với server chuẩn (không phụ thuộc đồng hồ máy người dùng)
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const sources = [
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
      ];
      for (const url of sources) {
        try {
          const t0 = Date.now();
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const t1 = Date.now();
          const rtt = t1 - t0;
          // Ưu tiên header Date (chính xác, độ trễ thấp)
          const dateHeader = res.headers.get("date");
          let serverMs: number | null = null;
          if (dateHeader) serverMs = new Date(dateHeader).getTime();
          if (!serverMs || Number.isNaN(serverMs)) {
            const data = await res.json().catch(() => null);
            const iso = data?.utc_datetime || data?.dateTime;
            if (iso) serverMs = new Date(iso).getTime();
          }
          if (!serverMs || Number.isNaN(serverMs)) continue;
          const off = serverMs + rtt / 2 - t1;
          if (!cancelled) setOffset(off);
          return;
        } catch {
          /* try next */
        }
      }
    };
    sync();
    const resync = setInterval(sync, 5 * 60 * 1000); // re-sync mỗi 5 phút
    return () => {
      cancelled = true;
      clearInterval(resync);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date(Date.now() + offset)), 1000);
    return () => clearInterval(t);
  }, [offset]);

  useEffect(() => {
    localStorage.setItem("cf_clock_zones", JSON.stringify(active));
  }, [active]);

  const toggle = (tz: string) => {
    setActive((a) => (a.includes(tz) ? a.filter((x) => x !== tz) : [...a, tz]));
  };

  return (
    <section className="px-4 py-6 md:px-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold md:text-2xl">
          <Clock className="h-5 w-5 text-primary" /> Đồng hồ thế giới
        </h2>
        <button
          onClick={() => setPicker((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
        >
          <Globe className="h-3.5 w-3.5" /> Tuỳ chỉnh
        </button>
      </div>

      {picker && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-card/60 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 animate-fade-in">
          {ZONES.map((z) => {
            const on = active.includes(z.tz);
            return (
              <button
                key={z.tz}
                onClick={() => toggle(z.tz)}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all duration-300 ${
                  on
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-base leading-none">{z.flag}</span>
                <span className="truncate">{z.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {active.map((tz) => {
          const z = ZONES.find((x) => x.tz === tz);
          if (!z) return null;
          return (
            <div
              key={tz}
              className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-card/40 p-3 transition-all duration-500 ease-out hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_hsl(357_92%_47%/0.4)]"
            >
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_top_right,hsl(357_92%_47%/0.18),transparent_70%)]" />
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-base leading-none">{z.flag}</span>
                <span className="truncate">{z.label}</span>
              </div>
              <div className="font-mono text-xl font-bold tabular-nums tracking-tight md:text-2xl">
                {formatTime(z.tz, now)}
              </div>
              <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {formatDate(z.tz, now)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
