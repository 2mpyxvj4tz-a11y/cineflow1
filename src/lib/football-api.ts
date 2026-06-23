/**
 * TheSportsDB free API wrapper (key "3" = free public test key).
 * Free tier KHÔNG có endpoint livescore — ta dùng eventsnextleague + eventspastleague
 * và tự đánh dấu "đang đá" nếu kickoff trong khoảng -120 → +10 phút so với now().
 */

const BASE = "https://www.thesportsdb.com/api/v1/json/3";

export const LEAGUES = [
  { id: "4328", name: "Ngoại hạng Anh", short: "EPL", season: "2025-2026", color: "#3D195B" },
  { id: "4335", name: "La Liga", short: "LIGA", season: "2025-2026", color: "#EE8707" },
  { id: "4332", name: "Serie A", short: "SERIE A", season: "2025-2026", color: "#008FD7" },
  { id: "4331", name: "Bundesliga", short: "BUNDES", season: "2025-2026", color: "#D20515" },
  { id: "4334", name: "Ligue 1", short: "L1", season: "2025-2026", color: "#091C3E" },
  { id: "4480", name: "Champions League", short: "UCL", season: "2025-2026", color: "#0E1E5B" },
] as const;

export type LeagueId = (typeof LEAGUES)[number]["id"];

export type Fixture = {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string; // ISO
  idLeague: string;
  strLeague: string;
  strLeagueBadge?: string | null;
  strStatus?: string | null;
};

export type StandingRow = {
  intRank: string;
  idTeam: string;
  strTeam: string;
  strBadge?: string | null;
  strForm?: string | null;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchNext(leagueId: string): Promise<Fixture[]> {
  const data = await get<{ events: Fixture[] | null }>(`/eventsnextleague.php?id=${leagueId}`);
  return data.events ?? [];
}

export async function fetchPast(leagueId: string): Promise<Fixture[]> {
  const data = await get<{ events: Fixture[] | null }>(`/eventspastleague.php?id=${leagueId}`);
  return data.events ?? [];
}

export async function fetchStandings(leagueId: string, season: string): Promise<StandingRow[]> {
  const data = await get<{ table: StandingRow[] | null }>(`/lookuptable.php?l=${leagueId}&s=${season}`);
  return data.table ?? [];
}

/** Tính trạng thái trận theo kickoff (UTC) */
export function matchStatus(iso: string): "live" | "upcoming" | "finished" | "today" {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = (t - now) / 60000;
  if (diffMin > -120 && diffMin < 10) return "live"; // đang đá / vừa kick-off
  if (diffMin >= 10 && diffMin < 24 * 60) return "today";
  if (diffMin < -120) return "finished";
  return "upcoming";
}

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (isSameDay) return `Hôm nay ${time}`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) + ` ${time}`;
}
