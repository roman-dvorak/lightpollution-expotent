#!/usr/bin/env bash
# Spustí Stellarium (pokud ještě neběží) a poté webový kiosek.
set -euo pipefail

STEL_PORT=8090
APP_DIR="$(cd "$(dirname "$0")/app" && pwd)"

# ── Stellarium ────────────────────────────────────────────────────────────────

if pgrep -x stellarium > /dev/null; then
  echo "[stellarium] již běží"
else
  echo "[stellarium] spouštím..."
  stellarium --full-screen yes &
  STEL_PID=$!
  echo "[stellarium] PID $STEL_PID"

  # Čekej na HTTP API (max 30 s)
  echo -n "[stellarium] čekám na API na portu $STEL_PORT"
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:$STEL_PORT/api/main/status" > /dev/null 2>&1; then
      echo " OK"
      break
    fi
    echo -n "."
    sleep 1
    if [ "$i" -eq 30 ]; then
      echo ""
      echo "[stellarium] CHYBA: API na portu $STEL_PORT neodpovídá po 30 s" >&2
      echo "  Zkontrolujte, že je plugin Remote Control v ~/.stellarium/config.ini povolen:" >&2
      echo "    [plugins_load_at_startup]  RemoteControl = true" >&2
      echo "    [RemoteControl]            autostart = true  port = $STEL_PORT" >&2
      exit 1
    fi
  done
fi

# ── Webová aplikace ───────────────────────────────────────────────────────────

if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "[app] instaluji závislosti..."
  npm --prefix "$APP_DIR" install
fi

echo "[app] spouštím vývojový server..."
exec npm --prefix "$APP_DIR" run dev
