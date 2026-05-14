-- Voeg een verplicht onderwerp toe aan een 1-op-1.
-- Bestaande rijen krijgen een neutrale placeholder zodat de NOT NULL constraint
-- direct geldt; nieuwe rijen moeten expliciet een onderwerp meekrijgen.

alter table one_on_ones add column subject text;
update one_on_ones set subject = 'Reguliere 1-op-1' where subject is null;
alter table one_on_ones alter column subject set not null;
alter table one_on_ones add constraint one_on_ones_subject_not_blank
  check (length(btrim(subject)) > 0);
