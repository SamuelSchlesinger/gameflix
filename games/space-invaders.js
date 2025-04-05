/**
 * Space Invaders Game
 * Classic alien shooting arcade game
 */

/**
 * Space Invaders Scene
 * @class
 * @extends PureJS.Scene
 */
class SpaceInvadersScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game area dimensions
        this.areaWidth = game.game.width * 0.9;
        this.areaHeight = game.game.height * 0.9;
        this.offsetX = (game.game.width - this.areaWidth) / 2;
        this.offsetY = (game.game.height - this.areaHeight) / 2;
        
        // Player ship
        this.player = {
            x: this.areaWidth / 2,
            y: this.areaHeight - 40,
            width: 40,
            height: 30,
            speed: 300,
            cooldown: 0,
            cooldownTime: 0.3 // seconds
        };
        
        // Enemy setup
        this.enemyRows = 5;
        this.enemyCols = 10;
        this.enemyWidth = 35;
        this.enemyHeight = 25;
        this.enemyPadding = 10;
        this.enemyStartY = 50;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;
        this.enemySpeed = 30;
        this.enemyDirection = 1; // 1 = right, -1 = left
        this.enemyDropAmount = 15;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = 0.7; // seconds between moves
        
        // Missiles and bombs
        this.playerMissiles = [];
        this.enemyBombs = [];
        this.bombChance = 0.01; // Chance per enemy per move
        
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
            text: 'Left/Right: Move Ship  |  Space: Fire',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize enemies
        this.initializeEnemies();
    }
    
    /**
     * Initialize enemies array
     */
    initializeEnemies() {
        this.enemies = [];
        
        // Enemy colors for different rows
        const colors = [
            '#F44336', // Red (top row)
            '#FF9800', // Orange
            '#FFEB3B', // Yellow
            '#4CAF50', // Green
            '#2196F3'  // Blue (bottom row)
        ];
        
        for (let r = 0; r < this.enemyRows; r++) {
            for (let c = 0; c < this.enemyCols; c++) {
                const enemyX = c * (this.enemyWidth + this.enemyPadding) + this.enemyPadding + this.enemyWidth / 2;
                const enemyY = r * (this.enemyHeight + this.enemyPadding) + this.enemyStartY;
                
                this.enemies.push({
                    x: enemyX,
                    y: enemyY,
                    width: this.enemyWidth,
                    height: this.enemyHeight,
                    row: r,
                    col: c,
                    alive: true,
                    color: colors[r]
                });
            }
        }
    }
    
    /**
     * Reset game state
     */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;
        this.enemySpeed = 30;
        this.enemyDirection = 1;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = 0.7;
        this.bombChance = 0.01;
        this.playerMissiles = [];
        this.enemyBombs = [];
        
        this.player.x = this.areaWidth / 2;
        this.player.cooldown = 0;
        
        this.initializeEnemies();
        this.updateScoreText();
        this.updateLivesText();
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
     * Fire player missile
     */
    fireMissile() {
        if (this.player.cooldown <= 0) {
            this.playerMissiles.push({
                x: this.player.x,
                y: this.player.y - this.player.height / 2,
                width: 3,
                height: 15,
                speed: 500
            });
            
            this.player.cooldown = this.player.cooldownTime;
        }
    }
    
    /**
     * Check for collisions between missiles and enemies
     */
    checkMissileCollisions() {
        for (let i = this.playerMissiles.length - 1; i >= 0; i--) {
            const missile = this.playerMissiles[i];
            
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                
                if (enemy.alive && this.checkCollision(
                    missile.x - missile.width / 2, 
                    missile.y - missile.height / 2,
                    missile.width,
                    missile.height,
                    enemy.x - enemy.width / 2,
                    enemy.y - enemy.height / 2,
                    enemy.width,
                    enemy.height
                )) {
                    // Hit enemy
                    enemy.alive = false;
                    this.playerMissiles.splice(i, 1);
                    
                    // Update score (higher rows worth more)
                    this.score += (this.enemyRows - enemy.row) * 10;
                    this.updateScoreText();
                    
                    // Check for level completion
                    this.checkLevelComplete();
                    
                    break;
                }
            }
        }
    }
    
    /**
     * Check if all enemies are destroyed
     */
    checkLevelComplete() {
        let enemiesAlive = 0;
        
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                enemiesAlive++;
            }
        }
        
        if (enemiesAlive === 0) {
            this.startNextLevel();
        }
    }
    
    /**
     * Start next level with more difficult enemies
     */
    startNextLevel() {
        this.level++;
        this.enemyMoveInterval = Math.max(0.1, this.enemyMoveInterval - 0.1);
        this.enemySpeed += 10;
        this.bombChance += 0.005;
        
        this.playerMissiles = [];
        this.enemyBombs = [];
        this.enemyDirection = 1;
        this.enemyMoveTimer = 0;
        
        this.initializeEnemies();
    }
    
    /**
     * Check for collision between two rectangles
     */
    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    /**
     * Move enemy formation
     */
    moveEnemies() {
        let hitEdge = false;
        let lowestEnemy = 0;
        
        // Check if any enemies hit the edge
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                const enemyX = enemy.x + this.enemyDirection * this.enemySpeed;
                
                if (
                    enemyX - enemy.width / 2 < 0 || 
                    enemyX + enemy.width / 2 > this.areaWidth
                ) {
                    hitEdge = true;
                }
                
                // Track lowest enemy for game over condition
                if (enemy.y + enemy.height / 2 > lowestEnemy) {
                    lowestEnemy = enemy.y + enemy.height / 2;
                }
            }
        }
        
        // Move enemies based on edge detection
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                if (hitEdge) {
                    // Change direction and move down
                    enemy.y += this.enemyDropAmount;
                    this.enemyDirection *= -1;
                } else {
                    // Move horizontally
                    enemy.x += this.enemyDirection * this.enemySpeed;
                }
                
                // Random chance to drop bomb
                if (Math.random() < this.bombChance) {
                    this.dropEnemyBomb(enemy);
                }
            }
        }
        
        // Check if enemies reached the bottom (game over)
        if (lowestEnemy >= this.player.y - this.player.height) {
            this.gameOver = true;
        }
    }
    
    /**
     * Drop bomb from enemy
     */
    dropEnemyBomb(enemy) {
        // Check if this enemy has clear path to drop bomb
        // Only allow enemies at the bottom of their column to drop bombs
        let canDrop = true;
        const col = enemy.col;
        
        for (const otherEnemy of this.enemies) {
            if (
                otherEnemy.alive && 
                otherEnemy.col === col && 
                otherEnemy.row > enemy.row
            ) {
                canDrop = false;
                break;
            }
        }
        
        if (canDrop) {
            this.enemyBombs.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: 5,
                height: 10,
                speed: 200 + this.level * 20
            });
        }
    }
    
    /**
     * Check for collisions between bombs and player
     */
    checkBombCollisions() {
        for (let i = this.enemyBombs.length - 1; i >= 0; i--) {
            const bomb = this.enemyBombs[i];
            
            if (this.checkCollision(
                bomb.x - bomb.width / 2,
                bomb.y - bomb.height / 2,
                bomb.width,
                bomb.height,
                this.player.x - this.player.width / 2,
                this.player.y - this.player.height / 2,
                this.player.width,
                this.player.height
            )) {
                // Hit player
                this.enemyBombs.splice(i, 1);
                this.lives--;
                this.updateLivesText();
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                }
            }
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
        
        // Handle player cooldown
        if (this.player.cooldown > 0) {
            this.player.cooldown -= dt;
        }
        
        // Control player ship
        if (PureJS.Input.isKeyDown('ArrowLeft')) {
            this.player.x -= this.player.speed * dt;
            if (this.player.x - this.player.width / 2 < 0) {
                this.player.x = this.player.width / 2;
            }
        } else if (PureJS.Input.isKeyDown('ArrowRight')) {
            this.player.x += this.player.speed * dt;
            if (this.player.x + this.player.width / 2 > this.areaWidth) {
                this.player.x = this.areaWidth - this.player.width / 2;
            }
        }
        
        // Fire missiles
        if (PureJS.Input.isKeyPressed('Space')) {
            this.fireMissile();
        }
        
        // Move player missiles
        for (let i = this.playerMissiles.length - 1; i >= 0; i--) {
            const missile = this.playerMissiles[i];
            missile.y -= missile.speed * dt;
            
            // Remove missiles that go off screen
            if (missile.y + missile.height < 0) {
                this.playerMissiles.splice(i, 1);
            }
        }
        
        // Move enemy bombs
        for (let i = this.enemyBombs.length - 1; i >= 0; i--) {
            const bomb = this.enemyBombs[i];
            bomb.y += bomb.speed * dt;
            
            // Remove bombs that go off screen
            if (bomb.y - bomb.height > this.areaHeight) {
                this.enemyBombs.splice(i, 1);
            }
        }
        
        // Check collisions
        this.checkMissileCollisions();
        this.checkBombCollisions();
        
        // Enemy movement on timer
        this.enemyMoveTimer += dt;
        if (this.enemyMoveTimer >= this.enemyMoveInterval) {
            this.moveEnemies();
            this.enemyMoveTimer = 0;
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (score, lives, etc.)
        super.render(ctx);
        
        // Draw starfield background
        ctx.fillStyle = '#000';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw stars
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 100; i++) {
            const x = this.offsetX + (Math.sin(i * 932.37) * 0.5 + 0.5) * this.areaWidth;
            const y = this.offsetY + (Math.cos(i * 342.87) * 0.5 + 0.5) * this.areaHeight;
            const size = (Math.sin(i * 0.37) * 0.5 + 0.5) * 2 + 1;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw player ship
        const playerX = this.offsetX + this.player.x;
        const playerY = this.offsetY + this.player.y;
        
        ctx.fillStyle = '#2ecc71';
        
        // Ship body
        ctx.beginPath();
        ctx.moveTo(playerX, playerY - this.player.height / 2);
        ctx.lineTo(playerX + this.player.width / 2, playerY + this.player.height / 2);
        ctx.lineTo(playerX - this.player.width / 2, playerY + this.player.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Ship cockpit
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(playerX, playerY, this.player.width / 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ship engines
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.rect(
            playerX - this.player.width / 4, 
            playerY + this.player.height / 4,
            this.player.width / 8,
            this.player.height / 4
        );
        ctx.rect(
            playerX + this.player.width / 8, 
            playerY + this.player.height / 4,
            this.player.width / 8,
            this.player.height / 4
        );
        ctx.fill();
        
        // Draw player missiles
        ctx.fillStyle = '#2ecc71';
        for (const missile of this.playerMissiles) {
            ctx.fillRect(
                this.offsetX + missile.x - missile.width / 2,
                this.offsetY + missile.y - missile.height / 2,
                missile.width,
                missile.height
            );
        }
        
        // Draw enemy bombs
        ctx.fillStyle = '#e74c3c';
        for (const bomb of this.enemyBombs) {
            ctx.beginPath();
            ctx.arc(
                this.offsetX + bomb.x,
                this.offsetY + bomb.y,
                bomb.width,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                const enemyX = this.offsetX + enemy.x;
                const enemyY = this.offsetY + enemy.y;
                
                // Enemy body (different shape based on row)
                ctx.fillStyle = enemy.color;
                
                if (enemy.row % 3 === 0) {
                    // Crab-like shape
                    ctx.beginPath();
                    ctx.ellipse(
                        enemyX,
                        enemyY,
                        enemy.width / 2,
                        enemy.height / 2.5,
                        0,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Claws
                    ctx.beginPath();
                    ctx.arc(
                        enemyX - enemy.width / 2,
                        enemyY,
                        enemy.width / 4,
                        Math.PI / 2,
                        Math.PI * 1.5
                    );
                    ctx.arc(
                        enemyX + enemy.width / 2,
                        enemyY,
                        enemy.width / 4,
                        -Math.PI / 2,
                        Math.PI / 2
                    );
                    ctx.fill();
                    
                } else if (enemy.row % 3 === 1) {
                    // Squid-like shape
                    ctx.beginPath();
                    ctx.ellipse(
                        enemyX,
                        enemyY - enemy.height / 6,
                        enemy.width / 2.5,
                        enemy.height / 3,
                        0,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Tentacles
                    for (let i = -2; i <= 2; i++) {
                        if (i !== 0) {
                            ctx.beginPath();
                            ctx.rect(
                                enemyX + i * enemy.width / 5 - enemy.width / 20,
                                enemyY,
                                enemy.width / 10,
                                enemy.height / 2
                            );
                            ctx.fill();
                        }
                    }
                    
                } else {
                    // Saucer-like shape
                    ctx.beginPath();
                    ctx.ellipse(
                        enemyX,
                        enemyY,
                        enemy.width / 2,
                        enemy.height / 4,
                        0,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Dome
                    ctx.beginPath();
                    ctx.arc(
                        enemyX,
                        enemyY - enemy.height / 8,
                        enemy.width / 3,
                        Math.PI,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
                
                // Eyes for all enemy types
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(
                    enemyX - enemy.width / 5,
                    enemyY - enemy.height / 8,
                    enemy.width / 12,
                    0,
                    Math.PI * 2
                );
                ctx.arc(
                    enemyX + enemy.width / 5,
                    enemyY - enemy.height / 8,
                    enemy.width / 12,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
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
}

/**
 * Load Space Invaders game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadSpaceInvadersGame(game, onLoaded) {
    // Create a Space Invaders scene
    const spaceInvadersScene = new SpaceInvadersScene(game);
    
    // Add scene to game
    game.addScene('spaceinvaders', spaceInvadersScene);
    
    // Set as current scene
    game.setScene('spaceinvaders');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}