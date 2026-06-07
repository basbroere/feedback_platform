-- Tweede gebundeld functioneringsgesprek-template: korte statements die op
-- de Bamback-schaal (1-5) gescoord worden, met ruimte voor toelichting in
-- het commentaarveld. Bedoeld als snellere variant naast de uitgebreidere
-- "Bambelo growth conversation". Idempotent via vaste UUID.
insert into templates (id, type, name, questions, sections, is_active)
values (
  'b4bf0004-0000-4000-8000-000000000004',
  'performance_review_bundle',
  'Bambelo growth check',
  '[]'::jsonb,
  jsonb_build_object(
    'self_reflection', jsonb_build_array(
      jsonb_build_object('id', 'self_strengths',    'label', 'Strengths',    'hint', 'I use my strengths effectively in my work.',                       'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'self_openness',     'label', 'Openness',     'hint', 'I am open to feedback and development.',                          'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'self_growth',       'label', 'Growth',       'hint', 'I have shown growth since my last growth conversation.',          'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'self_goals',        'label', 'Goals',        'hint', 'I meet my goals and KPIs.',                                       'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'self_contribution', 'label', 'Contribution', 'hint', 'I deliver valuable contributions to the team.',                   'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'self_ambitions',    'label', 'Ambitions',    'hint', 'I have a clear sense of my ambitions within Bambelo.',            'kind', 'rating_b_1_5', 'required', true)
    ),
    'peer_360', jsonb_build_array(
      jsonb_build_object('id', 'peer_collaboration', 'label', 'Collaboration', 'hint', 'Your colleague is pleasant and reliable to work with.',         'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'peer_communication', 'label', 'Communication', 'hint', 'Your colleague communicates clearly and openly.',               'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'peer_helpfulness',   'label', 'Helpfulness',   'hint', 'Your colleague is ready to help others.',                       'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'peer_openness',      'label', 'Openness',      'hint', 'Your colleague is open to feedback from peers.',                'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'peer_value',         'label', 'Value',         'hint', 'Your colleague brings unique value to the team.',               'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'peer_atmosphere',    'label', 'Atmosphere',    'hint', 'Your colleague contributes to a positive atmosphere.',          'kind', 'rating_b_1_5', 'required', true)
    ),
    'manager_prep', jsonb_build_array(
      jsonb_build_object('id', 'mgr_strengths',    'label', 'Strengths',    'hint', 'The employee uses their strengths effectively at work.',           'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'mgr_openness',     'label', 'Openness',     'hint', 'The employee is open to development and feedback.',                'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'mgr_growth',       'label', 'Growth',       'hint', 'The employee has shown growth since the last growth conversation.','kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'mgr_goals',        'label', 'Goals',        'hint', 'The employee meets the agreed goals and KPIs.',                    'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'mgr_contribution', 'label', 'Contribution', 'hint', 'The employee delivers valuable contributions to the team.',        'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'mgr_potential',    'label', 'Potential',    'hint', 'The employee shows potential to grow further within Bambelo.',     'kind', 'rating_b_1_5', 'required', true)
    ),
    'upward', jsonb_build_array(
      jsonb_build_object('id', 'up_leadership',    'label', 'Leadership',    'hint', 'Your manager is strong in their role as a leader.',               'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'up_support',       'label', 'Support',       'hint', 'Your manager supports my growth and development.',                'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'up_direction',     'label', 'Direction',     'hint', 'Your manager gives clear direction and expectations.',            'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'up_openness',      'label', 'Openness',      'hint', 'Your manager is open to feedback.',                               'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'up_impact',        'label', 'Impact',        'hint', 'Your manager contributes to my success and effectiveness.',       'kind', 'rating_b_1_5', 'required', true),
      jsonb_build_object('id', 'up_collaboration', 'label', 'Collaboration', 'hint', 'Your manager fosters good collaboration.',                        'kind', 'rating_b_1_5', 'required', true)
    )
  ),
  true
)
on conflict (id) do update
  set name = excluded.name,
      sections = excluded.sections,
      is_active = excluded.is_active,
      updated_at = now();
