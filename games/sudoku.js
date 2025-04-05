/**
 * Sudoku Game
 * Classic number-placement puzzle game
 */

/**
 * Sudoku Scene
 * @class
 * @extends PureJS.Scene
 */
class SudokuScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game dimensions
        this.gridSize = 9;
        this.cellSize = Math.min(
            game.game.width / (this.gridSize + 2) / 1.2,
            game.game.height / (this.gridSize + 4) / 1.2
        );
        this.areaWidth = this.gridSize * this.cellSize;
        this.areaHeight = this.gridSize * this.cellSize;
        this.offsetX = (game.game.width - this.areaWidth) / 2;
        this.offsetY = (game.game.height - this.areaHeight) / 2;
        
        // Game state
        this.grid = [];
        this.solution = [];
        this.locked = []; // Cells locked at start
        this.notes = []; // Player notes for each cell
        this.conflicts = []; // Cells with conflicts
        this.selectedCell = null;
        this.gameWon = false;
        this.errorCount = 0;
        this.difficulty = 'medium'; // easy, medium, hard
        this.moveHistory = []; // For undo
        
        // Create text entity for difficulty
        const difficultyText = game.createEntity({
            x: this.offsetX + 100,
            y: this.offsetY / 2
        });
        
        difficultyText.addComponent(new PureJS.TextComponent({
            text: 'Difficulty: Medium',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'left'
        }));
        
        this.difficultyText = difficultyText;
        this.addEntity(difficultyText);
        
        // Create text entity for errors
        const errorText = game.createEntity({
            x: game.game.width - this.offsetX - 100,
            y: this.offsetY / 2
        });
        
        errorText.addComponent(new PureJS.TextComponent({
            text: 'Errors: 0/3',
            font: 'bold 20px Roboto',
            color: '#fff',
            align: 'right'
        }));
        
        this.errorText = errorText;
        this.addEntity(errorText);
        
        // Add instructions text
        const instructionsText = game.createEntity({
            x: game.game.width / 2,
            y: game.game.height - this.offsetY / 2
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Click cell, type 1-9 to place number. N: Toggle notes, U: Undo, D: Change difficulty, R: Restart',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
        
        // Initialize the game
        this.initializeGame();
        
        // Add keyboard event listeners
        this.initializeKeyboardListeners();
    }
    
    /**
     * Initialize game with new puzzle
     */
    initializeGame() {
        // Reset game state
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.locked = Array(9).fill().map(() => Array(9).fill(false));
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
        this.conflicts = [];
        this.selectedCell = null;
        this.gameWon = false;
        this.errorCount = 0;
        this.moveHistory = [];
        
        // Generate a new puzzle
        this.generatePuzzle();
        
        // Update UI
        this.updateDifficultyText();
        this.updateErrorText();
    }
    
    /**
     * Add keyboard event listeners
     */
    initializeKeyboardListeners() {
        // Handle number keys on key down event
        document.addEventListener('keydown', (e) => {
            // Only process if this scene is active
            if (this.game.game.currentScene !== this || this.gameWon) return;
            
            // If a cell is selected
            if (this.selectedCell) {
                const { row, col } = this.selectedCell;
                
                // Number keys 1-9
                if (e.key >= '1' && e.key <= '9' && !this.locked[row][col]) {
                    const num = parseInt(e.key);
                    
                    // Save current state for undo
                    this.saveStateForUndo();
                    
                    // If in notes mode (holding 'n' key), toggle note
                    if (PureJS.Input.isKeyDown('n') || PureJS.Input.isKeyDown('N')) {
                        this.notes[row][col][num-1] = !this.notes[row][col][num-1];
                        
                        // If we're adding a note, clear the actual number
                        if (this.notes[row][col][num-1] && this.grid[row][col] !== 0) {
                            this.grid[row][col] = 0;
                        }
                    } else {
                        // Normal number entry
                        
                        // Check if the number is valid
                        const isValid = this.isValidMove(row, col, num);
                        
                        // Place the number regardless
                        this.grid[row][col] = num;
                        
                        // Clear any notes in this cell
                        this.notes[row][col] = Array(9).fill(false);
                        
                        // If it's not valid, increment error count
                        if (!isValid) {
                            this.errorCount++;
                            this.updateErrorText();
                            
                            // Highlight conflict
                            this.conflicts.push({ row, col, errorTime: 1.0 });
                        }
                        
                        // Check for win condition
                        this.checkForWin();
                    }
                }
                
                // Delete or backspace to clear cell
                if ((e.key === 'Delete' || e.key === 'Backspace') && !this.locked[row][col]) {
                    // Save current state for undo
                    this.saveStateForUndo();
                    
                    this.grid[row][col] = 0;
                    this.notes[row][col] = Array(9).fill(false);
                }
            }
            
            // Undo with 'u' key
            if ((e.key === 'u' || e.key === 'U') && this.moveHistory.length > 0) {
                this.undo();
            }
            
            // Change difficulty with 'd' key
            if (e.key === 'd' || e.key === 'D') {
                this.cycleDifficulty();
            }
            
            // Restart with 'r' key
            if (e.key === 'r' || e.key === 'R') {
                this.initializeGame();
            }
        });
    }
    
    /**
     * Save current state for undo
     */
    saveStateForUndo() {
        const state = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            notes: JSON.parse(JSON.stringify(this.notes)),
            errorCount: this.errorCount
        };
        
        this.moveHistory.push(state);
    }
    
    /**
     * Undo the last move
     */
    undo() {
        if (this.moveHistory.length === 0) return;
        
        const prevState = this.moveHistory.pop();
        this.grid = prevState.grid;
        this.notes = prevState.notes;
        this.errorCount = prevState.errorCount;
        this.updateErrorText();
        
        // Clear conflicts
        this.conflicts = [];
    }
    
    /**
     * Cycle through difficulties
     */
    cycleDifficulty() {
        switch (this.difficulty) {
            case 'easy':
                this.difficulty = 'medium';
                break;
            case 'medium':
                this.difficulty = 'hard';
                break;
            case 'hard':
                this.difficulty = 'easy';
                break;
        }
        
        this.updateDifficultyText();
        this.initializeGame();
    }
    
    /**
     * Update difficulty text
     */
    updateDifficultyText() {
        const textComp = this.difficultyText.getComponent(PureJS.TextComponent);
        textComp.text = `Difficulty: ${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}`;
    }
    
    /**
     * Update error text
     */
    updateErrorText() {
        const textComp = this.errorText.getComponent(PureJS.TextComponent);
        textComp.text = `Errors: ${this.errorCount}/3`;
    }
    
    /**
     * Process mouse click
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     */
    processClick(x, y) {
        // Convert to grid coordinates
        const col = Math.floor((x - this.offsetX) / this.cellSize);
        const row = Math.floor((y - this.offsetY) / this.cellSize);
        
        // Check if within grid
        if (col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize) {
            this.selectedCell = { row, col };
        } else {
            this.selectedCell = null;
        }
    }
    
    /**
     * Generate a Sudoku puzzle
     */
    generatePuzzle() {
        // Start with an empty grid
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill in the solution grid
        this.solveSudoku(this.solution, true);
        
        // Copy the solution to the player grid
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.grid[r][c] = this.solution[r][c];
                this.locked[r][c] = true;
            }
        }
        
        // Remove numbers based on difficulty to create the puzzle
        const cellsToRemove = {
            'easy': 40,
            'medium': 50,
            'hard': 60
        }[this.difficulty];
        
        // Create a list of all cells
        const cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                cells.push({ r, c });
            }
        }
        
        // Shuffle the list
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        
        // Remove cells one by one
        let removed = 0;
        for (let i = 0; i < cells.length && removed < cellsToRemove; i++) {
            const { r, c } = cells[i];
            const backup = this.grid[r][c];
            
            // Remove the number
            this.grid[r][c] = 0;
            this.locked[r][c] = false;
            
            // Check if the puzzle still has a unique solution
            const tempGrid = JSON.parse(JSON.stringify(this.grid));
            let solutions = 0;
            this.countSolutions(tempGrid, 0, 0, solutions);
            
            // If it doesn't have a unique solution, put the number back
            if (solutions !== 1) {
                this.grid[r][c] = backup;
                this.locked[r][c] = true;
            } else {
                removed++;
            }
        }
    }
    
    /**
     * Count solutions for a Sudoku grid
     * @param {Array} grid - The grid to solve
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @param {Object} solutions - Solutions counter
     * @returns {boolean} Whether the grid has a solution
     */
    countSolutions(grid, row, col, solutions) {
        // If we've counted too many solutions, stop
        if (solutions.count > 1) return;
        
        // If we've reached the end of the grid, we found a solution
        if (row === 9) {
            solutions.count++;
            return;
        }
        
        // Calculate next cell position
        const nextCol = (col + 1) % 9;
        const nextRow = nextCol === 0 ? row + 1 : row;
        
        // If this cell is already filled, move to the next one
        if (grid[row][col] !== 0) {
            this.countSolutions(grid, nextRow, nextCol, solutions);
            return;
        }
        
        // Try each possible number
        for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                this.countSolutions(grid, nextRow, nextCol, solutions);
                grid[row][col] = 0; // Backtrack
            }
        }
    }
    
    /**
     * Solve a Sudoku grid
     * @param {Array} grid - The grid to solve
     * @param {boolean} randomize - Whether to randomize the numbers
     * @returns {boolean} Whether the grid was solved
     */
    solveSudoku(grid, randomize = false) {
        // Find an empty cell
        let row = -1;
        let col = -1;
        let isEmpty = false;
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    row = r;
                    col = c;
                    isEmpty = true;
                    break;
                }
            }
            if (isEmpty) break;
        }
        
        // If no empty cell found, the grid is solved
        if (!isEmpty) return true;
        
        // Get the numbers to try
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // Randomize the numbers if requested
        if (randomize) {
            for (let i = nums.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [nums[i], nums[j]] = [nums[j], nums[i]];
            }
        }
        
        // Try each number
        for (const num of nums) {
            if (this.isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                
                if (this.solveSudoku(grid, randomize)) {
                    return true;
                }
                
                grid[row][col] = 0; // Backtrack
            }
        }
        
        return false;
    }
    
    /**
     * Check if a number can be placed in a cell
     * @param {Array} grid - The grid to check
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} Whether the number can be placed
     */
    isValidPlacement(grid, row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (grid[row][c] === num) return false;
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (grid[boxRow + r][boxCol + c] === num) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if a move is valid
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} Whether the move is valid
     */
    isValidMove(row, col, num) {
        return this.solution[row][col] === num;
    }
    
    /**
     * Check if the puzzle is solved
     */
    checkForWin() {
        // Check if all cells are filled correctly
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] !== this.solution[r][c]) {
                    return;
                }
            }
        }
        
        // If we get here, the puzzle is solved
        this.gameWon = true;
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
        
        // Handle mouse click
        if (PureJS.Input.mouse.pressed) {
            this.processClick(PureJS.Input.mouse.x, PureJS.Input.mouse.y);
        }
        
        // Update error highlighting
        for (let i = this.conflicts.length - 1; i >= 0; i--) {
            this.conflicts[i].errorTime -= dt;
            if (this.conflicts[i].errorTime <= 0) {
                this.conflicts.splice(i, 1);
            }
        }
        
        // Check for game over (too many errors)
        if (this.errorCount >= 3) {
            this.errorCount = 3; // Cap at 3
            // Game over
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render entities (difficulty, errors, etc.)
        super.render(ctx);
        
        // Draw game area background
        ctx.fillStyle = '#fff';
        ctx.fillRect(
            this.offsetX, 
            this.offsetY, 
            this.areaWidth, 
            this.areaHeight
        );
        
        // Draw grid lines
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let i = 0; i <= this.gridSize; i++) {
            const y = this.offsetY + i * this.cellSize;
            
            // Draw thicker lines for 3x3 boxes
            ctx.lineWidth = i % 3 === 0 ? 2 : 1;
            
            ctx.beginPath();
            ctx.moveTo(this.offsetX, y);
            ctx.lineTo(this.offsetX + this.areaWidth, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let i = 0; i <= this.gridSize; i++) {
            const x = this.offsetX + i * this.cellSize;
            
            // Draw thicker lines for 3x3 boxes
            ctx.lineWidth = i % 3 === 0 ? 2 : 1;
            
            ctx.beginPath();
            ctx.moveTo(x, this.offsetY);
            ctx.lineTo(x, this.offsetY + this.areaHeight);
            ctx.stroke();
        }
        
        // Draw cell backgrounds
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cellX = this.offsetX + col * this.cellSize;
                const cellY = this.offsetY + row * this.cellSize;
                
                // Highlight selected cell
                if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                    ctx.fillStyle = '#e3f2fd'; // Light blue
                    ctx.fillRect(
                        cellX + 1, 
                        cellY + 1, 
                        this.cellSize - 2, 
                        this.cellSize - 2
                    );
                }
                
                // Highlight same number as selected
                if (this.selectedCell && this.grid[this.selectedCell.row][this.selectedCell.col] !== 0 &&
                    this.grid[row][col] === this.grid[this.selectedCell.row][this.selectedCell.col]) {
                    ctx.fillStyle = '#e8f5e9'; // Light green
                    ctx.fillRect(
                        cellX + 1, 
                        cellY + 1, 
                        this.cellSize - 2, 
                        this.cellSize - 2
                    );
                }
                
                // Highlight conflict cells
                for (const conflict of this.conflicts) {
                    if (conflict.row === row && conflict.col === col) {
                        ctx.fillStyle = `rgba(255, 0, 0, ${conflict.errorTime * 0.3})`; // Red with fading alpha
                        ctx.fillRect(
                            cellX + 1, 
                            cellY + 1, 
                            this.cellSize - 2, 
                            this.cellSize - 2
                        );
                    }
                }
            }
        }
        
        // Draw numbers and notes
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cellX = this.offsetX + col * this.cellSize;
                const cellY = this.offsetY + row * this.cellSize;
                
                // Draw number if cell is not empty
                if (this.grid[row][col] !== 0) {
                    // Different style for locked numbers
                    if (this.locked[row][col]) {
                        ctx.fillStyle = '#000'; // Black for original numbers
                        ctx.font = `bold ${this.cellSize * 0.6}px Roboto`;
                    } else {
                        ctx.fillStyle = '#0066cc'; // Blue for player numbers
                        ctx.font = `${this.cellSize * 0.6}px Roboto`;
                    }
                    
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        this.grid[row][col].toString(),
                        cellX + this.cellSize / 2,
                        cellY + this.cellSize / 2
                    );
                } else {
                    // Draw notes if cell is empty
                    ctx.fillStyle = '#666';
                    ctx.font = `${this.cellSize * 0.2}px Roboto`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    for (let n = 0; n < 9; n++) {
                        if (this.notes[row][col][n]) {
                            const noteRow = Math.floor(n / 3);
                            const noteCol = n % 3;
                            const noteX = cellX + (noteCol + 0.5) * (this.cellSize / 3);
                            const noteY = cellY + (noteRow + 0.5) * (this.cellSize / 3);
                            
                            ctx.fillText(
                                (n + 1).toString(),
                                noteX,
                                noteY
                            );
                        }
                    }
                }
            }
        }
        
        // Draw win message
        if (this.gameWon) {
            ctx.fillStyle = 'rgba(0, 128, 0, 0.7)';
            ctx.fillRect(this.offsetX, this.offsetY, this.areaWidth, this.areaHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PUZZLE SOLVED!', this.game.game.width / 2, this.game.game.height / 2 - 30);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Errors: ${this.errorCount}/3`, this.game.game.width / 2, this.game.game.height / 2 + 20);
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press R to play again with a new puzzle', this.game.game.width / 2, this.game.game.height / 2 + 60);
        }
    }
}

/**
 * Load Sudoku game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadSudokuGame(game, onLoaded) {
    // Create a Sudoku scene
    const sudokuScene = new SudokuScene(game);
    
    // Add scene to game
    game.addScene('sudoku', sudokuScene);
    
    // Set as current scene
    game.setScene('sudoku');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}