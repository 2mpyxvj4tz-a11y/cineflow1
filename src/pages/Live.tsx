import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Radio, Trophy, Calendar, BarChart3, Tv, RefreshCw, ExternalLink } from "lucide-react";
import {
  LEAGUES,
  fetchNext,
  fetchPast,
  fetchStandings,
  matchStatus,
  formatKickoff,
  type Fixture,
} from "@/lib/football-api";

type Tab = "live" | "upcoming" | "standings";

const STREAM_SOURCES = [
  { name: "Thapcam", url: "https://thapcam.xyz", color: "bg-red-600" },
  { name: "Vebo", url: "https://vebo.xyz", color: "bg-blue-600" },
  { name: "Socolive", url: "https://socolivetv.me", color: "bg-green-600" },
  { name: "Xoilac", url: "https://xoilac-tv.live", color: "bg-purple-600" },
];

function MatchCard({ m, live }: { m: Fixture; live?: boolean }) {
  const status = matchStatus(m.strTimestamp);
  const isLive = live || status === "live";
  const hasScore = m.intHomeScore !== null && m.intAwayScore !== null;

  // Search query để mở thẳng trang trận trên nguồn live
  const q = encodeURIComponent(`${m.strHomeTeam} vs ${m.strAwayTeam}`);

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {m.strLeagueBadge && (
            <img src={m.strLeagueBadge} alt="" className="h-4 w-4 object-contain" loading="lazy" />
          )}
          <span className="truncate">{m.strLeague}</span>
        </div>
        {isLive ? (
          <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        ) : status === "finished" ? (
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">FT</span>
        ) : (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            {formatKickoff(m.strTimestamp)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {m.strHomeTeamBadge && (
            <img src={m.strHomeTeamBadge} alt="" className="h-8 w-8 object-contain" loading="lazy" />
          )}
          <span className="truncate text-sm font-semibold">{m.strHomeTeam}</span>
        </div>

        <div className="px-2 text-center">
          {hasScore ? (
            <div className={`rounded-md px-2 py-1 text-lg font-black tabular-nums ${isLive ? "bg-red-600 text-white" : "bg-muted"}`}>
              {m.intHomeScore} - {m.intAwayScore}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">vs</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 min-w-0">
          <span className="truncate text-right text-sm font-semibold">{m.strAwayTeam}</span>
          {m.strAwayTeamBadge && (
            <img src={m.strAwayTeamBadge} alt="" className="h-8 w-8 object-contain" loading="lazy" />
          )}
        </div>
      </div>

      {(isLive || status === "today") && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground mr-1 self-center">Xem:</span>
          {STREAM_SOURCES.map((s) => (
            <a
              key={s.name}
              href={`${s.url}/?s=${q}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 rounded-md ${s.color} px-2 py-1 text-[11px] font-bold text-white hover:opacity-90`}
            >
              <Tv className="h-3 w-3" /> {s.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveTab() {
  // Lấy past + next của tất cả league, lọc ra trận "live" hoặc "today"
  const queries = useQueries({
    queries: LEAGUES.flatMap((l) => [
      { queryKey: ["fb-past", l.id], queryFn: () => fetchPast(l.id), refetchInterval: 30_000, staleTime: 25_000 },
      { queryKey: ["fb-next", l.id], queryFn: () => fetchNext(l.id), refetchInterval: 30_000, staleTime: 25_000 },
    ]),
  });

  const loading = queries.some((q) => q.isLoading);
  const allEvents = queries.flatMap((q) => (q.data as Fixture[]) ?? []);

  const live: Fixture[] = [];
  const today: Fixture[] = [];
  const seen = new Set<string>();
  for (const ev of allEvents) {
    if (seen.has(ev.idEvent)) continue;
    seen.add(ev.idEvent);
    const s = matchStatus(ev.strTimestamp);
    if (s === "live") live.push(ev);
    else if (s === "today") today.push(ev);
  }
  live.sort((a, b) => a.strTimestamp.localeCompare(b.strTimestamp));
  today.sort((a, b) => a.strTimestamp.localeCompare(b.strTimestamp));

  if (loading && allEvents.length === 0) return <SkeletonGrid />;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Đang diễn ra ({live.length})
        </h3>
        {live.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Hiện không có trận nào đang đá thuộc các giải lớn. Xem mục "Sắp diễn ra" bên dưới.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {live.map((m) => <MatchCard key={m.idEvent} m={m} live />)}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
          <Calendar className="h-4 w-4" /> Hôm nay ({today.length})
        </h3>
        {today.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Không có trận nào trong hôm nay.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {today.map((m) => <MatchCard key={m.idEvent} m={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function UpcomingTab() {
  const queries = useQueries({
    queries: LEAGUES.map((l) => ({
      queryKey: ["fb-next", l.id],
      queryFn: () => fetchNext(l.id),
      staleTime: 5 * 60_000,
    })),
  });

  const loading = queries.some((q) => q.isLoading);
  if (loading) return <SkeletonGrid />;

  return (
    <div className="space-y-6">
      {LEAGUES.map((l, i) => {
        const events = ((queries[i].data as Fixture[]) ?? []).slice(0, 8);
        if (events.length === 0) return null;
        return (
          <section key={l.id}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.color }} />
              {l.name}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {events.map((m) => <MatchCard key={m.idEvent} m={m} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StandingsTab() {
  const [leagueId, setLeagueId] = useState<string>(LEAGUES[0].id);
  const league = LEAGUES.find((l) => l.id === leagueId)!;
  const { data = [], isLoading } = useQuery({
    queryKey: ["fb-standings", leagueId, league.season],
    queryFn: () => fetchStandings(leagueId, league.season),
    staleTime: 10 * 60_000,
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {LEAGUES.map((l) => (
          <button
            key={l.id}
            onClick={() => setLeagueId(l.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              l.id === leagueId
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {l.short}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonTable />
      ) : data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu BXH cho mùa {league.season}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">CLB</th>
                  <th className="px-2 py-2 text-center">T</th>
                  <th className="px-2 py-2 text-center">Th</th>
                  <th className="px-2 py-2 text-center">H</th>
                  <th className="px-2 py-2 text-center">B</th>
                  <th className="px-2 py-2 text-center hidden sm:table-cell">BT/BB</th>
                  <th className="px-2 py-2 text-center">HS</th>
                  <th className="px-3 py-2 text-center font-black">Đ</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const rank = parseInt(row.intRank, 10);
                  const accent =
                    rank <= 4 ? "border-l-green-500" : rank <= 6 ? "border-l-blue-500" : rank >= data.length - 2 ? "border-l-red-500" : "border-l-transparent";
                  return (
                    <tr key={row.idTeam} className={`border-t border-border border-l-4 ${accent} hover:bg-muted/30`}>
                      <td className="px-3 py-2 font-bold tabular-nums">{row.intRank}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {row.strBadge && <img src={row.strBadge} alt="" className="h-5 w-5 object-contain" loading="lazy" />}
                          <span className="font-medium">{row.strTeam}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center tabular-nums">{row.intPlayed}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{row.intWin}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{row.intDraw}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{row.intLoss}</td>
                      <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell">{row.intGoalsFor}:{row.intGoalsAgainst}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{row.intGoalDifference}</td>
                      <td className="px-3 py-2 text-center font-black tabular-nums">{row.intPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}
function SkeletonTable() {
  return <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />;
}

export default function Live() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-black tracking-tight">
              <Radio className="h-7 w-7 text-red-500 animate-pulse" />
              Bóng đá
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lịch trận, tỉ số trực tiếp và BXH các giải lớn — cập nhật mỗi 30 giây.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" /> Tự động làm mới
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-lg border border-border bg-card p-1">
          {[
            { id: "live" as const, label: "Trực tiếp", icon: Radio },
            { id: "upcoming" as const, label: "Sắp diễn ra", icon: Calendar },
            { id: "standings" as const, label: "BXH", icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "live" && <LiveTab />}
        {tab === "upcoming" && <UpcomingTab />}
        {tab === "standings" && <StandingsTab />}

        {/* Footer nguồn */}
        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Trophy className="h-4 w-4 text-primary" /> Nguồn xem trực tiếp
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Bấm vào trận đang/sắp diễn ra phía trên để mở nguồn xem — hoặc vào thẳng các site dưới đây (1080p + BLV tiếng Việt).
          </p>
          <div className="flex flex-wrap gap-2">
            {STREAM_SOURCES.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 rounded-md ${s.color} px-3 py-1.5 text-xs font-bold text-white hover:opacity-90`}>
                <Tv className="h-3.5 w-3.5" /> {s.name} <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Dữ liệu trận đấu &amp; BXH từ TheSportsDB. Luồng video do bên thứ ba cung cấp, CineFlow không lưu trữ.
          </p>
        </div>
      </div>
    </div>
  );
}
