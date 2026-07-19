import { lazy, type ComponentType } from "react";

/**
 * lazy() với retry + auto-reload khi chunk cũ bị mất (thường xảy ra sau deploy mới
 * hoặc mạng chập chờn → màn hình đen). Thử tối đa 3 lần, sau đó force reload 1 lần
 * (đánh dấu trong sessionStorage để không loop vô hạn).
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  name: string
) {
  return lazy(async () => {
    const key = `chunk-reload:${name}`;
    try {
      return await retry(factory, 3, 400);
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      const isChunkErr = /Loading chunk|Loading CSS chunk|dynamically imported module|Failed to fetch/i.test(msg);
      if (isChunkErr && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        // Trả về component rỗng trong lúc reload để tránh throw thêm.
        return { default: (() => null) as unknown as T };
      }
      throw err;
    }
  });
}

async function retry<T>(fn: () => Promise<T>, times: number, delay: number): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (times <= 1) throw e;
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, times - 1, delay * 2);
  }
}
