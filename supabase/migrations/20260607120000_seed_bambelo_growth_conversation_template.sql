-- Bambelo growth conversation template. Eén gebundeld functioneringsgesprek-
-- template met vier secties (self, peer, manager prep, upward). Idempotent
-- via vaste UUID zodat re-runs of UI-bewerkingen op dezelfde rij landen.
insert into templates (id, type, name, questions, sections, is_active)
values (
  'b4bf0001-0000-4000-8000-000000000001',
  'performance_review_bundle',
  'Bambelo growth conversation',
  '[]'::jsonb,
  jsonb_build_object(
    'self_reflection', jsonb_build_array(
      jsonb_build_object(
        'id', 'self_strengths',
        'label', 'What are your top three strengths and how did you apply them to your work since your last growth conversation?',
        'kind', 'open',
        'required', true
      ),
      jsonb_build_object(
        'id', 'self_dev_scale',
        'label', 'To what extent do you see concrete development opportunities to focus on before your next growth conversation? (1 = none, 5 = many). Name up to three development opportunities and the steps you would like to take.',
        'kind', 'scale_1_5',
        'required', true
      ),
      jsonb_build_object(
        'id', 'self_dev_focus',
        'label', 'Which skills, knowledge areas or competencies would you like to further develop during the next six months? Are there specific projects, responsibilities or experiences that could help you develop these?',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'self_career',
        'label', 'Looking ahead, how would you like to grow within Bambelo? Choose: further develop within my current role / grow towards a different role within my current department / explore opportunities outside my current department / unsure at this moment. Please elaborate on your choice.',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'self_achievements',
        'label', 'Looking back at the past six months, what were your most important achievements and contributions?',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'self_goals_scale',
        'label', 'To what extent did you achieve your goals, KPIs and expected outcomes? (1 = not achieved, 5 = fully achieved). Provide examples and explain any goals or expectations that were not fully achieved.',
        'kind', 'scale_1_5'
      ),
      jsonb_build_object(
        'id', 'self_diff_scale',
        'label', 'To what extent would you do things differently moving forward? (1 = nothing, 5 = a lot). What would you do differently?',
        'kind', 'scale_1_5'
      )
    ),
    'peer_360', jsonb_build_array(
      jsonb_build_object(
        'id', 'peer_continue',
        'label', 'What is one thing your colleague currently does that you would like them to continue doing?',
        'kind', 'open',
        'required', true
      ),
      jsonb_build_object(
        'id', 'peer_impact_scale',
        'label', 'To what extent could your colleague do more to increase their impact and effectiveness? (1 = little room, 5 = a lot of room). What is that one thing?',
        'kind', 'scale_1_5',
        'required', true
      ),
      jsonb_build_object(
        'id', 'peer_diff',
        'label', 'What is one thing your colleague could do differently to support their growth and development? (e.g. start doing, stop doing, or do differently)',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'peer_unique_scale',
        'label', 'To what extent does your colleague bring unique value to the team? (1 = limited, 5 = very much). Please describe what that value is.',
        'kind', 'scale_1_5'
      )
    ),
    'manager_prep', jsonb_build_array(
      jsonb_build_object(
        'id', 'mgr_strengths',
        'label', 'What are this employee''s top three strengths and how have they applied them to their work since the last growth conversation?',
        'kind', 'open',
        'required', true
      ),
      jsonb_build_object(
        'id', 'mgr_dev_scale',
        'label', 'To what extent do you see concrete development opportunities for this employee to focus on before the next growth conversation? (1 = none, 5 = many clear opportunities). Which up to three development opportunities and steps would you suggest?',
        'kind', 'scale_1_5',
        'required', true
      ),
      jsonb_build_object(
        'id', 'mgr_dev_focus',
        'label', 'Which skills, knowledge areas or competencies would have the greatest impact on this employee''s growth over the next six months?',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'mgr_career',
        'label', 'Based on the ambitions and development interests shared by the employee, what opportunities for growth and development do you currently see within Bambelo? Indicate whether these are primarily: within the current role / within the current department / outside the current department / further exploration needed. Provide examples where relevant.',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'mgr_goals_scale',
        'label', 'To what extent did this employee achieve their goals, KPIs and expected outcomes during the past six months? (1 = not achieved, 5 = fully achieved). Provide specific examples, results and context (consider goal achievement, KPI performance, key contributions, areas for improvement and contextual factors).',
        'kind', 'scale_1_5'
      )
    ),
    'upward', jsonb_build_array(
      jsonb_build_object(
        'id', 'up_strengths',
        'label', 'What are your manager''s top strengths as a manager?',
        'kind', 'open',
        'required', true
      ),
      jsonb_build_object(
        'id', 'up_continue_scale',
        'label', 'To what extent is there something your manager currently does that you would like them to continue doing? (1 = hardly, 5 = very much). Name that one thing.',
        'kind', 'scale_1_5'
      ),
      jsonb_build_object(
        'id', 'up_more',
        'label', 'What is one thing your manager could do more of to better support your growth and development?',
        'kind', 'open'
      ),
      jsonb_build_object(
        'id', 'up_diff_scale',
        'label', 'To what extent could your manager do something differently to help you be more effective in your role? (1 = little room, 5 = a lot of room). What is that (e.g. start doing, stop doing, or do differently)?',
        'kind', 'scale_1_5'
      ),
      jsonb_build_object(
        'id', 'up_impact_scale',
        'label', 'To what extent has your manager supported your success, growth and development during the past six months? (1 = hardly, 5 = very strongly). In which areas would you have liked more support?',
        'kind', 'scale_1_5'
      ),
      jsonb_build_object(
        'id', 'up_collab',
        'label', 'Is there anything else you would like to share that could strengthen the collaboration between you and your manager?',
        'kind', 'open'
      )
    )
  ),
  true
)
on conflict (id) do update
  set name = excluded.name,
      sections = excluded.sections,
      is_active = excluded.is_active,
      updated_at = now();

-- Eerdere placeholder-bundle uit de seed wegnemen zodat HR niet kiest uit twee
-- gelijkwaardige opties. Veilig: cycli die hieraan hingen krijgen template_id
-- = null en blijven gewoon zichtbaar.
update performance_reviews
   set template_id = 'b4bf0001-0000-4000-8000-000000000001'
 where template_id in (
   select id from templates
   where type = 'performance_review_bundle'
     and name = 'Halfjaarlijks functioneringsgesprek'
 );

delete from templates
 where type = 'performance_review_bundle'
   and name = 'Halfjaarlijks functioneringsgesprek';
