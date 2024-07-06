class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.backgroundColor = null;
        
    }

    preload() {
        // Cargar los assets necesarios para el menú
        this.load.image('button', 'tiles/boton.png');
    }

    create() {
        // Agregar el título del menú
        this.cameras.main.setBackgroundColor('#4c2882');
        this.add.text(this.scale.width / 2, this.scale.height / 4, 'Castigo o Aventura?', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Agregar el botón para iniciar el juego
        const startButton = this.add.image(this.scale.width / 2, this.scale.height / 1.7, 'button').setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('game');
        });
    }
}

export default MenuScene;