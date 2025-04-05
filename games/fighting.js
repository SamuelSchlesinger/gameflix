/**
 * Fighting Game
 * A simple 2D fighting game with basic attacks and combos
 */

/**
 * Fighting Scene
 * @class
 * @extends PureJS.Scene
 */
class FightingScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game configuration
        this.gravity = 2000;
        this.groundY = game.game.height - 100;
        this.arenaWidth = game.game.width;
        
        // Game state
        this.player = {
            x: game.game.width * 0.3,
            y: this.groundY,
            width: 60,
            height: 120,
            velocityX: 0,
            velocityY: 0,
            speed: 300,
            jumpForce: -800,
            health: 100,
            attackPower: 10,
            isJumping: false,
            isAttacking: false,
            attackType: null,
            attackTime: 0,
            attackDuration: 0.3,
            isBlocking: false,
            stunned: false,
            stunTime: 0,
            direction: 'right',
            comboCounter: 0,
            comboTimer: 0,
            lastAttackTime: 0
        };
        
        this.enemy = {
            x: game.game.width * 0.7,
            y: this.groundY,
            width: 60,
            height: 120,
            velocityX: 0,
            velocityY: 0,
            speed: 250,
            jumpForce: -800,
            health: 100,
            attackPower: 8,
            isJumping: false,
            isAttacking: false,
            attackType: null,
            attackTime: 0,
            attackDuration: 0.4,
            isBlocking: false,
            stunned: false,
            stunTime: 0,
            direction: 'left',
            state: 'idle',
            stateTime: 0,
            thinkTime: 0,
            decisionDelay: 0.5
        };
        
        // Initialize effects and UI
        this.effects = [];
        this.createTextEntities();
        this.roundTime = 60; // 60 seconds per round
        this.roundOver = false;
        this.winnerText = '';
        this.gameOver = false;
    }
    
    /**
     * Create UI text entities
     */
    createTextEntities() {
        // Player health text
        const playerHealthText = this.game.createEntity({
            x: 100,
            y: 30
        });
        
        playerHealthText.addComponent(new PureJS.TextComponent({
            text: 'Player: 100 HP',
            font: 'bold 20px Roboto',
            color: '#4CAF50',
            align: 'left'
        }));
        
        this.playerHealthText = playerHealthText;
        this.addEntity(playerHealthText);
        
        // Enemy health text
        const enemyHealthText = this.game.createEntity({
            x: this.game.game.width - 100,
            y: 30
        });
        
        enemyHealthText.addComponent(new PureJS.TextComponent({
            text: 'Enemy: 100 HP',
            font: 'bold 20px Roboto',
            color: '#F44336',
            align: 'right'
        }));
        
        this.enemyHealthText = enemyHealthText;
        this.addEntity(enemyHealthText);
        
        // Combo text
        const comboText = this.game.createEntity({
            x: this.game.game.width / 2,
            y: 100
        });
        
        comboText.addComponent(new PureJS.TextComponent({
            text: '',
            font: 'bold 32px Roboto',
            color: '#FFC107'
        }));
        
        this.comboText = comboText;
        this.addEntity(comboText);
        
        // Timer text
        const timerText = this.game.createEntity({
            x: this.game.game.width / 2,
            y: 30
        });
        
        timerText.addComponent(new PureJS.TextComponent({
            text: '60',
            font: 'bold 24px Roboto',
            color: '#fff'
        }));
        
        this.timerText = timerText;
        this.addEntity(timerText);
        
        // Instructions text
        const instructionsText = this.game.createEntity({
            x: this.game.game.width / 2,
            y: this.game.game.height - 20
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrow Keys: Move | Z: Punch | X: Kick | C: Special | Shift: Block',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
    }
    
    /**
     * Create hit effect at position
     */
    createHitEffect(x, y, type) {
        const color = type === 'punch' ? '#ffeb3b' : 
                     type === 'kick' ? '#f44336' : 
                     type === 'special' ? '#4caf50' : '#ffffff';
        
        const text = type === 'punch' ? 'POW!' : 
                    type === 'kick' ? 'WHAM!' : 
                    type === 'special' ? 'BOOM!' : 'HIT!';
        
        const effect = {
            x: x,
            y: y,
            text: text,
            color: color,
            size: 32,
            life: 0.5,
            velocity: -100
        };
        
        this.effects.push(effect);
    }
    
    /**
     * Update health text displays
     */
    updateHealthText() {
        // Update player health text
        const playerTextComp = this.playerHealthText.getComponent(PureJS.TextComponent);
        playerTextComp.text = `Player: ${this.player.health} HP`;
        
        // Change color based on health
        if (this.player.health > 70) {
            playerTextComp.color = '#4CAF50'; // Green
        } else if (this.player.health > 30) {
            playerTextComp.color = '#FFC107'; // Yellow
        } else {
            playerTextComp.color = '#F44336'; // Red
        }
        
        // Update enemy health text
        const enemyTextComp = this.enemyHealthText.getComponent(PureJS.TextComponent);
        enemyTextComp.text = `Enemy: ${this.enemy.health} HP`;
        
        // Change color based on health
        if (this.enemy.health > 70) {
            enemyTextComp.color = '#F44336'; // Red
        } else if (this.enemy.health > 30) {
            enemyTextComp.color = '#FFC107'; // Yellow
        } else {
            enemyTextComp.color = '#4CAF50'; // Green
        }
    }
    
    /**
     * Update combo text
     */
    updateComboText() {
        const textComp = this.comboText.getComponent(PureJS.TextComponent);
        
        if (this.player.comboCounter > 1) {
            textComp.text = `${this.player.comboCounter}x COMBO!`;
            
            // Scale text based on combo size
            const scale = 1 + (this.player.comboCounter * 0.1);
            textComp.font = `bold ${Math.round(32 * scale)}px Roboto`;
        } else {
            textComp.text = '';
        }
    }
    
    /**
     * Update timer text
     */
    updateTimerText() {
        const textComp = this.timerText.getComponent(PureJS.TextComponent);
        textComp.text = Math.ceil(this.roundTime).toString();
        
        // Change color when time is low
        if (this.roundTime <= 10) {
            textComp.color = '#F44336'; // Red
        } else {
            textComp.color = '#ffffff'; // White
        }
    }
    
    /**
     * Reset game state
     */
    reset() {
        // Reset player
        this.player.x = this.game.game.width * 0.3;
        this.player.y = this.groundY;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.health = 100;
        this.player.isJumping = false;
        this.player.isAttacking = false;
        this.player.attackType = null;
        this.player.attackTime = 0;
        this.player.isBlocking = false;
        this.player.stunned = false;
        this.player.stunTime = 0;
        this.player.direction = 'right';
        this.player.comboCounter = 0;
        this.player.comboTimer = 0;
        this.player.lastAttackTime = 0;
        
        // Reset enemy
        this.enemy.x = this.game.game.width * 0.7;
        this.enemy.y = this.groundY;
        this.enemy.velocityX = 0;
        this.enemy.velocityY = 0;
        this.enemy.health = 100;
        this.enemy.isJumping = false;
        this.enemy.isAttacking = false;
        this.enemy.attackType = null;
        this.enemy.attackTime = 0;
        this.enemy.isBlocking = false;
        this.enemy.stunned = false;
        this.enemy.stunTime = 0;
        this.enemy.direction = 'left';
        this.enemy.state = 'idle';
        this.enemy.stateTime = 0;
        this.enemy.thinkTime = 0;
        
        // Reset game state
        this.effects = [];
        this.roundTime = 60;
        this.roundOver = false;
        this.winnerText = '';
        this.gameOver = false;
        
        // Update text displays
        this.updateHealthText();
        this.updateComboText();
        this.updateTimerText();
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
     * Check if two characters are colliding
     */
    checkCollision(char1, char2) {
        return (
            char1.x - char1.width / 2 < char2.x + char2.width / 2 &&
            char1.x + char1.width / 2 > char2.x - char2.width / 2 &&
            char1.y - char1.height < char2.y && // Adjusted for character origin at feet
            char1.y > char2.y - char2.height
        );
    }
    
    /**
     * Handle player attack
     */
    playerAttack(attackType) {
        if (this.player.isAttacking || this.player.stunned || this.player.isBlocking) return;
        
        // Set attack properties
        this.player.isAttacking = true;
        this.player.attackType = attackType;
        this.player.attackTime = 0;
        
        // Attack durations and power
        switch (attackType) {
            case 'punch':
                this.player.attackDuration = 0.2;
                this.player.attackPower = 10;
                break;
            case 'kick':
                this.player.attackDuration = 0.3;
                this.player.attackPower = 15;
                break;
            case 'special':
                this.player.attackDuration = 0.5;
                this.player.attackPower = 25;
                break;
        }
        
        // Check for combo
        const now = performance.now() / 1000;
        if (now - this.player.lastAttackTime < 1.0) {
            this.player.comboCounter++;
            this.player.comboTimer = 2.0; // Reset combo timer
            
            // Increase damage for combos
            this.player.attackPower = Math.floor(this.player.attackPower * (1 + this.player.comboCounter * 0.1));
        } else {
            this.player.comboCounter = 1;
            this.player.comboTimer = 2.0;
        }
        
        this.player.lastAttackTime = now;
        this.updateComboText();
    }
    
    /**
     * Handle enemy AI
     */
    updateEnemyAI(dt) {
        // Update enemy thinking time
        this.enemy.thinkTime -= dt;
        
        // Don't make decisions if stunned
        if (this.enemy.stunned) return;
        
        // Don't make new decisions until thinking time is up
        if (this.enemy.thinkTime > 0) {
            // Execute current state
            switch (this.enemy.state) {
                case 'advance':
                    // Move towards player
                    if (this.player.x < this.enemy.x) {
                        this.enemy.velocityX = -this.enemy.speed;
                        this.enemy.direction = 'left';
                    } else {
                        this.enemy.velocityX = this.enemy.speed;
                        this.enemy.direction = 'right';
                    }
                    break;
                    
                case 'retreat':
                    // Move away from player
                    if (this.player.x < this.enemy.x) {
                        this.enemy.velocityX = this.enemy.speed;
                        this.enemy.direction = 'right';
                    } else {
                        this.enemy.velocityX = -this.enemy.speed;
                        this.enemy.direction = 'left';
                    }
                    break;
                    
                case 'jump':
                    // Jump if on ground
                    if (!this.enemy.isJumping) {
                        this.enemy.velocityY = this.enemy.jumpForce;
                        this.enemy.isJumping = true;
                        
                        // Add some forward momentum
                        if (this.player.x < this.enemy.x) {
                            this.enemy.velocityX = -this.enemy.speed * 0.5;
                        } else {
                            this.enemy.velocityX = this.enemy.speed * 0.5;
                        }
                    }
                    break;
                    
                case 'attack':
                    // Attack if in range and not already attacking
                    if (!this.enemy.isAttacking) {
                        const distance = Math.abs(this.player.x - this.enemy.x);
                        
                        if (distance < 100) {
                            // Choose attack type
                            const attackRoll = Math.random();
                            let attackType;
                            
                            if (attackRoll < 0.6) {
                                attackType = 'punch';
                            } else if (attackRoll < 0.9) {
                                attackType = 'kick';
                            } else {
                                attackType = 'special';
                            }
                            
                            // Set up attack
                            this.enemy.isAttacking = true;
                            this.enemy.attackType = attackType;
                            this.enemy.attackTime = 0;
                            
                            // Set attack properties
                            switch (attackType) {
                                case 'punch':
                                    this.enemy.attackDuration = 0.3;
                                    this.enemy.attackPower = 8;
                                    break;
                                case 'kick':
                                    this.enemy.attackDuration = 0.4;
                                    this.enemy.attackPower = 12;
                                    break;
                                case 'special':
                                    this.enemy.attackDuration = 0.6;
                                    this.enemy.attackPower = 20;
                                    break;
                            }
                        }
                    }
                    break;
                    
                case 'block':
                    // Block attacks
                    this.enemy.isBlocking = true;
                    this.enemy.velocityX = 0;
                    break;
                    
                case 'idle':
                default:
                    // Do nothing
                    this.enemy.velocityX = 0;
                    this.enemy.isBlocking = false;
                    break;
            }
            
            return;
        }
        
        // Pick a new action
        const distance = Math.abs(this.player.x - this.enemy.x);
        const stateRoll = Math.random();
        
        // Different behaviors based on distance
        if (distance < 80) {
            // Very close
            if (this.player.isAttacking) {
                // Defensive when player attacks
                if (stateRoll < 0.7) {
                    this.enemy.state = 'block';
                } else if (stateRoll < 0.9) {
                    this.enemy.state = 'retreat';
                } else {
                    this.enemy.state = 'jump';
                }
            } else {
                // Offensive when player isn't attacking
                if (stateRoll < 0.6) {
                    this.enemy.state = 'attack';
                } else if (stateRoll < 0.8) {
                    this.enemy.state = 'retreat';
                } else {
                    this.enemy.state = 'idle';
                }
            }
        } else if (distance < 200) {
            // Medium distance
            if (stateRoll < 0.5) {
                this.enemy.state = 'advance';
            } else if (stateRoll < 0.7) {
                this.enemy.state = 'jump';
            } else if (stateRoll < 0.9) {
                this.enemy.state = 'attack';
            } else {
                this.enemy.state = 'idle';
            }
        } else {
            // Far away
            if (stateRoll < 0.7) {
                this.enemy.state = 'advance';
            } else if (stateRoll < 0.9) {
                this.enemy.state = 'jump';
            } else {
                this.enemy.state = 'idle';
            }
        }
        
        // Set new thinking time
        this.enemy.thinkTime = this.enemy.decisionDelay + Math.random() * 0.5;
    }
    
    /**
     * Update character physics
     */
    updateCharacterPhysics(character, dt) {
        // Apply gravity if in the air
        if (character.y < this.groundY) {
            character.velocityY += this.gravity * dt;
        }
        
        // Update position
        character.x += character.velocityX * dt;
        character.y += character.velocityY * dt;
        
        // Check ground collision
        if (character.y > this.groundY) {
            character.y = this.groundY;
            character.velocityY = 0;
            character.isJumping = false;
        }
        
        // Keep in arena bounds
        const halfWidth = character.width / 2;
        if (character.x - halfWidth < 0) {
            character.x = halfWidth;
        } else if (character.x + halfWidth > this.arenaWidth) {
            character.x = this.arenaWidth - halfWidth;
        }
        
        // Update attack state
        if (character.isAttacking) {
            character.attackTime += dt;
            
            // End attack after duration
            if (character.attackTime >= character.attackDuration) {
                character.isAttacking = false;
                character.attackType = null;
            }
        }
        
        // Update stun state
        if (character.stunned) {
            character.stunTime -= dt;
            
            if (character.stunTime <= 0) {
                character.stunned = false;
            }
        }
    }
    
    /**
     * Check for attacks landing and update health
     */
    checkAttackCollisions() {
        // Check player attacks hitting enemy
        if (this.player.isAttacking && 
            this.player.attackTime > this.player.attackDuration * 0.3 && 
            this.player.attackTime < this.player.attackDuration * 0.7) {
            
            // Calculate attack range based on type
            let attackRange = this.player.width;
            if (this.player.attackType === 'kick') attackRange = this.player.width * 1.2;
            if (this.player.attackType === 'special') attackRange = this.player.width * 1.5;
            
            // Check if enemy is in attack range
            const distanceToEnemy = Math.abs(this.player.x - this.enemy.x);
            const facingEnemy = (this.player.direction === 'right' && this.player.x < this.enemy.x) ||
                               (this.player.direction === 'left' && this.player.x > this.enemy.x);
            
            if (distanceToEnemy < attackRange && facingEnemy) {
                // Hit connects!
                
                // Check if enemy is blocking
                if (this.enemy.isBlocking && 
                    ((this.enemy.direction === 'left' && this.enemy.x > this.player.x) ||
                     (this.enemy.direction === 'right' && this.enemy.x < this.player.x))) {
                    
                    // Blocked - reduced damage
                    this.enemy.health -= Math.floor(this.player.attackPower * 0.2);
                    
                    // Create block effect
                    this.createHitEffect(
                        this.enemy.x - (this.enemy.direction === 'left' ? -20 : 20), 
                        this.enemy.y - this.enemy.height / 2,
                        'block'
                    );
                } else {
                    // Not blocked - full damage
                    this.enemy.health -= this.player.attackPower;
                    
                    // Stun enemy
                    this.enemy.stunned = true;
                    this.enemy.stunTime = 0.3;
                    this.enemy.isBlocking = false;
                    
                    // Knockback
                    const knockback = this.player.attackType === 'special' ? 150 : 
                                     this.player.attackType === 'kick' ? 100 : 50;
                    
                    if (this.player.x < this.enemy.x) {
                        this.enemy.velocityX = knockback;
                    } else {
                        this.enemy.velocityX = -knockback;
                    }
                    
                    // Create hit effect
                    this.createHitEffect(
                        this.enemy.x, 
                        this.enemy.y - this.enemy.height / 2,
                        this.player.attackType
                    );
                }
                
                // Clamp health
                this.enemy.health = Math.max(0, this.enemy.health);
                
                // Update health display
                this.updateHealthText();
                
                // Check if enemy is defeated
                if (this.enemy.health <= 0) {
                    this.roundOver = true;
                    this.winnerText = 'PLAYER WINS!';
                }
            }
        }
        
        // Check enemy attacks hitting player
        if (this.enemy.isAttacking && 
            this.enemy.attackTime > this.enemy.attackDuration * 0.3 && 
            this.enemy.attackTime < this.enemy.attackDuration * 0.7) {
            
            // Calculate attack range based on type
            let attackRange = this.enemy.width;
            if (this.enemy.attackType === 'kick') attackRange = this.enemy.width * 1.2;
            if (this.enemy.attackType === 'special') attackRange = this.enemy.width * 1.5;
            
            // Check if player is in attack range
            const distanceToPlayer = Math.abs(this.enemy.x - this.player.x);
            const facingPlayer = (this.enemy.direction === 'right' && this.enemy.x < this.player.x) ||
                                (this.enemy.direction === 'left' && this.enemy.x > this.player.x);
            
            if (distanceToPlayer < attackRange && facingPlayer) {
                // Hit connects!
                
                // Check if player is blocking
                if (this.player.isBlocking && 
                    ((this.player.direction === 'left' && this.player.x > this.enemy.x) ||
                     (this.player.direction === 'right' && this.player.x < this.enemy.x))) {
                    
                    // Blocked - reduced damage
                    this.player.health -= Math.floor(this.enemy.attackPower * 0.2);
                    
                    // Create block effect
                    this.createHitEffect(
                        this.player.x - (this.player.direction === 'left' ? -20 : 20), 
                        this.player.y - this.player.height / 2,
                        'block'
                    );
                    
                    // Reset combo
                    this.player.comboCounter = 0;
                    this.player.comboTimer = 0;
                    this.updateComboText();
                } else {
                    // Not blocked - full damage
                    this.player.health -= this.enemy.attackPower;
                    
                    // Stun player
                    this.player.stunned = true;
                    this.player.stunTime = 0.3;
                    this.player.isBlocking = false;
                    this.player.isAttacking = false;
                    
                    // Knockback
                    const knockback = this.enemy.attackType === 'special' ? 150 : 
                                     this.enemy.attackType === 'kick' ? 100 : 50;
                    
                    if (this.enemy.x < this.player.x) {
                        this.player.velocityX = knockback;
                    } else {
                        this.player.velocityX = -knockback;
                    }
                    
                    // Create hit effect
                    this.createHitEffect(
                        this.player.x, 
                        this.player.y - this.player.height / 2,
                        this.enemy.attackType
                    );
                    
                    // Reset combo
                    this.player.comboCounter = 0;
                    this.player.comboTimer = 0;
                    this.updateComboText();
                }
                
                // Clamp health
                this.player.health = Math.max(0, this.player.health);
                
                // Update health display
                this.updateHealthText();
                
                // Check if player is defeated
                if (this.player.health <= 0) {
                    this.roundOver = true;
                    this.winnerText = 'ENEMY WINS!';
                }
            }
        }
    }
    
    /**
     * Update hit effects
     */
    updateEffects(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            // Move effect up
            effect.y += effect.velocity * dt;
            
            // Decrease life
            effect.life -= dt;
            
            // Remove dead effects
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    /**
     * Update player input
     */
    updatePlayerInput() {
        // Skip input if stunned
        if (this.player.stunned) {
            this.player.isBlocking = false;
            return;
        }
        
        // Get keyboard input for movement
        if (!this.player.isAttacking && !this.player.isBlocking) {
            if (PureJS.Input.isKeyDown('ArrowLeft')) {
                this.player.velocityX = -this.player.speed;
                this.player.direction = 'left';
            } else if (PureJS.Input.isKeyDown('ArrowRight')) {
                this.player.velocityX = this.player.speed;
                this.player.direction = 'right';
            } else {
                this.player.velocityX = 0;
            }
        }
        
        // Jumping
        if (PureJS.Input.isKeyPressed('ArrowUp') && !this.player.isJumping) {
            this.player.velocityY = this.player.jumpForce;
            this.player.isJumping = true;
        }
        
        // Attack inputs
        if (PureJS.Input.isKeyPressed('KeyZ')) {
            this.playerAttack('punch');
        } else if (PureJS.Input.isKeyPressed('KeyX')) {
            this.playerAttack('kick');
        } else if (PureJS.Input.isKeyPressed('KeyC')) {
            this.playerAttack('special');
        }
        
        // Blocking
        if (PureJS.Input.isKeyDown('ShiftLeft') || PureJS.Input.isKeyDown('ShiftRight')) {
            if (!this.player.isAttacking) {
                this.player.isBlocking = true;
                this.player.velocityX = 0;
            }
        } else {
            this.player.isBlocking = false;
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
        
        if (this.roundOver) {
            // Short delay before ending the round
            this.gameOver = true;
            return;
        }
        
        // Update round timer
        this.roundTime -= dt;
        this.updateTimerText();
        
        // Check for time up
        if (this.roundTime <= 0) {
            this.roundTime = 0;
            this.roundOver = true;
            
            // Determine winner by health
            if (this.player.health > this.enemy.health) {
                this.winnerText = 'PLAYER WINS!';
            } else if (this.enemy.health > this.player.health) {
                this.winnerText = 'ENEMY WINS!';
            } else {
                this.winnerText = 'DRAW!';
            }
            
            return;
        }
        
        // Update combo timer
        if (this.player.comboTimer > 0) {
            this.player.comboTimer -= dt;
            
            if (this.player.comboTimer <= 0) {
                this.player.comboCounter = 0;
                this.updateComboText();
            }
        }
        
        // Handle input for player
        this.updatePlayerInput();
        
        // Update AI for enemy
        this.updateEnemyAI(dt);
        
        // Update physics for both characters
        this.updateCharacterPhysics(this.player, dt);
        this.updateCharacterPhysics(this.enemy, dt);
        
        // Check for attacks landing
        this.checkAttackCollisions();
        
        // Update effects
        this.updateEffects(dt);
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Draw background
        this.drawBackground(ctx);
        
        // Draw characters
        this.drawCharacter(ctx, this.player);
        this.drawCharacter(ctx, this.enemy);
        
        // Draw effects
        this.drawEffects(ctx);
        
        // Render entities (text, etc.)
        super.render(ctx);
        
        // Draw game over message
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ROUND OVER', this.game.game.width / 2, this.game.game.height / 2 - 50);
            
            ctx.font = 'bold 28px Roboto';
            ctx.fillText(this.winnerText, this.game.game.width / 2, this.game.game.height / 2);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to play again', this.game.game.width / 2, this.game.game.height / 2 + 80);
        }
    }
    
    /**
     * Draw the background
     */
    drawBackground(ctx) {
        // Draw sky
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.game.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#4ca1af');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
        
        // Draw ground
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, this.groundY, this.game.game.width, this.game.game.height - this.groundY);
        
        // Draw some distant mountains for backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        
        // First mountain
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.game.game.width * 0.3, this.groundY - 100);
        ctx.lineTo(this.game.game.width * 0.5, this.groundY);
        ctx.fill();
        
        // Second mountain
        ctx.beginPath();
        ctx.moveTo(this.game.game.width * 0.4, this.groundY);
        ctx.lineTo(this.game.game.width * 0.7, this.groundY - 150);
        ctx.lineTo(this.game.game.width, this.groundY);
        ctx.fill();
        
        // Draw ground detail
        ctx.fillStyle = '#704214';
        for (let i = 0; i < this.game.game.width; i += 40) {
            ctx.fillRect(i, this.groundY, 20, 5);
        }
    }
    
    /**
     * Draw a character
     */
    drawCharacter(ctx, character) {
        ctx.save();
        
        // Flip based on direction
        if (character.direction === 'left') {
            ctx.translate(character.x, 0);
            ctx.scale(-1, 1);
            ctx.translate(-character.x, 0);
        }
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(character.x, this.groundY, character.width / 2, character.width / 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Base position (feet at y position)
        const baseX = character.x;
        const baseY = character.y - character.height;
        
        // Body
        ctx.fillStyle = character === this.player ? '#3498db' : '#e74c3c';
        
        // If blocking, draw defensive pose
        if (character.isBlocking) {
            // Arms up in blocking pose
            ctx.fillRect(baseX - character.width / 2, baseY, character.width, character.height * 0.6);
            
            // Arms
            ctx.fillRect(baseX - character.width / 2 - 10, baseY + character.height * 0.2, 10, character.height * 0.1);
            ctx.fillRect(baseX + character.width / 2, baseY + character.height * 0.2, 10, character.height * 0.1);
            
            // Legs
            ctx.fillStyle = '#222';
            ctx.fillRect(baseX - character.width / 4, baseY + character.height * 0.6, character.width / 3, character.height * 0.4);
            ctx.fillRect(baseX, baseY + character.height * 0.6, character.width / 3, character.height * 0.4);
        } 
        // If attacking, draw attack pose
        else if (character.isAttacking) {
            // Body
            ctx.fillRect(baseX - character.width / 2, baseY, character.width, character.height * 0.6);
            
            // Attack animation based on type
            if (character.attackType === 'punch') {
                // Extended arm for punch
                ctx.fillRect(baseX + character.width / 2, baseY + character.height * 0.2, 25, character.height * 0.1);
                
                // Fist
                ctx.fillStyle = '#222';
                ctx.fillRect(baseX + character.width / 2 + 25, baseY + character.height * 0.2 - 5, 10, character.height * 0.2);
            } 
            else if (character.attackType === 'kick') {
                // Body leaning back slightly
                ctx.fillRect(baseX - character.width / 2 - 5, baseY, character.width, character.height * 0.6);
                
                // Extended leg for kick
                ctx.fillStyle = '#222';
                ctx.fillRect(baseX + character.width / 4, baseY + character.height * 0.5, character.width * 0.9, character.height * 0.15);
            }
            else if (character.attackType === 'special') {
                // Special attack effect
                ctx.fillStyle = character === this.player ? '#3498db99' : '#e74c3c99';
                ctx.beginPath();
                ctx.arc(baseX + character.width / 2 + 40, baseY + character.height * 0.3, 30, 0, Math.PI * 2);
                ctx.fill();
                
                // Extended arm
                ctx.fillStyle = character === this.player ? '#3498db' : '#e74c3c';
                ctx.fillRect(baseX + character.width / 2, baseY + character.height * 0.2, 20, character.height * 0.15);
            }
            
            // Legs
            ctx.fillStyle = '#222';
            ctx.fillRect(baseX - character.width / 4, baseY + character.height * 0.6, character.width / 3, character.height * 0.4);
            ctx.fillRect(baseX, baseY + character.height * 0.6, character.width / 3, character.height * 0.4);
        }
        // Default stance
        else {
            // Body
            ctx.fillRect(baseX - character.width / 2, baseY, character.width, character.height * 0.6);
            
            // Arms
            ctx.fillRect(baseX - character.width / 2 - 5, baseY + character.height * 0.2, 5, character.height * 0.2);
            ctx.fillRect(baseX + character.width / 2, baseY + character.height * 0.2, 5, character.height * 0.2);
            
            // Legs
            ctx.fillStyle = '#222';
            
            // Animate legs if moving
            if (Math.abs(character.velocityX) > 1) {
                const time = performance.now() / 200;
                const legOffset = Math.sin(time) * 10;
                
                ctx.fillRect(baseX - character.width / 4 - 5, baseY + character.height * 0.6, character.width / 3, character.height * 0.4 + legOffset);
                ctx.fillRect(baseX + 5, baseY + character.height * 0.6, character.width / 3, character.height * 0.4 - legOffset);
            } else {
                ctx.fillRect(baseX - character.width / 4, baseY + character.height * 0.6, character.width / 3, character.height * 0.4);
                ctx.fillRect(baseX, baseY + character.height * 0.6, character.width / 3, character.height * 0.4);
            }
        }
        
        // Head
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(baseX - character.width / 4, baseY - character.height * 0.2, character.width / 2, character.height * 0.2);
        
        // Face (eyes and mouth)
        ctx.fillStyle = '#222';
        
        if (character.stunned) {
            // X eyes when stunned
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            
            // Left eye X
            ctx.beginPath();
            ctx.moveTo(baseX - character.width / 8 - 5, baseY - character.height * 0.12 - 3);
            ctx.lineTo(baseX - character.width / 8 + 5, baseY - character.height * 0.12 + 3);
            ctx.moveTo(baseX - character.width / 8 - 5, baseY - character.height * 0.12 + 3);
            ctx.lineTo(baseX - character.width / 8 + 5, baseY - character.height * 0.12 - 3);
            ctx.stroke();
            
            // Right eye X
            ctx.beginPath();
            ctx.moveTo(baseX + character.width / 8 - 5, baseY - character.height * 0.12 - 3);
            ctx.lineTo(baseX + character.width / 8 + 5, baseY - character.height * 0.12 + 3);
            ctx.moveTo(baseX + character.width / 8 - 5, baseY - character.height * 0.12 + 3);
            ctx.lineTo(baseX + character.width / 8 + 5, baseY - character.height * 0.12 - 3);
            ctx.stroke();
            
            // Dazed mouth
            ctx.beginPath();
            ctx.arc(baseX, baseY - character.height * 0.05, 5, 0, Math.PI, false);
            ctx.stroke();
        } else {
            // Normal eyes
            ctx.beginPath();
            ctx.arc(baseX - character.width / 8, baseY - character.height * 0.12, 3, 0, Math.PI * 2);
            ctx.arc(baseX + character.width / 8, baseY - character.height * 0.12, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth based on state
            if (character.isAttacking) {
                // Aggressive mouth
                ctx.beginPath();
                ctx.arc(baseX, baseY - character.height * 0.05, 5, 0, Math.PI, true);
                ctx.fill();
            } else if (character.isBlocking) {
                // Worried mouth
                ctx.beginPath();
                ctx.arc(baseX, baseY - character.height * 0.05, 3, 0, Math.PI, false);
                ctx.fill();
            } else {
                // Normal mouth
                ctx.fillRect(baseX - 5, baseY - character.height * 0.06, 10, 2);
            }
        }
        
        // Health bar
        const healthBarWidth = 50;
        const healthBarHeight = 5;
        const healthPct = character.health / 100;
        
        ctx.fillStyle = '#222';
        ctx.fillRect(baseX - healthBarWidth / 2 - 1, baseY - character.height * 0.25 - 1, healthBarWidth + 2, healthBarHeight + 2);
        
        const healthColor = healthPct > 0.6 ? '#4CAF50' : healthPct > 0.3 ? '#FFC107' : '#F44336';
        ctx.fillStyle = healthColor;
        ctx.fillRect(baseX - healthBarWidth / 2, baseY - character.height * 0.25, healthBarWidth * healthPct, healthBarHeight);
        
        ctx.restore();
    }
    
    /**
     * Draw hit effects
     */
    drawEffects(ctx) {
        for (const effect of this.effects) {
            // Set alpha based on remaining life
            ctx.globalAlpha = effect.life / 0.5;
            
            // Draw effect text
            ctx.font = `bold ${effect.size}px Roboto`;
            ctx.fillStyle = effect.color;
            ctx.textAlign = 'center';
            ctx.fillText(effect.text, effect.x, effect.y);
        }
        
        // Reset alpha
        ctx.globalAlpha = 1;
    }
}

/**
 * Load Fighting game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadFightingGame(game, onLoaded) {
    // Create scene
    const fightingScene = new FightingScene(game);
    
    // Add scene to game
    game.addScene('fighting', fightingScene);
    
    // Set as current scene
    game.setScene('fighting');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}