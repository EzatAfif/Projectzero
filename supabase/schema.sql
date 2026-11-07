-- Culinary Department Management Portal schema
-- Apply in Supabase SQL Editor. Roles are assigned only through trusted app_metadata (never user-editable user_metadata).
create extension if not exists pgcrypto;

create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = ''
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'student') $$;
create or replace function public.is_department_manager()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.current_app_role() in ('admin', 'lecturer') $$;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_id text not null unique,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  programme text not null,
  semester int not null check (semester between 1 and 12),
  academic_session text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lecturers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  staff_id text not null unique,
  full_name text not null,
  email text,
  created_at timestamptz not null default now()
);
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text not null,
  description text,
  created_at timestamptz not null default now()
);
create table if not exists public.equipment_inventory (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references public.workshops(id) on delete set null,
  name text not null,
  description text,
  total_quantity int not null check (total_quantity >= 0),
  available_quantity int not null check (available_quantity >= 0 and available_quantity <= total_quantity),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.borrowing_requests (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text not null,
  applicant_id text not null,
  programme text not null,
  equipment_id uuid not null references public.equipment_inventory(id) on delete restrict,
  quantity int not null check (quantity > 0),
  purpose text not null,
  borrowing_date date not null,
  expected_return_date date not null,
  workshop_location text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','returned','overdue')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expected_return_date >= borrowing_date)
);
create table if not exists public.learning_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text not null,
  course text not null,
  programme text,
  semester int not null check (semester between 1 and 12),
  file_path text not null unique,
  file_name text not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists students_filters_idx on public.students (programme, semester, academic_session);
create index if not exists borrowing_owner_idx on public.borrowing_requests (applicant_user_id, created_at desc);
create index if not exists borrowing_status_idx on public.borrowing_requests (status, created_at desc);
create index if not exists notes_course_idx on public.learning_notes (semester, course);

-- Enforce inventory reservation on every status transition, including direct authenticated updates.
-- The conditional UPDATE both locks and reserves stock atomically, preventing overbooking races.
create or replace function public.apply_borrowing_stock_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  affected integer;
begin
  if tg_op = 'INSERT' then
    if new.status = 'approved' then
      update public.equipment_inventory set available_quantity = available_quantity - new.quantity, updated_at = now()
      where id = new.equipment_id and available_quantity >= new.quantity;
      get diagnostics affected = row_count;
      if affected = 0 then raise exception 'Insufficient equipment stock'; end if;
    end if;
    return new;
  end if;
  if old.status is distinct from new.status or old.equipment_id is distinct from new.equipment_id or old.quantity is distinct from new.quantity then
    if old.status = 'approved' and (new.status <> 'approved' or new.equipment_id <> old.equipment_id or new.quantity <> old.quantity) then
      update public.equipment_inventory set available_quantity = least(total_quantity, available_quantity + old.quantity), updated_at = now() where id = old.equipment_id;
    end if;
    if new.status = 'approved' and (old.status <> 'approved' or new.equipment_id <> old.equipment_id or new.quantity <> old.quantity) then
      update public.equipment_inventory set available_quantity = available_quantity - new.quantity, updated_at = now()
      where id = new.equipment_id and available_quantity >= new.quantity;
      get diagnostics affected = row_count;
      if affected = 0 then raise exception 'Insufficient equipment stock'; end if;
    end if;
  end if;
  if new.status is distinct from old.status and new.status in ('approved','rejected','returned') then
    new.reviewed_at := now(); new.reviewed_by := auth.uid();
  end if;
  return new;
end;
$$;
drop trigger if exists borrowing_stock_guard on public.borrowing_requests;
create trigger borrowing_stock_guard before insert or update on public.borrowing_requests
for each row execute function public.apply_borrowing_stock_change();

alter table public.students enable row level security;
alter table public.lecturers enable row level security;
alter table public.workshops enable row level security;
alter table public.equipment_inventory enable row level security;
alter table public.borrowing_requests enable row level security;
alter table public.learning_notes enable row level security;

drop policy if exists "Managers manage students" on public.students;
create policy "Managers manage students" on public.students for all to authenticated using (public.is_department_manager()) with check (public.is_department_manager());
drop policy if exists "Students view own student record" on public.students;
create policy "Students view own student record" on public.students for select to authenticated using (auth_user_id = auth.uid());
drop policy if exists "Managers manage lecturers" on public.lecturers;
create policy "Managers manage lecturers" on public.lecturers for all to authenticated using (public.is_department_manager()) with check (public.is_department_manager());
drop policy if exists "Authenticated view workshops" on public.workshops;
create policy "Authenticated view workshops" on public.workshops for select to authenticated using (true);
drop policy if exists "Managers manage workshops" on public.workshops;
create policy "Managers manage workshops" on public.workshops for all to authenticated using (public.is_department_manager()) with check (public.is_department_manager());
drop policy if exists "Authenticated view inventory" on public.equipment_inventory;
create policy "Authenticated view inventory" on public.equipment_inventory for select to authenticated using (true);
drop policy if exists "Managers manage inventory" on public.equipment_inventory;
create policy "Managers manage inventory" on public.equipment_inventory for all to authenticated using (public.is_department_manager()) with check (public.is_department_manager());
drop policy if exists "Applicants view own borrowing requests" on public.borrowing_requests;
create policy "Applicants view own borrowing requests" on public.borrowing_requests for select to authenticated using (applicant_user_id = auth.uid());
drop policy if exists "Applicants submit own borrowing requests" on public.borrowing_requests;
create policy "Applicants submit own borrowing requests" on public.borrowing_requests for insert to authenticated with check (applicant_user_id = auth.uid() and status = 'pending');
drop policy if exists "Managers manage borrowing requests" on public.borrowing_requests;
create policy "Managers manage borrowing requests" on public.borrowing_requests for all to authenticated using (public.is_department_manager()) with check (public.is_department_manager());
drop policy if exists "Authenticated view learning notes" on public.learning_notes;
create policy "Authenticated view learning notes" on public.learning_notes for select to authenticated using (true);
drop policy if exists "Managers manage learning notes" on public.learning_notes;
create policy "Managers manage learning notes" on public.learning_notes for all to authenticated using (public.is_department_manager()) with check (public.is_department_manager());

-- Private bucket: resources are delivered through short-lived signed URLs after RLS-authorized metadata lookup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learning-notes', 'learning-notes', false, 26214400, array['application/pdf','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = 26214400, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Authenticated read learning note objects" on storage.objects;
create policy "Authenticated read learning note objects" on storage.objects for select to authenticated using (bucket_id = 'learning-notes');
drop policy if exists "Managers upload learning note objects" on storage.objects;
create policy "Managers upload learning note objects" on storage.objects for insert to authenticated with check (bucket_id = 'learning-notes' and public.is_department_manager() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Managers delete learning note objects" on storage.objects;
create policy "Managers delete learning note objects" on storage.objects for delete to authenticated using (bucket_id = 'learning-notes' and public.is_department_manager());

-- Assign role from trusted server/admin tooling, never from a client-side profile form:
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb where id = '<user-uuid>';
