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
import { Trash2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "./CategoriesManager";

interface FileRow { id: string; title: string; description: string | null; url: string; category_id: string | null; published: boolean; }

export default function FilesManager() {
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const [form, setForm] = useState({ title: "", description: "", url: "", category_id: "", published: true });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_files"],
    queryFn: async () => {
      const { data } = await supabase.from("files").select("*").order("created_at", { ascending: false });
      return (data ?? []) as FileRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("files").insert({
        title: form.title.trim(), description: form.description.trim() || null,
        url: form.url.trim(), category_id: form.category_id || null, published: form.published,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تمت الإضافة"); setForm({ title: "", description: "", url: "", category_id: "", published: true }); qc.invalidateQueries({ queryKey: ["admin_files"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("files").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin_files"] }); },
  });
  const togglePub = useMutation({
    mutationFn: async (f: FileRow) => { const { error } = await supabase.from("files").update({ published: !f.published }).eq("id", f.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_files"] }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> إضافة ملف</h2>
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
          <div className="space-y-1.5 sm:col-span-2"><Label>رابط Google Drive</Label><Input dir="ltr" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="flex items-end gap-2"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><span className="text-sm">منشور</span></div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={!form.title.trim() || !form.url.trim() || create.isPending}><Plus className="ml-1 h-4 w-4" /> إضافة</Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">قائمة الملفات ({rows.length})</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد.</p> : (
          <ul className="divide-y">
            {rows.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{f.title}</span>{!f.published && <Badge variant="secondary">مخفي</Badge>}</div>
                  <div dir="ltr" className="truncate text-xs text-muted-foreground">{f.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={f.published} onCheckedChange={() => togglePub.mutate(f)} />
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(f.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}