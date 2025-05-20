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

// --- Sound Effects ---
function playBeep(frequency = 440, duration = 100, type = 'square', volume = 0.1) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
    osc.onended = () => ctx.close();
}

let fallingNumbers = [];

let selectedNumber = 1;
let misses = 0;
let score = 0;
let lives = 3;
let level = 1;
let hitsThisLevel = 0;
let showLevelMessage = false;
let levelMessage = '';
let levelMessageTimer = 0;
const MAX_LEVEL = 10;
let gameOver = false;

function getFallSpeed() {
    // Start very slow and increase gently per level
    // Level 1: 0.3, Level 2: 0.4, Level 3: 0.5, ... Level 10: 1.2
    return 0.2 + level * 0.1;
}

function updateStats() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
}

function spawnNewNumber() {
    const num = new FallingNumber();
    // Always use getFallSpeed() for all numbers, including level 1
    num.speed = getFallSpeed();
    fallingNumbers.push(num);
}

function removeNumber(index) {
    fallingNumbers.splice(index, 1);
}

function showLevelUpMessage() {
    showLevelMessage = true;
    levelMessage = `LEVEL ${level} START!`;
    levelMessageTimer = 120; // ~2 seconds at 60fps
}

function resetGame() {
    fallingNumbers = [];
    selectedNumber = 1;
    misses = 0;
    score = 0;
    lives = 3;
    level = 1;
    hitsThisLevel = 0;
    showLevelMessage = false;
    levelMessage = '';
    levelMessageTimer = 0;
    gameOver = false;
    spawnTimer = 0;
    spawnInterval = getSpawnInterval();
    updateStats();
    showLevelUpMessage();
    fallingNumbers.push(new FallingNumber());
    fallingNumbers[0].speed = getFallSpeed();
}

function showPlayAgainButton() {
    let btn = document.getElementById('play-again-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'play-again-btn';
        btn.textContent = 'Play Again';
        btn.style.position = 'fixed'; // Use fixed to always be at the bottom
        btn.style.left = '50%';
        btn.style.bottom = '40px'; // 40px from the bottom
        btn.style.top = '';
        btn.style.transform = 'translateX(-50%)';
        btn.style.fontSize = '1.2em';
        btn.style.padding = '0.4em 1.5em';
        btn.style.background = '#222';
        btn.style.color = '#ff0';
        btn.style.border = '3px solid #ff0';
        btn.style.borderRadius = '10px';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = 20;
        document.body.appendChild(btn);
    }
    btn.textContent = 'Play Again';
    btn.style.display = 'block';
    btn.onclick = () => {
        btn.style.display = 'none';
        resetGame();
        requestAnimationFrame(gameLoop);
    };
}

function hidePlayAgainButton() {
    const btn = document.getElementById('play-again-btn');
    if (btn) btn.style.display = 'none';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'j' || e.key === 'J') {
        if (selectedNumber < 9) {
            selectedNumber++;
        } else {
            selectedNumber = 1;
        }
    } else if (e.key === 'd' || e.key === 'D') {
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
                score++;
                hitsThisLevel++;
                updateStats();
                playBeep(880, 80, 'square', 0.15); // Success beep
                // Level up logic
                if (hitsThisLevel >= 5 && level < MAX_LEVEL) {
                    level++;
                    hitsThisLevel = 0;
                    // Do NOT update speed for existing numbers
                    showLevelUpMessage();
                    spawnInterval = getSpawnInterval(); // update spawn interval on level up
                }
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
function getSpawnInterval() {
    // Start at 300 (5s), decrease by 25 frames per level, min 100 (about 1.6s)
    return Math.max(300 - (level - 1) * 25, 100);
}
let spawnInterval = getSpawnInterval();

function gameLoop() {
    if (gameOver) {
        // Draw Game Over message
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.font = 'bold 36px Montserrat, Arial Black, Arial, sans-serif'; // Smaller Game Over
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = 'bold 20px Montserrat, Arial Black, Arial, sans-serif'; // Smaller score
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
        showPlayAgainButton();
        return;
    }
    hidePlayAgainButton();

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update and draw all falling numbers
    for (let i = fallingNumbers.length - 1; i >= 0; i--) {
        const num = fallingNumbers[i];
        num.update();
        num.draw(ctx);
        if (num.y > GAME_HEIGHT + 40) {
            misses++;
            lives--;
            updateStats();
            playBeep(220, 180, 'sawtooth', 0.12); // Missed beep
            removeNumber(i);
            if (lives <= 0) {
                gameOver = true;
                updateStats();
                break;
            }
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
    ctx.fillStyle = '#0f0';
    ctx.fillText(`Level: ${level}`, 10, 60);
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Hits: ${hitsThisLevel}/5`, 10, 90);

    // Show level message
    if (showLevelMessage && levelMessageTimer > 0) {
        const msgDiv = document.getElementById('level-message');
        if (msgDiv) {
            msgDiv.textContent = levelMessage;
            msgDiv.style.display = 'block';
        }
        levelMessageTimer--;
        if (levelMessageTimer <= 0) {
            showLevelMessage = false;
            if (msgDiv) msgDiv.style.display = 'none';
        }
    }

    // Spawn new number at interval
    spawnTimer++;
    spawnInterval = getSpawnInterval();
    if (spawnTimer >= spawnInterval) {
        spawnNewNumber();
        spawnTimer = 0;
    }

    requestAnimationFrame(gameLoop);
}

// At the start of the game, spawn the first number with correct speed:
fallingNumbers.push(new FallingNumber());
fallingNumbers[0].speed = getFallSpeed();

updateStats();
showLevelUpMessage();
gameLoop();
