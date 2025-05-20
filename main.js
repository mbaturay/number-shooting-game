// main.js
// Number Shooter basic game loop and falling number logic

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

function getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1;
}

class FallingNumber {
    constructor() {
        this.value = getRandomNumber();
        this.x = Math.random() * (GAME_WIDTH - 40) + 20; // keep inside canvas
        this.y = -40;
        this.speed = 2;
    }
    update() {
        this.y += this.speed;
    }
    draw(ctx) {
        ctx.font = 'bold 48px Montserrat, Arial Black, Arial, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(this.value, this.x, this.y);
    }
}

let fallingNumber = new FallingNumber();
let selectedNumber = 0;
let misses = 0;

function spawnNewNumber() {
    fallingNumber = new FallingNumber();
    // selectedNumber is no longer reset here
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftRight') {
        if (selectedNumber < 9) {
            selectedNumber++;
        } else {
            selectedNumber = 1;
        }
    } else if (e.code === 'ShiftLeft') {
        if (selectedNumber > 1) {
            selectedNumber--;
        } else {
            selectedNumber = 9;
        }
    } else if (e.code === 'Space') {
        if (selectedNumber === fallingNumber.value) {
            spawnNewNumber();
        } else {
            // Optionally, penalize for wrong fire
        }
    }
});

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    fallingNumber.update();
    fallingNumber.draw(ctx);

    // Draw selected number label
    ctx.font = 'bold 32px Montserrat, Arial Black, Arial, sans-serif';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'left';
    ctx.fillText(`Selected: ${selectedNumber}`, 10, GAME_HEIGHT - 40);
    ctx.font = 'bold 20px Montserrat, Arial Black, Arial, sans-serif';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Misses: ${misses}`, 10, 30);

    // Check if number reached the bottom
    if (fallingNumber.y > GAME_HEIGHT + 40) {
        misses++;
        spawnNewNumber();
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
