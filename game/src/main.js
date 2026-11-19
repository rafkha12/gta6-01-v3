// Bahía Sol — the game itself: third-person open world on foot and by car,
// traffic, pedestrians, police, four missions, HUD + minimap, save/load.
// Exposes window.__game with the interface the headless play-test drives:
// state/mode/player/playerCar/money/police/missions/traffic/update/saveGame.
import * as THREE from 'three';
import { createRandom } from './random.js';
import { DUO, TUNING, WORLD } from './config.js';
import { drawTitle } from './titleart.js';
import { buildPerson } from './people.js';
import { createCity, clampToWorld } from './city.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';

const SAVE_KEY = 'bahiasol-save-v3';
const SHOT_FRAMES = 6;

export class Game {
  constructor(doc, canvas, poster) {
    this.doc = doc;
    this.canvas = canvas;
    this.poster = poster;
    const params = new URLSearchParams(window.location.search);
    const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
    this.seed = Number.isInteger(seedParam) ? seedParam : 1;
    this.rng = createRandom(this.seed);
    this.shot = params.get('shot');
    this.time = 0;
    this.state = 'menu';
    this.mode = 'foot';
    this.money = 150;
    this.characterId = 'mara';
    this.character = DUO.mara;
    this.camYaw = Math.PI * 0.75;
    this.camPitch = 0.28;
    this.lastDamageAt = -100;

    // Renderer + scene.
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);

    // World.
    this.city = createCity(this.scene, this.rng);
    this.traffic = createTraffic(this.scene, this.rng);
    this.police = createPolice(this.scene, this.rng);
    this.missions = createMissions(this.city.beacons);
    this.hud = createHud(doc);
    this.audio = createAudio();
    this.input = createInput(canvas);

    // Building collision boxes.
    this.boxes = this.city.buildings.map((m) => {
      const b = new THREE.Box3().setFromObject(m);
      return { minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z };
    });

    // Player + partner (the other half of the duo).
    this.player = this.makePlayer(this.characterId, 0, 22);
    this.partner = this.makePartner();
    this.playerCar = null;

    this.loadGame();
    this.bindUi();
    this.drawPoster();
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.__game = this;
    if (this.shot) {
      this.runShot();
    } else {
      this.loop();
    }
  }

  makePlayer(id, x, z) {
    const spec = DUO[id];
    const person = buildPerson({ ...spec, ponytail: id === 'mara', cap: id === 'dario' ? spec.cap : undefined }, 1);
    person.group.position.set(x, 0, z);
    this.scene.add(person.group);
    const p = {
      x, z, angle: 0, health: TUNING.playerHealth, speed: 0,
      vx: 0, vz: 0, person, mode: 'foot',
      updateMesh: () => { person.group.position.set(p.x, 0, p.z); person.group.rotation.y = p.angle; },
      damage: (n) => this.damagePlayer(n),
    };
    return p;
  }

  makePartner() {
    const other = this.characterId === 'mara' ? 'dario' : 'mara';
    const spec = DUO[other];
    const person = buildPerson({ ...spec, ponytail: other === 'mara', cap: other === 'dario' ? spec.cap : undefined }, 2);
    person.group.position.set(this.player.x + 2, 0, this.player.z + 2);
    this.scene.add(person.group);
    return { person, x: this.player.x + 2, z: this.player.z + 2 };
  }

  setCharacter(id) {
    if (!DUO[id] || id === this.characterId) return;
    this.characterId = id;
    this.character = DUO[id];
    this.scene.remove(this.player.person.group);
    const { x, z, angle, health } = this.player;
    this.player = this.makePlayer(id, x, z);
    this.player.angle = angle; this.player.health = health;
    this.scene.remove(this.partner.person.group);
    this.partner = this.makePartner();
    this.saveGame();
  }

  // ---- UI ----
  bindUi() {
    const doc = this.doc;
    const show = (id, on) => { const e = doc.getElementById(id); if (e) e.style.display = on ? 'flex' : 'none'; };
    this.ui = { show };
    doc.getElementById('btn-start').addEventListener('click', () => { this.audio.start(); this.startGame(this.characterId); });
    doc.getElementById('btn-mara').addEventListener('click', () => this.selectCharacter('mara'));
    doc.getElementById('btn-dario').addEventListener('click', () => this.selectCharacter('dario'));
    doc.getElementById('btn-mission-accept').addEventListener('click', () => this.acceptMission());
    doc.getElementById('btn-job').addEventListener('click', () => this.acceptMission());
    doc.getElementById('btn-resume').addEventListener('click', () => { this.state = 'playing'; show('pause', false); });
    doc.getElementById('btn-restart').addEventListener('click', () => window.location.reload());
    doc.getElementById('btn-restart2').addEventListener('click', () => window.location.reload());
    doc.getElementById('poster').addEventListener('click', () => { this.audio.start(); });
  }

  selectCharacter(id) {
    this.setCharacter(id);
    const doc = this.doc;
    doc.getElementById('btn-mara').classList.toggle('selected', id === 'mara');
    doc.getElementById('btn-dario').classList.toggle('selected', id === 'dario');
  }

  drawPoster() {
    const ctx = this.poster.getContext('2d');
    drawTitle(ctx, this.poster.width, this.poster.height, 0);
  }

  showTitle(forShot = false) {
    this.state = 'menu';
    this.doc.getElementById('poster').style.display = 'block';
    this.doc.getElementById('menu').style.display = forShot ? 'none' : 'flex';
    this.doc.getElementById('hud').style.display = 'none';
    if (forShot) this.doc.body.classList.add('shot');
  }

  startGame(id) {
    if (id) this.setCharacter(id);
    this.state = 'playing';
    this.doc.getElementById('poster').style.display = 'none';
    this.doc.getElementById('menu').style.display = 'none';
    this.doc.getElementById('hud').style.display = 'block';
    this.audio.start();
    if (!this.missions.active && this.missions.index < 4) this.missions.offer();
  }

  acceptMission() {
    if (this.state !== 'playing') return;
    if (this.missions.active) return;
    const a = this.missions.accept();
    if (a) this.audio.blip(660, 0.1);
  }

  // ---- shot helpers (used by shots.js) ----
  setCamera(yaw, pitch, dist) {
    this.camYaw = yaw; this.camPitch = pitch; this.camDist = dist;
  }
  teleportPlayer(x, z, angle) {
    this.player.x = x; this.player.z = z; this.player.angle = angle;
    this.player.updateMesh();
  }
  placePartnerNextToPlayer() {
    this.partner.x = this.player.x + 1.6;
    this.partner.z = this.player.z + 1.2;
    this.partner.person.group.position.set(this.partner.x, 0, this.partner.z);
    this.partner.person.group.rotation.y = this.player.angle;
    this.partner.person.group.visible = true;
  }
  placePlayerInCarAt(x, z, angle, speed) {
    const car = this.traffic.cars[0];
    car.x = x; car.z = z; car.angle = angle; car.speed = speed; car.maxSpeed = 38;
    car.mesh.position.set(x, 0, z); car.mesh.rotation.y = angle;
    this.enterCar(car);
    this.playerCar.speed = speed;
  }
  placeTrafficAhead(list) {
    list.forEach(([x, z, speed], i) => {
      const c = this.traffic.cars[i + 1];
      if (!c) return;
      c.x = x; c.z = z; c.angle = -Math.PI / 2; c.speed = speed; c.maxSpeed = speed;
      c.mesh.position.set(x, 0, z); c.mesh.rotation.y = c.angle;
    });
  }
  placePoliceBehind(list) {
    list.forEach(([x, z, speed], i) => {
      const c = this.police.cars[i];
      if (!c) return;
      c.x = x; c.z = z; c.angle = -Math.PI / 2; c.speed = speed;
      c.mesh.position.set(x, 0, z); c.mesh.rotation.y = c.angle;
    });
  }
  placePoliceAt(list) {
    list.forEach(([x, z], i) => {
      const c = this.police.cars[i];
      if (!c) return;
      c.x = x; c.z = z; c.speed = 0;
      c.mesh.position.set(x, 0, z);
    });
  }
  setMissionBeacon(key) {
    for (const b of Object.values(this.city.beacons)) b.visible = false;
    if (this.city.beacons[key]) this.city.beacons[key].visible = true;
  }

  // ---- car enter/exit ----
  enterCar(car) {
    this.traffic.steal(car);
    this.playerCar = car;
    this.mode = 'car';
    this.player.mode = 'car';
    this.player.person.group.visible = false;
    this.partner.person.group.visible = false;
    this.police.addStars(1, 'theft');
  }
  exitCar() {
    const car = this.playerCar;
    if (!car) return;
    car.speed = 0;
    this.traffic.release(car);
    this.playerCar = null;
    this.mode = 'foot';
    this.player.mode = 'foot';
    const a = car.angle;
    this.player.x = car.x + Math.cos(a) * 2.5;
    this.player.z = car.z - Math.sin(a) * 2.5;
    [this.player.x, this.player.z] = clampToWorld(this.player.x, this.player.z);
    this.player.angle = a;
    this.player.person.group.visible = true;
    this.player.updateMesh();
    this.placePartnerNextToPlayer();
  }

  damagePlayer(n) {
    if (this.state !== 'playing') return;
    this.player.health -= n;
    this.lastDamageAt = this.time;
    if (this.player.health <= 0) {
      this.player.health = 0;
      this.gameOver('You went down in Bahía Sol. The city keeps moving without you.');
    }
  }

  gameOver(text) {
    this.state = 'over';
    this.doc.getElementById('over-title').textContent = 'GAME OVER';
    this.doc.getElementById('over-text').textContent = text;
    this.ui.show('over', true);
    this.audio.crash();
    this.saveGame();
  }
  busted() {
    this.gameOver('Busted. The Bahía Sol police impounded your ride and your night.');
  }

  // ---- save/load ----
  saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        money: this.money, completed: this.missions.completed, characterId: this.characterId,
      }));
    } catch { /* storage off: the save lasts this visit only */ }
  }
  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.money === 'number') this.money = s.money;
      if (typeof s.characterId === 'string' && DUO[s.characterId]) this.setCharacter(s.characterId);
      if (typeof s.completed === 'number' && s.completed > 0) this.missions.setProgress(s.completed);
    } catch { /* corrupt save: start fresh */ }
  }

  // ---- collision ----
  resolveCollision(x, z, r) {
    for (const b of this.boxes) {
      const nx = Math.max(b.minX - r, Math.min(x, b.maxX + r));
      const nz = Math.max(b.minZ - r, Math.min(z, b.maxZ + r));
      const dx = x - nx, dz = z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r || d2 === 0) continue;
      const d = Math.sqrt(d2);
      x = nx + (dx / d) * r;
      z = nz + (dz / d) * r;
    }
    return [x, z];
  }

  // ---- the simulation step (also driven directly by the play-test) ----
  update(dt, input) {
    this.time += dt;
    this.city.update(this.time);
    if (this.state !== 'playing') return;
    const inp = input || {};
    const p = this.player;

    if (inp.pause) {
      this.state = 'paused';
      this.ui.show('pause', true);
      return;
    }
    if (inp.accept) this.acceptMission();

    // Camera orbit from the live mouse drag (no-op for synthetic input).
    const cam = this.input.consumeCamera();
    this.camYaw -= cam.yaw;
    this.camPitch = Math.max(0.06, Math.min(0.9, this.camPitch + cam.pitch));

    const fwdX = -Math.sin(this.camYaw), fwdZ = -Math.cos(this.camYaw);
    const rightX = -fwdZ, rightZ = fwdX;

    if (this.mode === 'foot') {
      const speed = inp.run ? TUNING.runSpeed : TUNING.walkSpeed;
      const mx = fwdX * (inp.forward || 0) + rightX * (inp.strafe || 0);
      const mz = fwdZ * (inp.forward || 0) + rightZ * (inp.strafe || 0);
      const ml = Math.hypot(mx, mz);
      if (ml > 0.01) {
        const nx = p.x + (mx / ml) * speed * dt;
        const nz = p.z + (mz / ml) * speed * dt;
        [p.x, p.z] = this.resolveCollision(nx, nz, 0.5);
        [p.x, p.z] = clampToWorld(p.x, p.z);
        p.angle = Math.atan2(mx, mz);
        p.speed = speed;
        p.person.setPose('walk', dt, true);
      } else {
        p.speed = 0;
        p.person.setPose('idle', dt, false);
      }
      // Knockback from police rams.
      p.x += (p.vx || 0) * dt; p.z += (p.vz || 0) * dt;
      p.vx = (p.vx || 0) * 0.9; p.vz = (p.vz || 0) * 0.9;
      p.person.group.position.set(p.x, p.person.bob || 0, p.z);
      p.person.group.rotation.y = p.angle;
      if (inp.enter) {
        const car = this.traffic.nearestCar(p.x, p.z, 4.5);
        if (car) this.enterCar(car);
      }
      if (inp.punch) {
        p.person.setPose('punch', dt, false);
        this.audio.blip(180, 0.08, 'square', 0.15);
        for (const ped of this.traffic.peds) {
          if (Math.hypot(ped.x - p.x, ped.z - p.z) < 2.5) {
            ped.x += Math.sin(p.angle) * 4; ped.z += Math.cos(p.angle) * 4;
            this.police.addStars(1, 'assault');
          }
        }
      }
    } else if (this.playerCar) {
      const car = this.playerCar;
      const fwd = inp.forward || 0;
      if (fwd > 0) car.speed += TUNING.carAccel * dt;
      else if (fwd < 0) car.speed -= (car.speed > 0.5 ? TUNING.carBrake : TUNING.carAccel * 0.6) * dt;
      else car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 8 * dt);
      car.speed = Math.max(-TUNING.carReverse, Math.min(TUNING.carMax, car.speed));
      car.angle += (inp.steer || 0) * TUNING.carTurn * dt * Math.min(1, Math.abs(car.speed) / 8) * Math.sign(car.speed || 1);
      const nx = car.x + Math.sin(car.angle) * car.speed * dt;
      const nz = car.z + Math.cos(car.angle) * car.speed * dt;
      const [rx, rz] = this.resolveCollision(nx, nz, 1.6);
      if (rx !== nx || rz !== nz) {
        if (Math.abs(car.speed) > 12) { this.audio.crash(); this.damagePlayer(4); }
        car.speed *= 0.4;
      }
      car.x = rx; car.z = rz;
      [car.x, car.z] = clampToWorld(car.x, car.z);
      car.mesh.position.set(car.x, 0, car.z);
      car.mesh.rotation.y = car.angle;
      for (const w of car.wheels) w.rotation.x += (car.speed * dt) / 0.36;
      p.x = car.x; p.z = car.z; p.angle = car.angle; p.speed = Math.abs(car.speed);
      if (inp.enter) this.exitCar();
    }

    // World systems.
    this.traffic.update(dt, p);
    this.police.update(dt, p, () => this.busted());
    const res = this.missions.update(dt, { x: p.x, z: p.z, mode: this.mode }, this.police.stars);
    if (res) {
      if (res.result === 'completed') {
        this.money += res.payout;
        this.audio.cash();
        this.saveGame();
      } else {
        this.audio.blip(140, 0.3, 'sawtooth', 0.2);
      }
    }
    // Partner follows on foot.
    if (this.mode === 'foot' && this.partner.person.group.visible) {
      const tx = p.x - Math.sin(p.angle) * 2.2 + Math.cos(p.angle) * 1.2;
      const tz = p.z - Math.cos(p.angle) * 2.2 - Math.sin(p.angle) * 1.2;
      const dx = tx - this.partner.x, dz = tz - this.partner.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.4) {
        const sp = Math.min(7, d * 2);
        this.partner.x += (dx / d) * sp * dt;
        this.partner.z += (dz / d) * sp * dt;
        this.partner.person.group.rotation.y = Math.atan2(dx, dz);
        this.partner.person.setPose('walk', dt, true);
      } else {
        this.partner.person.setPose('idle', dt, false);
      }
      this.partner.person.group.position.set(this.partner.x, 0, this.partner.z);
    }
    // Slow health regen after 5 s without damage.
    if (this.time - this.lastDamageAt > 5 && p.health > 0) {
      p.health = Math.min(TUNING.playerHealth, p.health + 2 * dt);
    }
    this.hud.update(this);
    this.audio.update(dt, { speed: p.speed, wanted: this.police.stars, driving: this.mode === 'car' });
  }

  updateCamera() {
    const dist = this.camDist || (this.mode === 'car' ? 11.5 : 7.5);
    const target = this.mode === 'car' && this.playerCar
      ? { x: this.playerCar.x, z: this.playerCar.z, y: 1.4 }
      : { x: this.player.x, z: this.player.z, y: 1.6 };
    const cx = target.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist;
    const cz = target.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist;
    const cy = target.y + Math.sin(this.camPitch) * dist + 1.2;
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(target.x, target.y, target.z);
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    const pr = this.poster;
    pr.width = window.innerWidth; pr.height = window.innerHeight;
    if (this.state === 'menu') this.drawPoster();
  }

  loop() {
    let last = performance.now();
    let frames = 0;
    const step = (now) => {
      requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (this.state === 'playing' || this.state === 'paused') {
        if (this.state === 'playing') this.update(dt, this.input.state());
        this.input.endFrame();
      }
      if (this.state !== 'menu') {
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
      }
      frames += 1;
      if (this.shot && frames >= SHOT_FRAMES) window.__shotReady = true;
    };
    requestAnimationFrame(step);
  }

  runShot() {
    stageShot(this, this.shot);
    this.loop();
  }
}
