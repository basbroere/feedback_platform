-- Voegt 'team_lead' toe als rol naast employee, manager en hr.
-- team_lead is een tussenniveau: leidt een team maar valt niet onder de
-- manager-rol qua menu en bevoegdheden in het platform.
alter type user_role add value if not exists 'team_lead';
