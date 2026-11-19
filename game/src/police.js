// Wanted level + police pursuit. Stars rise on crime and decay when the
// player stays clean and out of sight; police cars chase, ram, and bust.
import * as THREE from 'three';
import { makeCar } from './vehicles.js';

export function createPolice(scene, rng) {
  const cars = [];
  const group = new THREE.Group();
  scene.add(group);
  let stars = 0;
  let lastCrime = -100;
  let decayTimer = 0;
  let bustTimer = 0;
  let time = 0;

  function spawnCar(x, z) {
    const car = makeCar(0x1d2f5e, true);
    const c = { mesh: car.group, wheels: car.wheels, lightBar: car.lightBar, x, z, angle: 0, speed: 0, maxSpeed: 40 };
    c.mesh.position.set(x, 0, z);
    group.add(c.mesh);
    cars.push(c);
    return c;
  }

  function addStars(n, why) {
    stars = Math.max(0, Math.min(5, stars + n));
    lastCrime = time;
    decayTimer = 0;
    while (cars.length < stars) {
      const a = rng.next() * Math.PI * 2;
      spawnCar(Math.cos(a) * 60, Math.sin(a) * 60);
    }
    return stars;
  }

  function update(dt, player, onBusted) {
    time += dt;
    // Decay: one star per 20 s of clean time with no police close by.
    if (stars > 0 && time - lastCrime > 8) {
      decayTimer += dt;
      const near = cars.some((c) => Math.hypot(c.x - player.x, c.z - player.z) < 40);
      if (!near && decayTimer >= 20) {
        stars -= 1; decayTimer = 0;
        if (cars.length > stars) {
          const c = cars.pop();
          group.remove(c.mesh);
        }
      }
    }
    const px = player.x, pz = player.z;
    let busted = false;
    for (const c of cars) {
      const dx = px - c.x, dz = pz - c.z;
      const dist = Math.hypot(dx, dz) || 1;
      const targetAngle = Math.atan2(dx, dz);
      let da = targetAngle - c.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      c.angle += da * Math.min(1, dt * 2.2);
      const want = dist > 6 ? c.maxSpeed : c.maxSpeed * 0.6;
      c.speed += Math.max(-20 * dt, Math.min(16 * dt, want - c.speed));
      c.x += Math.sin(c.angle) * c.speed * dt;
      c.z += Math.cos(c.angle) * c.speed * dt;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.angle;
      for (const w of c.wheels) w.rotation.x += (c.speed * dt) / 0.36;
      // Light bar flashes.
      if (c.lightBar) {
        const on = Math.floor(time * 6) % 2 === 0;
        c.lightBar.children[0].material.color.setHex(on ? 0xff2020 : 0x551010);
        c.lightBar.children[1].material.color.setHex(on ? 0x101055 : 0x2040ff);
      }
      // Ram: damage + push when touching the player.
      if (dist < 4.5) {
        player.vx = (player.vx || 0) + (dx / dist) * 6 * dt * 10;
        player.vz = (player.vz || 0) + (dz / dist) * 6 * dt * 10;
        if (player.damage) player.damage(8 * dt, 'ram');
      }
      // Bust: police close and the player slow for 3 s.
      const playerSpeed = player.speed || 0;
      if (dist < 3.2 && playerSpeed < 2) {
        bustTimer += dt;
        if (bustTimer >= 3) busted = true;
      } else {
        bustTimer = Math.max(0, bustTimer - dt * 2);
      }
    }
    if (busted && onBusted) onBusted();
    return { stars, busted };
  }

  function clear() {
    for (const c of cars) group.remove(c.mesh);
    cars.length = 0;
    stars = 0; bustTimer = 0;
  }

  return {
    get stars() { return stars; },
    cars, addStars, update, clear,
  };
}
