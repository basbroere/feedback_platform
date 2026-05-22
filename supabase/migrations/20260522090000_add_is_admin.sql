-- Voeg is_admin kolom toe, los van rol-structuur.
-- Bestaande hr-gebruikers krijgen is_admin = true en worden medewerker.

alter table users add column if not exists is_admin boolean not null default false;

-- Migreer bestaande hr-gebruikers
update users set is_admin = true, role = 'employee' where role = 'hr';
