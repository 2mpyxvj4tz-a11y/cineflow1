// Sync phim hoạt hình 3D từ hoathinh3d.co bằng Firecrawl
// Chạy bởi cron 19:00 hằng ngày, hoặc gọi tay qua HTTP

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
const SOURCE_BASE = "https://hoathinh3d.co";

interface ScrapeJsonOpts {
  prompt: string;
  schema?: unknown;
}
async function firecrawlScrape(url: string, json: ScrapeJsonOpts) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: [{ type: "json", prompt: json.prompt, schema: json.schema }],
      onlyMainContent: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data?.data?.json ?? data?.json ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let moviesAdded = 0;
  let episodesAdded = 0;

  try {
    // 1) Lấy danh sách phim mới cập nhật từ trang chủ hoathinh3d.co
    const listing = await firecrawlScrape(SOURCE_BASE, {
      prompt:
        "Trích xuất danh sách phim hoạt hình mới cập nhật trên trang. Mỗi phim gồm: name (tên phim), slug (lấy từ URL chi tiết, phần cuối path), source_url (URL chi tiết tuyệt đối), poster_url (ảnh thumbnail tuyệt đối), episode_current (vd 'Tập 12'), year (số năm nếu có).",
      schema: {
        type: "object",
        properties: {
          movies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                slug: { type: "string" },
                source_url: { type: "string" },
                poster_url: { type: "string" },
                episode_current: { type: "string" },
                year: { type: "number" },
              },
              required: ["name", "source_url"],
            },
          },
        },
      },
    });

    const movies: Array<{
      name: string;
      slug?: string;
      source_url: string;
      poster_url?: string;
      episode_current?: string;
      year?: number;
    }> = listing?.movies ?? [];

    // Giới hạn 15 phim mới mỗi lần để tiết kiệm credit Firecrawl
    for (const m of movies.slice(0, 15)) {
      const slug =
        m.slug ||
        m.source_url
          .replace(/^https?:\/\/[^/]+\//, "")
          .replace(/\/$/, "")
          .split("/")
          .pop() ||
        m.name.toLowerCase().replace(/\s+/g, "-");

      // 2) Scrape trang chi tiết để lấy danh sách tập + mô tả
      const detail = await firecrawlScrape(m.source_url, {
        prompt:
          "Trích xuất chi tiết phim: description (mô tả), quality (vd 'HD','FHD','4K'), lang (vd 'Vietsub','Lồng tiếng'), total_episodes (số tập). Và danh sách episodes: mỗi tập có episode_number (số), episode_name (vd 'Tập 1'), episode_slug (slug của tập), source_url (URL xem tập tuyệt đối).",
        schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            quality: { type: "string" },
            lang: { type: "string" },
            total_episodes: { type: "number" },
            episodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  episode_number: { type: "number" },
                  episode_name: { type: "string" },
                  episode_slug: { type: "string" },
                  source_url: { type: "string" },
                },
                required: ["episode_number", "episode_name"],
              },
            },
          },
        },
      });

      // Upsert phim
      const { data: movieRow, error: upErr } = await supabase
        .from("donghua_movies")
        .upsert(
          {
            slug,
            name: m.name,
            poster_url: m.poster_url ?? null,
            thumb_url: m.poster_url ?? null,
            source_url: m.source_url,
            year: m.year ?? null,
            quality: detail?.quality ?? null,
            lang: detail?.lang ?? null,
            episode_current: m.episode_current ?? null,
            total_episodes: detail?.total_episodes ?? null,
            description: detail?.description ?? null,
            source: "hoathinh3d",
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single();

      if (upErr || !movieRow) {
        console.error("upsert movie err", slug, upErr);
        continue;
      }
      moviesAdded++;

      const eps = (detail?.episodes ?? []) as Array<{
        episode_number: number;
        episode_name: string;
        episode_slug?: string;
        source_url?: string;
      }>;

      if (eps.length) {
        const rows = eps.map((e) => ({
          movie_id: movieRow.id,
          episode_number: e.episode_number,
          episode_name: e.episode_name,
          episode_slug: e.episode_slug ?? `tap-${e.episode_number}`,
          source_url: e.source_url ?? null,
        }));
        const { error: epErr, count } = await supabase
          .from("donghua_episodes")
          .upsert(rows, { onConflict: "movie_id,episode_number", count: "exact" });
        if (!epErr) episodesAdded += count ?? rows.length;
      }
    }

    await supabase.from("sync_logs").insert({
      source: "hoathinh3d",
      status: "success",
      movies_added: moviesAdded,
      episodes_added: episodesAdded,
    });

    return new Response(
      JSON.stringify({ ok: true, movies_added: moviesAdded, episodes_added: episodesAdded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("sync-donghua failed", msg);
    await supabase.from("sync_logs").insert({
      source: "hoathinh3d",
      status: "error",
      movies_added: moviesAdded,
      episodes_added: episodesAdded,
      error_message: msg.slice(0, 500),
    });
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
