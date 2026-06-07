-- Herstel de Bambelo growth conversation: korte titel + langere toelichting
-- per vraag, en gebruik de Bamback-schaal (rating_b_1_5) voor alle 1-5-vragen
-- zodat ze de B-iconen krijgen plus het verplichte commentaarveld waar de
-- vervolg-uitleg ("What is that one thing?") in landt.
update templates
   set name = 'Bambelo growth conversation',
       sections = jsonb_build_object(
         'self_reflection', jsonb_build_array(
           jsonb_build_object(
             'id', 'self_strengths',
             'label', 'Top three strengths',
             'hint', 'What are your top three strengths and how did you apply them to your work since your last growth conversation?',
             'kind', 'open',
             'required', true
           ),
           jsonb_build_object(
             'id', 'self_dev_scale',
             'label', 'Development opportunities',
             'hint', 'To what extent do you see concrete development opportunities to focus on before your next growth conversation? Name up to three development opportunities and the steps you would like to take. (1 = none, 5 = many)',
             'kind', 'rating_b_1_5',
             'required', true
           ),
           jsonb_build_object(
             'id', 'self_dev_focus',
             'label', 'Skills to develop',
             'hint', 'Which skills, knowledge areas or competencies would you like to further develop during the next six months? Are there specific projects, responsibilities or experiences that could help you develop these?',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'self_career',
             'label', 'Career growth at Bambelo',
             'hint', 'Looking ahead, how would you like to grow within Bambelo? Choose: further develop within my current role / grow towards a different role within my current department / explore opportunities outside my current department / unsure at this moment. Please elaborate on your choice.',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'self_achievements',
             'label', 'Key achievements',
             'hint', 'Looking back at the past six months, what were your most important achievements and contributions?',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'self_goals_scale',
             'label', 'Goal achievement',
             'hint', 'To what extent did you achieve your goals, KPIs and expected outcomes? Provide examples and explain any goals or expectations that were not fully achieved. (1 = not achieved, 5 = fully achieved)',
             'kind', 'rating_b_1_5'
           ),
           jsonb_build_object(
             'id', 'self_diff_scale',
             'label', 'What would you do differently',
             'hint', 'To what extent would you do things differently moving forward? What would you do differently? (1 = nothing, 5 = a lot)',
             'kind', 'rating_b_1_5'
           )
         ),
         'peer_360', jsonb_build_array(
           jsonb_build_object(
             'id', 'peer_continue',
             'label', 'Continue doing',
             'hint', 'What is one thing your colleague currently does that you would like them to continue doing?',
             'kind', 'open',
             'required', true
           ),
           jsonb_build_object(
             'id', 'peer_impact_scale',
             'label', 'Room for more impact',
             'hint', 'To what extent could your colleague do more to increase their impact and effectiveness? What is that one thing? (1 = little room, 5 = a lot of room)',
             'kind', 'rating_b_1_5',
             'required', true
           ),
           jsonb_build_object(
             'id', 'peer_diff',
             'label', 'Do differently',
             'hint', 'What is one thing your colleague could do differently to support their growth and development? (e.g. start doing, stop doing, or do differently)',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'peer_unique_scale',
             'label', 'Unique value to the team',
             'hint', 'To what extent does your colleague bring unique value to the team? Please describe what that value is. (1 = limited, 5 = very much)',
             'kind', 'rating_b_1_5'
           )
         ),
         'manager_prep', jsonb_build_array(
           jsonb_build_object(
             'id', 'mgr_strengths',
             'label', 'Employee strengths',
             'hint', 'What are this employee''s top three strengths and how have they applied them to their work since the last growth conversation?',
             'kind', 'open',
             'required', true
           ),
           jsonb_build_object(
             'id', 'mgr_dev_scale',
             'label', 'Development opportunities',
             'hint', 'To what extent do you see concrete development opportunities for this employee to focus on before the next growth conversation? Which up to three development opportunities and steps would you suggest? (1 = none, 5 = many clear opportunities)',
             'kind', 'rating_b_1_5',
             'required', true
           ),
           jsonb_build_object(
             'id', 'mgr_dev_focus',
             'label', 'Skills with biggest impact',
             'hint', 'Which skills, knowledge areas or competencies would have the greatest impact on this employee''s growth over the next six months?',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'mgr_career',
             'label', 'Growth opportunities at Bambelo',
             'hint', 'Based on the ambitions and development interests shared by the employee, what opportunities for growth and development do you currently see within Bambelo? Indicate whether these are primarily: within the current role / within the current department / outside the current department / further exploration needed. Provide examples where relevant.',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'mgr_goals_scale',
             'label', 'Goal achievement',
             'hint', 'To what extent did this employee achieve their goals, KPIs and expected outcomes during the past six months? Provide specific examples, results and context (consider goal achievement, KPI performance, key contributions, areas for improvement and contextual factors). (1 = not achieved, 5 = fully achieved)',
             'kind', 'rating_b_1_5'
           )
         ),
         'upward', jsonb_build_array(
           jsonb_build_object(
             'id', 'up_strengths',
             'label', 'Manager strengths',
             'hint', 'What are your manager''s top strengths as a manager?',
             'kind', 'open',
             'required', true
           ),
           jsonb_build_object(
             'id', 'up_continue_scale',
             'label', 'Continue doing',
             'hint', 'To what extent is there something your manager currently does that you would like them to continue doing? Name that one thing. (1 = hardly, 5 = very much)',
             'kind', 'rating_b_1_5'
           ),
           jsonb_build_object(
             'id', 'up_more',
             'label', 'Do more of',
             'hint', 'What is one thing your manager could do more of to better support your growth and development?',
             'kind', 'open'
           ),
           jsonb_build_object(
             'id', 'up_diff_scale',
             'label', 'Do differently',
             'hint', 'To what extent could your manager do something differently to help you be more effective in your role? What is that (e.g. start doing, stop doing, or do differently)? (1 = little room, 5 = a lot of room)',
             'kind', 'rating_b_1_5'
           ),
           jsonb_build_object(
             'id', 'up_impact_scale',
             'label', 'Manager support',
             'hint', 'To what extent has your manager supported your success, growth and development during the past six months? In which areas would you have liked more support? (1 = hardly, 5 = very strongly)',
             'kind', 'rating_b_1_5'
           ),
           jsonb_build_object(
             'id', 'up_collab',
             'label', 'Strengthening collaboration',
             'hint', 'Is there anything else you would like to share that could strengthen the collaboration between you and your manager?',
             'kind', 'open'
           )
         )
       ),
       updated_at = now()
 where id = 'b4bf0001-0000-4000-8000-000000000001';

-- Oude functioneringsgesprek-cycli wezen naar een 'peer_360'- of
-- 'upward_feedback'-template, of hun template_id is null geraakt. De nieuwe
-- code accepteert alleen 'performance_review_bundle' templates, dus die cycli
-- toonden "geen template gekoppeld". Hang ze om naar de Bambelo bundle.
update performance_reviews
   set template_id = 'b4bf0001-0000-4000-8000-000000000001'
 where template_id is null
    or template_id in (
      select id from templates where type in ('peer_360', 'upward_feedback')
    );
