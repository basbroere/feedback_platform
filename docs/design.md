# Design

Designsysteem voor het feedbackplatform van Bambelo. Dit document beschrijft de visie achter het ontwerp en de concrete tokens, patronen en componenten zoals ze in de codebase zijn vastgelegd. Bij conflict tussen dit document en de code is de code de waarheid; meld de discrepantie en pas één van beide aan.

Inspiratie: **Nexus, SaaS Marketing Dashboard van Dipa Inhouse** ([dribbble.com/shots/23038744](https://dribbble.com/shots/23038744-Nexus-Saas-Marketing-Dashboard)). Het ontwerp leent daarvan de rust, de zachte schaduwen en de duidelijke kaartstructuur, niet de exacte kleuren.

---

## Ontwerpprincipes

Vijf principes, in deze volgorde gewogen.

1. **Instapvriendelijk binnen 30 seconden.** Een nieuwe gebruiker moet zonder uitleg snappen waar te klikken. Schermen zijn rustig, hiërarchie is duidelijk, primaire actie staat altijd op één plek per scherm.
2. **Geen druk, wel ritme.** Geen rode countdown-timers, geen schreeuwende waarschuwingen, geen verplichte deadlines. Zachte herinneringen ("je laatste 1-op-1 was 3 weken geleden") worden visueel rustig getoond, nooit als alarm.
3. **Witruimte boven dichtheid.** Brede gutters, royale padding in cards, één tot drie focuspunten per scherm. Liever scrollen dan opstapelen.
4. **Vorm volgt vertrouwelijkheid.** Privé-notities worden visueel duidelijk afgescheiden van gedeelde samenvattingen. Toon wat van wie is met behulp van toon, etiket en plaatsing.
5. **Tone of voice is informeel en menselijk.** Korte zinnen, Nederlands, geen corporate jargon, geen em-dashes. "Klaar voor je 1-op-1?" niet "Initieer uw geplande gesprek". Microcopy is onderdeel van het ontwerp, niet van de inhoud.

---

## Tech stack en code-fundament

- **Next.js 16** (App Router) met React 19 en TypeScript strict.
- **Tailwind CSS v4** via `@tailwindcss/postcss`, met design tokens als CSS-variabelen in `src/app/globals.css`.
- **shadcn/ui** (`style: base-nova`, `baseColor: neutral`, `iconLibrary: lucide`), aliases naar `@/components`, `@/components/ui`, `@/lib`.
- **Base UI** (`@base-ui/react`) als headless primitives onder de shadcn-laag (Button, Badge, Dialog, Dropdown, Tabs).
- **Lucide React** als iconen-library, default `strokeWidth={1.75}`.
- **Inter** als enige tekst-font (Google Fonts, `display: swap`), met font-feature-settings `cv11, ss01, ss03` aan in `<html>`. Tabular nums via een utility class voor metric-getallen.
- **Dark mode** wordt ondersteund door class-strategie (`.dark` op de root); alle tokens zijn dubbel gedefinieerd.

Server Components zijn default. `"use client"` alleen waar interactie het echt nodig maakt (sidebar voor `usePathname`, modals, formulieren). Dit houdt de bundle klein en de eerste paint snel.

---

## Designtokens

Alle tokens leven in `src/app/globals.css` als CSS-variabelen onder `:root` en `.dark`. Kleuren zijn in OKLCH genoteerd zodat licht en donker visueel in balans blijven.

### Kleur

#### Huiskleur

| Token | Light | Dark | Gebruik |
|---|---|---|---|
| `--bambelo` | `oklch(0.6884 0.1745 32.31)` (≈ `rgb(236 101 70)`) | `oklch(0.74 0.16 32.31)` | Bambelo-oranje, primair accent |
| `--bambelo-foreground` | `oklch(0.985 0 0)` | `oklch(0.18 0.02 32)` | Tekst op oranje |

De huiskleur is bewust **één enkel accent**, geen palet. Hij verschijnt in primaire knoppen, focusringen, actieve sidebar-staten, de feedback-categorie en grafiekreeks 1. Gebruik nooit grote vlakken Bambelo-oranje als achtergrond; het is een accent, geen vulling.

#### Oppervlakken

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(0.972 0.003 250)` (rustig koel off-white) | `oklch(0.16 0.006 260)` |
| `--card` | `oklch(1 0 0)` (zuiver wit) | `oklch(0.2 0.006 260)` |
| `--popover` | gelijk aan `card` | gelijk aan `card` |
| `--sidebar` | `oklch(1 0 0)` | `oklch(0.18 0.006 260)` |
| `--muted` | `oklch(0.965 0.004 70)` | `oklch(0.23 0.006 260)` |
| `--border` | `oklch(0.91 0.004 70)` | `oklch(1 0 0 / 8%)` |

Het verschil tussen `background` (off-white) en `card` (wit) is bewust subtiel: cards springen er net genoeg uit zonder dat het scherm onrustig wordt.

#### Tekst

| Token | Light | Dark |
|---|---|---|
| `--foreground` | `oklch(0.18 0.01 260)` (donkergrijs) | `oklch(0.96 0.004 70)` |
| `--muted-foreground` | `oklch(0.5 0.01 260)` | `oklch(0.66 0.008 260)` |
| `--primary-foreground` | wit | bijna zwart |

Lichaamtekst staat altijd op `foreground`, secundaire labels op `muted-foreground`. Gebruik geen handmatige grijswaardes.

#### Status en grafieken

| Token | Light | Gebruik |
|---|---|---|
| `--destructive` | `oklch(0.58 0.16 27)` | Foutmeldingen, gevaarlijke acties, alleen met opacity-vlakken (`/10`, `/20`) |
| `--chart-1` | huiskleur Bambelo | Primaire dataserie |
| `--chart-2` | `oklch(0.7 0.13 250)` | Blauw |
| `--chart-3` | `oklch(0.78 0.13 180)` | Teal |
| `--chart-4` | `oklch(0.74 0.13 70)` | Amber |
| `--chart-5` | `oklch(0.6 0.1 290)` | Violet |

Er is geen "succes-groen" of "warning-amber" als status-token; visuele status loopt via het toon-systeem (zie onder) en via tekst, niet via felle vlakken.

### Toon-systeem (`src/lib/ui/tone.ts`)

Acht semantische tonen die per categorie een **iconen-chip** en zachte achtergrond geven. Dit is hét enige plek waar pastelvlakken in de UI verschijnen.

| Tone | Gebruik in app |
|---|---|
| `primary` | Home, Feedback (huiskleur) |
| `blue` | 1-op-1 gesprekken |
| `emerald` | Actiepunten |
| `amber` | Functioneringsgesprek |
| `violet` | Team |
| `sky` | Templates |
| `rose` | Beheer |
| `slate` | Neutrale fallback |

Voor elke toon zijn er vier varianten beschikbaar:

- `TONE_BG`: pastel-achtergrond plus accent-tekst (voor de iconen-chips, bv. `bg-blue-50 text-blue-600`).
- `TONE_SOFT_BG`: pastel met extra transparantie (voor card-achtergronden van bijvoorbeeld een feedback-item).
- `TONE_RING`: pastel ring (voor focus of nadruk).
- `TONE_ACCENT`: enkel de accent-tekstkleur.

De vaste koppeling tussen module en toon (`CATEGORY_TONE`) garandeert dat 1-op-1 overal blauw is, een actiepunt overal emerald, en zo verder. Wijk daar niet ad-hoc van af.

### Typografie

Eén font, gewichten 400 / 500 / 600, geen 700.

| Stap | Toepassing | Klassen |
|---|---|---|
| Display | Begroeting op dashboard | `text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight` |
| H1 (pagina) | `PageTitle` | `text-[24px] md:text-[28px] font-semibold tracking-tight leading-tight` |
| H2 (sectie) | Kop binnen een card | `text-base font-medium` (via `CardTitle`) |
| Metric | Grote getallen in KPI-cards | `text-[24px] font-semibold leading-none tracking-tight tabular-nums` |
| Body | Lopende tekst | `text-sm` (`14px`) |
| Label | Secundaire labels onder metrics | `text-[12.5px] text-muted-foreground` |
| Caption | Subtitle in `PageTitle` | `text-[13px] text-muted-foreground` |
| Eyebrow | Sidebar-sectiekop, badges | `text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70` |

`tabular-nums` is verplicht voor elke kolom met cijfers (KPI's, telmetrics) zodat ze visueel niet schokken bij update.

### Schaduw en radius

| Token | Waarde | Gebruik |
|---|---|---|
| `--radius` | `0.75rem` (12px), basis | Knoppen, inputs |
| `rounded-lg` | `calc(0.75rem)` | Form-controls, nav-items |
| `rounded-xl` | `calc(0.75rem * 1.4)` = 16.8px | Cards (kleine), iconen-chips |
| `rounded-2xl` | `calc(0.75rem * 1.8)` = 21.6px | Cards (default in dashboard) |
| `rounded-4xl` | `calc(0.75rem * 2.6)` | Badges (pill-vorm) |

Schaduwen zijn altijd zacht en kort.

- `shadow-sm`: default voor een card in rust.
- `transition-shadow hover:shadow-md`: standaard hover-affordance op klikbare cards.
- `shadow-[1px_0_12px_0_rgba(0,0,0,0.06)]`: speciale, fijne schaduw rechts van de sidebar om de sidebar van de hoofdcontent te scheiden zonder harde lijn.

Borders zijn meestal afwezig op cards; we leunen op de combinatie van witte vulling op off-white achtergrond plus zachte schaduw. Een border verschijnt alleen wanneer dat semantisch is (dashed border voor lege staat, ring rond een actief item).

### Spacing

Tailwind defaults. In de praktijk:

- **Pagina-padding** (`(app)/layout.tsx`): `px-6 py-10 md:px-10 md:py-12`. Geen max-width, het grid binnen de pagina bepaalt de breedte.
- **Card-padding**: `px-5 py-4` (compact), `px-5 py-5` (default), `px-4` (in shadcn `CardContent`).
- **Sectie-stack**: `gap-3` voor metric-rows, `gap-4` of `gap-6` voor card-grids, `gap-5` voor sidebar-secties.
- **Icoon-chip**: vaste `h-11 w-11 rounded-xl` voor page-titles en metrics, `h-10 w-10` voor quick actions, `h-9 w-9` voor inline categorieën, `h-7 w-7` voor sidebar-items.

---

## Layoutpatronen

### App-shell (`src/app/(app)/layout.tsx`)

```
+--------------------+----------------------------------------+
| Sidebar (244px)    | Pagina-padding 6/10                     |
| sticky h-svh       |   PageTitle                             |
| logo               |   Sectie                                |
| nav-secties        |   Sectie                                |
| persona-switcher   |                                         |
+--------------------+----------------------------------------+
```

- Sidebar verschijnt vanaf `md` (`md:flex`). Daaronder mobile-only mechanisme nog beperkt; in de demo werken we vanaf desktop.
- Logo links boven in de sidebar, persona-switcher onderaan.
- Hoofdcontent is verticaal gestructureerd in een `flex flex-col gap-…` stapel, geen vaste grid op het toplevel.

### PageTitle (`src/components/ui/page-title.tsx`)

Elk app-scherm begint met een `<PageTitle>`. Het bestaat uit:

- Iconen-chip links (44 × 44, `rounded-xl`, toon-achtergrond).
- Titel (24 of 28px, semibold, tracking-tight).
- Optionele subtitle (13px, muted).
- Optionele `action`-slot rechts voor een primaire knop of dropdown.

De koppeling toon → module is verplicht: 1-op-1 pagina krijgt `tone="blue"`, actiepunten `tone="emerald"`, enzovoort.

### Dashboard-grid

Het dashboard gebruikt een stapel van blokken met verschillende dichtheid:

1. **Begroeting** ("Goedemorgen, Jasper"): display-text plus context-zin, geen kader.
2. **MetricCards** (`grid sm:grid-cols-3`): drie strakke KPI's, getal links naast label.
3. **Hoofdblok** (`On your plate` of equivalent): grootste card met de belangrijkste actie van vandaag.
4. **Quick actions**: 3 of 4 rounded-2xl cards naast elkaar voor secundaire flows.
5. **Lijsten** (`Team pulse`, `Recent feedback`): lijst-vorm in een rounded-2xl card, divide-y voor regels.

Voor managers verschijnt aanvullend een team-overzicht; voor HR komt er een organisatie-aggregatieblok bovenop (geen drilldown naar individuele gespreksinhoud, zie privacy hieronder).

### Card-archetypes

| Archetype | Klassen | Voorbeeld |
|---|---|---|
| **Metric** | `flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm` | `MetricCards` |
| **Quick action** | `group relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md` | `QuickActions` |
| **Lijst-card** | `overflow-hidden rounded-2xl bg-card shadow-sm` met `<ul class="divide-y">` | `TeamPulse`, `OnYourPlate` |
| **Feedback-item** | `relative overflow-hidden rounded-2xl bg-primary/5 px-5 py-4 shadow-sm` | `RecentFeedback` (gebruikt huiskleur als zachte tint) |
| **Lege staat** | `rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center` | overal waar lijsten leeg zijn |

De `shadcn`-`Card` is bewust een kleinere variant (`rounded-xl`, `py-4`, `text-sm`) en is bedoeld voor secundaire content in formulieren en detailpagina's. Voor de dashboardstijl gebruiken we de directe `rounded-2xl bg-card shadow-sm`-patronen omdat die meer ademen.

---

## Componentbibliotheek

`src/components/ui` bevat de gedeelde primitives. Alles is via shadcn ingericht maar leunt op `@base-ui/react` voor toetsenbordtoegankelijkheid.

| Component | Variants | Sizes | Bijzonderheden |
|---|---|---|---|
| `Button` | `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` | `xs`, `sm`, `default` (h-8), `lg`, `icon`, `icon-xs/sm/lg` | Active state drukt 1px naar beneden (`active:translate-y-px`), focus-ring 3px |
| `Badge` | `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` | n.v.t. | Hoogte 20px, pill-vorm (`rounded-4xl`), 12px tekst, ondersteunt SVG-prefix |
| `Card` | n.v.t. | `default`, `sm` | shadcn-variant, kleinere padding dan dashboard-cards |
| `Dialog`, `Sheet` | n.v.t. | n.v.t. | Voor modals en zijpanelen; backdrop op `bg-foreground/40` |
| `Dropdown menu`, `Tabs` | n.v.t. | n.v.t. | Default shadcn-stijl met onze tokens |
| `Avatar` | n.v.t. | n.v.t. | Cirkel, initialen-fallback |
| `Input`, `Textarea`, `Label` | n.v.t. | n.v.t. | Borders gebruiken `--input`, focus-ring matcht knop |
| `Separator`, `Skeleton` | n.v.t. | n.v.t. | Skeletons in `bg-muted` met fade |
| `PageTitle` | n.v.t. | n.v.t. | Standaard header voor elke pagina |

Buttons:

- **Default** is gevuld met de huiskleur en is de primaire actie van een scherm.
- **Outline** is de standaard voor secundaire acties.
- **Ghost** voor tertiaire of icoonacties.
- **Destructive** is bewust zacht (`bg-destructive/10 text-destructive`) en niet vol rood, om druk te vermijden.

Aria-status:

- Focus is altijd zichtbaar: 3px ring in de huiskleur.
- Invalid state krijgt een rode rand en ring met opacity.
- Toetsenbordnavigatie is per primitive door Base UI gegarandeerd.

---

## Navigatie

### Sidebar (`src/components/app/sidebar.tsx`)

- Breedte 244px, vaste positie, zachte rechter-schaduw.
- Logo bovenaan in de sidebar-padding (`pt-7 pb-8`).
- Items in genummerde secties met eyebrow-labels ("Menu", "Gesprekken", "Beheer").
- Elk item heeft een iconen-chip die actief de toon van de module krijgt. Niet-actieve items tonen het icoon in `text-foreground/55` zonder achtergrond.
- Active state: `bg-sidebar-accent text-foreground` plus actieve toon op de chip. Hover: `bg-sidebar-accent/60`.
- Persona-switcher staat onderaan boven een fijne `border-sidebar-border/40` lijn.

Rol bepaalt de items:

- **Medewerker**: Home, Actiepunten, Feedback, 1-op-1, Functionering.
- **Manager**: idem plus Team.
- **HR-admin**: alles plus Beheer-sectie met Templates en Beheer.

### Persona-switcher (`src/components/app/persona-switcher.tsx`)

In demo-modus de manier om snel van rol te wisselen. Dropdown gegroepeerd per team. Cookie houdt de keuze bij; geen Supabase Auth in demo.

---

## Iconen

Lucide React, geïmporteerd uit `lucide-react`. Vaste keuzes:

- `LayoutGrid` → Home
- `UsersRound` → Team
- `CheckSquare` → Actiepunten
- `MessageCircle` → Feedback
- `MessageSquareText` → 1-op-1
- `ClipboardCheck` → Functioneringsgesprek
- `Sliders` → Templates
- `ShieldCheck` → Beheer

Stroke-weight standaard `1.75`. Iconen worden in `h-4 w-4` of `h-5 w-5` getoond, ingebed in een toon-chip.

Gebruik geen emoji als icoon, en geen Heroicons.

---

## Tone of voice in UI-tekst

Microcopy is design. Hou je aan deze richtlijnen wanneer je tekst schrijft of laat schrijven.

- **Aanspreken** met `je`, nooit `u`.
- **Werkwoord eerst** voor knoppen: "Opslaan", "Verzenden", "Plannen". Geen substantief-CTA's ("Verzending").
- **Korte zinnen**. Eén idee per zin.
- **Geen em-dashes** in UI-strings of code-comments. Vervang door komma's, puntkomma's of een nieuwe zin.
- **Empty states** zijn vriendelijk en uitnodigend: "Nog niets ingevuld, neem 2 minuten." in plaats van "Geen data beschikbaar".
- **Tijdsindicatie** is relatief: "3 dagen geleden", "over 2 weken". Datums alleen waar precisie nodig is.
- **Acties verwijzen** naar de gebruiker, niet naar het systeem: "Plan een 1-op-1", niet "Systeem creëert nieuwe sessie".
- **Geen ondertonen van druk**: vermijd "moet", "verplicht", "uiterlijk". Gebruik "kun je", "is een mooi moment", "rond af wanneer het past".

---

## Privacy als ontwerp

Privacy is geen ICT-knop maar een UI-keuze. Zo zichtbaar maken we het:

1. **Privé-notities en gedeelde samenvatting** staan in `Tabs` met expliciete labels "Privé" en "Gedeelde samenvatting". Privé heeft `tone="slate"` en een slot-icoon; gedeeld heeft de toon van de module.
2. **Een privé-veld toont altijd een banner**: "Alleen jij ziet dit. Wordt niet gedeeld met [naam medewerker]."
3. **Read-only voorbereiding van de medewerker** wordt visueel als kaart met een licht muted-veld en het label "Door [naam] ingevuld op [datum]" getoond, zodat de manager nooit per ongeluk denkt iets te bewerken.
4. **HR-aggregaties** tonen alleen telcijfers en percentages. Een tabel met namen krijgt nooit een kolom met gespreksinhoud. Klikbaar diepteniveau stopt bij metadata (status, datum), nooit bij tekst.
5. **360 peer-feedback met naam**: bij het invullen staat boven het formulier een duidelijke notice "Je naam is zichtbaar voor [collega] en de manager". Geen anonimiteit; deze keuze hoort transparant uitgelegd in de UI.

---

## States en interactie

| State | Visueel |
|---|---|
| Default | Card met `shadow-sm`, neutrale rand |
| Hover (klikbaar) | `hover:shadow-md`, geen kleurverandering |
| Active (knop) | `translate-y-px` voor lichte druk |
| Focus | 3px ring in huiskleur (`focus-visible:ring-ring/50`) |
| Disabled | `opacity-50 pointer-events-none` |
| Invalid | Rode rand en ring (`aria-invalid:ring-destructive/20`) |
| Loading | `Skeleton` in `bg-muted` met fade-pulse |
| Empty | Dashed border-card met centrale uitnodiging |

Microinteracties zijn altijd `transition-all` of `transition-shadow`, korte duur (Tailwind default), `ease`-curve. Geen springende of bouncende animaties.

Toetsenbord:

- Tab-volgorde volgt de visuele leesrichting.
- Esc sluit altijd modals en dropdowns.
- Enter activeert primaire knoppen, ook in formulieren.

---

## Patronen per module

Visuele identiteit per gesprekstype zorgt dat de gebruiker direct weet waarin hij zich bevindt.

### 1-op-1 (`tone="blue"`)

- Iconen: `MessageSquareText` voor de module, `CheckSquare` voor afgeleide actiepunten.
- Lijstcard met aankomende en recente 1-op-1's, gesorteerd op datum.
- Voorbereidingsscherm: één kolom, vragen onder elkaar, alles optioneel, geen verplichte velden.
- Meeting-scherm voor manager: drie panelen of tabs (Voorbereiding medewerker, Vorige actiepunten, Notities). Tabs "Privé" en "Gedeelde samenvatting" zijn duidelijk gescheiden.

### Functioneringsgesprek (`tone="amber"`)

- Iconen: `ClipboardCheck`.
- Cyclus-dashboard toont drie parallelle stromen (medewerker, manager, peers) met progress-indicatie. Status is "ingevuld", "uitgenodigd", "open"; geen percentages, geen rode countdowns.
- Peer-uitnodiging maakt cross-team-relatie zichtbaar met een aparte badge in de violet-toon.
- 360-invulscherm bevat een privacy-notice in de huiskleur-tint.

### Beoordelingsgesprek

- Iconen: `ShieldCheck` of `Award` (afhankelijk van scherm).
- Per ontwikkelpunt een kleine kaart met manager-oordeel (gerealiseerd, deels, niet, vervallen) en toelichting. Geen sterren, geen cijferscore.
- Klikbare keten: vanuit een ontwikkelpunt door naar het bronfunctioneringsgesprek. Visueel een breadcrumb-keten boven in het scherm.

### Actiepunten

- Iconen: `CheckSquare` (emerald).
- Lijst-card met status-badges (`open`, `afgerond`, `vervalt`). Status-kleuren zijn gedempte tonen, geen rood-groen.
- Inline edit op richtdatum en notities; geen modale dialoog tenzij verplicht.

### Feedback (`tone="primary"`)

- Iconen: `MessageCircle`.
- Feedback-items in een zachte huiskleur-tint (`bg-primary/5`).
- AI-knop "Maak constructiever" verschijnt naast vrije tekstvelden waar feedback in zit. Visueel een `Button` `variant="outline"` met `Sparkles`-icoon. Voorstel toont in een diff-achtige weergave: origineel boven, voorstel onder, twee knoppen ("Overnemen", "Negeren") in dat blok.

---

## Demo-modus visueel

- Startscherm (`src/app/page.tsx`) toont logo links en titel "Kies een persona" rechts in één rij. Daaronder gegroepeerde personalijst per team.
- Persona-cards in een grid, elk met avatar (initialen of foto), naam, rol, team. Active hover-state met zachte schaduw.
- Geen registratieflow, geen wachtwoordvelden. Demo-reset is bereikbaar via HR-beheer.

---

## Dark mode

Volledig ondersteund via class-strategy. Tokens schakelen automatisch om door `.dark` op `<html>`.

Aandachtspunten in donker:

- Toon-achtergronden gebruiken `dark:bg-…-950/40` zodat ze niet gaan gloeien.
- Witte cards worden licht-blauwgrijs (`oklch(0.2 0.006 260)`), niet zwart.
- Schaduwen blijven werken via opaciteit; geen extra dark-shadow-tokens nodig.

---

## Wat we niet doen

Een herhaling van de no-go's uit `CLAUDE.md`, vertaald naar design.

- **Geen rode countdown-timers of waarschuwingsiconen** voor administratieve achterstand. Een open actiepunt is een lijstregel, geen alarm.
- **Geen numerieke beoordeling op een mens.** Tekst en categorische status, nooit sterren of cijfers.
- **Geen email-stijl notificaties** in de UI. Subtiele dot in de sidebar, modale toast voor live actie, klaar.
- **Geen gamification**, geen badges met "Topbijdrager".
- **Geen anonimiteit-iconen** bij peer feedback; transparantie is de keuze.
- **Geen complexe permissions-UI.** Drie rollen, klaar.
- **Geen onboarding-tour of tooltip-spektakel.** Als een feature uitleg nodig heeft, ontwerpen we de feature opnieuw.

---

## Designreview-checklist

Vink bij elke nieuwe component of pagina af:

- [ ] Past het in de bestaande toon (kleur klopt met de module)?
- [ ] Gebruikt het de juiste card-archetype, geen ad-hoc styling?
- [ ] Is er minstens één lege staat ontworpen?
- [ ] Toont privé wat privé moet zijn, met label en banner?
- [ ] Is er een primaire actie per scherm, niet drie?
- [ ] Is de copy informeel, kort, en zonder em-dashes?
- [ ] Werkt het in dark mode zonder extra overrides?
- [ ] Is focus zichtbaar via toetsenbord?
- [ ] Voelt het na 5 seconden kijken nog rustig?

---

## Bestandsmap (waar staat wat)

```
src/
  app/
    globals.css                 → design tokens, font-features
    layout.tsx                  → html-lang, Inter font, body classes
    page.tsx                    → demo-startscherm met persona-keuze
    (app)/
      layout.tsx                → app-shell met sidebar plus content-padding
  components/
    app/
      sidebar.tsx               → vaste sidebar, secties, toon per item
      persona-switcher.tsx      → dropdown rechtsboven voor demo
    ui/                         → shadcn-primitives plus PageTitle
    dashboard/                  → dashboardblokken (metric, plate, quick-actions, lijsten)
  lib/
    ui/
      tone.ts                   → semantische toon-koppeling per categorie
```

Wijzig tokens alleen in `globals.css`. Wijzig toon-koppelingen alleen in `lib/ui/tone.ts`. Wijzig sidebar-items in `components/app/sidebar.tsx`. Houd het simpel; vermijd parallelle styling-systemen.

---

*Versie 0.1, juni 2026. Update dit document zodra een nieuw patroon meer dan eens in de codebase voorkomt.*
