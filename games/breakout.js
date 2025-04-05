/**
 * Breakout Game
 * Classic brick-breaking game with paddle and ball
 */

/**
 * Breakout Scene
 * @class
 * @extends PureJS.Scene
 */
class BreakoutScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game area dimensions
        this.areaWidth = game.game.width * 0.8;
        this.areaHeight = game.game.height * 0.8;
        this.offsetX = (game.game.width - this.areaWidth) / 2;
        this.offsetY = (game.game.height - this.areaHeight) / 2;
        
        // Game objects
        this.paddle = {
            x: this.areaWidth / 2,
            y: this.areaHeight - 30,
            width: 100,
            height: 15,
            speed: 300
        };
        
        this.ball = {
            x: this.areaWidth / 2,
            y: this.areaHeight / 2,
            radius: 8,
            speedX: 200,
            speedY: -200
        };
        
        // Brick layout
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = this.areaWidth / this.brickColumnCount - 8;
        this.brickHeight = 25;
        this.brickPadding = 8;
        this.brickOffsetTop = 40;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameStarted = false;
        this.gameWon = false;
        
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
        
        // Create text entity for lives
        const livesText = game.createEntity({
            x: game.game.width - this.offsetX - 100,
            y: this.offsetY / 2
        });
        
        livesText.addComponent(new PureJS.TextComponent({
            text: 'Lives: 3',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'right'
        }));
        
        this.livesText = livesText;
        this.addEntity(livesText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Left/Right: Move Paddle  |  Space: Launch Ball',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize bricks
        this.initializeBricks();
    }
    
    /**
     * Initialize brick layout
     */
    initializeBricks() {
        this.bricks = [];
        
        // Brick colors for each row
        const colors = [
            '#F44336', // Red
            '#FF9800', // Orange
            '#FFEB3B', // Yellow
            '#4CAF50', // Green
            '#2196F3'  // Blue
        ];
        
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                const brickX = c * (this.brickWidth + this.brickPadding) + this.brickPadding;
                const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop + this.brickPadding;
                
                this.bricks[c][r] = {
                    x: brickX,
                    y: brickY,
                    width: this.brickWidth,
                    height: this.brickHeight,
                    status: 1, // 1 = active, 0 = broken
                    color: colors[r]
                };
            }
        }
    }
    
    /**
     * Reset ball position
     */
    resetBall() {
        this.ball.x = this.paddle.x;
        this.ball.y = this.paddle.y - this.ball.radius - 1;
        this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 200;
        this.ball.speedY = -200;
        this.gameStarted = false;
    }
    
    /**
     * Reset game state
     */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameWon = false;
        this.paddle.x = this.areaWidth / 2;
        this.resetBall();
        this.initializeBricks();
        this.updateScoreText();
        this.updateLivesText();
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game state if needed
        if (this.gameOver || this.gameWon) {
            this.reset();
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
     * Update lives text
     */
    updateLivesText() {
        const textComp = this.livesText.getComponent(PureJS.TextComponent);
        textComp.text = `Lives: ${this.lives}`;
    }
    
    /**
     * Check collision between ball and paddle
     */
    checkPaddleCollision() {
        if (
            this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x + this.ball.radius > this.paddle.x - this.paddle.width / 2 &&
            this.ball.x - this.ball.radius < this.paddle.x + this.paddle.width / 2
        ) {
            // Calculate bounce angle based on where ball hit the paddle
            const hitPosition = (this.ball.x - this.paddle.x) / (this.paddle.width / 2);
            const angle = hitPosition * Math.PI / 3; // Max 60 degrees
            
            const speed = Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY);
            this.ball.speedX = Math.sin(angle) * speed;
            this.ball.speedY = -Math.cos(angle) * speed;
            
            // Ensure ball is above paddle after collision
            this.ball.y = this.paddle.y - this.ball.radius - 1;
        }
    }
    
    /**
     * Check collision between ball and bricks
     */
    checkBrickCollision() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                
                if (brick.status === 1) {
                    const brickLeft = this.offsetX + brick.x;
                    const brickRight = brickLeft + brick.width;
                    const brickTop = this.offsetY + brick.y;
                    const brickBottom = brickTop + brick.height;
                    
                    const ballLeft = this.offsetX + this.ball.x - this.ball.radius;
                    const ballRight = this.offsetX + this.ball.x + this.ball.radius;
                    const ballTop = this.offsetY + this.ball.y - this.ball.radius;
                    const ballBottom = this.offsetY + this.ball.y + this.ball.radius;
                    
                    if (
                        ballRight > brickLeft &&
                        ballLeft < brickRight &&
                        ballBottom > brickTop &&
                        ballTop < brickBottom
                    ) {
                        // Determine collision side and bounce
                        const overlapLeft = ballRight - brickLeft;
                        const overlapRight = brickRight - ballLeft;
                        const overlapTop = ballBottom - brickTop;
                        const overlapBottom = brickBottom - ballTop;
                        
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                        
                        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                            this.ball.speedX = -this.ball.speedX;
                        } else {
                            this.ball.speedY = -this.ball.speedY;
                        }
                        
                        // Mark brick as broken
                        brick.status = 0;
                        
                        // Increase score
                        this.score += 10;
                        this.updateScoreText();
                        
                        // Check for win condition
                        this.checkWinCondition();
                        
                        // Only handle one collision per frame
                        return;
                    }
                }
            }
        }
    }
    
    /**
     * Check if player has won (all bricks destroyed)
     */
    checkWinCondition() {
        let bricksRemaining = 0;
        
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    bricksRemaining++;
                }
            }
        }
        
        if (bricksRemaining === 0) {
            this.gameWon = true;
        }
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        if (this.gameOver || this.gameWon) {
            // Check for restart
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter')) {
                this.reset();
            }
            return;
        }
        
        // Control paddle
        if (PureJS.Input.isKeyDown('ArrowLeft')) {
            this.paddle.x -= this.paddle.speed * dt;
            if (this.paddle.x - this.paddle.width / 2 < 0) {
                this.paddle.x = this.paddle.width / 2;
            }
        } else if (PureJS.Input.isKeyDown('ArrowRight')) {
            this.paddle.x += this.paddle.speed * dt;
            if (this.paddle.x + this.paddle.width / 2 > this.areaWidth) {
                this.paddle.x = this.areaWidth - this.paddle.width / 2;
            }
        }
        
        // Launch ball
        if (!this.gameStarted && PureJS.Input.isKeyPressed('Space')) {
            this.gameStarted = true;
        }
        
        // Keep ball on paddle until launched
        if (!this.gameStarted) {
            this.ball.x = this.paddle.x;
            this.ball.y = this.paddle.y - this.ball.radius - 1;
            return;
        }
        
        // Move ball
        this.ball.x += this.ball.speedX * dt;
        this.ball.y += this.ball.speedY * dt;
        
        // Ball collision with walls
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.speedX = -this.ball.speedX;
        } else if (this.ball.x + this.ball.radius > this.areaWidth) {
            this.ball.x = this.areaWidth - this.ball.radius;
            this.ball.speedX = -this.ball.speedX;
        }
        
        // Ball collision with ceiling
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.speedY = -this.ball.speedY;
        }
        
        // Ball falls below paddle
        if (this.ball.y - this.ball.radius > this.areaHeight) {
            this.lives--;
            this.updateLivesText();
            
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.resetBall();
            }
        }
        
        // Check collisions
        this.checkPaddleCollision();
        this.checkBrickCollision();
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (score, lives, etc.)
        super.render(ctx);
        
        // Draw game area background
        ctx.fillStyle = '#111';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw bricks
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                
                if (brick.status === 1) {
                    const brickX = this.offsetX + brick.x;
                    const brickY = this.offsetY + brick.y;
                    
                    // Draw brick
                    ctx.fillStyle = brick.color;
                    ctx.fillRect(brickX, brickY, brick.width, brick.height);
                    
                    // Add highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(brickX, brickY, brick.width, 5);
                    
                    // Add shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fillRect(brickX, brickY + brick.height - 5, brick.width, 5);
                    
                    // Add border
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(brickX, brickY, brick.width, brick.height);
                }
            }
        }
        
        // Draw paddle
        const paddleX = this.offsetX + this.paddle.x - this.paddle.width / 2;
        const paddleY = this.offsetY + this.paddle.y;
        
        // Paddle gradient
        const paddleGradient = ctx.createLinearGradient(
            paddleX, paddleY,
            paddleX, paddleY + this.paddle.height
        );
        paddleGradient.addColorStop(0, '#3498db');
        paddleGradient.addColorStop(1, '#2980b9');
        
        ctx.fillStyle = paddleGradient;
        ctx.fillRect(
            paddleX,
            paddleY,
            this.paddle.width,
            this.paddle.height
        );
        
        // Paddle highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(
            paddleX,
            paddleY,
            this.paddle.width,
            this.paddle.height / 3
        );
        
        // Draw ball
        const ballX = this.offsetX + this.ball.x;
        const ballY = this.offsetY + this.ball.y;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(
            ballX,
            ballY,
            this.ball.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Ball highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(
            ballX - this.ball.radius / 3,
            ballY - this.ball.radius / 3,
            this.ball.radius / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
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
        
        // Draw win message
        if (this.gameWon) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('YOU WIN!', this.game.game.width / 2, this.game.game.height / 2 - 30);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Final Score: ${this.score}`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to play again', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
}

/**
 * Load Breakout game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadBreakoutGame(game, onLoaded) {
    // Create a Breakout scene
    const breakoutScene = new BreakoutScene(game);
    
    // Add scene to game
    game.addScene('breakout', breakoutScene);
    
    // Set as current scene
    game.setScene('breakout');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}