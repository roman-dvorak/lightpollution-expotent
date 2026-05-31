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
    bortleDesc: 'Click a class to display it in Stellarium',
  },
  city: {
    title: 'Light Up the City',
    subtitle: 'Place lights on the map and watch light pollution grow',
    addLight: 'Add light',
    reset: 'Reset',
    totalLP: 'Light pollution',
    bortle: 'Bortle',
    sendToStel: 'Show in Stellarium',
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
    },
    height: 'Height',
    maxReached: 'Element limit reached',
  },
  globe: {
    title: 'Light Pollution Atlas',
    subtitle: 'Click on the globe to display the light pollution level in Stellarium',
    clickHint: 'Click anywhere on the globe',
    location: 'Location',
    zone: 'Zone',
    bortleIndex: 'Bortle index',
    sendToStel: 'Show in Stellarium',
    lat: 'Latitude',
    lon: 'Longitude',
  },
  stel: {
    sending: 'Sending to Stellarium…',
    ok: 'Stellarium updated',
    error: 'Error communicating with Stellarium',
  },
}
