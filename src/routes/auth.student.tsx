import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/student")({
  head: () => ({
    meta: [
      { title: "دخول الطالب — منصة الأستاذ قاداري" },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "الطالب" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-student.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-student-512.png" },
    ],
  }),
  component: StudentAuth,
});

function StudentAuth() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Synthetic email format issued at account creation by admin
    const email = `student.${code.trim().toLowerCase()}@qadari.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pin });
    if (error || !data.user) {
      toast.error("كود الطالب أو PIN غير صحيح.");
      setLoading(false);
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isStudent = roles?.some((r) => r.role === "student");
    if (!isStudent) {
      await supabase.auth.signOut();
      toast.error("هذا الحساب غير مفعّل كطالب.");
      setLoading(false);
      return;
    }
    navigate({ to: "/student" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero-navy px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">دخول الطالب</h1>
              <p className="text-sm text-muted-foreground">أدخل كود الطالب و PIN المستلم من الأستاذ.</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>كود الطالب</Label>
              <Input dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="STD-1234" />
            </div>
            <div className="space-y-1.5">
              <Label>PIN</Label>
              <Input dir="ltr" type="password" value={pin} onChange={(e) => setPin(e.target.value)} required placeholder="••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جارٍ الدخول..." : "دخول"}
            </Button>
          </form>

          <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
            لا تملك حساباً؟{" "}
            <Link to="/join" className="font-semibold text-primary hover:underline">
              اطلب الانضمام
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}