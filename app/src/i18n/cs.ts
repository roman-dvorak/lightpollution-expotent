export default {
  nav: {
    intro: 'Úvod',
    city: 'Nasviťme město',
    globe: 'Světelný atlas',
  },
  intro: {
    title: 'Světelné znečištění',
    subtitle: 'Jak lidé přišli o hvězdnou oblohu',
    content: `Světelné znečištění je nadměrné nebo nevhodné osvětlení způsobené lidskou činností.
Záře měst se šíří do okolí a rozsvěcuje noční oblohu natolik, že většina lidí na Zemi
nikdy neuvidí Mléčnou dráhu pouhým okem.

Astronomové měří světelné znečištění na tzv. Bortleově stupnici (1–9):
stupeň 1 představuje dokonale tmavou oblohu (desetitisíce hvězd, zřetelná Mléčná dráha),
stupeň 9 typické centrum velkoměsta, kde je vidět jen Měsíc a nejjasnější planety.

Obsah této sekce bude doplněn.`,
    bortle: 'Bortleova stupnice',
    bortleDesc: 'Klikněte na stupeň a zobrazte jej ve Stellariu',
  },
  city: {
    title: 'Nasviťme město',
    subtitle: 'Rozmístěte osvětlení a sledujte, jak roste světelné znečištění',
    addLight: 'Přidat světlo',
    reset: 'Resetovat',
    totalLP: 'Světelné znečištění',
    bortle: 'Bortle',
    sendToStel: 'Zobrazit ve Stellariu',
    lights: {
      globe:           'Kulová lampa',
      fullCutoff:      'Plná clona',
      coldLED:         'LED studená',
      pcAmber:         'LED PC Amber',
      floodlight:      'Reflektor',
      church:          'Osvět. kostel',
      house:           'Barák',
      badBillboard:    'Billboard špatný',
      betterBillboard: 'Billboard lepší',
      darkBillboard:   'Billboard nesvět.',
      cars:            'Auta dálková',
    },
    lightDesc: {
      globe:           'Svítí všemi směry — vysoké ZZ',
      fullCutoff:      'Pouze dolů — nízké ZZ bez ohledu na výšku',
      coldLED:         'Studené LED — střední ZZ',
      pcAmber:         'Teplé jantarové LED — nízké ZZ',
      floodlight:      'Reflektor — velmi vysoké ZZ',
      church:          'Reflektory zdola nahoru — extrémní ZZ',
      house:           'Okna a venkovní světla — nízké ZZ',
      badBillboard:    'Osvětlený zdola — vysoké ZZ',
      betterBillboard: 'Osvětlený shora — nízké ZZ',
      darkBillboard:   'Bez osvětlení — nulové ZZ',
      cars:            'Dálková světla — střední ZZ',
    },
    height: 'Výška',
    maxReached: 'Dosažen limit prvků',
  },
  globe: {
    title: 'Světelný atlas',
    subtitle: 'Klikněte na mapu a zobrazte úroveň světelného znečištění ve Stellariu',
    clickHint: 'Klikněte kamkoli na globus',
    location: 'Poloha',
    zone: 'Zóna',
    bortleIndex: 'Bortle index',
    sendToStel: 'Zobrazit ve Stellariu',
    lat: 'Zeměpisná šířka',
    lon: 'Zeměpisná délka',
  },
  stel: {
    sending: 'Odesílám do Stellaria…',
    ok: 'Stellarium aktualizováno',
    error: 'Chyba komunikace se Stellariem',
  },
}
