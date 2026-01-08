# AllianzGPT Custom

Ein internes AI Chat Workspace System basierend auf der OpenAI API.

## Features

- **Passwortschutz** - Globaler Zugangsschutz für die gesamte Anwendung
- **Workspace-System** - Jeder Mitarbeiter hat seinen eigenen isolierten Workspace
- **Chat-Funktionalität** - ChatGPT-ähnliches Interface mit Streaming-Antworten
- **Persistente Chats** - Alle Konversationen werden gespeichert
- **Bildgenerierung** - DALL-E 3 Integration mit `/generate [prompt]`
- **Bildanalyse** - Upload von Bildern zur Analyse durch GPT-4 Vision
- **Responsive Design** - Funktioniert auf Desktop und Mobile

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Datenbank:** PostgreSQL mit Prisma ORM
- **API:** OpenAI GPT-4o, DALL-E 3
- **Container:** Docker, Docker Compose

## Schnellstart

### 1. Repository klonen

```bash
git clone https://github.com/lucaaxano/AllianzGPT_Custom.git
cd AllianzGPT_Custom
```

### 2. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis:

```bash
cp .env.example .env
```

Bearbeite die `.env` Datei:

```env
# OpenAI API Key (erforderlich)
OPENAI_API_KEY=sk-your-api-key-here

# Zugangspasswort für die Anwendung
ACCESS_PASSWORD=dein-sicheres-passwort

# Datenbank (wird automatisch von Docker verwendet)
DATABASE_URL=postgresql://allianzgpt:allianzgpt123@db:5432/allianzgpt
```

### 3. Mit Docker starten

```bash
# Container bauen und starten
docker-compose up --build

# Oder im Hintergrund
docker-compose up -d --build
```

### 4. Datenbank initialisieren

Bei erstem Start:

```bash
# In den Backend-Container wechseln
docker-compose exec backend sh

# Prisma Migrationen ausführen
npx prisma db push

# Container verlassen
exit
```

### 5. Anwendung öffnen

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## Nutzung

### 1. Anmeldung
Gib das konfigurierte `ACCESS_PASSWORD` ein, um Zugang zu erhalten.

### 2. Workspace erstellen/auswählen
Wähle einen existierenden Workspace oder erstelle einen neuen mit deinem Namen.

### 3. Chat starten
- Schreibe Nachrichten wie bei ChatGPT
- Lade Bilder hoch zur Analyse
- Nutze `/generate [prompt]` für Bildgenerierung

## API Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/auth/verify` | Passwort verifizieren |
| GET | `/api/workspaces` | Alle Workspaces |
| POST | `/api/workspaces` | Workspace erstellen |
| GET | `/api/workspaces/:id/chats` | Chats eines Workspace |
| POST | `/api/workspaces/:id/chats` | Chat erstellen |
| GET | `/api/chats/:id` | Chat mit Nachrichten |
| POST | `/api/chat/completions` | Chat mit OpenAI (Streaming) |
| POST | `/api/images/generate` | Bild generieren |
| POST | `/api/images/analyze` | Bild analysieren |

## Entwicklung

### Lokale Entwicklung ohne Docker

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Logs anzeigen

```bash
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

### Container neustarten

```bash
docker-compose restart
```

### Alles stoppen und entfernen

```bash
docker-compose down -v
```

## Deployment

### Option 1: Docker auf eigenem Server

1. Server mit Docker einrichten
2. Repository klonen
3. `.env` konfigurieren
4. `docker-compose up -d --build`
5. Reverse Proxy (nginx) für HTTPS einrichten

### Option 2: Cloud Plattformen

- **Vercel** für Frontend
- **Railway** oder **Render** für Backend + PostgreSQL

## Sicherheitshinweise

- Ändere das Standard-Datenbankpasswort in Produktion
- Nutze ein starkes `ACCESS_PASSWORD`
- Halte den `OPENAI_API_KEY` geheim
- Aktiviere HTTPS in Produktion
- Erwäge IP-Whitelisting für zusätzlichen Schutz

## Troubleshooting

### "Cannot connect to database"
```bash
docker-compose down
docker-compose up -d db
# Warte 10 Sekunden
docker-compose up -d
```

### "Prisma client not generated"
```bash
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

### Ports sind belegt
Ändere die Ports in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Statt 3000
```

## Lizenz

Proprietär - Nur für internen Gebrauch.
