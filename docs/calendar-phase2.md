# PLANKA Calendar Community Fork – Phase 2

Stand: 20.08.2026

## Scope und Ergebnis

Phase 2 ergänzt PLANKA Community um eine vierte, board-lokale Ansicht:

```text
Kanban | Grid | List | Calendar
```

Die Ansicht zeigt ausschließlich bereits geladene Karten aus aktiven und geschlossenen Listen des
aktuellen Boards, wenn `Card.dueDate !== null` ist. Sie bietet nur die Month View. Event-Klicks
öffnen über die bestehende Route `/cards/:id` das bestehende PLANKA-CardModal. Es gibt weder
Kalender-Editing noch einen neuen Backend-Endpunkt, Socket, Poller oder Datenbestand.

## Baseline und Guards

- Start-HEAD und `origin/master`: `9c53e586411af1c41e73097ed60e639d0f009eb4`
- `upstream/master` beim Start: `266246e242430d921c32badecdd447514107c568`
- Upstream hatte seit Phase 1 keinen neuen Commit.
- Verwendet wurden ausschließlich Community-Dateien dieses Forks und öffentliche
  FullCalendar-Standard-Dokumentation.
- Pro-/Enterprise-Code wurde weder gelesen noch verwendet.
- Premium-FullCalendar-Pakete und Premium-Plugins wurden nicht installiert oder verwendet.
- `server/`, API, Datenbankmodell und Migrationen bleiben unverändert.

## FullCalendar-Abhängigkeiten

Direkt installiert:

- `@fullcalendar/react` 7.0.2 – MIT
- `temporal-polyfill` 1.0.4 – MIT; Peer-Abhängigkeit von FullCalendar v7

Durch `@fullcalendar/react` kommen `@fullcalendar/core` 7.0.2 und
`@full-ui/headless-calendar` 7.0.2 transitiv hinzu; beide sind MIT-lizenziert. FullCalendar v7
stellt Standard-Views und Themes als Deep Imports aus `@fullcalendar/react` bereit. Daher wurde
kein separates v6-artiges `@fullcalendar/daygrid`-Paket installiert. Verwendete Standard-Imports:

- `@fullcalendar/react/daygrid`
- `@fullcalendar/react/themes/classic`
- `@fullcalendar/react/locales/de`

Nicht installiert sind `interaction`, Scheduler, Resource Timeline, Resource TimeGrid oder ein
Premium Bundle. Die Versionen sind exakt im Client-Lockfile fixiert.

Referenzen: [FullCalendar React v7](https://fullcalendar.io/docs/react),
[v7-Migration](https://fullcalendar.io/docs/upgrading-from-v6-js) und
[Lizenzübersicht](https://fullcalendar.io/license).

## Architektur und Integrationspunkte

- `BoardViews.CALENDAR = 'calendar'` existiert ausschließlich im Client.
- Der vorhandene Umschalter in `BoardActions/RightSide` bietet Calendar nur im normalen
  Board-Kontext an, nicht in Archive oder Trash.
- `Board.jsx` mountet die isolierte `CalendarView` im Board-Kontext.
- `Static.jsx` behandelt Calendar wie Grid/List als vertikale Ansicht ohne Kanban-Horizontalscroll.
- `Board.defaultView`, Server-Enums und Persistenz sind absichtlich unverändert. Nach einem Reload
  gilt wieder die serverseitig persistierte Standardansicht.
- Ein Event-Klick dispatcht den vorhandenen Router-Push auf `Paths.CARDS`. Beim Schließen des
  CardModals bleibt der lokale Board-View in der aktuellen Session erhalten, da das bereits
  geladene Board auf diesem internen Routenwechsel nicht neu vorbereitet wird.

## Event-Mapping und Realtime

`selectCalendarEventsForCurrentBoard` ist ein memoized Redux-ORM-Selector. Er verwendet
`Board.getFilteredCardsModelArray()` und bildet jede passende Karte auf das kleine Event-Modell ab:

```text
id
title
start
allDay = false
cardId
userIds
labelIds
```

`start` bleibt das native `Date` aus `Card.dueDate`; es wird weder kopiert noch auf Mitternacht
normalisiert oder als All-Day-Termin markiert. FullCalendar läuft mit `timeZone="local"`, sodass
UTC-Transport und Browser-Lokaldarstellung dieselbe Semantik wie die bestehende Due-Date-UI
behalten.

Der Selector liest ausschließlich den vorhandenen Redux-ORM-State. Dadurch werden Karten-,
Due-Date-, Kartenmitgliedschafts- und Labeländerungen über PLANKAs bestehende Socket-/Reducer-
Pipeline sichtbar. Es gibt keine neue Socket-Verbindung, kein Polling und kein Nachladen von
Archive-/Trash-Karten.

## Filtersemantik

- Suche, Benutzer- und Labelfilter werden über die bestehende
  `Board.getFilteredCardsModelArray()`-Semantik respektiert.
- Der vorhandene allgemeine Benutzerfilter behält PLANKAs heutige Semantik; diese kann neben
  CardMemberships automatisch Task-Assignees berücksichtigen.
- Der Calendar-eigene Toggle „Meine Aufgaben“ verwendet dagegen bewusst nur `card.users` und
  damit ausschließlich CardMemberships des aktuellen Benutzers.
- Der Toggle ist lokaler UI-State und erzeugt keine zweite Kartenkopie im Redux-State.
- Ein ungefilterter Hilfsselector unterscheidet „keine Karte mit Fälligkeitsdatum“ von „keine Karte
  entspricht den aktuellen Filtern“.

## Darstellung und Lokalisierung

Die Calendar-Komponente importiert nur FullCalendars Skeleton-, Classic-Theme- und Classic-
Palette-CSS. Eigene Anpassungen liegen in einem CSS Module und globale FullCalendar-Selektoren sind
unter dem Calendar-Wrapper gekapselt. Da FullCalendar v7 interne Klassen hasht, wird die stabile
Event-Klasse über die öffentliche `eventClass`-Option injiziert. Die Ansicht ist für schmalere
Fenster scrollbar, ohne den Kanban-Scroll auf die Boardansicht zu übertragen.

Neue PLANKA-Texte existieren in Englisch und Deutsch: Calendar/Kalender, My tasks/Meine Aufgaben
und beide Empty States. PLANKAs bestehendes `fallbackLng: 'en-US'` liefert den Text-Fallback für
andere Sprachen. FullCalendar verwendet die deutsche Locale für `de-DE`, ansonsten den eingebauten
englischen Fallback. Damit sind Buttontexte und erster Wochentag für Englisch/Deutsch definiert.

## Automatisierte Prüfungen

- Client-Lint: erfolgreich.
- Vollständige Jest-Suite: 2 Suites, 16 Tests, alle erfolgreich.
- Calendar-Selector-Suite: 14 Tests, alle erfolgreich.
- Production-Build: erfolgreich; 7.701 transformierte Module in rund 49 Sekunden.
- Cucumber Acceptance Dry Run: erfolgreich; alle Calendar-Schritte und Feature-Bindings erkannt.
- Vollständiger Browserlauf: nicht ausgeführt, weil lokal keine steuerbare Browserinstanz und keine
  konfigurierte Acceptance-Testinstanz verfügbar waren. Der Test erwartet
  `CALENDAR_BOARD_PATH` und `CALENDAR_CARD_TITLE` für eine Fixture-Karte mit `dueDate`.

Ein zusätzlicher Jest-Komponententest wurde bewusst nicht eingeführt: Die vorhandene Jest-
Infrastruktur enthält weder jsdom noch ein React-Rendering-Testframework. Ein allgemeiner
Testframework-Umbau wäre für diesen MVP unverhältnismäßig; Selector- und Acceptance-Abdeckung
prüfen stattdessen Datenlogik und Benutzerfluss.

## Dependency Audit und Bundle-Hinweise

`npm audit` meldet nach der Installation 12 bekannte Funde: 6 low, 5 moderate, 1 high und 0
critical. Das entspricht exakt der in Phase 1 dokumentierten Baseline. Keiner der Funde liegt in
FullCalendar, `@full-ui/headless-calendar` oder `temporal-polyfill`; deshalb wurden keine
unabhängigen Dependency-Upgrades oder erzwungenen Audit-Fixes vorgenommen.

Der Production-Build stieg von 7.651 auf 7.701 transformierte Module. Vite meldet weiterhin die
bereits bekannten Warnungen zu großen Chunks, Dependency-CSS und `eval` in einer bestehenden
Diplodoc-Abhängigkeit. Eine spätere Phase kann die Calendar View per Lazy Loading abtrennen; das ist
kein Funktionsbestandteil des read-only MVP.

## Manuelle Testmatrix

Für eine laufende Testinstanz sind folgende Fälle vorgesehen:

1. Karten ohne, mit heutigem und künftigem `dueDate`: nur die beiden terminierten Karten erscheinen.
2. „Meine Aufgaben“: nur Karten mit CardMembership des aktuellen Users erscheinen.
3. Benutzer-/Labelfilter: nur passende Karten erscheinen.
4. Event-Klick: das bestehende CardModal öffnet; nach dem Schließen bleibt Calendar aktiv.
5. `dueDate` im CardModal ändern oder entfernen: Event aktualisiert sich beziehungsweise verschwindet
   über den bestehenden State-/Socket-Flow.
6. Calendar → Kanban → Calendar: Wechsel ohne State-Korruption.
7. Closed-List-Karte erscheint; Archive-/Trash-Karten erscheinen nicht.

## Bekannte Einschränkungen und Phase 3

Bewusst verschoben bleiben Week/Day/Agenda/Year Views, Drag & Drop, Resize, Due-Date-Editing,
Labeldarstellung im Event, projekt-/instanzweite Aggregation, persistierter Calendar-Default und
vollständige Locale-Pakete für alle PLANKA-Sprachen. Phase 3 sollte außerdem responsive Toolbar,
visuelle Due-Status, Accessibility-Browsertests, Lazy Loading und Bundlemessung vertiefen.

Das größte Upstream-Konfliktrisiko liegt in den drei kleinen Core-Mount-Points (`Enums`,
`RightSide`, `Board`/`Static`) sowie in Locale-Dateien. Selector und Calendar-Komponente sind
isoliert und sollten bei einem späteren Upstream-Rebase weitgehend konfliktarm bleiben.
