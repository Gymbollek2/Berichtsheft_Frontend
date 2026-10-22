import https from 'node:https';

// Weiterleitung /v1 → Backend. Alle Anfragen laufen über genau eine offen gehaltene Verbindung:
// Die Windows-Anmeldung (NTLM) besteht aus mehreren Schritten, die das Backend derselben
// TCP-Verbindung zuordnet. Mit wechselnden Verbindungen bliebe sie bei „Windows-Anmeldung läuft“ hängen.
const agent = new https.Agent({ keepAlive: true, maxSockets: 1 });

export default {
  '/v1': {
    target: 'https://localhost:5016',
    secure: false,
    changeOrigin: true,
    agent,
  },
};
