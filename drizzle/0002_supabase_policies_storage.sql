-- Supabase: tenant isolation, storage buckets and pgvector.
--
-- Every row belongs to an organisation. A signed-in user (role "authenticated") can only reach rows of the
-- organisation in their public.users row. Anonymous visitors get nothing; the public proposal page reads
-- through the server, which connects as the database owner and bypasses RLS.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;--> statement-breakpoint

-- Helpers live outside the API-exposed public schema. SECURITY DEFINER lets them read public.users without
-- tripping that table's own policy (which calls them).
CREATE SCHEMA IF NOT EXISTS private;--> statement-breakpoint
GRANT USAGE ON SCHEMA private TO authenticated;--> statement-breakpoint
CREATE FUNCTION private.current_org_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT org_id FROM public.users WHERE id = (SELECT auth.uid())
$$;--> statement-breakpoint
CREATE FUNCTION private.is_org_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role IN ('owner', 'admin'))
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION private.current_org_id(), private.is_org_admin() FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.current_org_id(), private.is_org_admin() TO authenticated;--> statement-breakpoint

-- Organisation and members: read your own org; only owners/admins edit it. Creating orgs and adding members
-- happens server-side (onboarding), so there are no insert/delete policies.
CREATE POLICY "members read own org" ON public.organisations FOR SELECT TO authenticated
  USING (id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "admins update own org" ON public.organisations FOR UPDATE TO authenticated
  USING (id = (SELECT private.current_org_id()) AND (SELECT private.is_org_admin()))
  WITH CHECK (id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "members read org members" ON public.users FOR SELECT TO authenticated
  USING (org_id = (SELECT private.current_org_id()));--> statement-breakpoint

-- Tables with their own org_id.
CREATE POLICY "org members manage" ON public.rate_rules FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.ai_instructions FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.clients FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.estimates FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.invoices FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.attachments FOR ALL TO authenticated
  USING (org_id = (SELECT private.current_org_id())) WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint

-- Child tables reach their org through the parent (whose own policy also applies inside the subquery).
CREATE POLICY "org members manage" ON public.client_contacts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.org_id = (SELECT private.current_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.org_id = (SELECT private.current_org_id())));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.line_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND e.org_id = (SELECT private.current_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND e.org_id = (SELECT private.current_org_id())));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.line_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.line_groups g JOIN public.estimates e ON e.id = g.estimate_id
    WHERE g.id = group_id AND e.org_id = (SELECT private.current_org_id())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.line_groups g JOIN public.estimates e ON e.id = g.estimate_id
    WHERE g.id = group_id AND e.org_id = (SELECT private.current_org_id())));--> statement-breakpoint
CREATE POLICY "org members manage" ON public.proposal_sends FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND e.org_id = (SELECT private.current_org_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND e.org_id = (SELECT private.current_org_id())));--> statement-breakpoint

-- Versions are append-only snapshots.
CREATE POLICY "org members read" ON public.estimate_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND e.org_id = (SELECT private.current_org_id())));--> statement-breakpoint
CREATE POLICY "org members append" ON public.estimate_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND e.org_id = (SELECT private.current_org_id())));--> statement-breakpoint

-- Proposal events are written by the server from the public proposal page; members only read them.
CREATE POLICY "org members read" ON public.proposal_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.proposal_sends s JOIN public.estimates e ON e.id = s.estimate_id
    WHERE s.id = send_id AND e.org_id = (SELECT private.current_org_id())));--> statement-breakpoint

-- scheduled_emails has RLS on and no policies: server-only.

-- Storage. Object paths start with the org id: "<org_id>/<anything>".
--   logos       public read (shown on public proposal pages), images only
--   attachments private: job photos, plans, voice notes, spreadsheets
--   documents   private: generated proposal and invoice PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('logos', 'logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('attachments', 'attachments', false, 52428800, ARRAY[
    'image/*', 'video/*', 'audio/*', 'application/pdf', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('documents', 'documents', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
CREATE POLICY "org members read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('logos', 'attachments', 'documents')
    AND (storage.foldername(name))[1] = (SELECT private.current_org_id())::text);--> statement-breakpoint
CREATE POLICY "org members upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('logos', 'attachments', 'documents')
    AND (storage.foldername(name))[1] = (SELECT private.current_org_id())::text);--> statement-breakpoint
CREATE POLICY "org members update own files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('logos', 'attachments', 'documents')
    AND (storage.foldername(name))[1] = (SELECT private.current_org_id())::text)
  WITH CHECK (bucket_id IN ('logos', 'attachments', 'documents')
    AND (storage.foldername(name))[1] = (SELECT private.current_org_id())::text);--> statement-breakpoint
CREATE POLICY "org members delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('logos', 'attachments', 'documents')
    AND (storage.foldername(name))[1] = (SELECT private.current_org_id())::text);
