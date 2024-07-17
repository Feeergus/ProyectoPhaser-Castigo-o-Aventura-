class ScoreboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ScoreboardScene' });
    }

    preload() {
        // Aquí puedes precargar assets si es necesario
    }

    create() {
        this.add.text(this.scale.width / 2, this.scale.height / 8, 'Tabla de Puntajes:', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        let storeScore = localStorage.getItem('scores');
        this.scores = storeScore ? JSON.parse(storeScore) : [];

        this.displayScores();
    }

    displayScores() {
        const padding = 20;
        const startX = 50;
        const startY = 50;
        const textStyle = { font: '16px Arial', fill: '#ffffff' };

        this.scores.forEach((score, index) => {
            this.add.text(startX, startY + index * padding, `${index + 1}. ${score}`, textStyle);
        });

        // Agregar desplazamiento si hay muchos puntajes para que quepan en la pantalla
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > startY && pointer.y < startY + (this.scores.length * padding)) {
                this.cameras.main.scrollY = pointer.y - startY;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollY += (pointer.y - this.input.prevPointerPosition.y);
            }
        });

        this.time.delayedCall(5000, () => {
            this.scene.start('MenuScene');
          });
    }
}

export default ScoreboardScene;

