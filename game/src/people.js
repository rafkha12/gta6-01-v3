// Rounded people — human-proportioned figures built ONLY from capsules,
// spheres, cylinders and cones. NO BoxGeometry on any person, ever. Each
// figure has pivots at the shoulders and hips so it can walk, run, drive
// and punch with swinging limbs.
import * as THREE from 'three';

function mat(color, rough = 0.85) {
  return new THREE.MeshLambertMaterial({ color, roughness: rough });
}
function capsule(r, len, color) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat(color));
  m.castShadow = false;
  return m;
}
function ball(r, color, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(color));
  m.scale.set(sx, sy, sz);
  return m;
}
function tube(r, len, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, len, 10), mat(color));
  return m;
}

// spec: { skin, hair, jacket, shirt, pants, shoes, height, cap?, ponytail? }
export function buildPerson(spec, seed = 1) {
  const H = spec.height;
  const g = new THREE.Group();
  const joints = {};
  const s = H / 1.8; // scale relative to a 1.8 m reference figure

  // Legs — capsules pivoting at the hips, sphere feet.
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.085 * s, 0.52 * H, 0);
    const leg = capsule(0.055 * s, 0.34 * H, spec.pants);
    leg.position.y = -0.22 * H;
    hip.add(leg);
    const foot = ball(0.055 * s, spec.shoes, 1, 0.6, 1.7);
    foot.position.set(0, -0.48 * H, 0.03 * s);
    hip.add(foot);
    g.add(hip);
    joints[side < 0 ? 'legL' : 'legR'] = hip;
  }
  // Torso — a capsule (jacket), with a shirt panel on the chest.
  const torso = capsule(0.115 * s, 0.26 * H, spec.jacket);
  torso.position.y = 0.70 * H;
  g.add(torso);
  const chest = ball(0.10 * s, spec.shirt, 1, 1.15, 0.55);
  chest.position.set(0, 0.76 * H, 0.07 * s);
  g.add(chest);
  // Arms — capsules pivoting at the shoulders, sphere hands.
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.15 * s, 0.84 * H, 0);
    const arm = capsule(0.042 * s, 0.30 * H, spec.jacket);
    arm.position.y = -0.19 * H;
    shoulder.add(arm);
    const hand = ball(0.048 * s, spec.skin);
    hand.position.y = -0.38 * H;
    shoulder.add(hand);
    g.add(shoulder);
    joints[side < 0 ? 'armL' : 'armR'] = shoulder;
  }
  // Head — sphere, hair cap, face direction +x is forward (we rotate the
  // whole group to face the travel direction; the face is on +z).
  const head = new THREE.Group();
  head.position.y = 0.94 * H;
  const skull = ball(0.095 * s, spec.skin);
  head.add(skull);
  // Hair: a slightly larger sphere, squashed and pushed up/back, so the
  // face stays visible from the front.
  const hair = ball(0.10 * s, spec.hair, 1, 0.92, 1);
  hair.position.set(0, 0.028 * s, -0.018 * s);
  head.add(hair);
  // Face: two eyes and a nose bump, all spheres — no flat planes.
  for (const side of [-1, 1]) {
    const eye = ball(0.014 * s, 0x1a120c);
    eye.position.set(side * 0.036 * s, 0.012 * s, 0.088 * s);
    head.add(eye);
  }
  const nose = ball(0.016 * s, spec.skin, 0.8, 1.1, 0.9);
  nose.position.set(0, -0.018 * s, 0.095 * s);
  head.add(nose);
  if (spec.ponytail) {
    // A tied-back ponytail: three small spheres trailing down the back.
    for (let i = 0; i < 3; i += 1) {
      const p = ball(0.038 * s - i * 0.006 * s, spec.hair);
      p.position.set(0, -0.06 * s - i * 0.06 * s, -0.10 * s - i * 0.012 * s);
      head.add(p);
    }
  }
  if (spec.cap) {
    const crown = tube(0.105 * s, 0.05 * s, spec.cap);
    crown.position.y = 0.075 * s;
    head.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.105 * s, 0.105 * s, 0.012 * s, 12, 1, false, -0.6, 1.2), mat(spec.cap));
    brim.position.set(0, 0.055 * s, 0.05 * s);
    head.add(brim);
  }
  g.add(head);
  joints.head = head;

  // Pose + walk-cycle state, driven by main.js each frame.
  const person = { group: g, joints, spec, height: H, phase: seed * 1.7, bob: 0 };
  person.setPose = (pose, dt, moving) => {
    const { legL, legR, armL, armR } = joints;
    if (pose === 'drive') {
      legL.rotation.x = -1.15; legR.rotation.x = -1.15;
      armL.rotation.x = -0.9; armR.rotation.x = -0.9;
      armL.rotation.z = 0.15; armR.rotation.z = -0.15;
      return;
    }
    if (pose === 'punch') {
      armR.rotation.x = -1.5; armL.rotation.x = 0.3;
      legL.rotation.x = 0.15; legR.rotation.x = -0.15;
      return;
    }
    if (!moving) {
      // Idle: arms hang, a slow breath.
      const b = Math.sin(person.phase * 0.5) * 0.03;
      armL.rotation.set(0, 0, 0.08 + b); armR.rotation.set(0, 0, -0.08 - b);
      legL.rotation.x = 0; legR.rotation.x = 0;
      return;
    }
    person.phase += dt * 9;
    const sw = Math.sin(person.phase);
    legL.rotation.x = sw * 0.55; legR.rotation.x = -sw * 0.55;
    armL.rotation.x = -sw * 0.45; armR.rotation.x = sw * 0.45;
    armL.rotation.z = 0.08; armR.rotation.z = -0.08;
    person.bob = Math.abs(Math.cos(person.phase)) * 0.04;
  };
  return person;
}

// A varied pedestrian: random skin, hair, outfit, height.
export function buildPedestrian(rng) {
  const skins = [0xe9b184, 0xc98d64, 0x8a5a3b, 0xf0c8a0, 0x6e4530];
  const hairs = [0x2a1a12, 0x17100c, 0x4a2f1a, 0x777777, 0x8a5a2a];
  const tops = [0x4a6fa5, 0x7a4a8a, 0x3a7a5a, 0xd8a03a, 0x8a2f3a, 0x2a8a8a, 0xc0c0c0];
  const pantsC = [0x2e2a33, 0x39557f, 0x4a3a2a, 0x5a5a5a];
  return buildPerson({
    skin: rng.pick(skins), hair: rng.pick(hairs),
    jacket: rng.pick(tops), shirt: 0xe8e2d2,
    pants: rng.pick(pantsC), shoes: 0x1d1a20,
    height: rng.range(1.58, 1.92),
    ponytail: rng.next() < 0.4, cap: rng.next() < 0.25 ? rng.pick([0x20455a, 0x8a2f3a, 0x2a2a2a]) : undefined,
  }, rng.next() * 10);
}
