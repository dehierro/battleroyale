class BattleRoyaleSimulator {
    constructor() {
        this.players = [];
        this.round = 0;
        this.apiKey = '';
        this.gameStarted = false;
        this.events = [];
        
        this.initializeEventListeners();
        this.generatePlayers();
        this.updateDisplay();
    }

    initializeEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('nextEvent').addEventListener('click', () => this.nextEvent());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        
        // Modal event listeners
        const modal = document.getElementById('playerModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => this.hidePlayerModal());
        
        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.hidePlayerModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hidePlayerModal();
            }
        });
    }

    generatePlayers() {
        const playerData = [
            { name: 'Alex', description: 'A skilled archer with keen eyesight and steady hands. Known for precise long-range attacks.' },
            { name: 'Blake', description: 'A former street fighter with quick reflexes and excellent close combat skills.' },
            { name: 'Casey', description: 'A tech specialist who excels at finding and using advanced equipment.' },
            { name: 'Drew', description: 'A natural leader with strong tactical awareness and team coordination abilities.' },
            { name: 'Ellis', description: 'A survivalist with extensive wilderness knowledge and trap-setting expertise.' },
            { name: 'Finley', description: 'An agile parkour expert capable of traversing difficult terrain with ease.' },
            { name: 'Gray', description: 'A mysterious strategist who prefers stealth and psychological warfare.' },
            { name: 'Harper', description: 'A medic with healing abilities and knowledge of battlefield medicine.' },
            { name: 'Iris', description: 'A fierce warrior with exceptional melee combat skills and unwavering courage.' },
            { name: 'Jordan', description: 'A versatile athlete with balanced skills across multiple combat disciplines.' },
            { name: 'Kai', description: 'A martial artist with lightning-fast strikes and defensive techniques.' },
            { name: 'Logan', description: 'A heavy weapons specialist with incredible strength and endurance.' },
            { name: 'Morgan', description: 'A cunning tactician who excels at setting ambushes and traps.' },
            { name: 'Nico', description: 'A scout with exceptional speed and reconnaissance abilities.' },
            { name: 'Oakley', description: 'A defensive expert skilled in shield work and protective strategies.' },
            { name: 'Parker', description: 'An engineer who can improvise weapons and tools from available materials.' },
            { name: 'Quinn', description: 'A sniper with exceptional patience and long-range precision shooting.' },
            { name: 'River', description: 'A fluid combatant who adapts their fighting style to any situation.' },
            { name: 'Sage', description: 'A wise strategist with deep knowledge of combat theory and history.' },
            { name: 'Taylor', description: 'An explosive specialist with expertise in demolitions and area denial.' },
            { name: 'Uma', description: 'A stealthy assassin who strikes from the shadows with deadly precision.' },
            { name: 'Vale', description: 'A support specialist who excels at team tactics and resource management.' },
            { name: 'Winter', description: 'A cold and calculating fighter with ice-cold nerves under pressure.' },
            { name: 'Zara', description: 'A fearless berserker who fights with wild intensity and raw power.' }
        ];

        this.players = playerData.map((data, index) => ({
            id: index + 1,
            name: data.name,
            description: data.description,
            hp: 80 + Math.floor(Math.random() * 41), // 80-120 HP
            strength: 1 + Math.floor(Math.random() * 10), // 1-10
            agility: 1 + Math.floor(Math.random() * 10), // 1-10
            intelligence: 1 + Math.floor(Math.random() * 10), // 1-10
            status: 'alive', // alive, injured, dead
            round_eliminated: null
        }));
    }

    startGame() {
        const apiKeyInput = document.getElementById('apiKey');
        this.apiKey = apiKeyInput.value.trim();
        
        if (!this.apiKey) {
            alert('Please enter your OpenAI API key to start the game.');
            return;
        }

        this.gameStarted = true;
        this.round = 0;
        this.events = [];
        
        document.getElementById('startGame').disabled = true;
        document.getElementById('nextEvent').disabled = false;
        apiKeyInput.disabled = true;
        
        this.addEvent("The Battle Royale begins! 24 players enter the arena...");
        this.updateDisplay();
    }

    async nextEvent() {
        if (!this.gameStarted) return;
        
        this.round++;
        
        const alivePlayers = this.players.filter(p => p.status === 'alive');
        if (alivePlayers.length <= 1) {
            this.endGame();
            return;
        }

        document.getElementById('nextEvent').disabled = true;
        this.addEvent("Generating event...", true);

        try {
            const eventText = await this.generateEvent();
            this.removeLoadingEvent();
            this.processEvent(eventText);
        } catch (error) {
            this.removeLoadingEvent();
            this.addEvent(`Error generating event: ${error.message}. Using fallback event.`);
            this.processFallbackEvent();
        }

        document.getElementById('nextEvent').disabled = false;
        this.updateDisplay();
    }

    async generateEvent() {
        const alivePlayers = this.players.filter(p => p.status === 'alive');
        const injuredPlayers = this.players.filter(p => p.status === 'injured');
        
        const prompt = `Generate a single battle royale event for round ${this.round}. 
        Current status: ${alivePlayers.length} alive, ${injuredPlayers.length} injured.
        Available players: ${alivePlayers.map(p => p.name).join(', ')}.
        
        Create a dramatic, engaging event that might involve 1-3 random players. The event could:
        - Be a neutral event with no casualties
        - Result in one player being injured
        - Result in one player being eliminated
        - Be an environmental hazard
        - Involve player interactions (alliance, betrayal, combat)
        
        Keep it under 150 words and make it exciting. Don't specify outcomes, just describe the event.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a battle royale narrator. Generate exciting, dramatic events that are appropriate for all audiences.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    processEvent(eventText) {
        this.addEvent(eventText);
        
        // Randomly determine event outcome
        const outcomeRoll = Math.random();
        const alivePlayers = this.players.filter(p => p.status === 'alive');
        
        if (outcomeRoll < 0.4) {
            // No casualties (40% chance)
            this.addEvent("No one was harmed in this event.");
        } else if (outcomeRoll < 0.7) {
            // Someone gets injured (30% chance)
            const victim = this.getRandomPlayer(alivePlayers);
            if (victim) {
                victim.status = 'injured';
                this.addEvent(`${victim.name} was injured!`);
            }
        } else {
            // Someone gets eliminated (30% chance)
            const targetPlayers = alivePlayers.filter(p => p.status !== 'dead');
            const victim = this.getRandomPlayer(targetPlayers);
            if (victim) {
                victim.status = 'dead';
                victim.round_eliminated = this.round;
                this.addEvent(`${victim.name} has been eliminated!`);
            }
        }
    }

    processFallbackEvent() {
        const fallbackEvents = [
            "A supply drop lands in the center of the arena, drawing several players into a tense standoff.",
            "The weather suddenly changes, creating dangerous conditions across the battlefield.",
            "Strange sounds echo through the arena, putting everyone on edge.",
            "A section of the arena becomes unstable, forcing players to relocate quickly.",
            "Mysterious fog rolls in, reducing visibility and creating opportunities for ambushes."
        ];
        
        const eventText = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
        this.processEvent(eventText);
    }

    getRandomPlayer(playerArray) {
        if (playerArray.length === 0) return null;
        return playerArray[Math.floor(Math.random() * playerArray.length)];
    }

    addEvent(text, isLoading = false) {
        const event = {
            round: this.round,
            text: text,
            isLoading: isLoading
        };
        this.events.push(event);
        this.updateEventsDisplay();
    }

    removeLoadingEvent() {
        this.events = this.events.filter(event => !event.isLoading);
        this.updateEventsDisplay();
    }

    endGame() {
        const survivors = this.players.filter(p => p.status === 'alive');
        if (survivors.length === 1) {
            this.addEvent(`🎉 ${survivors[0].name} is the winner of the Battle Royale! 🎉`);
        } else if (survivors.length === 0) {
            this.addEvent("🔥 No survivors remain! The arena claims all! 🔥");
        }
        
        document.getElementById('nextEvent').disabled = true;
        this.gameStarted = false;
    }

    resetGame() {
        this.gameStarted = false;
        this.round = 0;
        this.events = [];
        this.generatePlayers();
        
        document.getElementById('startGame').disabled = false;
        document.getElementById('nextEvent').disabled = true;
        document.getElementById('apiKey').disabled = false;
        document.getElementById('apiKey').value = '';
        
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateStats();
        this.updateEventsDisplay();
        this.updatePlayersDisplay();
    }

    updateStats() {
        const alive = this.players.filter(p => p.status === 'alive').length;
        const injured = this.players.filter(p => p.status === 'injured').length;
        
        document.getElementById('roundNumber').textContent = this.round;
        document.getElementById('playersAlive').textContent = alive;
        document.getElementById('playersInjured').textContent = injured;
    }

    updateEventsDisplay() {
        const eventsLog = document.getElementById('eventsLog');
        eventsLog.innerHTML = '';
        
        // Show recent events (last 10)
        const recentEvents = this.events.slice(-10);
        
        recentEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            
            if (event.isLoading) {
                eventDiv.innerHTML = `
                    <div class="event-round">Round ${event.round}</div>
                    <div class="event-text">⏳ ${event.text}</div>
                `;
            } else {
                eventDiv.innerHTML = `
                    <div class="event-round">Round ${event.round}</div>
                    <div class="event-text">${event.text}</div>
                `;
            }
            
            eventsLog.appendChild(eventDiv);
        });
        
        // Scroll to bottom
        eventsLog.scrollTop = eventsLog.scrollHeight;
    }

    updatePlayersDisplay() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player ${player.status}`;
            
            let statusText = player.status.charAt(0).toUpperCase() + player.status.slice(1);
            if (player.status === 'dead' && player.round_eliminated) {
                statusText += ` (R${player.round_eliminated})`;
            }
            
            // Calculate HP percentage for progress bar
            const maxHP = 120; // Based on the HP generation range (80-120)
            const hpPercentage = Math.max(0, (player.hp / maxHP) * 100);
            
            // Generate player avatar (simple emoji based on name first letter)
            const avatarEmojis = {
                'A': '🏹', 'B': '⚔️', 'C': '🔧', 'D': '🛡️', 'E': '🌲', 'F': '🏃',
                'G': '🎭', 'H': '⚕️', 'I': '⚡', 'J': '🏃', 'K': '🥋', 'L': '💪',
                'M': '🕵️', 'N': '🏃‍♂️', 'O': '🛡️', 'P': '🔨', 'Q': '🎯', 'R': '🌊',
                'S': '📖', 'T': '💥', 'U': '🗡️', 'V': '🤝', 'W': '❄️', 'Z': '⚡'
            };
            const avatar = avatarEmojis[player.name.charAt(0)] || '👤';
            
            playerDiv.innerHTML = `
                <div class="player-avatar">${avatar}</div>
                <div class="player-name">${player.name}</div>
                <div class="player-hp-container">
                    <span class="player-hp-label">HP: ${player.hp}/${maxHP}</span>
                    <div class="player-hp-bar">
                        <div class="player-hp-fill ${player.status}" style="width: ${hpPercentage}%"></div>
                    </div>
                </div>
                <div class="player-status status-${player.status}">${statusText}</div>
            `;
            
            // Add click event listener to show player info
            playerDiv.addEventListener('click', () => this.showPlayerModal(player));
            
            playersList.appendChild(playerDiv);
        });
    }

    showPlayerModal(player) {
        // Populate modal with player data
        document.getElementById('modalPlayerName').textContent = player.name;
        document.getElementById('modalPlayerDescription').textContent = player.description;
        document.getElementById('modalPlayerHP').textContent = player.hp;
        document.getElementById('modalPlayerStrength').textContent = player.strength;
        document.getElementById('modalPlayerAgility').textContent = player.agility;
        document.getElementById('modalPlayerIntelligence').textContent = player.intelligence;
        
        // Set status badge
        const statusBadge = document.getElementById('modalPlayerStatus');
        statusBadge.textContent = player.status;
        statusBadge.className = `status-badge ${player.status}`;
        
        // Set status details
        let statusDetails = '';
        if (player.status === 'dead' && player.round_eliminated) {
            statusDetails = `Eliminated in Round ${player.round_eliminated}`;
        } else if (player.status === 'injured') {
            statusDetails = 'Wounded but still fighting';
        } else if (player.status === 'alive') {
            statusDetails = 'Ready for battle';
        }
        document.getElementById('modalPlayerStatusDetails').textContent = statusDetails;
        
        // Show modal
        document.getElementById('playerModal').style.display = 'block';
    }

    hidePlayerModal() {
        document.getElementById('playerModal').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BattleRoyaleSimulator();
});