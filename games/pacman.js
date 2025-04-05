/**
 * Pacman Game
 * Classic maze game where player eats dots while avoiding ghosts
 */

/**
 * Pacman Scene
 * @class
 * @extends PureJS.Scene
 */
class PacmanScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game area dimensions
        this.tileSize = 30;
        this.mazeWidth = 19;
        this.mazeHeight = 15;
        this.areaWidth = this.mazeWidth * this.tileSize;
        this.areaHeight = this.mazeHeight * this.tileSize;
        this.offsetX = (game.game.width - this.areaWidth) / 2;
        this.offsetY = (game.game.height - this.areaHeight) / 2;
        
        // Define maze layout (0 = empty, 1 = wall, 2 = dot, 3 = power pellet)
        this.maze = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
            [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
            [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
            [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
            [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
            [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
            [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        // Pacman
        this.pacman = {
            x: 9 * this.tileSize + this.tileSize / 2,
            y: 13 * this.tileSize + this.tileSize / 2,
            radius: this.tileSize / 2 - 2,
            speed: 100,
            direction: 'left',
            nextDirection: 'left',
            angle: Math.PI,
            mouthOpeness: 0.3,
            mouthDir: 1,
            mouthSpeed: 5
        };
        
        // Ghosts
        this.ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
        this.ghostNames = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
        this.ghostStartPositions = [
            {x: 9, y: 7}, // Blinky (red) - starts right above the ghost house
            {x: 8, y: 9}, // Pinky (pink) - starts in the ghost house
            {x: 9, y: 9}, // Inky (cyan) - starts in the ghost house
            {x: 10, y: 9} // Clyde (orange) - starts in the ghost house
        ];
        
        this.ghosts = [];
        this.initializeGhosts();
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameWon = false;
        this.dotCount = 0;
        this.level = 1;
        this.powerMode = false;
        this.powerModeTime = 0;
        this.powerModeDuration = 8; // seconds
        
        // Count dots in maze
        this.totalDots = 0;
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 2 || this.maze[y][x] === 3) {
                    this.totalDots++;
                }
            }
        }
        
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
            text: 'Arrow Keys: Change Direction',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
    }
    
    /**
     * Initialize ghosts
     */
    initializeGhosts() {
        this.ghosts = [];
        
        for (let i = 0; i < 4; i++) {
            const pos = this.ghostStartPositions[i];
            
            this.ghosts.push({
                x: pos.x * this.tileSize + this.tileSize / 2,
                y: pos.y * this.tileSize + this.tileSize / 2,
                radius: this.tileSize / 2 - 2,
                speed: 75 + i * 5,
                direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                color: this.ghostColors[i],
                name: this.ghostNames[i],
                scared: false,
                eaten: false,
                eyeDirection: 'left',
                exitingHome: i !== 0 // Blinky (red) starts outside
            });
        }
    }
    
    /**
     * Reset after pacman dies
     */
    resetPositions() {
        // Reset pacman
        this.pacman.x = 9 * this.tileSize + this.tileSize / 2;
        this.pacman.y = 13 * this.tileSize + this.tileSize / 2;
        this.pacman.direction = 'left';
        this.pacman.nextDirection = 'left';
        this.pacman.angle = Math.PI;
        
        // Reset ghosts
        for (let i = 0; i < this.ghosts.length; i++) {
            const pos = this.ghostStartPositions[i];
            const ghost = this.ghosts[i];
            
            ghost.x = pos.x * this.tileSize + this.tileSize / 2;
            ghost.y = pos.y * this.tileSize + this.tileSize / 2;
            ghost.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
            ghost.scared = false;
            ghost.eaten = false;
            ghost.exitingHome = i !== 0;
        }
        
        // Reset power mode
        this.powerMode = false;
        this.powerModeTime = 0;
    }
    
    /**
     * Reset game state
     */
    reset() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameWon = false;
        this.level = 1;
        this.dotCount = 0;
        this.powerMode = false;
        this.powerModeTime = 0;
        
        // Reset maze
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 0) {
                    this.maze[y][x] = 0;
                } else if (this.maze[y][x] === 3 || x === 1 && y === 2 || x === 17 && y === 2) {
                    this.maze[y][x] = 3; // Power pellets in corners
                } else {
                    this.maze[y][x] = 2; // Regular dots
                }
            }
        }
        
        // Count dots in maze
        this.totalDots = 0;
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 2 || this.maze[y][x] === 3) {
                    this.totalDots++;
                }
            }
        }
        
        this.resetPositions();
        this.initializeGhosts();
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
     * Get tile coordinates from pixel coordinates
     */
    getTileCoordinates(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        return { x: tileX, y: tileY };
    }
    
    /**
     * Check if a position is valid for movement
     */
    isValidPosition(x, y) {
        const tile = this.getTileCoordinates(x, y);
        
        // Check bounds
        if (tile.x < 0 || tile.x >= this.mazeWidth || tile.y < 0 || tile.y >= this.mazeHeight) {
            return false;
        }
        
        // Check if wall
        return this.maze[tile.y][tile.x] !== 1;
    }
    
    /**
     * Check if pacman can move in a given direction
     */
    canMove(direction, x, y, radius) {
        let testX = x;
        let testY = y;
        const offset = radius * 0.8;
        
        switch (direction) {
            case 'up':
                testY -= offset;
                break;
            case 'down':
                testY += offset;
                break;
            case 'left':
                testX -= offset;
                break;
            case 'right':
                testX += offset;
                break;
        }
        
        return this.isValidPosition(testX, testY);
    }
    
    /**
     * Move pacman
     */
    movePacman(dt) {
        // Try to change to the next direction if possible
        if (this.pacman.nextDirection !== this.pacman.direction) {
            if (this.canMove(this.pacman.nextDirection, this.pacman.x, this.pacman.y, this.pacman.radius)) {
                this.pacman.direction = this.pacman.nextDirection;
                
                // Update pacman's angle based on direction
                switch (this.pacman.direction) {
                    case 'up':
                        this.pacman.angle = -Math.PI / 2;
                        break;
                    case 'down':
                        this.pacman.angle = Math.PI / 2;
                        break;
                    case 'left':
                        this.pacman.angle = Math.PI;
                        break;
                    case 'right':
                        this.pacman.angle = 0;
                        break;
                }
            }
        }
        
        // Calculate new position
        let newX = this.pacman.x;
        let newY = this.pacman.y;
        
        switch (this.pacman.direction) {
            case 'up':
                newY -= this.pacman.speed * dt;
                break;
            case 'down':
                newY += this.pacman.speed * dt;
                break;
            case 'left':
                newX -= this.pacman.speed * dt;
                break;
            case 'right':
                newX += this.pacman.speed * dt;
                break;
        }
        
        // Check if new position is valid
        if (this.canMove(this.pacman.direction, newX, newY, this.pacman.radius)) {
            this.pacman.x = newX;
            this.pacman.y = newY;
        }
        
        // Handle tunnel wraparound
        if (this.pacman.y === 9 * this.tileSize + this.tileSize / 2) {
            if (this.pacman.x < 0) {
                this.pacman.x = this.areaWidth;
            } else if (this.pacman.x > this.areaWidth) {
                this.pacman.x = 0;
            }
        }
        
        // Check for dot eating
        const tile = this.getTileCoordinates(this.pacman.x, this.pacman.y);
        
        if (tile.x >= 0 && tile.x < this.mazeWidth && tile.y >= 0 && tile.y < this.mazeHeight) {
            if (this.maze[tile.y][tile.x] === 2) {
                // Eat regular dot
                this.maze[tile.y][tile.x] = 0;
                this.score += 10;
                this.dotCount++;
                this.updateScoreText();
                this.checkWinCondition();
            } else if (this.maze[tile.y][tile.x] === 3) {
                // Eat power pellet
                this.maze[tile.y][tile.x] = 0;
                this.score += 50;
                this.dotCount++;
                this.updateScoreText();
                this.activatePowerMode();
                this.checkWinCondition();
            }
        }
        
        // Animate mouth
        this.pacman.mouthOpeness += dt * this.pacman.mouthSpeed * this.pacman.mouthDir;
        if (this.pacman.mouthOpeness >= 0.5) {
            this.pacman.mouthOpeness = 0.5;
            this.pacman.mouthDir = -1;
        } else if (this.pacman.mouthOpeness <= 0) {
            this.pacman.mouthOpeness = 0;
            this.pacman.mouthDir = 1;
        }
    }
    
    /**
     * Activate power mode
     */
    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTime = this.powerModeDuration;
        
        // Make ghosts scared
        for (const ghost of this.ghosts) {
            if (!ghost.eaten) {
                ghost.scared = true;
            }
        }
    }
    
    /**
     * Check if all dots are eaten
     */
    checkWinCondition() {
        if (this.dotCount >= this.totalDots) {
            this.gameWon = true;
        }
    }
    
    /**
     * Get possible directions for ghost movement
     */
    getGhostDirections(ghost) {
        const directions = [];
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        // Check each direction
        if (this.canMove('up', ghost.x, ghost.y, ghost.radius) && ghost.direction !== 'down') {
            directions.push('up');
        }
        if (this.canMove('down', ghost.x, ghost.y, ghost.radius) && ghost.direction !== 'up') {
            directions.push('down');
        }
        if (this.canMove('left', ghost.x, ghost.y, ghost.radius) && ghost.direction !== 'right') {
            directions.push('left');
        }
        if (this.canMove('right', ghost.x, ghost.y, ghost.radius) && ghost.direction !== 'left') {
            directions.push('right');
        }
        
        // If at an intersection, prefer directions that aren't the opposite of the current direction
        if (directions.length > 1) {
            const filteredDirections = directions.filter(dir => dir !== opposites[ghost.direction]);
            if (filteredDirections.length > 0) {
                return filteredDirections;
            }
        }
        
        return directions.length > 0 ? directions : [opposites[ghost.direction]];
    }
    
    /**
     * Move ghost
     */
    moveGhost(ghost, dt) {
        // Handle ghosts exiting home
        if (ghost.exitingHome) {
            // Move ghost upward until it's at the exit
            const exitY = 7 * this.tileSize + this.tileSize / 2;
            
            if (ghost.y > exitY) {
                ghost.y -= ghost.speed * dt;
                ghost.eyeDirection = 'up';
                return;
            } else {
                ghost.y = exitY;
                ghost.exitingHome = false;
                ghost.direction = 'left';
                ghost.eyeDirection = 'left';
            }
        }
        
        // Handle ghost being eaten and returning to home
        if (ghost.eaten) {
            // Move directly towards ghost house
            const homeX = 9 * this.tileSize + this.tileSize / 2;
            const homeY = 9 * this.tileSize + this.tileSize / 2;
            
            const dx = homeX - ghost.x;
            const dy = homeY - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ghost.speed * dt) {
                ghost.x = homeX;
                ghost.y = homeY;
                ghost.eaten = false;
                ghost.scared = this.powerMode;
                ghost.exitingHome = true;
            } else {
                ghost.x += (dx / distance) * ghost.speed * 2 * dt; // Move faster when returning
                ghost.y += (dy / distance) * ghost.speed * 2 * dt;
                
                // Update eye direction
                if (Math.abs(dx) > Math.abs(dy)) {
                    ghost.eyeDirection = dx > 0 ? 'right' : 'left';
                } else {
                    ghost.eyeDirection = dy > 0 ? 'down' : 'up';
                }
            }
            
            return;
        }
        
        // Calculate new position
        let newX = ghost.x;
        let newY = ghost.y;
        
        switch (ghost.direction) {
            case 'up':
                newY -= ghost.speed * dt;
                break;
            case 'down':
                newY += ghost.speed * dt;
                break;
            case 'left':
                newX -= ghost.speed * dt;
                break;
            case 'right':
                newX += ghost.speed * dt;
                break;
        }
        
        // Check if at intersection or hitting a wall
        const centerOfTile = {
            x: Math.floor(ghost.x / this.tileSize) * this.tileSize + this.tileSize / 2,
            y: Math.floor(ghost.y / this.tileSize) * this.tileSize + this.tileSize / 2
        };
        
        const atIntersection = (
            Math.abs(ghost.x - centerOfTile.x) < 1 &&
            Math.abs(ghost.y - centerOfTile.y) < 1
        );
        
        if (atIntersection) {
            // Get possible directions
            const possibleDirections = this.getGhostDirections(ghost);
            
            // Choose a direction
            if (this.powerMode && ghost.scared) {
                // When scared, move randomly
                ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            } else {
                // Target pacman with some randomness
                const pacmanTile = this.getTileCoordinates(this.pacman.x, this.pacman.y);
                const ghostTile = this.getTileCoordinates(ghost.x, ghost.y);
                
                // Calculate distance to pacman for each direction
                const distances = {};
                
                for (const dir of possibleDirections) {
                    let nextTileX = ghostTile.x;
                    let nextTileY = ghostTile.y;
                    
                    switch (dir) {
                        case 'up':
                            nextTileY--;
                            break;
                        case 'down':
                            nextTileY++;
                            break;
                        case 'left':
                            nextTileX--;
                            break;
                        case 'right':
                            nextTileX++;
                            break;
                    }
                    
                    const distX = pacmanTile.x - nextTileX;
                    const distY = pacmanTile.y - nextTileY;
                    distances[dir] = Math.sqrt(distX * distX + distY * distY);
                }
                
                // 80% chance to choose optimal direction, 20% random
                if (Math.random() < 0.8) {
                    // Sort directions by distance
                    const sortedDirections = possibleDirections.sort((a, b) => distances[a] - distances[b]);
                    ghost.direction = sortedDirections[0];
                } else {
                    ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                }
            }
        }
        
        // Check if new position is valid
        if (this.canMove(ghost.direction, newX, newY, ghost.radius)) {
            ghost.x = newX;
            ghost.y = newY;
        } else {
            // Hit a wall, choose a new direction
            const possibleDirections = this.getGhostDirections(ghost);
            ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        }
        
        // Update eye direction
        ghost.eyeDirection = ghost.direction;
        
        // Handle tunnel wraparound
        if (ghost.y === 9 * this.tileSize + this.tileSize / 2) {
            if (ghost.x < 0) {
                ghost.x = this.areaWidth;
            } else if (ghost.x > this.areaWidth) {
                ghost.x = 0;
            }
        }
    }
    
    /**
     * Check for collisions between pacman and ghosts
     */
    checkGhostCollisions() {
        for (const ghost of this.ghosts) {
            const dx = ghost.x - this.pacman.x;
            const dy = ghost.y - this.pacman.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.pacman.radius + ghost.radius) {
                // Collision
                if (ghost.scared) {
                    // Eat ghost
                    ghost.eaten = true;
                    ghost.scared = false;
                    
                    // Increase score based on how many ghosts already eaten
                    const eatenCount = this.ghosts.filter(g => g.eaten).length;
                    const points = Math.pow(2, eatenCount) * 100;
                    this.score += points;
                    this.updateScoreText();
                } else if (!ghost.eaten) {
                    // Lose a life
                    this.lives--;
                    this.updateLivesText();
                    
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.resetPositions();
                    }
                    
                    return;
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
        
        if (this.gameOver || this.gameWon) {
            // Check for restart
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter')) {
                this.reset();
            }
            return;
        }
        
        // Handle input for direction change
        if (PureJS.Input.isKeyPressed('ArrowUp')) {
            this.pacman.nextDirection = 'up';
        } else if (PureJS.Input.isKeyPressed('ArrowDown')) {
            this.pacman.nextDirection = 'down';
        } else if (PureJS.Input.isKeyPressed('ArrowLeft')) {
            this.pacman.nextDirection = 'left';
        } else if (PureJS.Input.isKeyPressed('ArrowRight')) {
            this.pacman.nextDirection = 'right';
        }
        
        // Update power mode timer
        if (this.powerMode) {
            this.powerModeTime -= dt;
            
            if (this.powerModeTime <= 0) {
                this.powerMode = false;
                
                // Make ghosts normal again
                for (const ghost of this.ghosts) {
                    if (!ghost.eaten) {
                        ghost.scared = false;
                    }
                }
            }
        }
        
        // Move pacman
        this.movePacman(dt);
        
        // Move ghosts
        for (const ghost of this.ghosts) {
            this.moveGhost(ghost, dt);
        }
        
        // Check collisions
        this.checkGhostCollisions();
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (score, lives, etc.)
        super.render(ctx);
        
        // Draw maze background
        ctx.fillStyle = '#000';
        ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
        
        // Draw maze
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const tileX = this.offsetX + x * this.tileSize;
                const tileY = this.offsetY + y * this.tileSize;
                
                if (this.maze[y][x] === 1) {
                    // Wall
                    ctx.fillStyle = '#2121ff';
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                    
                    // Inner dark
                    ctx.fillStyle = '#0000c5';
                    ctx.fillRect(
                        tileX + 2,
                        tileY + 2,
                        this.tileSize - 4,
                        this.tileSize - 4
                    );
                } else if (this.maze[y][x] === 2) {
                    // Dot
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(
                        tileX + this.tileSize / 2,
                        tileY + this.tileSize / 2,
                        this.tileSize / 10,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                } else if (this.maze[y][x] === 3) {
                    // Power pellet
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(
                        tileX + this.tileSize / 2,
                        tileY + this.tileSize / 2,
                        this.tileSize / 4,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }
        
        // Draw pacman
        if (!this.gameOver) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(
                this.offsetX + this.pacman.x,
                this.offsetY + this.pacman.y,
                this.pacman.radius,
                this.pacman.angle + this.pacman.mouthOpeness * Math.PI,
                this.pacman.angle + (2 - this.pacman.mouthOpeness) * Math.PI
            );
            ctx.lineTo(this.offsetX + this.pacman.x, this.offsetY + this.pacman.y);
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw ghosts
        for (const ghost of this.ghosts) {
            // Skip rendering if eaten and in tunnel
            if (ghost.eaten && 
                (ghost.x < 0 || ghost.x > this.areaWidth) &&
                ghost.y === 9 * this.tileSize + this.tileSize / 2) {
                continue;
            }
            
            const ghostX = this.offsetX + ghost.x;
            const ghostY = this.offsetY + ghost.y;
            
            ctx.save();
            
            // Ghost body
            if (ghost.eaten) {
                // Eyes only for eaten ghosts
                this.drawGhostEyes(ctx, ghostX, ghostY, ghost.eyeDirection);
            } else {
                if (ghost.scared) {
                    // Scared ghost
                    const nearEndOfPower = this.powerModeTime < 2;
                    
                    if (nearEndOfPower && Math.floor(this.powerModeTime * 5) % 2 === 0) {
                        ctx.fillStyle = '#ffffff'; // White when blinking
                    } else {
                        ctx.fillStyle = '#2121ff'; // Blue when scared
                    }
                } else {
                    // Normal ghost
                    ctx.fillStyle = ghost.color;
                }
                
                // Ghost head
                ctx.beginPath();
                ctx.arc(
                    ghostX,
                    ghostY - ghost.radius / 3,
                    ghost.radius,
                    Math.PI,
                    0
                );
                
                // Ghost skirt
                const skirtSegments = 4;
                const segmentWidth = ghost.radius * 2 / skirtSegments;
                
                ctx.lineTo(ghostX + ghost.radius, ghostY + ghost.radius);
                
                for (let i = 0; i < skirtSegments; i++) {
                    const waveHeight = ghost.radius / 4;
                    const waveX = ghostX + ghost.radius - (i + 0.5) * segmentWidth;
                    
                    ctx.lineTo(
                        waveX,
                        ghostY + ghost.radius + waveHeight
                    );
                    ctx.lineTo(
                        waveX - segmentWidth / 2,
                        ghostY + ghost.radius
                    );
                }
                
                ctx.lineTo(ghostX - ghost.radius, ghostY + ghost.radius);
                ctx.lineTo(ghostX - ghost.radius, ghostY - ghost.radius / 3);
                
                ctx.fill();
                
                if (ghost.scared) {
                    // Scared face
                    ctx.fillStyle = '#ffffff';
                    
                    // Eyes
                    ctx.beginPath();
                    ctx.arc(ghostX - ghost.radius / 2, ghostY - ghost.radius / 3, ghost.radius / 4, 0, Math.PI * 2);
                    ctx.arc(ghostX + ghost.radius / 2, ghostY - ghost.radius / 3, ghost.radius / 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Mouth
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.moveTo(ghostX - ghost.radius / 2, ghostY + ghost.radius / 4);
                    
                    for (let i = 0; i <= 4; i++) {
                        const angle = Math.PI / 4 * i;
                        ctx.lineTo(
                            ghostX - ghost.radius / 2 + Math.cos(angle) * ghost.radius,
                            ghostY + ghost.radius / 4 + Math.abs(Math.sin(angle)) * ghost.radius / 2
                        );
                    }
                    
                    ctx.fill();
                } else {
                    // Normal eyes
                    this.drawGhostEyes(ctx, ghostX, ghostY, ghost.eyeDirection);
                }
            }
            
            ctx.restore();
        }
        
        // Draw remaining lives
        for (let i = 0; i < this.lives; i++) {
            const lifeX = this.offsetX + 30 + i * 30;
            const lifeY = this.offsetY + this.areaHeight + 20;
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(lifeX, lifeY, 10, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.lineTo(lifeX, lifeY);
            ctx.closePath();
            ctx.fill();
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
        
        // Draw win message
        if (this.gameWon) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('YOU WIN!', this.game.game.width / 2, this.game.game.height / 2 - 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = '24px Roboto';
            ctx.fillText(`Final Score: ${this.score}`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
    
    /**
     * Draw ghost eyes
     */
    drawGhostEyes(ctx, x, y, direction) {
        // Eye whites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 5, 6, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils
        ctx.fillStyle = '#000';
        
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        
        switch (direction) {
            case 'up':
                pupilOffsetY = -2;
                break;
            case 'down':
                pupilOffsetY = 2;
                break;
            case 'left':
                pupilOffsetX = -2;
                break;
            case 'right':
                pupilOffsetX = 2;
                break;
        }
        
        ctx.beginPath();
        ctx.arc(x - 5 + pupilOffsetX, y - 5 + pupilOffsetY, 2, 0, Math.PI * 2);
        ctx.arc(x + 5 + pupilOffsetX, y - 5 + pupilOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Load Pacman game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadPacmanGame(game, onLoaded) {
    // Create a Pacman scene
    const pacmanScene = new PacmanScene(game);
    
    // Add scene to game
    game.addScene('pacman', pacmanScene);
    
    // Set as current scene
    game.setScene('pacman');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}