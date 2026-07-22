import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Megaphone, Pin } from "lucide-react";
import { toast } from "sonner";

interface Announcement { id: string; title: string; body: string; pinned: boolean; published_at: string; expires_at: string | null; }

export default function AnnouncementsManager() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", body: "", pinned: false, expires_at: "" });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false });
      return (data ?? []) as Announcement[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({
        title: form.title.trim(), body: form.body.trim(),
        pinned: form.pinned, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم النشر"); setForm({ title: "", body: "", pinned: false, expires_at: "" }); qc.invalidateQueries({ queryKey: ["admin_announcements"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("announcements").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin_announcements"] }); },
  });
  const togglePin = useMutation({
    mutationFn: async (a: Announcement) => { const { error } = await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_announcements"] }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Megaphone className="h-4 w-4" /> إعلان جديد</h2>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>المحتوى</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>تاريخ الانتهاء (اختياري)</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            <div className="flex items-end gap-2"><Switch checked={form.pinned} onCheckedChange={(v) => setForm({ ...form, pinned: v })} /><span className="text-sm">تثبيت</span></div>
          </div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={!form.title.trim() || !form.body.trim() || create.isPending}><Plus className="ml-1 h-4 w-4" /> نشر</Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">الإعلانات ({rows.length})</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد.</p> : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.title}</span>
                    {a.pinned && <Badge><Pin className="ml-1 h-3 w-3" /> مثبت</Badge>}
                    {a.expires_at && new Date(a.expires_at) < new Date() && <Badge variant="destructive">منتهي</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => togglePin.mutate(a)}><Pin className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}