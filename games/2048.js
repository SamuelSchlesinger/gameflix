/**
 * 2048 Game
 * Slide tiles to combine and create the 2048 tile
 */

/**
 * 2048 Scene
 * @class
 * @extends PureJS.Scene
 */
class Game2048Scene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game area dimensions
        this.gridSize = 4;
        this.tileSize = Math.min(
            game.game.width / this.gridSize / 1.2,
            game.game.height / this.gridSize / 1.2
        );
        this.areaWidth = this.gridSize * this.tileSize;
        this.areaHeight = this.gridSize * this.tileSize;
        this.offsetX = (game.game.width - this.areaWidth) / 2;
        this.offsetY = (game.game.height - this.areaHeight) / 2;
        
        // Game state
        this.grid = [];
        this.score = 0;
        this.bestScore = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.animating = false;
        this.animationQueue = [];
        this.animationSpeed = 15; // pixels per frame
        
        // Tile colors
        this.tileColors = {
            2: "#eee4da",
            4: "#ede0c8",
            8: "#f2b179",
            16: "#f59563",
            32: "#f67c5f",
            64: "#f65e3b",
            128: "#edcf72",
            256: "#edcc61",
            512: "#edc850",
            1024: "#edc53f",
            2048: "#edc22e"
        };
        
        this.textColors = {
            2: "#776e65",
            4: "#776e65",
            8: "#f9f6f2",
            16: "#f9f6f2",
            32: "#f9f6f2",
            64: "#f9f6f2",
            128: "#f9f6f2",
            256: "#f9f6f2",
            512: "#f9f6f2",
            1024: "#f9f6f2",
            2048: "#f9f6f2"
        };
        
        // Create text entity for score
        const scoreText = game.createEntity({
            x: this.offsetX + this.areaWidth / 4,
            y: this.offsetY / 2
        });
        
        scoreText.addComponent(new PureJS.TextComponent({
            text: 'Score: 0',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'center'
        }));
        
        this.scoreText = scoreText;
        this.addEntity(scoreText);
        
        // Create text entity for best score
        const bestScoreText = game.createEntity({
            x: this.offsetX + (this.areaWidth * 3) / 4,
            y: this.offsetY / 2
        });
        
        bestScoreText.addComponent(new PureJS.TextComponent({
            text: 'Best: 0',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'center'
        }));
        
        this.bestScoreText = bestScoreText;
        this.addEntity(bestScoreText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrow Keys: Move Tiles  |  R: Restart Game',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize game
        this.initializeGame();
    }
    
    /**
     * Initialize or reset the game
     */
    initializeGame() {
        // Clear grid
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = null;
            }
        }
        
        // Reset score
        this.score = 0;
        this.updateScoreText();
        
        // Reset game state
        this.gameOver = false;
        this.gameWon = false;
        this.animating = false;
        this.animationQueue = [];
        
        // Add initial tiles
        this.addRandomTile();
        this.addRandomTile();
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Try to load best score from local storage
        try {
            const savedBestScore = localStorage.getItem('2048_bestScore');
            if (savedBestScore) {
                this.bestScore = parseInt(savedBestScore, 10);
                this.updateBestScoreText();
            }
        } catch (e) {
            console.error("Could not load best score from local storage:", e);
        }
        
        // Reset game if needed
        if (this.gameOver || this.gameWon) {
            this.initializeGame();
        }
    }
    
    /**
     * Update score text
     */
    updateScoreText() {
        const textComp = this.scoreText.getComponent(PureJS.TextComponent);
        textComp.text = `Score: ${this.score}`;
    }
    
    /**
     * Update best score text
     */
    updateBestScoreText() {
        const textComp = this.bestScoreText.getComponent(PureJS.TextComponent);
        textComp.text = `Best: ${this.bestScore}`;
    }
    
    /**
     * Add a random tile to the grid
     */
    addRandomTile() {
        // Find empty cells
        const emptyCells = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === null) {
                    emptyCells.push({ x, y });
                }
            }
        }
        
        // If no empty cells, return
        if (emptyCells.length === 0) return false;
        
        // Choose a random empty cell
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // Add a tile (90% chance for 2, 10% chance for 4)
        const value = Math.random() < 0.9 ? 2 : 4;
        
        // Create the tile with an animation
        this.grid[cell.y][cell.x] = {
            value: value,
            mergedFrom: null,
            isNew: true,
            x: cell.x,
            y: cell.y,
            scale: 0.1 // Start small
        };
        
        return true;
    }
    
    /**
     * Move tiles in the specified direction
     * @param {string} direction - Direction to move (up, right, down, left)
     */
    move(direction) {
        if (this.animating || this.gameOver || this.gameWon) return;
        
        // Record initial grid state for comparison
        const previousGrid = JSON.parse(JSON.stringify(this.grid));
        
        // Get vector for the direction
        let vector = { x: 0, y: 0 };
        switch (direction) {
            case 'up':
                vector.y = -1;
                break;
            case 'right':
                vector.x = 1;
                break;
            case 'down':
                vector.y = 1;
                break;
            case 'left':
                vector.x = -1;
                break;
        }
        
        // Traverse grid in the correct order based on direction
        const traversals = this.buildTraversals(vector);
        let moved = false;
        
        // Reset merged flags
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    this.grid[y][x].mergedFrom = null;
                    this.grid[y][x].isNew = false;
                }
            }
        }
        
        // Move tiles
        traversals.y.forEach(y => {
            traversals.x.forEach(x => {
                const cell = { x: x, y: y };
                const tile = this.grid[y][x];
                
                if (tile) {
                    const positions = this.findFarthestPosition(cell, vector);
                    const next = this.getTile(positions.next);
                    
                    // Merge tiles if the next tile has the same value and wasn't merged this turn
                    if (next && next.value === tile.value && !next.mergedFrom) {
                        const merged = {
                            value: tile.value * 2,
                            mergedFrom: [tile, next],
                            isNew: false,
                            x: positions.next.x,
                            y: positions.next.y,
                            scale: 1
                        };
                        
                        // Remove the original tiles
                        this.grid[y][x] = null;
                        this.grid[positions.next.y][positions.next.x] = null;
                        
                        // Add the merged tile
                        this.grid[positions.next.y][positions.next.x] = merged;
                        
                        // Update score
                        this.score += merged.value;
                        
                        // Check for win
                        if (merged.value === 2048 && !this.gameWon) {
                            this.gameWon = true;
                        }
                        
                        moved = true;
                    } else {
                        // Move tile to farthest position
                        this.moveTile(tile, positions.farthest);
                        
                        // Check if the tile was actually moved
                        if (cell.x !== positions.farthest.x || cell.y !== positions.farthest.y) {
                            moved = true;
                        }
                    }
                }
            });
        });
        
        // Update score and best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScoreText();
            
            // Save best score to local storage
            try {
                localStorage.setItem('2048_bestScore', this.bestScore.toString());
            } catch (e) {
                console.error("Could not save best score to local storage:", e);
            }
        }
        
        // If we moved, add a new random tile
        if (moved) {
            this.updateScoreText();
            this.addRandomTile();
            
            // Check if game is over
            if (!this.movesAvailable()) {
                this.gameOver = true;
            }
        }
    }
    
    /**
     * Build traversal order based on direction vector
     * @param {Object} vector - Direction vector
     * @returns {Object} Traversal coordinates
     */
    buildTraversals(vector) {
        const traversals = { x: [], y: [] };
        
        for (let i = 0; i < this.gridSize; i++) {
            traversals.x.push(i);
            traversals.y.push(i);
        }
        
        // Always traverse from the farthest cell in the direction of movement
        if (vector.x === 1) traversals.x = traversals.x.reverse();
        if (vector.y === 1) traversals.y = traversals.y.reverse();
        
        return traversals;
    }
    
    /**
     * Get a tile at a specific position
     * @param {Object} position - Position to check
     * @returns {Object|null} Tile at position or null
     */
    getTile(position) {
        if (this.withinBounds(position)) {
            return this.grid[position.y][position.x];
        } else {
            return null;
        }
    }
    
    /**
     * Check if position is within grid bounds
     * @param {Object} position - Position to check
     * @returns {boolean} Whether position is within bounds
     */
    withinBounds(position) {
        return position.x >= 0 && position.x < this.gridSize &&
               position.y >= 0 && position.y < this.gridSize;
    }
    
    /**
     * Find the farthest position in the specified direction
     * @param {Object} cell - Starting cell
     * @param {Object} vector - Direction vector
     * @returns {Object} Farthest position and next position
     */
    findFarthestPosition(cell, vector) {
        let previous;
        let position = { x: cell.x, y: cell.y };
        
        // Project position as far as possible in the direction vector
        do {
            previous = { x: position.x, y: position.y };
            position = {
                x: previous.x + vector.x,
                y: previous.y + vector.y
            };
        } while (this.withinBounds(position) && this.getTile(position) === null);
        
        return {
            farthest: previous,
            next: position // Used for merging
        };
    }
    
    /**
     * Move a tile to a new position
     * @param {Object} tile - Tile to move
     * @param {Object} position - New position
     */
    moveTile(tile, position) {
        // Remove tile from old position
        this.grid[tile.y][tile.x] = null;
        
        // Update tile position
        tile.x = position.x;
        tile.y = position.y;
        
        // Place tile in new position
        this.grid[position.y][position.x] = tile;
    }
    
    /**
     * Check if there are any moves available
     * @returns {boolean} Whether moves are available
     */
    movesAvailable() {
        // Check for empty cells
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] === null) {
                    return true;
                }
            }
        }
        
        // Check for adjacent cells with the same value
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const tile = this.grid[y][x];
                if (tile) {
                    // Check adjacent cells
                    for (const vector of [{x:1, y:0}, {x:0, y:1}]) {
                        const adjacent = { x: x + vector.x, y: y + vector.y };
                        const adjacentTile = this.getTile(adjacent);
                        
                        if (adjacentTile && adjacentTile.value === tile.value) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        // Handle animations
        let stillAnimating = false;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const tile = this.grid[y][x];
                if (tile) {
                    // Handle new tile animation
                    if (tile.isNew && tile.scale < 1) {
                        tile.scale = Math.min(1, tile.scale + dt * 5);
                        stillAnimating = true;
                    }
                }
            }
        }
        
        this.animating = stillAnimating;
        
        // Handle input only if not animating
        if (!this.animating) {
            if (PureJS.Input.isKeyPressed('ArrowUp')) {
                this.move('up');
            } else if (PureJS.Input.isKeyPressed('ArrowRight')) {
                this.move('right');
            } else if (PureJS.Input.isKeyPressed('ArrowDown')) {
                this.move('down');
            } else if (PureJS.Input.isKeyPressed('ArrowLeft')) {
                this.move('left');
            } else if (PureJS.Input.isKeyPressed('r') || PureJS.Input.isKeyPressed('R')) {
                this.initializeGame();
            }
        }
        
        // Check for restart after game over
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
        ctx.fillStyle = '#bbada0';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw grid cells
        const padding = 6;
        const cellSize = this.tileSize - padding * 2;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const posX = this.offsetX + x * this.tileSize + padding;
                const posY = this.offsetY + y * this.tileSize + padding;
                
                // Draw empty cell
                ctx.fillStyle = '#cdc1b4';
                ctx.beginPath();
                ctx.roundRect(posX, posY, cellSize, cellSize, 6);
                ctx.fill();
            }
        }
        
        // Draw tiles
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const tile = this.grid[y][x];
                
                if (tile) {
                    const posX = this.offsetX + x * this.tileSize + padding;
                    const posY = this.offsetY + y * this.tileSize + padding;
                    
                    // Calculate scaled dimensions and position
                    const scaledSize = cellSize * tile.scale;
                    const scaledX = posX + (cellSize - scaledSize) / 2;
                    const scaledY = posY + (cellSize - scaledSize) / 2;
                    
                    // Draw tile background
                    const value = tile.value;
                    ctx.fillStyle = this.tileColors[value] || '#3c3a32'; // Fallback for large values
                    ctx.beginPath();
                    ctx.roundRect(scaledX, scaledY, scaledSize, scaledSize, 6);
                    ctx.fill();
                    
                    // Draw tile text
                    if (tile.scale > 0.5) { // Only draw text when tile is large enough
                        ctx.fillStyle = this.textColors[value] || '#f9f6f2'; // Fallback for large values
                        let fontSize;
                        
                        // Adjust font size based on the number of digits
                        if (value < 100) {
                            fontSize = cellSize * 0.5;
                        } else if (value < 1000) {
                            fontSize = cellSize * 0.4;
                        } else {
                            fontSize = cellSize * 0.3;
                        }
                        
                        ctx.font = `bold ${fontSize}px Roboto`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(value.toString(), scaledX + scaledSize / 2, scaledY + scaledSize / 2);
                    }
                }
            }
        }
        
        // Draw game over message
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(238, 228, 218, 0.73)';
            ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
            
            ctx.fillStyle = '#776e65';
            ctx.font = 'bold 60px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Game Over!', this.offsetX + this.areaWidth / 2, this.offsetY + this.areaHeight / 2 - 40);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Final Score: ${this.score}`, this.offsetX + this.areaWidth / 2, this.offsetY + this.areaHeight / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.offsetX + this.areaWidth / 2, this.offsetY + this.areaHeight / 2 + 60);
        }
        
        // Draw win message
        if (this.gameWon) {
            ctx.fillStyle = 'rgba(237, 194, 46, 0.5)';
            ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
            
            ctx.fillStyle = '#f9f6f2';
            ctx.font = 'bold 60px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('You Win!', this.offsetX + this.areaWidth / 2, this.offsetY + this.areaHeight / 2 - 40);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Score: ${this.score}`, this.offsetX + this.areaWidth / 2, this.offsetY + this.areaHeight / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.offsetX + this.areaWidth / 2, this.offsetY + this.areaHeight / 2 + 60);
        }
    }
}

/**
 * Load 2048 game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function load2048Game(game, onLoaded) {
    // Create a 2048 scene
    const game2048Scene = new Game2048Scene(game);
    
    // Add scene to game
    game.addScene('2048', game2048Scene);
    
    // Set as current scene
    game.setScene('2048');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}