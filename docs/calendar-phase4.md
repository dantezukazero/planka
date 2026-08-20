# PLANKA Calendar – Phase 4

Phase 4 ergänzt den board-lokalen Community-Kalender um optionale Kartenzeiträume und direktes
Editing. PLANKAs Card-Modell, `PATCH /api/cards/:id`, Redux ORM und der vorhandene Board-Socket-Raum
bleiben die einzige Datenquelle. Es gibt weder Polling noch einen zweiten Kalender-State.

## Datenmodell und Migration

`Card.dueDate` bleibt unverändert Fälligkeit beziehungsweise Ende. Neu ist das nullable Feld
`Card.startDate` mit der PostgreSQL-Spalte `card.start_date`. Die Migration
`20260820000000_add_card_start_date.js` legt einen `timestamp with time zone` an und kann die Spalte
im Down-Pfad wieder entfernen.

Die gültigen Zustände sind:

- `startDate = null`, `dueDate != null`: kompatibler Einzel-/Fälligkeitstermin.
- `startDate != null`, `dueDate != null`: Zeitraum, wobei `startDate <= dueDate` gelten muss.
- beide Werte `null`: Karte ohne Kalendertermin.

Ein Start ohne Ende sowie ein Start nach dem Ende werden serverseitig mit `422 Unprocessable
Entity` abgewiesen. Der Update-Helper validiert dabei die effektive Kombination aus gespeichertem
Datensatz und partiellen PATCH-Werten. Der Client verhindert dieselben ungültigen Zustände im
Editor. Falls trotzdem ein historisch beschädigter Range-Wert im Client-State auftaucht, stellt der
Kalender den vorhandenen `dueDate` als Einzeltermin dar, statt ein ungültiges FullCalendar-Event zu
erzeugen.

## API, Model und Realtime

Das Sails-Card-Model mappt `startDate` auf `start_date`. Create- und Update-Controller akzeptieren
ISO-8601-Werte; Update akzeptiert zusätzlich `null`, damit ein Start entfernt werden kann. Create-,
Update- und Duplicate-Helper übernehmen das Feld. Die Client-API wandelt eingehende ISO-Werte in
native `Date`-Objekte und ausgehende Werte mit `toISOString()` zurück.

Erfolgreiche Änderungen laufen weiterhin durch den vorhandenen Card-Update-Helper. Dessen
`cardUpdate`-Broadcast aktualisiert andere abonnierte Clients über den vorhandenen
`board:<boardId>`-Raum; Redux ORM verarbeitet die Antwort und Socket-Updates wie bisher. Es gibt
keinen zusätzlichen Endpunkt, Socket oder State.

## CardModal: Von/Bis

Der vorhandene Due-Date-Popup wurde erweitert. „Von“ kann per Checkbox aktiviert oder entfernt
werden; „Bis“ bleibt der verpflichtende Fälligkeitswert. Für beide Endpunkte werden die vorhandenen
lokalisierten Date-/Time-Inputs und derselbe Inline-DatePicker verwendet. Speichern schreibt beide
Werte atomar, „Entfernen“ löscht beide Werte. Das Modal zeigt bei Zeiträumen getrennte Von-/Bis-Chips;
der Erledigt-Status bleibt ausschließlich am Fälligkeits-/Bis-Wert.

## Phase 4.1 – Date-Range UX Polish

Phase 4.1 aktiviert Resize an beiden Grenzen eines Kalenderzeitraums. Der linke Handle schreibt
ausschließlich `startDate`, der rechte ausschließlich `dueDate`; normales Drag verschiebt weiterhin
beide Grenzen gemeinsam. Die bestehende Prüfung `startDate <= dueDate`, der optimistische
Card-Update-Pfad, Realtime-Broadcast und Fehler-Rollback werden unverändert wiederverwendet.

Auch Due-only-Events sind nun resizable. Ein Resize nach rechts übernimmt den bisherigen
`dueDate`-Zeitpunkt als `startDate` und speichert den gezogenen Endpunkt als neues `dueDate`. Ein
Resize nach links speichert den gezogenen Punkt als `startDate` und behält den bisherigen
`dueDate`-Zeitpunkt als Ende. Die Umwandlung erfolgt mit einem atomaren Card-Update; bei einem
API-Fehler stellt der Rollback ausdrücklich `startDate = null` und den ursprünglichen `dueDate`-Wert
wieder her. Ein normales Drag eines Due-only-Events ändert weiterhin nur `dueDate`.

Der Inline-DatePicker visualisiert vorhandene Zeiträume mit deutlich markiertem Von-/Bis-Tag und
einer zusammenhängenden Hervorhebung der Tage dazwischen. Dafür werden ausschließlich die bereits
vorhandenen PLANKA-/`react-datepicker`-Farben verwendet. Nach Aktivierung von „Von“ ist die
Startauswahl aktiv; ein Datumsklick setzt den Start und wechselt bei geöffnetem Picker automatisch
zur Bis-Auswahl. Ein Start hinter dem bisherigen Ende zieht das Ende mindestens auf den neuen Start
nach. Ebenso wird eine Bis-Auswahl vor dem Start auf den Start begrenzt. Gleichzeitige Zeitpunkte
bleiben gültig, und die manuelle Bearbeitung aller Date-/Time-Felder bleibt erhalten. Phase 4.1
ergänzt weder Dependency noch Migration oder Datenbankänderung.

## FullCalendar-Mapping und Zeitsemantik

Ein Due-only-Termin wird mit `start = dueDate`, ohne `end`, und `allDay = false` gemappt. Ein gültiger
Zeitraum verwendet `start = startDate`, `end = dueDate` und ebenfalls `allDay = false`. Native
`Date`-Instanzen werden unverändert weitergereicht. Dadurch bleiben PLANKAs bisherige lokale
Browserzeit, ISO-Serialisierung sowie Uhrzeiten nahe Mitternacht und an DST-Grenzen erhalten.

FullCalendars `end` ist exklusiv. Da Phase 4 ausschließlich zeitgebundene Events und keine
date-only/Ganztagswerte erzeugt, entspricht der exakte Endzeitpunkt dem gespeicherten `dueDate`;
eine künstliche Plus-eins-Tag-Korrektur wäre falsch. Month (`dayGridMonth`), Week (`timeGridWeek`)
und Agenda (`listMonth`) verwenden dasselbe Range-Event und zeigen mehrtägige Zeiträume entsprechend
der jeweiligen Community-View.

## Drag & Drop, Resize und Rollback

Das bereits installierte `@fullcalendar/react@7.0.2` liefert das MIT-lizenzierte Interaction-Plugin
als Deep Import. Es wurde keine Dependency ergänzt. Nur Board-Editoren erhalten Editing; Viewer
bleiben read-only.

- Drag eines Due-only-Termins schreibt den neuen Event-Start nach `dueDate`.
- Drag eines Zeitraums schreibt Event-Start und Event-Ende gemeinsam nach `startDate` und `dueDate`.
- Falls DayGrid einen Timed-Drag intern in einen All-day-Drop umwandelt, wird nur der lokale
  Kalendertag verschoben; die bisherigen lokalen Uhrzeiten bleiben auch über DST-Grenzen erhalten.
- Linkes Resize eines Zeitraums verändert ausschließlich `startDate`; rechtes Resize ausschließlich
  `dueDate`.
- Resize eines Due-only-Termins erzeugt atomar einen gültigen Zeitraum. Drag bleibt dagegen ein
  Due-only-Update ohne `startDate`.

Das UI aktualisiert optimistisch über den bestehenden Card-Action-Pfad. Der Calendar-Handler gibt
dem Saga-Service die vorherigen Datumswerte und FullCalendars `revert()` mit. Bei einem API-Fehler
stellt die Saga zuerst die alten Redux-ORM-Werte wieder her und ruft anschließend `revert()` auf.
Bei Erfolg ersetzt die Serverantwort den optimistischen Datensatz. Ein Event-Klick navigiert weiter
über `/cards/:id` in das bestehende CardModal.

## Trello-JSON-Import

Der bestehende Community-Importer mappt nun zusätzlich `Trello card.start` auf `Card.startDate`.
`card.due` bleibt `Card.dueDate`; `card.dueComplete` behält die bestehende Bindung an einen
vorhandenen Due-Wert. Damit entstehen aus `start + due` Zeiträume, aus `due` allein die bisherigen
Einzel-/Fälligkeitstermine und ohne beide Werte keine Kartendaten. ISO-Strings einschließlich
expliziter Zeitzonen-Offsets werden unverändert an das Card-Modell übergeben. Ein ungültiger
importierter Start ohne Ende oder nach dem Ende bricht den Import sauber ab, statt einen kaputten
Endzustand zu speichern. Andere Trello-Felder und Importabläufe wurden nicht geändert.

## Filter und Tests

Der Calendar-Selector beginnt weiterhin mit `Board.getFilteredCardsModelArray()`. Deshalb bleiben
Userfilter, Labelfilter und Suche unverändert wirksam. „Meine Aufgaben“ filtert weiter ausschließlich
auf CardMemberships des aktuellen Users. Labelmarker und Month-/Week-/Agenda-Navigation bleiben
erhalten.

Die automatisierten Tests decken ab:

- Migration Up/Down, Model-/Controller-Vertrag und Range-Validierung;
- partielles Update von Start oder Ende sowie Entfernen des Starts;
- Trello `start + due`, Due-only, ohne Daten, `dueComplete` und ISO-Zeitzonen-Offsets;
- Client-API-Serialisierung und -Deserialisierung;
- Due-only, gleich-/mehrtägige Ranges, ungültige Werte, Mitternacht und DST;
- User-/Labelfilter, Suche, „Meine Aufgaben“, Archive/Trash und Fremd-Boards;
- Drag eines Einzeltermins, Drag sowie Start-/End-Resize eines Zeitraums, Save-Aufruf und
  Fehler-Rollback;
- Due-only-Resize nach links und rechts, persistente Umwandlung zum Zeitraum und Rollback zum
  ursprünglichen Due-only-Zustand;
- Von-Auswahl mit automatischem Wechsel zu Bis, gleich-/mehrtägige Range-Markierung und Korrektur
  ungültiger Reihenfolgen;
- bestehender Event-Klick/CardModal sowie Cucumber-Szenarien für Range-Drag, beidseitiges Resize,
  Due-only-Umwandlung und Reload.

Der Cucumber-Dry-Run validiert die Struktur. Ein vollständiger Browserlauf benötigt eine laufende
Testinstanz und zusätzlich zu `CALENDAR_BOARD_PATH`/`CALENDAR_CARD_TITLE` eine editierbare
Range-Fixture über `CALENDAR_RANGE_CARD_TITLE`. Der Due-only-Resize-/Reload-Fall verwendet zusätzlich
`CALENDAR_DUE_ONLY_RESIZE_CARD_TITLE`.

## Lizenz, Dependencies und bekannte Grenzen

Es wird ausschließlich PLANKA-Community-Code plus eigene Erweiterung verwendet. DayGrid, TimeGrid,
List und Interaction sind FullCalendar-Standardkomponenten unter MIT; Scheduler-, Resource- und
Premium-Plugins sind nicht enthalten. Workflow und GHCR-Ziel bleiben unverändert.

Bekannte Grenzen:

- Es gibt weiterhin keine date-only/Ganztagssemantik; alle Werte sind exakte Zeitpunkte.
- Offline-Warteschlangen jenseits des vorhandenen PLANKA-Request-Verhaltens sind nicht Teil der
  Phase.
- Wiederholungen, Erinnerungen, externe Kalender, globaler Kalender, Gantt, Abhängigkeiten und
  Ressourcen-/Teamkalender bleiben spätere, getrennt zu planende Arbeiten.

Offizielle FullCalendar-Referenzen:

- [Event Dragging & Resizing](https://fullcalendar.io/docs/event-dragging-resizing)
- [eventDrop und revert](https://fullcalendar.io/docs/eventDrop)
- [eventResize](https://fullcalendar.io/docs/eventResize)
- [Event Parsing und exklusives Enddatum](https://fullcalendar.io/docs/event-parsing)
- [FullCalendar Standard License](https://fullcalendar.io/license)
