// Procedural WebAudio: engine hum, police siren, a warm ambient pad, and
// short blips for pickups and cash. No audio files. Starts on first gesture.
export function createAudio() {
  let ctx = null;
  let engineOsc = null, engineGain = null, engineFilter = null;
  let sirenOsc = null, sirenGain = null;
  let padGain = null;
  let started = false;

  function ensure() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return; }
    // Engine: a sawtooth through a lowpass, pitch follows speed.
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 55;
    engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass'; engineFilter.frequency.value = 320;
    engineGain = ctx.createGain(); engineGain.gain.value = 0;
    engineOsc.connect(engineFilter).connect(engineGain).connect(ctx.destination);
    engineOsc.start();
    // Siren: a square wave that alternates two tones.
    sirenOsc = ctx.createOscillator();
    sirenOsc.type = 'square'; sirenOsc.frequency.value = 750;
    sirenGain = ctx.createGain(); sirenGain.gain.value = 0;
    sirenOsc.connect(sirenGain).connect(ctx.destination);
    sirenOsc.start();
    // Ambient pad: two detuned triangles, very quiet.
    padGain = ctx.createGain(); padGain.gain.value = 0.035;
    for (const f of [110, 164.8, 220]) {
      const o = ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = f;
      o.connect(padGain).connect(ctx.destination);
      o.start();
    }
  }
  function start() {
    ensure();
    if (!ctx || started) return;
    started = true;
    if (ctx.state === 'suspended') ctx.resume();
  }
  function blip(freq, dur = 0.12, type = 'sine', vol = 0.2) {
    if (!ctx || !started) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  }
  function cash() { blip(880, 0.1); setTimeout(() => blip(1320, 0.16), 90); }
  function crash() { blip(90, 0.25, 'sawtooth', 0.3); }

  let t = 0;
  function update(dt, { speed, wanted, driving }) {
    if (!ctx || !started) return;
    t += dt;
    if (engineGain) {
      engineGain.gain.value = driving ? 0.05 + Math.min(0.06, Math.abs(speed) * 0.0015) : 0.015;
      engineOsc.frequency.value = 50 + Math.abs(speed) * 2.2;
    }
    if (sirenGain) {
      sirenGain.gain.value = wanted > 0 ? 0.035 : 0;
      sirenOsc.frequency.value = (Math.floor(t * 2) % 2 === 0) ? 750 : 950;
    }
  }
  return { start, update, blip, cash, crash };
}
