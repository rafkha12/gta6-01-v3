// Deterministic screenshot scenes (?shot=<name>&seed=1). Each one stages a
// fixed moment — no RNG dependence — so the screenshots are reproducible.
export function stageShot(game, name) {
  if (name === 'title') {
    game.showTitle(true);
    return;
  }
  if (name === 'drive') {
    // Mara driving west along the beach road, into the sunset.
    game.startGame('mara');
    game.placePlayerInCarAt(60, 140, -Math.PI / 2, 24);
    game.placeTrafficAhead([[20, 140, 12], [-30, 140, 12]]);
    game.setCamera(Math.PI / 2, 0.22, 12);
    return;
  }
  if (name === 'chase') {
    // Three-star dusk pursuit on the open beach road (z=128 has no palms,
    // so nothing blocks the view).
    game.startGame('mara');
    game.placePlayerInCarAt(60, 128, -Math.PI / 2, 20);
    game.police.addStars(3, 'shot');
    game.placePoliceBehind([[82, 128, 26], [96, 124, 26]]);
    game.setCamera(Math.PI / 2, 0.25, 13);
    return;
  }
  if (name === 'mission') {
    // The duo on foot, close to camera, police closing in, the NEON BAR
    // sign and the sunset ahead.
    game.startGame('mara');
    game.teleportPlayer(-60, 44, -Math.PI / 2);
    game.placePartnerNextToPlayer();
    game.police.addStars(4, 'shot');
    game.placePoliceAt([[-72, 38], [-50, 52]]);
    game.missions.offer();
    game.setMissionBeacon('neonBar');
    game.setCamera(Math.PI / 2, 0.18, 6.5);
    return;
  }
  game.showTitle(true);
}
