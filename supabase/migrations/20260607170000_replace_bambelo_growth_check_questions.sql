-- Vervang de vragen van het Bambelo growth check-template. De vorige set
-- algemene stellingen was niet de bedoeling: deze versie focust op
-- uitvoering, doelen en ondersteuning.
update templates
   set sections = jsonb_build_object(
     'self_reflection', jsonb_build_array(
       jsonb_build_object('id', 'self_core_tasks',       'label', 'Core tasks',       'hint', 'I perform my core tasks as agreed.',                                                  'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'self_feedback_applied', 'label', 'Feedback applied', 'hint', 'I adapt my way of working based on feedback I receive.',                              'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'self_goal_setting',     'label', 'Goal setting',     'hint', 'I set myself clear, achievable work goals.',                                          'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'self_results',          'label', 'Results',          'hint', 'I deliver my agreed results and KPIs.',                                               'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'self_improvement',      'label', 'Improvement',      'hint', 'I actively look for ways to improve my work.',                                        'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'self_resourcefulness',  'label', 'Resourcefulness',  'hint', 'I use the available knowledge and resources to perform my tasks better.',             'kind', 'rating_b_1_5', 'required', true)
     ),
     'peer_360', jsonb_build_array(
       jsonb_build_object('id', 'peer_delivery',         'label', 'Delivery',         'hint', 'Your colleague delivers agreed work on time and as expected.',                       'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'peer_alignment',        'label', 'Alignment',        'hint', 'Your colleague aligns tasks clearly within the collaboration.',                      'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'peer_contribution',     'label', 'Contribution',     'hint', 'Your colleague contributes concretely to shared results.',                            'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'peer_sharing',          'label', 'Sharing',          'hint', 'Your colleague shares information and knowledge that moves the work forward.',       'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'peer_feedback_uptake', 'label', 'Feedback uptake', 'hint', 'Your colleague picks up team feedback in execution.',                                  'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'peer_team_impact',     'label', 'Team impact',     'hint', 'Your colleague helps the team execute tasks more effectively.',                       'kind', 'rating_b_1_5', 'required', true)
     ),
     'manager_prep', jsonb_build_array(
       jsonb_build_object('id', 'mgr_core_tasks',        'label', 'Core tasks',        'hint', 'The employee performs the core tasks of the role as agreed.',                        'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'mgr_feedback_applied',  'label', 'Feedback applied',  'hint', 'The employee adapts ways of working based on earlier feedback.',                     'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'mgr_goal_setting',      'label', 'Goal setting',      'hint', 'The employee sets clear, achievable goals for their own work.',                      'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'mgr_results',           'label', 'Results',           'hint', 'The employee delivers the agreed results and KPIs.',                                 'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'mgr_improvement',       'label', 'Improvement',       'hint', 'The employee actively looks for ways to improve the work.',                          'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'mgr_resourcefulness',   'label', 'Resourcefulness',   'hint', 'The employee uses available knowledge and resources to perform tasks better.',       'kind', 'rating_b_1_5', 'required', true)
     ),
     'upward', jsonb_build_array(
       jsonb_build_object('id', 'up_clarity',            'label', 'Clarity',           'hint', 'Your manager gives clear explanations about tasks and expectations.',                'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'up_feedback',           'label', 'Feedback',          'hint', 'Your manager gives feedback that helps me improve my work.',                         'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'up_support',            'label', 'Support',           'hint', 'Your manager supports me with the resources and knowledge I need.',                  'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'up_goal_setting',       'label', 'Goal setting',      'hint', 'Your manager helps me set concrete, achievable goals.',                              'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'up_progress',           'label', 'Progress',          'hint', 'Your manager discusses progress in a way that moves me forward.',                    'kind', 'rating_b_1_5', 'required', true),
       jsonb_build_object('id', 'up_unblocking',         'label', 'Unblocking',        'hint', 'Your manager removes obstacles that get in the way of effective work.',              'kind', 'rating_b_1_5', 'required', true)
     )
   ),
   updated_at = now()
 where id = 'b4bf0004-0000-4000-8000-000000000004';
