// Traffic: cars that follow the road grid and pedestrians who wander the
// sidewalks. Deterministic under the seeded RNG.
import * as THREE from 'three';
import { WORLD, TUNING } from './config.js';
import { makeCar, randomCarColor } from './vehicles.js';
import { buildPedestrian } from './people.js';
import { clampToWorld } from './city.js';

const ROAD_CENTERS = [-110, -66, -22, 22, 66, 110];

export function createTraffic(scene, rng) {
  const cars = [];
  const peds = [];
  const group = new THREE.Group();
  scene.add(group);

  function spawnCar() {
    const axis = rng.next() < 0.5 ? 'x' : 'z';
    const lane = rng.pick(ROAD_CENTERS);
    const dir = rng.next() < 0.5 ? 1 : -1;
    const pos = rng.range(-200, 200);
    const car = makeCar(randomCarColor(rng));
    const c = {
      mesh: car.group, wheels: car.wheels,
      axis, lane, dir, speed: rng.range(8, 14), maxSpeed: rng.range(10, 15),
      x: axis === 'x' ? pos : lane, z: axis === 'x' ? lane : pos,
      angle: 0,
      updateMesh() { c.mesh.position.set(c.x, 0, c.z); c.mesh.rotation.y = c.angle; },
    };
    c.mesh.position.set(c.x, 0, c.z);
    group.add(c.mesh);
    cars.push(c);
    return c;
  }
  for (let i = 0; i < TUNING.trafficCars; i += 1) spawnCar();

  function spawnPed() {
    const spec = buildPedestrian(rng);
    const p = {
      person: spec, x: rng.range(-110, 110), z: rng.range(-110, 140),
      angle: rng.next() * Math.PI * 2, speed: rng.range(1.2, 2.4),
      turnTimer: rng.range(2, 6),
    };
    p.person.group.position.set(p.x, 0, p.z);
    group.add(p.person.group);
    peds.push(p);
    return p;
  }
  for (let i = 0; i < TUNING.pedestrians; i += 1) spawnPed();

  function carAhead(c, dt) {
    for (const o of cars) {
      if (o === c || o.axis !== c.axis || o.lane !== c.lane || o.dir !== c.dir) continue;
      const d = c.axis === 'x' ? (o.x - c.x) * c.dir : (o.z - c.z) * c.dir;
      if (d > 0 && d < 9) return true;
    }
    return false;
  }

  function update(dt, playerPos) {
    // Cars: drive along their lane; turn at intersections sometimes.
    for (const c of cars) {
      const nearIntersection = Math.abs(((c.axis === 'x' ? c.x : c.z) % WORLD.block + WORLD.block) % WORLD.block - WORLD.block / 2) < 3;
      if (nearIntersection && rng.next() < dt * 0.25) {
        c.axis = c.axis === 'x' ? 'z' : 'x';
        c.dir = rng.next() < 0.5 ? 1 : -1;
        if (c.axis === 'x') { c.z = c.lane; c.lane = Math.round(c.z / WORLD.block) * WORLD.block; }
        else { c.x = c.lane; c.lane = Math.round(c.x / WORLD.block) * WORLD.block; }
      }
      const target = carAhead(c, dt) ? 0 : c.maxSpeed;
      c.speed += Math.max(-14 * dt, Math.min(8 * dt, target - c.speed));
      if (c.axis === 'x') c.x += c.dir * c.speed * dt; else c.z += c.dir * c.speed * dt;
      if (c.x > 225) c.x = -225; if (c.x < -225) c.x = 225;
      if (c.z > 200) c.z = -225; if (c.z < -225) c.z = 200;
      const targetAngle = c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI);
      let da = targetAngle - c.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      c.angle += da * Math.min(1, dt * 4);
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.angle;
      for (const w of c.wheels) w.rotation.x += (c.speed * dt) / 0.36;
    }
    // Pedestrians: wander, turn at random, keep off the water.
    for (const p of peds) {
      p.turnTimer -= dt;
      if (p.turnTimer <= 0) {
        p.turnTimer = rng.range(2, 7);
        p.angle += rng.pick([-Math.PI / 2, Math.PI / 2, Math.PI, 0]);
      }
      p.x += Math.sin(p.angle) * p.speed * dt;
      p.z += Math.cos(p.angle) * p.speed * dt;
      if (p.x > 220 || p.x < -220 || p.z > 195 || p.z < -220) p.angle += Math.PI;
      [p.x, p.z] = clampToWorld(p.x, p.z);
      p.person.group.position.set(p.x, 0, p.z);
      p.person.group.rotation.y = p.angle;
      p.person.setPose('walk', dt, true);
    }
  }

  // Take a traffic car out of the flow (the player stole it).
  function steal(car) {
    const i = cars.indexOf(car);
    if (i >= 0) cars.splice(i, 1);
    return car;
  }
  function release(car) {
    car.speed = 0;
    cars.push(car);
  }
  function nearestCar(x, z, maxDist) {
    let best = null; let bd = maxDist;
    for (const c of cars) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  return { cars, peds, update, steal, release, nearestCar, spawnCar };
}
