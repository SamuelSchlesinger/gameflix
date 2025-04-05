/**
 * PureJS Game Framework
 * A lightweight game framework using pure JavaScript and HTML
 */

// Main namespace for our framework
const PureJS = {
    // Current version
    VERSION: '1.0.0',
    
    // Configuration object
    config: {
        fps: 60,
        debug: false
    },
    
    // Store for game assets (images, audio, etc.)
    assets: {
        images: {},
        audio: {},
        data: {}
    },
    
    // Core game properties
    game: {
        canvas: null,
        ctx: null,
        width: 800,
        height: 600,
        running: false,
        lastTime: 0,
        accumulator: 0,
        timeStep: 1000 / 60, // Default 60 FPS
        scenes: {},
        currentScene: null,
        entities: []
    },
    
    /**
     * Initialize the game framework
     * @param {Object} options - Configuration options
     */
    init: function(options = {}) {
        // Merge options with default config
        Object.assign(this.config, options);
        
        // Create canvas if not provided
        if (!options.canvas) {
            this.game.canvas = document.createElement('canvas');
            this.game.canvas.width = this.game.width;
            this.game.canvas.height = this.game.height;
            document.body.appendChild(this.game.canvas);
        } else {
            this.game.canvas = options.canvas;
            this.game.width = this.game.canvas.width;
            this.game.height = this.game.canvas.height;
        }
        
        // Get rendering context
        this.game.ctx = this.game.canvas.getContext('2d');
        
        // Set time step based on FPS
        this.game.timeStep = 1000 / this.config.fps;
        
        // Initialize subsystems
        this.Input.init();
        
        // Log initialization
        if (this.config.debug) {
            console.log('PureJS Game Framework initialized');
        }
        
        return this;
    },
    
    /**
     * Start the game loop
     */
    start: function() {
        if (!this.game.running) {
            this.game.running = true;
            this.game.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
            
            if (this.config.debug) {
                console.log('Game loop started');
            }
        }
        return this;
    },
    
    /**
     * Stop the game loop
     */
    stop: function() {
        this.game.running = false;
        return this;
    },
    
    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop: function(timestamp) {
        if (!this.game.running) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.game.lastTime;
        this.game.lastTime = timestamp;
        
        // Cap maximum delta time to prevent large jumps after tab inactivity
        const cappedDeltaTime = Math.min(deltaTime, 100);
        
        // Add to accumulator
        this.game.accumulator += cappedDeltaTime;
        
        // Update physics in fixed time steps
        while (this.game.accumulator >= this.game.timeStep) {
            this.update(this.game.timeStep / 1000); // Convert to seconds
            this.game.accumulator -= this.game.timeStep;
        }
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop.bind(this));
    },
    
    /**
     * Update game state
     * @param {number} dt - Delta time in seconds
     */
    update: function(dt) {
        // Update current scene if exists
        if (this.game.currentScene) {
            this.game.currentScene.update(dt);
        }
        
        // Update all entities
        for (let i = 0; i < this.game.entities.length; i++) {
            if (this.game.entities[i].active) {
                this.game.entities[i].update(dt);
            }
        }
        
        // Update input state
        this.Input.update();
    },
    
    /**
     * Render game graphics
     */
    render: function() {
        // Clear canvas
        this.game.ctx.clearRect(0, 0, this.game.width, this.game.height);
        
        // Render current scene if exists
        if (this.game.currentScene) {
            this.game.currentScene.render(this.game.ctx);
        }
        
        // Render all entities
        for (let i = 0; i < this.game.entities.length; i++) {
            if (this.game.entities[i].visible) {
                this.game.entities[i].render(this.game.ctx);
            }
        }
    },
    
    /**
     * Create a new entity
     * @param {Object} options - Entity options
     * @returns {Entity} New entity instance
     */
    createEntity: function(options = {}) {
        const entity = new this.Entity(options);
        this.game.entities.push(entity);
        return entity;
    },
    
    /**
     * Remove an entity
     * @param {Entity} entity - Entity to remove
     */
    removeEntity: function(entity) {
        const index = this.game.entities.indexOf(entity);
        if (index !== -1) {
            this.game.entities.splice(index, 1);
        }
    },
    
    /**
     * Add a scene
     * @param {string} name - Scene name
     * @param {Scene} scene - Scene object
     */
    addScene: function(name, scene) {
        this.game.scenes[name] = scene;
        return this;
    },
    
    /**
     * Set current scene
     * @param {string} name - Scene name
     */
    setScene: function(name) {
        if (this.game.scenes[name]) {
            // Exit current scene if exists
            if (this.game.currentScene && this.game.currentScene.exit) {
                this.game.currentScene.exit();
            }
            
            // Set new scene
            this.game.currentScene = this.game.scenes[name];
            
            // Enter new scene
            if (this.game.currentScene.enter) {
                this.game.currentScene.enter();
            }
            
            if (this.config.debug) {
                console.log(`Scene changed to: ${name}`);
            }
        } else {
            console.error(`Scene "${name}" not found`);
        }
        return this;
    },
    
    /**
     * Load an image asset
     * @param {string} key - Asset key
     * @param {string} src - Image source
     * @returns {Promise} Promise resolving when image is loaded
     */
    loadImage: function(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.images[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    },
    
    /**
     * Load an audio asset
     * @param {string} key - Asset key
     * @param {string} src - Audio source
     * @returns {Promise} Promise resolving when audio is loaded
     */
    loadAudio: function(key, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.assets.audio[key] = audio;
                resolve(audio);
            };
            audio.onerror = () => {
                reject(new Error(`Failed to load audio: ${src}`));
            };
            audio.src = src;
        });
    },
    
    /**
     * Batch load multiple assets
     * @param {Object} assets - Object containing asset definitions
     * @returns {Promise} Promise resolving when all assets are loaded
     */
    loadAssets: function(assets) {
        const promises = [];
        
        if (assets.images) {
            for (const [key, src] of Object.entries(assets.images)) {
                promises.push(this.loadImage(key, src));
            }
        }
        
        if (assets.audio) {
            for (const [key, src] of Object.entries(assets.audio)) {
                promises.push(this.loadAudio(key, src));
            }
        }
        
        return Promise.all(promises);
    }
};

/**
 * Input Manager
 * Handles keyboard, mouse and touch input
 */
PureJS.Input = {
    keys: {},
    keysPressed: {},
    keysReleased: {},
    mouse: {
        x: 0,
        y: 0,
        pressed: false,
        down: false,
        up: false
    },
    touches: [],
    
    /**
     * Initialize input handlers
     */
    init: function() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysReleased[e.code] = true;
        });
        
        // Mouse events
        PureJS.game.canvas.addEventListener('mousemove', (e) => {
            const rect = PureJS.game.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        PureJS.game.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.pressed = true;
        });
        
        PureJS.game.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.mouse.up = true;
        });
        
        // Handle mouse events outside canvas
        window.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.mouse.up = true;
        });
        
        // Touch events
        PureJS.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.processTouchEvent(e);
            this.mouse.down = true;
            this.mouse.pressed = true;
        });
        
        PureJS.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.processTouchEvent(e);
        });
        
        PureJS.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touches = [];
            this.mouse.down = false;
            this.mouse.up = true;
        });
    },
    
    /**
     * Process touch events into our format
     */
    processTouchEvent: function(e) {
        const rect = PureJS.game.canvas.getBoundingClientRect();
        this.touches = [];
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            this.touches.push({
                id: touch.identifier,
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            });
        }
        
        // Update mouse position to match first touch
        if (this.touches.length > 0) {
            this.mouse.x = this.touches[0].x;
            this.mouse.y = this.touches[0].y;
        }
    },
    
    /**
     * Update input state (called once per frame)
     */
    update: function() {
        // Reset one-frame states
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.pressed = false;
        this.mouse.up = false;
    },
    
    /**
     * Check if a key is currently down
     * @param {string} code - Key code to check
     * @returns {boolean} Whether key is down
     */
    isKeyDown: function(code) {
        return !!this.keys[code];
    },
    
    /**
     * Check if a key was pressed this frame
     * @param {string} code - Key code to check
     * @returns {boolean} Whether key was pressed this frame
     */
    isKeyPressed: function(code) {
        return !!this.keysPressed[code];
    },
    
    /**
     * Check if a key was released this frame
     * @param {string} code - Key code to check
     * @returns {boolean} Whether key was released this frame
     */
    isKeyReleased: function(code) {
        return !!this.keysReleased[code];
    }
};

/**
 * Entity class
 * Base class for all game objects
 */
PureJS.Entity = class Entity {
    /**
     * Create a new entity
     * @param {Object} options - Entity options
     */
    constructor(options = {}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 32;
        this.height = options.height || 32;
        this.rotation = options.rotation || 0;
        this.scale = options.scale || 1;
        this.velocity = {
            x: options.velocityX || 0,
            y: options.velocityY || 0
        };
        this.acceleration = {
            x: options.accelerationX || 0,
            y: options.accelerationY || 0
        };
        this.active = options.active !== undefined ? options.active : true;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.components = [];
    }
    
    /**
     * Update entity state
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Update physics
        this.velocity.x += this.acceleration.x * dt;
        this.velocity.y += this.acceleration.y * dt;
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        
        // Update all components
        for (let i = 0; i < this.components.length; i++) {
            if (this.components[i].active) {
                this.components[i].update(dt);
            }
        }
    }
    
    /**
     * Render entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        
        // Draw entity (can be overridden by subclasses)
        this.draw(ctx);
        
        // Render all components
        for (let i = 0; i < this.components.length; i++) {
            if (this.components[i].visible) {
                this.components[i].render(ctx);
            }
        }
        
        ctx.restore();
    }
    
    /**
     * Draw entity (to be overridden by subclasses)
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
        // Default implementation: draw nothing at all.
    }
    
    /**
     * Add a component to the entity
     * @param {Component} component - Component to add
     * @returns {Component} Added component
     */
    addComponent(component) {
        component.entity = this;
        this.components.push(component);
        return component;
    }
    
    /**
     * Get a component by type
     * @param {Function} type - Component constructor
     * @returns {Component|null} Found component or null
     */
    getComponent(type) {
        for (let i = 0; i < this.components.length; i++) {
            if (this.components[i] instanceof type) {
                return this.components[i];
            }
        }
        return null;
    }
    
    /**
     * Remove a component
     * @param {Component} component - Component to remove
     */
    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
            component.entity = null;
        }
    }
    
    /**
     * Check collision with another entity (simple AABB)
     * @param {Entity} other - Other entity to check collision with
     * @returns {boolean} Whether entities are colliding
     */
    collidesWith(other) {
        return (
            this.x - this.width / 2 < other.x + other.width / 2 &&
            this.x + this.width / 2 > other.x - other.width / 2 &&
            this.y - this.height / 2 < other.y + other.height / 2 &&
            this.y + this.height / 2 > other.y - other.height / 2
        );
    }
};

/**
 * Component class
 * Base class for all entity components
 */
PureJS.Component = class Component {
    /**
     * Create a new component
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        this.entity = null;
        this.active = options.active !== undefined ? options.active : true;
        this.visible = options.visible !== undefined ? options.visible : true;
    }
    
    /**
     * Update component
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // To be overridden by subclasses
    }
    
    /**
     * Render component
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // To be overridden by subclasses
    }
};

/**
 * Scene class
 * Represents a game scene/level/screen
 */
PureJS.Scene = class Scene {
    /**
     * Create a new scene
     * @param {Object} options - Scene options
     */
    constructor(options = {}) {
        this.entities = [];
        this.active = options.active !== undefined ? options.active : true;
    }
    
    /**
     * Called when scene is entered
     */
    enter() {
        // To be overridden by subclasses
    }
    
    /**
     * Called when scene is exited
     */
    exit() {
        // To be overridden by subclasses
    }
    
    /**
     * Update scene
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Update all entities in the scene
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].active) {
                this.entities[i].update(dt);
            }
        }
    }
    
    /**
     * Render scene
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        // Render all entities in the scene
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].visible) {
                this.entities[i].render(ctx);
            }
        }
    }
    
    /**
     * Add an entity to the scene
     * @param {Entity} entity - Entity to add
     * @returns {Entity} Added entity
     */
    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }
    
    /**
     * Remove an entity from the scene
     * @param {Entity} entity - Entity to remove
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }
};

/**
 * Sprite Component
 * Renders an image for an entity
 */
PureJS.SpriteComponent = class SpriteComponent extends PureJS.Component {
    /**
     * Create a new sprite component
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        super(options);
        this.image = options.image || null;
        this.imageKey = options.imageKey || null;
        this.width = options.width || null;
        this.height = options.height || null;
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        this.sourceX = options.sourceX || 0;
        this.sourceY = options.sourceY || 0;
        this.sourceWidth = options.sourceWidth || null;
        this.sourceHeight = options.sourceHeight || null;
        
        // Get image from assets if key is provided
        if (this.imageKey && !this.image) {
            this.image = PureJS.assets.images[this.imageKey];
        }
        
        // Auto-set dimensions if not specified
        if (this.image) {
            if (this.width === null) this.width = this.image.width;
            if (this.height === null) this.height = this.image.height;
            if (this.sourceWidth === null) this.sourceWidth = this.image.width;
            if (this.sourceHeight === null) this.sourceHeight = this.image.height;
        }
    }
    
    /**
     * Render sprite
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.image) return;
        
        ctx.drawImage(
            this.image,
            this.sourceX, this.sourceY,
            this.sourceWidth, this.sourceHeight,
            this.offsetX - this.width / 2, this.offsetY - this.height / 2,
            this.width, this.height
        );
    }
};

/**
 * Animation Component
 * Handles sprite animations
 */
PureJS.AnimationComponent = class AnimationComponent extends PureJS.Component {
    /**
     * Create a new animation component
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        super(options);
        this.sprite = options.sprite || null;
        this.frameWidth = options.frameWidth || 0;
        this.frameHeight = options.frameHeight || 0;
        this.animations = {};
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameDuration = 0;
        this.frameTimer = 0;
        this.loop = true;
        this.finished = false;
        
        // Add animations if provided
        if (options.animations) {
            for (const [name, anim] of Object.entries(options.animations)) {
                this.addAnimation(name, anim.frames, anim.frameRate, anim.loop);
            }
        }
    }
    
    /**
     * Add animation sequence
     * @param {string} name - Animation name
     * @param {Array<number>} frames - Array of frame indices
     * @param {number} frameRate - Animation frame rate
     * @param {boolean} loop - Whether animation should loop
     */
    addAnimation(name, frames, frameRate = 10, loop = true) {
        this.animations[name] = {
            frames: frames,
            frameRate: frameRate,
            loop: loop !== undefined ? loop : true
        };
    }
    
    /**
     * Play an animation
     * @param {string} name - Animation name
     * @param {boolean} resetFrame - Whether to reset to first frame
     */
    play(name, resetFrame = true) {
        if (!this.animations[name]) {
            console.error(`Animation "${name}" not found`);
            return;
        }
        
        // Don't restart if already playing this animation
        if (this.currentAnimation === name && !resetFrame) {
            return;
        }
        
        this.currentAnimation = name;
        this.frameDuration = 1 / this.animations[name].frameRate;
        this.loop = this.animations[name].loop;
        this.finished = false;
        
        if (resetFrame) {
            this.currentFrame = 0;
            this.frameTimer = 0;
        }
        
        // Update sprite frame
        this.updateSpriteFrame();
    }
    
    /**
     * Update animation
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (!this.currentAnimation || this.finished) return;
        
        this.frameTimer += dt;
        
        // Move to next frame if needed
        if (this.frameTimer >= this.frameDuration) {
            this.frameTimer -= this.frameDuration;
            this.currentFrame++;
            
            const anim = this.animations[this.currentAnimation];
            
            // Handle end of animation
            if (this.currentFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = anim.frames.length - 1;
                    this.finished = true;
                }
            }
            
            // Update sprite frame
            this.updateSpriteFrame();
        }
    }
    
    /**
     * Update sprite component's source rectangle
     */
    updateSpriteFrame() {
        if (!this.sprite || !this.currentAnimation) return;
        
        const anim = this.animations[this.currentAnimation];
        const frameIndex = anim.frames[this.currentFrame];
        
        // Calculate frame position in spritesheet
        const framesPerRow = Math.floor(this.sprite.image.width / this.frameWidth);
        const row = Math.floor(frameIndex / framesPerRow);
        const col = frameIndex % framesPerRow;
        
        // Update sprite source
        this.sprite.sourceX = col * this.frameWidth;
        this.sprite.sourceY = row * this.frameHeight;
        this.sprite.sourceWidth = this.frameWidth;
        this.sprite.sourceHeight = this.frameHeight;
    }
};

/**
 * Text Component
 * Renders text for an entity
 */
PureJS.TextComponent = class TextComponent extends PureJS.Component {
    /**
     * Create a new text component
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        super(options);
        this.text = options.text || '';
        this.font = options.font || '16px sans-serif';
        this.color = options.color || 'black';
        this.align = options.align || 'center';
        this.baseline = options.baseline || 'middle';
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        this.maxWidth = options.maxWidth || null;
    }
    
    /**
     * Render text
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = this.align;
        ctx.textBaseline = this.baseline;
        
        if (this.maxWidth) {
            ctx.fillText(this.text, this.offsetX, this.offsetY, this.maxWidth);
        } else {
            ctx.fillText(this.text, this.offsetX, this.offsetY);
        }
    }
};

/**
 * Audio Manager
 * Handles game audio playback
 */
PureJS.Audio = {
    /**
     * Play audio
     * @param {string} key - Asset key
     * @param {Object} options - Playback options
     */
    play: function(key, options = {}) {
        const audio = PureJS.assets.audio[key];
        if (!audio) {
            console.error(`Audio "${key}" not found`);
            return;
        }
        
        // Clone the audio element for overlapping sounds
        const sound = audio.cloneNode();
        
        // Apply options
        if (options.volume !== undefined) sound.volume = options.volume;
        if (options.loop !== undefined) sound.loop = options.loop;
        
        // Play
        sound.play();
        
        return sound;
    },
    
    /**
     * Stop audio
     * @param {HTMLAudioElement} sound - Sound to stop
     */
    stop: function(sound) {
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }
};

/**
 * Utilities
 * Helper functions
 */
PureJS.Utils = {
    /**
     * Generate a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Calculate distance between two points
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {number} Distance
     */
    distance: function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    /**
     * Calculate angle between two points (in radians)
     * @param {number} x1 - First point x
     * @param {number} y1 - First point y
     * @param {number} x2 - Second point x
     * @param {number} y2 - Second point y
     * @returns {number} Angle in radians
     */
    angle: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    /**
     * Lerp (linear interpolation) between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation amount (0-1)
     * @returns {number} Interpolated value
     */
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
};
