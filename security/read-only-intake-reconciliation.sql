-- Family First intake reconciliation: READ ONLY. No customer fields returned.
-- Run in production CRM project jgpvrblzyznyprtffirw.
-- Netlify Forms snapshot 2026-10-19: 28 submissions across six historical forms.
-- Counts alone cannot prove missing leads. Do NOT bulk replay, delete, or merge submissions.
SELECT 'seller_leads' AS record_type, COALESCE(source,'(none)') AS source_label,
       COUNT(*) AS record_count, MIN(created_at)::date AS oldest_record,
       MAX(created_at)::date AS newest_record
FROM public.seller_leads GROUP BY 1,2
UNION ALL
SELECT 'buyer_leads',COALESCE(source,'(none)'),COUNT(*),
       MIN(created_at)::date,MAX(created_at)::date
FROM public.buyer_leads GROUP BY 1,2
UNION ALL
SELECT 'phone_leads',COALESCE(company,'(none)'),COUNT(*),
       MIN(created_at)::date,MAX(created_at)::date
FROM public.phone_leads GROUP BY 1,2
ORDER BY record_type,source_label;

SELECT COUNT(*) AS verified_intake_count,
       COUNT(DISTINCT submission_id) AS unique_submission_ids
FROM public.ffeg_verified_website_inquiries;

SELECT COUNT(*) AS trust_case_count FROM public.trust_cases;

-- Matching cannot be completed from this SQL alone: the legacy CRM tables
-- lack dedicated Netlify submission IDs and this connector cannot read individual
-- Netlify submission records. Once authorized row-level export is available,
-- reconcile privately by immutable submission ID, then date/contact/property
-- with human review for ambiguous matches. Never expose PII in audit output.
