/**
 * Racing Game
 * A top-down racing game with time trials
 */

/**
 * Racing Scene
 * @class
 * @extends PureJS.Scene
 */
class RacingScene extends PureJS.Scene {
    constructor(game) {
        super({});
        
        this.game = game;
        
        // Game configuration
        this.trackWidth = 100; // Width of the track
        this.carWidth = 30;
        this.carHeight = 50;
        this.maxSpeed = 300;
        this.acceleration = 200;
        this.deceleration = 150;
        this.brakeDeceleration = 300;
        this.turnSpeed = 3; // Radians per second
        
        // Game state
        this.player = {
            x: 0,
            y: 0,
            rotation: 0,
            speed: 0,
            lap: 0,
            checkpoint: 0,
            lastCheckpointTime: 0,
            bestLapTime: null,
            currentLapTime: 0,
            offTrack: false,
            crashTime: 0
        };
        
        this.camera = {
            x: 0,
            y: 0
        };
        
        this.raceStarted = false;
        this.raceFinished = false;
        this.countdownValue = 3;
        this.countdownTime = 0;
        this.raceTime = 0;
        this.gameOver = false;
        
        // Define track
        this.createTrack();
        
        // Create text entities
        this.createTextEntities();
        
        // Position player at starting position
        this.resetPlayer();
    }
    
    /**
     * Create UI text entities
     */
    createTextEntities() {
        // Lap counter text
        const lapText = this.game.createEntity({
            x: 100,
            y: 30
        });
        
        lapText.addComponent(new PureJS.TextComponent({
            text: 'Lap: 0/3',
            font: 'bold 24px Roboto',
            color: '#fff',
            align: 'left'
        }));
        
        this.lapText = lapText;
        this.addEntity(lapText);
        
        // Time text
        const timeText = this.game.createEntity({
            x: this.game.game.width / 2,
            y: 30
        });
        
        timeText.addComponent(new PureJS.TextComponent({
            text: 'Time: 00:00.000',
            font: 'bold 24px Roboto',
            color: '#fff'
        }));
        
        this.timeText = timeText;
        this.addEntity(timeText);
        
        // Best lap text
        const bestLapText = this.game.createEntity({
            x: this.game.game.width - 100,
            y: 30
        });
        
        bestLapText.addComponent(new PureJS.TextComponent({
            text: 'Best: --:--:---',
            font: 'bold 24px Roboto',
            color: '#fff',
            align: 'right'
        }));
        
        this.bestLapText = bestLapText;
        this.addEntity(bestLapText);
        
        // Speed text
        const speedText = this.game.createEntity({
            x: 100,
            y: 60
        });
        
        speedText.addComponent(new PureJS.TextComponent({
            text: 'Speed: 0 km/h',
            font: '20px Roboto',
            color: '#fff',
            align: 'left'
        }));
        
        this.speedText = speedText;
        this.addEntity(speedText);
        
        // Instructions text
        const instructionsText = this.game.createEntity({
            x: this.game.game.width / 2,
            y: this.game.game.height - 20
        });
        
        instructionsText.addComponent(new PureJS.TextComponent({
            text: 'Arrow Keys: Steer and Accelerate | Space: Brake',
            font: '16px Roboto',
            color: '#aaa'
        }));
        
        this.addEntity(instructionsText);
    }
    
    /**
     * Create track layout
     */
    createTrack() {
        // Define track path as a series of control points
        this.trackPath = [
            { x: 400, y: 500 },  // Starting point
            { x: 600, y: 300 },
            { x: 800, y: 200 },
            { x: 1000, y: 300 },
            { x: 1100, y: 500 },
            { x: 1000, y: 700 },
            { x: 800, y: 800 },
            { x: 600, y: 750 },
            { x: 400, y: 650 }
        ];
        
        // Calculate track length for distance tracking
        this.calculateTrackLength();
        
        // Place checkpoints along the track
        this.createCheckpoints();
    }
    
    /**
     * Calculate track segment lengths and total length
     */
    calculateTrackLength() {
        this.segmentLengths = [];
        this.trackLength = 0;
        
        for (let i = 0; i < this.trackPath.length; i++) {
            const current = this.trackPath[i];
            const next = this.trackPath[(i + 1) % this.trackPath.length];
            
            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            this.segmentLengths.push(length);
            this.trackLength += length;
        }
    }
    
    /**
     * Create checkpoints along the track
     */
    createCheckpoints() {
        this.checkpoints = [];
        
        // Create a checkpoint at each track path control point
        for (let i = 0; i < this.trackPath.length; i++) {
            const current = this.trackPath[i];
            const next = this.trackPath[(i + 1) % this.trackPath.length];
            
            // Calculate direction vector
            const dx = next.x - current.x;
            const dy = next.y - current.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize direction
            const dirX = dx / length;
            const dirY = dy / length;
            
            // Calculate perpendicular vector (for checkpoint width)
            const perpX = -dirY;
            const perpY = dirX;
            
            this.checkpoints.push({
                x: current.x,
                y: current.y,
                dirX: dirX,
                dirY: dirY,
                perpX: perpX,
                perpY: perpY
            });
        }
    }
    
    /**
     * Reset player to starting position
     */
    resetPlayer() {
        // Position at first checkpoint
        const startPoint = this.checkpoints[0];
        
        this.player.x = startPoint.x;
        this.player.y = startPoint.y;
        
        // Face in direction of track
        this.player.rotation = Math.atan2(startPoint.dirY, startPoint.dirX);
        
        // Reset other stats
        this.player.speed = 0;
        this.player.lap = 0;
        this.player.checkpoint = 0;
        this.player.lastCheckpointTime = 0;
        this.player.currentLapTime = 0;
        this.player.offTrack = false;
        this.player.crashTime = 0;
        
        // Update camera
        this.updateCamera();
    }
    
    /**
     * Format time in mm:ss.ms format
     */
    formatTime(timeMs) {
        const minutes = Math.floor(timeMs / 60000);
        const seconds = Math.floor((timeMs % 60000) / 1000);
        const ms = Math.floor(timeMs % 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    /**
     * Update text displays
     */
    updateTextDisplays() {
        // Update lap text
        const lapTextComp = this.lapText.getComponent(PureJS.TextComponent);
        lapTextComp.text = `Lap: ${this.player.lap}/3`;
        
        // Update time text
        const timeTextComp = this.timeText.getComponent(PureJS.TextComponent);
        timeTextComp.text = `Time: ${this.formatTime(this.raceTime)}`;
        
        // Update best lap text
        const bestLapTextComp = this.bestLapText.getComponent(PureJS.TextComponent);
        if (this.player.bestLapTime !== null) {
            bestLapTextComp.text = `Best: ${this.formatTime(this.player.bestLapTime)}`;
        } else {
            bestLapTextComp.text = 'Best: --:--:---';
        }
        
        // Update speed text
        const speedTextComp = this.speedText.getComponent(PureJS.TextComponent);
        // Convert speed to km/h (arbitrary multiplier for game feel)
        const speedKmh = Math.round(this.player.speed * 0.36);
        speedTextComp.text = `Speed: ${speedKmh} km/h`;
        
        // Modify speed text color based on speed
        if (speedKmh > 80) {
            speedTextComp.color = '#4CAF50'; // Green for high speed
        } else if (speedKmh > 40) {
            speedTextComp.color = '#FFC107'; // Yellow for medium speed
        } else {
            speedTextComp.color = '#ffffff'; // White for low speed
        }
    }
    
    /**
     * Check if point is on the track
     */
    isPointOnTrack(x, y) {
        let onTrack = false;
        
        // Check distance to the nearest track segment
        for (let i = 0; i < this.trackPath.length; i++) {
            const current = this.trackPath[i];
            const next = this.trackPath[(i + 1) % this.trackPath.length];
            
            // Calculate segment vector
            const segmentX = next.x - current.x;
            const segmentY = next.y - current.y;
            const segmentLength = Math.sqrt(segmentX * segmentX + segmentY * segmentY);
            
            // Calculate vector from segment start to point
            const vectorX = x - current.x;
            const vectorY = y - current.y;
            
            // Project point onto segment
            const dot = (vectorX * segmentX + vectorY * segmentY) / segmentLength;
            const projectionLength = Math.max(0, Math.min(segmentLength, dot));
            
            // Calculate projected point
            const projectionX = current.x + (projectionLength / segmentLength) * segmentX;
            const projectionY = current.y + (projectionLength / segmentLength) * segmentY;
            
            // Calculate distance from point to projected point
            const distanceX = x - projectionX;
            const distanceY = y - projectionY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // If distance is less than track width, point is on track
            if (distance < this.trackWidth / 2) {
                onTrack = true;
                break;
            }
        }
        
        return onTrack;
    }
    
    /**
     * Check if player passed a checkpoint
     */
    checkCheckpoints(dt) {
        // Get current and next checkpoint
        const currentCheckpoint = this.player.checkpoint;
        const nextCheckpoint = (currentCheckpoint + 1) % this.checkpoints.length;
        const checkpoint = this.checkpoints[nextCheckpoint];
        
        // Calculate vector from checkpoint to player
        const vectorX = this.player.x - checkpoint.x;
        const vectorY = this.player.y - checkpoint.y;
        
        // Project onto perpendicular direction to check if crossed
        const perpDot = vectorX * checkpoint.perpX + vectorY * checkpoint.perpY;
        
        // Distance to checkpoint line
        const dirDot = vectorX * checkpoint.dirX + vectorY * checkpoint.dirY;
        
        // If crossed checkpoint and within track width
        if (perpDot > 0 && Math.abs(dirDot) < this.trackWidth) {
            this.player.checkpoint = nextCheckpoint;
            
            // If crossed start/finish line
            if (nextCheckpoint === 0) {
                // Complete a lap
                this.player.lap++;
                
                // Calculate lap time
                const currentTime = this.raceTime;
                const lapTime = currentTime - this.player.lastCheckpointTime;
                
                // Update best lap time
                if (this.player.bestLapTime === null || lapTime < this.player.bestLapTime) {
                    this.player.bestLapTime = lapTime;
                }
                
                // Reset lap timer
                this.player.lastCheckpointTime = currentTime;
                
                // Check for race finish (3 laps)
                if (this.player.lap >= 3) {
                    this.raceFinished = true;
                }
            }
        }
    }
    
    /**
     * Update camera position to follow the player
     */
    updateCamera() {
        // Camera follows the player with some look-ahead
        const lookAheadDistance = this.player.speed * 0.3;
        const lookAheadX = this.player.x + Math.cos(this.player.rotation) * lookAheadDistance;
        const lookAheadY = this.player.y + Math.sin(this.player.rotation) * lookAheadDistance;
        
        this.camera.x = lookAheadX - this.game.game.width / 2;
        this.camera.y = lookAheadY - this.game.game.height / 2;
    }
    
    /**
     * Update player car physics and controls
     */
    updatePlayer(dt) {
        // Get keyboard input
        let accelerate = PureJS.Input.isKeyDown('ArrowUp');
        let brake = PureJS.Input.isKeyDown('ArrowDown') || PureJS.Input.isKeyDown('Space');
        let turnLeft = PureJS.Input.isKeyDown('ArrowLeft');
        let turnRight = PureJS.Input.isKeyDown('ArrowRight');
        
        // If player crashed, reduce controls for a brief period
        if (this.player.crashTime > 0) {
            this.player.crashTime -= dt;
            accelerate = false;
            brake = false;
            
            // Add some visual shake to the camera
            const shakeMagnitude = Math.min(30, this.player.crashTime * 100);
            this.camera.x += (Math.random() - 0.5) * shakeMagnitude;
            this.camera.y += (Math.random() - 0.5) * shakeMagnitude;
        }
        
        // Update rotation based on turning input and speed
        const turnFactor = this.player.speed / this.maxSpeed; // More effective turning at higher speeds
        
        if (turnLeft) {
            this.player.rotation -= this.turnSpeed * turnFactor * dt;
        }
        if (turnRight) {
            this.player.rotation += this.turnSpeed * turnFactor * dt;
        }
        
        // Calculate forward direction
        const forwardX = Math.cos(this.player.rotation);
        const forwardY = Math.sin(this.player.rotation);
        
        // Apply acceleration/braking
        if (accelerate) {
            // Acceleration is reduced when off track
            const trackFactor = this.player.offTrack ? 0.3 : 1.0;
            this.player.speed += this.acceleration * trackFactor * dt;
        } else if (brake) {
            this.player.speed -= this.brakeDeceleration * dt;
        } else {
            // Natural deceleration
            this.player.speed -= this.deceleration * dt;
        }
        
        // Clamp speed
        this.player.speed = Math.max(0, Math.min(this.maxSpeed, this.player.speed));
        
        // Move player
        const distanceMoved = this.player.speed * dt;
        this.player.x += forwardX * distanceMoved;
        this.player.y += forwardY * distanceMoved;
        
        // Check if player is on track
        this.player.offTrack = !this.isPointOnTrack(this.player.x, this.player.y);
        
        // If off track, apply additional friction
        if (this.player.offTrack) {
            this.player.speed *= 0.95;
        }
        
        // Check for checkpoint crossing
        this.checkCheckpoints(dt);
        
        // Check for collisions with track boundaries
        if (this.player.offTrack) {
            // Check if high speed collision with boundary
            if (this.player.speed > this.maxSpeed * 0.5 && this.player.crashTime <= 0) {
                // Simulate crash
                this.player.speed *= 0.3; // Reduce speed
                this.player.crashTime = 0.5; // Half second of loss of control
                
                // Create particle effect for crash
                this.createCrashParticles();
            }
        }
    }
    
    /**
     * Create particles for car crash
     */
    createCrashParticles() {
        // This is just a placeholder in case you want to add particles
        // Since we haven't implemented a full particle system in this example
    }
    
    /**
     * Update countdown at the start of the race
     */
    updateCountdown(dt) {
        if (!this.raceStarted) {
            this.countdownTime += dt;
            
            // Update countdown every second
            if (this.countdownTime >= 1) {
                this.countdownValue--;
                this.countdownTime = 0;
                
                // Start the race when countdown reaches 0
                if (this.countdownValue < 0) {
                    this.raceStarted = true;
                }
            }
        }
    }
    
    /**
     * Reset game state
     */
    reset() {
        // Reset race state
        this.raceStarted = false;
        this.raceFinished = false;
        this.countdownValue = 3;
        this.countdownTime = 0;
        this.raceTime = 0;
        this.gameOver = false;
        
        // Reset player
        this.resetPlayer();
        
        // Update UI
        this.updateTextDisplays();
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // Reset game state if needed
        if (this.gameOver || this.raceFinished) {
            this.reset();
        }
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        super.update(dt);
        
        if (this.gameOver || this.raceFinished) {
            // Check for restart
            if (PureJS.Input.isKeyPressed('Space') || PureJS.Input.isKeyPressed('Enter')) {
                this.reset();
            }
            return;
        }
        
        // Update countdown
        this.updateCountdown(dt);
        
        // If race is started
        if (this.raceStarted) {
            // Update race time
            this.raceTime += dt * 1000; // Convert to milliseconds
            
            // Update player
            this.updatePlayer(dt);
            
            // Update camera to follow player
            this.updateCamera();
            
            // Update text displays
            this.updateTextDisplays();
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Draw off-track background
        ctx.fillStyle = '#2E7D32'; // Dark green (grass)
        ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
        
        // Apply camera transform
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw track
        this.renderTrack(ctx);
        
        // Draw checkpoints
        this.renderCheckpoints(ctx);
        
        // Draw player car
        this.renderPlayerCar(ctx);
        
        // Restore original transform
        ctx.restore();
        
        // Render entities (text, etc.) - these don't move with camera
        super.render(ctx);
        
        // Draw countdown overlay
        if (!this.raceStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 72px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (this.countdownValue > 0) {
                ctx.fillText(`${this.countdownValue}`, this.game.game.width / 2, this.game.game.height / 2);
            } else {
                ctx.fillText('GO!', this.game.game.width / 2, this.game.game.height / 2);
            }
        }
        
        // Draw race finished overlay
        if (this.raceFinished) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.game.game.width, this.game.game.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('RACE COMPLETE!', this.game.game.width / 2, this.game.game.height / 2 - 50);
            
            ctx.font = '24px Roboto';
            ctx.fillText(`Total Time: ${this.formatTime(this.raceTime)}`, this.game.game.width / 2, this.game.game.height / 2);
            
            if (this.player.bestLapTime !== null) {
                ctx.fillText(`Best Lap: ${this.formatTime(this.player.bestLapTime)}`, this.game.game.width / 2, this.game.game.height / 2 + 40);
            }
            
            ctx.font = '18px Roboto';
            ctx.fillText('Press Space or Enter to restart', this.game.game.width / 2, this.game.game.height / 2 + 80);
        }
    }
    
    /**
     * Render track path
     */
    renderTrack(ctx) {
        // Draw track path
        ctx.strokeStyle = '#555555'; // Track border
        ctx.lineWidth = this.trackWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw track asphalt
        ctx.beginPath();
        ctx.moveTo(this.trackPath[0].x, this.trackPath[0].y);
        
        for (let i = 1; i < this.trackPath.length; i++) {
            ctx.lineTo(this.trackPath[i].x, this.trackPath[i].y);
        }
        
        // Close the loop
        ctx.lineTo(this.trackPath[0].x, this.trackPath[0].y);
        ctx.stroke();
        
        // Draw track center line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]); // Dashed line
        
        ctx.beginPath();
        ctx.moveTo(this.trackPath[0].x, this.trackPath[0].y);
        
        for (let i = 1; i < this.trackPath.length; i++) {
            ctx.lineTo(this.trackPath[i].x, this.trackPath[i].y);
        }
        
        // Close the loop
        ctx.lineTo(this.trackPath[0].x, this.trackPath[0].y);
        ctx.stroke();
        
        // Reset line dash
        ctx.setLineDash([]);
    }
    
    /**
     * Render checkpoints
     */
    renderCheckpoints(ctx) {
        // Draw start/finish line
        const start = this.checkpoints[0];
        
        ctx.save();
        ctx.translate(start.x, start.y);
        ctx.rotate(Math.atan2(start.perpY, start.perpX));
        
        // Draw checkered pattern
        const checkSize = 10;
        const checkCount = Math.ceil(this.trackWidth / checkSize);
        
        for (let i = -checkCount; i <= checkCount; i++) {
            for (let j = -3; j <= 3; j++) {
                const isWhite = (i + j) % 2 === 0;
                ctx.fillStyle = isWhite ? 'white' : 'black';
                ctx.fillRect(
                    i * checkSize - checkSize/2, 
                    j * checkSize - checkSize/2, 
                    checkSize, 
                    checkSize
                );
            }
        }
        
        ctx.restore();
    }
    
    /**
     * Render player car
     */
    renderPlayerCar(ctx) {
        ctx.save();
        
        // Center on car position
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.rotation);
        
        // Swap width and height to correct the car's orientation
        // The car should be taller than it is wide (for top-down view)
        const carWidth = this.carHeight; // Use height as width
        const carHeight = this.carWidth; // Use width as height
        
        // Car body
        ctx.fillStyle = '#FF5722'; // Orange
        ctx.fillRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
        
        // Windshield (at the top)
        ctx.fillStyle = '#90CAF9'; // Light blue
        ctx.fillRect(-carWidth / 3, -carHeight / 2, carWidth * 2/3, carHeight / 3);
        
        // Rear (at the bottom)
        ctx.fillStyle = '#D84315'; // Dark orange
        ctx.fillRect(-carWidth / 2, carHeight / 3, carWidth, carHeight / 10);
        
        // Wheels
        ctx.fillStyle = '#212121'; // Dark grey
        
        // Left-side wheels
        ctx.fillRect(-carWidth / 2 - 3, -carHeight / 4, 6, carHeight / 2);
        
        // Right-side wheels
        ctx.fillRect(carWidth / 2 - 3, -carHeight / 4, 6, carHeight / 2);
        
        // Add car details
        ctx.fillStyle = '#FFEB3B'; // Yellow for headlights (at top of car)
        ctx.fillRect(-carWidth / 4, -carHeight / 2, carWidth / 8, 5);
        ctx.fillRect(carWidth / 8, -carHeight / 2, carWidth / 8, 5);
        
        // Add brake lights if braking (at bottom of car)
        if (PureJS.Input.isKeyDown('ArrowDown') || PureJS.Input.isKeyDown('Space')) {
            ctx.fillStyle = '#F44336'; // Red for brake lights
            ctx.fillRect(-carWidth / 4, carHeight / 2 - 5, carWidth / 8, 5);
            ctx.fillRect(carWidth / 8, carHeight / 2 - 5, carWidth / 8, 5);
        }
        
        ctx.restore();
    }
}

/**
 * Load Racing game
 * @param {Object} game - PureJS game instance
 * @param {Function} onLoaded - Callback when game is loaded
 */
function loadRacingGame(game, onLoaded) {
    // Create scene
    const racingScene = new RacingScene(game);
    
    // Add scene to game
    game.addScene('racing', racingScene);
    
    // Set as current scene
    game.setScene('racing');
    
    // Start the game
    game.start();
    
    // Call onLoaded callback
    onLoaded();
}