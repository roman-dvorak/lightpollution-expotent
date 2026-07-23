export default {
  nav: {
    intro: 'Introduction',
    city: 'Light Up the City',
    globe: 'Light Pollution Atlas',
  },
  intro: {
    title: 'Light Pollution',
    subtitle: 'How humanity lost the starry sky',
    content: `Light pollution is excessive or inappropriate artificial lighting caused by human activity.
The glow of cities spreads across the landscape and brightens the night sky so much that
most people on Earth will never see the Milky Way with the naked eye.

Astronomers measure light pollution using the Bortle Dark-Sky Scale (1–9):
Class 1 represents a truly dark sky (tens of thousands of stars, vivid Milky Way),
Class 9 is a typical city centre where only the Moon and brightest planets are visible.

Content for this section will be added.`,
    bortle: 'The Bortle Scale',
    bortleDesc: 'Click a class to display it on the simulated sky (or in Stellarium)',
  },
  city: {
    title: 'Light Up the City',
    subtitle: 'Place lights on the map and watch light pollution grow',
    addLight: 'Add light',
    reset: 'Reset',
    totalLP: 'Light pollution',
    bortle: 'Bortle',
    sendToStel: 'Show in sky',
    lights: {
      globe:           'Globe lamp',
      fullCutoff:      'Full cutoff',
      coldLED:         'Cold LED',
      pcAmber:         'PC Amber LED',
      floodlight:      'Floodlight',
      church:          'Lit church',
      house:           'House',
      badBillboard:    'Bad billboard',
      betterBillboard: 'Better billboard',
      darkBillboard:   'Dark billboard',
      cars:            'High-beam cars',
      astronomer:      'Astronomer',
    },
    lightDesc: {
      globe:           'Omnidirectional — high LP',
      fullCutoff:      'Downward only — low LP at any height',
      coldLED:         'Cold white LED — medium LP',
      pcAmber:         'Warm amber LED — low LP',
      floodlight:      'Floodlight — very high LP',
      church:          'Upward spotlights — extreme LP',
      house:           'Windows & exterior — low LP',
      badBillboard:    'Bottom-lit — high LP',
      betterBillboard: 'Top-lit — low LP',
      darkBillboard:   'No lighting — zero LP',
      cars:            'High beams — medium LP',
      astronomer:      'Red lamp — zero LP',
    },
    height: 'Height',
    maxReached: 'Element limit reached',
    soundOn: "Sound on",
    soundOff: "Sound off",
    centerSky: 'Center sky',
  },
  globe: {
    title: 'Light Pollution Atlas',
    subtitle: 'Click on the globe to display the light pollution level (in Stellarium if connected)',
    clickHint: 'Click anywhere on the globe',
    location: 'Location',
    zone: 'Zone',
    bortleIndex: 'Bortle index',
    sendToStel: 'Show in sky',
    lat: 'Latitude',
    lon: 'Longitude',
  },
  about: {
    button: 'About',
    title: 'About',
    body: `Light Up the City, Dim the Sky is an interactive web application that visually demonstrates the impact of light pollution on the night sky.

Users place different types of street lamps, floodlights, and other light sources onto a nocturnal city panorama and watch in real time as the sky brightness changes — from a naturally dark sky (Bortle 1) to an over-lit urban sky (Bortle 9).

The application is connected to the Stellarium planetarium, so clicking on the Bortle scale or placing lights instantly transfers the current pollution level into the virtual sky.

The goal of the project is to raise awareness about light pollution and show that properly designed lighting can significantly reduce its impact — without sacrificing the safety and comfort that artificial light provides.

The project was created in 2026 for the Science Fair (Veletrh Vědy).`,
  },
  stel: {
    sending: 'Updating sky…',
    ok: 'Sky updated',
    error: 'Error communicating with Stellarium',
  },
}
