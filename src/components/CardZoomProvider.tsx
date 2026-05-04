import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ZoomState {
  src: string;
  rect: DOMRect;
  to: string;
  borderRadius: number;
}

interface Ctx {
  openZoom: (e: React.MouseEvent, opts: { src: string; to: string; borderRadius?: number }) => void;
}

const ZoomCtx = createContext<Ctx | null>(null);

export function useCardZoom() {
  const ctx = useContext(ZoomCtx);
  if (!ctx) throw new Error("useCardZoom must be used inside CardZoomProvider");
  return ctx;
}

export function CardZoomProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ZoomState | null>(null);
  const [phase, setPhase] = useState<"start" | "expand" | "done">("start");
  const navigate = useNavigate();
  const navTimer = useRef<number | null>(null);

  const openZoom = useCallback<Ctx["openZoom"]>((e, { src, to, borderRadius = 6 }) => {
    // Find the nearest element with bounding rect (the card link)
    const el = (e.currentTarget as HTMLElement).closest("a, [data-zoom-target]") as HTMLElement | null;
    const target = el ?? (e.currentTarget as HTMLElement);
    const rect = target.getBoundingClientRect();
    e.preventDefault();
    e.stopPropagation();
    setState({ src, rect, to, borderRadius });
    setPhase("start");
    // Trigger transition on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("expand"));
    });
    if (navTimer.current) window.clearTimeout(navTimer.current);
    navTimer.current = window.setTimeout(() => {
      navigate(to);
      // Keep the overlay one extra frame so the destination paints under it
      window.setTimeout(() => {
        setPhase("done");
        setState(null);
      }, 60);
    }, 520);
  }, [navigate]);

  useEffect(() => () => { if (navTimer.current) window.clearTimeout(navTimer.current); }, []);

  return (
    <ZoomCtx.Provider value={{ openZoom }}>
      {children}
      {state && (
        <div
          className="pointer-events-none fixed inset-0 z-[100]"
          aria-hidden
        >
          {/* Backdrop fade */}
          <div
            className="absolute inset-0 bg-background transition-opacity duration-500 ease-out"
            style={{ opacity: phase === "expand" ? 1 : 0 }}
          />
          {/* Zooming image - FLIP from card rect to fullscreen */}
          <div
            className="absolute overflow-hidden will-change-transform"
            style={{
              top: phase === "expand" ? 0 : state.rect.top,
              left: phase === "expand" ? 0 : state.rect.left,
              width: phase === "expand" ? "100vw" : state.rect.width,
              height: phase === "expand" ? "100vh" : state.rect.height,
              borderRadius: phase === "expand" ? 0 : state.borderRadius,
              boxShadow: phase === "expand"
                ? "0 0 0 0 rgba(0,0,0,0)"
                : "0 30px 80px -20px rgba(0,0,0,0.8)",
              transition:
                "top 520ms cubic-bezier(0.32, 0.72, 0, 1)," +
                "left 520ms cubic-bezier(0.32, 0.72, 0, 1)," +
                "width 520ms cubic-bezier(0.32, 0.72, 0, 1)," +
                "height 520ms cubic-bezier(0.32, 0.72, 0, 1)," +
                "border-radius 520ms cubic-bezier(0.32, 0.72, 0, 1)," +
                "box-shadow 520ms ease-out",
            }}
          >
            <img
              src={state.src}
              alt=""
              className="h-full w-full object-cover"
              style={{
                transform: phase === "expand" ? "scale(1.04)" : "scale(1)",
                transition: "transform 520ms cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
              style={{
                opacity: phase === "expand" ? 1 : 0,
                transition: "opacity 400ms ease-out 120ms",
              }}
            />
          </div>
        </div>
      )}
    </ZoomCtx.Provider>
  );
}
