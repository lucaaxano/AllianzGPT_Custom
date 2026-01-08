# Projektplan: AllianzGPT Custom

## Projektübersicht

| Attribut | Wert |
|----------|------|
| Projektname | AllianzGPT Custom |
| Repository | https://github.com/lucaaxano/AllianzGPT_Custom.git |
| Tech Stack | Next.js, Node.js, PostgreSQL, Docker |
| Entwicklungsumgebung | Docker Desktop (lokal) |

---

## Projektstruktur

```
AllianzGPT_Custom/
├── docker-compose.yml           # Docker Orchestrierung
├── .env.example                  # Umgebungsvariablen Template
├── .gitignore                    # Git Ignore Regeln
├── README.md                     # Projekt-Dokumentation
├── PRD.md                        # Product Requirements
├── Projektplan.md                # Dieser Plan
│
├── frontend/                     # Next.js Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── public/
│   │   └── logo.svg
│   └── src/
│       ├── app/                  # App Router
│       │   ├── layout.tsx
│       │   ├── page.tsx          # Passwort-Screen
│       │   ├── workspace/
│       │   │   └── page.tsx      # Workspace-Auswahl
│       │   └── chat/
│       │       └── page.tsx      # Chat-Interface
│       ├── components/
│       │   ├── ui/               # UI-Komponenten
│       │   ├── auth/             # Auth-Komponenten
│       │   ├── workspace/        # Workspace-Komponenten
│       │   └── chat/             # Chat-Komponenten
│       ├── lib/
│       │   ├── api.ts            # API Client
│       │   └── utils.ts          # Utility Functions
│       ├── stores/
│       │   └── store.ts          # Zustand Store
│       └── types/
│           └── index.ts          # TypeScript Types
│
├── backend/                      # Node.js Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # Entry Point
│       ├── config/
│       │   └── index.ts          # Konfiguration
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── workspace.controller.ts
│       │   ├── chat.controller.ts
│       │   └── openai.controller.ts
│       ├── middleware/
│       │   ├── auth.middleware.ts
│       │   └── error.middleware.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── workspace.routes.ts
│       │   ├── chat.routes.ts
│       │   └── openai.routes.ts
│       ├── services/
│       │   ├── openai.service.ts
│       │   └── file.service.ts
│       └── utils/
│           └── helpers.ts
│
└── prisma/                       # Datenbank Schema
    ├── schema.prisma
    └── migrations/
```

---

## Phase 1: Projektsetup & Infrastruktur

### 1.1 Git Repository Setup
- [ ] Git initialisieren
- [ ] .gitignore erstellen
- [ ] Mit GitHub Remote verbinden
- [ ] Initial Commit

### 1.2 Docker-Konfiguration
- [ ] docker-compose.yml erstellen
  - Frontend Service (Next.js)
  - Backend Service (Node.js)
  - PostgreSQL Service
  - Optional: pgAdmin Service
- [ ] Frontend Dockerfile
- [ ] Backend Dockerfile
- [ ] Volumes für persistente Daten

### 1.3 Umgebungsvariablen
- [ ] .env.example Template erstellen
- [ ] Dokumentation der Variablen:
  ```
  # Database
  DATABASE_URL=postgresql://user:password@db:5432/allianzgpt

  # OpenAI
  OPENAI_API_KEY=sk-...

  # Auth
  ACCESS_PASSWORD=your-secure-password

  # App
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

---

## Phase 2: Backend Development

### 2.1 Basis-Setup
- [ ] Node.js/Express Projekt initialisieren
- [ ] TypeScript konfigurieren
- [ ] Express Server aufsetzen
- [ ] CORS konfigurieren
- [ ] Error Handling Middleware

### 2.2 Datenbank
- [ ] Prisma installieren & konfigurieren
- [ ] Schema definieren:
  ```prisma
  model Workspace {
    id        String   @id @default(uuid())
    name      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    chats     Chat[]
  }

  model Chat {
    id          String    @id @default(uuid())
    title       String    @default("Neuer Chat")
    workspaceId String
    workspace   Workspace @relation(fields: [workspaceId], references: [id])
    messages    Message[]
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
  }

  model Message {
    id        String   @id @default(uuid())
    chatId    String
    chat      Chat     @relation(fields: [chatId], references: [id])
    role      String   // user, assistant, system
    content   String
    createdAt DateTime @default(now())
  }
  ```
- [ ] Migrations erstellen
- [ ] Seed-Daten (optional)

### 2.3 Auth Controller
- [ ] POST /api/auth/verify
  - Passwort validieren
  - Session-Token zurückgeben (optional JWT)
- [ ] Middleware für Auth-Check

### 2.4 Workspace Controller
- [ ] GET /api/workspaces - Alle Workspaces
- [ ] POST /api/workspaces - Neuen Workspace erstellen
- [ ] GET /api/workspaces/:id - Einzelnen Workspace
- [ ] DELETE /api/workspaces/:id - Workspace löschen

### 2.5 Chat Controller
- [ ] GET /api/workspaces/:workspaceId/chats - Alle Chats eines Workspace
- [ ] POST /api/workspaces/:workspaceId/chats - Neuen Chat erstellen
- [ ] GET /api/chats/:chatId - Chat mit Messages
- [ ] PUT /api/chats/:chatId - Chat aktualisieren (Titel)
- [ ] DELETE /api/chats/:chatId - Chat löschen

### 2.6 OpenAI Controller
- [ ] POST /api/chat/completions
  - Messages entgegennehmen
  - An OpenAI weiterleiten
  - Streaming Response (SSE)
- [ ] POST /api/images/generate
  - DALL-E 3 Integration
  - Bild-URL zurückgeben
- [ ] POST /api/files/analyze
  - File Upload handling
  - Vision API Integration

---

## Phase 3: Frontend Development

### 3.1 Basis-Setup
- [ ] Next.js 14 Projekt erstellen (App Router)
- [ ] TypeScript konfigurieren
- [ ] Tailwind CSS einrichten
- [ ] Zustand Store aufsetzen
- [ ] API Client erstellen

### 3.2 Passwort-Screen (/)
- [ ] Layout mit Logo
- [ ] Passwort-Eingabefeld
- [ ] Submit Button
- [ ] Error State
- [ ] Redirect nach erfolgreichem Login
- [ ] Session im LocalStorage speichern

### 3.3 Workspace-Auswahl (/workspace)
- [ ] Auth-Check (Redirect wenn nicht authentifiziert)
- [ ] Workspace-Liste laden
- [ ] Workspace-Karten anzeigen
- [ ] Suchfunktion
- [ ] "Neuen Workspace erstellen" Modal
- [ ] Workspace auswählen → Redirect zu /chat

### 3.4 Chat-Interface (/chat)
- [ ] Auth-Check
- [ ] Workspace-Check
- [ ] **Sidebar:**
  - [ ] "Neuer Chat" Button
  - [ ] Chat-Historie Liste
  - [ ] Chat-Item mit Titel & Datum
  - [ ] Aktiver Chat Highlight
  - [ ] Chat löschen
  - [ ] Workspace-Anzeige
  - [ ] Workspace-Wechsel Button
- [ ] **Main Area:**
  - [ ] Willkommens-Screen (bei leerem Chat)
  - [ ] Message-Liste
  - [ ] User Message Styling
  - [ ] Assistant Message Styling
  - [ ] Markdown Rendering
  - [ ] Code Highlighting
  - [ ] Bild-Einbettung
  - [ ] Loading State (Streaming)
- [ ] **Input Area:**
  - [ ] Textarea (auto-resize)
  - [ ] Datei-Upload Button
  - [ ] Bild-Upload Button
  - [ ] Send Button
  - [ ] Keyboard Shortcut (Enter)
  - [ ] Shift+Enter für neue Zeile

### 3.5 UI-Komponenten
- [ ] Button (Primary, Secondary, Ghost)
- [ ] Input / Textarea
- [ ] Modal
- [ ] Dropdown
- [ ] Avatar
- [ ] Card
- [ ] Loading Spinner
- [ ] Toast Notifications

---

## Phase 4: Feature Implementation

### 4.1 Chat-Funktionalität
- [ ] Neue Nachricht senden
- [ ] Streaming Response anzeigen
- [ ] Message zur DB speichern
- [ ] Chat-Titel automatisch generieren
- [ ] Scroll-to-bottom bei neuen Messages
- [ ] Regenerate letzte Antwort
- [ ] Copy Message to Clipboard

### 4.2 File Upload
- [ ] Drag & Drop Zone
- [ ] File-Button Click Handler
- [ ] File Preview vor Senden
- [ ] Upload Progress
- [ ] Unterstützte Formate validieren
- [ ] File an OpenAI Vision API senden
- [ ] File-Anhänge in Messages speichern

### 4.3 Bildgenerierung
- [ ] "/generate" oder Button für Bildgenerierung
- [ ] DALL-E 3 Prompt senden
- [ ] Generiertes Bild anzeigen
- [ ] Bild-Download Option
- [ ] Bild in Chat-History speichern

### 4.4 Bildanalyse
- [ ] Bild-Upload für Analyse
- [ ] Vision API Integration
- [ ] Analyse-Ergebnis im Chat anzeigen

---

## Phase 5: Testing & Hardening

### 5.1 Testing
- [ ] API Endpoints testen (Postman/Thunder Client)
- [ ] Frontend E2E Tests (optional: Playwright)
- [ ] Error Handling testen
- [ ] Edge Cases prüfen

### 5.2 Security
- [ ] API-Key nicht im Frontend
- [ ] Input Sanitization
- [ ] Rate Limiting
- [ ] CORS richtig konfiguriert
- [ ] Environment Variables sicher

### 5.3 Performance
- [ ] Lazy Loading für Chat-Historie
- [ ] Image Optimization
- [ ] Debounce für Suche
- [ ] Caching wo sinnvoll

### 5.4 UX Polish
- [ ] Loading States überall
- [ ] Error Messages benutzerfreundlich
- [ ] Keyboard Shortcuts
- [ ] Responsive Design
- [ ] Dark Mode (optional)

---

## Phase 6: Deployment

### 6.1 Lokales Testing
- [ ] docker-compose build
- [ ] docker-compose up
- [ ] Alle Features testen
- [ ] Logs prüfen

### 6.2 GitHub
- [ ] Alle Änderungen committed
- [ ] Push zu GitHub
- [ ] README.md aktualisieren

### 6.3 Produktions-Deployment
- [ ] Hosting-Plattform wählen:
  - **Option A:** Vercel (Frontend) + Railway (Backend + DB)
  - **Option B:** DigitalOcean App Platform
  - **Option C:** Eigener Server mit Docker
- [ ] Umgebungsvariablen setzen
- [ ] Domain konfigurieren
- [ ] SSL/HTTPS einrichten
- [ ] Deployment testen

---

## API Endpoints Übersicht

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | /api/auth/verify | Passwort prüfen |
| GET | /api/workspaces | Alle Workspaces |
| POST | /api/workspaces | Workspace erstellen |
| GET | /api/workspaces/:id | Einzelner Workspace |
| DELETE | /api/workspaces/:id | Workspace löschen |
| GET | /api/workspaces/:id/chats | Chats eines Workspace |
| POST | /api/workspaces/:id/chats | Chat erstellen |
| GET | /api/chats/:id | Chat mit Messages |
| PUT | /api/chats/:id | Chat aktualisieren |
| DELETE | /api/chats/:id | Chat löschen |
| POST | /api/chat/completions | OpenAI Chat (Streaming) |
| POST | /api/images/generate | DALL-E Bildgenerierung |
| POST | /api/files/upload | Datei hochladen |

---

## Technologie-Entscheidungen

| Bereich | Technologie | Begründung |
|---------|-------------|------------|
| Frontend | Next.js 14 | App Router, React 18, Server Components |
| Styling | Tailwind CSS | Schnelle Entwicklung, konsistentes Design |
| State | Zustand | Lightweight, einfach zu verwenden |
| Backend | Express.js | Bewährt, flexibel, gute OpenAI SDK Integration |
| ORM | Prisma | Type-safe, einfache Migrations |
| Database | PostgreSQL | Robust, gut für relationale Daten |
| Container | Docker | Konsistente Entwicklungsumgebung |

---

## Nächste Schritte

1. **Jetzt:** Git Repository initialisieren
2. **Dann:** Docker-Konfiguration erstellen
3. **Danach:** Backend aufsetzen
4. **Parallel:** Frontend aufsetzen
5. **Integration:** Features implementieren
6. **Final:** Testing & Deployment

---

## Notizen

- OpenAI API Key muss vom Nutzer bereitgestellt werden
- Das Passwort kann in der .env Datei geändert werden
- Für Produktion wird HTTPS empfohlen
- Bei hohem Traffic: Rate Limiting beachten
