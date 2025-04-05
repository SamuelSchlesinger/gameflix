/**
 * Snake Game
 * Classic snake game where player controls a growing snake
 */

/**
 * Snake Scene
 * @class
 * @extends PureJS.Scene
 */
class SnakeScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.cellSize = Math.min(
            game.game.width / this.gridWidth / 1.2,
            game.game.height / this.gridHeight / 1.2
        );
        
        // Position the grid in the center
        this.offsetX = (game.game.width - this.gridWidth * this.cellSize) / 2;
        this.offsetY = (game.game.height - this.gridHeight * this.cellSize) / 2;
        
        // Game state
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameOver = false;
        this.score = 0;
        this.speed = 200; // milliseconds per move
        this.lastMoveTime = 0;
        
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
            text: 'Arrow Keys: Change Direction',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize game
        this.reset();
    }
    
    /**
     * Reset game state
     */
    reset() {
        // Create initial snake (3 segments at center)
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) },
            { x: Math.floor(this.gridWidth / 2) - 1, y: Math.floor(this.gridHeight / 2) },
            { x: Math.floor(this.gridWidth / 2) - 2, y: Math.floor(this.gridHeight / 2) }
        ];
        
        // Reset direction
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // Place food
        this.placeFood();
        
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        this.updateScoreText();
        
        // Reset speed
        this.speed = 200;
        this.lastMoveTime = performance.now();
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game state if needed
        if (this.gameOver) {
            this.reset();
        }
    }
    
    /**
     * Place food at random position (not on snake)
     */
    placeFood() {
        // Get all available positions
        const available = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                // Check if position is not occupied by snake
                let occupied = false;
                for (const segment of this.snake) {
                    if (segment.x === x && segment.y === y) {
                        occupied = true;
                        break;
                    }
                }
                
                if (!occupied) {
                    available.push({ x, y });
                }
            }
        }
        
        // Pick random position from available
        if (available.length > 0) {
            const index = Math.floor(Math.random() * available.length);
            this.food = available[index];
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
     * Check if position is inside the snake
     */
    isPositionInSnake(x, y) {
        for (const segment of this.snake) {
            if (segment.x === x && segment.y === y) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Move the snake
     */
    moveSnake() {
        // Update direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = { x: this.snake[0].x, y: this.snake[0].y };
        
        switch (this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Check collision with walls
        if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
            this.gameOver = true;
            return;
        }
        
        // Check collision with self (except tail which will move)
        for (let i = 0; i < this.snake.length - 1; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver = true;
                return;
            }
        }
        
        // Check if eating food
        const eating = (head.x === this.food.x && head.y === this.food.y);
        
        // Move snake by adding new head
        this.snake.unshift(head);
        
        // If not eating, remove tail
        if (!eating) {
            this.snake.pop();
        } else {
            // Eating: increase score, place new food, increase speed
            this.score += 10;
            this.updateScoreText();
            this.placeFood();
            
            // Increase speed (cap at 50ms per move)
            this.speed = Math.max(50, this.speed - 5);
        }
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        if (this.gameOver) {
            // Check for restart
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter')) {
                this.reset();
            }
            return;
        }
        
        // Handle input for direction change
        if (PureJS.Input.isKeyPressed('ArrowUp') && this.direction !== 'down') {
            this.nextDirection = 'up';
        } else if (PureJS.Input.isKeyPressed('ArrowDown') && this.direction !== 'up') {
            this.nextDirection = 'down';
        } else if (PureJS.Input.isKeyPressed('ArrowLeft') && this.direction !== 'right') {
            this.nextDirection = 'left';
        } else if (PureJS.Input.isKeyPressed('ArrowRight') && this.direction !== 'left') {
            this.nextDirection = 'right';
        }
        
        // Move snake on timer
        const now = performance.now();
        if (now - this.lastMoveTime > this.speed) {
            this.moveSnake();
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
        ctx.fillStyle = '#111';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.gridWidth * this.cellSize, 
            this.gridHeight * this.cellSize
        );
        
        // Draw grid lines
        ctx.strokeStyle = '#222';
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
        
        // Draw food
        this.drawFood(ctx, this.food.x, this.food.y);
        
        // Draw snake
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            
            // Different colors for head and body
            if (i === 0) {
                this.drawSnakeHead(ctx, segment.x, segment.y);
            } else {
                this.drawSnakeSegment(ctx, segment.x, segment.y);
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
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
    
    /**
     * Draw snake head
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     */
    drawSnakeHead(ctx, x, y) {
        const pixelX = this.offsetX + x * this.cellSize;
        const pixelY = this.offsetY + y * this.cellSize;
        const size = this.cellSize;
        
        // Draw head (slightly larger and different color from body)
        ctx.fillStyle = '#4CAF50'; // Bright green
        ctx.fillRect(
            pixelX + size * 0.1, 
            pixelY + size * 0.1, 
            size * 0.8, 
            size * 0.8
        );
        
        // Draw eyes based on direction
        ctx.fillStyle = '#000';
        const eyeSize = size * 0.15;
        
        if (this.direction === 'right') {
            ctx.beginPath();
            ctx.arc(pixelX + size * 0.7, pixelY + size * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(pixelX + size * 0.7, pixelY + size * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.direction === 'left') {
            ctx.beginPath();
            ctx.arc(pixelX + size * 0.3, pixelY + size * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(pixelX + size * 0.3, pixelY + size * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.direction === 'up') {
            ctx.beginPath();
            ctx.arc(pixelX + size * 0.3, pixelY + size * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(pixelX + size * 0.7, pixelY + size * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.direction === 'down') {
            ctx.beginPath();
            ctx.arc(pixelX + size * 0.3, pixelY + size * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.arc(pixelX + size * 0.7, pixelY + size * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw snake segment
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     */
    drawSnakeSegment(ctx, x, y) {
        const pixelX = this.offsetX + x * this.cellSize;
        const pixelY = this.offsetY + y * this.cellSize;
        const size = this.cellSize;
        
        // Draw segment with rounded corners
        ctx.fillStyle = '#8BC34A'; // Light green
        ctx.beginPath();
        ctx.roundRect(
            pixelX + size * 0.1, 
            pixelY + size * 0.1, 
            size * 0.8, 
            size * 0.8,
            size * 0.2
        );
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(pixelX + size * 0.35, pixelY + size * 0.35, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw food
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     */
    drawFood(ctx, x, y) {
        const pixelX = this.offsetX + x * this.cellSize;
        const pixelY = this.offsetY + y * this.cellSize;
        const size = this.cellSize;
        
        // Draw apple
        ctx.fillStyle = '#F44336'; // Red
        ctx.beginPath();
        ctx.arc(
            pixelX + size / 2, 
            pixelY + size / 2, 
            size * 0.4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw stem
        ctx.fillStyle = '#795548'; // Brown
        ctx.fillRect(
            pixelX + size * 0.45, 
            pixelY + size * 0.2, 
            size * 0.1, 
            size * 0.15
        );
        
        // Draw leaf
        ctx.fillStyle = '#4CAF50'; // Green
        ctx.beginPath();
        ctx.ellipse(
            pixelX + size * 0.6, 
            pixelY + size * 0.25, 
            size * 0.15, 
            size * 0.1, 
            Math.PI / 4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            pixelX + size * 0.4, 
            pixelY + size * 0.4, 
            size * 0.1, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }
}

/**
 * Load Snake game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadSnakeGame(game, onLoaded) {
    // Create a Snake scene
    const snakeScene = new SnakeScene(game);
    
    // Add scene to game
    game.addScene('snake', snakeScene);
    
    // Set as current scene
    game.setScene('snake');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}