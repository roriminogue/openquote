-- Rates are a business's prices: everyone in the business can read them, only owners and admins change them
-- (matching the app). Replaces the "org members manage" policy, which let any member edit them over the API.
DROP POLICY "org members manage" ON public.rate_rules;--> statement-breakpoint
CREATE POLICY "org members read" ON public.rate_rules FOR SELECT TO authenticated
  USING (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "admins insert" ON public.rate_rules FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT private.current_org_id()) AND (SELECT private.is_org_admin()));--> statement-breakpoint
CREATE POLICY "admins update" ON public.rate_rules FOR UPDATE TO authenticated
  USING (org_id = (SELECT private.current_org_id()) AND (SELECT private.is_org_admin()))
  WITH CHECK (org_id = (SELECT private.current_org_id()));--> statement-breakpoint
CREATE POLICY "admins delete" ON public.rate_rules FOR DELETE TO authenticated
  USING (org_id = (SELECT private.current_org_id()) AND (SELECT private.is_org_admin()));
