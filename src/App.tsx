import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazyRetry } from "@/lib/lazy-retry";
import Index from "./pages/Index.tsx";

// Code-split mọi route phụ — có retry + auto-reload nếu chunk lỗi (hết màn đen sau deploy)
const MovieDetail = lazyRetry(() => import("./pages/MovieDetail.tsx"), "MovieDetail");
const Watch = lazyRetry(() => import("./pages/Watch.tsx"), "Watch");
const MovieList = lazyRetry(() => import("./pages/MovieList.tsx"), "MovieList");
const SearchPage = lazyRetry(() => import("./pages/Search.tsx"), "Search");
const Category = lazyRetry(() => import("./pages/Category.tsx"), "Category");
const Auth = lazyRetry(() => import("./pages/Auth.tsx"), "Auth");
const Favorites = lazyRetry(() => import("./pages/Favorites.tsx"), "Favorites");
const History = lazyRetry(() => import("./pages/History.tsx"), "History");
const Settings = lazyRetry(() => import("./pages/Settings.tsx"), "Settings");
const NotFound = lazyRetry(() => import("./pages/NotFound.tsx"), "NotFound");
const WatchParty = lazyRetry(() => import("./pages/WatchParty.tsx"), "WatchParty");
const Live = lazyRetry(() => import("./pages/Live.tsx"), "Live");

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false } },
});

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/phim/:slug" element={<Suspense fallback={<RouteFallback />}><MovieDetail /></Suspense>} />
                  <Route path="/xem/:slug/:episode" element={<Suspense fallback={<RouteFallback />}><Watch /></Suspense>} />
                  <Route path="/danh-sach/:type" element={<Suspense fallback={<RouteFallback />}><MovieList /></Suspense>} />
                  <Route path="/the-loai/:slug" element={<Suspense fallback={<RouteFallback />}><Category mode="category" /></Suspense>} />
                  <Route path="/quoc-gia/:slug" element={<Suspense fallback={<RouteFallback />}><Category mode="country" /></Suspense>} />
                  <Route path="/tim-kiem" element={<Suspense fallback={<RouteFallback />}><SearchPage /></Suspense>} />
                  <Route path="/auth" element={<Suspense fallback={<RouteFallback />}><Auth /></Suspense>} />
                  <Route path="/yeu-thich" element={<Suspense fallback={<RouteFallback />}><Favorites /></Suspense>} />
                  <Route path="/lich-su" element={<Suspense fallback={<RouteFallback />}><History /></Suspense>} />
                  <Route path="/cai-dat" element={<Suspense fallback={<RouteFallback />}><Settings /></Suspense>} />
                  <Route path="/phong/:code" element={<Suspense fallback={<RouteFallback />}><WatchParty /></Suspense>} />
                  <Route path="/truc-tiep" element={<Suspense fallback={<RouteFallback />}><Live /></Suspense>} />
                  <Route path="*" element={<Suspense fallback={<RouteFallback />}><NotFound /></Suspense>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
