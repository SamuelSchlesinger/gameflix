/**
 * Match 3 Game
 * Classic tile-matching puzzle game
 */

/**
 * Match 3 Scene
 * @class
 * @extends PureJS.Scene
 */
class Match3Scene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game dimensions
        this.gridSize = 8;
        this.cellSize = Math.min(
            game.game.width / (this.gridSize + 2) / 1.2,
            game.game.height / (this.gridSize + 4) / 1.2
        );
        this.areaWidth = this.gridSize * this.cellSize;
        this.areaHeight = this.gridSize * this.cellSize;
        this.offsetX = (game.game.width - this.areaWidth) / 2;
        this.offsetY = (game.game.height - this.areaHeight) / 2;
        
        // Game state
        this.grid = [];
        this.selectedTile = null;
        this.swappingTiles = null;
        this.animatingTiles = false;
        this.fallingTiles = false;
        this.score = 0;
        this.timeLeft = 60; // 60 seconds
        this.gameOver = false;
        
        // Tile types and colors
        this.tileTypes = 6; // Number of different tile types
        this.tileColors = [
            '#FF5252', // Red
            '#4CAF50', // Green
            '#2196F3', // Blue
            '#FFC107', // Yellow
            '#9C27B0', // Purple
            '#FF9800'  // Orange
        ];
        
        // Create text entity for score
        const scoreText = game.createEntity({
            x: this.offsetX + 100,
            y: this.offsetY / 2
        });
        
        scoreText.addComponent(new PureJS.TextComponent({
            text: 'Score: 0',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'left'
        }));
        
        this.scoreText = scoreText;
        this.addEntity(scoreText);
        
        // Create text entity for timer
        const timerText = game.createEntity({
            x: game.game.width - this.offsetX - 100,
            y: this.offsetY / 2
        });
        
        timerText.addComponent(new PureJS.TextComponent({
            text: 'Time: 60',
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
            text: 'Click to select and swap tiles. Match 3 or more of the same color!',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize the game
        this.initializeGame();
    }
    
    /**
     * Initialize the game
     */
    initializeGame() {
        // Create grid
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = {
                    type: Math.floor(Math.random() * this.tileTypes),
                    x: x,
                    y: y,
                    offsetX: 0,
                    offsetY: 0,
                    scale: 1,
                    alpha: 1,
                    matched: false
                };
            }
        }
        
        // Make sure there are no initial matches
        this.resolveInitialMatches();
        
        // Reset game state
        this.selectedTile = null;
        this.swappingTiles = null;
        this.animatingTiles = false;
        this.fallingTiles = false;
        this.score = 0;
        this.timeLeft = 60;
        this.gameOver = false;
        
        // Update UI
        this.updateScoreText();
        this.updateTimerText();
    }
    
    /**
     * Resolve any matches in the initial grid
     */
    resolveInitialMatches() {
        let hasMatches = true;
        
        // Keep resolving until there are no matches
        while (hasMatches) {
            hasMatches = false;
            
            // Check for horizontal matches
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize - 2; x++) {
                    const type = this.grid[y][x].type;
                    if (type === this.grid[y][x+1].type && type === this.grid[y][x+2].type) {
                        // Replace one of the tiles to break the match
                        let newType;
                        do {
                            newType = Math.floor(Math.random() * this.tileTypes);
                        } while (newType === type);
                        
                        this.grid[y][x+1].type = newType;
                        hasMatches = true;
                    }
                }
            }
            
            // Check for vertical matches
            for (let x = 0; x < this.gridSize; x++) {
                for (let y = 0; y < this.gridSize - 2; y++) {
                    const type = this.grid[y][x].type;
                    if (type === this.grid[y+1][x].type && type === this.grid[y+2][x].type) {
                        // Replace one of the tiles to break the match
                        let newType;
                        do {
                            newType = Math.floor(Math.random() * this.tileTypes);
                        } while (newType === type);
                        
                        this.grid[y+1][x].type = newType;
                        hasMatches = true;
                    }
                }
            }
        }
    }
    
    /**
     * Select a tile
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    selectTile(x, y) {
        // Ignore if animating or game over
        if (this.animatingTiles || this.fallingTiles || this.gameOver) {
            return;
        }
        
        // If no tile is selected, select this one
        if (!this.selectedTile) {
            this.selectedTile = { x, y };
            return;
        }
        
        // If this is the same tile, deselect it
        if (this.selectedTile.x === x && this.selectedTile.y === y) {
            this.selectedTile = null;
            return;
        }
        
        // Check if the tiles are adjacent
        const dx = Math.abs(this.selectedTile.x - x);
        const dy = Math.abs(this.selectedTile.y - y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // The tiles are adjacent, swap them
            this.swapTiles(this.selectedTile.x, this.selectedTile.y, x, y);
            this.selectedTile = null;
        } else {
            // The tiles are not adjacent, select the new one
            this.selectedTile = { x, y };
        }
    }
    
    /**
     * Swap two tiles
     * @param {number} x1 - First tile X coordinate
     * @param {number} y1 - First tile Y coordinate
     * @param {number} x2 - Second tile X coordinate
     * @param {number} y2 - Second tile Y coordinate
     */
    swapTiles(x1, y1, x2, y2) {
        // Start swapping animation
        this.animatingTiles = true;
        
        // Calculate the offset for animation
        const offsetX = (x2 - x1) * this.cellSize;
        const offsetY = (y2 - y1) * this.cellSize;
        
        // Set animation state
        this.grid[y1][x1].offsetX = 0;
        this.grid[y1][x1].offsetY = 0;
        this.grid[y2][x2].offsetX = -offsetX;
        this.grid[y2][x2].offsetY = -offsetY;
        
        // Store the swapping tiles
        this.swappingTiles = {
            x1, y1, x2, y2,
            duration: 0.25, // Animation duration in seconds
            elapsed: 0,
            offsetX, offsetY
        };
    }
    
    /**
     * Finish the tile swap
     */
    finishSwap() {
        const { x1, y1, x2, y2 } = this.swappingTiles;
        
        // Swap tile types
        const tempType = this.grid[y1][x1].type;
        this.grid[y1][x1].type = this.grid[y2][x2].type;
        this.grid[y2][x2].type = tempType;
        
        // Reset offsets
        this.grid[y1][x1].offsetX = 0;
        this.grid[y1][x1].offsetY = 0;
        this.grid[y2][x2].offsetX = 0;
        this.grid[y2][x2].offsetY = 0;
        
        // No longer swapping
        this.swappingTiles = null;
        
        // Check for matches
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // There are matches, remove them
            this.removeMatches(matches);
        } else {
            // No matches, swap back immediately
            this.swapTiles(x1, y1, x2, y2);
        }
    }
    
    /**
     * Find all matches in the grid
     * @returns {Array} Array of matched tiles
     */
    findMatches() {
        const matches = [];
        
        // Check for horizontal matches
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize - 2; x++) {
                const type = this.grid[y][x].type;
                
                if (type === this.grid[y][x+1].type && type === this.grid[y][x+2].type) {
                    // Found a horizontal match of at least 3
                    
                    // Find how long the match is
                    let matchLength = 3;
                    while (x + matchLength < this.gridSize && this.grid[y][x + matchLength].type === type) {
                        matchLength++;
                    }
                    
                    // Add all tiles in the match
                    for (let i = 0; i < matchLength; i++) {
                        if (!matches.some(m => m.x === x + i && m.y === y)) {
                            matches.push({ x: x + i, y: y });
                        }
                    }
                    
                    // Skip the matched tiles
                    x += matchLength - 1;
                }
            }
        }
        
        // Check for vertical matches
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize - 2; y++) {
                const type = this.grid[y][x].type;
                
                if (type === this.grid[y+1][x].type && type === this.grid[y+2][x].type) {
                    // Found a vertical match of at least 3
                    
                    // Find how long the match is
                    let matchLength = 3;
                    while (y + matchLength < this.gridSize && this.grid[y + matchLength][x].type === type) {
                        matchLength++;
                    }
                    
                    // Add all tiles in the match
                    for (let i = 0; i < matchLength; i++) {
                        if (!matches.some(m => m.x === x && m.y === y + i)) {
                            matches.push({ x: x, y: y + i });
                        }
                    }
                    
                    // Skip the matched tiles
                    y += matchLength - 1;
                }
            }
        }
        
        return matches;
    }
    
    /**
     * Remove matched tiles and calculate score
     * @param {Array} matches - Array of matched tiles
     */
    removeMatches(matches) {
        // Mark matched tiles
        for (const match of matches) {
            this.grid[match.y][match.x].matched = true;
        }
        
        // Start removal animation
        this.animatingTiles = true;
        
        // Calculate score (more tiles = more points per tile)
        const matchBonus = matches.length > 3 ? matches.length - 3 : 0;
        this.score += matches.length * 10 + matchBonus * 10;
        this.updateScoreText();
        
        // Set a timeout to collapse the grid after the animation
        setTimeout(() => {
            this.collapseGrid();
        }, 300);
    }
    
    /**
     * Collapse the grid after removing matches
     */
    collapseGrid() {
        // Reset matched tiles and move tiles down
        this.fallingTiles = true;
        
        // For each column
        for (let x = 0; x < this.gridSize; x++) {
            // Count how many tiles need to fall
            let fallCount = 0;
            
            // From bottom to top
            for (let y = this.gridSize - 1; y >= 0; y--) {
                if (this.grid[y][x].matched) {
                    fallCount++;
                } else if (fallCount > 0) {
                    // Move this tile down by fallCount
                    this.grid[y + fallCount][x].type = this.grid[y][x].type;
                    this.grid[y + fallCount][x].matched = false;
                    this.grid[y][x].matched = true;
                }
            }
            
            // Fill in new tiles at the top
            for (let y = 0; y < fallCount; y++) {
                this.grid[y][x].type = Math.floor(Math.random() * this.tileTypes);
                this.grid[y][x].matched = false;
                this.grid[y][x].offsetY = -this.cellSize * (fallCount - y);
            }
        }
        
        // No longer animating removal
        this.animatingTiles = false;
        
        // Check for new matches after the grid has settled
        setTimeout(() => {
            this.fallingTiles = false;
            
            // Check for new matches
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                this.removeMatches(newMatches);
            }
        }, 500);
    }
    
    /**
     * Update score text
     */
    updateScoreText() {
        const textComp = this.scoreText.getComponent(PureJS.TextComponent);
        textComp.text = `Score: ${this.score}`;
    }
    
    /**
     * Update timer text
     */
    updateTimerText() {
        const textComp = this.timerText.getComponent(PureJS.TextComponent);
        textComp.text = `Time: ${Math.ceil(this.timeLeft)}`;
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game if needed
        if (this.gameOver) {
            this.initializeGame();
        }
    }
    
    /**
     * Process mouse click
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     */
    processClick(x, y) {
        // Convert to grid coordinates
        const gridX = Math.floor((x - this.offsetX) / this.cellSize);
        const gridY = Math.floor((y - this.offsetY) / this.cellSize);
        
        // Check if within grid
        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
            this.selectTile(gridX, gridY);
        }
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        // Update timer if game is running
        if (!this.gameOver) {
            this.timeLeft -= dt;
            this.updateTimerText();
            
            // Check for game over
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.gameOver = true;
            }
        }
        
        // Handle mouse click
        if (PureJS.Input.mouse.pressed) {
            this.processClick(PureJS.Input.mouse.x, PureJS.Input.mouse.y);
        }
        
        // Handle tile swapping animation
        if (this.swappingTiles) {
            this.swappingTiles.elapsed += dt;
            
            // Calculate progress (0 to 1)
            const progress = Math.min(1, this.swappingTiles.elapsed / this.swappingTiles.duration);
            
            // Update tile offsets
            const { x1, y1, x2, y2, offsetX, offsetY } = this.swappingTiles;
            this.grid[y1][x1].offsetX = offsetX * progress;
            this.grid[y1][x1].offsetY = offsetY * progress;
            this.grid[y2][x2].offsetX = -offsetX * progress;
            this.grid[y2][x2].offsetY = -offsetY * progress;
            
            // Check if animation is complete
            if (progress >= 1) {
                this.finishSwap();
                this.animatingTiles = false;
            }
        }
        
        // Handle falling tiles animation
        if (this.fallingTiles) {
            let stillFalling = false;
            
            // Update tile offsets
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const tile = this.grid[y][x];
                    
                    if (tile.offsetY < 0) {
                        tile.offsetY = Math.min(0, tile.offsetY + this.cellSize * 5 * dt);
                        stillFalling = true;
                    }
                }
            }
            
            // Check if all tiles have finished falling
            if (!stillFalling) {
                this.fallingTiles = false;
            }
        }
        
        // Check for restart after game over
        if (this.gameOver && 
            (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter'))) {
            this.initializeGame();
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (score, timer, etc.)
        super.render(ctx);
        
        // Draw game area background
        ctx.fillStyle = '#333';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw grid
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cellX = this.offsetX + x * this.cellSize;
                const cellY = this.offsetY + y * this.cellSize;
                
                // Draw cell background
                ctx.fillStyle = '#444';
                ctx.fillRect(
                    cellX + 1, 
                    cellY + 1, 
                    this.cellSize - 2, 
                    this.cellSize - 2
                );
            }
        }
        
        // Draw tiles
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const tile = this.grid[y][x];
                
                // Skip removed tiles
                if (tile.matched && !this.fallingTiles) {
                    continue;
                }
                
                const cellX = this.offsetX + x * this.cellSize + tile.offsetX;
                const cellY = this.offsetY + y * this.cellSize + tile.offsetY;
                
                // Draw tile
                const size = this.cellSize * 0.9 * tile.scale;
                const padding = (this.cellSize - size) / 2;
                
                ctx.fillStyle = this.tileColors[tile.type];
                ctx.globalAlpha = tile.alpha;
                ctx.beginPath();
                ctx.roundRect(
                    cellX + padding,
                    cellY + padding,
                    size,
                    size,
                    10
                );
                ctx.fill();
                
                // Add highlights
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.roundRect(
                    cellX + padding,
                    cellY + padding,
                    size,
                    size / 3,
                    { tl: 10, tr: 10, bl: 0, br: 0 }
                );
                ctx.fill();
                
                // Add symbol or icon based on tile type
                const symbols = ['♦', '★', '●', '■', '▲', '✿'];
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = `bold ${size * 0.6}px Roboto`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    symbols[tile.type],
                    cellX + this.cellSize / 2,
                    cellY + this.cellSize / 2
                );
                
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Draw selection highlight
        if (this.selectedTile && !this.animatingTiles && !this.fallingTiles) {
            const { x, y } = this.selectedTile;
            const cellX = this.offsetX + x * this.cellSize;
            const cellY = this.offsetY + y * this.cellSize;
            
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                cellX + 3,
                cellY + 3,
                this.cellSize - 6,
                this.cellSize - 6
            );
        }
        
        // Draw game over message
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', this.game.game.width / 2, this.game.game.height / 2 - 30);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Final Score: ${this.score}`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
}

/**
 * Load Match 3 game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadMatch3Game(game, onLoaded) {
    // Create a Match 3 scene
    const match3Scene = new Match3Scene(game);
    
    // Add scene to game
    game.addScene('match3', match3Scene);
    
    // Set as current scene
    game.setScene('match3');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}