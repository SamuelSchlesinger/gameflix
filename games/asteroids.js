/**
 * Asteroids Game
 * Classic space shooting game where you destroy asteroids
 */

/**
 * Asteroids Scene
 * @class
 * @extends PureJS.Scene
 */
class AsteroidsScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game area dimensions (full canvas)
        this.areaWidth = game.game.width;
        this.areaHeight = game.game.height;
        
        // Ship properties
        this.ship = {
            x: this.areaWidth / 2,
            y: this.areaHeight / 2,
            radius: 15,
            angle: -Math.PI / 2, // Pointing up
            speed: 0,
            maxSpeed: 300,
            rotationSpeed: 4, // radians per second
            acceleration: 300,
            friction: 0.98,
            invulnerable: false,
            invulnerableTime: 0,
            thrust: false,
            velocity: { x: 0, y: 0 }
        };
        
        // Bullets
        this.bullets = [];
        this.bulletSpeed = 500;
        this.bulletLifetime = 1.5; // seconds
        this.bulletCooldown = 0;
        this.bulletCooldownTime = 0.2; // seconds
        
        // Asteroids
        this.asteroids = [];
        this.minAsteroidRadius = 15;
        this.maxAsteroidRadius = 50;
        this.asteroidSpeeds = [30, 60, 90]; // based on size
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;
        
        // Create text entity for score
        const scoreText = game.createEntity({
            x: 100,
            y: 30
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
            x: game.game.width - 100,
            y: 30
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
            y: game.game.height - 30
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrows: Move  |  Space: Fire  |  P: Pause',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize level
        this.initializeLevel();
    }
    
    /**
     * Initialize level with asteroids
     */
    initializeLevel() {
        this.asteroids = [];
        
        // Number of asteroids based on level
        const numAsteroids = 3 + Math.min(7, this.level);
        
        for (let i = 0; i < numAsteroids; i++) {
            // Ensure asteroids don't spawn too close to the ship
            let tooClose = true;
            let x, y;
            
            while (tooClose) {
                x = Math.random() * this.areaWidth;
                y = Math.random() * this.areaHeight;
                
                const distance = Math.sqrt(
                    Math.pow(x - this.ship.x, 2) + 
                    Math.pow(y - this.ship.y, 2)
                );
                
                tooClose = distance < 150;
            }
            
            // Create a large asteroid
            this.createAsteroid(x, y, this.maxAsteroidRadius, 0); // Size 0 = large
        }
    }
    
    /**
     * Create a new asteroid
     */
    createAsteroid(x, y, radius, size) {
        // Generate a random shape for the asteroid
        const vertices = [];
        const numVertices = 10;
        const irregularity = 0.4; // how irregular the shape is (0-1)
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const radiusVariation = 1 - irregularity + Math.random() * irregularity * 2;
            
            vertices.push({
                angle: angle,
                radius: radius * radiusVariation
            });
        }
        
        // Random speed and direction
        const angle = Math.random() * Math.PI * 2;
        const speed = this.asteroidSpeeds[size];
        
        this.asteroids.push({
            x: x,
            y: y,
            radius: radius,
            size: size, // 0 = large, 1 = medium, 2 = small
            vertices: vertices,
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            },
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 2 // radians per second
        });
    }
    
    /**
     * Reset ship after death
     */
    resetShip() {
        this.ship.x = this.areaWidth / 2;
        this.ship.y = this.areaHeight / 2;
        this.ship.angle = -Math.PI / 2;
        this.ship.speed = 0;
        this.ship.velocity.x = 0;
        this.ship.velocity.y = 0;
        this.ship.invulnerable = true;
        this.ship.invulnerableTime = 3; // 3 seconds of invulnerability
    }
    
    /**
     * Reset game state
     */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;
        
        this.bullets = [];
        this.bulletCooldown = 0;
        
        this.resetShip();
        this.initializeLevel();
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
     * Check for collisions between objects
     */
    checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const distance = Math.sqrt(
            Math.pow(x2 - x1, 2) + 
            Math.pow(y2 - y1, 2)
        );
        
        return distance < r1 + r2;
    }
    
    /**
     * Fire a bullet from the ship
     */
    fireBullet() {
        if (this.bulletCooldown <= 0) {
            const angle = this.ship.angle;
            
            this.bullets.push({
                x: this.ship.x + Math.cos(angle) * this.ship.radius,
                y: this.ship.y + Math.sin(angle) * this.ship.radius,
                velocity: {
                    x: Math.cos(angle) * this.bulletSpeed,
                    y: Math.sin(angle) * this.bulletSpeed
                },
                lifetime: this.bulletLifetime
            });
            
            this.bulletCooldown = this.bulletCooldownTime;
        }
    }
    
    /**
     * Break an asteroid into smaller pieces
     */
    breakAsteroid(asteroid, index) {
        // Remove the asteroid
        this.asteroids.splice(index, 1);
        
        // Increase score based on size
        const scoreValues = [20, 50, 100]; // large, medium, small
        this.score += scoreValues[asteroid.size];
        this.updateScoreText();
        
        // If not a small asteroid, create smaller asteroids
        if (asteroid.size < 2) {
            const newSize = asteroid.size + 1;
            const newRadius = asteroid.radius / 1.5;
            
            // Create two smaller asteroids
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = asteroid.radius / 2;
                
                this.createAsteroid(
                    asteroid.x + Math.cos(angle) * distance,
                    asteroid.y + Math.sin(angle) * distance,
                    newRadius,
                    newSize
                );
            }
        }
        
        // Check if level is complete
        if (this.asteroids.length === 0) {
            this.startNextLevel();
        }
    }
    
    /**
     * Start the next level
     */
    startNextLevel() {
        this.level++;
        this.bullets = [];
        this.bulletCooldown = 0;
        this.initializeLevel();
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
        
        // Update bullet cooldown
        if (this.bulletCooldown > 0) {
            this.bulletCooldown -= dt;
        }
        
        // Update ship invulnerability
        if (this.ship.invulnerable) {
            this.ship.invulnerableTime -= dt;
            if (this.ship.invulnerableTime <= 0) {
                this.ship.invulnerable = false;
            }
        }
        
        // Handle ship rotation
        if (PureJS.Input.isKeyDown('ArrowLeft')) {
            this.ship.angle -= this.ship.rotationSpeed * dt;
        } else if (PureJS.Input.isKeyDown('ArrowRight')) {
            this.ship.angle += this.ship.rotationSpeed * dt;
        }
        
        // Handle ship thrust
        this.ship.thrust = PureJS.Input.isKeyDown('ArrowUp');
        if (this.ship.thrust) {
            this.ship.velocity.x += Math.cos(this.ship.angle) * this.ship.acceleration * dt;
            this.ship.velocity.y += Math.sin(this.ship.angle) * this.ship.acceleration * dt;
            
            // Cap maximum speed
            const speed = Math.sqrt(
                this.ship.velocity.x * this.ship.velocity.x + 
                this.ship.velocity.y * this.ship.velocity.y
            );
            
            if (speed > this.ship.maxSpeed) {
                const ratio = this.ship.maxSpeed / speed;
                this.ship.velocity.x *= ratio;
                this.ship.velocity.y *= ratio;
            }
        }
        
        // Apply friction
        this.ship.velocity.x *= this.ship.friction;
        this.ship.velocity.y *= this.ship.friction;
        
        // Move ship
        this.ship.x += this.ship.velocity.x * dt;
        this.ship.y += this.ship.velocity.y * dt;
        
        // Wrap ship around screen
        if (this.ship.x < 0) this.ship.x += this.areaWidth;
        if (this.ship.x >= this.areaWidth) this.ship.x -= this.areaWidth;
        if (this.ship.y < 0) this.ship.y += this.areaHeight;
        if (this.ship.y >= this.areaHeight) this.ship.y -= this.areaHeight;
        
        // Handle bullet firing
        if (PureJS.Input.isKeyPressed('Space')) {
            this.fireBullet();
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Move bullet
            bullet.x += bullet.velocity.x * dt;
            bullet.y += bullet.velocity.y * dt;
            
            // Wrap around screen
            if (bullet.x < 0) bullet.x += this.areaWidth;
            if (bullet.x >= this.areaWidth) bullet.x -= this.areaWidth;
            if (bullet.y < 0) bullet.y += this.areaHeight;
            if (bullet.y >= this.areaHeight) bullet.y -= this.areaHeight;
            
            // Update lifetime
            bullet.lifetime -= dt;
            if (bullet.lifetime <= 0) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collision with asteroids
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                
                if (this.checkCircleCollision(
                    bullet.x, bullet.y, 2,
                    asteroid.x, asteroid.y, asteroid.radius
                )) {
                    // Break asteroid
                    this.breakAsteroid(asteroid, j);
                    
                    // Remove bullet
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // Update asteroids
        for (let i = 0; i < this.asteroids.length; i++) {
            const asteroid = this.asteroids[i];
            
            // Move asteroid
            asteroid.x += asteroid.velocity.x * dt;
            asteroid.y += asteroid.velocity.y * dt;
            
            // Wrap around screen
            if (asteroid.x < -asteroid.radius) asteroid.x += this.areaWidth + asteroid.radius * 2;
            if (asteroid.x >= this.areaWidth + asteroid.radius) asteroid.x -= this.areaWidth + asteroid.radius * 2;
            if (asteroid.y < -asteroid.radius) asteroid.y += this.areaHeight + asteroid.radius * 2;
            if (asteroid.y >= this.areaHeight + asteroid.radius) asteroid.y -= this.areaHeight + asteroid.radius * 2;
            
            // Update rotation
            asteroid.rotation += asteroid.rotationSpeed * dt;
            
            // Check collision with ship
            if (!this.ship.invulnerable && this.checkCircleCollision(
                this.ship.x, this.ship.y, this.ship.radius * 0.6,
                asteroid.x, asteroid.y, asteroid.radius * 0.9
            )) {
                // Lose a life
                this.lives--;
                this.updateLivesText();
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                } else {
                    this.resetShip();
                }
            }
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
        ctx.fillRect(0, 0, this.areaWidth, this.areaHeight);
        
        // Draw stars
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 100; i++) {
            const x = (Math.sin(i * 932.37) * 0.5 + 0.5) * this.areaWidth;
            const y = (Math.cos(i * 342.87) * 0.5 + 0.5) * this.areaHeight;
            const size = (Math.sin(i * 0.37) * 0.5 + 0.5) * 2 + 1;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw asteroids
        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth = 2;
        
        for (const asteroid of this.asteroids) {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            
            ctx.beginPath();
            for (let i = 0; i < asteroid.vertices.length; i++) {
                const vertex = asteroid.vertices[i];
                const x = Math.cos(vertex.angle) * vertex.radius;
                const y = Math.sin(vertex.angle) * vertex.radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            
            // Fill with gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.radius);
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(1, '#333333');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw bullets
        ctx.fillStyle = '#FFF';
        for (const bullet of this.bullets) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw ship (if not game over)
        if (!this.gameOver) {
            // Don't draw if ship is blinking (invulnerable)
            const shouldDraw = !this.ship.invulnerable || 
                Math.floor(this.ship.invulnerableTime * 10) % 2 === 0;
            
            if (shouldDraw) {
                ctx.save();
                ctx.translate(this.ship.x, this.ship.y);
                ctx.rotate(this.ship.angle);
                
                // Ship body
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.moveTo(this.ship.radius, 0);
                ctx.lineTo(-this.ship.radius / 2, -this.ship.radius / 2);
                ctx.lineTo(-this.ship.radius / 2, this.ship.radius / 2);
                ctx.closePath();
                ctx.fill();
                
                // Thrust
                if (this.ship.thrust) {
                    ctx.fillStyle = '#F0C';
                    ctx.beginPath();
                    ctx.moveTo(-this.ship.radius / 2, 0);
                    ctx.lineTo(-this.ship.radius, -this.ship.radius / 3);
                    ctx.lineTo(-this.ship.radius * 1.5, 0);
                    ctx.lineTo(-this.ship.radius, this.ship.radius / 3);
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.restore();
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
 * Load Asteroids game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadAsteroidsGame(game, onLoaded) {
    // Create an Asteroids scene
    const asteroidsScene = new AsteroidsScene(game);
    
    // Add scene to game
    game.addScene('asteroids', asteroidsScene);
    
    // Set as current scene
    game.setScene('asteroids');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}