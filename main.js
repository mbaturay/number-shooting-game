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
        this.speed = 0.7; // much slower speed
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

let fallingNumbers = [new FallingNumber()];
let selectedNumber = 1;
let misses = 0;

function spawnNewNumber() {
    fallingNumbers.push(new FallingNumber());
}

function removeNumber(index) {
    fallingNumbers.splice(index, 1);
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
        // Fire at the lowest matching number
        let found = false;
        for (let i = 0; i < fallingNumbers.length; i++) {
            if (fallingNumbers[i].value === selectedNumber) {
                removeNumber(i);
                found = true;
                break;
            }
        }
        if (!found) {
            // Optionally, penalize for wrong fire
        }
    }
});

let spawnTimer = 0;
let spawnInterval = 120; // frames (about 2 seconds at 60fps)

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update and draw all falling numbers
    for (let i = fallingNumbers.length - 1; i >= 0; i--) {
        const num = fallingNumbers[i];
        num.update();
        num.draw(ctx);
        if (num.y > GAME_HEIGHT + 40) {
            misses++;
            removeNumber(i);
        }
    }

    // Draw selected number label
    ctx.font = 'bold 32px Montserrat, Arial Black, Arial, sans-serif';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'left';
    ctx.fillText(`Selected: ${selectedNumber}`, 10, GAME_HEIGHT - 40);
    ctx.font = 'bold 20px Montserrat, Arial Black, Arial, sans-serif';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Misses: ${misses}`, 10, 30);

    // Spawn new number at interval
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        spawnNewNumber();
        spawnTimer = 0;
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
