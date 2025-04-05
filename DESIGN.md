# GameFlix

A Netflix-style website to play simple, free online games all developed using PureJS.

## Project Overview

GameFlix provides a familiar streaming-service user interface for accessing classic web games. The platform features:

- A responsive, Netflix-inspired user interface
- Game categories with horizontal sliders
- Featured game showcase
- Modal-based game player
- Pure JavaScript implementation with no external dependencies

## Technical Architecture

The project is built with:

- HTML5 for structure
- CSS3 for styling with responsive design
- Vanilla JavaScript for interactions and game logic
- PureJS Game Framework for consistent game development

## User Interface Components

### Header
- Logo
- Navigation menu
- Search functionality

### Main Content
- Featured game banner with call-to-action buttons
- Horizontally scrolling game categories
- Game cards with hover effects and play buttons

### Game Modal
- Full-screen modal for playing games
- Game canvas that adapts to available space
- Game-specific controls and UI

## Game Framework

Games are built on the PureJS Game Framework, which provides:

- Game loop with fixed time step
- Entity-component system
- Input handling for keyboard, mouse, and touch
- Asset loading system
- Scene management
- Collision detection
- Audio playback

## Included Games

Initial game offerings include:

1. **Tetris** - A complete implementation of the classic puzzle game
2. **Snake** - Navigate a growing snake to eat food without colliding with walls or itself
3. **Pac-Man** - Maze navigation game with ghosts and power-ups
4. **Breakout** - Brick-breaking paddle game
5. **Space Invaders** - Classic alien shooting arcade game
6. **Asteroids** - Navigate a ship through an asteroid field

Additional games to be added in future updates.

## Responsive Design

The website is designed to work across devices:

- Desktop: Full experience with horizontal sliders
- Tablet: Adapted layout with touch support
- Mobile: Simplified interface optimized for touchscreens

## Future Enhancements

Planned improvements include:

- User accounts and profiles
- Game progress saving
- Leaderboards and achievements
- Additional game categories
- More complex games leveraging the PureJS framework
- Game creation and sharing tools