-- Fase 2: peer feedback aanvragen.
-- Een feedback_request groepeert één template-keuze + optionele context-prompt,
-- en wordt door één of meerdere peers ingevuld. Elke peer-rij leeft in de
-- bestaande feedback-tabel met source_type = 'peer_request' en source_id = feedback_request.id.

create table feedback_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  prompt text,
  created_at timestamptz not null default now()
);

create index feedback_requests_requester_idx
  on feedback_requests(requester_id, created_at desc);

-- Per peer-rij willen we de antwoorden per template-vraag bewaren.
-- Voor 1-op-1 feedback blijft body in gebruik; responses is voor peer_request.
alter table feedback
  add column if not exists responses jsonb not null default '{}'::jsonb;

-- Eén feedback-rij per (request, peer). Voorkomt dubbele uitnodigingen.
create unique index feedback_peer_request_unique
  on feedback(source_id, author_id)
  where source_type = 'peer_request';

-- Voor het tellen van openstaande verzoeken aan een peer.
create index feedback_author_status_idx on feedback(author_id, status);

-- RLS uit voor de demo, consistent met de initial schema.
alter table feedback_requests disable row level security;
