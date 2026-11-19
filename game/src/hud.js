// HUD: DOM readouts plus a 2D-canvas minimap (roads, beach, player arrow,
// police dots, mission target).
import { WORLD } from './config.js';

export function createHud(doc) {
  const el = (id) => doc.getElementById(id);
  const money = el('hud-money');
  const healthFill = el('hud-health-fill');
  const stars = el('hud-stars');
  const charLabel = el('hud-char');
  const speed = el('hud-speed');
  const card = el('mission-card');
  const cardTitle = el('mission-title');
  const cardText = el('mission-text');
  const cardTimer = el('mission-timer');
  const acceptBtn = el('btn-mission-accept');
  const minimap = el('hud-minimap');
  const mctx = minimap.getContext('2d');
  const S = 180; // minimap px

  function drawMinimap(player, police, target, traffic) {
    const k = S / (WORLD.size * 2);
    const X = (x) => (x + WORLD.size) * k;
    const Z = (z) => (z + WORLD.size) * k;
    mctx.fillStyle = '#1c1430';
    mctx.fillRect(0, 0, S, S);
    // Water + beach.
    mctx.fillStyle = '#2a3a6e';
    mctx.fillRect(0, Z(WORLD.waterZ), S, S - Z(WORLD.waterZ));
    mctx.fillStyle = '#8a6a4a';
    mctx.fillRect(0, Z(WORLD.beachZ), S, Z(WORLD.waterZ) - Z(WORLD.beachZ));
    // Roads.
    mctx.strokeStyle = '#5a4a72'; mctx.lineWidth = 5;
    for (let i = -5; i <= 5; i += 1) {
      const c = i * 44;
      mctx.beginPath(); mctx.moveTo(X(c), 0); mctx.lineTo(X(c), S); mctx.stroke();
      mctx.beginPath(); mctx.moveTo(0, Z(c)); mctx.lineTo(S, Z(c)); mctx.stroke();
    }
    // Mission target.
    if (target) {
      mctx.fillStyle = '#ffd27d';
      mctx.beginPath();
      mctx.moveTo(X(target.x), Z(target.z) - 7); mctx.lineTo(X(target.x) + 6, Z(target.z));
      mctx.lineTo(X(target.x), Z(target.z) + 7); mctx.lineTo(X(target.x) - 6, Z(target.z));
      mctx.closePath(); mctx.fill();
    }
    // Traffic dots.
    mctx.fillStyle = 'rgba(200,200,220,0.6)';
    for (const c of traffic.cars) mctx.fillRect(X(c.x) - 1, Z(c.z) - 1, 2, 2);
    // Police dots.
    mctx.fillStyle = '#3a7bff';
    for (const c of police.cars) {
      mctx.beginPath(); mctx.arc(X(c.x), Z(c.z), 3, 0, Math.PI * 2); mctx.fill();
    }
    // Player arrow.
    const px = X(player.x), pz = Z(player.z);
    mctx.save();
    mctx.translate(px, pz); mctx.rotate(player.angle);
    mctx.fillStyle = '#ffffff';
    mctx.beginPath(); mctx.moveTo(0, -7); mctx.lineTo(5, 6); mctx.lineTo(-5, 6); mctx.closePath(); mctx.fill();
    mctx.restore();
  }

  return {
    update(game) {
      money.textContent = '$' + Math.floor(game.money);
      healthFill.style.width = Math.max(0, game.player.health) + '%';
      healthFill.style.background = game.player.health > 40 ? '#37d67a' : '#e04040';
      stars.textContent = '★'.repeat(game.police.stars) + '☆'.repeat(5 - game.police.stars);
      stars.style.color = game.police.stars > 0 ? '#ffd23a' : 'rgba(255,255,255,0.4)';
      charLabel.textContent = game.character.name + ' · ' + game.character.role;
      speed.textContent = game.mode === 'car' && game.playerCar
        ? Math.round(Math.abs(game.playerCar.speed) * 3.6) + ' km/h' : '';
      const m = game.missions;
      if (m.active) {
        card.style.display = 'block';
        acceptBtn.style.display = 'none';
        cardTitle.textContent = m.active.def.title + ' — $' + m.active.def.payout;
        const step = m.currentStep();
        cardText.textContent = step ? step.text : '';
        cardTimer.textContent = Math.max(0, Math.ceil(m.active.timer)) + 's';
      } else if (m.offered && m.index < 4) {
        card.style.display = 'block';
        acceptBtn.style.display = 'inline-block';
        const def = m.offer();
        cardTitle.textContent = 'JOB — ' + def.title + ' — $' + def.payout;
        cardText.textContent = def.brief;
        cardTimer.textContent = 'Press ACCEPT (or M) to take the job';
      } else {
        card.style.display = 'none';
      }
      drawMinimap(game.player, game.police, m.target(), game.traffic);
    },
  };
}
