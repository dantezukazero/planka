# PLANKA Calendar – Phase 3

Phase 3 erweitert den board-lokalen Read-only-Kalender um eine PLANKA-integrierte Navigation,
Month/Week/Agenda, Label-Akzente und eine lokale Verwaltung der Boardansichten. Die bestehenden
Redux-ORM-Daten, Boardfilter, Socket-Updates und die Route `/cards/:id` bleiben die einzige
Daten- und Navigationsquelle.

## Ansichten verwalten

`BoardActions → RightSide → Board Actions → Manage Views` verwaltet Kanban, Grid, List und
Calendar in ihrer festen bisherigen Reihenfolge. Standardmäßig sind alle vier Ansichten sichtbar.
Archive und Trash zeigen weiterhin unabhängig von dieser Preference Grid und List, damit andere
Boardkontexte nicht beeinträchtigt werden.

Die Preference liegt ausschließlich im Browser-`localStorage` unter
`planka:visible-board-views:<userId>`. Sie ist damit pro Browser und eingeloggtem Benutzer getrennt,
übersteht Reloads und verändert weder Boarddaten noch Backendzustand. Fehlende, nicht parsebare,
leere, doppelte oder unbekannte Werte fallen auf alle vier Ansichten zurück. Die letzte sichtbare
Ansicht kann nicht deaktiviert werden. Wird die aktive Ansicht ausgeblendet oder ist sie beim Laden
nicht mehr sichtbar, wechselt der Client auf die erste verbleibende Ansicht in der festen Reihenfolge.
Storage-Fehler, etwa in restriktiven Browsermodi, beeinträchtigen die Boardnavigation nicht.

## Calendar Toolbar und Navigation

Die FullCalendar-Standardtoolbar ist deaktiviert. Die eigene Toolbar bietet:

- einen lokalisierten Monats-/Jahresbutton mit kompaktem, tastaturbedienbarem Picker,
- Zurück, Heute und Vorwärts über die offizielle FullCalendar-API,
- den unveränderten Toggle „Meine Aufgaben“,
- ein Dropdown für Month, Week und Agenda.

Der Picker springt per `gotoDate` auf den ersten Tag des gewählten lokalen Monats. `prev`, `today`
und `next` navigieren anhand der aktiven FullCalendar-View automatisch in Monaten, Wochen oder dem
Agenda-Zeitraum. `datesSet` synchronisiert nur die Toolbar-Anzeige; Eventdaten werden dabei nicht
kopiert oder neu aufgebaut.

Die Calendar-Unteransicht wird clientseitig unter `planka:calendar-view:<userId>` gespeichert.
Ungültige oder fehlende Werte fallen auf Month zurück. Der aktuelle Zeitraum und die React-State-
Werte bleiben beim Öffnen und Schließen des vorhandenen CardModal erhalten, weil die Calendar-View
nicht ersetzt wird.

## Month, Week und Agenda

- Month verwendet `dayGridMonth`.
- Week verwendet `timeGridWeek` und übernimmt lokalen Wochenstart, Datums- und Zeitformat aus dem
  geladenen FullCalendar-Locale.
- Agenda verwendet `listMonth` als kompakte chronologische Monatsübersicht.

Alle drei Views erhalten dieselbe `visibleEvents`-Referenz. „Meine Aufgaben“ bleibt exakt
`CardMembership(currentUser)`; Task-Assignees werden nicht einbezogen. Bestehende Benutzer-, Label-
und Suchfilter werden weiterhin durch `Board.getFilteredCardsModelArray()` angewendet. Event-Klicks
navigieren unverändert auf `/cards/:id` und öffnen damit das bestehende CardModal. Es gibt kein
Polling, keine neue Socket-Verbindung und keine zweite Card-Datenkopie.

## Labeldarstellung

Der Calendar-Selector ergänzt pro Event nur die kleinen Label-Metadaten `id`, `name` und `color`.
Die Eventdarstellung verwendet für ein oder mehrere Labels kompakte Farbpunkte. Deren Klassen stammen
direkt aus PLANKAs globalen `background<Color>`-Klassen, die auch `LabelChip` verwendet; es gibt keine
separate Kalenderpalette. Karten ohne Label behalten den neutralen FullCalendar-/PLANKA-Eventstil.
Titel und Fälligkeitszeit bleiben lesbar.

## Locale

Die PLANKA-Sprache wird auf das passende freie FullCalendar-Locale abgebildet. `en-US` verwendet das
eingebaute Englisch; alle übrigen von PLANKA angebotenen Sprachen werden über explizite dynamische
Imports geladen. Dadurch entstehen kleine Locale-Chunks statt eines statisch eingebundenen
`locales-all`-Bundles. Unbekannte oder nicht ladbare Locales fallen auf Englisch zurück. Alle eigenen
Toolbar-, Picker-, Menü- und Accessibility-Texte laufen über PLANKA-i18n; Englisch und Deutsch sind
vollständig ergänzt.

## Responsive und Theme

Die Toolbar ist auf breiten Ansichten einzeilig und bricht unter 900 Pixeln in zwei Gruppen um. Unter
560 Pixeln werden Controls weiter umgebrochen; eine nötige Mindestbreite des Kalenders scrollt nur im
Kalenderpanel und erzeugt keine horizontale Seite.

PLANKA setzt derzeit global `ThemeProvider theme="light"` und besitzt keinen umschaltbaren
Dark-Mode. Phase 3 baut deshalb keine neue Theme-Engine. Calendar-Farben sind stattdessen in lokalen
CSS-Variablen gekapselt. Ein leicht transparentes, weichgezeichnetes Panel hält Grid, Text und
Controls sowohl über hellen als auch dunklen Projektbildern lesbar und lässt sich später zentral an
einen Theme-State anbinden. FullCalendars offizielle Classic-Variablen werden innerhalb der
Komponente auf diese Werte gemappt.

## Dependencies und Lizenz

Es wurden keine Dependencies ergänzt oder aktualisiert. `timeGridWeek`, `listMonth`, DayGrid,
Locales und das Classic Theme kommen als Deep Imports aus dem bereits festgeschriebenen
`@fullcalendar/react@7.0.2`. Diese Standard-Komponenten stehen unter MIT. Es gibt weder Scheduler-,
Resource- oder Premium-Plugins noch PLANKA-Pro-/Enterprise-Code.

Referenzen:

- [FullCalendar React v7](https://fullcalendar.io/docs/react)
- [FullCalendar Plugin Index](https://fullcalendar.io/docs/plugin-index)
- [FullCalendar Standard License](https://fullcalendar.io/license)

## Tests und Guards

Unit-Tests prüfen die Board-View-Defaults, jede ausblendbare View, Reload, Fehlwerte, die letzte
sichtbare View, den aktiven Fallback, feste Reihenfolge und Archive-/Trash-Isolation. Weitere Tests
decken Calendar-Subview-Persistenz, Prev/Today/Next, Month-Picker-Navigation, View-Wechsel,
Locale-Mapping sowie Eventdaten ohne, mit einem und mit mehreren Labels ab. Die bestehenden Selector-
Tests schützen Due-Date-, lokale Zeit-/DST-, Membership-, Filter-, Listen- und Boardsemantik. Der
vollständige Lauf umfasst 48 grüne Jest-Tests in fünf Suites.

Die Cucumber-Acceptance-Spezifikation navigiert Month → Week → Agenda, prüft die Karte in allen
Views und öffnet das vorhandene CardModal. Ein zweites Szenario blendet Grid und List aus, lädt das
Board neu und prüft die Persistenz. Der vollständige Browserlauf benötigt weiterhin eine laufende,
über `CALENDAR_BOARD_PATH` und `CALENDAR_CARD_TITLE` konfigurierte PLANKA-Testinstanz; der Dry-Run
validiert die lokale Struktur ohne diese Instanz.

`npm audit` meldet im unveränderten Lockfile 12 bekannte Befunde (6 niedrig, 5 mittel, 1 hoch,
0 kritisch). Die Befunde stammen aus bereits vorhandenen Markdown-/Polyfill-Transitivabhängigkeiten;
mehrere besitzen keinen kompatiblen automatischen Fix. Phase 3 führt keine neue Abhängigkeit und
kein unrelated Upgrade oder Downgrade ein.

## Bekannte Einschränkungen

- Die View-Preferences sind absichtlich browserlokal und werden nicht zwischen Geräten synchronisiert.
- Agenda zeigt einen Monatszeitraum (`listMonth`); eine Day View gehört nicht zu Phase 3.
- PLANKA hat derzeit keinen global aktivierbaren Dark-Mode, daher kann nur die Theme-fähige
  Farbstruktur vorbereitet werden.
- Der Monats-/Jahrespicker bietet einen kompakten Bereich von zehn Jahren vor bis zehn Jahren nach
  dem aktuell dargestellten Jahr.
- Drag & Drop, Resize, direkte Due-Date-Änderung und weitere Editing-Funktionen bleiben Phase 4.
