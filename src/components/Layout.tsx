import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CardZoomProvider } from "./CardZoomProvider";

export function Layout() {
  return (
    <CardZoomProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-16">
          <Outlet />
        </main>
        <Footer />
      </div>
    </CardZoomProvider>
  );
}
