-- REVIEW-ONLY: Do not apply until legacy integrations are confirmed.
-- Existing public.leads has no rows, RLS disabled, and broad anon/auth grants
-- as verified 2026-10-18 in the TitanCore CRM Supabase project.
-- Coordinate with the live site and dashboard owners before production rollout.
BEGIN;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.leads FROM anon, authenticated;
-- No public policies are intentionally created. Only explicitly audited
-- privileged server-side workflows should access customer information.
-- The service_role database role retains its existing grants.
COMMIT;

-- Post-change verification (execute separately):
-- SELECT relrowsecurity FROM pg_class WHERE oid = 'public.leads'::regclass;
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_schema='public' AND table_name='leads'
-- AND grantee IN ('anon','authenticated');
-- Verify live submissions and any intended read paths after deployment.
