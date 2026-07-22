import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentLessons, StudentVideos, StudentFiles, StudentImages, StudentAnnouncements } from "@/components/student/ContentSections";
import {
  StudentLive,
  StudentCalendar,
  StudentHomeCards,
  StudentSearch,
  StudentProfile,
  StudentHelp,
} from "@/components/student/StudentExtras";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  BookOpen,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  Radio,
  Megaphone,
  Calendar,
  User,
  HelpCircle,
  LogOut,
  GraduationCap,
  Menu,
  Search,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({
    meta: [
      { title: "لوحة الطالب — منصة الأستاذ قاداري" },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "الطالب" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-student.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-student-512.png" },
    ],
  }),
  component: StudentDashboard,
});

const nav = [
  { label: "الرئيسية", icon: Home, key: "home" },
  { label: "الدروس", icon: BookOpen, key: "lessons" },
  { label: "الفيديوهات", icon: PlayCircle, key: "videos" },
  { label: "الملفات", icon: FileText, key: "files" },
  { label: "الصور", icon: ImageIcon, key: "images" },
  { label: "الحصص المباشرة", icon: Radio, key: "live" },
  { label: "الإعلانات", icon: Megaphone, key: "announcements" },
  { label: "التقويم", icon: Calendar, key: "calendar" },
  { label: "البحث", icon: Search, key: "search" },
  { label: "الملف الشخصي", icon: User, key: "profile" },
  { label: "المساعدة", icon: HelpCircle, key: "help" },
];

interface StudentRow {
  full_name: string;
  student_code: string;
}

function StudentDashboard() {
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
      const isStudent = roles?.some((r) => r.role === "student");
      if (!isStudent) {
        await supabase.auth.signOut();
        navigate({ to: "/auth/student" });
        return;
      }
      setChecked(true);
    })();
  }, [navigate]);

  const { data: student } = useQuery({
    queryKey: ["me_student"],
    enabled: checked,
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("full_name, student_code")
        .maybeSingle();
      return data as StudentRow | null;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth/student" });
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
          <GraduationCap className="h-5 w-5" />
          <span>منصة الطالب</span>
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
            <GraduationCap className="h-5 w-5" />
            <span>منصة الطالب</span>
          </div>
          <NavItems onPick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-4 pb-24 sm:p-6 md:p-10">
        {active === "home" ? (
          <div>
            <h1 className="text-2xl font-bold">مرحباً {student?.full_name ?? ""} 👋</h1>
            <p className="mt-1 text-muted-foreground">
              كود الطالب:{" "}
              <span dir="ltr" className="font-mono">
                {student?.student_code ?? "—"}
              </span>
            </p>
            <div className="mt-8 space-y-10">
              <section>
                <h2 className="mb-3 text-lg font-semibold">نظرة سريعة</h2>
                <StudentHomeCards />
              </section>
              <section>
                <h2 className="mb-3 text-lg font-semibold">آخر الإعلانات</h2>
                <StudentAnnouncements />
              </section>
            </div>
          </div>
        ) : active === "lessons" ? (
          <><h1 className="mb-6 text-2xl font-bold">الدروس</h1><StudentLessons /></>
        ) : active === "videos" ? (
          <><h1 className="mb-6 text-2xl font-bold">الفيديوهات</h1><StudentVideos /></>
        ) : active === "files" ? (
          <><h1 className="mb-6 text-2xl font-bold">الملفات</h1><StudentFiles /></>
        ) : active === "images" ? (
          <><h1 className="mb-6 text-2xl font-bold">الصور</h1><StudentImages /></>
        ) : active === "announcements" ? (
          <><h1 className="mb-6 text-2xl font-bold">الإعلانات</h1><StudentAnnouncements /></>
        ) : active === "live" ? (
          <><h1 className="mb-6 text-2xl font-bold">الحصص المباشرة</h1><StudentLive /></>
        ) : active === "calendar" ? (
          <><h1 className="mb-6 text-2xl font-bold">التقويم</h1><StudentCalendar /></>
        ) : active === "search" ? (
          <><h1 className="mb-6 text-2xl font-bold">البحث</h1><StudentSearch /></>
        ) : active === "profile" ? (
          <><h1 className="mb-6 text-2xl font-bold">الملف الشخصي</h1><StudentProfile /></>
        ) : active === "help" ? (
          <><h1 className="mb-6 text-2xl font-bold">المساعدة</h1><StudentHelp /></>
        ) : null}
      </main>
    </div>
  );
}
