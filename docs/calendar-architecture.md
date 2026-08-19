# Kalender-Architekturaufnahme

Stand der Analyse: Upstream `master` bei
`266246e242430d921c32badecdd447514107c568`. Analysiert wurde ausschließlich Community-Code.

## Kurzentscheidung

Phase 2 sollte als **board-lokale, read-only Calendar View** umgesetzt werden. Sie wird als vierte
temporäre Boardansicht neben Kanban, Grid und List in den vorhandenen View-Umschalter integriert.
Für diesen Umfang sind weder Backend-, Datenbank- noch Migrationsänderungen nötig. Die aktuelle
Board-Antwort enthält bereits alle aktiven und geschlossenen Karten samt `dueDate`, Mitgliedschaften
und Labels; Socket-Events halten diese Daten aktuell.

Empfohlene UI-Bibliothek ist **FullCalendar Standard/Community v7**, ausschließlich mit den
MIT-lizenzierten Standardfunktionen. Premium-, Scheduler-, Timeline- und Resource-Plugins sind
ausgeschlossen.

## Frontend

### Navigation und Komponenten

1. Die allgemeine App-Navigation beginnt in `client/src/components/common/Fixed/Fixed.jsx`.
   `Header` bildet den globalen Kopf. Für ein geöffnetes Projekt rendert `Project`, über
   `Boards`/`Item`, die Board-Tabs. Für ein geladenes Board rendert `Fixed` darunter
   `BoardActions`.
2. `client/src/components/boards/BoardActions/BoardActions.jsx` ist die eigentliche
   Board-Werkzeugleiste: Members, Filter und `RightSide`.
3. `client/src/components/boards/BoardActions/RightSide/RightSide.jsx` enthält bereits den
   View-Umschalter für `KANBAN`, `GRID` und `LIST`. Das ist der kleinste Integrationspunkt für
   `[Board] [Kalender]` beziehungsweise ein äquivalentes Icon-/Tab-Verhalten.
4. `client/src/components/common/Static/Static.jsx` entscheidet, ob Home, Fehlerzustand oder
   `Board` dargestellt wird, und setzt horizontales oder vertikales Layout anhand `board.view`.
5. `client/src/components/boards/Board/Board.jsx` wählt den Inhalt: `KanbanContent` für Kanban,
   sonst `FiniteContent` oder `EndlessContent` anhand des Board-Kontexts. `FiniteContent` schaltet
   wiederum zwischen `GridView` und `ListView`.

Sauberster Kalender-Integrationspunkt:

- `BoardViews.CALENDAR` in `client/src/constants/Enums.js` ergänzen.
- Icon/Übersetzung und Schaltfläche über den bestehenden `RightSide`-View-Umschalter anbieten.
- In `Board.jsx` bei Board-Kontext `BOARD` auf eine neue isolierte `CalendarView` schalten.
- In `Static.jsx` `CALENDAR` wie `GRID`/`LIST` als vertikales Layout behandeln.
- `defaultView` in Phase 2 **nicht** erweitern: Der aktuelle View-Umschalter ist ohnehin rein
  clientseitig; der persistierte Server-Enum bleibt dadurch unangetastet.

### Routing

PLANKA verwendet `react-router` 7.13.1 mit einer eigenen Redux-Anbindung:

- `client/src/constants/Paths.js`: `/`, `/login`, `/projects/:id`, `/boards/:id`, `/cards/:id`.
- `client/src/components/common/Root.jsx`: `<Routes>` und `<Route>`.
- `client/src/lib/redux-router` und `client/src/store.js`: Router-Reducer/Middleware mit einer
  `history`-Instanz.
- `client/src/selectors/router.js`: löst Pfadparameter auf ORM-Modelle und Zugriffsprüfung auf.

Für den board-lokalen MVP ist keine neue Route nötig. Die Kalenderansicht ist, wie Grid/List,
lokaler Board-View-State. Eine Karte wird über
`push(Paths.CARDS.replace(':id', cardId))` geöffnet. Dadurch bleibt die bestehende
`/cards/:id`-Deep-Link- und Modal-Logik erhalten.

### Alternative Ansichten

`BoardViews` enthält aktuell `kanban`, `grid`, `list`. `RightSide` dispatcht
`entryActions.updateViewInCurrentBoard(view)`. Der Saga-Service aktualisiert nur das Redux-Modell;
es erfolgt dabei kein API-Aufruf. Beim erneuten Laden wird `view` wieder aus
`board.defaultView` abgeleitet. Das ist für eine isolierte Phase-2-Calendar-View ideal und vermeidet
eine Änderung des serverseitigen `Board.Views`-Enums.

### State Management und Kartenfluss

Verwendet werden Redux 5, Redux Saga, Redux ORM, Reselect und React Redux:

- `client/src/store.js`: Store und Saga-/Router-Middleware.
- `client/src/reducers/index.js`: Router, Socket, ORM, Common, Auth, Core und UI.
- `client/src/orm.js`: Registrierung normalisierter Modelle.
- `client/src/sagas/core/requests/boards.js`: lädt das aktuelle Board mit
  `api.getBoard(id, true)` und abonniert es.
- `client/src/api/boards.js`: transformiert Karten und Attachments der Board-Antwort.
- `client/src/models/Card.js`: führt Fetch-, Optimistic-Update- und Socket-Aktionen ins ORM ein.
- `client/src/selectors/boards.js`: liefert unter anderem
  `selectFilteredCardIdsForCurrentBoard`.

`GET /api/boards/:id?subscribe=true` liefert alle Listen, aber initial Karten nur aus endlichen
Listen. `List.FINITE_TYPES` sind `active` und `closed`; Archive und Trash werden seitenweise über
`GET /api/lists/:listId/cards` geladen. Der normale Board-Kontext und damit der Kalender-MVP
arbeiten auf aktiven/geschlossenen Karten.

Für den Kalender sollte ein eigener memoized Selector entstehen, beispielsweise
`selectCalendarEventsForCurrentBoard`. Er sollte:

1. Karten des aktuellen Board-Kontexts lesen,
2. ausschließlich `card.dueDate !== null` übernehmen,
3. bestehende User-/Label-Filter berücksichtigen,
4. auf ein kleines Calendar-Event-DTO abbilden (`id`, `title`, `start`, Member-/Label-IDs),
5. keine zweite Kopie der Karten im Redux-State anlegen.

### Memberships und Labels

- Board-Mitgliedschaften: `BoardMembership` mit `boardId`, `userId`, `role`, `canComment`.
- Kartenmitgliedschaften: Server-Joinmodell `CardMembership` (`card_id`, `user_id`). Die API
  liefert Datensätze als `cardMemberships`; `Card.js` materialisiert sie als Redux-ORM-many
  `card.users`.
- Karten-Labels: `Label` gehört per `boardId` zu einem Board. Server-Joinmodell `CardLabel`
  verbindet `card_id` und `label_id`; im Client ist das `card.labels`.
- Vorhandene Selektoren: `selectUserIdsByCardId`, `selectLabelIdsByCardId`,
  `selectMembershipsForCurrentBoard`, `selectLabelsForCurrentBoard` sowie die vorhandenen
  Board-Filterselektoren.

„Meine Aufgaben“ sollte in Phase 2 als Kartenmitgliedschaft des aktuellen Users definiert werden.
Task-Assignees könnten wie der bestehende Userfilter zusätzlich einbezogen werden, müssen aber als
bewusste Produktentscheidung getestet und in der UI erklärt werden.

### Bestehenden Kartendialog öffnen

`client/src/components/cards/Card/Card.jsx` navigiert beim Klick zu `/cards/:id`.
`selectors.selectPath` löst Karte, Board und Projekt auf. `Board.jsx` erkennt `cardId` im Pfad und
rendert `CardModal`. Beim Schließen navigiert `CardModal` zurück zu `/boards/:boardId`. Die
Calendar View soll genau denselben `push(Paths.CARDS...)`-Mechanismus verwenden und keinen eigenen
Dialog bauen.

## Datenmodell und Zeitzonen

### Fälligkeitsfeld

Das exakte Feld heißt durchgängig `dueDate`:

- PostgreSQL: `card.due_date`, Migration mit `table.timestamp('due_date', true)`; in PostgreSQL
  entspricht dies einem Timestamp mit Zeitzone.
- Sails/Waterline: `Card.dueDate`, Typ `ref`, nullable.
- OpenAPI-Kommentar: String, Format `date-time`, nullable.
- Client-ORM: `Card.dueDate`, entweder `Date` oder `null`.

Der Server validiert ISO-8601 über Moment. `client/src/api/cards.js` wandelt eingehende ISO-Werte
mit `new Date(...)` in native `Date`-Objekte und ausgehende Werte mit `toISOString()` in UTC um.
`EditDueDateStep` parst Datum und Uhrzeit in der Browser-Lokalzeit; `DueDateChip` formatiert das
native Date über date-fns und die aktive PLANKA-Locale. Es gibt im Community-Modell keine
benutzerspezifische IANA-Zeitzone und kein getrenntes „date-only“-Feld. Der Kalender muss deshalb
zunächst dieselbe Browser-Lokalzeit-Semantik wie PLANKA verwenden und darf einen Termin nicht
eigenmächtig als ganztägig interpretieren.

### Beziehungen

| Beziehung | Umsetzung |
| --- | --- |
| Karte → Board | direkte, denormalisierte FK `Card.boardId` / `board_id` |
| Karte → Liste | FK `Card.listId`; Liste gehört über `List.boardId` zum Board |
| Karte ↔ Benutzer | `CardMembership(cardId, userId)`; im Client `Card.users` many-to-many |
| Karte ↔ Label | `CardLabel(cardId, labelId)`; im Client `Card.labels` many-to-many |
| Label → Board | FK `Label.boardId` |

### Sind alle Daten im Client-State vorhanden?

Für eine **board-lokale** Read-only-Ansicht: ja. Titel, `dueDate`, Board-/Listenbezug,
Kartenmitgliedschaften, Labels, Boardmitglieder und der aktuelle User befinden sich nach dem
Board-Fetch im Redux-ORM-State.

Für einen projekt- oder instanzweiten Kalender: nein. Der Bootstrap lädt zwar Projekt- und
Board-Metadaten, aber nicht die Karten aller Boards. `GET /api/projects` und
`GET /api/projects/:id` liefern keine Karten. Mehrere Boards nacheinander zu abonnieren würde
Socket-Räume, Speicherbereinigung und Zugriffswechsel unnötig komplizieren. Ein späterer globaler
Kalender braucht daher sehr wahrscheinlich einen dedizierten, berechtigungsgeprüften Backend-Read-
Endpunkt oder eine ausdrücklich entworfene Aggregationsstrategie.

## Backend und Echtzeit

### Vorhandene Community-Endpunkte

- `GET /api/boards/:id?subscribe=true`: Board inklusive aktiver/geschlossener Karten,
  Mitgliedschaften, Labels und weiterer Relationen; tritt dem Socket-Raum `board:<id>` bei.
- `GET /api/lists/:listId/cards`: paginierte Karten aus Archive/Trash mit Such-, User- und
  Labelfiltern.
- `GET /api/cards/:id`: Einzelkarte und Relationen.
- `PATCH /api/cards/:id`: bestehende Aktualisierung, unter anderem `dueDate` und
  `isDueCompleted`; Berechtigungsprüfung verlangt Editor-/Managerrechte.

Für Phase 2 sind keine Backendänderungen erforderlich. Phase 4 kann ebenfalls den vorhandenen
PATCH-Pfad nutzen. Ein neuer Endpunkt wird erst für einen boardübergreifenden Kalender relevant.

### Realtime

Der Board-Fetch abonniert den Sails/Socket.IO-Raum `board:<boardId>`. Der Server broadcastet unter
anderem `cardCreate`, `cardUpdate`, `cardDelete`, `cardMembershipCreate/Delete` und
`cardLabelCreate/Delete`. `client/src/sagas/core/watchers/socket.js` überführt diese Events in
Entry Actions; `Card`, `BoardMembership` und `Label` aktualisieren Redux ORM. Eine aus dem State
abgeleitete Calendar View erhält dadurch ohne eigenes Polling Echtzeitupdates. Nach Reconnect lädt
`handleSocketReconnect` den Core- und Board-State erneut.

## Tests

### Vorhandene Struktur

- Frontend Unit: Jest/Babel, derzeit `client/src/utils/local-id.test.js` (1 Suite, 2 Tests).
- Frontend Acceptance: Cucumber + Playwright unter `client/tests/acceptance`, derzeit ein
  Login-Feature mit Page Objects.
- Backend: Mocha/Chai/Supertest unter `server/test`; Lifecycle hebt eine Sails-Testinstanz an,
  Integrationstest derzeit hauptsächlich `models/User.test.js`, plus Utility-Test.

### Empfohlene Testorte für Phase 2

- `client/src/selectors/calendar.test.js`: dueDate-Filter, Sortierung/Mapping, „Meine Aufgaben“,
  User-/Label-Filter, Zeitzonenrandfälle.
- `client/src/components/calendar/CalendarView.test.jsx`: Eventdaten, Empty State und Click-
  Navigation, sofern die bestehende Jest-Infrastruktur um React-Komponententests ergänzt wird.
- `client/tests/acceptance/features/calendar.feature` plus `CalendarPage.js`: View öffnen,
  Monatswechsel, Kartenfilter und Kartenmodal per Klick.
- Keine Backendtests in Phase 2, solange kein Backendcode geändert wird.
- Phase 4: Saga-/API-Tests für optimistisches `dueDate`-Update, Rollback, Viewerrechte und
  paralleles Socket-Update; ergänzend Acceptance-Test für Drag & Drop.

## Dependency-Vergleich

Aktuelle Metadaten wurden am 19. August 2026 aus npm und der jeweiligen offiziellen
Dokumentation gelesen. `dist.unpackedSize` ist nur die entpackte Paketgröße und **nicht** der
minifizierte oder gzip-komprimierte Produktionsanteil.

| Kriterium | FullCalendar Standard/Community | React Big Calendar | Eigene Implementierung |
| --- | --- | --- | --- |
| Stand | `@fullcalendar/react` 7.0.2, 24.07.2026 | 1.20.0, 01.06.2026 | eigener Code |
| Lizenz | MIT für Standardplugins; Premium strikt ausgeschlossen | MIT | PLANKA Community License für Fork-Code |
| npm `dist.unpackedSize` | ca. 1,12 MB für React-Paket; `temporal-polyfill` Peer | ca. 1,77 MB; breite Date-Library-Abhängigkeiten | kein neues Paket, aber erheblicher eigener Code |
| React | offiziell 17–19; passt zu React 18.2 | Peer 16.14–19; passt zu React 18.2 | direkt passend |
| Monat/Woche/Agenda | Standard: DayGrid, TimeGrid und List | eingebaut: month, week, day, agenda | vollständig selbst zu bauen |
| Drag & Drop | Standard-Interaction-Plugin, kein Premium nötig | DnD-Addon vorhanden | vollständig selbst zu bauen/testen |
| Lokalisierung | umfangreiche Locales, erster Wochentag und Buttons | Localizer für date-fns, Day.js, Luxon, Moment, Globalize | PLANKA-i18n direkt nutzbar |
| Zeitzonen | explizit local/UTC/named; klare Dokumentation | native Dates plus Localizer; weniger einheitliche TZ-Abstraktion | exakt PLANKA-Semantik, aber alle Randfälle selbst |
| Styling | große API, eigene CSS-Schicht nötig; v7-Themes verfügbar | CSS/Sass überschreibbar, DOM/CSS teils meinungsstark | maximale Kontrolle |
| Wartung | sehr aktiv, strukturierte Dokumentation | aktiv, viele offene Issues/PRs | vollständig beim Fork-Team |
| Integrationsaufwand | mittel | mittel | hoch bis sehr hoch ab Woche/Agenda/DnD |
| Upstream-Konfliktrisiko | niedrig bei Adapter + isolierter Komponente | niedrig bis mittel | niedrig an Core-Dateien, aber hoher dauerhafter Wartungsaufwand |

Offizielle Quellen:

- [FullCalendar React](https://fullcalendar.io/docs/react)
- [FullCalendar Plugin Index](https://fullcalendar.io/docs/plugin-index)
- [FullCalendar License](https://fullcalendar.io/license)
- [FullCalendar timeZone](https://fullcalendar.io/docs/timeZone)
- [React Big Calendar Repository/README](https://github.com/jquense/react-big-calendar)

### Empfehlung

**FullCalendar Standard/Community v7** ist die beste Gesamtoption für das Zielbild. Month, Week,
List/Agenda, Lokalisierung, Zeitzonensteuerung und späteres Event-DnD sind bereits als freie
Standardfunktionen vorhanden. Das reduziert den fehleranfälligen Eigenbau eines Kalenders, ohne
kommerzielle Features vorauszusetzen.

Leitplanken:

- Nur `@fullcalendar/react` und dokumentierte Standard-Views verwenden.
- Keine `react-scheduler`-, Resource-, Timeline- oder sonstigen Premium-Pakete.
- Paket erst in Phase 2 installieren und Version/Lockfile dann bewusst reviewen.
- Bibliotheksobjekte hinter einem kleinen `calendar-event-adapter` kapseln.
- Calendar View möglichst lazy laden, damit die bestehende große Hauptbundle nicht unnötig wächst.
- PLANKA-State bleibt Source of Truth; FullCalendar hält keine zweite persistente Eventdatenbank.

React Big Calendar ist eine brauchbare Alternative, besonders wegen seines date-fns-Localizers,
bringt aktuell aber eine breitere Date-Library-Abhängigkeitsoberfläche mit. Ein Eigenbau ist nur
für einen dauerhaft reinen Monats-MVP attraktiv; mit Week, Agenda und DnD verschiebt er zu viel
Kalender-, Accessibility- und Zeitzonenkomplexität in den Fork.

## Empfohlene Phase-2-Struktur

```text
client/src/components/calendar/
├── CalendarView/
├── CalendarToolbar/
└── CalendarEvent/
client/src/selectors/calendar.js
client/src/utils/calendar-event-adapter.js
```

Minimale Änderungen an bestehendem Core:

1. `Enums.js`: `BoardViews.CALENDAR`.
2. `Icons.js` und Locale-Texte: Kalenderlabel/-icon.
3. `BoardActions/RightSide.jsx`: View in bestehender Gruppe anbieten.
4. `Board/Board.jsx`: `CalendarView` auswählen.
5. `Static.jsx`: vertikales Layout für Calendar.
6. `selectors/index.js`: neue isolierte Selektoren exportieren.

Keine Änderung an Datenbank, Servermodell, REST-API oder persistiertem `Board.defaultView` in
Phase 2.

## Wichtigste Konfliktrisiken

- `RightSide.jsx`, `Board.jsx`, `Static.jsx`, `Enums.js`, Icons und Locale-Dateien sind mögliche
  Upstream-Mergepunkte; Änderungen dort müssen klein bleiben.
- Upstream kann Board-View-State oder React-Routing weiter umbauen.
- FullCalendar-CSS kann mit globalem Semantic-UI-/Gravity-UI-/PLANKA-CSS kollidieren; Styles müssen
  unter einer Calendar-Wrapperklasse gekapselt werden.
- PLANKA verwendet exakte Zeitpunkte, keine date-only-Termine. Monatszellen und DST-Wechsel müssen
  mit Browser-Lokalzeit getestet werden.
- Ein späterer projektweiter Kalender ist keine reine UI-Erweiterung, weil Karten anderer Boards
  nicht im Client-State liegen.
- Reines Kartenmitglied und Task-Assignee sind semantisch verschieden; „Meine Aufgaben“ darf diese
  Begriffe nicht stillschweigend vermischen.
