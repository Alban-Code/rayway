// ─────────────────────────────────────────────────────────────────────────────
// Logs JSON sur stdout.
//
// Pourquoi : en cloud (Cloud Run, ECS…), stdout est capté par le système de
// logs. Si on émet une ligne = un objet JSON, on peut filtrer / requêter
// facilement (`severity=ERROR`, `event=card_upserted`, etc.).
//
// Règle : pas de `console.log("...")` libre dans le code d'ingestion.
//         On passe toujours par `log.info / log.warn / log.error`.
// ─────────────────────────────────────────────────────────────────────────────

type Level = 'info' | 'warn' | 'error';

interface LogPayload {
  event: string;          // ex: "ingest_started", "card_upserted", "diff_empty"
  [key: string]: unknown; // champs additionnels (durationMs, code, error...)
}

function emit(level: Level, payload: LogPayload): void {
  const logObject = { ts: new Date().toISOString(), level, ...payload };

  process.stdout.write(JSON.stringify(logObject) + '\n');
}

export const log = {
  info: (p: LogPayload) => emit('info', p),
  warn: (p: LogPayload) => emit('warn', p),
  error: (p: LogPayload) => emit('error', p),
};
