# Functionele context, gebouwde staat

Snapshot van wat er **nu daadwerkelijk in de code** zit. Voor het ontwerp, de visie en de niet-gebouwde fasen, zie `CLAUDE.md`. Dit document beschrijft alleen de huidige realiteit zodat een nieuwe sessie snel weet wat er werkt.

Laatst bijgewerkt: 2026-05-17.

## In één regel

Demo-platform voor Bambelo met persona-switcher, een werkende 1-op-1-module en peer-feedback-module, een dashboard per rol, en losse pagina's voor actiepunten en feedback. Functionerings- en beoordelingsgesprekken zijn nog niet gebouwd.

## Routes

App-routes onder `src/app/(app)/`, demo-modus zonder auth.

| Route | Rol | Wat het doet |
|---|---|---|
| `/` | iedereen | Persona-picker. Compact, alle teams in één scherm. |
| `/dashboard` | iedereen | Rol-afhankelijk dashboard, zie hieronder. |
| `/team` | manager, hr | Kaartenraster van teamleden met "laatste 1-op-1" en "volgende 1-op-1". |
| `/team/[employeeId]` | manager | Detailpagina per teamlid, met geplande en gevoerde 1-op-1's. |
| `/een-op-een` | medewerker | Lijst eigen 1-op-1's. |
| `/een-op-een/[id]/voorbereiden` | medewerker | Voorbereidingsformulier op template-basis, met vorige actiepunten zichtbaar. |
| `/een-op-een/[id]` | manager | Meeting-view: voorbereiding medewerker, vorige actiepunten, privé-notities, gedeelde samenvatting, manager-feedback, actiepunten beheren. |
| `/actiepunten` | medewerker, manager | Lijst eigen actiepunten met filter-tabs (Lopend/Afgerond/Alles), search, detail-dialog, gentle nudge bij items > 4 weken open. |
| `/feedback` | medewerker, manager | Ontvangen feedback + "Feedback aanvragen"-flow voor peer-feedback. |
| `/feedback-verzoek/[id]` | iedereen die uitgenodigd is | Peer-feedback invulformulier op template-basis. |

### Dashboard per rol

- **Medewerker:** metric-kaarten (open actiepunten, feedback laatste 4 weken, laatste 1-op-1), "Op je bord" (volgende 1-op-1, open feedback-verzoeken, top 3 open actiepunten), "Recente feedback" met de laatste 2 ontvangen items.
- **Manager:** zelfde metrics en "Op je bord", maar in "Op je bord" verschijnen ook aankomende 1-op-1's met teamleden (visueel onderscheiden met avatar + "1-op-1 met X" en "Als manager"-label). Daaronder een signaal-gedreven "Tijd voor een 1-op-1?"-blok met teamleden waar laatste 1-op-1 ≥ 3 weken geleden was.
- **HR:** snapshot-tegels (1-op-1's voltooid deze maand, feedback gegeven deze maand, cross-team feedback %, medewerkers/teams) en een gedempt blok dat benoemt dat templatebeheer en drilldowns later komen.

## Sidebar-volgorde

- **Manager:** Home, Actiepunten, Feedback, Team, Mijn 1-op-1's
- **Medewerker:** Home, Actiepunten, Feedback, Mijn 1-op-1's
- **HR:** Home, Team

## Datamodel

Migraties staan in `supabase/migrations/`. Geen RLS in demo-modus (expliciet `disable row level security`).

### Tabellen actief in gebruik door de UI

- `teams` (id, name, lead_user_id)
- `users` (id, name, email, role: employee/manager/hr, team_id, avatar_url)
- `templates` (id, type, name, questions[], is_active)
- `one_on_ones` (id, manager_id, employee_id, template_id, subject, scheduled_at, completed_at, employee_preparation, manager_private_notes, shared_summary)
- `action_items` (id, owner_id, description, status: open/completed/expired, target_date, notes, source_type, source_id, created_at, completed_at)
- `feedback` (id, recipient_id, author_id, source_type: one_on_one/peer_request/performance_review, source_id, prompt, body, responses, is_cross_team, status: requested/submitted/declined, requested_at, submitted_at, created_at)
- `feedback_requests` (id, requester_id, template_id, prompt, created_at)
- `notifications` (id, user_id, type, payload, read_at, created_at)

### Tabellen aangelegd, maar nog niet in gebruik

Aanwezig in `20260513193859_initial_schema.sql` maar nog geen queries, actions of UI voor:

- `performance_reviews`
- `peer_feedback` (apart van het peer-mechanisme dat nu via `feedback` met `source_type=peer_request` loopt)
- `evaluations`

### Cascade-gedrag

- User verwijderen ⇒ cascade weg: 1-op-1's, actiepunten, feedback, peer-feedback, performance_reviews, evaluations, notifications.
- Team verwijderen ⇒ users blijven bestaan met `team_id = null`.
- Template verwijderen ⇒ verwijzingen worden `set null`.

## Demo-modus

- **Geen auth.** Persona-picker op `/` zet een cookie `bambelo_persona` met de user-id.
- Persona-switcher onderaan de sidebar voor snel wisselen.
- `npm run seed` populeert demo-data (5 teams in seed; `scripts/seed.ts`).
- Geen ingebouwde "reset demo"-knop in de UI (CLAUDE.md noemt dit als wenselijk maar het is niet gebouwd).

## Kernflows die end-to-end werken

1. **Persona kiezen** → cookie gezet → naar dashboard.
2. **1-op-1 voorbereiden (medewerker):** voorbereidingsformulier per template, vorige actiepunten zichtbaar met status. Velden zijn optioneel; opslaan kan ook leeg.
3. **1-op-1 documenteren (manager):** voorbereiding medewerker zien, privé-notities, gedeelde samenvatting, actiepunten aanmaken/afronden/eigenaar wisselen, optionele manager-feedback aan medewerker.
4. **Actiepunten beheren:** afvinken/heropenen door owner of door manager van bron-1-op-1.
5. **Peer feedback aanvragen:** kies template, optionele prompt, selecteer collega's (cross-team aangemoedigd, niet verplicht); aanvragen verschijnen bij die collega's.
6. **Peer feedback geven:** invullen op `/feedback-verzoek/[id]`, met naam zichtbaar bij de feedback. `is_cross_team` wordt automatisch berekend op basis van team-verschil.
7. **Manager-feedback aan medewerker na 1-op-1:** opgeslagen als `feedback` row met `source_type = one_on_one`, verschijnt op `/feedback` van de medewerker.

## Wat nog niet gebouwd is

Direct uit CLAUDE.md fasen 4+:

- Functioneringsgesprek-cyclus: zelfevaluatie, peer-selectie met cross-team verplichting, peer-feedback-invulflow gekoppeld aan functioneringscyclus, manager-meeting met alles bij elkaar.
- Beoordelingsgesprek: koppeling met vorige functioneringsgesprek, beoordeling per actiepunt, akkoord/bezwaar-flow.
- HR-dashboard volledige aggregaties, templatebeheer-UI, demo-reset-knop, gebruikers- en teamsbeheer-UI.
- AI "maak constructiever"-knop en `ai_suggestions_log` tabel.
- Notificaties-inbox-UI (de tabel wordt wel gevuld).
- E-mailnotificaties (CLAUDE.md noemt expliciet: niet voor de demo).

## Conventies en valkuilen

- **Privé-notities mogen nooit ge-select'ed worden in employee-queries.** Helper-pattern in `src/lib/one-on-ones/queries.ts`: `getOneOnOneForEmployee` strip privé velden expliciet.
- **`is_cross_team` wordt automatisch ingevuld** bij feedback-submit op basis van team-verschil; niet handmatig zetten in nieuwe code.
- **Geen em-dashes** in UI-teksten of comments (Bambelo-conventie).
- **Server Components als default**; `"use client"` alleen waar interactie het echt nodig maakt.
- **Revalidatepaden** na elke mutatie expliciet: relevante combinatie van `/dashboard`, `/actiepunten`, `/feedback`, `/een-op-een`, `/team`, `/team/[id]`, `/een-op-een/[id]`.

## Belangrijke modulestructuur

```
src/
  app/(app)/         App-routes per pagina
  components/
    action-items/    Actiepunten-pagina + sub-componenten
    dashboard/       Op-je-bord, metric-kaarten, team-pulse, recente-feedback, hr-summary
    feedback/        Feedback-pagina, request-dialog, peer-respond-form
    one-on-one/      Meeting-view, preparation-form, team-list, action-item-list, person-avatar
    persona/         Persona-picker
    app/             Sidebar, persona-switcher
    ui/              shadcn-componenten
  lib/
    action-items/    queries.ts, actions.ts
    feedback/        queries.ts, actions.ts, types.ts
    one-on-ones/     queries.ts, actions.ts, types.ts
    hr/              queries.ts (HR-snapshot)
    persona/         server.ts, actions.ts, types.ts, initials.ts
    supabase/        client.ts, server.ts
    format.ts        formatDate, formatDateTime, formatRelativeWeeks
    utils.ts         cn() en Tailwind merge
```
