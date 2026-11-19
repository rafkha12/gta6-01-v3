// Keyboard + mouse-drag camera. The live input object has the same shape
// the simulation step takes, so the playtest can drive the game directly.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let yawDelta = 0, pitchDelta = 0;
  let dragging = false, lastX = 0, lastY = 0;

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys.add(e.code);
    pressed.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yawDelta += (e.clientX - lastX) * 0.005;
    pitchDelta += (e.clientY - lastY) * 0.004;
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  function state() {
    const fwd = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const strafe = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    return {
      forward: fwd, strafe,
      steer: strafe,
      run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
      jump: keys.has('Space'),
      shoot: false,
      punch: pressed.has('KeyF'),
      enter: pressed.has('KeyE'),
      pause: pressed.has('KeyP') || pressed.has('Escape'),
      accept: pressed.has('KeyM'),
    };
  }
  function endFrame() {
    pressed.clear();
    yawDelta = 0; pitchDelta = 0;
  }
  function consumeCamera() {
    const d = { yaw: yawDelta, pitch: pitchDelta };
    yawDelta = 0; pitchDelta = 0;
    return d;
  }
  return { keys, state, endFrame, consumeCamera };
}
