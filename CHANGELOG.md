# Changelog

## [Unveröffentlicht]

### Neu
- „Kein Zugriff“: Button **Mit Benutzername und Passwort anmelden** (wenn der Server die Passwort-Anmeldung
  erlaubt). Die Anmeldeseite startet dann keine Windows-Anmeldung, bietet sie aber weiter als Button an.
- Textfeld: Die **Vorschau ist bearbeitbar**. Die Formatierungsleiste wirkt dort direkt auf den sichtbaren Text
  (fett, kursiv, Listen, Überschrift, Zitat, Code, Link …); jede Änderung wird sofort als Markdown übernommen
  und steht unter „Schreiben“ wieder als Markdown. Eingefügter Text kommt ohne fremde Formatierung.
- **Benachrichtigungen**: Glocke oben rechts mit Anzahl der ungelesenen Nachrichten. Beim Darüberfahren oder
  Anklicken öffnet sich das Fenster mit den Nachrichten (Berichtsheft abgegeben, abgenommen, Korrekturbedarf,
  Erinnerung an die Abgabe, Lernziel erreicht, Willkommen); ein Klick führt zur passenden Seite.
  „Alle als gelesen markieren“; neue Nachrichten werden jede Minute abgefragt.
- **Eigene Rückfragen statt Browser-Fenster**: Berichtsheft abgeben (mit Zusammenfassung der Woche, „Weiter
  bearbeiten“ oder „Jetzt abgeben“), Löschen von Einträgen, Lernzielen und Personen, Seite mit ungespeicherten
  Änderungen verlassen und Link einfügen im Textfeld.

### Geändert
- Die Windows-Anmeldung startet beim Öffnen nur noch automatisch, wenn sie in diesem Browser schon einmal geklappt
  hat. Sonst (z. B. Inkognito-Fenster) erscheint sofort die Anmeldeseite statt der Anmeldeabfrage des Browsers.
- „Abzeichnen“/„Abgezeichnet“ heißt überall **„Abnehmen“/„Abgenommen“**.
- Entwicklungs-Proxy zeigt auf das Backend unter https://localhost:5016 (`proxy.conf.mjs` statt `proxy.conf.json`).
- Berufsschule schlägt jetzt 8 statt 6 Stunden vor.
- Ausbilder sehen nicht abgegebene Wochen nicht mehr – stattdessen den Hinweis „Noch nicht abgegeben“.
- Button „Woche zur Prüfung einreichen“ heißt jetzt **Berichtsheft abgeben**.
- Menüpunkt „Azubi-Lernziele“ heißt jetzt **Lernfortschritt Azubis**.
- Automatisches Speichern passiert **sofort** nach jeder Änderung statt nach 1,5 Sekunden.

### Behoben
- „Windows-Anmeldung erneut versuchen“ auf „Kein Zugriff“ führte nur zur Anmeldeseite. Der Button startet die
  Windows-Anmeldung jetzt sofort neu und zeigt das Ergebnis an.
- Klick auf eine Benachrichtigung zeigte die Seite mit altem Stand, wenn man schon auf ihr war
  (z. B. „Zur Überarbeitung“ statt „Eingereicht“). Die Seite wird jetzt immer neu geladen.
- Erneut abgegebene Wochen zeigen nicht mehr „Geprüft von … am …“ der letzten Rückgabe; der alte Kommentar
  steht als „Kommentar der letzten Rückgabe“ da.
- Windows-Anmeldung über `npm start` (Port 4200) blieb bei „Windows-Anmeldung läuft“ hängen: Der Proxy
  öffnete für jeden NTLM-Schritt eine neue Verbindung. Er hält jetzt eine Verbindung zum Backend offen.
- Entwicklungsserver stürzte ab (`ERR_HTTP2_INVALID_CONNECTION_HEADERS`), wenn der Browser HTTP/2 nutzte
  (z. B. im Inkognito-Fenster): Der Proxy reicht die Verbindungsheader des Backends nicht mehr weiter.

## [1.6.0] – 2026-10-22

### Neu
- **Automatische Anmeldung mit dem Windows-Konto**, wenn der Server sie anbietet. Wer nicht in der
  Personenliste steht, sieht die Seite „Kein Zugriff“ (mit dem erkannten Windows-Konto) und kommt an keine
  andere Seite.
- Nach „Abmelden“ wird nicht sofort wieder angemeldet; die Anmeldeseite bietet „Mit Windows-Konto anmelden“
  und – falls erlaubt – Benutzername/Passwort.

## [1.5.0] – 2026-10-22

### Neu
- **Formatierter Text im Berichtsheft**: Über dem Tätigkeiten-Feld gibt es eine Werkzeugleiste für
  Fett, Kursiv, Unterstrichen, Durchgestrichen, Überschrift, Aufzählung, nummerierte Liste, Zitat, Code
  und Link. Tastenkürzel Strg+B / Strg+I / Strg+U; Listen werden mit Enter fortgesetzt.
- **Markdown direkt tippen** (z. B. `**fett**`, `- Punkt`) mit Umschalter „Schreiben / Vorschau“.
  Gespeichert wird der Markdown-Text, die Wochenansicht und der Ausdruck zeigen ihn formatiert an.
  Bestehende Einträge bleiben unverändert lesbar.

## [1.4.0] – 2026-10-22

### Neu
- Serverbetrieb: Das gebaute Frontend wird vom Backend unter derselben Adresse ausgeliefert und mit
  dem Backend als Windows-Dienst installiert (`Berichtsheft_Backend/deploy/build-release.cmd`).

## [1.3.0] – 2026-10-22

### Neu
- **Lernziel-Baum ein- und ausklappen** (Lernziele und Lernfortschritt): Pfeil vor jedem Lernziel mit
  Unterzielen, eingeklappte Zeilen zeigen die Anzahl der Unterziele.
- **Ebenen-Auswahl**: „Nur Richtlernziele“, „Richt- und Groblernziele“ oder „Alle Ebenen“. Die Wahl wird
  pro Seite im Browser gemerkt.

### Geändert
- **Rolle „Administrator/in“ entfernt**: Ausbilder dürfen alles, auch andere Ausbilder anlegen, bearbeiten
  und löschen. Rollenauswahl beim Anlegen/Bearbeiten: Azubi, Student, Ausbilder.
- Startseite für Ausbilder ohne die Kachel „Feinlernziele erreicht (Durchschnitt)“.
- Berufsschultage im Berichtsheft haben keine Lernziel-Zuordnung mehr (Auswahl wird ausgeblendet).

## [1.2.0] – 2026-10-22

### Neu
- **Automatisches Speichern im Berichtsheft**: Tageseinträge werden 1,5 Sekunden nach der letzten
  Eingabe gespeichert, der Speichern-Button entfällt. Oben auf der Seite steht, dass automatisch
  gespeichert wird, und wann die letzte automatische Speicherung war.
- Status je Tag: „Speichert …“, „Gespeichert“, Hinweis bei fehlenden Pflichtfeldern, bei Fehlern
  „Erneut versuchen“.
- Beim Wochenwechsel, Verlassen der Seite und Einreichen werden offene Änderungen vorher gespeichert.
- Warnung beim Verlassen der Seite (auch über die Seitenleiste), wenn Tage unvollständig sind oder
  nicht gespeichert werden konnten.
- Die Uhrzeit der letzten Speicherung kommt vom Backend (`updatedAt`) und bleibt nach dem Neuladen
  sichtbar; ältere Speicherungen werden mit Datum angezeigt.

## [1.1.2] – 2026-10-21

### Behoben
- Logo auf der Login-Seite ohne hellen Kasten (Namenskonflikt mit der Bootstrap-Klasse `.mark`).
- Fokussierte Eingabefelder bleiben weiß.

## [1.1.1] – 2026-10-21

### Behoben
- Einrückung der Lernziel-Hierarchie in „Lernziele“ und „Lernfortschritt“ (wurde von Bootstrap überschrieben).
- Eingabefelder wieder weiß statt grau.
- Logo freigestellt (kein heller Kasten auf dunklem Grund).
- Veraltete Fehlermeldungen verschwinden nach erfolgreichem Speichern, Einreichen oder Prüfen.

## [1.1.0] – 2026-10-21

### Neu
- **Neues Design** im Corporate Design: ruhige Flächen in Nachtblau und Weiß, Marken-Verlauf nur
  noch als Akzent, Seitenleiste statt Kopf- plus gedrehter Seitenleiste, mobil ausklappbar.
- Schrift **IBM Plex Sans**, lokal ausgeliefert (keine Google-Fonts-Aufrufe mehr).
- Berichtsheft als liniertes Nachweisblatt mit Datumsspalte.
- **Lernziel-Hierarchie im Formular**: Art wählen, dann nur passende übergeordnete Lernziele.
  Richtlernziele haben keines. „Unterziel anlegen“ direkt aus der Liste.
- Berechneter Status für Grob- und Richtlernziele (nicht direkt änderbar).
- Hinweise, warum eine Woche noch nicht eingereicht werden kann. Zukünftige Tage sind gesperrt.
- **HTTPS**: Entwicklungsserver auf https://localhost:4200, Proxy zum Backend über HTTPS.

### Geändert
- Ausbildungsjahr wird aus dem Ausbildungsbeginn berechnet; Ausbildungsbeginn ist Pflicht für Azubis.
- Passwort- und Benutzernamenregeln wie im Backend.

## [1.0.0] – 2026-10-21

Erste vollständige Version des Azubi-Portals.

### Neu
- Login mit Token-Speicherung, automatischem Logout bei abgelaufener Sitzung und Rollen-Guards
- Rollenabhängige Navigation (Kopfzeile + Seitenleiste)
- Übersicht/Dashboard für Azubis und Ausbilder
- Berichtsheft-Wochenansicht: erfassen, Lernziele zuordnen, einreichen, drucken/PDF
- Prüf-Warteschlange und Abzeichnen/Zurückgeben für Ausbilder
- Lernfortschritt mit Status-Pflege und Fortschrittsbalken
- Lernziele als Baum mit Suche, Anlegen/Bearbeiten/Löschen und CSV-Import/-Export
- Personenverwaltung mit Startpasswort-Generator und Passwort-Reset
- Profilseite mit Passwortänderung
- Dev-Proxy zum Backend, GitHub-Actions-CI

### Geändert
- Umstellung auf reine Single-Page-App (ohne SSR), da Login-Daten im Browser liegen
- Platzhalter-Tabellen durch echte Anbindung an das Backend ersetzt
