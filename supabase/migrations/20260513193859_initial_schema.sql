-- Initial schema voor het Bamback feedback platform (gebouwd voor de organisatie Bambelo).
-- Drie modules: 1-op-1, functioneringsgesprek (met 360), beoordelingsgesprek.

-- Eenmalige opschoning van legacy testtabellen uit de exploratiefase.
-- Veilig om mee te draaien op een lege DB; daarna alleen relevant bij db reset.
drop table if exists notifications cascade;
drop table if exists action_items cascade;
drop table if exists evaluations cascade;
drop table if exists peer_feedback cascade;
drop table if exists performance_reviews cascade;
drop table if exists one_on_ones cascade;
drop table if exists templates cascade;
drop table if exists users cascade;
drop table if exists teams cascade;

drop type if exists user_role cascade;
drop type if exists template_type cascade;
drop type if exists performance_review_status cascade;
drop type if exists action_item_status cascade;
drop type if exists action_item_source cascade;

create extension if not exists "pgcrypto";

-- =========================================================================
-- Teams en users
-- =========================================================================

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lead_user_id uuid,
  created_at timestamptz not null default now()
);

create type user_role as enum ('employee', 'manager', 'hr');

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role user_role not null default 'employee',
  team_id uuid references teams(id) on delete set null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table teams
  add constraint teams_lead_user_fk
  foreign key (lead_user_id) references users(id) on delete set null;

create index users_team_id_idx on users(team_id);

-- =========================================================================
-- Templates (rode draad door alle modules)
-- =========================================================================

create type template_type as enum (
  'one_on_one',
  'performance_review',
  'evaluation',
  'peer_360'
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  type template_type not null,
  name text not null,
  -- questions is een array van objecten:
  --   { id, label, kind: 'open' | 'scale_1_5' | 'choice_single' | 'choice_multi',
  --     options?: string[], required?: boolean }
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_type_active_idx on templates(type, is_active);

-- =========================================================================
-- 1-op-1 gesprekken
-- =========================================================================

create table one_on_ones (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references users(id) on delete cascade,
  employee_id uuid not null references users(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  employee_preparation jsonb not null default '{}'::jsonb,
  manager_private_notes text,
  shared_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index one_on_ones_employee_idx on one_on_ones(employee_id, scheduled_at desc);
create index one_on_ones_manager_idx on one_on_ones(manager_id, scheduled_at desc);

-- =========================================================================
-- Functioneringsgesprek (performance review) en 360 peer feedback
-- =========================================================================

create type performance_review_status as enum (
  'draft',
  'collecting_input',
  'ready_for_meeting',
  'completed',
  'cancelled'
);

create table performance_reviews (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references users(id) on delete cascade,
  employee_id uuid not null references users(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  status performance_review_status not null default 'draft',
  cycle_started_at timestamptz not null default now(),
  completed_at timestamptz,
  employee_self_evaluation jsonb not null default '{}'::jsonb,
  manager_preparation jsonb not null default '{}'::jsonb,
  manager_private_notes text,
  shared_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index performance_reviews_employee_idx
  on performance_reviews(employee_id, cycle_started_at desc);

create table peer_feedback (
  id uuid primary key default gen_random_uuid(),
  performance_review_id uuid not null references performance_reviews(id) on delete cascade,
  peer_id uuid not null references users(id) on delete cascade,
  requested_by uuid not null references users(id) on delete set null,
  requested_at timestamptz not null default now(),
  submitted_at timestamptz,
  template_id uuid references templates(id) on delete set null,
  responses jsonb not null default '{}'::jsonb,
  is_cross_team boolean not null default false,
  unique (performance_review_id, peer_id)
);

create index peer_feedback_review_idx on peer_feedback(performance_review_id);
create index peer_feedback_peer_idx on peer_feedback(peer_id, submitted_at);

-- Trigger: is_cross_team auto-bepalen op basis van team_id verschil
-- tussen peer en de medewerker van het bijbehorende functioneringsgesprek.
create or replace function set_peer_feedback_cross_team()
returns trigger
language plpgsql
as $$
declare
  employee_team_id uuid;
  peer_team_id uuid;
begin
  select u.team_id into employee_team_id
  from performance_reviews pr
  join users u on u.id = pr.employee_id
  where pr.id = new.performance_review_id;

  select team_id into peer_team_id
  from users
  where id = new.peer_id;

  new.is_cross_team := coalesce(employee_team_id, '00000000-0000-0000-0000-000000000000'::uuid)
    is distinct from coalesce(peer_team_id, '00000000-0000-0000-0000-000000000000'::uuid);

  return new;
end;
$$;

create trigger peer_feedback_cross_team_trg
before insert or update of peer_id, performance_review_id on peer_feedback
for each row
execute function set_peer_feedback_cross_team();

-- =========================================================================
-- Beoordelingsgesprek
-- =========================================================================

create table evaluations (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references users(id) on delete cascade,
  employee_id uuid not null references users(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  previous_performance_review_id uuid references performance_reviews(id) on delete set null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  employee_self_reflection jsonb not null default '{}'::jsonb,
  -- manager_assessments: per actiepunt of ontwikkelpunt een beoordeling
  --   { action_item_id: { rating: 'achieved' | 'partial' | 'not_achieved' | 'cancelled',
  --                       notes: '...' } }
  manager_assessments jsonb not null default '{}'::jsonb,
  manager_private_notes text,
  shared_summary text,
  employee_acknowledged_at timestamptz,
  employee_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index evaluations_employee_idx
  on evaluations(employee_id, completed_at desc);

-- =========================================================================
-- Actiepunten (verbindende as door alle modules)
-- =========================================================================

create type action_item_status as enum ('open', 'completed', 'expired');
create type action_item_source as enum ('one_on_one', 'performance_review', 'evaluation');

create table action_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  description text not null,
  status action_item_status not null default 'open',
  source_type action_item_source not null,
  source_id uuid not null,
  target_date date,
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index action_items_owner_status_idx on action_items(owner_id, status);
create index action_items_source_idx on action_items(source_type, source_id);

-- =========================================================================
-- Notificaties (in-app)
-- =========================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on notifications(user_id, read_at) where read_at is null;

-- =========================================================================
-- updated_at triggers
-- =========================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger templates_updated_at
before update on templates
for each row execute function set_updated_at();

create trigger one_on_ones_updated_at
before update on one_on_ones
for each row execute function set_updated_at();

create trigger performance_reviews_updated_at
before update on performance_reviews
for each row execute function set_updated_at();

create trigger evaluations_updated_at
before update on evaluations
for each row execute function set_updated_at();

-- =========================================================================
-- RLS uit voor demo. Wordt aangezet zodra Supabase Auth in productie aan gaat.
-- =========================================================================

alter table teams disable row level security;
alter table users disable row level security;
alter table templates disable row level security;
alter table one_on_ones disable row level security;
alter table performance_reviews disable row level security;
alter table peer_feedback disable row level security;
alter table evaluations disable row level security;
alter table action_items disable row level security;
alter table notifications disable row level security;
