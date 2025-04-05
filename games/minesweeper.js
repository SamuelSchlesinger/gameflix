/**
 * Minesweeper Game
 * Clear the minefield without detonating any mines
 */

/**
 * Minesweeper Scene
 * @class
 * @extends PureJS.Scene
 */
class MinesweeperScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game configuration
        this.difficulty = 'beginner'; // 'beginner', 'intermediate', 'expert'
        this.difficultySettings = {
            beginner: { width: 9, height: 9, mines: 10 },
            intermediate: { width: 16, height: 16, mines: 40 },
            expert: { width: 30, height: 16, mines: 99 }
        };
        
        // Initialize dimensions based on difficulty
        this.initializeDimensions();
        
        // Game state
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.firstClick = true;
        this.gameOver = false;
        this.gameWon = false;
        this.remainingMines = this.mines;
        this.startTime = 0;
        this.currentTime = 0;
        
        // Create text entity for mine counter
        const mineCounterText = game.createEntity({
            x: this.offsetX + 100,
            y: this.offsetY / 2
        });
        
        mineCounterText.addComponent(new PureJS.TextComponent({
            text: `Mines: ${this.remainingMines}`,
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'left'
        }));
        
        this.mineCounterText = mineCounterText;
        this.addEntity(mineCounterText);
        
        // Create text entity for timer
        const timerText = game.createEntity({
            x: game.game.width - this.offsetX - 100,
            y: this.offsetY / 2
        });
        
        timerText.addComponent(new PureJS.TextComponent({
            text: 'Time: 0',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'right'
        }));
        
        this.timerText = timerText;
        this.addEntity(timerText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Left Click: Reveal | Right Click: Flag | R: Restart | D: Change Difficulty',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize game
        this.initializeGame();
        
        // Add mouse event listeners
        this.initializeMouseListeners();
    }
    
    /**
     * Initialize dimensions based on difficulty
     */
    initializeDimensions() {
        const settings = this.difficultySettings[this.difficulty];
        this.width = settings.width;
        this.height = settings.height;
        this.mines = settings.mines;
        
        // Calculate cell size based on screen dimensions and grid size
        this.cellSize = Math.min(
            this.game.game.width / this.width / 1.5,
            this.game.game.height / this.height / 1.5
        );
        
        // Calculate game area dimensions
        this.areaWidth = this.width * this.cellSize;
        this.areaHeight = this.height * this.cellSize;
        
        // Calculate offsets to center the grid
        this.offsetX = (this.game.game.width - this.areaWidth) / 2;
        this.offsetY = (this.game.game.height - this.areaHeight) / 2;
    }
    
    /**
     * Initialize the game
     */
    initializeGame() {
        // Reset game state
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.firstClick = true;
        this.gameOver = false;
        this.gameWon = false;
        this.remainingMines = this.mines;
        this.startTime = 0;
        this.currentTime = 0;
        
        // Initialize empty grid
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.revealed[y] = [];
            this.flagged[y] = [];
            
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 0; // 0 means no mine, 1-8 means number of adjacent mines, 9 means mine
                this.revealed[y][x] = false;
                this.flagged[y][x] = false;
            }
        }
        
        // Update mine counter and timer
        this.updateMineCounter();
        this.updateTimer();
    }
    
    /**
     * Add mouse event listeners
     */
    initializeMouseListeners() {
        const canvas = this.game.game.canvas;
        
        // Mouse down listener for right click (flag)
        canvas.addEventListener('mousedown', (e) => {
            // Only process if this scene is active
            if (this.game.game.currentScene !== this) return;
            
            // Right click for flagging
            if (e.button === 2) {
                e.preventDefault();
                
                // Get mouse position relative to canvas
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Convert to grid coordinates
                const gridX = Math.floor((mouseX - this.offsetX) / this.cellSize);
                const gridY = Math.floor((mouseY - this.offsetY) / this.cellSize);
                
                // Check if within grid
                if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
                    // Only allow flagging of unrevealed cells
                    if (!this.revealed[gridY][gridX]) {
                        this.flagged[gridY][gridX] = !this.flagged[gridY][gridX];
                        
                        // Update mine counter
                        this.remainingMines += this.flagged[gridY][gridX] ? -1 : 1;
                        this.updateMineCounter();
                    }
                }
            }
        });
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Generate mines after first click
     * @param {number} safeX - X coordinate to avoid placing a mine
     * @param {number} safeY - Y coordinate to avoid placing a mine
     */
    generateMines(safeX, safeY) {
        // Generate mines (avoiding the first clicked cell and its neighbors)
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            // Skip if this is the safe cell or its neighbors, or already has a mine
            if ((Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) || this.grid[y][x] === 9) {
                continue;
            }
            
            // Place a mine
            this.grid[y][x] = 9;
            minesPlaced++;
        }
        
        // Calculate numbers for cells
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Skip if cell has a mine
                if (this.grid[y][x] === 9) {
                    continue;
                }
                
                // Count adjacent mines
                let adjacentMines = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        // Skip if out of bounds
                        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                            continue;
                        }
                        
                        if (this.grid[ny][nx] === 9) {
                            adjacentMines++;
                        }
                    }
                }
                
                // Set the number
                this.grid[y][x] = adjacentMines;
            }
        }
    }
    
    /**
     * Reveal a cell at the specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    revealCell(x, y) {
        // Check if first click
        if (this.firstClick) {
            this.firstClick = false;
            this.generateMines(x, y);
            this.startTime = performance.now();
        }
        
        // Skip if already revealed or flagged
        if (this.revealed[y][x] || this.flagged[y][x]) {
            return;
        }
        
        // Reveal the cell
        this.revealed[y][x] = true;
        
        // Check if mine
        if (this.grid[y][x] === 9) {
            // Game over if it's a mine
            this.gameOver = true;
            return;
        }
        
        // If it's a zero (no adjacent mines), reveal neighboring cells
        if (this.grid[y][x] === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Skip if out of bounds
                    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                        continue;
                    }
                    
                    this.revealCell(nx, ny);
                }
            }
        }
        
        // Check for win condition
        this.checkWinCondition();
    }
    
    /**
     * Check if the player has won
     */
    checkWinCondition() {
        // Count unrevealed cells
        let unrevealedCount = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.revealed[y][x]) {
                    unrevealedCount++;
                }
            }
        }
        
        // Win if number of unrevealed cells equals number of mines
        if (unrevealedCount === this.mines) {
            this.gameWon = true;
            
            // Flag all remaining mines
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (!this.revealed[y][x] && !this.flagged[y][x]) {
                        this.flagged[y][x] = true;
                    }
                }
            }
            
            // Update mine counter
            this.remainingMines = 0;
            this.updateMineCounter();
        }
    }
    
    /**
     * Chord (reveal all unflagged neighbors)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    chord(x, y) {
        // Skip if not revealed
        if (!this.revealed[y][x]) {
            return;
        }
        
        // Count flagged neighbors
        let flaggedCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Skip if out of bounds
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                    continue;
                }
                
                if (this.flagged[ny][nx]) {
                    flaggedCount++;
                }
            }
        }
        
        // If flagged count matches the number, reveal all unflagged neighbors
        if (flaggedCount === this.grid[y][x]) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Skip if out of bounds
                    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                        continue;
                    }
                    
                    // Reveal if not flagged
                    if (!this.flagged[ny][nx]) {
                        this.revealCell(nx, ny);
                    }
                }
            }
        }
    }
    
    /**
     * Change difficulty
     */
    changeDifficulty() {
        // Cycle through difficulties
        const difficulties = ['beginner', 'intermediate', 'expert'];
        const currentIndex = difficulties.indexOf(this.difficulty);
        this.difficulty = difficulties[(currentIndex + 1) % difficulties.length];
        
        // Reinitialize dimensions
        this.initializeDimensions();
        
        // Reinitialize game
        this.initializeGame();
    }
    
    /**
     * Update mine counter text
     */
    updateMineCounter() {
        const textComp = this.mineCounterText.getComponent(PureJS.TextComponent);
        textComp.text = `Mines: ${this.remainingMines}`;
    }
    
    /**
     * Update timer text
     */
    updateTimer() {
        if (!this.gameOver && !this.gameWon && !this.firstClick) {
            const elapsedSeconds = Math.floor((this.currentTime - this.startTime) / 1000);
            const textComp = this.timerText.getComponent(PureJS.TextComponent);
            textComp.text = `Time: ${elapsedSeconds}`;
        }
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game if needed
        if (this.gameOver || this.gameWon) {
            this.initializeGame();
        }
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        // Update timer
        if (!this.gameOver && !this.gameWon && !this.firstClick) {
            this.currentTime = performance.now();
            this.updateTimer();
        }
        
        // Handle mouse clicks
        if (!this.gameOver && !this.gameWon) {
            // Left mouse button - reveal cell
            if (PureJS.Input.mouse.pressed) {
                // Get mouse position
                const mouseX = PureJS.Input.mouse.x;
                const mouseY = PureJS.Input.mouse.y;
                
                // Convert to grid coordinates
                const gridX = Math.floor((mouseX - this.offsetX) / this.cellSize);
                const gridY = Math.floor((mouseY - this.offsetY) / this.cellSize);
                
                // Check if within grid
                if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
                    // Left click to reveal or chord
                    if (this.revealed[gridY][gridX]) {
                        this.chord(gridX, gridY);
                    } else if (!this.flagged[gridY][gridX]) {
                        this.revealCell(gridX, gridY);
                    }
                }
            }
        }
        
        // Restart game with R key
        if (PureJS.Input.isKeyPressed('r') || PureJS.Input.isKeyPressed('R')) {
            this.initializeGame();
        }
        
        // Change difficulty with D key
        if (PureJS.Input.isKeyPressed('d') || PureJS.Input.isKeyPressed('D')) {
            this.changeDifficulty();
        }
        
        // Restart after game over/win
        if ((this.gameOver || this.gameWon) && 
            (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter'))) {
            this.initializeGame();
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (score, etc.)
        super.render(ctx);
        
        // Draw game area background
        ctx.fillStyle = '#555';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw difficulty indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Roboto';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `Difficulty: ${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}`,
            this.game.game.width / 2,
            this.offsetY / 2
        );
        
        // Draw grid cells
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellX = this.offsetX + x * this.cellSize;
                const cellY = this.offsetY + y * this.cellSize;
                
                if (this.revealed[y][x]) {
                    // Revealed cell
                    ctx.fillStyle = '#ddd';
                    ctx.fillRect(
                        cellX + 1, 
                        cellY + 1, 
                        this.cellSize - 2, 
                        this.cellSize - 2
                    );
                    
                    // Draw number if it has adjacent mines
                    if (this.grid[y][x] > 0 && this.grid[y][x] < 9) {
                        const numberColors = [
                            null, // 0 - No adjacent mines (should never be used)
                            '#0000FF', // 1 - Blue
                            '#007B00', // 2 - Green
                            '#FF0000', // 3 - Red
                            '#00007B', // 4 - Dark Blue
                            '#7B0000', // 5 - Dark Red
                            '#007B7B', // 6 - Cyan
                            '#000000', // 7 - Black
                            '#7B7B7B'  // 8 - Gray
                        ];
                        
                        ctx.fillStyle = numberColors[this.grid[y][x]];
                        ctx.font = `bold ${this.cellSize * 0.7}px Roboto`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            this.grid[y][x].toString(),
                            cellX + this.cellSize / 2,
                            cellY + this.cellSize / 2
                        );
                    }
                    
                    // Draw mine if revealed and it's a mine
                    if (this.grid[y][x] === 9) {
                        // Exploded mine (red background)
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(
                            cellX + 1, 
                            cellY + 1, 
                            this.cellSize - 2, 
                            this.cellSize - 2
                        );
                        
                        // Draw mine
                        ctx.fillStyle = '#000';
                        ctx.beginPath();
                        ctx.arc(
                            cellX + this.cellSize / 2,
                            cellY + this.cellSize / 2,
                            this.cellSize / 3,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                } else {
                    // Unrevealed cell - draw raised button
                    ctx.fillStyle = '#bbb';
                    ctx.fillRect(
                        cellX, 
                        cellY, 
                        this.cellSize, 
                        this.cellSize
                    );
                    
                    // Add 3D effect
                    ctx.fillStyle = '#eee';
                    ctx.beginPath();
                    ctx.moveTo(cellX, cellY);
                    ctx.lineTo(cellX + this.cellSize, cellY);
                    ctx.lineTo(cellX, cellY + this.cellSize);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.fillStyle = '#999';
                    ctx.beginPath();
                    ctx.moveTo(cellX + this.cellSize, cellY);
                    ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
                    ctx.lineTo(cellX, cellY + this.cellSize);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Draw flag if flagged
                    if (this.flagged[y][x]) {
                        // Flag pole
                        ctx.fillStyle = '#000';
                        ctx.fillRect(
                            cellX + this.cellSize / 2 - this.cellSize / 20,
                            cellY + this.cellSize / 4,
                            this.cellSize / 10,
                            this.cellSize / 2
                        );
                        
                        // Flag
                        ctx.fillStyle = '#FF0000';
                        ctx.beginPath();
                        ctx.moveTo(cellX + this.cellSize / 2, cellY + this.cellSize / 4);
                        ctx.lineTo(cellX + this.cellSize * 3/4, cellY + this.cellSize * 3/8);
                        ctx.lineTo(cellX + this.cellSize / 2, cellY + this.cellSize / 2);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
        }
        
        // Draw game over message
        if (this.gameOver) {
            // Reveal all mines
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.grid[y][x] === 9 && !this.revealed[y][x] && !this.flagged[y][x]) {
                        const cellX = this.offsetX + x * this.cellSize;
                        const cellY = this.offsetY + y * this.cellSize;
                        
                        // Unrevealed mine
                        ctx.fillStyle = '#ddd';
                        ctx.fillRect(
                            cellX + 1, 
                            cellY + 1, 
                            this.cellSize - 2, 
                            this.cellSize - 2
                        );
                        
                        // Draw mine
                        ctx.fillStyle = '#000';
                        ctx.beginPath();
                        ctx.arc(
                            cellX + this.cellSize / 2,
                            cellY + this.cellSize / 2,
                            this.cellSize / 3,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                    
                    // Show incorrectly flagged mines
                    if (this.flagged[y][x] && this.grid[y][x] !== 9) {
                        const cellX = this.offsetX + x * this.cellSize;
                        const cellY = this.offsetY + y * this.cellSize;
                        
                        // Draw X over flag
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(cellX + this.cellSize / 4, cellY + this.cellSize / 4);
                        ctx.lineTo(cellX + this.cellSize * 3/4, cellY + this.cellSize * 3/4);
                        ctx.moveTo(cellX + this.cellSize * 3/4, cellY + this.cellSize / 4);
                        ctx.lineTo(cellX + this.cellSize / 4, cellY + this.cellSize * 3/4);
                        ctx.stroke();
                    }
                }
            }
            
            // Draw overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', this.game.game.width / 2, this.game.game.height / 2 - 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 20);
        }
        
        // Draw win message
        if (this.gameWon) {
            ctx.fillStyle = 'rgba(0, 128, 0, 0.5)';
            ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('YOU WIN!', this.game.game.width / 2, this.game.game.height / 2 - 20);
            
            // Display time
            const elapsedSeconds = Math.floor((this.currentTime - this.startTime) / 1000);
            ctx.font = '20px Roboto';
            ctx.fillText(`Time: ${elapsedSeconds} seconds`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
}

/**
 * Load Minesweeper game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadMinesweeperGame(game, onLoaded) {
    // Create a Minesweeper scene
    const minesweeperScene = new MinesweeperScene(game);
    
    // Add scene to game
    game.addScene('minesweeper', minesweeperScene);
    
    // Set as current scene
    game.setScene('minesweeper');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}