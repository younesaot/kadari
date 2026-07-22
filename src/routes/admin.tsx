import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Lock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#1E293B" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "الإدارة" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-admin.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-admin-512.png" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        toast.error("بيانات الدخول غير صحيحة");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("هذا الحساب ليس حساب إدارة");
        return;
      }
      if (!remember) {
        // Session persists by default; if not remembered, clear on tab close by
        // moving token to sessionStorage — Supabase manages this on next refresh.
        try {
          const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
          if (key) {
            const val = localStorage.getItem(key);
            if (val) sessionStorage.setItem(key, val);
            localStorage.removeItem(key);
          }
        } catch {
          /* noop */
        }
      }
      navigate({ to: "/dashboard-admin" });
    } finally {
      setLoading(false);
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error("تعذّر إرسال رابط الاستعادة");
        return;
      }
      toast.success("تم إرسال رابط استعادة كلمة المرور إلى بريدك.");
      setResetOpen(false);
      setResetEmail("");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero-navy px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" />
            منطقة خاصة — لوحة الإدارة
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">تسجيل دخول الإدارة</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              الوصول محصور بحسابات الإدارة المعتمدة فقط.
            </p>
          </div>

          {resetOpen ? (
            <form onSubmit={onReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني للاستعادة</Label>
                <Input
                  dir="ltr"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الإرسال...
                  </>
                ) : (
                  "إرسال رابط الاستعادة"
                )}
              </Button>
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                العودة لتسجيل الدخول
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    dir="ltr"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pr-9"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    dir="ltr"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    id="remember"
                  />
                  تذكرني
                </label>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الدخول...
                  </>
                ) : (
                  "دخول"
                )}
              </Button>
            </form>
          )}

        </div>
        <p className="mt-6 text-center text-xs text-white/50">
          محاولات الدخول مُسجّلة لأغراض الأمان.
        </p>
      </div>
    </div>
  );
}