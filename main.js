// main.js
// Number Shooter basic game loop and falling number logic

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Original game dimensions (base design)
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

// Scaled dimensions that will be updated when the canvas resizes
let GAME_WIDTH_SCALED = GAME_WIDTH;
let GAME_HEIGHT_SCALED = GAME_HEIGHT;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Draw a light grid pattern for the game background
function drawGrid() {
    // Calculate grid size relative to canvas 
    const baseGridSize = canvas.width / 10; // We want about 10 cells across
    const gridSize = Math.max(20, Math.min(40, baseGridSize)); // Keep between 20-40px
    const lineWidth = Math.max(0.3, Math.min(0.5, canvas.width / 800)); // Thinner lines on smaller screens
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Very light white
    ctx.lineWidth = lineWidth;
    
    // Draw vertical lines
    for (let x = gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();
}

// Adjust canvas size based on screen size and height
function adjustCanvasSize() {
    const aspectRatio = GAME_HEIGHT / GAME_WIDTH;
    const availableHeight = window.innerHeight - 150; // Account for header, margins, controls
    let availableWidth = window.innerWidth;
    
    // On desktop, account for sidebar stats
    if (window.innerWidth >= 768) {
        availableWidth = Math.min(window.innerWidth - 350, 900); // Account for left and right sidebars
    } else {
        availableWidth = window.innerWidth * 0.95; // Use almost full width on mobile
    }
    
    // Determine width and height based on available space
    let newWidth, newHeight;
    
    // First try to fit by width
    newWidth = Math.min(availableWidth, 800); // Cap width at 800px for very large screens
    newHeight = newWidth * aspectRatio;
    
    // If height is too large, constrain by height instead
    if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = newHeight / aspectRatio;
    }
    
    // Set the canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Adjust game constants based on new dimensions
    // This ensures game coordinates scale with canvas size
    GAME_WIDTH_SCALED = newWidth;
    GAME_HEIGHT_SCALED = newHeight;
    
    // Update the drawing scale to maintain correct coordinates
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
}

// Call once at start
adjustCanvasSize();

// Handle window resize events
window.addEventListener('resize', function() {
    // Store current canvas dimensions for ratio calculation
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    // Resize the canvas
    adjustCanvasSize();
    
    // Calculate height ratio for vertical position adjustment
    const heightRatio = canvas.height / oldHeight;
    
    // Update positions of falling numbers
    fallingNumbers.forEach(num => {
        // Scale Y position proportionally to maintain visual appearance
        num.y = num.y * heightRatio;
        
        // X position is updated based on the stored relativeX value
        num.update();
        
        // Adjust the speed based on new canvas height
        num.speed = 0.7 * (canvas.height / GAME_HEIGHT);
    });
    
    // Redraw immediately if we're in the game
    if (!countdownActive && !waitingForContinue && !gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        fallingNumbers.forEach(num => num.draw(ctx));
    }
});

function getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1;
}

class FallingNumber {
    constructor() {
        this.value = getRandomNumber();
        
        // Calculate position in actual canvas coordinates instead of game coordinates
        // This ensures numbers stay within the visible area at any screen size
        const padding = canvas.width * 0.1; // 10% padding on each side
        this.x = padding + Math.random() * (canvas.width - padding * 2);
        this.y = -40 * (canvas.height / GAME_HEIGHT); // Scale starting position
        
        // Set speed based on canvas height for consistent gameplay across screen sizes
        this.speed = 0.7 * (canvas.height / GAME_HEIGHT);
        
        // Store the relative position (0-1 range) for better resizing
        this.relativeX = this.x / canvas.width;
    }    update() {
        this.y += this.speed;
        
        // Update x position when window is resized
        this.x = this.relativeX * canvas.width;
    }
    draw(ctx) {
        // Dynamic font size based on canvas dimensions
        const fontSize = Math.max(24, Math.min(48, canvas.width / 10));
        
        ctx.font = `bold ${fontSize}px Montserrat, Arial Black, Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(this.value, this.x, this.y);
    }
}

// --- Sound Effects ---
// Sound toggle
let soundEnabled = true;

// Initialize sound preference from localStorage
function initSoundPreference() {
    const storedPreference = localStorage.getItem('numberShooterSound');
    if (storedPreference !== null) {
        soundEnabled = storedPreference === 'true';
        document.getElementById('sound-toggle').checked = soundEnabled;
    }
}

// Sound toggle event handler
document.getElementById('sound-toggle').addEventListener('change', function() {
    soundEnabled = this.checked;
    localStorage.setItem('numberShooterSound', soundEnabled);
});

function playBeep(frequency = 440, duration = 100, type = 'square', volume = 0.1, ctxOverride = null) {
    if (!soundEnabled) return;
    
    const ctx = ctxOverride || new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
    osc.onended = () => { if (!ctxOverride) ctx.close(); };
}

function playMissSound() {
    if (!soundEnabled) return;
    
    // Arcade-style miss: three descending notes
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    playBeep(440, 80, 'sawtooth', 0.15, ctx);
    setTimeout(() => playBeep(330, 80, 'sawtooth', 0.13, ctx), 90);
    setTimeout(() => playBeep(220, 120, 'triangle', 0.11, ctx), 180);
    setTimeout(() => ctx.close(), 400);
}

let fallingNumbers = [];

let selectedNumber = 1;
let misses = 0;
let score = 0;
let highScore = 0;
let lives = 3;
let level = 1;
let hitsThisLevel = 0;
let showLevelMessage = false;
let levelMessage = '';
let levelMessageTimer = 0;
const MAX_LEVEL = 10;
let gameOver = false;

// Load high score from localStorage
function loadHighScore() {
    const storedHighScore = localStorage.getItem('numberShooterHighScore');
    if (storedHighScore !== null) {
        highScore = parseInt(storedHighScore);
        document.getElementById('high-score').textContent = `Best: ${highScore}`;
    }
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('numberShooterHighScore', highScore);
        document.getElementById('high-score').textContent = `Best: ${highScore}`;
        return true; // Return true if a new high score was achieved
    }
    return false;
}

let countdownActive = true;
let countdownValue = 3;
let countdownTimer = 60; // 1 second per count at 60fps

let showMissLabel = false;
let missLabelTimer = 0;
const MISS_LABEL_FRAMES = 45; // ~0.75s at 60fps

let waitingForContinue = false;
let pendingGameOver = false;

function startCountdown(callback) {
    countdownActive = true;
    countdownValue = 3;
    countdownTimer = 60;
    function countdownLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw grid on countdown screen too
        drawGrid();
        ctx.font = 'bold 64px Montserrat, Arial Black, Arial, sans-serif';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText(countdownValue > 0 ? countdownValue : 'GO!', canvas.width / 2, canvas.height / 2);
        if (countdownValue > 0) {
            countdownTimer--;
            if (countdownTimer <= 0) {
                countdownValue--;
                countdownTimer = 60;
            }
            requestAnimationFrame(countdownLoop);
        } else {
            setTimeout(() => {
                countdownActive = false;
                callback();
            }, 700); // Show 'GO!' for a short moment
        }
    }
    countdownLoop();
}

function startGameLoop() {
    countdownActive = false;
    requestAnimationFrame(gameLoop);
}

function getFallSpeed() {
    // Start very slow and increase gently per level
    // Level 1: 0.3, Level 2: 0.4, Level 3: 0.5, ... Level 10: 1.2
    // Base speed is constant regardless of screen size
    const baseSpeed = 0.2 + level * 0.1;
    return baseSpeed;
}

function updateStats() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    document.getElementById('level').textContent = `Level: ${level}`;
    document.getElementById('selected-number').textContent = selectedNumber;
    document.getElementById('high-score').textContent = `Best: ${highScore}`;
}

function spawnNewNumber() {
    const num = new FallingNumber();
    // Always use getFallSpeed() for all numbers, including level 1
    // And scale the speed based on canvas height
    num.speed = getFallSpeed() * (GAME_HEIGHT_SCALED / GAME_HEIGHT);
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
    waitingForContinue = false;
    pendingGameOver = false;
    spawnTimer = 0;
    spawnInterval = getSpawnInterval();
    
    // Make sure high score is loaded
    loadHighScore();
    
    updateStats();
    showLevelUpMessage();
    fallingNumbers.push(new FallingNumber());
    fallingNumbers[0].speed = getFallSpeed();
    countdownActive = true;
    startCountdown(startGameLoop);
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
    
    // Add feedback on whether a high score was achieved
    const wasHighScore = score >= highScore && score > 0;
    btn.textContent = wasHighScore ? 'Play Again!' : 'Play Again';
    
    if (wasHighScore) {
        btn.style.background = '#004'; 
        btn.style.border = '3px solid #0ff';
        btn.style.boxShadow = '0 0 15px #0ff';
    } else {
        btn.style.background = '#222';
        btn.style.border = '3px solid #ff0';
        btn.style.boxShadow = 'none';
    }
    
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

// Function to handle continue/resume gameplay
function handleContinue() {
    if (waitingForContinue) {
        waitingForContinue = false;
        if (pendingGameOver) {
            pendingGameOver = false;
            gameOver = true;
            // Check for high score when game is over
            const newHighScore = saveHighScore();
            updateStats();
            requestAnimationFrame(gameLoop);
        } else {
            // Clear all remaining numbers before starting the countdown
            fallingNumbers = [];
            countdownActive = true;
            startCountdown(() => {
                countdownActive = false;
                // After countdown, spawn a new number to start fresh
                spawnNewNumber();
                requestAnimationFrame(gameLoop);
            });
        }
        return true;
    }
    return false;
}

// Function to increase the selected number
function increaseNumber() {
    if (selectedNumber < 9) {
        selectedNumber++;
    } else {
        selectedNumber = 1;
    }
    document.getElementById('selected-number').textContent = selectedNumber;
}

// Function to decrease the selected number
function decreaseNumber() {
    if (selectedNumber > 1) {
        selectedNumber--;
    } else {
        selectedNumber = 9;
    }
    document.getElementById('selected-number').textContent = selectedNumber;
}

// Function to fire at matching number
function fireAtNumber() {
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
        // Optional: add feedback for misses (short vibration on mobile)
        if (navigator.vibrate && soundEnabled) {
            navigator.vibrate(30);
        }
    }
    return found;
}

// Set up touch controls
document.getElementById('increase-btn').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent double-actions on touch devices
    increaseNumber();
});

document.getElementById('decrease-btn').addEventListener('click', function(e) {
    e.preventDefault();
    decreaseNumber();
});

document.getElementById('fire-btn').addEventListener('click', function(e) {
    e.preventDefault();
    if (!handleContinue()) {
        fireAtNumber();
    }
});

// Handle any taps on the canvas as a continue action
canvas.addEventListener('click', function() {
    handleContinue();
});

// Set up keyboard controls
document.addEventListener('keydown', (e) => {
    if (waitingForContinue) {
        handleContinue();
        return;
    }
    
    if (e.key === 'j' || e.key === 'J') {
        increaseNumber();
    } else if (e.key === 'd' || e.key === 'D') {
        decreaseNumber();
    } else if (e.code === 'Space') {
        fireAtNumber();
    }
});

let spawnTimer = 0;
function getSpawnInterval() {
    // Start at 300 (5s), decrease by 25 frames per level, min 100 (about 1.6s)
    return Math.max(300 - (level - 1) * 25, 100);
}
let spawnInterval = getSpawnInterval();

function gameLoop() {
    if (countdownActive) {
        return;
    }    if (waitingForContinue) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(); // Add grid to the miss screen
        
        const scaleY = canvas.height / GAME_HEIGHT;
        const largeFont = Math.max(32, Math.min(48, 48 * scaleY));
        const smallFont = Math.max(18, Math.min(28, 28 * scaleY));
        
        ctx.font = `bold ${largeFont}px Montserrat, Arial Black, Arial, sans-serif`;
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Miss!', canvas.width / 2, canvas.height / 2 - (60 * scaleY));
        ctx.font = `bold ${smallFont}px Montserrat, Arial Black, Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.fillText('Hit any key to continue', canvas.width / 2, canvas.height / 2 + (10 * scaleY));
        requestAnimationFrame(gameLoop); // Keep loop running
        return;
    }    if (gameOver) {
        // Draw Game Over message
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(); // Add grid to game over screen
        
        const scaleY = canvas.height / GAME_HEIGHT;
        const largeFont = Math.max(24, Math.min(36, 36 * scaleY));
        const smallFont = Math.max(14, Math.min(20, 20 * scaleY));
        const tinyFont = Math.max(10, Math.min(16, 16 * scaleY));
        
        ctx.font = `bold ${largeFont}px Montserrat, Arial Black, Arial, sans-serif`;
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - (10 * scaleY));
        
        ctx.font = `bold ${smallFont}px Montserrat, Arial Black, Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + (30 * scaleY));
        
        // Display high score
        ctx.font = `bold ${tinyFont}px Montserrat, Arial Black, Arial, sans-serif`;
        ctx.fillStyle = score >= highScore ? '#0ff' : '#999';
        ctx.fillText(`Best Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + (60 * scaleY));
        
        // Show new high score message if applicable
        if (score >= highScore && score > 0) {
            ctx.font = `bold ${smallFont}px Montserrat, Arial Black, Arial, sans-serif`;
            ctx.fillStyle = '#0ff';
            ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + (90 * scaleY));
        }
        
        showPlayAgainButton();
        return;
    }hidePlayAgainButton();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the grid
    drawGrid();

    // Update and draw all falling numbers
    for (let i = fallingNumbers.length - 1; i >= 0; i--) {
        const num = fallingNumbers[i];
        num.update();
        num.draw(ctx);        // Use canvas height for boundary check
        if (num.y > canvas.height + 40) {
            misses++;
            lives--;
            updateStats();
            playMissSound();
            
            // Clear all falling numbers, not just the missed one
            fallingNumbers = [];
            
            // Show Miss label and wait for key press
            waitingForContinue = true;
            
            if (lives <= 0) {
                pendingGameOver = true;
            }
            
            requestAnimationFrame(gameLoop);
            return;
        }
    }    // Show level message
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

// Initialize game preferences and data
loadHighScore();
initSoundPreference();

// At the start of the game, spawn the first number with correct speed:
updateStats();
showLevelUpMessage();

// Start the initial countdown and game loop
startCountdown(startGameLoop);
