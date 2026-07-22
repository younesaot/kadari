import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { acceptJoinRequest, rejectJoinRequest } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sigma,
  Users,
  Inbox,
  BookOpen,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  Radio,
  Megaphone,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  Copy,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { toast } from "sonner";
import CategoriesManager from "@/components/admin/CategoriesManager";
import LessonsManager from "@/components/admin/LessonsManager";
import VideosManager from "@/components/admin/VideosManager";
import FilesManager from "@/components/admin/FilesManager";
import ImagesManager from "@/components/admin/ImagesManager";
import AnnouncementsManager from "@/components/admin/AnnouncementsManager";
import LiveSessionsManager from "@/components/admin/LiveSessionsManager";
import StudentsManager from "@/components/admin/StudentsManager";
import SiteSettingsManager from "@/components/admin/SiteSettingsManager";
import AuditLogsViewer from "@/components/admin/AuditLogsViewer";
import { FolderTree, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard-admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — منصة الأستاذ قاداري" },
      { name: "theme-color", content: "#1E293B" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "الإدارة" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-admin.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-admin-512.png" },
    ],
  }),
  component: AdminDashboard,
});

const nav = [
  { label: "الرئيسية", icon: Sigma, key: "home" },
  { label: "طلبات الانضمام", icon: Inbox, key: "requests" },
  { label: "الطلاب", icon: Users, key: "students" },
  { label: "الأقسام والوحدات", icon: FolderTree, key: "categories" },
  { label: "الدروس", icon: BookOpen, key: "lessons" },
  { label: "الفيديوهات", icon: PlayCircle, key: "videos" },
  { label: "الملفات", icon: FileText, key: "files" },
  { label: "الصور", icon: ImageIcon, key: "images" },
  { label: "الحصص", icon: Radio, key: "live" },
  { label: "الإعلانات", icon: Megaphone, key: "announcements" },
  { label: "سجل النشاط", icon: History, key: "audit" },
  { label: "الإعدادات", icon: Settings, key: "settings" },
];

function AdminDashboard() {
  const [active, setActive] = useState("home");
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!isAdmin) {
        await supabase.auth.signOut();
        navigate({ to: "/admin" });
        return;
      }
      setChecked(true);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/admin" });
  }

  if (!checked)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        جارٍ التحميل...
      </div>
    );

  const NavItems = ({ onPick }: { onPick?: () => void }) => (
    <nav className="p-3">
      {nav.map((n) => (
        <button
          key={n.key}
          onClick={() => {
            setActive(n.key);
            onPick?.();
          }}
          className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
            active === n.key
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <n.icon className="h-4 w-4" />
          {n.label}
        </button>
      ))}
      <button
        onClick={signOut}
        className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 bg-sidebar text-sidebar-foreground md:block">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-bold">
          <Sigma className="h-5 w-5" />
          <span>لوحة الإدارة</span>
        </div>
        <NavItems />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="القائمة"
            className="fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-bold">
            <Sigma className="h-5 w-5" />
            <span>لوحة الإدارة</span>
          </div>
          <NavItems onPick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-4 pb-24 sm:p-6 md:p-10">
        {active === "requests" ? (
          <JoinRequests />
        ) : active === "home" ? (
          <Overview />
        ) : active === "categories" ? (
          <CategoriesManager />
        ) : active === "lessons" ? (
          <LessonsManager />
        ) : active === "videos" ? (
          <VideosManager />
        ) : active === "files" ? (
          <FilesManager />
        ) : active === "images" ? (
          <ImagesManager />
        ) : active === "announcements" ? (
          <AnnouncementsManager />
        ) : active === "live" ? (
          <LiveSessionsManager />
        ) : active === "students" ? (
          <StudentsManager />
        ) : active === "settings" ? (
          <SiteSettingsManager />
        ) : active === "audit" ? (
          <AuditLogsViewer />
        ) : (
          <Placeholder title={nav.find((n) => n.key === active)?.label ?? ""} />
        )}
      </main>
    </div>
  );
}


function Overview() {
  const { data: counts } = useQuery({
    queryKey: ["admin_counts"],
    queryFn: async () => {
      const [pending, students, videos, files, lessons, live] = await Promise.all([
        supabase.from("join_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("files").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("live_sessions").select("*", { count: "exact", head: true }).gte("ends_at", new Date().toISOString()),
      ]);
      return {
        pending: pending.count ?? 0,
        students: students.count ?? 0,
        videos: videos.count ?? 0,
        files: files.count ?? 0,
        lessons: lessons.count ?? 0,
        live: live.count ?? 0,
      };
    },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">مرحباً بك في لوحة الإدارة</h1>
      <p className="mt-1 text-muted-foreground">نظرة عامة على نشاط المنصة.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="طلبات قيد المراجعة" value={counts?.pending ?? 0} icon={Inbox} />
        <StatCard label="عدد الطلاب" value={counts?.students ?? 0} icon={Users} />
        <StatCard label="الدروس" value={counts?.lessons ?? 0} icon={BookOpen} />
        <StatCard label="الفيديوهات" value={counts?.videos ?? 0} icon={PlayCircle} />
        <StatCard label="الملفات" value={counts?.files ?? 0} icon={FileText} />
        <StatCard label="حصص قادمة" value={counts?.live ?? 0} icon={Radio} />
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>ابدأ من هنا</CardTitle>
          <CardDescription>راجع طلبات الانضمام وابدأ بإدارة المحتوى.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            استخدم القائمة الجانبية للتنقل بين الأقسام. أقسام إدارة المحتوى ستُفعّل تدريجياً.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">هذا القسم قيد التطوير وسيُفعّل قريباً.</p>
      </div>
    </div>
  );
}

interface JoinRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  level: string;
  status: "pending" | "accepted" | "rejected";
}

function JoinRequests() {
  const qc = useQueryClient();
  const accept = useServerFn(acceptJoinRequest);
  const reject = useServerFn(rejectJoinRequest);
  const [credentials, setCredentials] = useState<{
    code: string;
    pin: string;
    email: string;
  } | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["join_requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as JoinRow[];
    },
  });

  async function onAccept(id: string) {
    try {
      const res = await accept({ data: { id } });
      setCredentials({ code: res.code, pin: res.pin, email: res.contactEmail });
      qc.invalidateQueries({ queryKey: ["join_requests"] });
      qc.invalidateQueries({ queryKey: ["admin_counts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل قبول الطلب");
    }
  }
  async function onReject(id: string) {
    try {
      await reject({ data: { id } });
      toast.success("تم رفض الطلب");
      qc.invalidateQueries({ queryKey: ["join_requests"] });
      qc.invalidateQueries({ queryKey: ["admin_counts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل رفض الطلب");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">طلبات الانضمام</h1>
      <p className="mt-1 text-muted-foreground">راجع الطلبات الجديدة واقبل أو ارفض كل طلب.</p>
      <div className="mt-6 rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">البريد</TableHead>
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
            {!isLoading && rows?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  لا توجد طلبات.
                </TableCell>
              </TableRow>
            )}
            {rows?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell dir="ltr" className="text-left">
                  {r.email}
                </TableCell>
                <TableCell dir="ltr" className="text-left">
                  {r.phone}
                </TableCell>
                <TableCell>{r.level}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "pending"
                        ? "secondary"
                        : r.status === "accepted"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {r.status === "pending"
                      ? "قيد المراجعة"
                      : r.status === "accepted"
                        ? "مقبول"
                        : "مرفوض"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onAccept(r.id)}>
                        <CheckCircle2 className="ml-1 h-4 w-4" />
                        قبول
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReject(r.id)}>
                        <XCircle className="ml-1 h-4 w-4" />
                        رفض
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">تم</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تم إنشاء حساب الطالب</DialogTitle>
            <DialogDescription>
              أرسل هذه البيانات إلى الطالب على بريده:{" "}
              <span dir="ltr">{credentials?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <CredRow label="كود الطالب" value={credentials?.code ?? ""} />
            <CredRow label="PIN" value={credentials?.pin ?? ""} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-secondary p-3">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div dir="ltr" className="text-lg font-mono font-semibold">
          {value}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("تم النسخ");
        }}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}