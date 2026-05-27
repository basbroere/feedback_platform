-- Voeg peer_feedback toe als template-type voor losse peer-feedback-aanvragen
-- (onderscheiden van peer_360, dat hoort bij functioneringsgesprekken)
alter type template_type add value if not exists 'peer_feedback';
