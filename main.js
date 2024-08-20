import MenuScene from './scenes/MenuScene.js';
import DungeonScene from './scenes/DungeonScene.js';
import Derrota from './scenes/Derrota.js'
import ScoreboardScene from './scenes/ScoreBoard.js';

// Create a new Phaser game instance

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 330,
  backgroundColor: "00000",
  parent: "game-container",
  pixelArt: true,
  scene: [MenuScene, DungeonScene, ScoreboardScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
        debug: false
    },
  },
  scale: {
    zoom: 2.25
  }
};

const game = new Phaser.Game(config);
