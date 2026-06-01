# Stellarium Kiosk

Interaktivní kiosková aplikace o světelném znečištění. Ovládá běžící instanci Stellaria přes jeho HTTP API a vizualizuje dopad různých typů osvětlení na noční oblohu.

## Architektura

```
stel_control/
├── app/          React + TypeScript SPA (Vite)
│   └── src/
│       ├── components/
│       │   ├── Introduction.tsx   – 3-sloupcová informační tabule + Bortleova stupnice
│       │   ├── CityGame.tsx       – interaktivní simulátor světelného znečištění
│       │   └── GlobeView.tsx      – 3D globus s atlasem světelného znečištění
│       ├── services/
│       │   └── stellarium.ts      – klient Stellarium HTTP API (skripty + vlastnosti)
│       └── i18n/                  – překlady CS / EN
├── data/         podpůrné obrázky (LP mapa, loga)
└── test/         Python testovací skripty pro Stellarium API
```

## Závislosti

- **Stellarium** ≥ 0.20 s povoleným HTTP serverem na portu `8090`
- **Node.js** ≥ 18 + npm

## Spuštění — vývojový režim

### 1. Spustit Stellarium s HTTP serverem

Otevřete Stellarium → **Nastavení → Pluginy → Remote Control** → zaškrtněte *Načíst při startu* a nastavte port **8090**. Restartujte Stellarium.

Alternativně spusťte ze shellu:

```bash
stellarium --remote-control-port 8090
```

Ověřte, že API odpovídá:

```bash
curl http://localhost:8090/api/main/status
```

### 2. Spustit webovou aplikaci

```bash
cd app
npm install
npm run dev
```

Aplikace běží na **http://localhost:5173** a proxuje volání `/api/*` na Stellarium (port 8090 → konfigurováno v `vite.config.ts`).

## Spuštění — produkční build

```bash
cd app
npm run build   # výstup do app/dist/
npm run preview # lokální preview sestavení
```

Složku `dist/` lze servírovat jakýmkoliv statickým HTTP serverem. Stellarium musí stále běžet na portu 8090 (nebo nastavte správnou `BASE` URL v `src/services/stellarium.ts`).

## Záložky aplikace

| Záložka | Popis |
|---|---|
| **Úvod** | Informační karty o světelném znečištění (9 témat ve 3 sloupcích) + Bortleova stupnice — kliknutím na stupeň B1–B9 se nastaví odpovídající znečištění ve Stellariu. |
| **Nasviťme město** | Simulátor: klikejte do scény a přidávejte různé typy osvětlení. Celkové světelné znečištění se promítá živě do Stellaria. |
| **Světelný atlas** | 3D globus — kliknutím na libovolné místo na Zemi se načte skutečná úroveň světelného znečištění (Falchiho atlas 2024) a nastaví se ve Stellariu. |

Přepínač **CS / EN** v pravém rohu přepíná jazyk celé aplikace.

## Testovací skripty

```bash
# Python 3, potřeba: pip install requests
python3 test/cycle_light_pollution.py
```

Skript projede sadu astronomických lokalit (Praha, Atacama, Mauna Kea…), animuje přelet a postupně zvyšuje světelné znečištění. Slouží k otestování Stellarium API bez webové aplikace.

## Ladění

- Pokud aplikace hlásí *„Chyba komunikace se Stellariem"*, zkontrolujte, že Stellarium běží a plugin Remote Control je aktivní.
- CORS chyby v prohlížeči: ve vývojovém módu se volání proxují přes Vite (`/api` → `localhost:8090`). V produkci musí být aplikace a Stellarium na stejném hostu, nebo je nutné nakonfigurovat CORS v Stellariu.
- Konzole prohlížeče zobrazuje podrobné chyby komunikace.
