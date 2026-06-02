#!/usr/bin/env bash
# Spustí Stellarium (monitor 2, fullscreen, bez GUI) a poté webový kiosek (monitor 1).

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
STEL_PORT=8090
APP_DIR="$REPO_DIR/app"
APP_PORT=5173
APP_URL="http://localhost:$APP_PORT"
STEL_STARTUP_SCRIPT="$REPO_DIR/stellarium_startup.ssc"

# ── Stellarium ────────────────────────────────────────────────────────────────

if pgrep -x stellarium > /dev/null; then
  echo "[stellarium] již běží"
else
  echo "[stellarium] spouštím na monitoru 2..."
  stellarium \
    --screen-number 1 \
    --full-screen yes \
    --startup-script "$STEL_STARTUP_SCRIPT" \
    &
  STEL_PID=$!
  echo "[stellarium] PID $STEL_PID"

  # Nečekej na API – pokud není RemoteControl, timeout by zastavil celý skript
  echo "[stellarium] probíhá na pozadí, pokračuji..."
  sleep 3
fi

# ── Webová aplikace ───────────────────────────────────────────────────────────

if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "[app] instaluji závislosti..."
  npm --prefix "$APP_DIR" install
fi

echo "[app] spouštím vývojový server..."
npm --prefix "$APP_DIR" run dev &
APP_PID=$!

# Čekej na dev server (max 20 s)
echo -n "[app] čekám na server na portu $APP_PORT"
for i in $(seq 1 20); do
  if curl -sf "$APP_URL" > /dev/null 2>&1; then
    echo " OK"
    break
  fi
  echo -n "."
  sleep 1
  if [ "$i" -eq 20 ]; then
    echo ""
    echo "[app] CHYBA: dev server na portu $APP_PORT neodpovídá po 20 s" >&2
  fi
done

# ── Chromium kiosk (monitor 1) ────────────────────────────────────────────────

echo "[kiosk] spouštím Chromium v kiosk režimu na monitoru 1..."
chromium-browser \
  --kiosk \
  --window-position=0,0 \
  --noerrdialogs \
  --disable-infobars \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --no-first-run \
  --disable-session-crashed-bubble \
  "$APP_URL" &
KIOSK_PID=$!
echo "[kiosk] PID $KIOSK_PID"

# ── Úklid ────────────────────────────────────────────────────────────────────

trap 'echo "[shutdown]"; kill $APP_PID $KIOSK_PID 2>/dev/null; wait' EXIT

wait $APP_PID
