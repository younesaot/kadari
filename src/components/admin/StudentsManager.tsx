import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listStudents,
  toggleStudentActive,
  resetStudentPin,
  deleteStudent,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, KeyRound, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

export default function StudentsManager() {
  const qc = useQueryClient();
  const load = useServerFn(listStudents);
  const toggle = useServerFn(toggleStudentActive);
  const reset = useServerFn(resetStudentPin);
  const remove = useServerFn(deleteStudent);
  const [q, setQ] = useState("");
  const [creds, setCreds] = useState<{ code: string; pin: string } | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["students_admin"],
    queryFn: () => load(),
  });

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!q.trim()) return list;
    const s = q.trim().toLowerCase();
    return list.filter(
      (r: any) =>
        r.full_name?.toLowerCase().includes(s) ||
        r.student_code?.toLowerCase().includes(s) ||
        r.phone?.toLowerCase().includes(s),
    );
  }, [rows, q]);

  async function onToggle(id: string, active: boolean) {
    try {
      await toggle({ data: { id, is_active: !active } });
      toast.success(active ? "تم التعطيل" : "تم التفعيل");
      qc.invalidateQueries({ queryKey: ["students_admin"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
  }
  async function onReset(id: string) {
    try {
      const r = await reset({ data: { id } });
      setCreds({ code: r.code, pin: r.pin });
      qc.invalidateQueries({ queryKey: ["students_admin"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
  }
  async function onDelete(id: string) {
    if (!confirm("حذف الطالب نهائياً؟")) return;
    try {
      await remove({ data: { id } });
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["students_admin"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الطلاب</h1>
          <p className="mt-1 text-muted-foreground">إدارة الحسابات المفعّلة.</p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالاسم أو الكود أو الهاتف"
          className="max-w-xs"
        />
      </div>
      <div className="mt-6 rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الكود</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">المستوى</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  جارٍ التحميل...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  لا يوجد طلاب.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell dir="ltr" className="font-mono">
                  {r.student_code}
                </TableCell>
                <TableCell dir="ltr">{r.phone ?? "—"}</TableCell>
                <TableCell>{r.level ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.is_active ? "default" : "secondary"}>
                    {r.is_active ? "نشط" : "معطّل"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onToggle(r.id, r.is_active)}>
                      <Power className="ml-1 h-4 w-4" />
                      {r.is_active ? "تعطيل" : "تفعيل"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReset(r.id)}>
                      <KeyRound className="ml-1 h-4 w-4" />
                      PIN جديد
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>
                      <Trash2 className="ml-1 h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PIN جديد</DialogTitle>
            <DialogDescription>أرسل البيانات إلى الطالب.</DialogDescription>
          </DialogHeader>
          {creds && (
            <div className="space-y-3">
              {[
                { l: "كود الطالب", v: creds.code },
                { l: "PIN الجديد", v: creds.pin },
              ].map((x) => (
                <div
                  key={x.l}
                  className="flex items-center justify-between rounded-lg border bg-secondary p-3"
                >
                  <div>
                    <div className="text-xs text-muted-foreground">{x.l}</div>
                    <div dir="ltr" className="text-lg font-mono font-semibold">
                      {x.v}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(x.v);
                      toast.success("تم النسخ");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}