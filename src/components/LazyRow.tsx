import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Chiều cao placeholder trước khi mount (giữ layout ổn định, tránh layout shift) */
  minHeight?: number;
  /** Khoảng cách bắt đầu mount trước khi vào viewport */
  rootMargin?: string;
  /** Callback khi hàng visible — dùng để bật useQuery `enabled` */
  onVisible?: () => void;
}

/**
 * Chỉ render `children` khi gần vào viewport. Một khi đã mount thì giữ luôn (không unmount).
 * Mục tiêu: giảm DOM nodes & event listeners trên trang chủ.
 */
export function LazyRow({ children, minHeight = 360, rootMargin = "150px", onVisible }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      onVisible?.();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          onVisible?.();
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin, onVisible]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
