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
      astronomer:      'Astronom',
    },
    lightDesc: {
      globe:           'Svítí všemi směry — vysoké SZ',
      fullCutoff:      'Pouze dolů — nízké SZ bez ohledu na výšku',
      coldLED:         'Studené LED — střední SZ',
      pcAmber:         'Teplé jantarové LED — nízké SZ',
      floodlight:      'Reflektor — velmi vysoké SZ',
      church:          'Reflektory zdola nahoru — extrémní SZ',
      house:           'Okna a venkovní světla — nízké SZ',
      badBillboard:    'Osvětlený zdola — vysoké SZ',
      betterBillboard: 'Osvětlený shora — nízké SZ',
      darkBillboard:   'Bez osvětlení — nulové SZ',
      cars:            'Dálková světla — střední SZ',
      astronomer:      'Červená lampička — nulové SZ',
    },
    height: 'Výška',
    maxReached: 'Dosažen limit prvků',
    soundOn: "Zvuk zapnutý",
    soundOff: "Zvuk vypnutý",
    centerSky: 'Vycentrovat oblohu',
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
  about: {
    button: 'O projektu',
    title: 'O projektu',
    body: `Rozviť město, zhasni oblohu je interaktivní webová aplikace, která názorně ukazuje dopad světelného znečištění na noční oblohu.

Uživatel umisťuje různé typy pouličních lamp, reflektorů a dalších světelných zdrojů na noční panorama města a v reálném čase sleduje, jak se mění jas oblohy — od přirozeně tmavé (Bortle 1) až po přesvětlenou městskou (Bortle 9).

Aplikace je propojena s planetáriem Stellarium, takže kliknutím na Bortleho stupnici nebo rozmístěním světel se aktuální úroveň znečištění přenese přímo do virtuální oblohy.

Cílem projektu je popularizovat problematiku světelného znečištění a ukázat, že správně navržené osvětlení může výrazně snížit jeho dopady — aniž bychom se museli vzdát bezpečí a komfortu, které nám umělé světlo poskytuje.

Projekt vznikl v roce 2026 pro Veletrh Vědy.`,
  },
  stel: {
    sending: 'Odesílám do Stellaria…',
    ok: 'Stellarium aktualizováno',
    error: 'Chyba komunikace se Stellariem',
  },
}
