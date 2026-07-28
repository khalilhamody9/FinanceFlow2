alter table public.monthly_reports
add column if not exists semiannual_deductions_status text not null default 'not-ready';

alter table public.monthly_reports
drop constraint if exists monthly_reports_semiannual_deductions_status_check;

alter table public.monthly_reports
add constraint monthly_reports_semiannual_deductions_status_check
check (semiannual_deductions_status in ('ready', 'not-ready'));

notify pgrst, 'reload schema';
