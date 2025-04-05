/**
 * Sokoban Game
 * Puzzle game where player pushes boxes to designated spots
 */

/**
 * Sokoban Scene
 * @class
 * @extends PureJS.Scene
 */
class SokobanScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        this.cellSize = 40;
        this.currentLevel = 0;
        this.moves = 0;
        this.pushes = 0;
        this.gameWon = false;
        this.undoStack = [];
        
        // Levels definition
        this.levels = [
            {
                map: [
                    "    #####          ",
                    "    #   #          ",
                    "    #$  #          ",
                    "  ###  $##         ",
                    "  #  $ $ #         ",
                    "### # ## #   ######",
                    "#   # ## #####  ..#",
                    "# $  $          ..#",
                    "##### ### #@##  ..#",
                    "    #     #########",
                    "    #######        "
                ],
                title: "Level 1: Beginner"
            },
            {
                map: [
                    "############  ",
                    "#..  #     ###",
                    "#..  # $  $  #",
                    "#..  #$####  #",
                    "#..    @ ##  #",
                    "#..  # #  $ ##",
                    "###### ##$ $ #",
                    "  # $  $ $ $ #",
                    "  #    #     #",
                    "  ############"
                ],
                title: "Level 2: Novice"
            },
            {
                map: [
                    "        ######## ",
                    "        #     @# ",
                    "        # $#$ ## ",
                    "        # $  $# ",
                    "        ##$ $ # ",
                    "######### $ # ###",
                    "#....  ## $  $  #",
                    "##...    $  $   #",
                    "#....  ##########",
                    "########         "
                ],
                title: "Level 3: Intermediate"
            }
        ];
        
        // Initialize grid dimensions
        this.initializeLevel();
        
        // Calculate offsets to center the grid
        this.offsetX = (game.game.width - this.width * this.cellSize) / 2;
        this.offsetY = (game.game.height - this.height * this.cellSize) / 2;
        
        // Create text entity for level title
        const levelTitleText = game.createEntity({
            x: game.game.width / 2,
            y: this.offsetY / 2
        });
        
        levelTitleText.addComponent(new PureJS.TextComponent({
            text: this.levels[this.currentLevel].title,
            font: 'bold 24px Roboto',
            color: '#fff'
        }));
        
        this.levelTitleText = levelTitleText;
        this.addEntity(levelTitleText);
        
        // Create text entity for moves/pushes counter
        const statsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2
        });
        
        statsText.addComponent(new PureJS.TextComponent({
            text: 'Moves: 0  Pushes: 0',
            font: '18px Roboto',
            color: '#aaa'
        }));
        
        this.statsText = statsText;
        this.addEntity(statsText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2 + 30
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrow Keys: Move  |  R: Restart  |  U: Undo  |  N: Next Level',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Load the current level
        this.loadLevel(this.currentLevel);
    }
    
    /**
     * Initialize level dimensions
     */
    initializeLevel() {
        // Find grid dimensions for current level
        const map = this.levels[this.currentLevel].map;
        this.height = map.length;
        this.width = 0;
        
        for (let y = 0; y < this.height; y++) {
            this.width = Math.max(this.width, map[y].length);
        }
        
        // Adjust cell size based on level dimensions
        this.cellSize = Math.min(
            (this.game.game.width * 0.9) / this.width,
            (this.game.game.height * 0.75) / this.height
        );
        
        // Calculate offsets to center the grid
        this.offsetX = (this.game.game.width - this.width * this.cellSize) / 2;
        this.offsetY = (this.game.game.height - this.height * this.cellSize) / 2;
    }
    
    /**
     * Load a level
     * @param {number} levelIndex - Level index to load
     */
    loadLevel(levelIndex) {
        // Update current level
        this.currentLevel = levelIndex;
        
        // Reset game state
        this.grid = [];
        this.player = { x: 0, y: 0 };
        this.boxes = [];
        this.targets = [];
        this.walls = [];
        this.moves = 0;
        this.pushes = 0;
        this.gameWon = false;
        this.undoStack = [];
        
        // Update level title
        const titleComp = this.levelTitleText.getComponent(PureJS.TextComponent);
        titleComp.text = this.levels[this.currentLevel].title;
        
        // Update stats text
        this.updateStatsText();
        
        // Calculate level dimensions
        this.initializeLevel();
        
        // Parse level map
        const map = this.levels[this.currentLevel].map;
        
        for (let y = 0; y < map.length; y++) {
            this.grid[y] = [];
            
            for (let x = 0; x < map[y].length; x++) {
                const char = map[y][x];
                
                switch (char) {
                    case ' ': // Empty space
                        this.grid[y][x] = 'floor';
                        break;
                    case '#': // Wall
                        this.grid[y][x] = 'wall';
                        this.walls.push({ x, y });
                        break;
                    case '@': // Player
                        this.grid[y][x] = 'floor';
                        this.player = { x, y };
                        break;
                    case '$': // Box
                        this.grid[y][x] = 'floor';
                        this.boxes.push({ x, y });
                        break;
                    case '.': // Target
                        this.grid[y][x] = 'target';
                        this.targets.push({ x, y });
                        break;
                    case '*': // Box on target
                        this.grid[y][x] = 'target';
                        this.boxes.push({ x, y });
                        this.targets.push({ x, y });
                        break;
                    case '+': // Player on target
                        this.grid[y][x] = 'target';
                        this.player = { x, y };
                        this.targets.push({ x, y });
                        break;
                    default:
                        this.grid[y][x] = 'floor';
                }
            }
        }
    }
    
    /**
     * Update stats text
     */
    updateStatsText() {
        const textComp = this.statsText.getComponent(PureJS.TextComponent);
        textComp.text = `Moves: ${this.moves}  Pushes: ${this.pushes}`;
    }
    
    /**
     * Move the player in a direction
     * @param {string} direction - Direction to move (up, right, down, left)
     */
    movePlayer(direction) {
        // Define movement offsets
        const dx = direction === 'left' ? -1 : (direction === 'right' ? 1 : 0);
        const dy = direction === 'up' ? -1 : (direction === 'down' ? 1 : 0);
        
        // Calculate new position
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check if destination is valid
        if (newY < 0 || newY >= this.height || newX < 0 || newX >= this.width) {
            return false; // Out of bounds
        }
        
        // Check if destination is a wall
        if (this.grid[newY][newX] === 'wall') {
            return false; // Can't move into a wall
        }
        
        // Check if destination has a box
        let boxPushed = false;
        for (let i = 0; i < this.boxes.length; i++) {
            const box = this.boxes[i];
            
            if (box.x === newX && box.y === newY) {
                // There's a box, check if it can be pushed
                const newBoxX = newX + dx;
                const newBoxY = newY + dy;
                
                // Check if box destination is valid
                if (newBoxY < 0 || newBoxY >= this.height || newBoxX < 0 || newBoxX >= this.width) {
                    return false; // Out of bounds
                }
                
                // Check if box destination is a wall
                if (this.grid[newBoxY][newBoxX] === 'wall') {
                    return false; // Can't push into a wall
                }
                
                // Check if box destination has another box
                for (let j = 0; j < this.boxes.length; j++) {
                    if (this.boxes[j].x === newBoxX && this.boxes[j].y === newBoxY) {
                        return false; // Can't push into another box
                    }
                }
                
                // Save current state for undo
                this.saveStateForUndo();
                
                // Push the box
                this.boxes[i].x = newBoxX;
                this.boxes[i].y = newBoxY;
                boxPushed = true;
                this.pushes++;
                break;
            }
        }
        
        // If we didn't push a box, just save state for move
        if (!boxPushed) {
            this.saveStateForUndo();
        }
        
        // Move the player
        this.player.x = newX;
        this.player.y = newY;
        this.moves++;
        
        // Update stats
        this.updateStatsText();
        
        // Check if level is complete
        this.checkLevelComplete();
        
        return true;
    }
    
    /**
     * Save current state for undo
     */
    saveStateForUndo() {
        const state = {
            player: { ...this.player },
            boxes: this.boxes.map(box => ({ ...box })),
            moves: this.moves,
            pushes: this.pushes
        };
        
        this.undoStack.push(state);
    }
    
    /**
     * Undo the last move
     */
    undo() {
        if (this.undoStack.length === 0) {
            return; // Nothing to undo
        }
        
        // Get last state
        const lastState = this.undoStack.pop();
        
        // Restore state
        this.player = lastState.player;
        this.boxes = lastState.boxes;
        this.moves = lastState.moves;
        this.pushes = lastState.pushes;
        
        // Update stats
        this.updateStatsText();
    }
    
    /**
     * Check if level is complete (all boxes on targets)
     */
    checkLevelComplete() {
        // Count boxes on targets
        let boxesOnTarget = 0;
        
        for (const box of this.boxes) {
            // Check if box is on a target
            for (const target of this.targets) {
                if (box.x === target.x && box.y === target.y) {
                    boxesOnTarget++;
                    break;
                }
            }
        }
        
        // Level complete if all boxes are on targets
        if (boxesOnTarget === this.targets.length) {
            this.gameWon = true;
        }
    }
    
    /**
     * Go to next level
     */
    nextLevel() {
        // If there are more levels, go to next one
        if (this.currentLevel < this.levels.length - 1) {
            this.loadLevel(this.currentLevel + 1);
        }
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Nothing special to do here
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        // Skip input if level complete
        if (this.gameWon) {
            // Press any key for next level
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter') || PureJS.Input.isKeyPressed('n')) {
                this.nextLevel();
            }
            return;
        }
        
        // Handle input
        if (PureJS.Input.isKeyPressed('ArrowUp')) {
            this.movePlayer('up');
        } else if (PureJS.Input.isKeyPressed('ArrowRight')) {
            this.movePlayer('right');
        } else if (PureJS.Input.isKeyPressed('ArrowDown')) {
            this.movePlayer('down');
        } else if (PureJS.Input.isKeyPressed('ArrowLeft')) {
            this.movePlayer('left');
        } else if (PureJS.Input.isKeyPressed('r')) {
            // Restart level
            this.loadLevel(this.currentLevel);
        } else if (PureJS.Input.isKeyPressed('u')) {
            // Undo
            this.undo();
        } else if (PureJS.Input.isKeyPressed('n')) {
            // Next level
            this.nextLevel();
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (text, etc.)
        super.render(ctx);
        
        // Draw background
        ctx.fillStyle = '#333';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.width * this.cellSize, 
            this.height * this.cellSize
        );
        
        // Draw grid
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellX = this.offsetX + x * this.cellSize;
                const cellY = this.offsetY + y * this.cellSize;
                
                if (y < this.grid.length && x < this.grid[y].length) {
                    // Draw floor
                    if (this.grid[y][x] === 'floor') {
                        ctx.fillStyle = '#555';
                        ctx.fillRect(
                            cellX + 1, 
                            cellY + 1, 
                            this.cellSize - 2, 
                            this.cellSize - 2
                        );
                    }
                    
                    // Draw walls
                    if (this.grid[y][x] === 'wall') {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(
                            cellX, 
                            cellY, 
                            this.cellSize, 
                            this.cellSize
                        );
                        
                        // Add 3D effect to walls
                        ctx.fillStyle = '#aaa';
                        ctx.beginPath();
                        ctx.moveTo(cellX, cellY);
                        ctx.lineTo(cellX + this.cellSize, cellY);
                        ctx.lineTo(cellX, cellY + this.cellSize);
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.fillStyle = '#666';
                        ctx.beginPath();
                        ctx.moveTo(cellX + this.cellSize, cellY);
                        ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
                        ctx.lineTo(cellX, cellY + this.cellSize);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    // Draw targets
                    if (this.grid[y][x] === 'target') {
                        ctx.fillStyle = '#555';
                        ctx.fillRect(
                            cellX + 1, 
                            cellY + 1, 
                            this.cellSize - 2, 
                            this.cellSize - 2
                        );
                        
                        ctx.fillStyle = '#8B0000'; // Dark red target
                        ctx.beginPath();
                        ctx.arc(
                            cellX + this.cellSize / 2,
                            cellY + this.cellSize / 2,
                            this.cellSize / 4,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }
        }
        
        // Draw boxes
        for (const box of this.boxes) {
            const cellX = this.offsetX + box.x * this.cellSize;
            const cellY = this.offsetY + box.y * this.cellSize;
            
            // Check if box is on target
            let onTarget = false;
            for (const target of this.targets) {
                if (box.x === target.x && box.y === target.y) {
                    onTarget = true;
                    break;
                }
            }
            
            // Draw box with different color if on target
            ctx.fillStyle = onTarget ? '#8B4513' : '#B8860B'; // Darker if on target
            const padding = this.cellSize * 0.1;
            ctx.fillRect(
                cellX + padding,
                cellY + padding,
                this.cellSize - padding * 2,
                this.cellSize - padding * 2
            );
            
            // 3D effect for box
            ctx.fillStyle = onTarget ? '#A0522D' : '#DAA520'; // Highlight
            ctx.beginPath();
            ctx.moveTo(cellX + padding, cellY + padding);
            ctx.lineTo(cellX + this.cellSize - padding, cellY + padding);
            ctx.lineTo(cellX + padding, cellY + this.cellSize - padding);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = onTarget ? '#654321' : '#8B6914'; // Shadow
            ctx.beginPath();
            ctx.moveTo(cellX + this.cellSize - padding, cellY + padding);
            ctx.lineTo(cellX + this.cellSize - padding, cellY + this.cellSize - padding);
            ctx.lineTo(cellX + padding, cellY + this.cellSize - padding);
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw player
        const playerX = this.offsetX + this.player.x * this.cellSize;
        const playerY = this.offsetY + this.player.y * this.cellSize;
        
        // Check if player is on target
        let playerOnTarget = false;
        for (const target of this.targets) {
            if (this.player.x === target.x && this.player.y === target.y) {
                playerOnTarget = true;
                break;
            }
        }
        
        // Player body
        ctx.fillStyle = '#4169E1'; // Royal blue
        const radius = this.cellSize * 0.35;
        ctx.beginPath();
        ctx.arc(
            playerX + this.cellSize / 2,
            playerY + this.cellSize / 2,
            radius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Player face (eyes and mouth)
        ctx.fillStyle = '#FFFFFF';
        const eyeRadius = radius * 0.2;
        const eyeOffsetX = radius * 0.3;
        const eyeOffsetY = radius * 0.1;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(
            playerX + this.cellSize / 2 - eyeOffsetX,
            playerY + this.cellSize / 2 - eyeOffsetY,
            eyeRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(
            playerX + this.cellSize / 2 + eyeOffsetX,
            playerY + this.cellSize / 2 - eyeOffsetY,
            eyeRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Mouth (smile)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            playerX + this.cellSize / 2,
            playerY + this.cellSize / 2,
            radius * 0.6,
            0.1 * Math.PI,
            0.9 * Math.PI
        );
        ctx.stroke();
        
        // Highlight if on target
        if (playerOnTarget) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                playerX + this.cellSize / 2,
                playerY + this.cellSize / 2,
                radius + 3,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        // Draw level complete message
        if (this.gameWon) {
            // Level number
            const levelNumber = this.currentLevel + 1;
            const isLastLevel = this.currentLevel === this.levels.length - 1;
            
            // Overlay
            ctx.fillStyle = 'rgba(0, 128, 0, 0.5)';
            ctx.fillRect(
                this.offsetX,
                this.offsetY,
                this.width * this.cellSize,
                this.height * this.cellSize
            );
            
            // Win text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 28px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                `Level ${levelNumber} Complete!`,
                this.game.game.width / 2,
                this.game.game.height / 2 - 30
            );
            
            // Stats text
            ctx.font = '20px Roboto';
            ctx.fillText(
                `Moves: ${this.moves}  Pushes: ${this.pushes}`,
                this.game.game.width / 2,
                this.game.game.height / 2 + 10
            );
            
            // Next level instructions
            ctx.font = '18px Roboto';
            if (!isLastLevel) {
                ctx.fillText(
                    'Press Space, Enter, or N for next level',
                    this.game.game.width / 2,
                    this.game.game.height / 2 + 50
                );
            } else {
                ctx.fillText(
                    'All levels complete! Congratulations!',
                    this.game.game.width / 2,
                    this.game.game.height / 2 + 50
                );
            }
        }
    }
}

/**
 * Load Sokoban game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadSokobanGame(game, onLoaded) {
    // Create a Sokoban scene
    const sokobanScene = new SokobanScene(game);
    
    // Add scene to game
    game.addScene('sokoban', sokobanScene);
    
    // Set as current scene
    game.setScene('sokoban');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}