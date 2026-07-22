create extension if not exists pgcrypto;

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  reporting_year integer not null check (reporting_year between 2000 and 2200),
  reporting_month integer not null check (reporting_month between 1 and 12),
  vat_status text not null default 'not-ready' check (vat_status in ('ready', 'not-ready')),
  income_tax_status text not null default 'not-ready' check (income_tax_status in ('ready', 'not-ready')),
  national_insurance_status text not null default 'not-ready' check (national_insurance_status in ('ready', 'not-ready')),
  income_tax_deductions_status text not null default 'not-ready' check (income_tax_deductions_status in ('ready', 'not-ready')),
  national_insurance_deductions_status text not null default 'not-ready' check (national_insurance_deductions_status in ('ready', 'not-ready')),
  fuel_refund_status text not null default 'not-ready' check (fuel_refund_status in ('ready', 'not-ready')),
  overall_status text not null default 'not-selected' check (overall_status in ('not-selected', 'ready', 'not-arrived', 'material', 'contacted', 'none')),
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, reporting_year, reporting_month)
);

create table if not exists public.annual_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  reporting_year integer not null check (reporting_year between 2000 and 2200),
  exempt_declaration_status text not null default 'not-ready' check (exempt_declaration_status in ('ready', 'not-ready')),
  capital_declaration_status text not null default 'not-ready' check (capital_declaration_status in ('ready', 'not-ready')),
  annual_report_status text not null default 'not-ready' check (annual_report_status in ('ready', 'not-ready')),
  balance_sheet_status text not null default 'not-ready' check (balance_sheet_status in ('ready', 'not-ready')),
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, reporting_year)
);

create index if not exists monthly_reports_period_idx on public.monthly_reports (organization_id, reporting_year, reporting_month);
create index if not exists annual_reports_year_idx on public.annual_reports (organization_id, reporting_year);

alter table public.monthly_reports enable row level security;
alter table public.annual_reports enable row level security;

drop policy if exists "organization members manage monthly reports" on public.monthly_reports;
create policy "organization members manage monthly reports" on public.monthly_reports
  for all to authenticated
  using (organization_id in (select organization_id from public.profiles where id = auth.uid() and is_active = true))
  with check (organization_id in (select organization_id from public.profiles where id = auth.uid() and is_active = true));

drop policy if exists "organization members manage annual reports" on public.annual_reports;
create policy "organization members manage annual reports" on public.annual_reports
  for all to authenticated
  using (organization_id in (select organization_id from public.profiles where id = auth.uid() and is_active = true))
  with check (organization_id in (select organization_id from public.profiles where id = auth.uid() and is_active = true));

grant select, insert, update, delete on public.monthly_reports to authenticated;
grant select, insert, update, delete on public.annual_reports to authenticated;
