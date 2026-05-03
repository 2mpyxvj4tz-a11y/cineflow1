// KKPhim public API helper. Docs: https://phimapi.com
const API_BASE = "https://phimapi.com";
const IMG_BASE = "https://phimimg.com";

export interface PhimItem {
  _id?: string;
  name: string;
  slug: string;
  origin_name?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number;
  type?: string;
  episode_current?: string;
  quality?: string;
  lang?: string;
  category?: { id?: string; name: string; slug: string }[];
  country?: { id?: string; name: string; slug: string }[];
}

export interface ServerData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface EpisodeServer {
  server_name: string;
  server_data: ServerData[];
}

export interface PhimDetail extends PhimItem {
  content?: string;
  status?: string;
  time?: string;
  director?: string[];
  actor?: string[];
  trailer_url?: string;
  episodes?: EpisodeServer[];
}

export const fixImg = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${IMG_BASE}/${url}`;
};

interface NewListResponse {
  status: boolean;
  items: PhimItem[];
  pagination?: { totalItems: number; totalItemsPerPage: number; currentPage: number; totalPages: number };
}

export async function fetchNewMovies(page = 1): Promise<NewListResponse> {
  const res = await fetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat-v3?page=${page}`);
  if (!res.ok) throw new Error("Lỗi tải danh sách phim");
  return res.json();
}

interface ListV1Response {
  status: string;
  data: {
    items: PhimItem[];
    params?: { pagination?: { totalItems: number; totalItemsPerPage: number; currentPage: number; totalPages: number } };
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

export async function fetchListByType(
  type: "phim-bo" | "phim-le" | "tv-shows" | "hoat-hinh" | "phim-vietsub" | "phim-thuyet-minh" | "phim-long-tieng",
  page = 1,
  extra: Record<string, string | number> = {}
): Promise<ListV1Response> {
  const params = new URLSearchParams({ page: String(page), limit: "24", ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${API_BASE}/v1/api/danh-sach/${type}?${params}`);
  if (!res.ok) throw new Error("Lỗi tải danh sách");
  return res.json();
}

export async function fetchByCategory(slug: string, page = 1): Promise<ListV1Response> {
  const res = await fetch(`${API_BASE}/v1/api/the-loai/${slug}?page=${page}&limit=24`);
  if (!res.ok) throw new Error("Lỗi tải thể loại");
  return res.json();
}

export async function fetchByCountry(slug: string, page = 1): Promise<ListV1Response> {
  const res = await fetch(`${API_BASE}/v1/api/quoc-gia/${slug}?page=${page}&limit=24`);
  if (!res.ok) throw new Error("Lỗi tải quốc gia");
  return res.json();
}

export async function searchMovies(keyword: string, page = 1): Promise<ListV1Response> {
  const res = await fetch(`${API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=24`);
  if (!res.ok) throw new Error("Lỗi tìm kiếm");
  return res.json();
}

interface DetailResponse {
  status: boolean;
  movie: PhimDetail;
  episodes: EpisodeServer[];
}

export async function fetchMovieDetail(slug: string): Promise<DetailResponse> {
  const res = await fetch(`${API_BASE}/phim/${slug}`);
  if (!res.ok) throw new Error("Không tìm thấy phim");
  return res.json();
}

export async function fetchCategories(): Promise<{ _id: string; name: string; slug: string }[]> {
  const res = await fetch(`${API_BASE}/the-loai`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCountries(): Promise<{ _id: string; name: string; slug: string }[]> {
  const res = await fetch(`${API_BASE}/quoc-gia`);
  if (!res.ok) return [];
  return res.json();
}
