import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index.tsx";
import MovieDetail from "./pages/MovieDetail.tsx";
import Watch from "./pages/Watch.tsx";
import MovieList from "./pages/MovieList.tsx";
import SearchPage from "./pages/Search.tsx";
import Category from "./pages/Category.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
