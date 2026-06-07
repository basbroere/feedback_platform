-- Voeg een optionele titel toe aan een functioneringsgesprek. De manager kan
-- dit invullen om de cyclus een eigen naam te geven ("H1 2026 evaluatie").
-- Optioneel: blijft null als de manager niets invult; UI valt dan terug op de
-- standaard "360 functioneringsgesprek met {medewerker}".

alter table performance_reviews add column if not exists subject text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'performance_reviews_subject_not_blank'
  ) then
    alter table performance_reviews
      add constraint performance_reviews_subject_not_blank
      check (subject is null or length(btrim(subject)) > 0);
  end if;
end$$;
