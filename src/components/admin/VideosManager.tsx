import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "./CategoriesManager";
import { parseVideoUrl } from "@/lib/video-embed";

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  views_count: number;
  published: boolean;
  sort_order: number;
}

export default function VideosManager() {
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const [form, setForm] = useState({ title: "", description: "", url: "", thumbnail_url: "", category_id: "", published: true });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_videos"],
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Video[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const auto = parseVideoUrl(form.url);
      const { error } = await supabase.from("videos").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        url: form.url.trim(),
        thumbnail_url: form.thumbnail_url.trim() || auto.thumbnail || null,
        category_id: form.category_id || null,
        published: form.published,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت الإضافة");
      setForm({ title: "", description: "", url: "", thumbnail_url: "", category_id: "", published: true });
      qc.invalidateQueries({ queryKey: ["admin_videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("videos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin_videos"] }); },
  });

  const togglePub = useMutation({
    mutationFn: async (v: Video) => { const { error } = await supabase.from("videos").update({ published: !v.published }).eq("id", v.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_videos"] }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><PlayCircle className="h-4 w-4" /> إضافة فيديو</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>القسم</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.type === "subject" ? "📘 " : "📁 "}{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>الرابط (YouTube / Vimeo / Drive)</Label><Input dir="ltr" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="space-y-1.5"><Label>صورة مصغرة (اختياري)</Label><Input dir="ltr" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
          <div className="flex items-end gap-2"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><span className="text-sm">منشور</span></div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={!form.title.trim() || !form.url.trim() || create.isPending}><Plus className="ml-1 h-4 w-4" /> إضافة</Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">قائمة الفيديوهات ({rows.length})</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد.</p> : (
          <ul className="divide-y">
            {rows.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{v.title}</span>{!v.published && <Badge variant="secondary">مخفي</Badge>}</div>
                  <div dir="ltr" className="truncate text-xs text-muted-foreground">{v.url}</div>
                  <div className="text-xs text-muted-foreground">👁 {v.views_count}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={v.published} onCheckedChange={() => togglePub.mutate(v)} />
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(v.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}