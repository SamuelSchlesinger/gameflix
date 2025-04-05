/**
 * Platformer Game
 * A classic platformer game with running and jumping mechanics
 */

/**
 * Platformer Scene
 * @class
 * @extends PureJS.Scene
 */
class PlatformerScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game configuration
        this.tileSize = 32;
        this.gravity = 1500; // Gravity force
        this.levelWidth = 40; // Level width in tiles
        this.levelHeight = 15; // Level height in tiles
        
        // Game state
        this.player = {
            x: 100,
            y: 300,
            width: 32,
            height: 48,
            velocityX: 0,
            velocityY: 0,
            jumpForce: -600,
            moveSpeed: 300,
            isJumping: false,
            isOnGround: false,
            direction: 'right',
            animState: 'idle'
        };
        
        this.camera = {
            x: 0,
            y: 0
        };
        
        this.score = 0;
        this.gameOver = false;
        this.levelComplete = false;
        
        // Define level layout
        this.createLevel();
        
        // Create text entity for score
        const scoreText = game.createEntity({
            x: 100,
            y: 30
        });
        
        scoreText.addComponent(new PureJS.TextComponent({
            text: 'Score: 0',
            font: 'bold 24px Roboto',
            color: '#fff',
            align: 'left'
        }));
        
        this.scoreText = scoreText;
        this.addEntity(scoreText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - 20
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrow Keys: Move | Space: Jump',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
    }
    
    /**
     * Create the level layout
     */
    createLevel() {
        // Create level layout using tiles
        // 0 = empty
        // 1 = ground/platform
        // 2 = collectible coin
        // 3 = enemy
        // 4 = exit
        
        this.level = [];
        
        // Initialize empty level
        for (let y = 0; y < this.levelHeight; y++) {
            this.level[y] = [];
            for (let x = 0; x < this.levelWidth; x++) {
                this.level[y][x] = 0;
            }
        }
        
        // Add ground
        for (let x = 0; x < this.levelWidth; x++) {
            this.level[this.levelHeight - 1][x] = 1;
        }
        
        // Add platforms
        // First platform
        for (let x = 5; x < 10; x++) {
            this.level[11][x] = 1;
        }
        
        // Second platform
        for (let x = 12; x < 16; x++) {
            this.level[9][x] = 1;
        }
        
        // Third platform
        for (let x = 18; x < 22; x++) {
            this.level[7][x] = 1;
        }
        
        // Fourth platform
        for (let x = 24; x < 28; x++) {
            this.level[5][x] = 1;
        }
        
        // Final platform with exit
        for (let x = 30; x < 35; x++) {
            this.level[3][x] = 1;
        }
        this.level[2][32] = 4; // Exit door
        
        // Add coins
        this.level[10][7] = 2;
        this.level[8][14] = 2;
        this.level[6][20] = 2;
        this.level[4][26] = 2;
        this.level[1][32] = 2;
        
        // Add some extra coins for challenge
        this.level[this.levelHeight - 2][15] = 2;
        this.level[this.levelHeight - 2][28] = 2;
        this.level[9][25] = 2;
        this.level[6][12] = 2;
        
        // Add enemies
        this.level[this.levelHeight - 2][18] = 3;
        this.level[this.levelHeight - 2][25] = 3;
        this.level[10][8] = 3;
        this.level[8][15] = 3;
        this.level[4][25] = 3;
        
        // Initialize coins and enemies
        this.coins = [];
        this.enemies = [];
        
        for (let y = 0; y < this.levelHeight; y++) {
            for (let x = 0; x < this.levelWidth; x++) {
                if (this.level[y][x] === 2) {
                    this.coins.push({
                        x: x * this.tileSize + this.tileSize / 2,
                        y: y * this.tileSize + this.tileSize / 2,
                        width: 16,
                        height: 16,
                        collected: false,
                        rotation: 0
                    });
                } else if (this.level[y][x] === 3) {
                    this.enemies.push({
                        x: x * this.tileSize + this.tileSize / 2,
                        y: y * this.tileSize + this.tileSize / 2,
                        width: 32,
                        height: 32,
                        velocityX: 50 * (Math.random() > 0.5 ? 1 : -1),
                        direction: Math.random() > 0.5 ? 'right' : 'left',
                        patrolStart: (x - 2) * this.tileSize,
                        patrolEnd: (x + 2) * this.tileSize
                    });
                }
            }
        }
    }
    
    /**
     * Reset game state
     */
    reset() {
        // Reset player
        this.player = {
            x: 100,
            y: 300,
            width: 32,
            height: 48,
            velocityX: 0,
            velocityY: 0,
            jumpForce: -600,
            moveSpeed: 300,
            isJumping: false,
            isOnGround: false,
            direction: 'right',
            animState: 'idle'
        };
        
        // Reset camera
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Reset game state
        this.score = 0;
        this.gameOver = false;
        this.levelComplete = false;
        this.updateScoreText();
        
        // Recreate level
        this.createLevel();
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game state if needed
        if (this.gameOver || this.levelComplete) {
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
     * Check if a tile at x,y is solid
     */
    isSolidTile(x, y) {
        // Convert world coordinates to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Check if out of bounds (treat as solid)
        if (tileX < 0 || tileX >= this.levelWidth || tileY < 0 || tileY >= this.levelHeight) {
            return true;
        }
        
        // Check if tile is solid (ground/platform)
        return this.level[tileY][tileX] === 1;
    }
    
    /**
     * Check if player is colliding with a tile
     */
    checkTileCollision(x, y, width, height) {
        // Check four corners of the entity
        const topLeft = this.isSolidTile(x, y);
        const topRight = this.isSolidTile(x + width, y);
        const bottomLeft = this.isSolidTile(x, y + height);
        const bottomRight = this.isSolidTile(x + width, y + height);
        
        return {
            top: topLeft || topRight,
            bottom: bottomLeft || bottomRight,
            left: topLeft || bottomLeft,
            right: topRight || bottomRight,
            any: topLeft || topRight || bottomLeft || bottomRight
        };
    }
    
    /**
     * Check collision between two rectangles
     */
    checkCollision(r1, r2) {
        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y
        );
    }
    
    /**
     * Update the camera position to follow the player
     */
    updateCamera() {
        // Target camera position (center on player)
        const targetX = this.player.x - this.game.game.width / 2;
        const targetY = this.player.y - this.game.game.height / 2;
        
        // Clamp camera to level bounds
        const maxX = this.levelWidth * this.tileSize - this.game.game.width;
        
        this.camera.x = Math.max(0, Math.min(maxX, targetX));
        // Keep vertical camera position fixed for this simple platformer
        this.camera.y = 0;
    }
    
    /**
     * Update player movement and physics
     */
    updatePlayer(dt) {
        // Handle input
        let moveInput = 0;
        
        if (PureJS.Input.isKeyDown('ArrowLeft')) {
            moveInput = -1;
            this.player.direction = 'left';
        } else if (PureJS.Input.isKeyDown('ArrowRight')) {
            moveInput = 1;
            this.player.direction = 'right';
        }
        
        // Set player horizontal velocity based on input
        this.player.velocityX = moveInput * this.player.moveSpeed;
        
        // Apply gravity
        this.player.velocityY += this.gravity * dt;
        
        // Check if player is on ground before jump
        const bottomCollision = this.checkTileCollision(
            this.player.x - this.player.width / 2, 
            this.player.y + 1, 
            this.player.width, 
            this.player.height
        );
        
        this.player.isOnGround = bottomCollision.bottom;
        
        // Handle jumping
        if (this.player.isOnGround) {
            this.player.isJumping = false;
            
            // Allow jump if on ground and space is pressed
            if (PureJS.Input.isKeyPressed('Space')) {
                this.player.velocityY = this.player.jumpForce;
                this.player.isJumping = true;
                this.player.isOnGround = false;
            }
        }
        
        // Apply velocity to position, handling collision for X and Y separately
        let newX = this.player.x + this.player.velocityX * dt;
        
        // Check horizontal collision
        const horizontalCollision = this.checkTileCollision(
            newX - this.player.width / 2, 
            this.player.y - this.player.height / 2, 
            this.player.width, 
            this.player.height
        );
        
        if (this.player.velocityX < 0 && horizontalCollision.left) {
            // Colliding with left wall
            newX = Math.floor(newX / this.tileSize) * this.tileSize + this.player.width / 2;
            this.player.velocityX = 0;
        } else if (this.player.velocityX > 0 && horizontalCollision.right) {
            // Colliding with right wall
            newX = Math.floor(newX / this.tileSize) * this.tileSize + this.tileSize - this.player.width / 2;
            this.player.velocityX = 0;
        }
        
        // Update X position
        this.player.x = newX;
        
        // Now handle Y movement with collision
        let newY = this.player.y + this.player.velocityY * dt;
        
        // Check vertical collision
        const verticalCollision = this.checkTileCollision(
            this.player.x - this.player.width / 2, 
            newY - this.player.height / 2, 
            this.player.width, 
            this.player.height
        );
        
        if (this.player.velocityY < 0 && verticalCollision.top) {
            // Colliding with ceiling
            newY = Math.floor(newY / this.tileSize) * this.tileSize + this.player.height / 2;
            this.player.velocityY = 0;
        } else if (this.player.velocityY > 0 && verticalCollision.bottom) {
            // Colliding with floor
            newY = Math.floor(newY / this.tileSize) * this.tileSize + this.tileSize - this.player.height / 2;
            this.player.velocityY = 0;
            this.player.isOnGround = true;
            this.player.isJumping = false;
        }
        
        // Update Y position
        this.player.y = newY;
        
        // Update animation state
        if (!this.player.isOnGround) {
            this.player.animState = 'jump';
        } else if (Math.abs(this.player.velocityX) > 1) {
            this.player.animState = 'run';
        } else {
            this.player.animState = 'idle';
        }
        
        // Check for level boundaries
        if (this.player.y > this.levelHeight * this.tileSize) {
            this.gameOver = true;
        }
    }
    
    /**
     * Update enemies
     */
    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            // Move enemy
            enemy.x += enemy.velocityX * dt;
            
            // Patrol behavior - reverse direction at patrol points
            if (enemy.x <= enemy.patrolStart) {
                enemy.velocityX = Math.abs(enemy.velocityX);
                enemy.direction = 'right';
            } else if (enemy.x >= enemy.patrolEnd) {
                enemy.velocityX = -Math.abs(enemy.velocityX);
                enemy.direction = 'left';
            }
            
            // Check for collision with player
            const playerRect = {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };
            
            const enemyRect = {
                x: enemy.x - enemy.width / 2,
                y: enemy.y - enemy.height / 2,
                width: enemy.width,
                height: enemy.height
            };
            
            if (this.checkCollision(playerRect, enemyRect)) {
                // Check if player is stomping on the enemy from above
                if (this.player.velocityY > 0 && this.player.y < enemy.y - enemy.height / 4) {
                    // Remove the enemy
                    enemy.dead = true;
                    
                    // Bounce the player
                    this.player.velocityY = this.player.jumpForce * 0.6;
                    
                    // Add score
                    this.score += 50;
                    this.updateScoreText();
                } else {
                    // Player is hit by enemy
                    this.gameOver = true;
                }
            }
        }
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => !enemy.dead);
    }
    
    /**
     * Update coins
     */
    updateCoins(dt) {
        // Rotate coins for animation
        for (const coin of this.coins) {
            if (!coin.collected) {
                // Rotate coin
                coin.rotation += 5 * dt;
                
                // Check for collision with player
                const playerRect = {
                    x: this.player.x - this.player.width / 2,
                    y: this.player.y - this.player.height / 2,
                    width: this.player.width,
                    height: this.player.height
                };
                
                const coinRect = {
                    x: coin.x - coin.width / 2,
                    y: coin.y - coin.height / 2,
                    width: coin.width,
                    height: coin.height
                };
                
                if (this.checkCollision(playerRect, coinRect)) {
                    coin.collected = true;
                    this.score += 100;
                    this.updateScoreText();
                }
            }
        }
    }
    
    /**
     * Check if player has reached the exit
     */
    checkExit() {
        // Find the exit door in the level
        let exitX = 0;
        let exitY = 0;
        
        for (let y = 0; y < this.levelHeight; y++) {
            for (let x = 0; x < this.levelWidth; x++) {
                if (this.level[y][x] === 4) {
                    exitX = x * this.tileSize + this.tileSize / 2;
                    exitY = y * this.tileSize + this.tileSize / 2;
                }
            }
        }
        
        // Create rectangles for collision check
        const playerRect = {
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        };
        
        const exitRect = {
            x: exitX - this.tileSize / 2,
            y: exitY - this.tileSize / 2,
            width: this.tileSize,
            height: this.tileSize
        };
        
        // Check for collision
        if (this.checkCollision(playerRect, exitRect)) {
            this.levelComplete = true;
        }
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        if (this.gameOver || this.levelComplete) {
            // Check for restart
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter')) {
                this.reset();
            }
            return;
        }
        
        // Update player
        this.updatePlayer(dt);
        
        // Update enemies
        this.updateEnemies(dt);
        
        // Update coins
        this.updateCoins(dt);
        
        // Check exit
        this.checkExit();
        
        // Update camera position to follow player
        this.updateCamera();
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Fill background - sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.game.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue at top
        gradient.addColorStop(1, '#E0F7FA'); // Lighter blue at bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
        
        // Draw background mountains (decorative)
        this.drawMountains(ctx);
        
        // Apply camera offset for all game elements
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render level tiles
        this.renderLevel(ctx);
        
        // Render coins
        this.renderCoins(ctx);
        
        // Render enemies
        this.renderEnemies(ctx);
        
        // Render player
        this.renderPlayer(ctx);
        
        // Restore original translation
        ctx.restore();
        
        // Render entities (score, etc.) - these don't move with camera
        super.render(ctx);
        
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
        
        // Draw level complete message
        if (this.levelComplete) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LEVEL COMPLETE!', this.game.game.width / 2, this.game.game.height / 2 - 30);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Final Score: ${this.score}`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
    
    /**
     * Draw decorative mountains in the background
     */
    drawMountains(ctx) {
        ctx.fillStyle = '#9C27B0'; // Purple mountains
        
        // Draw several mountains with parallax effect
        for (let i = 0; i < 5; i++) {
            const parallaxFactor = 0.2 + (i * 0.1);
            const mountainX = -this.camera.x * parallaxFactor;
            const mountainWidth = this.game.game.width / 2;
            const mountainHeight = 150 + (i * 20);
            const mountainY = this.game.game.height - mountainHeight;
            
            ctx.beginPath();
            ctx.moveTo(mountainX + (i * 200), this.game.game.height);
            ctx.lineTo(mountainX + (i * 200) + mountainWidth / 2, mountainY);
            ctx.lineTo(mountainX + (i * 200) + mountainWidth, this.game.game.height);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /**
     * Render level tiles
     */
    renderLevel(ctx) {
        // Only render tiles that are visible in the viewport
        const startX = Math.floor(this.camera.x / this.tileSize);
        const endX = Math.min(this.levelWidth, startX + Math.ceil(this.game.game.width / this.tileSize) + 1);
        
        const startY = Math.floor(this.camera.y / this.tileSize);
        const endY = Math.min(this.levelHeight, startY + Math.ceil(this.game.game.height / this.tileSize) + 1);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x >= 0 && y >= 0 && x < this.levelWidth && y < this.levelHeight) {
                    const tileType = this.level[y][x];
                    
                    if (tileType === 1) {
                        // Ground/platform
                        this.drawGroundTile(ctx, x, y);
                    } else if (tileType === 4) {
                        // Exit door
                        this.drawExitDoor(ctx, x, y);
                    }
                }
            }
        }
    }
    
    /**
     * Draw a ground/platform tile
     */
    drawGroundTile(ctx, x, y) {
        const pixelX = x * this.tileSize;
        const pixelY = y * this.tileSize;
        
        // Main tile
        ctx.fillStyle = '#8D6E63'; // Brown
        ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        
        // Top edge (grass)
        const above = y > 0 ? this.level[y-1][x] : 0;
        if (above === 0) {
            ctx.fillStyle = '#4CAF50'; // Green for grass
            ctx.fillRect(pixelX, pixelY, this.tileSize, 5);
        }
        
        // Add texture details
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        if ((x + y) % 2 === 0) {
            ctx.fillRect(pixelX + 5, pixelY + 8, 5, 5);
            ctx.fillRect(pixelX + 20, pixelY + 18, 6, 6);
        } else {
            ctx.fillRect(pixelX + 15, pixelY + 10, 6, 6);
            ctx.fillRect(pixelX + 7, pixelY + 22, 5, 5);
        }
    }
    
    /**
     * Draw exit door
     */
    drawExitDoor(ctx, x, y) {
        const pixelX = x * this.tileSize;
        const pixelY = y * this.tileSize;
        
        // Door frame
        ctx.fillStyle = '#5D4037'; // Dark brown
        ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        
        // Door
        ctx.fillStyle = '#795548'; // Lighter brown
        ctx.fillRect(
            pixelX + this.tileSize * 0.1, 
            pixelY + this.tileSize * 0.1, 
            this.tileSize * 0.8, 
            this.tileSize * 0.8
        );
        
        // Door handle
        ctx.fillStyle = '#FFC107'; // Gold
        ctx.beginPath();
        ctx.arc(
            pixelX + this.tileSize * 0.7,
            pixelY + this.tileSize * 0.5,
            this.tileSize * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    /**
     * Render coins
     */
    renderCoins(ctx) {
        for (const coin of this.coins) {
            if (!coin.collected) {
                ctx.save();
                ctx.translate(coin.x, coin.y);
                ctx.rotate(coin.rotation);
                
                // Draw coin
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.beginPath();
                ctx.ellipse(0, 0, coin.width / 2, coin.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw dollar sign
                ctx.fillStyle = '#5D4037'; // Dark brown
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 0);
                
                // Add shine effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(-3, -3, 3, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
    }
    
    /**
     * Render enemies
     */
    renderEnemies(ctx) {
        for (const enemy of this.enemies) {
            // Draw enemy body
            ctx.fillStyle = '#F44336'; // Red
            ctx.beginPath();
            ctx.ellipse(
                enemy.x, 
                enemy.y, 
                enemy.width / 2, 
                enemy.height / 2, 
                0, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw spikes
            ctx.fillStyle = '#B71C1C'; // Dark red
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const spikeLength = enemy.width * 0.2;
                
                ctx.beginPath();
                ctx.moveTo(enemy.x, enemy.y);
                ctx.lineTo(
                    enemy.x + Math.cos(angle) * (enemy.width / 2 + spikeLength),
                    enemy.y + Math.sin(angle) * (enemy.height / 2 + spikeLength)
                );
                ctx.lineTo(
                    enemy.x + Math.cos(angle + 0.25) * (enemy.width / 2),
                    enemy.y + Math.sin(angle + 0.25) * (enemy.height / 2)
                );
                ctx.closePath();
                ctx.fill();
            }
            
            // Draw eyes
            ctx.fillStyle = 'white';
            const eyeOffsetX = enemy.direction === 'left' ? -8 : 8;
            ctx.beginPath();
            ctx.arc(enemy.x + eyeOffsetX, enemy.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw pupils
            ctx.fillStyle = 'black';
            const pupilOffsetX = enemy.direction === 'left' ? -10 : 10;
            ctx.beginPath();
            ctx.arc(enemy.x + pupilOffsetX, enemy.y - 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Render player
     */
    renderPlayer(ctx) {
        const x = this.player.x;
        const y = this.player.y;
        const width = this.player.width;
        const height = this.player.height;
        const direction = this.player.direction;
        const animState = this.player.animState;
        
        ctx.save();
        
        // Flip for left direction
        if (direction === 'left') {
            ctx.scale(-1, 1);
            ctx.translate(-x * 2, 0);
        }
        
        // Draw body
        ctx.fillStyle = '#2196F3'; // Blue
        ctx.fillRect(
            x - width / 2, 
            y - height / 2, 
            width, 
            height
        );
        
        // Draw head
        ctx.fillStyle = '#FFCCBC'; // Skin tone
        ctx.fillRect(
            x - width / 2, 
            y - height / 2, 
            width, 
            height / 2
        );
        
        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(
            x + width / 5, 
            y - height / 4, 
            4, 
            5, 
            0, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            x + width / 4, 
            y - height / 4, 
            2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw mouth
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        if (animState === 'jump') {
            // O-shaped mouth for jumping
            ctx.beginPath();
            ctx.arc(
                x + width / 8, 
                y - height / 8, 
                3, 
                0, 
                Math.PI * 2
            );
            ctx.stroke();
        } else {
            // Smile for running/idle
            ctx.beginPath();
            ctx.arc(
                x + width / 8, 
                y - height / 8, 
                5, 
                0, 
                Math.PI
            );
            ctx.stroke();
        }
        
        // Draw legs based on animation state
        ctx.fillStyle = '#1565C0'; // Darker blue
        
        if (animState === 'run') {
            // Running animation - legs in motion
            const runTime = performance.now() / 150;
            const legOffset = Math.sin(runTime) * 6;
            
            // Left leg
            ctx.fillRect(
                x - width / 3 - 3, 
                y + height / 4 + legOffset, 
                6, 
                height / 4
            );
            
            // Right leg
            ctx.fillRect(
                x + width / 3 - 3, 
                y + height / 4 - legOffset, 
                6, 
                height / 4
            );
        } else if (animState === 'jump') {
            // Jumping animation - legs tucked
            ctx.fillRect(
                x - width / 3 - 3, 
                y + height / 4 - 5, 
                6, 
                height / 4
            );
            
            ctx.fillRect(
                x + width / 3 - 3, 
                y + height / 4 - 5, 
                6, 
                height / 4
            );
        } else {
            // Idle animation - legs straight
            ctx.fillRect(
                x - width / 3 - 3, 
                y + height / 4, 
                6, 
                height / 4
            );
            
            ctx.fillRect(
                x + width / 3 - 3, 
                y + height / 4, 
                6, 
                height / 4
            );
        }
        
        ctx.restore();
    }
}

/**
 * Load Platformer game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadPlatformerGame(game, onLoaded) {
    // Create scene
    const platformerScene = new PlatformerScene(game);
    
    // Add scene to game
    game.addScene('platformer', platformerScene);
    
    // Set as current scene
    game.setScene('platformer');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}