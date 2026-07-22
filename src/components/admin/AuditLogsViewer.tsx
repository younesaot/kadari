import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/admin.functions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  accept_join_request: "قبول طلب",
  reject_join_request: "رفض طلب",
  activate_student: "تفعيل طالب",
  deactivate_student: "تعطيل طالب",
  reset_student_pin: "إعادة تعيين PIN",
  delete_student: "حذف طالب",
};

export default function AuditLogsViewer() {
  const load = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({ queryKey: ["audit_logs"], queryFn: () => load() });

  return (
    <div>
      <h1 className="text-2xl font-bold">سجل النشاط</h1>
      <p className="mt-1 text-muted-foreground">آخر 200 عملية إدارية.</p>
      <div className="mt-6 rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الإجراء</TableHead>
              <TableHead className="text-right">الهدف</TableHead>
              <TableHead className="text-right">تفاصيل</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  جارٍ التحميل...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  لا يوجد سجل بعد.
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Badge variant="secondary">{labels[r.action] ?? r.action}</Badge>
                </TableCell>
                <TableCell dir="ltr" className="max-w-[220px] truncate text-xs">
                  {r.target ?? "—"}
                </TableCell>
                <TableCell dir="ltr" className="max-w-[280px] truncate text-xs text-muted-foreground">
                  {r.metadata ? JSON.stringify(r.metadata) : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("ar-DZ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}