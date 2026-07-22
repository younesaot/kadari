import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "./CategoriesManager";

interface ImageRow { id: string; title: string | null; storage_path: string; public_url: string; category_id: string | null; }

const BUCKET = "content-images";

export default function ImagesManager() {
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_images"],
    queryFn: async () => {
      const { data } = await supabase.from("images").select("*").order("created_at", { ascending: false });
      return (data ?? []) as ImageRow[];
    },
  });

  async function upload() {
    if (!file) return;
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      const publicUrl = signed?.signedUrl ?? "";
      const { error } = await supabase.from("images").insert({
        title: title.trim() || null,
        storage_path: path,
        public_url: publicUrl,
        category_id: categoryId || null,
      });
      if (error) throw error;
      toast.success("تم الرفع");
      setFile(null); setTitle(""); setCategoryId("");
      qc.invalidateQueries({ queryKey: ["admin_images"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  const del = useMutation({
    mutationFn: async (r: ImageRow) => {
      await supabase.storage.from(BUCKET).remove([r.storage_path]);
      const { error } = await supabase.from("images").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin_images"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><ImageIcon className="h-4 w-4" /> رفع صورة</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>العنوان (اختياري)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>القسم</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.type === "subject" ? "📘 " : "📁 "}{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>الصورة</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        </div>
        <Button className="mt-4" onClick={upload} disabled={!file || uploading}><Upload className="ml-1 h-4 w-4" /> {uploading ? "جارٍ الرفع..." : "رفع"}</Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">المعرض ({rows.length})</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد صور.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((r) => (
              <div key={r.id} className="group relative overflow-hidden rounded-lg border">
                <img src={r.public_url} alt={r.title ?? ""} className="aspect-square w-full object-cover" />
                <button onClick={() => del.mutate(r)} className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                {r.title && <div className="p-2 text-xs">{r.title}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}