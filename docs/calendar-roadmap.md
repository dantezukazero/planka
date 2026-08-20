# PLANKA Calendar Community Fork – Roadmap

Diese Roadmap basiert auf der Community-Architektur bei Upstream-Commit
`266246e242430d921c32badecdd447514107c568`. Phase 1 enthält keine Calendar-View und keine neue
Kalenderabhängigkeit.

## Leitplanken für alle Phasen

- Ausschließlich PLANKA-Community-Code und selbst entwickelte Erweiterungen verwenden.
- Keine `.pe.`-, Pro-/Enterprise-, Scheduler-, Resource- oder kommerziellen Kalenderfeatures als
  Quelle oder Voraussetzung.
- Bestehende Lizenz-/Copyright-Hinweise erhalten und neue Dateien entsprechend kennzeichnen.
- Keine Produktivdatenbank, Produktiv-Credentials oder Produktivmigrationen für Entwicklung/Tests.
- PLANKA-Modelle und Redux ORM bleiben Source of Truth; keine parallele Kalenderdatenbank.
- Feature-Code isolieren, Core-Änderungen auf View-Schalter und Mount-Point begrenzen.
- Jeder Phase gehen Lizenz-, Upstream-SHA- und Baseline-Check voraus.

## Phase 1 – Fork, Baseline und Architektur (abgeschlossen)

- GitHub-Fork `dantezukazero/planka` erstellt.
- `origin` auf den Fork und `upstream` auf `plankanban/planka` gesetzt.
- Upstream-Default-Branch und exakter Start-SHA dokumentiert.
- Community License/License Guide geprüft; Pro-/Enterprise-Guard definiert.
- Unveränderter Client gelintet, getestet, gebaut und im Dev-Modus gestartet.
- Server-Source-Build geprüft; Windows-/Toolchain-Grenzen für Installation, Lint und Tests
  dokumentiert.
- Frontend-, Daten-, API-, Realtime- und Testarchitektur aufgenommen.
- Kalenderbibliotheken verglichen; FullCalendar Standard/Community v7 empfohlen.

## Phase 2 – Board-lokaler Read-only Calendar MVP (implementiert am 20.08.2026)

Status: Der board-lokale, read-only Month Calendar ist umgesetzt. Die Implementierung verwendet
FullCalendar Standard/Community 7.0.2, bestehende Redux-ORM-/Socket-Daten, die vorhandenen
Boardfilter und die bestehende Kartenroute. Details und Prüfnachweise stehen in
[`calendar-phase2.md`](calendar-phase2.md).

### Umfang

- Neuer lokaler Board-View `calendar` neben Kanban/Grid/List.
- Month View als initiale und einzige Kalenderdarstellung.
- Ausschließlich aktive/geschlossene Karten des aktuellen Boards mit `dueDate !== null`.
- Kartentitel und Fälligkeitszeit anzeigen.
- Klick auf Eintrag navigiert über `/cards/:id` in das bestehende PLANKA-CardModal.
- „Meine Aufgaben“ anhand der Kartenmitgliedschaft des aktuellen Users.
- Benutzerfilter mit vorhandenen Boardmitgliedschaften und bestehender Filtersemantik.
- Bestehende Board-Tabs dienen als Boardauswahl. Ein zusätzlicher boardübergreifender Filter wird
  nicht in den MVP eingebaut, weil Karten anderer Boards nicht im Client-State liegen.
- Empty State, Ladezustand und verständliches Verhalten bei Karten ohne Fälligkeit.

### Technische Schritte

1. Upstream neu fetch-en, SHA und Lizenzdateien erneut prüfen.
2. FullCalendar Standard/Community v7 ist mit geprüftem Lockfile installiert. In v7 kommen
   DayGrid und das Classic Theme als Deep Imports aus `@fullcalendar/react`; `@fullcalendar/core`
   ist dessen transitive Abhängigkeit.
3. Isolierte Calendar-Komponente und memoized Redux-ORM-Selektoren sind angelegt.
4. `BoardViews.CALENDAR` ist nur im Client ergänzt; serverseitiges `Board.defaultView` bleibt
   unverändert.
5. View-Schalter, `Board.jsx` und vertikales Layout sind minimal ergänzt.
6. PLANKA-i18n ist für Englisch/Deutsch angebunden; andere Sprachen fallen für Calendar-eigene
   Texte auf Englisch zurück. FullCalendar verwendet Browser-Lokalzeit.
7. Die bestehende Kartenroute öffnet per Event-Klick das vorhandene CardModal.

### Tests und Abnahmekriterien

- 14 Selector-Tests prüfen `dueDate`, IDs/Titel, Kartenmitgliedschaften, vorhandene User-/
  Labelfilter, geschlossene Listen, Archive/Trash, Fremd-Boards, Memoisierung und Date-/DST-Werte.
- Der Acceptance-Test ist implementiert und per Cucumber-Dry-Run strukturell validiert. Eine
  vollständige Browserausführung benötigt eine laufende, konfigurierte Testinstanz.
- Viewer erhalten keine Editing-Funktion; Calendar selbst ist strikt read-only konfiguriert.
- Client-Lint, vollständige Client-Tests und Production-Build sind grün.
- Es gibt keinen Backend-, Schema-, API- oder Migrationsdiff.
- Es gibt keine Premium-Abhängigkeit und keine Pro-/Enterprise-Quelle.

### Bewusst nicht in Phase 2

- Week/Day/List/Agenda.
- Drag & Drop, Resize oder direkte Terminbearbeitung.
- Labeldarstellung im Event.
- Projekt-/instanzweite Aggregation.
- Persistierter Kalender als Board-Default.
- Backendänderungen.

## Phase 3 – Calendar UX

Status: Implementiert am 20.08.2026. Phase 3 ergänzt die lokale Ansichtenverwaltung, eine eigene
PLANKA-Toolbar mit Monats-/Jahrespicker, Month/Week/Agenda, dynamische Locale-Bundles, bestehende
PLANKA-Label-Farben sowie responsives und theme-fähig gekapseltes Styling. Es wurden keine Backend-
oder Dependency-Änderungen vorgenommen. Details und Prüfnachweise stehen in
[`calendar-phase3.md`](calendar-phase3.md).

### Umfang

- Lokale, benutzerspezifische Verwaltung von Kanban/Grid/List/Calendar.
- Eigene responsive Toolbar mit Monats-/Jahrespicker sowie Prev/Today/Next.
- Month (`dayGridMonth`), Week (`timeGridWeek`) und Agenda (`listMonth`).
- Labelmarker aus PLANKAs vorhandenen Label-Farbklassen.
- Dynamisch geladene FullCalendar-Locales für die von PLANKA unterstützten Sprachen.
- Theme-fähig gekapselte, über Projektbildern kontrastreiche Calendar-Oberfläche.

### Entscheidungen und Grenzen

- „Meine Aufgaben“ bleibt bewusst ausschließlich auf CardMemberships beschränkt.
- Sichtbare Board-Views und die Calendar-Unteransicht werden pro User/Browser gespeichert; das
  serverseitige `defaultView` bleibt unverändert.
- Die Toolbar und der Month Picker besitzen Tastatur-, Fokus- und Screenreader-Beschriftungen.

### Tests

- Unit-Tests für View-Preferences, Navigation, Locale-Mapping, Filter-/Zeitsemantik und Labels.
- Cucumber-Acceptance für Month/Week/Agenda/CardModal und persistiert ausgeblendete Views.
- Client-Lint, vollständige Tests, Production-Build, Audit und Dependency-/Backend-Guards.

## Phase 4 – Date Ranges und Editing (implementiert am 20.08.2026)

Status: Das Card-Modell besitzt nun optional `startDate`/`start_date`; `dueDate` bleibt Ende und
Fälligkeit. Das CardModal bearbeitet Von/Bis, und gültige Zeiträume erscheinen in Month, Week und
Agenda. Board-Editoren können Events verschieben und am Ende verlängern oder verkürzen. Details und
Prüfnachweise stehen in [`calendar-phase4.md`](calendar-phase4.md).

### Umfang

- Nullable PostgreSQL-/Sails-/Redux-ORM-Feld `startDate` mit Migration und API-Unterstützung.
- Serverseitige Validierung von `startDate <= dueDate`; kein persistierter Start ohne Ende.
- Erweiterter Due-Date-Popup und Von-/Bis-Anzeige im vorhandenen CardModal.
- Exaktes Timed-Event-Mapping für Due-only und gleich-/mehrtägige Zeiträume.
- Drag & Drop für Einzeltermine und Zeiträume; End-Resize für Zeiträume.
- Optimistisches Update mit Redux-ORM- und FullCalendar-Rollback bei Save-Fehlern.
- Bestehender Socket-/Realtime-Pfad, Filter, „Meine Aufgaben“, Labels und Kartenroute.
- Trello-JSON-Import von `card.start`, mit unverändertem `due`-/`dueComplete`-Verhalten.

### Entscheidungen und Grenzen

- FullCalendars freies Interaction-Plugin kommt als Deep Import aus der vorhandenen Dependency;
  keine neue oder Premium-Abhängigkeit.
- `allDay = false` erhält PLANKAs bestehende lokale Zeitsemantik. Das Event-Ende wird nicht um einen
  Tag verändert.
- Resize am linken Rand bleibt deaktiviert; nur der Endwert wird resized.
- Viewer bleiben read-only. Archive-/Trash-Karten bleiben außerhalb des Board-Kalenders.

### Tests

- Migration, Model/API-Vertrag, Create-/Update-Validierung und Entfernen des Startwerts.
- Trello Range/Due-only/ohne Datum, `dueComplete` und ISO-Zeitzonenwerte.
- Selector-/API-/Interaction-Tests einschließlich Mitternacht, DST, Filter und Rollback.
- Cucumber-Acceptance für Month/Week/Agenda/CardModal sowie Range-Drag/Resize/Reload; der echte
  Browserlauf benötigt eine konfigurierte lokale PLANKA-Fixture.

## Spätere optionale Phase – Projekt-/globaler Kalender

Diese Erweiterung ist bewusst nicht Teil von Phase 2–4. Projekt- und Bootstrap-Endpunkte liefern
keine Karten aller Boards. Ein sauberer projekt- oder instanzweite Kalender würde voraussichtlich
benötigen:

- einen dedizierten, berechtigungsgeprüften Read-Endpunkt mit Datumsbereich und Board-/User-/
  Labelfiltern,
- Pagination oder Range-Loading,
- eine definierte Socket-Abonnementstrategie,
- zusätzliche Backend- und Berechtigungstests.

Mehrere vollständige Boards nur für den Kalender in den Client zu laden ist wegen Datenvolumen,
Socket-Räumen und ORM-Lifecycle nicht die empfohlene Architektur.

## Reihenfolge und Commit-Disziplin

Jede Phase sollte in kleine, reviewbare Commits getrennt werden:

1. Dependency + Lizenz-/Bundle-Nachweis.
2. Selektoren/Event-Adapter + Unit-Tests.
3. Isolierte Calendar-Komponenten.
4. Minimale View-Integration + Locale-Texte.
5. Acceptance-Tests und Dokumentation.

Vor jedem Push: `git diff`, `git status`, Secret-/Artefaktprüfung und Fast-Forward-Status gegen den
eigenen Fork. Kein Force Push.
