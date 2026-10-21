# Changelog

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
