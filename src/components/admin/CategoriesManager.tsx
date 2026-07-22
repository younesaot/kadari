import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, FolderTree } from "lucide-react";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  type: "subject" | "unit";
  parent_id: string | null;
  sort_order: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
      return (data ?? []) as Category[];
    },
  });
}

export default function CategoriesManager() {
  const qc = useQueryClient();
  const { data: cats = [], isLoading } = useCategories();
  const [name, setName] = useState("");
  const [type, setType] = useState<"subject" | "unit">("subject");
  const [parentId, setParentId] = useState<string>("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: name.trim(),
        type,
        parent_id: type === "unit" ? parentId || null : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الإضافة");
      setName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subjects = cats.filter((c) => c.type === "subject");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><FolderTree className="h-4 w-4" /> إضافة قسم / وحدة</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>النوع</Label>
            <Select value={type} onValueChange={(v) => setType(v as "subject" | "unit")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="subject">مادة</SelectItem>
                <SelectItem value="unit">وحدة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "unit" && (
            <div className="space-y-1.5">
              <Label>المادة الأم</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>الاسم</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: التحليل" />
          </div>
        </div>
        <Button className="mt-4" onClick={() => create.mutate()} disabled={!name.trim() || (type === "unit" && !parentId) || create.isPending}>
          <Plus className="ml-1 h-4 w-4" /> إضافة
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">الشجرة</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> :
          subjects.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مواد بعد.</p> :
          <ul className="space-y-3">
            {subjects.map((s) => (
              <li key={s.id}>
                <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-3">
                  <span className="font-semibold">📘 {s.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <ul className="mt-2 mr-6 space-y-1">
                  {cats.filter((u) => u.parent_id === s.id).map((u) => (
                    <li key={u.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>📁 {u.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}