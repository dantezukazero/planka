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

## Phase 2 – Board-lokaler Read-only Calendar MVP

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
2. FullCalendar Standard/Community v7 in einer separaten Dependency-Änderung installieren;
   Lizenz/Lockfile und reale Bundle-Differenz reviewen.
3. Isolierte Calendar-Komponenten, Event-Adapter und Redux-ORM-Selektoren anlegen.
4. `BoardViews.CALENDAR` nur im Client ergänzen; serverseitiges `Board.defaultView` unverändert
   lassen.
5. View-Schalter, `Board.jsx` und vertikales Layout minimal ergänzen.
6. PLANKA-i18n anbinden und FullCalendar auf Browser-Lokalzeit konfigurieren.
7. Bestehende Kartenroute zum Öffnen des Modals wiederverwenden.

### Tests und Abnahmekriterien

- Selector-Tests: keine Karten ohne `dueDate`; richtige Userfilter; keine fremden Boardkarten.
- Zeitzonentests: UTC-ISO wird in Browser-Lokalzeit korrekt platziert; DST-Grenzen dokumentieren.
- UI-/Acceptance-Test: Calendar öffnen, Monat wechseln, Eintrag anklicken, Modal schließen.
- Viewer kann Kalender und Karten sehen, aber keine Editing-Funktion wird angeboten.
- Client-Lint, Client-Tests und Production-Build grün.
- Kein Backend-, Schema- oder Migrationsdiff.
- Keine Premium-Abhängigkeit und keine Pro-/Enterprise-Quelle.

### Bewusst nicht in Phase 2

- Week/Day/List/Agenda.
- Drag & Drop, Resize oder direkte Terminbearbeitung.
- Labeldarstellung im Event.
- Projekt-/instanzweite Aggregation.
- Persistierter Kalender als Board-Default.
- Backendänderungen.

## Phase 3 – Calendar UX

### Umfang

- Week View (`timeGridWeek`) und optional Day/Today.
- Today/Agenda über die freie List View.
- Labeldarstellung und verbesserte Benutzer-/Labelfilter.
- Responsive Toolbar und mobile Darstellung.
- Vollständige Lokalisierung: Buttons, Datumsformate, erster Wochentag und Accessibility-Texte.
- Visuelle Zustände für überfällig, bald fällig und erledigt, konsistent zu `DueDateChip`.
- Lazy Loading und messbare Bundle-/Render-Performance.

### Entscheidungen vor Umsetzung

- Festlegen, ob „Meine Aufgaben“ nur CardMemberships oder zusätzlich Task-Assignees umfasst.
- Prüfen, ob Kalenderansicht als `defaultView` persistierbar werden soll. Falls ja, erfordert das
  eine kleine, aber echte Server-Enum-/Validierungsänderung; eine DB-Migration ist für das bereits
  textuelle Feld voraussichtlich nicht nötig, muss aber separat geprüft werden.
- Accessibility-Prüfung für Tastatur, Fokus und Screenreader durchführen.

### Tests

- View-Wechsel Month/Week/Agenda.
- Locale-/Wochenstart-Tests mindestens für `de-DE` und `en-US`.
- Responsive Browser-Tests für Desktop und Mobile.
- Status-/Labeldarstellung und große Datenmengen.

## Phase 4 – Editing

### Umfang

- Drag & Drop eines Events ändert `Card.dueDate` über den bestehenden
  `PATCH /api/cards/:id`-Pfad.
- Editor-/Managerberechtigungen berücksichtigen; Viewer bleibt read-only.
- Optimistisches Update mit sauberem Rollback bei API-Fehler.
- Socket-Updates anderer Clients ohne Duplikate oder Sprünge übernehmen.
- Optional direkte Datum-/Zeiteingabe aus dem Kalender, möglichst durch Wiederverwendung der
  bestehenden Due-Date-UI.

### Sicherheits- und Datenregeln

- Lokale Calendar-Zeit in einen nativen `Date`-Wert überführen; die bestehende API serialisiert
  anschließend mit `toISOString()`.
- Beim Verschieben in der Month View die bisherige Uhrzeit erhalten, sofern das Produktkonzept
  nicht ausdrücklich etwas anderes festlegt.
- DST-Wechsel und ungültige/lokale Zeiten testen.
- Keine neue Mutation-API und keine DB-Migration ohne nachgewiesenen Bedarf.

### Tests

- Drag auf anderen Tag und andere Woche.
- Uhrzeiterhalt, DST, API-Fehler/Rollback.
- Viewerrechte und gelöschte/verschobene Karte während eines Drags.
- Realtime-Update aus zweitem Browserkontext.

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
