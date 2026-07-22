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
import { Trash2, Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "./CategoriesManager";

interface Lesson { id: string; title: string; content: string | null; category_id: string | null; published: boolean; sort_order: number; }

export default function LessonsManager() {
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const [form, setForm] = useState({ title: "", content: "", category_id: "", published: true });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_lessons"],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Lesson[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lessons").insert({
        title: form.title.trim(), content: form.content.trim() || null,
        category_id: form.category_id || null, published: form.published,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تمت الإضافة"); setForm({ title: "", content: "", category_id: "", published: true }); qc.invalidateQueries({ queryKey: ["admin_lessons"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lessons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin_lessons"] }); },
  });
  const togglePub = useMutation({
    mutationFn: async (l: Lesson) => { const { error } = await supabase.from("lessons").update({ published: !l.published }).eq("id", l.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_lessons"] }),
  });

  const units = cats.filter((c) => c.type === "unit");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4" /> إضافة درس</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>الوحدة</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>{units.map((u) => <SelectItem key={u.id} value={u.id}>📁 {u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>المحتوى (نص/Markdown)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} /></div>
          <div className="flex items-end gap-2"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><span className="text-sm">منشور</span></div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={!form.title.trim() || create.isPending}><Plus className="ml-1 h-4 w-4" /> إضافة</Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">قائمة الدروس ({rows.length})</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد.</p> : (
          <ul className="divide-y">
            {rows.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{l.title}</span>{!l.published && <Badge variant="secondary">مخفي</Badge>}</div>
                  {l.content && <p className="line-clamp-1 text-xs text-muted-foreground">{l.content}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={l.published} onCheckedChange={() => togglePub.mutate(l)} />
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}