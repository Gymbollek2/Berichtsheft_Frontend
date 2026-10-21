# Berichtsheft – Frontend (Azubi-Portal)

Angular-Oberfläche für das **digitale Berichtsheft**. Azubis erfassen ihre Woche, ordnen Lernziele zu und reichen die Woche ein. Ausbilder prüfen, zeichnen ab, verwalten Personen und Lernziele und behalten den Lernfortschritt im Blick.

Das Backend liegt in [`Berichtsheft_Backend`](https://github.com/Gymbollek2/Berichtsheft_Backend) und muss für die Nutzung laufen.

**Technik:** Angular 21 (Standalone-Komponenten, Signals, zoneless) · Bootstrap 5 · Font Awesome · TypeScript

---

## Lokal starten – Schritt für Schritt

Ihr startet zwei Programme: zuerst das **Backend** (Port 8080), dann das **Frontend** (Port 4200).

### 1. Voraussetzungen installieren

| Was | Version | Prüfen mit | Download |
|---|---|---|---|
| **Node.js** | 22 LTS (mind. 20.19) | `node -v` | <https://nodejs.org> → „LTS“ |
| npm | kommt mit Node.js | `npm -v` | – |
| **JDK** (für das Backend) | 21 oder neuer | `java -version` | <https://adoptium.net> |
| Git | beliebig | `git --version` | <https://git-scm.com> |

### 2. Beide Projekte holen

Zum Beispiel in `C:\Users\<du>\IdeaProjects\git`:

```bash
git clone https://github.com/Gymbollek2/Berichtsheft_Backend.git
git clone https://github.com/Gymbollek2/Berichtsheft_Frontend.git
```

> Hast du dort schon gleichnamige Ordner (z. B. den alten GitLab-Stand), benenne sie vorher um, z. B. in `Berichtsheft_Backend_alt`.

### 3. Backend starten (Terminal 1)

Am einfachsten öffnest du in **IntelliJ** den Ordner `Berichtsheft_Backend` und startest `BerichtsheftApplication` mit dem grünen ▶. Alternativ über die Kommandozeile:

```bash
cd Berichtsheft_Backend
mvnw.cmd spring-boot:run      # Windows
./mvnw spring-boot:run        # macOS / Linux
```

Warte, bis `Started BerichtsheftApplication` erscheint. Details stehen im [Backend-README](https://github.com/Gymbollek2/Berichtsheft_Backend#lokal-starten--schritt-für-schritt).

### 4. Frontend starten (Terminal 2)

```bash
cd Berichtsheft_Frontend/azubi-portal
npm install        # nur beim ersten Mal bzw. nach Änderungen an package.json
npm start
```

Dann im Browser **<http://localhost:4200>** öffnen.

Der Entwicklungsserver leitet alle Aufrufe an `/v1/...` automatisch an `http://localhost:8080` weiter (`proxy.conf.json`). Dafür ist keine weitere Konfiguration nötig.

### 5. Einloggen

| Benutzername | Passwort | Rolle |
|---|---|---|
| `azubi` | `azubi123` | Azubi mit Beispiel-Wochen |
| `ausbilder` | `ausbilder123` | Ausbilder, eine Woche wartet auf Prüfung |
| `admin` | `admin123` | Admin |
| `azubi2` | `azubi123` | Azubi ohne Einträge |

**Zum Ausprobieren:**

1. Als `azubi` anmelden, unter *Berichtsheft → Meine Woche* Tage ausfüllen, Lernziele zuordnen und die Woche **einreichen**.
2. Als `ausbilder` anmelden, unter *Berichtsheft → Prüfen* die Woche öffnen und **abzeichnen** oder mit Kommentar **zurückgeben**.
3. Unter *Lernfortschritt* den Status von Lernzielen setzen, unter *Personen* neue Azubis anlegen.

### In IntelliJ / WebStorm

Ordner `Berichtsheft_Frontend/azubi-portal` öffnen, im Terminal `npm install` ausführen und dann `package.json` → `start` mit ▶ ausführen.

---

## Funktionen

### Für Azubis und duale Studierende

- **Übersicht**: Stand der aktuellen Woche, Lernfortschritt in Prozent, Hinweis auf zurückgegebene Wochen
- **Meine Woche**: Montag bis Freitag (Wochenende einblendbar) mit Art (Betrieb, Berufsschule, Urlaub, Krank …), Stunden, Tätigkeiten und Lernzielen. Speichern pro Tag, Woche einreichen.
- Zwischen Wochen blättern oder per Datum springen
- **Drucken / als PDF speichern** mit Unterschriftszeilen
- **Meine Wochen**: alle Wochen mit Status
- **Meine Lernziele**: Status je Lernziel mit Fortschrittsbalken
- **Profil**: eigene Daten ansehen, Passwort ändern

### Für Ausbilder und Admins

- **Übersicht**: offene Prüfungen und Lernfortschritt aller Azubis
- **Prüfen**: Warteschlange der eingereichten Wochen, abzeichnen oder mit Kommentar zurückgeben
- **Berichtshefte**: Berichtshefte aller Azubis durchsuchen
- **Lernfortschritt**: Azubi wählen und Status je Lernziel setzen
- **Lernziele**: Baumansicht (Richt → Grob → Fein), Suche, anlegen, bearbeiten, löschen, **CSV-Import/-Export**
- **Personen**: anlegen (mit generiertem Startpasswort), bearbeiten, Passwort zurücksetzen, löschen. Ausbilder dürfen nur Azubis und Studierende verwalten, Admins alle.

Menü und Seiten passen sich automatisch der **Rolle** an. Die Rechte werden zusätzlich im Backend geprüft.

---

## Befehle

Alle im Ordner `azubi-portal`:

| Befehl | Zweck |
|---|---|
| `npm start` | Entwicklungsserver auf <http://localhost:4200> |
| `npm run build` | Produktions-Build nach `dist/azubi-portal/browser` |
| `npm test` | Unit-Tests (Vitest) |
| `npx prettier --write src` | Code formatieren |

## Versionen und Releases

Tags und GitHub-Releases erstellt der Workflow `.github/workflows/release.yml` automatisch:

1. `"version"` in `azubi-portal/package.json` erhöhen (z. B. `1.1.0`).
2. Im `CHANGELOG.md` einen Abschnitt `## [1.1.0] – Datum` ergänzen.
3. Committen und auf `main` pushen. Wenn Tests und Build grün sind, entstehen Tag `v1.1.0` und ein Release mit dem fertigen Build als ZIP.

## Projektstruktur

```
azubi-portal/
├── proxy.conf.json            Weiterleitung /v1 → Backend (localhost:8080)
├── public/assets/             Logos & Icons
└── src/
    ├── styles.css             globales Design (Farben, Karten, Badges, Druckansicht)
    └── app/
        ├── app.routes.ts      alle Routen inkl. Rollen-Schutz
        ├── core/              Datentypen (models.ts) & Hilfsfunktionen
        ├── services/          API-Zugriffe, Login, Navigation
        ├── interceptors/      hängt das Login-Token an jede Anfrage
        ├── guards/            Login- & Rollenprüfung für Routen
        ├── layout/            Kopfzeile, Seitenleiste, Rahmen
        └── pages/             Seiten (dashboard, berichtsheft, lernziele, personen, …)
```

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| „Backend nicht erreichbar – läuft der Server auf Port 8080?“ | Das Backend ist nicht gestartet oder läuft auf einem anderen Port (`proxy.conf.json` prüfen). |
| Login schlägt fehl | Benutzername/Passwort prüfen. Nach einem DB-Reset im Backend gelten wieder die Demo-Passwörter. |
| `npm install` meldet Versionskonflikte | `node_modules` und `package-lock.json` löschen und `npm install` erneut ausführen. |
| `The Angular CLI requires a minimum Node.js version` | Node.js 22 LTS installieren. |
| Nach dem Login sofort wieder ausgeloggt | Die Sitzung ist abgelaufen oder das Passwort wurde geändert. Einfach neu anmelden. |
