import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  BookOpen,
  PlayCircle,
  FileText,
  Radio,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  MessageCircle,
  Mail,
  Phone,
  ArrowLeft,
  Smartphone,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.png.asset.json";
import logo from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة الأستاذ قاداري — رياضيات الثانوي" },
      {
        name: "description",
        content:
          "منصة تعليمية خاصة للأستاذ قاداري وطلابه في مادة الرياضيات للتعليم الثانوي.",
      },
    ],
  }),
  component: HomePage,
});

const features = [
  { icon: BookOpen, title: "دروس منظمة", desc: "دروس هرمية حسب المادة، الوحدة، والدرس." },
  { icon: PlayCircle, title: "فيديوهات مشروحة", desc: "شرح مصور مباشر من الأستاذ داخل المنصة." },
  { icon: FileText, title: "ملفات وتمارين", desc: "PDF ومراجعات وواجبات محدثة بانتظام." },
  { icon: Radio, title: "حصص مباشرة", desc: "حصص مباشرة عبر Google Meet مع تذكيرات." },
  { icon: CalendarDays, title: "تقويم دراسي", desc: "مواعيد الحصص، الاختبارات، والواجبات." },
  { icon: ShieldCheck, title: "منصة خاصة وآمنة", desc: "الوصول للطلاب المعتمدين فقط من الأستاذ." },
];

const subjects = [
  { level: "السنة الأولى ثانوي", topics: "الاشتقاق • النهايات • المتتاليات" },
  { level: "السنة الثانية ثانوي", topics: "الدوال • الأعداد المركبة • الاحتمالات" },
  { level: "السنة الثالثة ثانوي (باك)", topics: "التحليل • الهندسة الفضائية • الجداء السلمي" },
];

const faqs = [
  {
    q: "كيف يمكنني الانضمام إلى المنصة؟",
    a: "أرسل طلب انضمام من صفحة الطلب، وبعد موافقة الأستاذ ستصلك بيانات الدخول (كود الطالب و PIN).",
  },
  {
    q: "هل التسجيل مفتوح للجميع؟",
    a: "لا، المنصة خاصة بطلاب الأستاذ قاداري فقط ويتم قبول الطلبات يدوياً.",
  },
  {
    q: "كيف أدخل حسابي؟",
    a: "من صفحة تسجيل الدخول للطلاب، أدخل كود الطالب و PIN اللذين استلمتهما.",
  },
  {
    q: "هل الحصص المباشرة مسجلة؟",
    a: "نعم، يتم نشر التسجيلات في قسم الفيديوهات بعد كل حصة.",
  },
];

function useSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });
}

function HomePage() {
  const { data: settings } = useSettings();
  const platformName = settings?.platform_name ?? "منصة الأستاذ قاداري";
  const teacherName = settings?.teacher_name ?? "الأستاذ قاداري";
  const studentAppUrl = (settings as { student_app_url?: string | null } | null | undefined)?.student_app_url ?? "";
  const navigate = useNavigate();

  // In PWA standalone mode, skip the landing page entirely.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) navigate({ to: "/auth/student", replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav platformName={platformName} />

      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(8,12,28,0.72), rgba(8,12,28,0.85)), url(${heroBg.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 lg:pt-32 lg:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              منصة تعليمية خاصة للأستاذ وطلابه
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              رياضيات الثانوي، <span className="text-gradient-brand">بأسلوب أوضح</span>
              <br />
              وطريقة أعمق.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl">
              دروس منظمة، فيديوهات مشروحة، حصص مباشرة، وتمارين مختارة — كل ما يحتاجه طالب الثانوي في مادة الرياضيات، مقدمة من {teacherName}.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/join">
                  اطلب الانضمام
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/auth/student">دخول الطالب</Link>
              </Button>
            </div>
          </motion.div>

          {/* Floating stat card */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { k: "+200", v: "طالب" },
              { k: "+150", v: "درس وفيديو" },
              { k: "+95%", v: "نسبة رضا" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="text-3xl font-bold text-white">{s.k}</div>
                <div className="mt-1 text-sm text-white/60">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT TEACHER */}
      <section id="about" className="border-b py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <img
              src={logo.url}
              alt={platformName}
              className="h-56 w-56 rounded-3xl object-cover shadow-xl"
            />
          </div>
          <div>
            <SectionTitle eyebrow="عن الأستاذ" title={`${teacherName}`} />
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {settings?.teacher_bio ??
                "أستاذ رياضيات للتعليم الثانوي مع خبرة تدريس متميزة، يركّز على فهم المفاهيم قبل حفظ القوانين، ويقدّم لطلابه محتوى منظم يواكب متطلبات البكالوريا."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["تحليل", "هندسة", "احتمالات", "متتاليات", "دوال"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b bg-surface-muted py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="مميزات المنصة" title="كل ما يحتاجه الطالب في مكان واحد" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="border-b py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="المواد" title="مستويات التعليم الثانوي" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {subjects.map((s) => (
              <div
                key={s.level}
                className="rounded-2xl border bg-card p-6"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="text-lg font-semibold">{s.level}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.topics}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTALL APP */}
      <InstallAppSection studentAppUrl={studentAppUrl} />

      {/* FAQ */}
      <section id="faq" className="border-b bg-surface-muted py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionTitle eyebrow="الأسئلة الشائعة" title="ما يحتاج الطالب معرفته" />
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`q-${i}`}>
                <AccordionTrigger className="text-right text-base font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-b py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="تواصل معنا" title="نحن هنا للإجابة على استفساراتك" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <ContactCard
              icon={Mail}
              label="البريد الإلكتروني"
              value={settings?.contact_email || "contact@qadari.example"}
            />
            <ContactCard
              icon={Phone}
              label="الهاتف"
              value={settings?.contact_phone || "غير متوفر"}
            />
            <ContactCard icon={MessageCircle} label="طلب انضمام" value="/join" isLink />
          </div>
        </div>
      </section>

      <Footer platformName={platformName} />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  const content = (
    <div className="rounded-2xl border bg-card p-6 transition hover:border-primary/40 hover:shadow-md">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
  if (isLink) {
    return (
      <Link to="/join" className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function Nav({ platformName }: { platformName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <img src={logo.url} alt="" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-base">{platformName}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#top" className="hover:text-foreground">الرئيسية</a>
          <a href="#about" className="hover:text-foreground">عن الأستاذ</a>
          <a href="#subjects" className="hover:text-foreground">المواد</a>
          <a href="#contact" className="hover:text-foreground">تواصل</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth/student">دخول الطالب</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/join">اطلب الانضمام</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer({ platformName }: { platformName: string }) {
  return (
    <footer className="bg-primary py-12 text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2 font-bold">
          <img src={logo.url} alt="" className="h-8 w-8 rounded-lg object-cover" />
          <span>{platformName}</span>
        </div>
        <div className="text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </div>
        <div className="flex items-center gap-4 text-sm text-primary-foreground/70">
          منصة تعليمية خاصة
        </div>
      </div>
    </footer>
  );
}

function InstallAppSection({ studentAppUrl }: { studentAppUrl: string }) {
  const href = studentAppUrl && studentAppUrl.trim().length > 0 ? studentAppUrl : "/auth/student";
  const external = /^https?:\/\//i.test(href);
  return (
    <section
      id="install"
      className="relative overflow-hidden border-b py-24 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(8,12,28,0.85), rgba(8,12,28,0.9)), url(${heroBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80">
            <Smartphone className="h-3.5 w-3.5" />
            تطبيق الطالب
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            حمّل تطبيق الطالب على هاتفك
          </h2>
          <p className="mt-4 max-w-xl text-white/70">
            تجربة أسرع، دخول مباشر، وإشعارات فورية للحصص والدروس الجديدة.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {external ? (
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <a href={href} target="_blank" rel="noopener noreferrer">
                  <Download className="ml-2 h-4 w-4" />
                  تحميل تطبيق الطالب
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/auth/student">
                  <Download className="ml-2 h-4 w-4" />
                  افتح تطبيق الطالب
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <img src={logo.url} alt="" className="h-56 w-56 rounded-3xl object-cover shadow-2xl" />
        </div>
      </div>
    </section>
  );
}
