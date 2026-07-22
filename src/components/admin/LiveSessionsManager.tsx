import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Radio } from "lucide-react";
import { toast } from "sonner";

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  meeting_url: string;
  published: boolean;
}

const empty = { title: "", description: "", starts_at: "", ends_at: "", meeting_url: "", published: true };

export default function LiveSessionsManager() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...empty });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_live"],
    queryFn: async () => {
      const { data } = await supabase.from("live_sessions").select("*").order("starts_at", { ascending: false });
      return (data ?? []) as LiveSession[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.starts_at || !form.ends_at || !form.meeting_url.trim())
        throw new Error("الرجاء ملء جميع الحقول");
      const { error } = await supabase.from("live_sessions").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        meeting_url: form.meeting_url.trim(),
        published: form.published,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إنشاء الحصة");
      setForm({ ...empty });
      qc.invalidateQueries({ queryKey: ["admin_live"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin_live"] });
    },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Radio className="h-4 w-4" /> حصة جديدة
        </h2>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>الوصف (اختياري)</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>تبدأ في</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>تنتهي في</Label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>رابط الاجتماع</Label>
            <Input dir="ltr" placeholder="https://meet..." value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
            <span className="text-sm">منشورة للطلاب</span>
          </div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="ml-1 h-4 w-4" /> إنشاء
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">الحصص ({rows.length})</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا يوجد.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((s) => {
              const starts = new Date(s.starts_at);
              const ends = new Date(s.ends_at);
              const live = now >= starts && now <= ends;
              const upcoming = now < starts;
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.title}</span>
                      {live && <Badge className="bg-red-600 text-white">مباشر الآن</Badge>}
                      {upcoming && <Badge variant="secondary">قادمة</Badge>}
                      {!live && !upcoming && <Badge variant="outline">انتهت</Badge>}
                      {!s.published && <Badge variant="outline">مخفية</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {starts.toLocaleString("ar")} — {ends.toLocaleString("ar")}
                    </p>
                    <p dir="ltr" className="mt-1 truncate text-xs text-muted-foreground">
                      {s.meeting_url}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
