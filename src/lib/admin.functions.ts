import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function genCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `STD-${n}`;
}
function genPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  const isAdmin = data?.some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden");
}

export const acceptJoinRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: reqErr } = await supabaseAdmin
      .from("join_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (reqErr || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Already processed");

    const code = genCode();
    const pin = genPin();
    const email = `student.${code.toLowerCase()}@qadari.local`;

    const { data: created, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { student_code: code, full_name: req.full_name },
    });
    if (userErr || !created.user) throw new Error(userErr?.message ?? "Failed to create user");

    await supabaseAdmin.from("students").insert({
      user_id: created.user.id,
      student_code: code,
      full_name: req.full_name,
      phone: req.phone,
      level: req.level,
      wilaya: req.wilaya,
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "student" });
    await supabaseAdmin
      .from("join_requests")
      .update({ status: "accepted", reviewed_at: new Date().toISOString(), reviewed_by: context.userId })
      .eq("id", data.id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "accept_join_request",
      target: data.id,
      metadata: { student_code: code, email: req.email },
    });

    return { code, pin, contactEmail: req.email as string };
  });

export const rejectJoinRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("join_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: context.userId })
      .eq("id", data.id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "reject_join_request",
      target: data.id,
    });
    return { ok: true };
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("students")
      .select("id, user_id, student_code, full_name, phone, level, wilaya, is_active, last_login_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleStudentActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("students")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: data.is_active ? "activate_student" : "deactivate_student",
      target: data.id,
    });
    return { ok: true };
  });

export const resetStudentPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: st, error } = await supabaseAdmin
      .from("students")
      .select("user_id, student_code")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !st) throw new Error("Student not found");
    const newPin = genPin();
    const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(st.user_id, {
      password: newPin,
    });
    if (upErr) throw new Error(upErr.message);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "reset_student_pin",
      target: data.id,
      metadata: { student_code: st.student_code },
    });
    return { pin: newPin, code: st.student_code as string };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: st } = await supabaseAdmin
      .from("students")
      .select("user_id, student_code")
      .eq("id", data.id)
      .maybeSingle();
    if (!st) throw new Error("Student not found");
    await supabaseAdmin.auth.admin.deleteUser(st.user_id);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "delete_student",
      target: data.id,
      metadata: { student_code: st.student_code },
    });
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("id, actor_id, action, target, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        platform_name: z.string().min(1),
        teacher_name: z.string().min(1),
        teacher_bio: z.string(),
        contact_email: z.string().email().or(z.literal("")).nullable().optional(),
        contact_phone: z.string().nullable().optional(),
        facebook_url: z.string().url().or(z.literal("")).nullable().optional(),
        youtube_url: z.string().url().or(z.literal("")).nullable().optional(),
        student_app_url: z.string().url().or(z.literal("")).nullable().optional(),
        admin_app_url: z.string().url().or(z.literal("")).nullable().optional(),
        join_requests_enabled: z.boolean(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });