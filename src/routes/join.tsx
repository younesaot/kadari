import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { CheckCircle2, Sigma } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "طلب انضمام — منصة الأستاذ قاداري" },
      { name: "description", content: "أرسل طلب الانضمام إلى منصة الأستاذ قاداري." },
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
  component: JoinPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  email: z.string().trim().email("بريد غير صالح").max(255),
  phone: z.string().trim().min(6, "رقم هاتف غير صالح").max(30),
  level: z.string().min(1, "اختر المستوى"),
  wilaya: z.string().trim().min(1, "أدخل الولاية").max(50),
  message: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

function JoinPage() {
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", level: "", wilaya: "", message: "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.from("join_requests").insert({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      level: values.level,
      wilaya: values.wilaya,
      message: values.message || null,
    });
    if (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب. حاول مجدداً.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="mx-auto max-w-3xl px-6 py-16">


        {done ? (
          <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">تم إرسال طلبك بنجاح</h1>
            <p className="mt-3 text-muted-foreground">
              سيراجع الأستاذ طلبك قريباً، وعند القبول ستستلم بيانات الدخول (كود الطالب و PIN) عبر البريد.
            </p>
            <Button onClick={() => navigate({ to: "/" })} className="mt-6">
              العودة إلى الرئيسية
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border bg-card p-8 shadow-sm md:p-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sigma className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">طلب انضمام</h1>
                <p className="text-sm text-muted-foreground">أدخل بياناتك وسنراجع طلبك قريباً.</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <Field label="الاسم الكامل" error={form.formState.errors.full_name?.message}>
                <Input {...form.register("full_name")} placeholder="مثال: محمد بن عبد الله" />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="البريد الإلكتروني" error={form.formState.errors.email?.message}>
                  <Input type="email" dir="ltr" {...form.register("email")} placeholder="you@example.com" />
                </Field>
                <Field label="رقم الهاتف" error={form.formState.errors.phone?.message}>
                  <Input dir="ltr" {...form.register("phone")} placeholder="+213 ..." />
                </Field>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="المستوى الدراسي" error={form.formState.errors.level?.message}>
                  <Select
                    onValueChange={(v) => form.setValue("level", v, { shouldValidate: true })}
                    value={form.watch("level")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1as">السنة الأولى ثانوي</SelectItem>
                      <SelectItem value="2as">السنة الثانية ثانوي</SelectItem>
                      <SelectItem value="3as">السنة الثالثة ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="الولاية" error={form.formState.errors.wilaya?.message}>
                  <Input {...form.register("wilaya")} placeholder="مثال: الجزائر" />
                </Field>
              </div>
              <Field label="رسالة (اختياري)" error={form.formState.errors.message?.message}>
                <Textarea rows={4} {...form.register("message")} placeholder="أي معلومة إضافية تريد إخبار الأستاذ بها." />
              </Field>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </Button>
            </form>
            <div className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
              أتملك حساباً بالفعل؟{" "}
              <Link to="/auth/student" className="font-semibold text-primary hover:underline">
                تسجيل دخول الطالب
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}