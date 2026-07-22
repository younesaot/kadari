import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Radio,
  Calendar as CalendarIcon,
  ExternalLink,
  Star,
  Search as SearchIcon,
  User,
  BookOpen,
  PlayCircle,
  FileText,
  Megaphone,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// ---------------- LIVE SESSIONS ----------------
interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  meeting_url: string;
}

export function StudentLive() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data = [], isLoading } = useQuery({
    queryKey: ["s_live"],
    queryFn: async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("id,title,description,starts_at,ends_at,meeting_url")
        .eq("published", true)
        .order("starts_at", { ascending: true });
      return (data ?? []) as LiveSession[];
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <p className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</p>;
  if (!data.length)
    return (
      <div className="grid place-items-center rounded-2xl border bg-card p-12 text-center">
        <Radio className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">لا توجد حصص مجدولة حالياً.</p>
      </div>
    );

  return (
    <div className="grid gap-3">
      {data.map((s) => {
        const starts = new Date(s.starts_at);
        const ends = new Date(s.ends_at);
        const live = now >= starts && now <= ends;
        const ended = now > ends;
        return (
          <Card key={s.id} className={live ? "border-red-500/70" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span>{s.title}</span>
                {live && <Badge className="bg-red-600 text-white">مباشر الآن</Badge>}
                {!live && !ended && <Badge variant="secondary">قادمة</Badge>}
                {ended && <Badge variant="outline">انتهت</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
              <p className="text-xs text-muted-foreground">
                {starts.toLocaleString("ar")} — {ends.toLocaleTimeString("ar")}
              </p>
              {live ? (
                <Button asChild size="sm">
                  <a href={s.meeting_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="ml-1 h-4 w-4" /> انضم الآن
                  </a>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  {ended ? "انتهت الحصة" : "لم تبدأ بعد"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------- CALENDAR ----------------
export function StudentCalendar() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["s_cal_live"],
    queryFn: async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("id,title,starts_at")
        .eq("published", true)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at");
      return (data ?? []) as { id: string; title: string; starts_at: string }[];
    },
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["s_cal_ann"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,published_at")
        .order("published_at", { ascending: false })
        .limit(20);
      return (data ?? []) as { id: string; title: string; published_at: string }[];
    },
  });

  const events = useMemo(() => {
    const items = [
      ...sessions.map((s) => ({ id: `l-${s.id}`, kind: "حصة" as const, title: s.title, date: new Date(s.starts_at) })),
      ...announcements.map((a) => ({ id: `a-${a.id}`, kind: "إعلان" as const, title: a.title, date: new Date(a.published_at) })),
    ];
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [sessions, announcements]);

  if (!events.length)
    return (
      <div className="grid place-items-center rounded-2xl border bg-card p-12 text-center">
        <CalendarIcon className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">لا توجد أحداث.</p>
      </div>
    );

  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={e.kind === "حصة" ? "default" : "secondary"}>{e.kind}</Badge>
              <span className="font-medium">{e.title}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{e.date.toLocaleString("ar")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------- HOME CARDS ----------------
export function StudentHomeCards() {
  const { data } = useQuery({
    queryKey: ["s_home_cards"],
    queryFn: async () => {
      const [lesson, video, file, ann, next] = await Promise.all([
        supabase.from("lessons").select("id,title").eq("published", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("videos").select("id,title").eq("published", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("files").select("id,title").eq("published", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("announcements").select("id,title,published_at").order("published_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("live_sessions").select("id,title,starts_at").eq("published", true).gte("ends_at", new Date().toISOString()).order("starts_at").limit(1).maybeSingle(),
      ]);
      return {
        lesson: lesson.data,
        video: video.data,
        file: file.data,
        ann: ann.data,
        next: next.data,
      };
    },
  });

  const cards = [
    { icon: BookOpen, label: "آخر درس", value: data?.lesson?.title },
    { icon: PlayCircle, label: "آخر فيديو", value: data?.video?.title },
    { icon: FileText, label: "آخر ملف", value: data?.file?.title },
    { icon: Megaphone, label: "آخر إعلان", value: data?.ann?.title },
    {
      icon: Radio,
      label: "الحصة القادمة",
      value: data?.next ? `${data.next.title} — ${new Date(data.next.starts_at).toLocaleString("ar")}` : undefined,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-card p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <c.icon className="h-5 w-5" />
          </div>
          <div className="text-xs text-muted-foreground">{c.label}</div>
          <div className="mt-1 line-clamp-2 font-medium">{c.value ?? "لا يوجد"}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------- SEARCH ----------------
export function StudentSearch() {
  const [q, setQ] = useState("");
  const term = q.trim();

  const { data: results, isFetching } = useQuery({
    queryKey: ["s_search", term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term}%`;
      const [lessons, videos, files, announcements] = await Promise.all([
        supabase.from("lessons").select("id,title").eq("published", true).ilike("title", like).limit(10),
        supabase.from("videos").select("id,title").eq("published", true).ilike("title", like).limit(10),
        supabase.from("files").select("id,title,url").eq("published", true).ilike("title", like).limit(10),
        supabase.from("announcements").select("id,title").ilike("title", like).limit(10),
      ]);
      return {
        lessons: lessons.data ?? [],
        videos: videos.data ?? [],
        files: files.data ?? [],
        announcements: announcements.data ?? [],
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث في الدروس والفيديوهات والملفات والإعلانات..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pr-9"
        />
      </div>

      {term.length < 2 && (
        <p className="text-sm text-muted-foreground">اكتب حرفين على الأقل للبحث.</p>
      )}
      {term.length >= 2 && isFetching && <p className="text-sm text-muted-foreground">جارٍ البحث...</p>}
      {term.length >= 2 && results && (
        <div className="space-y-6">
          <SearchGroup icon={BookOpen} title="الدروس" items={results.lessons} />
          <SearchGroup icon={PlayCircle} title="الفيديوهات" items={results.videos} />
          <SearchGroup icon={FileText} title="الملفات" items={results.files} />
          <SearchGroup icon={Megaphone} title="الإعلانات" items={results.announcements} />
          {!results.lessons.length && !results.videos.length && !results.files.length && !results.announcements.length && (
            <p className="text-center text-sm text-muted-foreground">لا نتائج.</p>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { id: string; title: string }[];
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 font-medium">
        <Icon className="h-4 w-4" /> {title} ({items.length})
      </h3>
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.id} className="py-2 text-sm">
            {it.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- PROFILE ----------------
interface StudentRow {
  full_name: string;
  student_code: string;
  phone: string | null;
  level: string | null;
  wilaya: string | null;
  last_login_at: string | null;
}

export function StudentProfile() {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [pwOpen, setPwOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me_profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("full_name,student_code,phone,level,wilaya,last_login_at")
        .maybeSingle();
      return data as StudentRow | null;
    },
  });

  const updatePhone = useMutation({
    mutationFn: async (phone: string) => {
      const { error } = await supabase.from("students").update({ phone }).eq("student_code", me?.student_code ?? "");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["me_profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePin = useMutation({
    mutationFn: async () => {
      if (!/^\d{6}$/.test(pin)) throw new Error("يجب أن يتكون PIN من 6 أرقام");
      if (pin !== pin2) throw new Error("لا يتطابقان");
      const { error } = await supabase.auth.updateUser({ password: pin });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تغيير PIN");
      setPin("");
      setPin2("");
      setPwOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOutAll() {
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/auth/student";
  }

  if (!me) return <p className="p-8 text-center text-sm text-muted-foreground">جارٍ التحميل...</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> معلوماتي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="الاسم" value={me.full_name} />
          <Row label="كود الطالب" value={me.student_code} mono />
          <Row label="المستوى" value={me.level ?? "—"} />
          <Row label="الولاية" value={me.wilaya ?? "—"} />
          <div className="space-y-1.5">
            <Label>الهاتف</Label>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                defaultValue={me.phone ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (me.phone ?? "")) updatePhone.mutate(v);
                }}
              />
            </div>
          </div>
          {me.last_login_at && (
            <p className="text-xs text-muted-foreground">
              آخر دخول: {new Date(me.last_login_at).toLocaleString("ar")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> الأمان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setPwOpen(true)}>
            تغيير رمز PIN
          </Button>
          <Button variant="outline" className="w-full" onClick={signOutAll}>
            <LogOut className="ml-1 h-4 w-4" /> تسجيل الخروج من جميع الأجهزة
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير رمز PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>PIN جديد (6 أرقام)</Label>
              <Input dir="ltr" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label>تأكيد</Label>
              <Input dir="ltr" inputMode="numeric" maxLength={6} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} />
            </div>
            <Button className="w-full" onClick={() => changePin.mutate()} disabled={changePin.isPending}>
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : "font-medium"} dir={mono ? "ltr" : undefined}>
        {value}
      </span>
    </div>
  );
}

// ---------------- HELP ----------------
export function StudentHelp() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">كيف أستخدم المنصة؟</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• استعرض <b>الدروس</b> و <b>الفيديوهات</b> و <b>الملفات</b> من القائمة الجانبية.</p>
          <p>• انضم إلى <b>الحصص المباشرة</b> عند بدايتها من قسم «الحصص المباشرة».</p>
          <p>• تابع <b>الإعلانات</b> والتقويم لمعرفة كل جديد.</p>
          <p>• عدّل معلوماتك أو غيّر رمز PIN من صفحة <b>الملف الشخصي</b>.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">تواصل مع الأستاذ</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          إذا واجهتك مشكلة، تواصل مع الأستاذ عبر معلومات الاتصال في صفحة «تواصل».
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- FAVORITE BUTTON (exportable helper) ----------------
export function FavoriteButton({
  itemType,
  itemId,
}: {
  itemType: "video" | "file" | "lesson";
  itemId: string;
}) {
  const qc = useQueryClient();
  const { data: fav } = useQuery({
    queryKey: ["fav", itemType, itemId],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("item_type", itemType).eq("item_id", itemId).maybeSingle();
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (fav) {
        await supabase.from("favorites").delete().eq("id", fav.id);
      } else {
        await supabase.from("favorites").insert({ user_id: u.user.id, item_type: itemType, item_id: itemId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fav", itemType, itemId] }),
  });
  return (
    <Button size="sm" variant="ghost" onClick={() => toggle.mutate()}>
      <Star className={`h-4 w-4 ${fav ? "fill-yellow-400 text-yellow-500" : ""}`} />
    </Button>
  );
}
