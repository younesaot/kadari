import { createFileRoute } from "@tanstack/react-router";

/**
 * One-shot bootstrap endpoint for the initial admin account.
 * Refuses to run if any admin already exists — safe to leave deployed.
 * POST JSON: { email, password }
 */
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: string; password?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const { email, password } = body;
        if (!email || !password || password.length < 12) {
          return new Response("email + password (>=12 chars) required", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1);
        if (existing && existing.length > 0) {
          return Response.json({ ok: false, reason: "admin_exists" }, { status: 409 });
        }

        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: "admin" },
        });
        if (error || !created.user) {
          return Response.json({ ok: false, error: error?.message ?? "createUser failed" }, { status: 500 });
        }
        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: created.user.id, role: "admin" });
        if (roleErr) {
          return Response.json({ ok: false, error: roleErr.message }, { status: 500 });
        }

        return Response.json({ ok: true, user_id: created.user.id });
      },
    },
  },
});