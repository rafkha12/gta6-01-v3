// Bahía Sol at dusk: a grid city with a beach and marina, lit windows,
// palms, neon signs, and a purple-pink sunset sky with a low sun.
import * as THREE from 'three';
import { WORLD } from './config.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function groundTexture(rng) {
  return canvasTexture(1024, 1024, (ctx, W, H) => {
    // Asphalt base, purple-tinted by the dusk — bright enough to read.
    ctx.fillStyle = '#463a5c'; ctx.fillRect(0, 0, W, H);
    const px = W / (WORLD.size * 2); // px per metre
    const toX = (x) => (x + WORLD.size) * px;
    const toZ = (z) => (z + WORLD.size) * px;
    // Sidewalks.
    ctx.fillStyle = '#4a3f63';
    for (let i = -5; i <= 5; i += 1) {
      const c = i * WORLD.block;
      ctx.fillRect(toX(c - WORLD.block / 2), 0, WORLD.block * px, H);
      ctx.fillRect(0, toZ(c - WORLD.block / 2), W, WORLD.block * px);
    }
    // Roads.
    ctx.fillStyle = '#322a4a';
    for (let i = -5; i <= 5; i += 1) {
      const c = i * WORLD.block;
      ctx.fillRect(toX(c - WORLD.road / 2), 0, WORLD.road * px, H);
      ctx.fillRect(0, toZ(c - WORLD.road / 2), W, WORLD.road * px);
    }
    // Lane dashes.
    ctx.fillStyle = 'rgba(255,210,140,0.55)';
    for (let i = -5; i <= 5; i += 1) {
      const c = i * WORLD.block;
      for (let d = -WORLD.size; d < WORLD.size; d += 12) {
        ctx.fillRect(toX(c) - 1, toZ(d), 2, 6 * px);
        ctx.fillRect(toX(d), toZ(c) - 1, 6 * px, 2);
      }
    }
    // Beach sand south of beachZ, water beyond waterZ.
    const sand = ctx.createLinearGradient(0, toZ(WORLD.beachZ), 0, toZ(WORLD.waterZ));
    sand.addColorStop(0, '#c98d5a'); sand.addColorStop(1, '#8a6a4a');
    ctx.fillStyle = sand;
    ctx.fillRect(0, toZ(WORLD.beachZ), W, toZ(WORLD.waterZ) - toZ(WORLD.beachZ));
    const water = ctx.createLinearGradient(0, toZ(WORLD.waterZ), 0, H);
    water.addColorStop(0, '#3a4a8a'); water.addColorStop(1, '#1a2448');
    ctx.fillStyle = water;
    ctx.fillRect(0, toZ(WORLD.waterZ), W, H - toZ(WORLD.waterZ));
    // A few warm light pools near the plaza.
    ctx.fillStyle = 'rgba(255,170,90,0.10)';
    for (let i = 0; i < 24; i += 1) {
      ctx.beginPath(); ctx.arc(toX(rng.range(-110, 110)), toZ(rng.range(-110, 110)), rng.range(8, 20) * px, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function windowTexture(rng, base, lit) {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    for (let y = 10; y < H - 10; y += 22) {
      for (let x = 10; x < W - 10; x += 18) {
        const r = rng.next();
        ctx.fillStyle = r < lit ? (r < lit * 0.7 ? '#ffd27d' : '#7ad4ff') : '#14101e';
        ctx.fillRect(x, y, 10, 13);
      }
    }
  });
}

function neonTexture(text, color) {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = '#160a20'; ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 28;
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, H / 2 + 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, W / 2, H / 2 + 2);
  });
}

function makePalm(rng) {
  const g = new THREE.Group();
  const h = rng.range(6, 9);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, h, 7),
    new THREE.MeshLambertMaterial({ color: 0x4a3423 }),
  );
  trunk.position.y = h / 2;
  trunk.rotation.z = rng.range(-0.08, 0.08);
  g.add(trunk);
  const frondMat = new THREE.MeshLambertMaterial({ color: 0x1d4a2a });
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.2, 4), frondMat);
    frond.scale.set(1, 1, 0.18);
    frond.position.set(Math.cos(a) * 1.3, h + 0.3, Math.sin(a) * 1.3);
    frond.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    g.add(frond);
  }
  return g;
}

function makeBeacon(color) {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 1.6, 42, 12, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 21;
  g.add(beam);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.2, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
  g.add(ring);
  g.visible = false;
  return g;
}

export function createCity(scene, rng) {
  // Sky: a vertical gradient texture as the background.
  const skyTex = canvasTexture(16, 512, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#241040'); g.addColorStop(0.45, '#7a2a68');
    g.addColorStop(0.72, '#e85d3d'); g.addColorStop(1, '#ffc46b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  scene.background = skyTex;
  scene.fog = new THREE.Fog(0x8a4a72, 90, 430);

  const hemi = new THREE.HemisphereLight(0x9a6ab8, 0x3a2a44, 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffa050, 2.1);
  sun.position.set(-160, 55, 90);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffc080, 0.7);
  fill.position.set(120, 80, -100);
  scene.add(fill);

  // The sun disc, low in the west.
  const sunMesh = new THREE.Mesh(
    new THREE.CircleGeometry(30, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, fog: false }),
  );
  sunMesh.position.set(-330, 85, 100);
  sunMesh.lookAt(0, 40, 0);
  scene.add(sunMesh);
  const glowTex = canvasTexture(128, 128, (ctx, W, H) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,210,130,0.8)'); g.addColorStop(1, 'rgba(255,150,80,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 190),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false }),
  );
  glow.position.set(-330, 85, 100);
  glow.lookAt(0, 40, 0);
  scene.add(glow);

  // Ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.size * 2, WORLD.size * 2),
    new THREE.MeshLambertMaterial({ map: groundTexture(rng) }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Buildings on the block grid, plaza kept open.
  const facades = [
    windowTexture(rng, '#2a1d40', 0.45),
    windowTexture(rng, '#33233f', 0.55),
    windowTexture(rng, '#241a30', 0.35),
    windowTexture(rng, '#3a2430', 0.5),
  ];
  const buildings = [];
  for (let bx = -2; bx <= 2; bx += 1) {
    for (let bz = -2; bz <= 2; bz += 1) {
      const cx = bx * WORLD.block, cz = bz * WORLD.block;
      if (cx === 0 && cz === 0) continue; // the plaza
      const w = rng.range(24, 30), d = rng.range(24, 30), hgt = rng.range(12, 46);
      const tex = rng.pick(facades);
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, hgt, d),
        new THREE.MeshLambertMaterial({ map: tex }),
      );
      m.position.set(cx, hgt / 2, cz);
      scene.add(m);
      buildings.push(m);
      // A rooftop rim so towers read at dusk.
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 0.4, d + 0.3),
        new THREE.MeshBasicMaterial({ color: 0xff9a50 }),
      );
      rim.position.set(cx, hgt + 0.2, cz);
      scene.add(rim);
    }
  }

  // Palms along the beach road and the plaza.
  for (let i = 0; i < 16; i += 1) {
    const p = makePalm(rng);
    const along = i % 2 === 0;
    p.position.set(
      along ? rng.range(-110, 110) : (i % 4 < 2 ? -118 : 118),
      0,
      along ? 142 : rng.range(-100, 120),
    );
    scene.add(p);
  }
  for (let i = 0; i < 4; i += 1) {
    const p = makePalm(rng);
    p.position.set([-14, 14, -14, 14][i], 0, [-14, -14, 14, 14][i]);
    scene.add(p);
  }

  // Neon signs.
  const signs = [
    { text: 'NEON BAR', color: '#ff2e88', x: -88, y: 14, z: 44, ry: Math.PI / 4 },
    { text: 'HOTEL MARINA', color: '#2ad4ff', x: 88, y: 20, z: 88, ry: -Math.PI / 4 },
    { text: 'BAHÍA SOL', color: '#ffb03a', x: 0, y: 18, z: -110, ry: 0 },
  ];
  for (const s of signs) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 4),
      new THREE.MeshBasicMaterial({ map: neonTexture(s.text, s.color), transparent: false }),
    );
    mesh.position.set(s.x, s.y, s.z);
    mesh.rotation.y = s.ry;
    scene.add(mesh);
  }

  // Mission beacons (hidden until a mission needs them).
  const beacons = {
    garage: makeBeacon(0xffd27d),
    hotel: makeBeacon(0x2ad4ff),
    plaza: makeBeacon(0xff2e88),
    hideout: makeBeacon(0x7ad4ff),
    neonBar: makeBeacon(0xff2e88),
    marina: makeBeacon(0xffd27d),
  };
  beacons.garage.position.set(-66, 0, -66);
  beacons.hotel.position.set(110, 0, 110);
  beacons.plaza.position.set(0, 0, 0);
  beacons.hideout.position.set(110, 0, 22);
  beacons.neonBar.position.set(-66, 0, 44);
  beacons.marina.position.set(88, 0, 132);
  for (const b of Object.values(beacons)) scene.add(b);

  return {
    buildings, beacons,
    update(t) {
      // Neon shimmer + beacon pulse.
      for (const b of Object.values(beacons)) {
        if (b.visible) b.children[0].material.opacity = 0.26 + 0.08 * Math.sin(t * 3);
      }
    },
  };
}

// Is (x,z) on a road? Used by traffic and the player-car spawn.
export function onRoad(x, z) {
  const inRoad = (v) => {
    const m = ((v % WORLD.block) + WORLD.block) % WORLD.block;
    return m < WORLD.road / 2 + 2 || m > WORLD.block - WORLD.road / 2 - 2;
  };
  return inRoad(x) || inRoad(z);
}
export function clampToWorld(x, z) {
  return [Math.max(-225, Math.min(225, x)), Math.max(-225, Math.min(200, z))];
}
