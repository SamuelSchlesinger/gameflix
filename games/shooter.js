/**
 * Shooter Game
 * A top-down shooter game with wave-based enemies
 */

/**
 * Shooter Scene
 * @class
 * @extends PureJS.Scene
 */
class ShooterScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game configuration
        this.arenaWidth = game.game.width;
        this.arenaHeight = game.game.height;
        this.playerSpeed = 250;
        this.bulletSpeed = 800;
        this.bulletCooldown = 0.2; // seconds between shots
        this.enemySpeed = 100;
        
        // Game state
        this.player = {
            x: game.game.width / 2,
            y: game.game.height / 2,
            size: 30,
            rotation: 0,
            velocityX: 0,
            velocityY: 0,
            lastShotTime: 0,
            health: 100
        };
        
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        this.score = 0;
        this.wave = 1;
        this.enemiesRemaining = 0;
        this.waveStartTime = 0;
        this.gameOver = false;
        this.waveCompleted = false;
        this.nextWaveCountdown = 3; // seconds until next wave
        
        // Create text entities
        this.createTextEntities();
        
        // Start first wave
        this.startWave();
    }
    
    /**
     * Create UI text entities
     */
    createTextEntities() {
        // Score text
        const scoreText = this.game.createEntity({
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
        
        // Wave text
        const waveText = this.game.createEntity({
            x: this.game.game.width - 100,
            y: 30
        });
        
        waveText.addComponent(new PureJS.TextComponent({
            text: 'Wave: 1',
            font: 'bold 24px Roboto',
            color: '#fff',
            align: 'right'
        }));
        
        this.waveText = waveText;
        this.addEntity(waveText);
        
        // Health text
        const healthText = this.game.createEntity({
            x: 100,
            y: 60
        });
        
        healthText.addComponent(new PureJS.TextComponent({
            text: 'Health: 100',
            font: 'bold 20px Roboto',
            color: '#4CAF50',
            align: 'left'
        }));
        
        this.healthText = healthText;
        this.addEntity(healthText);
        
        // Instructions text
        const instructionsText = this.game.createEntity({
            x: this.game.game.width / 2,
            y: this.game.game.height - 20
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'WASD/Arrows: Move | Mouse: Aim | Click: Shoot',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
    }
    
    /**
     * Start a new wave
     */
    startWave() {
        this.waveStartTime = performance.now();
        this.waveCompleted = false;
        
        // Calculate enemies for this wave
        const enemyCount = 5 + (this.wave * 2);
        this.enemiesRemaining = enemyCount;
        
        // Update wave text
        const waveTextComp = this.waveText.getComponent(PureJS.TextComponent);
        waveTextComp.text = `Wave: ${this.wave}`;
    }
    
    /**
     * Spawn enemies around the arena
     */
    spawnEnemies() {
        // Don't spawn if wave is completed
        if (this.waveCompleted) return;
        
        // Limit active enemies based on wave
        const maxActive = 2 + Math.min(10, this.wave);
        
        if (this.enemies.length < maxActive && this.enemiesRemaining > 0) {
            const spawnLocation = this.getRandomSpawnLocation();
            
            // Determine enemy type based on wave
            let enemyType = 'basic';
            const typeRoll = Math.random();
            
            if (this.wave >= 5 && typeRoll > 0.8) {
                enemyType = 'elite';
            } else if (this.wave >= 3 && typeRoll > 0.7) {
                enemyType = 'fast';
            }
            
            // Create enemy based on type
            const enemy = {
                x: spawnLocation.x,
                y: spawnLocation.y,
                size: enemyType === 'elite' ? 45 : 30,
                type: enemyType,
                speed: enemyType === 'fast' ? this.enemySpeed * 1.5 : this.enemySpeed,
                health: enemyType === 'elite' ? 3 : 1,
                color: enemyType === 'basic' ? '#F44336' : (enemyType === 'fast' ? '#FF9800' : '#9C27B0')
            };
            
            this.enemies.push(enemy);
            this.enemiesRemaining--;
        }
    }
    
    /**
     * Get a random spawn location outside the visible arena
     */
    getRandomSpawnLocation() {
        const padding = 100; // Distance outside visible area
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        let x, y;
        
        switch (side) {
            case 0: // Top
                x = Math.random() * this.arenaWidth;
                y = -padding;
                break;
            case 1: // Right
                x = this.arenaWidth + padding;
                y = Math.random() * this.arenaHeight;
                break;
            case 2: // Bottom
                x = Math.random() * this.arenaWidth;
                y = this.arenaHeight + padding;
                break;
            case 3: // Left
                x = -padding;
                y = Math.random() * this.arenaHeight;
                break;
        }
        
        return { x, y };
    }
    
    /**
     * Update score text
     */
    updateScoreText() {
        const textComp = this.scoreText.getComponent(PureJS.TextComponent);
        textComp.text = `Score: ${this.score}`;
    }
    
    /**
     * Update health text
     */
    updateHealthText() {
        const textComp = this.healthText.getComponent(PureJS.TextComponent);
        textComp.text = `Health: ${this.player.health}`;
        
        // Change color based on health
        if (this.player.health > 70) {
            textComp.color = '#4CAF50'; // Green
        } else if (this.player.health > 30) {
            textComp.color = '#FF9800'; // Orange
        } else {
            textComp.color = '#F44336'; // Red
        }
    }
    
    /**
     * Check collision between two circles
     */
    checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }
    
    /**
     * Reset game state
     */
    reset() {
        // Reset player
        this.player = {
            x: this.game.game.width / 2,
            y: this.game.game.height / 2,
            size: 30,
            rotation: 0,
            velocityX: 0,
            velocityY: 0,
            lastShotTime: 0,
            health: 100
        };
        
        // Reset game state
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        this.score = 0;
        this.wave = 1;
        this.enemiesRemaining = 0;
        this.gameOver = false;
        this.waveCompleted = false;
        
        // Update texts
        this.updateScoreText();
        this.updateHealthText();
        
        // Start first wave
        this.startWave();
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
     * Fire a bullet from the player
     */
    fireBullet() {
        const now = performance.now() / 1000; // Convert to seconds
        
        // Check cooldown
        if (now - this.player.lastShotTime < this.bulletCooldown) {
            return;
        }
        
        // Calculate bullet direction
        const angle = this.player.rotation;
        
        // Create bullet
        const bullet = {
            x: this.player.x + Math.cos(angle) * this.player.size,
            y: this.player.y + Math.sin(angle) * this.player.size,
            velocityX: Math.cos(angle) * this.bulletSpeed,
            velocityY: Math.sin(angle) * this.bulletSpeed,
            size: 5,
            life: 1.5, // seconds before despawning
            damage: 1
        };
        
        this.bullets.push(bullet);
        this.player.lastShotTime = now;
    }
    
    /**
     * Create particle effects
     */
    createParticles(x, y, count, color, speed, size, life) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            
            const particle = {
                x: x,
                y: y,
                velocityX: Math.cos(angle) * velocity,
                velocityY: Math.sin(angle) * velocity,
                size: size * (0.5 + Math.random() * 0.5),
                color: color,
                life: life * (0.8 + Math.random() * 0.4),
                opacity: 1
            };
            
            this.particles.push(particle);
        }
    }
    
    /**
     * Spawn a power-up at position
     */
    spawnPowerup(x, y) {
        if (Math.random() > 0.2) return; // 20% chance to spawn
        
        // Determine power-up type
        const types = ['health', 'speed', 'firerate'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerup = {
            x: x,
            y: y,
            size: 15,
            type: type,
            life: 10, // seconds before despawning
            pulsePhase: 0
        };
        
        this.powerups.push(powerup);
    }
    
    /**
     * Apply power-up effect
     */
    applyPowerup(type) {
        switch (type) {
            case 'health':
                this.player.health = Math.min(100, this.player.health + 25);
                this.updateHealthText();
                break;
                
            case 'speed':
                this.playerSpeed = 350; // Increased speed
                
                // Reset after 10 seconds
                setTimeout(() => {
                    this.playerSpeed = 250;
                }, 10000);
                break;
                
            case 'firerate':
                this.bulletCooldown = 0.1; // Faster firing
                
                // Reset after 10 seconds
                setTimeout(() => {
                    this.bulletCooldown = 0.2;
                }, 10000);
                break;
        }
    }
    
    /**
     * Update player movement and rotation
     */
    updatePlayer(dt) {
        // Get keyboard input for movement
        let moveX = 0;
        let moveY = 0;
        
        if (PureJS.Input.isKeyDown('KeyW') || PureJS.Input.isKeyDown('ArrowUp')) {
            moveY = -1;
        }
        if (PureJS.Input.isKeyDown('KeyS') || PureJS.Input.isKeyDown('ArrowDown')) {
            moveY = 1;
        }
        if (PureJS.Input.isKeyDown('KeyA') || PureJS.Input.isKeyDown('ArrowLeft')) {
            moveX = -1;
        }
        if (PureJS.Input.isKeyDown('KeyD') || PureJS.Input.isKeyDown('ArrowRight')) {
            moveX = 1;
        }
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // Set velocity
        this.player.velocityX = moveX * this.playerSpeed;
        this.player.velocityY = moveY * this.playerSpeed;
        
        // Update position
        this.player.x += this.player.velocityX * dt;
        this.player.y += this.player.velocityY * dt;
        
        // Keep player in bounds
        this.player.x = Math.max(this.player.size, Math.min(this.arenaWidth - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.arenaHeight - this.player.size, this.player.y));
        
        // Update rotation based on mouse position
        const mouseX = PureJS.Input.mouse.x;
        const mouseY = PureJS.Input.mouse.y;
        
        this.player.rotation = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
        
        // Fire bullet on mouse click
        if (PureJS.Input.mouse.down) {
            this.fireBullet();
        }
    }
    
    /**
     * Update bullets
     */
    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update position
            bullet.x += bullet.velocityX * dt;
            bullet.y += bullet.velocityY * dt;
            
            // Decrease life
            bullet.life -= dt;
            
            // Check if bullet is dead
            if (bullet.life <= 0 || 
                bullet.x < 0 || bullet.x > this.arenaWidth || 
                bullet.y < 0 || bullet.y > this.arenaHeight) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.checkCircleCollision(
                    bullet.x, bullet.y, bullet.size,
                    enemy.x, enemy.y, enemy.size
                )) {
                    // Reduce enemy health
                    enemy.health -= bullet.damage;
                    
                    // Create hit particles
                    this.createParticles(
                        bullet.x, bullet.y, 
                        5, enemy.color, 
                        150, 3, 0.3
                    );
                    
                    // Remove bullet
                    this.bullets.splice(i, 1);
                    
                    // Check if enemy is dead
                    if (enemy.health <= 0) {
                        // Calculate score based on enemy type
                        let points = 10;
                        if (enemy.type === 'fast') points = 15;
                        if (enemy.type === 'elite') points = 25;
                        
                        this.score += points;
                        this.updateScoreText();
                        
                        // Create death particles
                        this.createParticles(
                            enemy.x, enemy.y, 
                            15, enemy.color, 
                            200, 5, 0.6
                        );
                        
                        // Chance to spawn powerup
                        this.spawnPowerup(enemy.x, enemy.y);
                        
                        // Remove enemy
                        this.enemies.splice(j, 1);
                        
                        // Check if wave is complete
                        if (this.enemies.length === 0 && this.enemiesRemaining === 0) {
                            this.waveCompleted = true;
                            this.nextWaveCountdown = 3;
                        }
                    }
                    
                    break;
                }
            }
        }
    }
    
    /**
     * Update enemies
     */
    updateEnemies(dt) {
        // Spawn enemies if needed
        this.spawnEnemies();
        
        for (const enemy of this.enemies) {
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize direction vector
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                // Move enemy
                enemy.x += dirX * enemy.speed * dt;
                enemy.y += dirY * enemy.speed * dt;
            }
            
            // Check collision with player
            if (this.checkCircleCollision(
                enemy.x, enemy.y, enemy.size,
                this.player.x, this.player.y, this.player.size
            )) {
                // Player takes damage
                this.player.health -= 10;
                this.updateHealthText();
                
                // Create hit particles
                this.createParticles(
                    this.player.x, this.player.y, 
                    10, '#ffffff', 
                    200, 4, 0.4
                );
                
                // Push enemy back
                const pushDistance = 100;
                const pushDirX = dx / distance;
                const pushDirY = dy / distance;
                enemy.x -= pushDirX * pushDistance * dt;
                enemy.y -= pushDirY * pushDistance * dt;
                
                // Check if player is dead
                if (this.player.health <= 0) {
                    this.gameOver = true;
                    
                    // Create explosion particles
                    this.createParticles(
                        this.player.x, this.player.y, 
                        50, '#ffff00', 
                        300, 8, 1.0
                    );
                }
            }
        }
    }
    
    /**
     * Update particles
     */
    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.velocityX * dt;
            particle.y += particle.velocityY * dt;
            
            // Slow down over time
            particle.velocityX *= 0.95;
            particle.velocityY *= 0.95;
            
            // Decrease life and fade out
            particle.life -= dt;
            particle.opacity = particle.life > 0.3 ? 1 : particle.life / 0.3;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Update power-ups
     */
    updatePowerups(dt) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // Decrease life
            powerup.life -= dt;
            
            // Update pulse animation
            powerup.pulsePhase += dt * 5;
            
            // Remove expired powerups
            if (powerup.life <= 0) {
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCircleCollision(
                powerup.x, powerup.y, powerup.size,
                this.player.x, this.player.y, this.player.size
            )) {
                // Apply power-up effect
                this.applyPowerup(powerup.type);
                
                // Create pickup particles
                this.createParticles(
                    powerup.x, powerup.y, 
                    10, this.getPowerupColor(powerup.type), 
                    150, 4, 0.5
                );
                
                // Remove power-up
                this.powerups.splice(i, 1);
            }
        }
    }
    
    /**
     * Get color for power-up type
     */
    getPowerupColor(type) {
        switch (type) {
            case 'health': return '#4CAF50'; // Green
            case 'speed': return '#2196F3'; // Blue
            case 'firerate': return '#FF9800'; // Orange
            default: return '#ffffff';
        }
    }
    
    /**
     * Update wave state
     */
    updateWave(dt) {
        if (this.waveCompleted) {
            // Countdown to next wave
            this.nextWaveCountdown -= dt;
            
            if (this.nextWaveCountdown <= 0) {
                this.wave++;
                this.startWave();
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
            // Only update particles when game over
            this.updateParticles(dt);
            
            // Check for restart
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter')) {
                this.reset();
            }
            return;
        }
        
        // Update game components
        this.updatePlayer(dt);
        this.updateBullets(dt);
        this.updateEnemies(dt);
        this.updateParticles(dt);
        this.updatePowerups(dt);
        this.updateWave(dt);
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Draw background - dark grid
        this.drawBackground(ctx);
        
        // Draw power-ups
        this.renderPowerups(ctx);
        
        // Draw bullets
        this.renderBullets(ctx);
        
        // Draw enemies
        this.renderEnemies(ctx);
        
        // Draw player
        if (!this.gameOver) {
            this.renderPlayer(ctx);
        }
        
        // Draw particles
        this.renderParticles(ctx);
        
        // Render entities (score, etc.)
        super.render(ctx);
        
        // Draw wave completed message
        if (this.waveCompleted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`WAVE ${this.wave} COMPLETE!`, this.game.game.width / 2, this.game.game.height / 2 - 40);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Next wave in ${Math.ceil(this.nextWaveCountdown)}...`, this.game.game.width / 2, this.game.game.height / 2 + 10);
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
            ctx.fillText(`Final Score: ${this.score}`, this.game.game.width / 2, this.game.game.height / 2 + 10);
            ctx.fillText(`Waves Survived: ${this.wave}`, this.game.game.width / 2, this.game.game.height / 2 + 40);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 80);
        }
    }
    
    /**
     * Draw grid background
     */
    drawBackground(ctx) {
        // Fill background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.arenaWidth, this.arenaHeight);
        
        // Draw grid
        ctx.strokeStyle = '#333355';
        ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        for (let x = 0; x < this.arenaWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.arenaHeight);
            ctx.stroke();
        }
        
        for (let y = 0; y < this.arenaHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.arenaWidth, y);
            ctx.stroke();
        }
    }
    
    /**
     * Render player
     */
    renderPlayer(ctx) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.rotation);
        
        // Draw player body
        ctx.fillStyle = '#2196F3'; // Blue
        ctx.beginPath();
        ctx.arc(0, 0, this.player.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction indicator (gun)
        ctx.fillStyle = '#0D47A1'; // Darker blue
        ctx.fillRect(0, -5, this.player.size, 10);
        
        // Add details
        ctx.fillStyle = '#B3E5FC'; // Light blue
        ctx.beginPath();
        ctx.arc(0, 0, this.player.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Render bullets
     */
    renderBullets(ctx) {
        ctx.fillStyle = '#FFEB3B'; // Yellow
        
        for (const bullet of this.bullets) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Render enemies
     */
    renderEnemies(ctx) {
        for (const enemy of this.enemies) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            
            // Draw enemy body
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            
            if (enemy.type === 'elite') {
                // Elite enemy is a pentagon
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const x = Math.cos(angle) * enemy.size;
                    const y = Math.sin(angle) * enemy.size;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
            } else if (enemy.type === 'fast') {
                // Fast enemy is a triangle
                ctx.beginPath();
                ctx.moveTo(0, -enemy.size);
                ctx.lineTo(-enemy.size, enemy.size / 2);
                ctx.lineTo(enemy.size, enemy.size / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Basic enemy is a circle
                ctx.beginPath();
                ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw enemy details
            ctx.fillStyle = '#000';
            ctx.beginPath();
            
            if (enemy.type === 'elite') {
                // Elite enemy has multiple eyes
                for (let i = 0; i < 3; i++) {
                    const angle = ((i - 1) / 5) * Math.PI - Math.PI / 2;
                    const x = Math.cos(angle) * enemy.size * 0.5;
                    const y = Math.sin(angle) * enemy.size * 0.5;
                    ctx.beginPath();
                    ctx.arc(x, y, enemy.size * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Basic/fast enemies have two eyes
                ctx.beginPath();
                ctx.arc(-enemy.size * 0.3, -enemy.size * 0.2, enemy.size * 0.15, 0, Math.PI * 2);
                ctx.arc(enemy.size * 0.3, -enemy.size * 0.2, enemy.size * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Render particles
     */
    renderParticles(ctx) {
        for (const particle of this.particles) {
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Render powerups
     */
    renderPowerups(ctx) {
        for (const powerup of this.powerups) {
            const color = this.getPowerupColor(powerup.type);
            const pulseFactor = 1 + Math.sin(powerup.pulsePhase) * 0.2;
            const size = powerup.size * pulseFactor;
            
            // Draw glow
            const gradient = ctx.createRadialGradient(
                powerup.x, powerup.y, 0,
                powerup.x, powerup.y, size * 1.5
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(powerup.x, powerup.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw main circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(powerup.x, powerup.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw icon based on type
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let icon;
            switch (powerup.type) {
                case 'health': icon = '+'; break;
                case 'speed': icon = '→'; break;
                case 'firerate': icon = '⚡'; break;
                default: icon = '?';
            }
            
            ctx.fillText(icon, powerup.x, powerup.y);
        }
    }
}

/**
 * Load Shooter game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadShooterGame(game, onLoaded) {
    // Create scene
    const shooterScene = new ShooterScene(game);
    
    // Add scene to game
    game.addScene('shooter', shooterScene);
    
    // Set as current scene
    game.setScene('shooter');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}