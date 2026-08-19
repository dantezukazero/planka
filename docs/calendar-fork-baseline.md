# PLANKA Calendar Community Fork – Baseline

Stand: 19. August 2026 (Europe/Berlin)

## Repository-Herkunft

| Merkmal | Wert |
| --- | --- |
| Offizieller Upstream | `https://github.com/plankanban/planka` |
| Upstream-Default-Branch | `master` |
| Upstream-HEAD bei Beginn | `266246e242430d921c32badecdd447514107c568` |
| Upstream-Commit-Datum | `2026-08-10T16:28:48Z` |
| Upstream-Commit-Nachricht | `chore: Update version` |
| Fork | `https://github.com/dantezukazero/planka` |
| Fork-Baseline-Commit | `266246e242430d921c32badecdd447514107c568` |
| Lokaler Pfad | `D:\Jason\CODEX\PlankaFork` |
| Lokaler Branch | `master`, Tracking `origin/master` |
| `origin` | `https://github.com/dantezukazero/planka.git` |
| `upstream` | `https://github.com/plankanban/planka.git` |
| PLANKA-Version laut `package.json` | `2.2.1` |

Der Workspace war vor dem Checkout kein Git-Repository und enthielt nur die lokale Auftragsdatei
`Nexttodo.txt`. Diese Datei wurde nicht verändert und über `.git/info/exclude` ausschließlich lokal
vom Repositorystatus ausgenommen. Vor den dokumentierten Änderungen waren `HEAD`, `origin/master`
und `upstream/master` identisch und der Arbeitsbaum sauber.

## Lizenz-Guard

Geprüft wurden `LICENSE.md`, `LICENSES/PLANKA Community License EN.md` und
`LICENSES/PLANKA License Guide EN.md` auf dem offiziellen Hauptbranch. Maßgeblich ist die
PLANKA Community License Version 1.1 vom 20. Mai 2025. Sie ist eine Fair-Use-/fair-code-Lizenz und
keine OSI-Open-Source-Lizenz. Insbesondere gelten Nutzungsbeschränkungen für kommerzielles Hosting
und organisationsübergreifenden kommerziellen Zugang.

Technische Guard-Regeln für dieses Vorhaben:

- Nur der offizielle Hauptbranch `master` ist Quellbasis.
- Dateien oder Ordner mit `.pe.` sowie durch Header oder separate Lizenz als PLANKA
  Pro/Enterprise markierte Quellen sind verboten.
- Eine Repository-weite Dateinamen- und Header-Suche fand außerhalb der Lizenztexte keine
  entsprechend markierten Community-Quelldateien.
- Es wurde kein Pro-/Enterprise-Code geöffnet, kopiert oder als Vorlage verwendet.
- Bestehende Lizenz- und Copyright-Hinweise bleiben unverändert.
- Die Kalenderfunktion muss aus Community-Modellen, Community-Endpunkten und eigener Logik
  entstehen.

Ergebnis des Lizenz-Guards für die in `calendar-architecture.md` geplante, board-lokale
Community-Erweiterung: **bestanden**. Die konkrete Nutzung des Forks muss weiterhin innerhalb der
Fair-Use-Bedingungen liegen. Bei einem später geänderten Nutzungsmodell ist die Lizenz erneut zu
prüfen.

Quellen:

- [PLANKA Community License EN](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20Community%20License%20EN.md)
- [PLANKA License Guide EN](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20License%20Guide%20EN.md)
- [Offizielles PLANKA-Repository](https://github.com/plankanban/planka)

## Lokale Toolchain

| Werkzeug | Ergebnis |
| --- | --- |
| Betriebssystem | Windows NT `10.0.26200` |
| Git | `2.55.0.windows.3` |
| GitHub CLI | `2.96.0` |
| GitHub-Account | `dantezukazero`, authentifiziert |
| Node.js | `v24.18.0` |
| npm | `11.16.0` (`npm.cmd`, da PowerShell die Ausführung von `npm.ps1` sperrt) |
| Server-Engine-Vorgabe | Node `>=24` |
| Docker | nicht installiert/verfügbar |
| Docker Compose | nicht installiert/verfügbar |
| WSL | nicht installiert |
| MSVC/C++-Buildtools | nicht verfügbar |

Die offizielle Entwicklungsdokumentation beschreibt einen traditionellen npm-Weg und einen
Docker-Compose-Weg. Lokal war nur der npm-Weg teilweise verfügbar:
[Set Up Environment](https://github.com/plankanban/planka-docs/blob/main/docs/development/set-up-environment.md).

## Baseline-Checks

| Check | Befehl | Ergebnis |
| --- | --- | --- |
| Vollständige Installation | `npm.cmd install` | **fehlgeschlagen**: `server/node_modules/lodepng` benötigt unter Windows `node-gyp` und Visual Studio mit „Desktop development with C++“ |
| Client-Installation | `npm.cmd install --prefix client` | **erfolgreich**; 1.241 Pakete, npm meldete 12 bestehende Audit-Funde (6 low, 5 moderate, 1 high) |
| Server-Hilfsinstallation | `npm.cmd install --ignore-scripts --prefix server` | **erfolgreich**, nur zur Ausführung statischer Checks; kein gültiger Ersatz für den fehlgeschlagenen Lifecycle-/Native-Build |
| Client-Lint | `npm.cmd run client:lint` | **erfolgreich** |
| Server-Lint | `npm.cmd run server:lint` | **fehlgeschlagen**: 85.706 bestehende Prettier-Fehler `Delete ␍`, verursacht durch CRLF-Checkout unter Windows |
| Typecheck | – | nicht vorhanden; kein TypeScript- oder `typecheck`-Script definiert |
| Client-Unit-Tests | `npm.cmd run client:test -- --runInBand` | **erfolgreich**: 1 Suite, 2 Tests |
| Server-Tests | `npm.cmd run server:test` | **fehlgeschlagen vor Testausführung**: fehlende lokale `BASE_URL` führt in `server/config/custom.js` zu `TypeError: Invalid URL`; 0 Tests ausgeführt |
| Client-Production-Build | `npm.cmd run client:build` | **erfolgreich**, 7.651 Module, ca. 47 s |
| Server-Source-Build | `npm.cmd run server:build` | **erfolgreich** nach Hilfsinstallation ohne Lifecycle-Scripts |
| Client-Development-Start | `npm.cmd start --prefix client -- --host 127.0.0.1` | **erfolgreich**, Vite bereit auf `http://127.0.0.1:3000/`; anschließend beendet |
| Full-Stack-Development-Start | `npm start` | nicht ausgeführt: Serverinstallation unvollständig, keine lokale Datenbank und keine `.env` |
| Acceptance/E2E | `npm run test:acceptance --prefix client` | nicht ausgeführt: benötigt eine laufende lokale Full-Stack-Instanz |

Der erfolgreiche Client-Build enthält bestehende Warnungen zu CSS-Selektoren aus Abhängigkeiten,
einem dynamisch und statisch importierten Locale, `eval` in `@diplodoc/cut-extension` und großen
Chunks. Diese Warnungen wurden nicht verändert.

## Vorbestehende Baseline-Auffälligkeiten

1. `package.json` trägt Version `2.2.1`, der Root-Eintrag in `package-lock.json` noch `2.2.0`.
   `npm install` aktualisiert genau diese zwei Lockfile-Felder.
2. `server/package.json` verlangt Node `>=24`, der Root-Eintrag in
   `server/package-lock.json` noch `>=20`.
3. Der Server-Lint ist bei einem normalen Windows-CRLF-Checkout nicht reproduzierbar grün,
   während der Client-Lint `endOfLine: auto` konfiguriert und erfolgreich ist.
4. Die Server-Tests setzen eine gültige lokale Konfiguration einschließlich `BASE_URL` und im
   weiteren Verlauf eine Testdatenbank voraus. Es wurde bewusst keine `.env` mit erfundenen oder
   produktiven Werten erzeugt.

Die durch npm temporär angepassten Lockfile-Felder wurden auf den exakten Upstream-Blob
zurückgestellt. Es wurden keine Fehler „weggepatcht“.

## Einschränkungen und Sicherheitsgrenzen

- Keine Verbindung zu einer produktiven PLANKA-Instanz oder Datenbank.
- Keine Migration, kein Deployment und keine Änderung einer Server-Compose-Datei.
- Keine Produktiv-Credentials oder `.env` verwendet.
- Docker-basierte Reproduktion war mangels Docker nicht möglich.
- Eine vollständige Server-Runtime-Baseline ist ohne MSVC/C++-Buildtools oder eine geeignete
  Docker-/Linux-Umgebung offen.
- `node_modules`, `dist`, `.venv`, `.env` und sonstige Build-/Laufzeitartefakte sind nicht Teil des
  Phase-1-Commits.

## Baseline-Fazit

Fork, Remotes, SHA und Lizenzgrenzen sind eindeutig. Client-Lint, Client-Tests, Client-Build,
Client-Dev-Start und der statische Server-Build sind reproduziert. Die vollständige lokale
Serverinstallation, Server-Lint und Server-Tests sind aus den oben dokumentierten
Windows-/Konfigurationsgründen nicht grün; daraus wurden in Phase 1 keine Produktcodeänderungen
abgeleitet.
