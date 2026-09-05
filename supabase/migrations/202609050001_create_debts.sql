create extension "pgcrypto";

create type public.debt_type as enum ('owed_to_me', 'i_owe');

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.debt_type not null,
  counterpart_name text not null,
  amount bigint not null,
  note text,
  due_date date,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint debts_counterpart_name_required check (length(trim(counterpart_name)) > 0),
  constraint debts_amount_positive check (amount > 0),
  constraint debts_note_max_length check (note is null or length(note) <= 200)
);

create function public.update_debts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_debts_updated_at
before update on public.debts
for each row
execute function public.update_debts_updated_at();

alter table public.debts enable row level security;

create policy "Users can select their own debts"
on public.debts
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own debts"
on public.debts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own debts"
on public.debts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own debts"
on public.debts
for delete
to authenticated
using (user_id = auth.uid());
