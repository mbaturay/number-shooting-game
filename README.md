# Number Shooter

A fast-paced browser game where you shoot falling numbers by selecting the correct value. Now featuring a smart scoring system and improved gameplay mechanics!

## How to Play

1. Select the number matching a falling number.
2. Fire to shoot it before it reaches the bottom.
3. The lower you shoot, the higher your score multiplier!
4. Don't let any number reach the bottom, or you'll lose a life.
5. Survive as long as you can and aim for a high score!

## Features
- **Falling Numbers:** Numbers fall from the top of the screen. Select the correct number and shoot before they reach the bottom.
- **Push-Back Mechanic:** Successfully hitting a number pushes all remaining numbers upward, giving you more headroom. The push-back is smoothly animated and scales with level and canvas size.
- **Clash Avoidance:** Push-back logic ensures numbers never overlap, keeping gameplay fair and readable.
- **Smart Scoring System:**
  - The closer you hit a number to the bottom, the higher your score multiplier (up to 4x).
  - Hitting numbers near the top gives the minimum score (1x), while risky, last-moment shots are rewarded with more points.
- **Levels:** Progress through levels as you score more points. Higher levels increase the challenge.
- **Sound Effects:** Toggle sound on/off for feedback.
- **Responsive Design:** Game scales to fit your device or browser window.

## Run Locally

1. Clone the repo:
   ```sh
   git clone https://github.com/mbaturay/number-shooting-game.git
   ```
2. Open `index.html` in your browser.

No build or install steps required!

## Controls

### Keyboard
| Key      | Action                |
|----------|-----------------------|
| J        | Increase number       |
| D        | Decrease number       |
| Spacebar | Shoot selected number |

### Touch
| Button   | Action                |
|----------|-----------------------|
| +        | Increase number       |
| -        | Decrease number       |
| Fire     | Shoot selected number |

### Settings
You can toggle sound effects on/off using the sound switch. Your preference will be saved for future visits.

## Recent Updates
### New scoring system and clash avoidance
- Added a smart scoring system: score multiplier increases as you shoot numbers closer to the bottom.
- Push-back animation now prevents numbers from overlapping after a hit.

---

Enjoy the game and challenge yourself to get the highest score!

## License

MIT
