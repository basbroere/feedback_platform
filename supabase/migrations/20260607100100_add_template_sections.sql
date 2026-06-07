-- Sections-kolom voor het gebundelde functioneringsgesprek-template.
-- Bevat per perspectief een array van TemplateQuestion. Voor andere
-- template-types blijft sections NULL en gebruiken we questions.
alter table templates
  add column if not exists sections jsonb;

-- Voor performance_review_bundle moeten alle vier de secties aanwezig zijn.
-- Of ze niet-leeg zijn checken we in de applicatie (HR kan tijdens bewerken
-- een sectie tijdelijk leeg laten zolang hij niet op 'actief' staat).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'templates_bundle_sections_present'
  ) then
    alter table templates
      add constraint templates_bundle_sections_present
      check (
        type <> 'performance_review_bundle'
        or (
          sections is not null
          and sections ? 'self_reflection'
          and sections ? 'peer_360'
          and sections ? 'manager_prep'
          and sections ? 'upward'
        )
      );
  end if;
end$$;
