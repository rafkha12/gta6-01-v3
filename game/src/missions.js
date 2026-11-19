// Missions: a four-job story arc from Rosa Delmar. Each job is a list of
// steps — reach a target, or (escape steps) get the wanted level to zero.
// The HUD reads the active step for its job card.
import { MISSIONS } from './config.js';

export function createMissions(beacons) {
  let index = 0;          // which mission is offered next
  let active = null;      // { def, step, timer } while one runs
  let completed = 0;
  let offered = false;

  function offer() {
    if (index >= MISSIONS.length) return null;
    offered = true;
    return MISSIONS[index];
  }
  function accept() {
    if (index >= MISSIONS.length || active) return null;
    const def = MISSIONS[index];
    active = { def, step: 0, timer: def.time };
    offered = false;
    setBeacon();
    return active;
  }
  function currentStep() {
    return active ? active.def.steps[active.step] : null;
  }
  function setBeacon() {
    for (const b of Object.values(beacons)) b.visible = false;
    if (!active) return;
    const step = currentStep();
    if (!step || step.escape) return;
    const key = stepKey(step);
    if (beacons[key]) beacons[key].visible = true;
  }
  // Map a step's coordinates to the nearest named beacon.
  function stepKey(step) {
    const spots = { garage: [-66, -66], hotel: [88, 88], plaza: [0, 0], hideout: [110, 22], neonBar: [-88, 44], marina: [88, 132] };
    let best = 'plaza'; let bd = Infinity;
    for (const [k, [x, z]] of Object.entries(spots)) {
      const d = Math.hypot(step.x - x, step.z - z);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  // Returns 'completed' | 'failed' | null. game passes the live player.
  function update(dt, player, wanted) {
    if (!active) return null;
    active.timer -= dt;
    if (active.timer <= 0) {
      const def = active.def;
      active = null; setBeacon();
      return { result: 'failed', def };
    }
    const step = currentStep();
    if (step.escape) {
      if (wanted === 0) {
        active.step += 1;
        if (active.step >= active.def.steps.length) return finish();
        setBeacon();
      }
      return null;
    }
    const d = Math.hypot(player.x - step.x, player.z - step.z);
    const inCar = step.needCar ? player.mode === 'car' : true;
    if (d <= step.r && inCar) {
      active.step += 1;
      if (active.step >= active.def.steps.length) return finish();
      setBeacon();
    }
    return null;
  }
  function finish() {
    const def = active.def;
    active = null; completed += 1; index += 1; setBeacon();
    return { result: 'completed', def, payout: def.payout };
  }
  function cancel() { active = null; setBeacon(); }
  // Restore progress from a save: completed jobs are skipped.
  function setProgress(n) {
    completed = Math.max(0, Math.min(MISSIONS.length, n));
    index = completed;
  }

  return {
    get index() { return index; },
    get active() { return active; },
    get completed() { return completed; },
    get offered() { return offered; },
    offer, accept, update, cancel, currentStep, setProgress,
    target() {
      const s = currentStep();
      return s ? { x: s.x, z: s.z, text: s.text } : null;
    },
  };
}
