import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Bắt lỗi render (bao gồm lỗi Suspense/lazy khi tải chunk).
 * Với ChunkLoadError → tự reload 1 lần. Các lỗi khác → hiển thị fallback + nút tải lại.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    const msg = String(error?.message || "");
    const isChunkErr = /Loading chunk|Loading CSS chunk|dynamically imported module|Failed to fetch/i.test(msg);
    if (isChunkErr && typeof sessionStorage !== "undefined" && !sessionStorage.getItem("eb-reloaded")) {
      sessionStorage.setItem("eb-reloaded", "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="text-4xl">😵</div>
          <h1 className="text-xl font-bold">Có lỗi khi tải trang</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Có thể do kết nối mạng chập chờn hoặc bản cập nhật mới. Thử tải lại nhé.
          </p>
          <button
            onClick={() => { sessionStorage.removeItem("eb-reloaded"); window.location.reload(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
