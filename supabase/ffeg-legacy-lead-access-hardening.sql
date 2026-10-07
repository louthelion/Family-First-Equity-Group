begin; revoke select, update, delete, truncate, references, trigger on public.seller_leads, public.buyer_leads, public.phone_leads, public.trust_cases from anon; commit;

begin;
do $$ declare p record; t text; begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('seller_leads','buyer_leads','phone_leads','trust_cases') and cmd in ('SELECT','UPDATE') loop
 execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
 foreach t in array array['seller_leads','buyer_leads','phone_leads','trust_cases'] loop
 execute format('create policy ffeg_owner_read on public.%I for select to authenticated using (lower(auth.jwt()->>''email'')=''ludersdossous@titancoreholdings.com'' and coalesce(auth.jwt()->''app_metadata''->>''ffeg_active'',''true'')<>''false'')',t);
 execute format('create policy ffeg_owner_update on public.%I for update to authenticated using (lower(auth.jwt()->>''email'')=''ludersdossous@titancoreholdings.com'' and coalesce(auth.jwt()->''app_metadata''->>''ffeg_active'',''true'')<>''false'') with check (lower(auth.jwt()->>''email'')=''ludersdossous@titancoreholdings.com'' and coalesce(auth.jwt()->''app_metadata''->>''ffeg_active'',''true'')<>''false'')',t);
 end loop;
end $$;
revoke truncate,trigger,references,delete on public.seller_leads,public.buyer_leads,public.phone_leads,public.trust_cases from authenticated;
commit;