// Bahía Sol — shared constants: world layout, the duo, missions, tuning.
export const WORLD = {
  block: 44,        // metres per city block (building + street)
  road: 14,         // road width
  blocks: 5,        // blocks per side (city spans -110..110)
  size: 240,        // playable half-extent for ground plane
  beachZ: 150,      // south of this is sand, then water
  waterZ: 205,
};

export const DUO = {
  mara: {
    id: 'mara', name: 'Mara Voss', role: 'Wheelwoman',
    skin: 0xe9b184, skinCss: '#e9b184',
    hair: 0x2a1a12, hairCss: '#2a1a12',
    jacket: 0xc1272d, jacketCss: '#c1272d',
    shirt: 0xf2ead9, shirtCss: '#f2ead9',
    pants: 0x39557f, pantsCss: '#39557f',
    shoes: 0x6b2d2d, shoesCss: '#6b2d2d',
    height: 1.72, lipCss: '#b34a5e', eyeCss: '#241812',
  },
  dario: {
    id: 'dario', name: 'Dario Cruz', role: 'Wheelman',
    skin: 0xc98d64, skinCss: '#c98d64',
    hair: 0x17100c, hairCss: '#17100c',
    jacket: 0x1f8a8a, jacketCss: '#1f8a8a',
    shirt: 0xe8e2d2, shirtCss: '#e8e2d2',
    pants: 0x2e2a33, pantsCss: '#2e2a33',
    shoes: 0x1d1a20, shoesCss: '#1d1a20',
    height: 1.84, lipCss: '#8a4a3c', eyeCss: '#1a120c',
    cap: 0x20455a, capCss: '#20455a',
  },
};

// Missions are a story arc from Rosa Delmar, the fixer. Each step is a
// target point the player must reach (on foot or in a car, as noted).
export const MISSIONS = [
  {
    title: 'Golden Hour', payout: 250, time: 180,
    brief: 'Rosa needs a driver. Pick up the client at the garage, then drive him to the marina hotel.',
    steps: [
      { text: 'Pick up the client at the garage', x: -66, z: -66, r: 6, needCar: false },
      { text: 'Drive the client to the marina hotel', x: 110, z: 110, r: 7, needCar: true },
    ],
  },
  {
    title: 'Sunset Heat', payout: 600, time: 240,
    brief: 'The cops are on you. Lose them, then reach the hideout under the east bridge.',
    steps: [
      { text: 'Lose the police — get your wanted level to zero', x: 0, z: 0, r: 0, needCar: false, escape: true },
      { text: 'Reach the hideout under the east bridge', x: 110, z: 22, r: 6, needCar: false },
    ],
  },
  {
    title: 'Neon Run', payout: 800, time: 240,
    brief: 'A package is waiting at the plaza. Grab it and deliver it to the NEON BAR.',
    steps: [
      { text: 'Grab the package at the plaza', x: 0, z: 0, r: 6, needCar: false },
      { text: 'Deliver the package to the NEON BAR', x: -66, z: 44, r: 6, needCar: false },
    ],
  },
  {
    title: 'The Last Light', payout: 2500, time: 300,
    brief: 'The big one. Grab the cash at the plaza, escape the police, and reach the boat at the marina.',
    steps: [
      { text: 'Grab the cash at the plaza', x: 0, z: 0, r: 6, needCar: false },
      { text: 'Escape the police — get your wanted level to zero', x: 0, z: 0, r: 0, needCar: false, escape: true },
      { text: 'Reach the boat at the marina', x: 88, z: 132, r: 7, needCar: false },
    ],
  },
];

export const TUNING = {
  walkSpeed: 6, runSpeed: 10.5,
  carAccel: 14, carBrake: 26, carMax: 38, carReverse: 10, carTurn: 1.9,
  playerHealth: 100, bustDistance: 3.2, bustTime: 3,
  wantedDecaySeconds: 20, policeRamDamage: 8,
  trafficCars: 14, pedestrians: 26,
};
