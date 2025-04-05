/**
 * GameFlix - Main Application
 * A Netflix-like interface for classic games
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initHeader();
    initSliders();
    initGameCards();
    initModal();
    
    // Create game instances (to be populated as games are added)
    const games = {};
    
    /**
     * Initialize header behavior (transparency on scroll)
     */
    function initHeader() {
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // Add smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Only apply to hash links
                if (link.hash) {
                    e.preventDefault();
                    
                    // Remove active class from all links
                    navLinks.forEach(l => l.classList.remove('active'));
                    
                    // Add active class to clicked link
                    link.classList.add('active');
                    
                    // Get the target section
                    const targetId = link.hash.substring(1);
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        // Calculate scroll position (with offset for header)
                        const scrollPosition = targetSection.offsetTop - header.clientHeight;
                        
                        // Scroll to target
                        window.scrollTo({
                            top: scrollPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }
    
    /**
     * Initialize game sliders (horizontal carousels)
     */
    function initSliders() {
        const sliders = document.querySelectorAll('.game-slider');
        
        sliders.forEach(slider => {
            const cards = slider.querySelector('.game-cards');
            const leftArrow = slider.querySelector('.slider-arrow.left');
            const rightArrow = slider.querySelector('.slider-arrow.right');
            
            // Scroll amount per click (80% of visible width)
            const scrollAmount = cards.clientWidth * 0.8;
            
            leftArrow.addEventListener('click', () => {
                cards.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            });
            
            rightArrow.addEventListener('click', () => {
                cards.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            });
        });
    }
    
    /**
     * Initialize game card interactions
     */
    function initGameCards() {
        // Play buttons within cards
        const playButtons = document.querySelectorAll('.btn-play-small');
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const gameCard = e.target.closest('.game-card');
                const gameId = gameCard.dataset.game;
                const gameTitle = gameCard.querySelector('.game-title').textContent;
                
                openGameModal(gameId, gameTitle);
            });
        });
        
        // Entire card click
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                const gameTitle = card.querySelector('.game-title').textContent;
                
                openGameModal(gameId, gameTitle);
            });
        });
        
        // Featured game play button
        const featuredPlayButton = document.querySelector('.featured-game .btn-play');
        if (featuredPlayButton) {
            featuredPlayButton.addEventListener('click', () => {
                const gameId = 'tetris'; // Default featured game
                const gameTitle = document.querySelector('.featured-game h2').textContent;
                
                openGameModal(gameId, gameTitle);
            });
        }
        
        // My List functionality removed as unused feature
    }
    
    /**
     * Initialize game modal
     */
    function initModal() {
        const modal = document.getElementById('gameModal');
        const closeButton = modal.querySelector('.modal-close');
        
        // Close modal when clicking the X
        closeButton.addEventListener('click', () => {
            closeGameModal();
        });
        
        // Close modal when clicking outside content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeGameModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeGameModal();
            }
        });
    }
    
    /**
     * Open game modal and load game
     * @param {string} gameId - Game identifier
     * @param {string} gameTitle - Game title
     */
    function openGameModal(gameId, gameTitle) {
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modal-game-title');
        const gameContainer = document.getElementById('game-container');
        
        // Set title
        modalTitle.textContent = gameTitle;
        
        // Clear previous game content
        gameContainer.innerHTML = '';
        
        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Load game based on ID
        loadGame(gameId, gameContainer);
    }
    
    /**
     * Close game modal
     */
    function closeGameModal() {
        const modal = document.getElementById('gameModal');
        const gameContainer = document.getElementById('game-container');
        
        // Hide modal
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        
        // Stop game (clean up)
        gameContainer.innerHTML = '';
        
        // If there's an active game instance, stop it
        if (window.activeGame && typeof window.activeGame.stop === 'function') {
            window.activeGame.stop();
            window.activeGame = null;
        }
    }
    
    /**
     * Load game into container
     * @param {string} gameId - Game identifier
     * @param {HTMLElement} container - Game container element
     */
    function loadGame(gameId, container) {
        // Create game canvas
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.position = 'absolute';
        loadingMsg.style.top = '50%';
        loadingMsg.style.left = '50%';
        loadingMsg.style.transform = 'translate(-50%, -50%)';
        loadingMsg.style.color = '#fff';
        loadingMsg.style.fontSize = '1.5rem';
        loadingMsg.textContent = 'Loading game...';
        container.appendChild(loadingMsg);
        
        // Initialize PureJS game framework
        const game = PureJS.init({
            canvas: canvas,
            debug: false
        });
        
        // Store active game reference for cleanup
        window.activeGame = game;
        
        // Load game based on ID
        switch (gameId) {
            case 'tetris':
                loadTetrisGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'snake':
                loadSnakeGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'pacman':
                loadPacmanGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'breakout':
                loadBreakoutGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'asteroids': 
                loadAsteroidsGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'spaceinvaders':
                loadSpaceInvadersGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case '2048':
                load2048Game(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'minesweeper':
                loadMinesweeperGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'sokoban':
                loadSokobanGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'match3':
                loadMatch3Game(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'sudoku':
                loadSudokuGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'platformer':
                loadPlatformerGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'shooter':
                loadShooterGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'racing':
                loadRacingGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            case 'fighting':
                loadFightingGame(game, () => {
                    container.removeChild(loadingMsg);
                });
                break;
            default:
                // Placeholder message for unimplemented games
                loadingMsg.textContent = 'Coming soon: ' + gameId;
                break;
        }
    }
    
    // The game implementations are now in separate files
    // See the games/ directory for each individual game implementation
});