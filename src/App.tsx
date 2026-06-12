import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index.tsx";

// Code-split mọi route phụ — giảm bundle khởi đầu (hls.js, supabase realtime, ...)
const MovieDetail = lazy(() => import("./pages/MovieDetail.tsx"));
const Watch = lazy(() => import("./pages/Watch.tsx"));
const MovieList = lazy(() => import("./pages/MovieList.tsx"));
const SearchPage = lazy(() => import("./pages/Search.tsx"));
const Category = lazy(() => import("./pages/Category.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Favorites = lazy(() => import("./pages/Favorites.tsx"));
const History = lazy(() => import("./pages/History.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const WatchParty = lazy(() => import("./pages/WatchParty.tsx"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false } },
});

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
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
                <Route path="*" element={<Suspense fallback={<RouteFallback />}><NotFound /></Suspense>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
