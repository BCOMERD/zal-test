-- READ ONLY. Inspect these results before applying team-test.sql to an existing project.
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public' and table_name in ('restaurants','menu_items','zal_orders','profiles','drivers','wallets','transactions')
order by table_name,ordinal_position;
select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname;
select p.proname,pg_get_function_identity_arguments(p.oid) args,p.prosecdef security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'zal_%' order by p.proname;
