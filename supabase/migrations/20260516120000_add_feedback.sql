-- Feedback-fundament (Fase 1).
-- Eén tabel die alle losstaande feedback dekt: manager-feedback uit een 1-op-1
-- nu, peer-aanvragen en overige bronnen later. Het bestaande peer_feedback
-- blijft puur voor de 360 binnen een functioneringsgesprek.

create type feedback_source as enum (
  'one_on_one',
  'peer_request',
  'performance_review'
);

create type feedback_status as enum (
  'requested',
  'submitted',
  'declined'
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references users(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  source_type feedback_source not null,
  source_id uuid,
  prompt text,
  body text,
  is_cross_team boolean not null default false,
  status feedback_status not null default 'submitted',
  requested_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_recipient_idx on feedback(recipient_id, created_at desc);
create index feedback_author_idx on feedback(author_id);
create index feedback_source_idx on feedback(source_type, source_id);

-- Max één manager-feedback per 1-op-1 per auteur per ontvanger.
create unique index feedback_one_on_one_unique
  on feedback(source_type, source_id, author_id, recipient_id)
  where source_type = 'one_on_one';

-- Trigger: is_cross_team auto-bepalen op basis van team_id verschil tussen
-- author en recipient. Werkt voor alle source_types.
create or replace function set_feedback_cross_team()
returns trigger
language plpgsql
as $$
declare
  recipient_team_id uuid;
  author_team_id uuid;
begin
  select team_id into recipient_team_id from users where id = new.recipient_id;
  select team_id into author_team_id from users where id = new.author_id;

  new.is_cross_team := coalesce(recipient_team_id, '00000000-0000-0000-0000-000000000000'::uuid)
    is distinct from coalesce(author_team_id, '00000000-0000-0000-0000-000000000000'::uuid);

  return new;
end;
$$;

create trigger feedback_cross_team_trg
before insert or update of recipient_id, author_id on feedback
for each row
execute function set_feedback_cross_team();

create trigger feedback_updated_at
before update on feedback
for each row execute function set_updated_at();

alter table feedback disable row level security;
