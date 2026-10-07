begin;
create or replace function public.ffeg_ingest_verified_website_inquiry(p_submission_id text,p_form_name text,p_type text,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 existing public.ffeg_verified_website_inquiries%rowtype;
 name_value text; email_value text; phone_value text; address_value text; notes_value text;
 target text; record_id uuid; reused boolean:=false; fingerprint text; dedupe_payload jsonb;
begin
 if p_submission_id !~ '^[A-Za-z0-9_-]{8,160}$' or (p_form_name !~ '^Family-First-' and p_form_name not in ('short-term-rental-review','legacy-property-review')) or p_type not in ('seller','buyer','investor','trust','contact','media','field','property_review','short_term_review')
 then raise exception 'Invalid verified inquiry envelope'; end if;
 if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>250000 then raise exception 'Invalid inquiry payload'; end if;
 if coalesce(p_data->>'bot-field','')<>'' then raise exception 'Honeypot rejected'; end if;
 name_value:=trim(coalesce(nullif(p_data->>'full_name',''),nullif(p_data->>'name',''),concat_ws(' ',p_data->>'first_name',p_data->>'last_name')));
 email_value:=lower(trim(coalesce(p_data->>'email',''))); phone_value:=trim(coalesce(p_data->>'phone',''));
 address_value:=concat_ws(', ',nullif(trim(coalesce(p_data->>'property_address',p_data->>'address',p_data->>'property_location',p_data->>'property_locations','')),''),nullif(p_data->>'city',''),nullif(p_data->>'state',''),nullif(coalesce(p_data->>'zip_code',p_data->>'zip'),''));
 if name_value='' or (email_value='' and phone_value='') then raise exception 'Name and callback channel required'; end if;
 notes_value:=p_data::text;
 -- Transport identity and campaign attribution differ on a repeated inquiry.
 -- Retain them in each ledger entry, but exclude them from lead equivalence.
 dedupe_payload:=p_data-array['submission_uuid','source','form-name','bot-field'];
 target:=case when p_type='seller' then 'seller_leads' when p_type in ('buyer','investor') then 'buyer_leads' when p_type='trust' then 'trust_cases' else 'phone_leads' end;
 fingerprint:=target||':'||email_value||':'||regexp_replace(phone_value,'[^0-9]','','g')||':'||lower(trim(address_value));
 if target<>'seller_leads' then fingerprint:=fingerprint||':'||md5(dedupe_payload::text); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_submission_id,0));
 select * into existing from public.ffeg_verified_website_inquiries where submission_id=p_submission_id;
 if found then return jsonb_build_object('ok',true,'replayed',true,'target_table',existing.target_table,'record_id',existing.target_record_id,'duplicate_reused',existing.duplicate_reused); end if;
 perform pg_advisory_xact_lock(hashtextextended(fingerprint,1));
 -- Preserve each inquiry, reuse a lead only with matching contact AND property.
 if target='seller_leads' then
  select id into record_id from public.seller_leads where lower(trim(coalesce(email,'')))=email_value and regexp_replace(coalesce(phone,''),'[^0-9]','','g')=regexp_replace(phone_value,'[^0-9]','','g') and lower(trim(coalesce(property_address,'')))=lower(trim(address_value)) and address_value<>'' limit 1;
  reused:=record_id is not null;
  if record_id is null then insert into public.seller_leads(source,full_name,phone,email,property_address,reason_for_selling,urgency,notes,status) values ('family_first_website',name_value,phone_value,email_value,address_value,coalesce(p_data->>'selling_reason',p_data->>'desired_outcome',p_data->>'message'),coalesce(p_data->>'selling_timeline',p_data->>'timeline'),notes_value,'new') returning id into record_id; end if;
 elsif target='buyer_leads' then
  -- Separate preference submissions stay separate; only exact repeated payloads reuse.
  select target_record_id into record_id from public.ffeg_verified_website_inquiries where target_table=target and inquiry_type=p_type and (payload-array['submission_uuid','source','form-name','bot-field'])=dedupe_payload limit 1;
  reused:=record_id is not null;
  if record_id is null then insert into public.buyer_leads(source,full_name,phone,email,budget,location_interest,property_type,notes,status) values ('family_first_website',name_value,phone_value,email_value,coalesce(p_data->>'budget',p_data->>'purchase_budget'),coalesce(p_data->>'location_interest',p_data->>'preferred_city',address_value),p_data->>'property_type',notes_value,'new') returning id into record_id; end if;
 elsif target='trust_cases' then
  select target_record_id into record_id from public.ffeg_verified_website_inquiries where target_table=target and (payload-array['submission_uuid','source','form-name','bot-field'])=dedupe_payload limit 1;
  reused:=record_id is not null;
  if record_id is null then insert into public.trust_cases(client_name,phone,email,purpose,property_address,ownership_notes,missing_documents,status) values(name_value,phone_value,email_value,coalesce(p_data->>'purpose','Ownership information intake for professional review'),address_value,notes_value,p_data->>'missing_documents','new') returning id into record_id; end if;
 else
  select target_record_id into record_id from public.ffeg_verified_website_inquiries where target_table=target and inquiry_type=p_type and (payload-array['submission_uuid','source','form-name','bot-field'])=dedupe_payload limit 1;
  reused:=record_id is not null;
  if record_id is null then insert into public.phone_leads(company,caller_name,phone,email,reason_for_call,property_address,ai_receptionist_notes,assigned_department,status) values('Family First',name_value,phone_value,email_value,coalesce(p_data->>'subject',p_data->>'message',p_type),address_value,notes_value,case when p_type='field' then 'Acquisitions / Field Operations' else 'Acquisitions / Administration' end,'new') returning id into record_id; end if;
 end if;
 insert into public.ffeg_verified_website_inquiries(submission_id,form_name,inquiry_type,payload,target_table,target_record_id,duplicate_reused) values(p_submission_id,p_form_name,p_type,p_data,target,record_id,reused);
 return jsonb_build_object('ok',true,'replayed',false,'target_table',target,'record_id',record_id,'duplicate_reused',reused);
end $$;
revoke all on function public.ffeg_ingest_verified_website_inquiry(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.ffeg_ingest_verified_website_inquiry(text,text,text,jsonb) to service_role;
commit;
