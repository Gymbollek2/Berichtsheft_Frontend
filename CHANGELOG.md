# Changelog

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
