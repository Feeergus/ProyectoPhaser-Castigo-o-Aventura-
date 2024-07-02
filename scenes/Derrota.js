class GameOver extends Phaser.Scene{

    constructor()
    {
        super({key: "gameover"});
    }

    preload() {
        this.load.image('defeat', 'tiles/derrota.png');
    }
    
    create() {
        this.cameras.main.setBackgroundColor('#000000');
    
        const defeatText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 'Derrota', {
          fontSize: '64px',
          fill: '#ffffff'
        }).setOrigin(0.5);
    
        const defeatImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY + 50, 'defeat');
        defeatImage.setOrigin(0.5);

        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }

    
}

export default GameOver;