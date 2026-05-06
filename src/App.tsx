import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index.tsx";
import MovieDetail from "./pages/MovieDetail.tsx";
import Watch from "./pages/Watch.tsx";
import MovieList from "./pages/MovieList.tsx";
import SearchPage from "./pages/Search.tsx";
import Category from "./pages/Category.tsx";
import Auth from "./pages/Auth.tsx";
import Favorites from "./pages/Favorites.tsx";
import History from "./pages/History.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import WatchParty from "./pages/WatchParty.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

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
                <Route path="/phim/:slug" element={<MovieDetail />} />
                <Route path="/xem/:slug/:episode" element={<Watch />} />
                <Route path="/danh-sach/:type" element={<MovieList />} />
                <Route path="/the-loai/:slug" element={<Category mode="category" />} />
                <Route path="/quoc-gia/:slug" element={<Category mode="country" />} />
                <Route path="/tim-kiem" element={<SearchPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/yeu-thich" element={<Favorites />} />
                <Route path="/lich-su" element={<History />} />
                <Route path="/cai-dat" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
