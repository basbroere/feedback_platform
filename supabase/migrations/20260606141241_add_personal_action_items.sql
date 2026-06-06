-- Persoonlijke actiepunten: niet gekoppeld aan een 1-op-1, functioneringsgesprek of beoordeling.
-- Eigenaar maakt ze zelf aan en beheert ze zelf.

alter type action_item_source add value if not exists 'personal';

-- Voor persoonlijke items is er geen bron-record; source_id mag dan leeg blijven.
alter table action_items
  alter column source_id drop not null;
