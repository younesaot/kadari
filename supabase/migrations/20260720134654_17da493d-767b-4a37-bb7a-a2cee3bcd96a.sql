
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "anyone can submit join request" ON public.join_requests;
CREATE POLICY "anyone can submit join request" ON public.join_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(full_name) BETWEEN 2 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND length(phone) BETWEEN 6 AND 30
    AND length(level) BETWEEN 1 AND 50
    AND length(wilaya) BETWEEN 1 AND 50
    AND status = 'pending'
  );
