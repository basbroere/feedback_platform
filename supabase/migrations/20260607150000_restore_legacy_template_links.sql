-- De vorige fix-migratie heeft te veel cycli naar de Bambelo-bundle gehangen.
-- Antwoorden in oude cycli staan onder andere question-ids (vakmanschap,
-- samenwerking, eigenaarschap, etc.) dan de Bambelo-vragen, en zijn daardoor
-- visueel verdwenen. Hier zetten we oude cycli weer terug op de originele
-- peer_360- en upward_feedback-templates.
--
-- Strategie: seed eerst beide legacy-templates met vaste UUIDs en hun
-- originele vragen, daarna koppelen we performance_reviews waarin antwoorden
-- met oude question-ids voorkomen. Templates blijven 'is_active = false' zodat
-- HR ze niet per ongeluk opnieuw kiest.

insert into templates (id, type, name, questions, is_active)
values (
  'b4bf0002-0000-4000-8000-000000000002',
  'peer_360',
  'Functioneringsgesprek 360 (legacy)',
  jsonb_build_array(
    jsonb_build_object('id', 'vakmanschap', 'label', 'Vakmanschap en kennis', 'kind', 'rating_b_1_5', 'required', true, 'hint', 'Hoe sterk is iemand inhoudelijk in zijn of haar werk?'),
    jsonb_build_object('id', 'samenwerking', 'label', 'Samenwerking', 'kind', 'rating_b_1_5', 'required', true, 'hint', 'Hoe loopt het samen werken in en buiten het team?'),
    jsonb_build_object('id', 'eigenaarschap', 'label', 'Eigenaarschap en initiatief', 'kind', 'rating_b_1_5', 'required', true, 'hint', 'Pakt iemand zelf zaken op en ziet hij of zij wat er gedaan moet worden?'),
    jsonb_build_object('id', 'communicatie', 'label', 'Communicatie', 'kind', 'rating_b_1_5', 'required', true, 'hint', 'Helder, op tijd, en in de juiste toon: schriftelijk en mondeling.'),
    jsonb_build_object('id', 'ontwikkeling', 'label', 'Leervermogen en ontwikkeling', 'kind', 'rating_b_1_5', 'hint', 'Hoe open en gericht leert iemand van feedback en ervaringen?'),
    jsonb_build_object('id', 'open', 'label', 'Wat wil je verder nog meegeven?', 'kind', 'open', 'hint', 'Een algemeen punt, een compliment, of iets dat buiten de scores valt.')
  ),
  false
)
on conflict (id) do update
  set name = excluded.name,
      questions = excluded.questions,
      is_active = false,
      updated_at = now();

insert into templates (id, type, name, questions, is_active)
values (
  'b4bf0003-0000-4000-8000-000000000003',
  'upward_feedback',
  'Feedback aan je manager (legacy)',
  jsonb_build_array(
    jsonb_build_object('id', 'waardering', 'label', 'Wat waardeer je in de samenwerking met je manager?', 'kind', 'open', 'hint', 'Iets concreets dat goed gaat. Een voorbeeld helpt het te laten landen.'),
    jsonb_build_object('id', 'groei', 'label', 'Waar zou je manager in jouw ogen het meest in kunnen groeien?', 'kind', 'open', 'hint', 'Eén punt is genoeg. Beschrijf wat je ziet en wat het effect op jou is.'),
    jsonb_build_object('id', 'meer', 'label', 'Wat zou je willen dat je manager meer doet?', 'kind', 'open'),
    jsonb_build_object('id', 'minder', 'label', 'Wat zou je willen dat je manager minder doet?', 'kind', 'open'),
    jsonb_build_object('id', 'vrij', 'label', 'Iets anders dat je wil meegeven?', 'kind', 'open', 'hint', 'Een compliment, observatie of vraag die buiten de andere punten valt.')
  ),
  false
)
on conflict (id) do update
  set name = excluded.name,
      questions = excluded.questions,
      is_active = false,
      updated_at = now();

-- Hang cycli met oude-format antwoorden terug aan de legacy peer_360-template.
-- Detectie: ze hebben een key uit de oude set in employee_self_evaluation, of
-- er bestaat feedback bij deze cyclus met een oude question-id in responses.
update performance_reviews pr
   set template_id = 'b4bf0002-0000-4000-8000-000000000002'
 where pr.template_id = 'b4bf0001-0000-4000-8000-000000000001'
   and (
     pr.employee_self_evaluation ?| array['vakmanschap','samenwerking','eigenaarschap','communicatie','ontwikkeling','open']
     or exists (
       select 1 from feedback f
       where f.source_id = pr.id
         and f.source_type = 'performance_review'
         and f.responses ?| array['vakmanschap','samenwerking','eigenaarschap','communicatie','ontwikkeling','open']
     )
   );
