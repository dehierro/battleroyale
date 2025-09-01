# Battle Royale Simulator

A web-based battle royale simulator that uses AI to generate dynamic events. Watch 24 players compete in randomly generated scenarios that can result in injuries, eliminations, or safe outcomes.

## Features

- 24 unique players start each game
- Dynamic event generation using OpenAI's GPT API
- Real-time player status tracking (Alive, Injured, Dead)
- Fallback events when API is unavailable
- Responsive web design
- Round-by-round progression

## How to Use

1. Open `index.html` in a web browser
2. Enter your OpenAI API key (optional - fallback events will be used if no key is provided)
3. Click "Start Game" to begin
4. Click "Next Event" to progress through rounds
5. Watch as events unfold and players are eliminated

## Setup

No build process required - simply open the HTML file in any modern web browser.

For development with a local server:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000`

## API Integration

The simulator integrates with OpenAI's API to generate unique, contextual events. If no API key is provided or the API is unavailable, the system falls back to a set of predefined dramatic events.

## Files

- `index.html` - Main application interface
- `script.js` - Game logic and API integration
- `style.css` - Responsive styling and themes
