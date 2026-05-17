# CLAUDE.md

Werkinstructie voor Claude Code in deze repository. Dit bestand wordt automatisch ingelezen bij elke sessie. Houd je hieraan.

> **Tip voor Claude:** voor de **huidige bouwstatus** (welke routes, tabellen en flows er al staan, en wat er nog niet is), lees eerst `docs/functionele-context.md`. Dit CLAUDE.md beschrijft de visie en het ontwerp; de functionele context beschrijft de realiteit van vandaag.

---

## Over dit project

Feedback- en gesprekkenplatform voor **Bambelo** (online leadgeneratie, hoofdkantoor Breda). Onderdeel van een scriptie-onderzoek naar feedbackcultuur. De scriptie-aanbeveling is een opvolger voor 15Five, dat eerder werd ingezet maar weghaalde wegens te veel administratie en te strenge deadlines. Tegelijk werd 15Five gemist; mensen vonden de gestructureerde gesprekken waardevol.

**Onze opdracht:** breng het geliefde aspect terug, laat de pijn weg. Geen administratielast, geen verplichte deadlines, wel een rustige rode draad door drie gesprekstypen.

## Kernprincipes (lees dit elke sessie opnieuw)

1. **Simpel en instapvriendelijk.** Een medewerker moet binnen 30 seconden snappen wat hij moet doen. Geen onboarding-tour nodig. Als een feature uitleg vereist om gebruikt te worden, is de feature fout.
2. **Voorbereiding mag in 2 minuten.** Vragen zijn suggesties, geen verplichtingen. Velden zijn optioneel tenzij ze echt onmisbaar zijn.
3. **Geen harde deadlines.** Wel ritme-herinneringen ("je laatste 1-op-1 was 3 weken geleden, plan een nieuwe?"), nooit dwingende boodschappen of rode meldingen die druk opbouwen.
4. **Bouw incrementeel.** Implementeer nooit alles in één keer. Luister naar wat de gebruiker per sessie vraagt. Stel kleine, gerichte changes voor.
5. **Vraag bij twijfel.** Vul geen aannames in die de richting bepalen. Beter één vraag stellen dan een verkeerde feature bouwen.
6. **Wijk af van dit document als de gebruiker iets anders wil.** Dit is een gids, geen wet.

## Tech stack (zo simpel mogelijk)

- **Next.js** (App Router) met TypeScript, shadcn/ui, Lucide icons
- **Tailwind CSS** voor styling
- **Supabase** voor database, auth en bestandsopslag
- **Vercel** voor hosting
- **AI:** Anthropic Claude API (default `claude-sonnet-4-6`, configureerbaar via env)

**Auth in demo-modus:** Supabase Auth is beschikbaar maar wordt in de demo niet gebruikt. De demo werkt met een persona-switcher (cookie houdt de gekozen user-id bij). Bij latere productiestap wordt Supabase Auth ingeschakeld zonder dat het datamodel hoeft te wijzigen.

### Code-conventies

- TypeScript strict.
- Server Components als default. `"use client"` alleen waar interactie het echt nodig maakt.
- Geen em-dashes in UI-teksten of code-comments. Komma's, puntkomma's of nieuwe zin.
- Nederlands is de hoofdtaal van het platform. UI-strings in NL.

## Design

Geïnspireerd op **Nexus, Saas Marketing Dashboard van Dipa Inhouse** ([dribbble.com/shots/23038744](https://dribbble.com/shots/23038744-Nexus-Saas-Marketing-Dashboard)).

- **Layout:** vaste sidebar links, hoofdcontent in een grid van cards. Brede gutters, veel witruimte.
- **Cards:** `rounded-xl` of `rounded-2xl`, soft shadows, subtiele borders.
- **Kleuren:** wit/off-white achtergrond, donkergrijze tekst, één accentkleur (mid-blue of teal). Dempt-rood voor warnings, dempt-groen voor success. Geen felle kleuren.
- **Typografie:** Inter of vergelijkbaar. Grote getallen prominent in cards, subtiele labels eronder.
- **Iconen:** Lucide via `lucide-react`. Consistente line weight.
- **Data viz:** Recharts of Tremor. Afgeronde lijnen, gradient fills.
- **Microinteracties:** subtiele hover states, fade transitions. Geen bombastische animaties.
- **Dark mode:** ondersteunen.

**Tone of voice in UI-teksten:** informeel, menselijk, energiek (Bambelo-cultuur). Korte zinnen. Geen corporate jargon. Geen schreeuwerige CTAs. Voorbeelden: "Klaar voor je 1-op-1?" niet "Initieer uw geplande gesprek". "Even bijwerken" niet "Status actualiseren".

## De drie modules

Drie gesprekstypen, oplopend in zwaarte. Ze bouwen op elkaar: 1-op-1's voeden het functioneringsgesprek, dat voedt het beoordelingsgesprek. Dit is functioneel essentieel; bouw deze verbanden expliciet in.

### Module 1: 1-op-1 gesprekken (tweewekelijks)

Het hart van de feedbackcultuur. Korte, frequente gesprekken tussen manager en medewerker. Doel: lopende zaken, kleine ontwikkelpunten, snelle bijsturing.

**Probleem dat dit oplost:** templates bestaan, maar worden niet bijgehouden. Actiepunten verdwijnen tussen meetings.

**Flow medewerker (voorbereiding):**

1. Notificatie of dashboardprompt: "Je 1-op-1 met [manager] is over [X dagen]. Voorbereiden?"
2. Pagina opent met een template (manager kan template kiezen, default = "Reguliere 1-op-1"). Vragen zijn suggesties:
   - Hoe ging de afgelopen 2 weken?
   - Waar wil je hulp of input bij?
   - Wat staat er op je agenda?
   - Vrij veld voor eigen punten
3. Vorige actiepunten zichtbaar bovenaan met status: "open", "afgerond", "vervalt". Medewerker kan deze updaten.
4. Opslaan = klaar. Manager ziet de voorbereiding bij start van de meeting.

**Flow manager (tijdens en na het gesprek):**

1. Manager opent de meeting in het platform.
2. Drie panelen:
   - **Voorbereiding van de medewerker** (read-only, zo ingevuld door medewerker)
   - **Vorige actiepunten** met huidige status
   - **Gespreksnotities** (twee tabs: "Privé" en "Gedeelde samenvatting")
3. Manager noteert tijdens of na het gesprek. Privé-notities zijn nooit zichtbaar voor de medewerker (kladblok, observaties voor later). Gedeelde samenvatting is wel zichtbaar.
4. Nieuwe actiepunten aanmaken: beschrijving, eigenaar (medewerker of manager), optionele richtdatum. Geen harde deadline-dwang.
5. Bestaande actiepunten kunnen afgerond of doorgeschoven worden.
6. Opslaan. Medewerker krijgt notificatie met de gedeelde samenvatting en bijgewerkte actiepunten.

**Belangrijk:**

- Een 1-op-1 voorbereiding kan ook leeg gelaten worden. Niet alles hoeft ingevuld.
- Geen 360 feedback in 1-op-1's. Dit blijft 1-op-1.
- Actiepunten zijn de belangrijkste continuïteit-as. Maak ze prominent in de UI.

### Module 2: Functioneringsgesprek (halfjaarlijks, met 360)

Diepgaander gesprek over hoe het in bredere zin gaat, ontwikkeling, samenwerking, ambities. Inclusief 360 graden feedback van peers.

**Flow:**

1. **Manager start een functioneringsgesprek-cyclus voor een medewerker.** Selecteert template (default "Halfjaarlijks functioneringsgesprek"). Kiest peers waarvan 360 feedback gevraagd wordt (zie hieronder).
2. **Drie parallelle voorbereidingen lopen:**
   - **Medewerker** doet zelfevaluatie via template (vragen als "Hoe gaat het met je?", "Wat ervaar je in het werk?", "Waar wil je groeien?", "Hoe loopt de samenwerking met je team?")
   - **Manager** doet eigen voorbereiding (observaties, ontwikkelpunten, dingen om te bespreken)
   - **Peers** (3-5 collega's) geven 360 feedback met naam zichtbaar
3. **Cycle dashboard:** manager ziet voortgang van alle drie stromen. Wie heeft ingevuld, wie nog niet. Geen automatische rappels die druk opbouwen, wel een mogelijkheid om handmatig te herinneren.
4. **Wanneer alle input binnen is** (of manager besluit te starten): meeting wordt ingepland. Manager heeft tijdens het gesprek alle input bij de hand:
   - Zelfevaluatie medewerker
   - 360 feedback van peers (met naam)
   - Eigen voorbereiding
   - Samenvatting van de afgelopen 1-op-1's in deze periode (auto-gegenereerd uit gedeelde samenvattingen)
   - Actiepunten uit vorige functioneringsgesprek met status
5. **Tijdens/na gesprek:** manager noteert gespreksverslag (privé + gedeelde samenvatting, zelfde model als 1-op-1). Nieuwe ontwikkelpunten worden actiepunten met richttermijn van ~6 maanden (mikpunt voor beoordelingsgesprek).

**360 graden feedback, interdisciplinaire samenwerking:**

- Peers worden geselecteerd door **manager én medewerker samen**. Medewerker stelt voor, manager bevestigt of voegt toe.
- **Cross-team peers verplicht aanmoedigen:** minimaal 1 van de 3-5 peers moet uit een ander team komen. Dit is de "interdisciplinaire samenwerking" die de scriptie expliciet noemt.
- **Met naam, niet anoniem.** Dit is een bewuste ontwerpkeuze passend bij Bambelo's open cultuur ("korte lijntjes, CEO is direct benaderbaar"). Een peer die feedback geeft staat ervoor. Voordeel: stimuleert eigenaarschap en doordachte feedback. Aandachtspunt: peers moeten weten dat hun naam zichtbaar is, dit moet duidelijk gecommuniceerd worden in de UI bij het invullen.
- **360 template** bevat vragen als: "Op welke samenwerking baseer je deze feedback?", "Wat gaat goed in de samenwerking?", "Wat zou nog beter kunnen?", "Welk gedrag valt je positief op?", "Welke ontwikkelkans zie je?"
- Peers krijgen een week (richttijd, geen harde deadline) om in te vullen. Zacht herinneren mag, dwingen niet.

**Belangrijk:**

- Een functioneringsgesprek voelt zwaarder dan een 1-op-1. Geef het visueel ook een eigen plek (eigen kaart op het dashboard, eigen flow).
- 360 invullen mag ook 5 minuten kosten. Houd template kort en relevant.

### Module 3: Beoordelingsgesprek (jaarlijks of einde periode)

Kijken of de afgesproken ontwikkelpunten gerealiseerd zijn. Beoordelend van karakter; korter dan een functioneringsgesprek.

**Flow:**

1. **Manager start beoordelingsgesprek-cyclus.** Template kiezen (default "Jaarlijkse beoordeling"). De cyclus is **expliciet gekoppeld** aan het vorige functioneringsgesprek; de actiepunten en ontwikkelpunten daaruit zijn de meetlat.
2. **Voorbereiding:**
   - **Medewerker** doet zelfreflectie op de ontwikkelpunten: "Wat heb je bereikt?", "Waar liep je tegenaan?", "Wat zou je nu anders doen?"
   - **Manager** beoordeelt per ontwikkelpunt: gerealiseerd, deels gerealiseerd, niet gerealiseerd, vervallen. Plus toelichting.
3. **Tijdens gesprek:**
   - Loop de ontwikkelpunten één voor één door
   - Bespreek beoordeling per punt
   - Algemene beoordeling van functioneren (templates-driven, geen vaste score-systeem; tekstueel)
   - Eventueel: nieuwe ontwikkelpunten voor komende periode (vormen input voor volgende functioneringsgesprek)
4. **Na gesprek:** verslag (privé + gedeelde samenvatting), beoordeling per ontwikkelpunt vastgelegd. Medewerker tekent (klikt akkoord) of geeft schriftelijke reactie als hij het er niet mee eens is.

**Belangrijk:**

- Geen numerieke score. Tekstuele beoordeling per punt en algemeen. Past bij "geliefd" boven "administratief".
- De koppeling beoordelingsgesprek → functioneringsgesprek → 1-op-1's moet zichtbaar zijn in de UI. Klikbare keten: "Bekijk het functioneringsgesprek waar deze punten uit komen".
- Mogelijkheid voor de medewerker om bezwaar of toelichting toe te voegen achteraf. Voorkomt dat het gesprek eenzijdig voelt.

## Templates, het rode draad-systeem

Templates zijn herbruikbare blueprints per gespreksmodule. HR beheert ze centraal. Manager kan per cyclus een template kiezen.

**Template-types:**

- `one_on_one_template`
- `performance_review_template` (functioneringsgesprek)
- `evaluation_template` (beoordelingsgesprek)
- `peer_360_template` (gebruikt binnen functioneringsgesprek)

**Vraag-typen:**

- Open tekst (default)
- Schaal 1-5 (sparingly gebruiken, niet in 1-op-1's)
- Meerkeuze (één antwoord)
- Meerkeuze (meerdere antwoorden)

**Standaard meegeleverde templates (seeden):**

- 1-op-1: "Reguliere 1-op-1", "Eerste 1-op-1 na onboarding", "1-op-1 na groot project"
- Functioneringsgesprek: "Halfjaarlijks functioneringsgesprek", "Onboarding 6 maanden"
- Peer 360: "Algemene peer feedback", "Cross-team samenwerking"
- Beoordeling: "Jaarlijkse beoordeling"

**HR-beheerflow:** sleep-en-laat-vallen vraagvolgorde, vragen optioneel/verplicht markeren, template archiveren (oude cycli blijven werken), template dupliceren als startpunt.

## Datamodel (high level)

```
teams (id, name, lead_user_id)
users (id, name, email, role, team_id, avatar_url)

templates (id, type, name, questions[], is_active)

one_on_ones
  ├── id, manager_id, employee_id, template_id, scheduled_at, completed_at
  ├── employee_preparation (jsonb, antwoorden op template-vragen)
  ├── manager_private_notes (text)
  └── shared_summary (text)

performance_reviews (functioneringsgesprekken)
  ├── id, manager_id, employee_id, template_id, cycle_started_at, completed_at, status
  ├── employee_self_evaluation (jsonb)
  ├── manager_preparation (jsonb)
  ├── manager_private_notes (text)
  └── shared_summary (text)

peer_feedback (binnen functioneringsgesprek)
  ├── id, performance_review_id, peer_id, requested_by, requested_at, submitted_at
  ├── responses (jsonb)
  └── is_cross_team (boolean, auto-gevuld op basis van team_id verschil)

evaluations (beoordelingsgesprekken)
  ├── id, manager_id, employee_id, template_id, previous_performance_review_id
  ├── employee_self_reflection (jsonb)
  ├── manager_assessments (jsonb, beoordeling per actiepunt)
  ├── manager_private_notes (text)
  ├── shared_summary (text)
  ├── employee_acknowledged_at (timestamp)
  └── employee_response (text, optioneel bezwaar of toelichting)

action_items
  ├── id, owner_id, description, status (open, completed, expired)
  ├── source_type (one_on_one, performance_review, evaluation)
  ├── source_id
  ├── target_date (optioneel, geen harde deadline)
  ├── created_at, completed_at
  └── notes (voortgangsnotities)

notifications (id, user_id, type, payload, read_at, created_at)
```

**Belangrijke datamodel-keuzes:**

- `manager_private_notes` is een aparte kolom, nooit `select`-ed in queries voor de medewerker. Bouw een DB-helper `getSessionForEmployee()` die deze velden expliciet uitsluit.
- `previous_performance_review_id` op `evaluations` legt de keten vast die de UI gebruikt voor "Bekijk de oorsprong van deze ontwikkelpunten".
- `is_cross_team` op peer_feedback wordt automatisch berekend zodat de UI cross-team feedback kan markeren en HR het kan rapporteren (scriptie-data).
- `target_date` is optioneel. Geen harde deadlines is een ontwerpprincipe.

## Rollen

| Rol | Wat ze kunnen |
|-----|---------------|
| **Medewerker** | Voorbereiden 1-op-1, zelfevaluatie functioneringsgesprek, zelfreflectie beoordelingsgesprek, peer feedback geven (op aanvraag), eigen actiepunten beheren, gedeelde samenvattingen inzien. |
| **Manager** | Alles van medewerker, plus: 1-op-1's leiden en documenteren, functioneringsgesprek-cyclus starten en leiden, beoordelingsgesprek voeren, peers selecteren voor 360, privé-notities maken, actiepunten beheren voor teamleden, team-overzicht. |
| **HR** | Alles van manager, plus organisatie-breed: templates beheren, gebruikers en teams beheren, organisatie-dashboard met aggregaties, AI-instellingen. **HR ziet geen individuele gespreksinhoud van anderen**, alleen aggregaties (aantallen, percentages, doorlooptijden). Dit is een vertrouwenskwestie en past bij de Bambelo-cultuur. |

## Dashboard (per rol verschillend, zelfde fundament)

### Medewerker dashboard

- KPI-cards: open actiepunten, volgende 1-op-1, openstaande peer-feedback verzoeken aan jou.
- Volgende geplande gesprek prominent (1-op-1, functioneringsgesprek, beoordeling).
- Open actiepunten lijst met status.
- Recente gedeelde samenvattingen.
- Vrijwillige sectie: persoonlijke ontwikkelnotities (alleen voor jezelf).

### Manager dashboard

- Bovenop medewerker-dashboard: team-overzicht.
- Per teamlid: laatste 1-op-1 datum, aantal open actiepunten, status lopende cycli (functionering/beoordeling).
- Zacht signaal "tijd voor een 1-op-1 met X?" als laatste 1-op-1 > 3 weken geleden. Geen rood waarschuwingsicoon, gewoon een vriendelijke prompt.

### HR dashboard

- Organisatie-breed: aantal gesprekken per maand, doorlooptijd cycli, deelname-percentages, cross-team peer feedback rate (scriptie-relevant).
- Beheer-paneel: gebruikers, teams, templates, AI-instellingen, demo-reset.
- Geen drilldown naar individuele gesprekstekst.

## Demo-modus

- Geen authenticatie. Demo-startscherm met persona-keuze (alle demo-medewerkers gegroepeerd per team).
- Persona-switcher rechtsboven om snel te wisselen.
- Cookie houdt huidige user-id bij.
- Seed-script: 4-5 teams (Partner Happiness, Consumer Happiness, IT, Marketing, HR), 20-25 medewerkers, 6 maanden historie aan 1-op-1's, één afgeronde functioneringsgesprek-cyclus per team, en wat openstaande actiepunten.
- HR kan demo resetten via beheer-paneel.
- Realistische Nederlandse namen, internationaal gemêleerd (past bij Bambelo's 10+ nationaliteiten).

## AI-ondersteuning

**Eén kerntoepassing:** feedback constructiever maken. Werkt op alle vrije tekstvelden in feedback-context (peer feedback, manager-notities die gedeeld worden, gedeelde samenvattingen).

- Knop "Maak constructiever" naast tekstveld.
- AI levert herschreven versie + uitleg (concreter, specifieker, zonder oordelende taal, behoud van stem).
- Gebruiker kan overnemen, aanpassen of negeren.
- Originele en AI-versie worden beide gelogd (`ai_suggestions_log` tabel) voor scriptie-analyse: hoe vaak gebruikt, hoe vaak geaccepteerd, welke types tekst.

**System prompt-basis:** SBI-model (Situation, Behavior, Impact) of het kader dat de scriptiestudent kiest. Vraag de gebruiker bij implementatie welk model gebruikt wordt.

**Cost control:**
- Cache identieke inputs.
- Max 50 AI-calls per gebruiker per dag.
- Logging in `ai_suggestions_log` met `accepted` boolean.

## Bouwvolgorde (suggestie)

Niet hard. Vraag de gebruiker per fase wat hij wil oppakken.

**Fase 1, fundering**
- Next.js project, Supabase, shadcn/ui, Lucide setup.
- Datamodel + migrations.
- Demo-startscherm + persona-switching.
- Basis sidebar layout.

**Fase 2, 1-op-1's**
- Datalaag voor 1-op-1's.
- Template-beheer (basaal, alleen "Reguliere 1-op-1" template seeden).
- Medewerker voorbereidingsflow.
- Manager meeting-flow met privé/gedeelde notities.
- Actiepunten basis.
- Seed-data voor demo.

**Fase 3, actiepunten en continuïteit**
- Actiepunten dashboard voor medewerker.
- Status-updates op actiepunten.
- Doorlopende actiepunten tussen 1-op-1's.
- Notificaties basis.

**Fase 4, functioneringsgesprek + 360**
- Cyclus-model voor functioneringsgesprekken.
- Zelfevaluatie-flow medewerker.
- Peer-selectie en uitnodigingsflow.
- Peer-feedback invulflow (met naam).
- Cross-team peer detectie.
- Manager meeting-flow.

**Fase 5, beoordelingsgesprek**
- Koppeling met vorige functioneringsgesprek.
- Self-reflection + manager assessment per actiepunt.
- Akkoord/bezwaar flow.

**Demo-scope eindigt hier.** De fases hieronder zijn optioneel en niet vereist voor de scriptie-demo. Pak ze pas op als de gebruiker er expliciet om vraagt.

**Fase 6, HR + AI (post-demo, optioneel)**
- HR-dashboard aggregaties.
- Template-beheer volwaardig.
- AI "maak constructiever"-knop integreren.
- Logging voor scriptie-analyse.

**Fase 7, polish (post-demo, optioneel)**
- Dark mode finetunen.
- Empty states, loading states.
- Mobile responsive checks.
- Demo-script ondersteunen.

## Wat NIET te doen

- Geen verplichte deadlines met countdown timers of rode waarschuwingen.
- Geen numerieke beoordelingsscores (1-5 sterren op een mens, geen gemiddelden).
- Geen email-notificaties (in-app is voldoende voor demo).
- Geen gamification met punten of badges.
- Geen anonieme feedback. We werken met naam, dat is bewust.
- Geen AI die zelfstandig samenvattingen maakt van privé-gegevens.
- Geen HR-toegang tot individuele gesprekstekst.
- Geen complexe permission-matrix; rollen zijn medewerker, manager, HR. Klaar.
- Geen "Microsoft Teams"-achtige feature creep. Drie modules, helder afgebakend.

## Succescriteria voor de demo

1. Een medewerker kan in onder de 2 minuten een 1-op-1 voorbereiden.
2. Een manager kan in onder de 5 minuten een 1-op-1 documenteren inclusief actiepunten.
3. Actiepunten uit de vorige 1-op-1 zijn zichtbaar in de volgende. Continuïteit is glashelder.
4. Een 360 feedback-cyclus loopt end-to-end: peers krijgen verzoeken, vullen in met naam, manager ziet alles bij elkaar.
5. Een beoordelingsgesprek toont de keten terug naar het functioneringsgesprek waar de punten vandaan kwamen.
6. HR ziet aggregaties zonder ergens een individuele gesprekstekst tegen te komen.
7. De UI voelt informeel en uitnodigend, niet zwaar of administratief. Een gebruiker moet bij het zien denken "oh, dit ziet er makkelijk uit".

---

## Slotnotitie voor Claude Code

- **Bouw één feature tegelijk, niet drie tegelijk.** Begin altijd met het simpelste werkende geval en breid uit.
- **Test met seed-data, niet met lege state.** Lege schermen verbergen design-issues.
- **Vraag voor elke nieuwe feature welk gespreks-type het raakt** (1-op-1, functioneringsgesprek, beoordeling) zodat we de juiste tabellen aanpassen.
- **De Bambelo-cultuur is informeel en menselijk.** Laat dat doorklinken in copy, tone, en interactie.
- **De scriptie-context is belangrijk.** Log AI-acceptatie en peer-feedback patronen netjes; dat is onderzoeksdata.

*Versie 0.3*
