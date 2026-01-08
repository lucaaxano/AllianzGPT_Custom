# Product Requirements Document (PRD)

## Projektname
**AllianzGPT Custom** - Internal AI Chat Workspace

---

## 1. Executive Summary

### 1.1 Problemstellung
- Die offizielle ChatGPT-URL ist im Unternehmensnetzwerk gesperrt
- Mitarbeitende benötigen Zugriff auf moderne KI-Chatfunktionen
- Nutzung soll kontrolliert, nachvollziehbar und unternehmenseigen erfolgen

### 1.2 Lösung
Eine eigenständig gehostete Web-Applikation, die:
- Über die OpenAI API auf das neueste verfügbare Modell zugreift
- Ein ChatGPT-ähnliches UI/UX bietet
- Chats persistent speichert
- Eine Workspace-Struktur pro Mitarbeiter verwendet
- Über eine eigene URL erreichbar ist
- Durch Passwortschutz gesichert ist

---

## 2. Scope & Abgrenzung

### 2.1 In Scope (MVP & Core Features)
| Feature | Status |
|---------|--------|
| Passwortschutz für Website-Zugang | ✅ |
| Workspace-Auswahl vor Chat-Zugriff | ✅ |
| Ein Workspace = ein Mitarbeiter | ✅ |
| ChatGPT-ähnliches Interface | ✅ |
| Neue Chats erstellen | ✅ |
| Chats speichern & wieder aufrufen | ✅ |
| Upload von Dateien | ✅ |
| Bildgenerierung | ✅ |
| Bildanalyse | ✅ |
| Modellzugriff über OpenAI API | ✅ |
| Workspace-Wechsel jederzeit möglich | ✅ |
| Streaming Responses | ✅ |

### 2.2 Out of Scope
| Feature | Status |
|---------|--------|
| Projekte | ❌ |
| Custom GPTs | ❌ |
| App Store / Plugins | ❌ |
| Code Interpreter | ❌ |
| Kollaboration zwischen Workspaces | ❌ |
| Öffentliche Chatfreigabe | ❌ |

---

## 3. Zielgruppe

| Eigenschaft | Beschreibung |
|-------------|--------------|
| Nutzer | Interne Mitarbeiter des Unternehmens |
| Technischer Kenntnisstand | Gering bis mittel |
| Fokus | Einfache, schnelle Nutzung |

---

## 4. User Flow

### 4.1 Authentifizierung
```
Nutzer ruft URL auf
        ↓
Passwort-Eingabe Screen
        ↓
Bei korrektem Passwort → Workspace-Auswahl
Bei falschem Passwort → Fehlermeldung
```

### 4.2 Workspace-Auswahl
```
Workspace-Auswahl-Screen erscheint
        ↓
Nutzer wählt seinen Workspace (Name des Mitarbeiters)
        ↓
Optional: Neuen Workspace erstellen
```

### 4.3 Hauptanwendung
```
ChatGPT-ähnliches Interface öffnet sich
        ↓
Nutzer kann:
  - Neuen Chat starten
  - Chat-Historie einsehen
  - Prompts schreiben
  - Dateien hochladen
  - Bilder generieren / analysieren
```

### 4.4 Workspace-Wechsel
```
Unten links (Profil-Bereich):
  - Aktueller Workspace sichtbar
  - Klick → Workspace wechseln
  - Wechsel ohne erneute Passwort-Eingabe
```

---

## 5. Funktionale Anforderungen

### 5.1 Passwortschutz

| Anforderung | Beschreibung |
|-------------|--------------|
| Globales Passwort | Ein Passwort für alle Nutzer |
| Session-basiert | Nach erfolgreicher Eingabe bleibt Nutzer eingeloggt |
| Persistenz | Session wird im Browser gespeichert |
| Konfiguration | Passwort wird serverseitig konfiguriert |

### 5.2 Workspace-System

| Funktion | Beschreibung |
|----------|--------------|
| Workspace-Auswahl | Beim ersten Besuch nach Passwort-Eingabe |
| Workspace erstellen | Neue Workspaces können angelegt werden |
| Workspace wechseln | Jederzeit möglich ohne Logout |
| Chat-Isolation | Chats sind strikt pro Workspace getrennt |
| Persistenz | Zuletzt gewählter Workspace wird gespeichert |

**Workspace-Datenmodell:**
```json
{
  "workspace_id": "uuid",
  "name": "Max Mustermann",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 5.3 Chat-Funktionalität

| Funktion | Beschreibung |
|----------|--------------|
| Neuer Chat | Erstellen eines neuen Chat-Threads |
| Chat-Historie | Anzeige aller vergangenen Chats |
| Chat fortsetzen | Bestehende Chats können fortgesetzt werden |
| Auto-Save | Automatisches Speichern nach jeder Nachricht |
| Streaming | Token-by-Token Response-Anzeige |
| Chat löschen | Einzelne Chats können gelöscht werden |
| Chat umbenennen | Chat-Titel kann angepasst werden |

**Chat-Datenmodell:**
```json
{
  "chat_id": "uuid",
  "workspace_id": "uuid",
  "title": "Chat Titel",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "messages": [
    {
      "message_id": "uuid",
      "role": "user | assistant | system",
      "content": "Nachrichteninhalt",
      "attachments": [],
      "created_at": "timestamp"
    }
  ]
}
```

### 5.4 OpenAI API Integration

| Anforderung | Beschreibung |
|-------------|--------------|
| Modell | GPT-4o / GPT-4-turbo (neuestes verfügbares) |
| API-Key | Ausschließlich serverseitig gespeichert |
| Streaming | Server-Sent Events für Token-Streaming |
| Rate Limiting | Schutz vor übermäßiger API-Nutzung |

**Unterstützte Features:**
- Text Chat (Completion)
- File Upload & Analyse
- Image Generation (DALL-E 3)
- Image Understanding (Vision)

### 5.5 File Uploads

| Funktion | Beschreibung |
|----------|--------------|
| Upload-Methoden | Drag & Drop, Button-Upload |
| Unterstützte Formate | PDF, DOCX, TXT, CSV, JSON, MD |
| Speicherung | Temporär oder persistent |
| Größenlimit | Max. 20MB pro Datei |
| API-Integration | Übergabe an OpenAI Vision/File API |

### 5.6 Image Features

**Image Generation:**
| Funktion | Beschreibung |
|----------|--------------|
| Prompt-basiert | Text → generiertes Bild |
| Modell | DALL-E 3 |
| Anzeige | Im Chatverlauf eingebettet |
| Download | Generierte Bilder können heruntergeladen werden |

**Image Analysis:**
| Funktion | Beschreibung |
|----------|--------------|
| Upload | Bild hochladen zur Analyse |
| Analyse | Beschreibung durch GPT-4 Vision |
| Kontext | Im Konversationskontext nutzbar |

---

## 6. Nicht-funktionale Anforderungen

### 6.1 Sicherheit

| Anforderung | Implementierung |
|-------------|-----------------|
| API-Key Schutz | Ausschließlich im Backend |
| Workspace-Isolation | Kein Zugriff auf fremde Chats |
| Passwortschutz | Globaler Zugangsschutz |
| HTTPS | SSL/TLS Verschlüsselung |
| Input Validation | Server-seitige Validierung |

### 6.2 Performance

| Metrik | Zielwert |
|--------|----------|
| Initial Load | < 3 Sekunden |
| Streaming Start | < 2 Sekunden |
| Chat-Historie laden | < 1 Sekunde |
| File Upload | < 5 Sekunden (10MB) |

### 6.3 Skalierbarkeit

| Aspekt | Lösung |
|--------|--------|
| Mehrere Nutzer | Gleichzeitige Verbindungen unterstützt |
| Datenbank | Optimierte Queries, Indizes |
| Architektur | Trennung Frontend/Backend/DB |

---

## 7. Technische Architektur

### 7.1 Übersicht
```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                   (React / Next.js)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                      Backend API                             │
│                  (Node.js / Express)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth        │  │ Workspace   │  │ OpenAI Proxy        │  │
│  │ Controller  │  │ Controller  │  │ Controller          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│    PostgreSQL       │       │    OpenAI API       │
│    Database         │       │    (External)       │
└─────────────────────┘       └─────────────────────┘
```

### 7.2 Frontend Stack
| Technologie | Verwendung |
|-------------|------------|
| Next.js 14 | React Framework mit App Router |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Zustand | State Management |
| React Query | Server State & Caching |

### 7.3 Backend Stack
| Technologie | Verwendung |
|-------------|------------|
| Node.js | Runtime |
| Express.js | Web Framework |
| TypeScript | Type Safety |
| Prisma | ORM |
| OpenAI SDK | API Integration |

### 7.4 Datenbank
| Technologie | Verwendung |
|-------------|------------|
| PostgreSQL | Primäre Datenbank |
| Prisma | Schema Management & Migrations |

### 7.5 Infrastructure
| Technologie | Verwendung |
|-------------|------------|
| Docker | Containerisierung |
| Docker Compose | Multi-Container Orchestrierung |
| GitHub | Version Control |
| Vercel / Railway | Deployment (optional) |

---

## 8. UI/UX Spezifikationen

### 8.1 Passwort-Screen
- Minimalistisches Design
- Zentriertes Passwort-Eingabefeld
- Firmenbranding/Logo
- Klarer CTA: "Zugang erhalten"
- Fehlermeldung bei falschem Passwort

### 8.2 Workspace Selection Screen
- Firmenbranding
- Liste aller Workspaces (Mitarbeiter)
- Suchfunktion
- "Neuen Workspace erstellen" Button
- Klarer CTA: "Workspace auswählen"

### 8.3 Chat Interface
```
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────────────────────────────┐ │
│ │              │  │                                      │ │
│ │   Sidebar    │  │         Chat-Bereich                 │ │
│ │              │  │                                      │ │
│ │ - Neuer Chat │  │  ┌────────────────────────────────┐  │ │
│ │              │  │  │ Nachricht 1                    │  │ │
│ │ - Chat 1     │  │  └────────────────────────────────┘  │ │
│ │ - Chat 2     │  │  ┌────────────────────────────────┐  │ │
│ │ - Chat 3     │  │  │ Antwort 1                      │  │ │
│ │              │  │  └────────────────────────────────┘  │ │
│ │              │  │                                      │ │
│ │              │  │                                      │ │
│ │              │  │  ┌────────────────────────────────┐  │ │
│ │ ┌──────────┐ │  │  │ [📎] Nachricht eingeben... [→] │  │ │
│ │ │Workspace │ │  │  └────────────────────────────────┘  │ │
│ │ └──────────┘ │  │                                      │ │
│ └──────────────┘  └──────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Sidebar (Links):**
- "Neuer Chat" Button
- Chat-Historie (scrollbar)
- Suchfunktion für Chats
- Workspace-Anzeige unten
- Workspace-Wechsel Button

**Hauptbereich (Rechts):**
- Chat-Nachrichten
- Streaming-Anzeige
- Code-Highlighting
- Bild-Einbettung
- Markdown-Rendering

**Input-Bereich:**
- Textfeld (mehrzeilig)
- Datei-Upload Button
- Bild-Upload Button
- Senden Button
- Keyboard Shortcuts (Enter zum Senden)

---

## 9. Erfolgskriterien

| Kriterium | Messung |
|-----------|---------|
| Funktionalität | Alle Core Features implementiert |
| Usability | ChatGPT-ähnliche Erfahrung |
| Performance | Response < 3 Sekunden |
| Sicherheit | Kein API-Key Exposure |
| Stabilität | Keine kritischen Bugs |
| Accessibility | Über eigene URL erreichbar |

---

## 10. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| API-Kosten steigen | Mittel | Hoch | Rate Limits, Token Limits |
| Missbrauch | Niedrig | Mittel | Workspace-Isolation, Logging |
| Datenleaks | Niedrig | Hoch | Server-seitige Validierung |
| URL-Sperrung | Niedrig | Hoch | Eigene Domain / Reverse Proxy |
| OpenAI API Änderungen | Mittel | Mittel | Abstraktionsschicht |

---

## 11. Glossar

| Begriff | Definition |
|---------|------------|
| Workspace | Isolierter Bereich für einen Mitarbeiter |
| Chat | Eine Konversation innerhalb eines Workspace |
| Message | Eine einzelne Nachricht in einem Chat |
| Streaming | Echtzeit-Anzeige der AI-Antwort Token für Token |
| Vision | OpenAI's Bildanalyse-Fähigkeit |
| DALL-E | OpenAI's Bildgenerierungs-Modell |
