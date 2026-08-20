# Calendar Community Image – Deployment

Der Community-Fork veröffentlicht nach jedem erfolgreichen Push auf `master` automatisch ein
Linux/amd64-Image über GitHub Actions. Das Image ist kein offizielles PLANKA-Image.

```text
Codex / Entwickler
        ↓
git push master
        ↓
GitHub Actions
        ↓
GitHub Container Registry (GHCR)
ghcr.io/dantezukazero/planka:calendar
        ↓
OMV / Docker Compose
        ↓
Pull + Up
```

## Veröffentlichte Tags

- `ghcr.io/dantezukazero/planka:calendar` zeigt auf den jüngsten erfolgreichen `master`-Build.
- `ghcr.io/dantezukazero/planka:calendar-<commit-sha>` bezeichnet einen unveränderlichen Build
  eines konkreten Commits.

Der Workflow kann zusätzlich über `workflow_dispatch` manuell gestartet werden. Er verwendet das
Community-`Dockerfile` im Repository unverändert, baut ausschließlich für `linux/amd64` und meldet
sich mit dem kurzlebigen `GITHUB_TOKEN` bei GHCR an. Es werden keine persönlichen Registry-Tokens
oder zusätzlichen Repository-Secrets benötigt.

## OMV / Docker Compose

Die vorgesehene Image-Zeile lautet:

```yaml
image: ghcr.io/dantezukazero/planka:calendar
```

Auf dem OMV-Server ist damit kein lokaler Checkout und kein Source-Build mehr notwendig. Für ein
Update genügen das erneute Abrufen des Images und das Aktualisieren des Compose-Stacks, zum Beispiel
über die vorhandene OMV-/Compose-Oberfläche mit „Pull“ und anschließend „Up“.

Anonyme Pulls funktionieren nur, wenn das GHCR-Package öffentlich sichtbar ist. Die Sichtbarkeit
wird nach dem ersten erfolgreichen Publish in den Package-Einstellungen des GitHub-Repository-
Owners geprüft; Zugangsdaten werden auf dem OMV-Server nicht eingerichtet.
