-- Voeg upward feedback toe als vierde spoor in de 360-cyclus.
-- Medewerker geeft optioneel feedback over zijn manager tijdens de eigen
-- voorbereiding. Inhoud wordt pas zichtbaar voor de manager na afronding
-- van de cyclus.

alter type template_type add value if not exists 'upward_feedback';
alter type feedback_source add value if not exists 'upward_feedback';
