import https from 'node:https';

// Weiterleitung /v1 → Backend. Alle Anfragen laufen über genau eine offen gehaltene Verbindung:
// Die Windows-Anmeldung (NTLM) besteht aus mehreren Schritten, die das Backend derselben
// TCP-Verbindung zuordnet. Mit wechselnden Verbindungen bliebe sie bei „Windows-Anmeldung läuft“ hängen.
const agent = new https.Agent({ keepAlive: true, maxSockets: 1 });

// Verbindungsheader gelten nur zwischen Proxy und Backend (HTTP/1.1). Der Entwicklungsserver spricht mit dem
// Browser HTTP/2, dort sind sie verboten – ein weitergereichtes „Keep-Alive“ bringt Node zum Absturz.
const VERBINDUNGS_HEADER = [
  'connection',
  'keep-alive',
  'proxy-connection',
  'transfer-encoding',
  'upgrade',
];

const verbindungsHeaderEntfernen = (proxy) => {
  proxy.on('proxyRes', (res) => {
    for (const header of VERBINDUNGS_HEADER) {
      delete res.headers[header];
    }
  });
};

export default {
  // Live-Verbindung der Glocke: bleibt dauerhaft offen und braucht deshalb eine eigene Verbindung –
  // über die gemeinsame (maxSockets: 1) würden sonst alle anderen Anfragen warten. Muss vor '/v1' stehen.
  '/v1/benachrichtigung/live': {
    target: 'https://localhost:5016',
    secure: false,
    changeOrigin: true,
    configure: verbindungsHeaderEntfernen,
  },
  '/v1': {
    target: 'https://localhost:5016',
    secure: false,
    changeOrigin: true,
    agent,
    configure: verbindungsHeaderEntfernen,
  },
};
