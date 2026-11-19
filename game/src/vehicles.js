// Cars: boxy is fine here — the no-box rule is for people only. A car is a
// body box with a cabin, four cylinder wheels, headlights and a tail bar.
// Police cars get a light bar that flashes.
import * as THREE from 'three';

const BODY_COLORS = [0xc23b2e, 0x2e6fc2, 0xd8a03a, 0x3a8a5a, 0x8a2f6d, 0xd8d8d8, 0x2a2a2a, 0xe07b39];

export function makeCar(color, police = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: police ? 0x1d2f5e : color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x18242e });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.2), bodyMat);
  body.position.y = 0.55; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.0), glassMat);
  cabin.position.set(0, 1.05, -0.2); g.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.9), bodyMat);
  roof.position.set(0, 1.32, -0.2); g.add(roof);
  // Headlights + tail lights.
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), lightMat);
    hl.position.set(s * 0.65, 0.62, 2.11); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    tl.position.set(s * 0.65, 0.62, -2.11); g.add(tl);
  }
  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x141414 });
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.36, wz);
    g.add(w); wheels.push(w);
  }
  let lightBar = null;
  if (police) {
    lightBar = new THREE.Group();
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.3), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    red.position.x = -0.3; lightBar.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.3), new THREE.MeshBasicMaterial({ color: 0x2040ff }));
    blue.position.x = 0.3; lightBar.add(blue);
    lightBar.position.set(0, 1.42, -0.2);
    g.add(lightBar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.14, 4.22), new THREE.MeshBasicMaterial({ color: 0xd8d8d8 }));
    stripe.position.y = 0.72; g.add(stripe);
  }
  return { group: g, wheels, lightBar, color };
}

export function randomCarColor(rng) { return rng.pick(BODY_COLORS); }
