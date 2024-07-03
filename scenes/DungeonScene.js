export default class Game extends Phaser.Scene {

    constructor() {
      super("game");
      this.score = null;
      this.shaderTime = 0;
      this.purpleLightShader = null;
      this.attackHitbox = null;
      this.attackKey = null;
      this.coinsGroup = null;
      this.enemysGroup = null;
      this.LayerArriba = null;
    }
  
    preload() {
      this.load.tilemapTiledJSON("Mazmorra", "tiles/8bits.json");
      this.load.image("tiles", "tiles/tileset(pruebaFinal).png");
      this.load.atlas("faune", "character/spritesheet (4).png", "character/spritesheet (3).json");
      this.load.atlas("lizard", "enemy/lizard.png", "enemy/lizard.json");
      this.load.atlas("coins", "coins/spritesheet.png", "coins/spritesheet.json");
      this.load.image("espada", "character/espada1.png");
      this.load.glsl("purpleLightShader", "shaders/purpleLight.glsl");
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  
    create() {
      this.score = 0;

      this.attackHitbox = this.add.rectangle(0, 0, 16, 16);
      this.attackHitbox.setVisible(false);
      this.physics.world.enable(this.attackHitbox);
  
      this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.attackKey.on('down', () => {
        this.activateHitbox();
        this.time.delayedCall(200, () => { this.deactivateHitbox(); }, [], this);
      });
  
      const map = this.make.tilemap({ key: "Mazmorra" });
      const tiles = map.addTilesetImage("tileset(pruebaFinal)", "tiles");
  
      const LayerAbajo = map.createLayer("Piso", tiles, 0, 0);
      this.LayerArriba = map.createLayer("Paredes", tiles, 0, 0);
      this.LayerArriba.setCollisionByProperty({ colliders: true });
  
      this.zonaTPTiles = map.filterTiles(tile => tile.properties.zonaTP);
      this.zonaTPTiles.forEach(tile => {
        const { x, y, width, height } = tile.getCenter();
        const purpleLight = this.add.shader("purpleLightShader", x, y, width, height);
        purpleLight.setOrigin(0.5, 0.5);
  
        purpleLight.setUniforms({
          time: 0,
          resolution: { x: this.game.config.width, y: this.game.config.height }
        });
  
        this.purpleLightShader = purpleLight;
      });
  
      this.faune = this.physics.add.sprite(108, 128, "faune", "knight-idle.png");
      this.faune.body.setSize(this.faune.width * 0.4, this.faune.height * 0.6);
      this.faune.setScale(0.7)
      this.physics.add.collider(this.faune, this.LayerArriba);
      this.cameras.main.startFollow(this.faune, true);
  
      this.createEnemies(map);
      this.physics.add.collider(this.enemysGroup, this.LayerArriba);
      this.physics.add.collider(this.faune, this.enemysGroup, this.handlePlayerEnemyCollision, null, this);
  
      this.scoreText = this.add.text(16, 16, 'Puntuación: 0', { fontSize: '20px', fill: '#fff' });
      this.scoreText.setScrollFactor(0);
  
      this.createAnimations();
  
      this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: this.seguimiento,
        callbackScope: this
      });
  
      this.createCoins(map);
  
      this.teleportZones = [];
      this.appearZones = [];
  
      map.layers.forEach(layer => {
        layer.data.forEach(row => {
          row.forEach(tile => {
            if (tile?.properties?.zonaTP) {
              this.teleportZones.push(tile);
            }
            if (tile?.properties?.apareceTP) {
              this.appearZones.push(tile);
            }
          });
        });
      });
  
      this.physics.add.overlap(this.faune, LayerAbajo, this.handleTeleport, null, this);
  
      // Ajustar la posición inicial de la hitbox cerca del jugador
      this.updateHitboxPosition();
    }
  
    createEnemies(map) {
      this.enemysGroup = this.physics.add.group();
      const enemysLayer = map.getObjectLayer('enemys');
      if (enemysLayer) {
        const enemysObjects = enemysLayer.objects;
        enemysObjects.forEach(enemyObj => {
          const enemy = this.enemysGroup.create(enemyObj.x, enemyObj.y, "lizard", "lizard_m_idle_anim_f0.png");
          enemy.body.setSize(enemy.width * 0.9, enemy.height * 0.6);
        });
      }
      this.physics.add.collider(this.faune, this.enemysGroup, this.handlePlayerEnemyCollision, null, this);
      this.physics.add.collider(this.enemysGroup, this.LayerArriba);
    }
  
    createCoins(map) {
      const coins = map.getObjectLayer("elements")?.objects;
      this.coinsGroup = this.physics.add.group();
      coins.forEach(coin => {
        const newCoin = this.coinsGroup.create(coin.x, coin.y, "coins", 0);
      });
  
      this.physics.add.collider(this.faune, this.coinsGroup, this.collectCoin, null, this);
  
      this.anims.create({
        key: "money",
        frames: this.anims.generateFrameNames("coins", { start: 0, end: 5, prefix: "pixil-frame-", suffix: ".png"}),
        repeat: -1
      });
  
      this.coinsGroup.children.iterate(coin => {
        coin.anims.play("money", true);
      });
    }
  
    handleTeleport(player, tile) {
      if (tile.properties.zonaTP && this.appearZones.length > 0) {
        const randomIndex = Phaser.Math.Between(0, this.appearZones.length - 1);
        const targetZone = this.appearZones[randomIndex];
        player.setPosition(targetZone.pixelX, targetZone.pixelY);
  
        // Regenerar enemigos y monedas
        this.resetEnemies();
        this.resetCoins();
      }
    }
  
    resetEnemies() {
      this.enemysGroup.clear(true, true);
      const map = this.make.tilemap({ key: "Mazmorra" });
      this.createEnemies(map);
    }
  
    resetCoins() {
      this.coinsGroup.clear(true, true);
      const map = this.make.tilemap({ key: "Mazmorra" });
      this.createCoins(map);
    }
  
    seguimiento() {
      const player = this.faune;
  
      this.enemysGroup.children.iterate(enemy => {
        if (enemy.active) {
          const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
          this.physics.velocityFromRotation(angleToPlayer, 50, enemy.body.velocity);
        }
      });
    }
  
    update() {
      const speed = 100;
      if (!this.cursors || !this.faune) {
        return;
      }
  
      if (this.cursors.left?.isDown) {
        this.faune.setVelocity(-speed, 0);
        this.faune.anims.play("faune-run-sideR", true);
        
      } else if (this.cursors.right?.isDown) {
        this.faune.setVelocity(speed, 0);
        this.faune.anims.play("faune-run-side", true);
        
      } else if (this.cursors.up?.isDown) {
        this.faune.setVelocity(0, -speed);
        this.faune.anims.play("faune-run-up", true);
      } else if (this.cursors.down?.isDown) {
        this.faune.setVelocity(0, speed);
        this.faune.anims.play("faune-run-down", true);
      } else {
        this.faune.setVelocity(0, 0);
        const currentDirection = this.faune.anims.currentAnim?.key;
        if (currentDirection) {
          const direction = currentDirection.split("-")[2];
          this.faune.anims.play(`faune-idle-${direction}`, true);
        }
      }
  
      if (this.purpleLightShader) {
        this.shaderTime += this.game.loop.delta;
        this.purpleLightShader.setUniform('time', this.shaderTime);
      }
  
      // Actualizar la posición de la hitbox para que siga al jugador
      this.updateHitboxPosition();
  
      if (this.attackHitbox.visible) {
        this.physics.world.overlap(this.attackHitbox, this.enemysGroup, this.handleEnemyCollision, null, this);
      }
    }
  
    collectCoin(player, coin) {
      coin.disableBody(true, true); 
      this.score += 10;
      this.scoreText.setText(`Puntuacion: ${this.score}`);
    }
  
    activateHitbox() {
      this.attackHitbox.setVisible(true);
      this.updateHitboxPosition();
    
      switch (this.faune.anims.currentAnim.key) {
        case 'faune-run-up':
        case 'faune-idle-up':
          this.attackHitbox.anims.play('hitbox-up', true);
          break;
        case 'faune-run-down':
        case 'faune-idle-down':
          this.attackHitbox.anims.play('hitbox-down', true);
          break;
        default:
          this.attackHitbox.anims.play('hitbox-side', true);
          break;
      }
    
      // Desactivar la hitbox después de un breve período de tiempo
      this.time.delayedCall(200, () => {
        this.attackHitbox.setVisible(false);
      });
    }
  
    deactivateHitbox() {
      this.attackHitbox.setVisible(false);
    }
  
    updateHitboxPosition() {
      const offsetX = 16;
      const offsetY = 0;
  
      switch (this.faune.anims.currentAnim.key) {
        case 'faune-run-up':
        case 'faune-idle-up':
          this.attackHitbox.setPosition(this.faune.x, this.faune.y - offsetX);
          this.attackHitbox.setAngle(-90);
          break;
        case 'faune-run-down':
        case 'faune-idle-down':
          this.attackHitbox.setPosition(this.faune.x, this.faune.y + offsetX);
          this.attackHitbox.setAngle(90);
          break;
        default:
          if (this.faune.anims.currentAnim.key === "faune-run-side") {
            this.attackHitbox.setPosition(this.faune.x + offsetX, this.faune.y + offsetY);
            this.attackHitbox.setAngle(0);
          } else {
            this.attackHitbox.setPosition(this.faune.x - offsetX, this.faune.y + offsetY);
            this.attackHitbox.setAngle(0);
          }
          break;
      }
    }
  
    handleEnemyCollision(hitbox, enemy) {
  
  
      if(this.attackKey.isDown){
        // Crear una animación de espada en la posición del jugador
        const swordAnim = this.add.sprite(this.faune.x, this.faune.y, 'espada');
      
        // Reproducir la animación de la hitbox correspondiente
        switch (this.faune.anims.currentAnim.key) {
            case 'faune-run-up':
            case 'faune-idle-up':
              swordAnim.play('hitbox-up', true);
              enemy.destroy();
              break;
            case 'faune-run-down':
            case 'faune-idle-down':
              swordAnim.play('hitbox-down', true);
              enemy.destroy();
              break;
            default:
              swordAnim.play('hitbox-side', true);
              enemy.destroy();
              break;
        }
      
        // Destruir la animación después de un tiempo
        this.time.delayedCall(200, () => {
          swordAnim.destroy();
        });
        
      }
      
    }
  
    handlePlayerEnemyCollision(player, enemy) {
      this.faune.anims.play('faune-hit', true);
      this.cursors = null;
      this.faune.body.enable = false;
      this.time.delayedCall(3000, () => {
        this.scene.start('gameover');
      });
    }
  
    createAnimations() {
      this.anims.create({
        key: "faune-idle-down",
        frames: [{ key: "faune", frame: "knight-idle.png"}]
      });
  
      this.anims.create({
        key: "faune-idle-up",
        frames: [{ key: "faune", frame: "knight-run-up-1.png"}]
      });
  
      this.anims.create({
        key: "faune-idle-side",
        frames: [{ key: "faune", frame: "knight-run-side-1.png"}]
      });
  
      this.anims.create({
        key: "faune-idle-sideR",
        frames: [{ key: "faune", frame: "knight-run-sideR-1.png"}]
      });
  
      this.anims.create({
        key: "faune-hit",
        frames: [{ key: "faune", frame: "knight-hit.png" }]
      });
  
      this.anims.create({
        key: "faune-run-down",
        frames: this.anims.generateFrameNames("faune", { start: 1, end: 6, prefix: "knight-run-below-", suffix: ".png"}),
        repeat: -1,
        frameRate: 15
      });
  
      this.anims.create({
        key: "faune-run-up",
        frames: this.anims.generateFrameNames("faune", { start: 1, end: 6, prefix: "knight-run-up-", suffix: ".png"}),
        repeat: -1,
        frameRate: 15
      });
  
      this.anims.create({
        key: "faune-run-side",
        frames: this.anims.generateFrameNames("faune", { start: 1, end: 6, prefix: "knight-run-side-", suffix: ".png"}),
        repeat: -1,
        frameRate: 15
      });
  
      this.anims.create({
        key: "faune-run-sideR",
        frames: this.anims.generateFrameNames("faune", { start: 1, end: 6, prefix: "knight-run-sideR-", suffix: ".png"}),
        repeat: -1,
        frameRate: 15
      });
  
      
  
      
  
      this.faune.play("faune-idle-down");
    }
  
  }
  