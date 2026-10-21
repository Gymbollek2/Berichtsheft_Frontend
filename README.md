# Berichtsheft – Frontend (Azubi-Portal)

Angular-Oberfläche für das **digitale Berichtsheft**. Azubis erfassen ihre Woche, ordnen Lernziele zu und reichen die Woche ein. Ausbilder prüfen, zeichnen ab, verwalten Personen und Lernziele und behalten den Lernfortschritt im Blick.

Das Backend liegt in [`Berichtsheft_Backend`](https://github.com/Gymbollek2/Berichtsheft_Backend) und muss für die Nutzung laufen.

**Technik:** Angular 21 (Standalone-Komponenten, Signals, zoneless), Bootstrap 5, Font Awesome, IBM Plex Sans (lokal eingebunden), TypeScript. Läuft ausschließlich über **HTTPS**.

---

## Lokal starten – Schritt für Schritt

Ihr startet zwei Programme: zuerst das **Backend** (https://localhost:8443), dann das **Frontend** (https://localhost:4200). Beide laufen nur verschlüsselt.

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

Warte, bis `Started BerichtsheftApplication` erscheint. Beim ersten Start erzeugt das Backend selbst ein Entwicklungszertifikat. Details stehen im [Backend-README](https://github.com/Gymbollek2/Berichtsheft_Backend#lokal-starten--schritt-für-schritt).

### 4. Frontend starten (Terminal 2)

```bash
cd Berichtsheft_Frontend/azubi-portal
npm install        # nur beim ersten Mal bzw. nach Änderungen an package.json
npm start
```

Dann im Browser **<https://localhost:4200>** öffnen.

Der Browser warnt beim ersten Aufruf vor dem selbstsignierten Zertifikat: *Erweitert → Weiter zu localhost (unsicher)*. Lokal ist das unbedenklich. Ohne Warnung geht es mit mkcert, siehe [Vertrauenswürdiges Zertifikat](#vertrauenswürdiges-zertifikat-optional).

Der Entwicklungsserver leitet alle Aufrufe an `/v1/...` automatisch an `https://localhost:8443` weiter (`proxy.conf.json`). Der Browser spricht damit nur mit einer Adresse, weitere Konfiguration ist nicht nötig.

### Vertrauenswürdiges Zertifikat (optional)

1. [mkcert](https://github.com/FiloSottile/mkcert) installieren (Windows: `winget install FiloSottile.mkcert`) und einmalig `mkcert -install` ausführen.
2. Im Ordner `azubi-portal`: `mkcert -cert-file ssl/localhost.pem -key-file ssl/localhost-key.pem localhost 127.0.0.1`
3. Starten mit `npm run start:mkcert`.

Für das Backend gibt es dieselbe Möglichkeit, siehe Backend-README.

### 5. Einloggen

| Benutzername | Passwort | Rolle |
|---|---|---|
| `azubi` | `azubi123` | Azubi mit Beispiel-Wochen |
| `ausbilder` | `ausbilder123` | Ausbilder, eine Woche wartet auf Prüfung |
| `admin` | `admin123` | Admin |
| `azubi2` | `azubi123` | Azubi ohne Einträge |

**Zum Ausprobieren:**

1. Als `azubi` anmelden, unter *Berichtsheft → Aktuelle Woche* Tage ausfüllen und Feinlernziele zuordnen. Eine vergangene, vollständige Woche **einreichen**.
2. Als `ausbilder` anmelden, unter *Berichtsheft → Zur Prüfung* die Woche öffnen und **abzeichnen** oder mit Kommentar **zurückgeben**.
3. Unter *Lernfortschritt* den Status von Lernzielen setzen, unter *Personen* neue Azubis anlegen.

### In IntelliJ / WebStorm

Ordner `Berichtsheft_Frontend/azubi-portal` öffnen, im Terminal `npm install` ausführen und dann `package.json` → `start` mit ▶ ausführen.

---

## Funktionen

### Für Azubis und duale Studierende

- **Übersicht**: Stand der aktuellen Woche, Lernfortschritt in Prozent, Hinweis auf zurückgegebene Wochen
- **Aktuelle Woche**: Nachweisblatt Montag bis Freitag (Wochenende einblendbar) mit Art (Betrieb, Berufsschule, Urlaub, Krank …), Stunden, Tätigkeiten und Feinlernzielen. Speichern pro Tag, Woche einreichen.
  - Zukünftige Tage und Tage vor dem Ausbildungsbeginn sind gesperrt.
  - Höchstens 10 Stunden pro Tag.
  - An Urlaubs-, Krankheits- und Feiertagen gibt es keine Lernziele.
  - Einreichen geht ab Freitag, wenn alle Werktage eingetragen sind. Die Seite sagt, was noch fehlt.
- Zwischen Wochen blättern oder per Datum springen
- **Drucken / als PDF speichern** mit Unterschriftszeilen
- **Meine Wochen**: alle Wochen mit Status
- **Meine Lernziele**: Status je Lernziel mit Fortschrittsbalken
- **Profil**: eigene Daten ansehen, Passwort ändern

### Für Ausbilder und Admins

- **Übersicht**: offene Prüfungen und Lernfortschritt aller Azubis
- **Prüfen**: Warteschlange der eingereichten Wochen, abzeichnen oder mit Kommentar zurückgeben
- **Berichtshefte**: Berichtshefte aller Azubis durchsuchen
- **Lernfortschritt**: Azubi wählen und den Status der Feinlernziele setzen. Grob- und Richtlernziele werden automatisch berechnet.
- **Lernziele**: Baumansicht mit Suche, anlegen, bearbeiten, löschen sowie **CSV-Import/-Export**. Die Hierarchie wird geführt:
  - Ein Richtlernziel hat kein übergeordnetes Lernziel.
  - Ein Groblernziel wählt sein Richtlernziel, ein Feinlernziel sein Groblernziel. Die Auswahl zeigt nur passende Lernziele.
  - „+ Groblernziel“ bzw. „+ Feinlernziel“ in der Liste legt direkt ein Unterziel an.
  - Lernziele mit Unterzielen lassen sich nicht löschen.
- **Personen**: anlegen (mit generiertem Startpasswort), bearbeiten, Passwort zurücksetzen, löschen. Ausbilder dürfen nur Azubis und Studierende verwalten, Admins alle.

Menü und Seiten passen sich automatisch der **Rolle** an. Die Rechte werden zusätzlich im Backend geprüft.

---

## Befehle

Alle im Ordner `azubi-portal`:

| Befehl | Zweck |
|---|---|
| `npm start` | Entwicklungsserver auf <https://localhost:4200> |
| `npm run start:mkcert` | wie `npm start`, mit eigenem Zertifikat aus `ssl/` |
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
    ├── styles.css             Design-System (Farben, Schrift, Tabellen, Status, Druckansicht)
    └── app/
        ├── app.routes.ts      alle Routen inkl. Rollen-Schutz
        ├── core/              Datentypen (models.ts) & Hilfsfunktionen
        ├── services/          API-Zugriffe, Login, Navigation
        ├── interceptors/      hängt das Login-Token an jede Anfrage
        ├── guards/            Login- & Rollenprüfung für Routen
        ├── layout/            Seitenleiste und Rahmen (mobil ausklappbar)
        └── pages/             Seiten (dashboard, berichtsheft, lernziele, personen, …)
```

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| „Backend nicht erreichbar …“ | Das Backend ist nicht gestartet oder läuft auf einem anderen Port (`proxy.conf.json` prüfen). |
| „Diese Verbindung ist nicht sicher“ | Erwartet beim selbstsignierten Zertifikat: einmal bestätigen oder mkcert verwenden. |
| `http://localhost:4200` lädt nicht | Richtig so, das Portal läuft nur unter `https://`. |
| Login schlägt fehl | Benutzername/Passwort prüfen. Nach einem DB-Reset im Backend gelten wieder die Demo-Passwörter. |
| `npm install` meldet Versionskonflikte | `node_modules` und `package-lock.json` löschen und `npm install` erneut ausführen. |
| `The Angular CLI requires a minimum Node.js version` | Node.js 22 LTS installieren. |
| Nach dem Login sofort wieder ausgeloggt | Die Sitzung ist abgelaufen oder das Passwort wurde geändert. Einfach neu anmelden. |
