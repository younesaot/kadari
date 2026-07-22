import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateSiteSettings } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Settings = {
  platform_name: string;
  teacher_name: string;
  teacher_bio: string;
  contact_email: string | null;
  contact_phone: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  student_app_url: string | null;
  admin_app_url: string | null;
  join_requests_enabled: boolean;
};

const empty: Settings = {
  platform_name: "",
  teacher_name: "",
  teacher_bio: "",
  contact_email: "",
  contact_phone: "",
  facebook_url: "",
  youtube_url: "",
  student_app_url: "",
  admin_app_url: "",
  join_requests_enabled: true,
};

export default function SiteSettingsManager() {
  const qc = useQueryClient();
  const save = useServerFn(updateSiteSettings);
  const [form, setForm] = useState<Settings>(empty);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      return data as Settings | null;
    },
  });

  useEffect(() => {
    if (data) setForm({ ...empty, ...data });
  }, [data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save({ data: form });
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <p className="mt-1 text-muted-foreground">معلومات المنصة والهوية.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field label="اسم المنصة">
          <Input value={form.platform_name} onChange={(e) => setForm({ ...form, platform_name: e.target.value })} required />
        </Field>
        <Field label="اسم الأستاذ">
          <Input value={form.teacher_name} onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} required />
        </Field>
        <Field label="نبذة الأستاذ">
          <Textarea rows={3} value={form.teacher_bio} onChange={(e) => setForm({ ...form, teacher_bio: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="بريد التواصل">
            <Input dir="ltr" type="email" value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </Field>
          <Field label="هاتف التواصل">
            <Input dir="ltr" value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          </Field>
          <Field label="رابط فيسبوك">
            <Input dir="ltr" value={form.facebook_url ?? ""} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
          </Field>
          <Field label="رابط يوتيوب">
            <Input dir="ltr" value={form.youtube_url ?? ""} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
          </Field>
          <Field label="رابط تحميل تطبيق الطالب">
            <Input dir="ltr" value={form.student_app_url ?? ""} onChange={(e) => setForm({ ...form, student_app_url: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="رابط تحميل تطبيق الإدارة">
            <Input dir="ltr" value={form.admin_app_url ?? ""} onChange={(e) => setForm({ ...form, admin_app_url: e.target.value })} placeholder="https://..." />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div>
            <div className="font-medium">استقبال طلبات الانضمام</div>
            <div className="text-sm text-muted-foreground">إذا عُطّل، لن يظهر نموذج الطلب.</div>
          </div>
          <Switch
            checked={form.join_requests_enabled}
            onCheckedChange={(v) => setForm({ ...form, join_requests_enabled: v })}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}