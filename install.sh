#!/usr/bin/env bash
# Instalační skript pro lightpollution-expotent
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/app"
STEL_CONFIG_DIR="$HOME/.stellarium"
STEL_CONFIG="$STEL_CONFIG_DIR/config.ini"

echo "=== Instalace systémových závislostí ==="

sudo apt-get update -qq

# git, curl
sudo apt-get install -y git curl

# Node.js >= 18 (přes NodeSource, pokud není nebo je stará verze)
NODE_VER=$(node --version 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
if [ "$NODE_VER" -lt 18 ]; then
  echo "[node] instaluji Node.js 18 přes NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[node] Node.js $(node --version) OK"
fi

# Stellarium
if ! command -v stellarium &>/dev/null; then
  echo "[stellarium] instaluji..."
  sudo apt-get install -y stellarium
else
  echo "[stellarium] $(stellarium --version 2>&1 | head -1) OK"
fi

echo ""
echo "=== Konfigurace Stellarium Remote Control ==="

# Spustíme Stellarium jednou na pozadí, aby vytvořil config.ini (pokud neexistuje)
if [ ! -f "$STEL_CONFIG" ]; then
  echo "[stellarium] generuji výchozí config (spouštím a hned ukončuji)..."
  timeout 5 stellarium --screenshot-dir /tmp &>/dev/null || true
  sleep 3
fi

if [ -f "$STEL_CONFIG" ]; then
  # Povolení pluginu Remote Control
  if grep -q '^\[plugins_load_at_startup\]' "$STEL_CONFIG"; then
    # Sekce existuje – nastav/přidej RemoteControl = true
    if grep -qP '^\s*RemoteControl\s*=' "$STEL_CONFIG"; then
      sed -i 's/^\s*RemoteControl\s*=.*/RemoteControl = true/' "$STEL_CONFIG"
    else
      sed -i '/^\[plugins_load_at_startup\]/a RemoteControl = true' "$STEL_CONFIG"
    fi
  else
    printf '\n[plugins_load_at_startup]\nRemoteControl = true\n' >> "$STEL_CONFIG"
  fi

  # Konfigurace Remote Control sekce
  if grep -q '^\[RemoteControl\]' "$STEL_CONFIG"; then
    sed -i '/^\[RemoteControl\]/,/^\[/ s/^\s*autostart\s*=.*/autostart = true/' "$STEL_CONFIG"
    sed -i '/^\[RemoteControl\]/,/^\[/ s/^\s*port\s*=.*/port = 8090/' "$STEL_CONFIG"
  else
    printf '\n[RemoteControl]\nautostart = true\nport = 8090\n' >> "$STEL_CONFIG"
  fi
  echo "[stellarium] config.ini upraven: Remote Control zapnut na portu 8090"
else
  echo "[stellarium] VAROVÁNÍ: config.ini nebyl nalezen v $STEL_CONFIG_DIR"
  echo "  Ručně povolte plugin Remote Control v GUI Stellaria a nastavte port 8090."
fi

echo ""
echo "=== Instalace Node.js závislostí ==="
npm --prefix "$APP_DIR" install

echo ""
echo "=== Hotovo! ==="
echo "Spusťte aplikaci příkazem: ./start.sh"
