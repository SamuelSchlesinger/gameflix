/**
 * Tetris Game
 * Classic block-stacking puzzle game
 */

/**
 * Tetris Scene
 * @class
 * @extends PureJS.Scene
 */
class TetrisScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = Math.min(
            game.game.width / this.gridWidth / 1.5,
            game.game.height / this.gridHeight / 1.2
        );
        this.grid = this.createEmptyGrid();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.gameOver = false;
        this.lastMoveTime = 0;
        this.moveDelay = 500; // milliseconds
        
        // Position the grid in the center
        this.offsetX = (game.game.width - this.gridWidth * this.cellSize) / 2;
        this.offsetY = (game.game.height - this.gridHeight * this.cellSize) / 2;
        
        // Create text entity for score
        const scoreText = game.createEntity({
            x: game.game.width / 2,
            y: this.offsetY / 2
        });
        
        scoreText.addComponent(new PureJS.TextComponent({
            text: 'Score: 0',
            font: 'bold 24px Roboto',
            color: '#fff'
        }));
        
        this.scoreText = scoreText;
        this.addEntity(scoreText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrow Keys: Move  |  Up: Rotate  |  Space: Drop',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Generate first pieces
        this.currentPiece = this.generateRandomPiece();
        this.nextPiece = this.generateRandomPiece();
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game state if needed
        if (this.gameOver) {
            this.grid = this.createEmptyGrid();
            this.score = 0;
            this.gameOver = false;
            this.currentPiece = this.generateRandomPiece();
            this.nextPiece = this.generateRandomPiece();
        }
    }
    
    /**
     * Create empty grid
     * @returns {Array} 2D array representing game grid
     */
    createEmptyGrid() {
        const grid = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                grid[y][x] = 0;
            }
        }
        
        return grid;
    }
    
    /**
     * Generate random tetris piece
     * @returns {Object} Piece data
     */
    generateRandomPiece() {
        // Tetris pieces shapes (0 = empty, 1 = filled)
        const pieces = [
            // I piece
            {
                shape: [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                color: '#00FFFF'
            },
            // J piece
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#0000FF'
            },
            // L piece
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#FF7F00'
            },
            // O piece
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#FFFF00'
            },
            // S piece
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#00FF00'
            },
            // T piece
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#800080'
            },
            // Z piece
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#FF0000'
            }
        ];
        
        // Select random piece
        const piece = JSON.parse(JSON.stringify(pieces[Math.floor(Math.random() * pieces.length)]));
        
        // Set starting position
        piece.x = Math.floor((this.gridWidth - piece.shape[0].length) / 2);
        piece.y = 0;
        
        return piece;
    }
    
    /**
     * Rotate piece clockwise
     * @param {Object} piece - Piece to rotate
     * @returns {Object} New rotated piece
     */
    rotatePiece(piece) {
        const newPiece = JSON.parse(JSON.stringify(piece));
        const size = newPiece.shape.length;
        
        // Create rotated shape
        const rotated = [];
        for (let y = 0; y < size; y++) {
            rotated[y] = [];
            for (let x = 0; x < size; x++) {
                rotated[y][x] = newPiece.shape[size - 1 - x][y];
            }
        }
        
        newPiece.shape = rotated;
        return newPiece;
    }
    
    /**
     * Check if piece position is valid
     * @param {Object} piece - Piece to check
     * @returns {boolean} Whether position is valid
     */
    isValidPosition(piece) {
        const shape = piece.shape;
        const pieceX = piece.x;
        const pieceY = piece.y;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const gridX = pieceX + x;
                    const gridY = pieceY + y;
                    
                    // Check boundaries
                    if (gridX < 0 || gridX >= this.gridWidth || 
                        gridY < 0 || gridY >= this.gridHeight) {
                        return false;
                    }
                    
                    // Check collision with existing blocks
                    if (gridY >= 0 && this.grid[gridY][gridX]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Lock piece into grid
     */
    lockPiece() {
        const shape = this.currentPiece.shape;
        const pieceX = this.currentPiece.x;
        const pieceY = this.currentPiece.y;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const gridX = pieceX + x;
                    const gridY = pieceY + y;
                    
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Clear completed lines
        this.clearLines();
        
        // Get next piece
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generateRandomPiece();
        
        // Check game over
        if (!this.isValidPosition(this.currentPiece)) {
            this.gameOver = true;
        }
    }
    
    /**
     * Clear completed lines
     */
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.gridHeight - 1; y >= 0; y--) {
            let lineComplete = true;
            
            for (let x = 0; x < this.gridWidth; x++) {
                if (!this.grid[y][x]) {
                    lineComplete = false;
                    break;
                }
            }
            
            if (lineComplete) {
                // Remove the line
                for (let y2 = y; y2 > 0; y2--) {
                    for (let x = 0; x < this.gridWidth; x++) {
                        this.grid[y2][x] = this.grid[y2 - 1][x];
                    }
                }
                
                // Clear the top line
                for (let x = 0; x < this.gridWidth; x++) {
                    this.grid[0][x] = 0;
                }
                
                // Line was removed, check this line again
                y++;
                linesCleared++;
            }
        }
        
        // Update score based on lines cleared
        if (linesCleared > 0) {
            // Score increases exponentially with more lines cleared at once
            this.score += Math.pow(2, linesCleared - 1) * 100;
            this.updateScoreText();
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
     * Move piece down
     */
    moveDown() {
        const newPiece = JSON.parse(JSON.stringify(this.currentPiece));
        newPiece.y++;
        
        if (this.isValidPosition(newPiece)) {
            this.currentPiece = newPiece;
        } else {
            this.lockPiece();
        }
    }
    
    /**
     * Move piece left
     */
    moveLeft() {
        const newPiece = JSON.parse(JSON.stringify(this.currentPiece));
        newPiece.x--;
        
        if (this.isValidPosition(newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    
    /**
     * Move piece right
     */
    moveRight() {
        const newPiece = JSON.parse(JSON.stringify(this.currentPiece));
        newPiece.x++;
        
        if (this.isValidPosition(newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    
    /**
     * Rotate piece
     */
    rotate() {
        const newPiece = this.rotatePiece(this.currentPiece);
        
        if (this.isValidPosition(newPiece)) {
            this.currentPiece = newPiece;
        }
    }
    
    /**
     * Hard drop piece
     */
    hardDrop() {
        while (true) {
            const newPiece = JSON.parse(JSON.stringify(this.currentPiece));
            newPiece.y++;
            
            if (this.isValidPosition(newPiece)) {
                this.currentPiece = newPiece;
            } else {
                break;
            }
        }
        
        this.lockPiece();
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        if (this.gameOver) {
            return;
        }
        
        // Handle input
        if (PureJS.Input.isKeyPressed('ArrowLeft')) {
            this.moveLeft();
        } else if (PureJS.Input.isKeyPressed('ArrowRight')) {
            this.moveRight();
        } else if (PureJS.Input.isKeyPressed('ArrowDown')) {
            this.moveDown();
        } else if (PureJS.Input.isKeyPressed('ArrowUp')) {
            this.rotate();
        } else if (PureJS.Input.isKeyPressed('Space')) {
            this.hardDrop();
        }
        
        // Auto move down on timer
        const now = performance.now();
        if (now - this.lastMoveTime > this.moveDelay) {
            this.moveDown();
            this.lastMoveTime = now;
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (score, etc.)
        super.render(ctx);
        
        // Draw grid background
        ctx.fillStyle = '#000';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.gridWidth * this.cellSize, 
            this.gridHeight * this.cellSize
        );
        
        // Draw grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(this.offsetX + x * this.cellSize, this.offsetY);
            ctx.lineTo(this.offsetX + x * this.cellSize, this.offsetY + this.gridHeight * this.cellSize);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(this.offsetX, this.offsetY + y * this.cellSize);
            ctx.lineTo(this.offsetX + this.gridWidth * this.cellSize, this.offsetY + y * this.cellSize);
            ctx.stroke();
        }
        
        // Draw locked blocks
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(ctx, x, y, this.grid[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece && !this.gameOver) {
            const shape = this.currentPiece.shape;
            const pieceX = this.currentPiece.x;
            const pieceY = this.currentPiece.y;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const gridX = pieceX + x;
                        const gridY = pieceY + y;
                        
                        // Only draw if within visible grid
                        if (gridY >= 0) {
                            this.drawBlock(ctx, gridX, gridY, this.currentPiece.color);
                        }
                    }
                }
            }
        }
        
        // Draw game over message
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', this.game.game.width / 2, this.game.game.height / 2 - 30);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Final Score: ${this.score}`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press any key to restart', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
    
    /**
     * Draw a single block
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} color - Block color
     */
    drawBlock(ctx, x, y, color) {
        const pixelX = this.offsetX + x * this.cellSize;
        const pixelY = this.offsetY + y * this.cellSize;
        
        // Draw filled block
        ctx.fillStyle = color;
        ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
        
        // Draw highlight (3D effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(pixelX, pixelY);
        ctx.lineTo(pixelX + this.cellSize, pixelY);
        ctx.lineTo(pixelX, pixelY + this.cellSize);
        ctx.fill();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(pixelX + this.cellSize, pixelY);
        ctx.lineTo(pixelX + this.cellSize, pixelY + this.cellSize);
        ctx.lineTo(pixelX, pixelY + this.cellSize);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
    }
}

/**
 * Load Tetris game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadTetrisGame(game, onLoaded) {
    // Create a Tetris scene
    const tetrisScene = new TetrisScene(game);
    
    // Add scene to game
    game.addScene('tetris', tetrisScene);
    
    // Set as current scene
    game.setScene('tetris');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}