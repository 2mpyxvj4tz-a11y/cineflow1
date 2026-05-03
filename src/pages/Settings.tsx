import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Monitor, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Cài đặt - VPhim"; }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name || "");
    });
  }, [user]);

  if (loading) return <div className="px-4 py-20 md:px-12">Đang tải...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, theme_preference: theme }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Đã lưu cài đặt");
  };

  const themes: { value: "light" | "dark" | "system"; label: string; icon: any }[] = [
    { value: "light", label: "Sáng", icon: Sun },
    { value: "dark", label: "Tối", icon: Moon },
    { value: "system", label: "Theo hệ thống", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-12">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Cài đặt</h1>

      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Tài khoản</h2>
        <label className="mb-2 block text-sm text-muted-foreground">Email</label>
        <input value={user.email || ""} disabled className="mb-4 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm" />
        <label className="mb-2 block text-sm text-muted-foreground">Tên hiển thị</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </section>

      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Giao diện</h2>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 rounded-md border-2 p-4 text-sm transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="h-6 w-6" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="rounded-md bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button onClick={() => { signOut(); toast.success("Đã đăng xuất"); }} className="rounded-md border border-border px-6 py-2.5 font-semibold hover:bg-accent">
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
