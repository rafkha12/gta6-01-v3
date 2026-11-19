// Deterministic screenshot scenes (?shot=<name>&seed=1). Each one stages a
// fixed moment — no RNG dependence — so the screenshots are reproducible.
export function stageShot(game, name) {
  if (name === 'title') {
    game.showTitle(true);
    return;
  }
  if (name === 'drive') {
    // Mara driving west along the beach road, into the sunset, job accepted.
    game.startGame('mara');
    game.placePlayerInCarAt(60, 132, -Math.PI / 2, 24);
    game.placeTrafficAhead([[20, 132, 12], [-30, 132, 12]]);
    game.acceptMission();
    game.setCamera(Math.PI / 2, 0.22, 12);
    return;
  }
  if (name === 'chase') {
    // Three-star dusk pursuit on the open beach road (z=128 has no palms,
    // so nothing blocks the view). Police flank ahead, closing in.
    game.startGame('mara');
    game.placePlayerInCarAt(60, 128, -Math.PI / 2, 20);
    game.startMission(1); // Sunset Heat — "lose the police"
    game.police.addStars(2, 'shot'); // +1 from the car theft = 3 stars
    game.placePoliceBehind([[38, 120, 26], [30, 136, 26]]);
    game.setCamera(Math.PI / 2, 0.25, 13);
    return;
  }
  if (name === 'mission') {
    // The Last Light: the duo on foot on the road, close to camera, police
    // closing in, the NEON BAR sign and the sunset ahead.
    game.startGame('mara');
    game.teleportPlayer(-66, 22, -Math.PI / 2);
    game.placePartnerNextToPlayer();
    game.startMission(3); // The Last Light
    game.police.addStars(4, 'shot');
    game.placePoliceAt([[-80, 18], [-78, 30]]);
    game.setMissionBeacon('neonBar');
    game.setCamera(Math.PI / 2, 0.2, 6);
    return;
  }
  game.showTitle(true);
}
