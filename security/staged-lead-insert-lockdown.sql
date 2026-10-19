-- REVIEW ONLY: coordinated Family First lead-table insert lockdown.
-- Do not execute until the new server-side Netlify intake handler is deployed
-- with a valid production-only secret AND end-to-end tests plus rollback pass.
-- Legacy published submission-created.js may still rely on anonymous inserts.
-- Preflight: snapshot role grants, pg_policies, and counts; verify Netlify Forms
-- durable capture, seller/buyer/trust/contact routes, idempotent retry, and dashboard reads.
BEGIN;
-- Remove broad public write policies. These are INSERT only; preserve owner
-- SELECT/UPDATE RLS policies and privileged service-role access.
DROP POLICY IF EXISTS "Allow public insert seller_leads" ON public.seller_leads;
DROP POLICY IF EXISTS "dashboard can insert seller leads" ON public.seller_leads;
DROP POLICY IF EXISTS "Allow public insert buyer_leads" ON public.buyer_leads;
DROP POLICY IF EXISTS "dashboard can insert buyer leads" ON public.buyer_leads;
DROP POLICY IF EXISTS "Allow public insert phone_leads" ON public.phone_leads;
DROP POLICY IF EXISTS "dashboard can insert phone leads" ON public.phone_leads;
DROP POLICY IF EXISTS "Allow public insert trust_cases" ON public.trust_cases;
REVOKE INSERT ON public.seller_leads, public.buyer_leads,
  public.phone_leads, public.trust_cases FROM anon, authenticated;
COMMIT;
-- Postflight: verify anon/auth INSERT grants and INSERT policies both absent;
-- verify approved owner read/update and server service-role CRUD preserved;
-- verify a new controlled website submission creates exactly one CRM record
-- and a matching ffeg_verified_website_inquiries receipt, including safe retry.
-- Rollback (ONLY if required for immediate service restoration):
-- Re-grant INSERT and restore prior exact policies from the saved preflight,
-- then immediately investigate why server delivery failed. Avoid a prolonged
-- public-insert window; do not use rollback as the planned steady state.
