const PLAYERS_DATA_URL = new URL('./data/players.json', import.meta.url);

const FALLBACK_PLAYERS = Array.from({ length: 24 }, (_, index) => ({
    name: `Combatiente ${index + 1}`,
    bio: 'Sin biografía disponible.',
    image: 'images/players/default-placeholder.svg',
    hp: 100,
    maxHp: 100,
    injuries: [],
    state: ''
}));

class BattleRoyaleSimulator {
    constructor() {
        this.players = [];
        this.round = 0;
        this.apiKey = '';
        this.gameRunning = false;
        this.isProcessingEvent = false;
        this.events = [];
        this.playersLoaded = false;

        this.cacheDom();
        this.registerEventListeners();
        this.initialize();
    }

    async initialize() {
        await this.loadPlayersFromFile();
        this.updateDisplay();
    }

    cacheDom() {
        this.playersListEl = document.getElementById('playersList');
        this.eventsLogEl = document.getElementById('eventsLog');
        this.roundNumberEl = document.getElementById('roundNumber');
        this.playersAliveEl = document.getElementById('playersAlive');
        this.playersInjuredEl = document.getElementById('playersInjured');
        this.playersDeadEl = document.getElementById('playersDead');
        this.apiKeyInput = document.getElementById('apiKey');
        this.configModal = document.getElementById('configModal');
        this.playerModal = document.getElementById('playerModal');
        this.playersConfigInput = document.getElementById('playersConfig');
        this.configErrorEl = document.getElementById('configError');
        this.nextEventButton = document.getElementById('nextEvent');
    }

    registerEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        if (this.nextEventButton) {
            this.nextEventButton.addEventListener('click', () => this.runEventTurn());
        }
        document.getElementById('configurePlayers').addEventListener('click', () => this.showConfigModal());
        document.getElementById('loadPlayers').addEventListener('click', () => this.updatePlayersFromConfig());

        document.querySelectorAll('#playerModal .close').forEach(btn =>
            btn.addEventListener('click', () => this.hideModal(this.playerModal))
        );
        document.querySelectorAll('#configModal .close').forEach(btn =>
            btn.addEventListener('click', () => this.hideModal(this.configModal))
        );

        window.addEventListener('click', (event) => {
            if (event.target === this.playerModal) this.hideModal(this.playerModal);
            if (event.target === this.configModal) this.hideModal(this.configModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideModal(this.playerModal);
                this.hideModal(this.configModal);
            }
        });

        this.updateNextEventButton();
    }

    normalizePlayer(entry, index) {
        const {
            id: _ignoredId,
            name: rawName,
            bio,
            image,
            hp: entryHp,
            maxHp: entryMaxHp,
            injuries,
            state: entryState,
            mentalState,
            status: _ignoredStatus,
            roundEliminated: _ignoredRound,
            ...extraFields
        } = entry ?? {};

        const fallbackName = `Jugador ${index + 1}`;
        const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
        const name = trimmedName || fallbackName;

        const baseHp = Number.isFinite(entryHp) ? Math.round(entryHp) : 100;
        const maxHpCandidate = Number.isFinite(entryMaxHp) ? Math.round(entryMaxHp) : null;
        const preliminaryMaxHp = maxHpCandidate ?? Math.max(baseHp, 1);
        const sanitizedMaxHp = Math.max(1, Math.min(120, preliminaryMaxHp));
        const sanitizedHp = Math.max(0, Math.min(sanitizedMaxHp, Math.min(120, Math.max(baseHp, 0))));

        const description = typeof bio === 'string' && bio.trim()
            ? bio.trim()
            : 'Sin biografía disponible.';

        const imageUrl = typeof image === 'string' && image.trim()
            ? image.trim()
            : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

        const computedState = typeof entryState === 'string'
            ? entryState.trim()
            : typeof mentalState === 'string'
                ? mentalState.trim()
                : '';

        return {
            id: index + 1,
            ...extraFields,
            name,
            bio: description,
            image: imageUrl,
            hp: sanitizedHp,
            maxHp: sanitizedMaxHp,
            injuries: Array.isArray(injuries) ? injuries.slice(0, 5) : [],
            state: computedState,
            status: 'alive',
            roundEliminated: null
        };
    }

    async loadPlayersFromFile() {
        this.playersLoaded = false;
        try {
            const response = await fetch(PLAYERS_DATA_URL, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Estado ${response.status}`);
            }
            const parsed = await response.json();
            if (!Array.isArray(parsed) || parsed.length < 1) {
                throw new Error('El archivo debe contener al menos un jugador.');
            }
            this.players = parsed.map((player, index) => this.normalizePlayer(player, index));
            this.playersLoaded = true;
            this.populatePlayersConfig();
        } catch (error) {
            console.error('No se pudieron cargar los jugadores desde data/players.json. Se usará una lista por defecto.', error);
            this.players = FALLBACK_PLAYERS.map((player, index) => this.normalizePlayer(player, index));
            this.playersLoaded = true;
            this.populatePlayersConfig();
        }
    }

    populatePlayersConfig() {
        if (!this.playersConfigInput) return;
        const exportablePlayers = this.players.map(({ id, status, roundEliminated, ...rest }) => ({
            ...rest,
            maxHp: rest.maxHp
        }));
        this.playersConfigInput.value = JSON.stringify(exportablePlayers, null, 2);
        if (this.configErrorEl) {
            this.configErrorEl.textContent = '';
        }
    }

    startGame() {
        if (this.gameRunning) return;
        if (!this.playersLoaded) {
            alert('Los jugadores todavía se están cargando. Inténtalo de nuevo en unos segundos.');
            return;
        }
        this.apiKey = this.apiKeyInput.value.trim();
        if (!this.apiKey) {
            alert('Introduce tu clave de API de OpenAI para comenzar la simulación.');
            return;
        }
        this.gameRunning = true;
        this.isProcessingEvent = false;
        this.round = 0;
        this.events = [];
        this.updateDisplay();
        const aliveCount = this.players.filter(player => player.status !== 'dead').length;
        const rosterMessage = aliveCount === 1
            ? 'La arena se activa. Solo queda un combatiente en juego.'
            : `La arena se activa. ${aliveCount} combatientes entran en juego.`;
        this.addEvent(rosterMessage);
        document.getElementById('startGame').disabled = true;
        this.apiKeyInput.disabled = true;
        this.updateNextEventButton();
    }

    async resetGame() {
        this.gameRunning = false;
        this.isProcessingEvent = false;
        this.round = 0;
        this.events = [];
        await this.loadPlayersFromFile();
        this.updateDisplay();
        this.apiKeyInput.disabled = false;
        this.apiKeyInput.value = '';
        document.getElementById('startGame').disabled = false;
        this.updateNextEventButton();
    }

    async runEventTurn() {
        if (!this.gameRunning || this.isProcessingEvent) return;

        const alivePlayers = this.players.filter(player => player.status === 'alive');
        if (alivePlayers.length <= 1) {
            this.finishGame();
            return;
        }

        this.isProcessingEvent = true;
        this.round += 1;
        this.updateNextEventButton();
        this.addEvent(`⏳ Generando evento de la ronda ${this.round}...`, true);

        try {
            const eventDescription = await this.generateEvent();
            this.removeLoadingEvents();
            this.addEvent(eventDescription);
            this.applyRandomOutcome();
        } catch (error) {
            console.error(error);
            this.removeLoadingEvents();
            const fallback = this.generateFallbackEvent();
            this.addEvent(`⚠️ Error con la API (${error.message}). Evento alternativo: ${fallback}`);
            this.applyRandomOutcome();
        }

        this.updateDisplay();
        const hasWinner = this.checkForWinner();
        this.isProcessingEvent = false;
        if (!hasWinner) {
            this.updateNextEventButton();
        }
    }

    async generateEvent() {
        const alivePlayers = this.players.filter(player => player.status === 'alive');
        const injuredPlayers = this.players.filter(player => player.status === 'injured');

        const rosterSummary = alivePlayers
            .map(player => {
                const state = player.state ? player.state : 'sin novedades';
                const injuries = player.injuries.length ? player.injuries.join(', ') : 'ninguna';
                return `${player.name} (${player.hp} HP, lesiones: ${injuries}, estado: ${state})`;
            })
            .join('\n');

        const bioContext = alivePlayers
            .slice(0, 10)
            .map(player => `${player.name}: ${player.bio}`)
            .join('\n');

        const prompt = `Estamos en un simulador de battle royale en español. Describe un único evento para la ronda ${this.round}.
Datos del estado actual:
- ${alivePlayers.length} jugadores vivos.
- ${injuredPlayers.length} con lesiones.

Lista breve de jugadores:
${rosterSummary}

Contexto biográfico:
${bioContext}

Genera una escena breve (máximo 120 palabras) que involucre de 1 a 3 jugadores al azar. La escena puede ser narrativa, un conflicto, un hallazgo o un peligro ambiental. Menciona consecuencias potenciales sin decidir por completo el resultado (para mantener suspenso).`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un narrador épico de un battle royale apto para todo público. Usa un tono emocionante y claro.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 260,
                temperature: 0.85
            })
        });

        if (!response.ok) {
            throw new Error(`Código ${response.status}`);
        }

        const data = await response.json();
        const message = data?.choices?.[0]?.message?.content;
        if (!message) {
            throw new Error('Respuesta incompleta de la API');
        }
        return message.trim();
    }

    applyRandomOutcome() {
        const alivePlayers = this.players.filter(player => player.status === 'alive');
        if (!alivePlayers.length) return;

        const outcomeRoll = Math.random();
        if (outcomeRoll < 0.4) {
            // Evento narrativo sin daños.
            this.addEvent('Nadie sufre consecuencias directas en esta ronda. La tensión crece.');
            return;
        }

        if (outcomeRoll < 0.75) {
            const victim = this.pickRandom(alivePlayers);
            if (!victim) return;
            const damage = 10 + Math.floor(Math.random() * 16); // 10-25
            victim.hp = Math.max(victim.hp - damage, 0);
            const injuryOptions = [
                'contusión en el hombro',
                'corte profundo en el brazo',
                'esguince de tobillo',
                'quemadura leve',
                'costillas magulladas',
                'mareos persistentes'
            ];
            const newInjury = this.pickRandom(injuryOptions);
            if (!victim.injuries.includes(newInjury)) {
                victim.injuries.push(newInjury);
            }
            victim.state = this.pickRandom([
                'Pierna rota',
                'Conmoción leve',
                'Aturdido por explosión',
                'Infección incipiente',
                'Pánico momentáneo'
            ]);
            if (victim.hp <= 0) {
                this.eliminatePlayer(victim);
                this.addEvent(`${victim.name} sucumbe a sus heridas y queda fuera del juego.`);
            } else {
                victim.status = 'injured';
                this.addEvent(`${victim.name} queda herido (-${damage} HP).`);
            }
            return;
        }

        const target = this.pickRandom(alivePlayers);
        if (!target) return;
        this.eliminatePlayer(target);
        this.addEvent(`❌ ${target.name} ha sido eliminado en la ronda ${this.round}.`);
    }

    eliminatePlayer(player) {
        player.status = 'dead';
        player.hp = 0;
        player.roundEliminated = this.round;
        player.state = 'Sin vida.';
    }

    generateFallbackEvent() {
        const fallbackEvents = [
            'Una tormenta eléctrica recorre la arena, alterando la visibilidad.',
            'Se activa un enjambre de drones defectuosos que disparan bengalas sin control.',
            'Una zona del terreno comienza a hundirse lentamente creando pánico.',
            'Un rumor sobre un suministro legendario provoca movimientos desesperados.',
            'El sistema anuncia un cambio de reglas sorpresa y todos se tensionan.'
        ];
        return this.pickRandom(fallbackEvents);
    }

    addEvent(text, isLoading = false) {
        this.events.push({ round: this.round, text, isLoading });
        this.renderEvents();
    }

    removeLoadingEvents() {
        this.events = this.events.filter(event => !event.isLoading);
        this.renderEvents();
    }

    updateDisplay() {
        this.renderStats();
        this.renderPlayers();
        this.renderEvents();
    }

    renderStats() {
        const alive = this.players.filter(player => player.status === 'alive').length;
        const injured = this.players.filter(player => player.status === 'injured').length;
        const dead = this.players.filter(player => player.status === 'dead').length;

        this.roundNumberEl.textContent = this.round.toString();
        this.playersAliveEl.textContent = alive.toString();
        this.playersInjuredEl.textContent = injured.toString();
        this.playersDeadEl.textContent = dead.toString();
    }

    renderEvents() {
        if (!this.eventsLogEl) return;
        this.eventsLogEl.innerHTML = '';
        const lastEvents = this.events.slice(-20);
        lastEvents.forEach(event => {
            const eventEl = document.createElement('article');
            eventEl.className = `event ${event.isLoading ? 'loading' : ''}`;
            eventEl.innerHTML = `
                <header class="event-meta">
                    <span class="event-round">Ronda ${event.round}</span>
                </header>
                <p class="event-text">${event.text}</p>
            `;
            this.eventsLogEl.appendChild(eventEl);
        });
        this.eventsLogEl.scrollTop = this.eventsLogEl.scrollHeight;
    }

    updateNextEventButton() {
        if (!this.nextEventButton) return;
        const shouldEnable = this.gameRunning && !this.isProcessingEvent;
        this.nextEventButton.disabled = !shouldEnable;
        this.nextEventButton.textContent = this.isProcessingEvent ? 'Generando...' : 'Siguiente evento';
    }

    renderPlayers() {
        if (!this.playersListEl) return;
        this.playersListEl.innerHTML = '';
        this.players.forEach(player => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `player-card status-${player.status}`;
            card.setAttribute('aria-label', `Ver detalles de ${player.name}`);
            const stateClasses = ['player-state'];
            if (!player.state) {
                stateClasses.push('empty');
            }
            const totalHp = Math.max(player?.maxHp ?? player.hp ?? 0, 1);
            const currentHp = Math.max(0, Math.min(totalHp, player.hp ?? 0));
            const hpPercent = totalHp > 0 ? Math.round((currentHp / totalHp) * 100) : 0;
            const hpLevelClass = hpPercent <= 25 ? 'critical' : hpPercent <= 60 ? 'warning' : 'healthy';
            card.innerHTML = `
                <img class="player-avatar" src="${player.image}" alt="Avatar de ${player.name}" loading="lazy" />
                <h3 class="player-name" title="${player.name}">${player.name}</h3>
                <div class="player-quick-info">
                    <div class="player-hp-block">
                        <div class="player-hp-header">
                            <span class="player-hp-label">Vida</span>
                            <span class="player-hp-value">${currentHp}/${totalHp}</span>
                        </div>
                        <div class="player-hp-bar" role="progressbar" aria-label="Puntos de vida de ${player.name}" aria-valuemin="0" aria-valuemax="${totalHp}" aria-valuenow="${currentHp}" aria-valuetext="${currentHp} de ${totalHp}">
                            <div class="player-hp-bar-fill ${hpLevelClass}" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                    <span class="${stateClasses.join(' ')}">${player.state || ''}</span>
                </div>
            `;
            card.addEventListener('click', () => this.showPlayerModal(player));
            this.playersListEl.appendChild(card);
        });
    }

    showPlayerModal(player) {
        document.getElementById('modalPlayerName').textContent = player.name;
        document.getElementById('modalPlayerStatus').textContent = player.status === 'dead'
            ? `Eliminado (Ronda ${player.roundEliminated ?? '—'})`
            : player.status === 'injured'
                ? 'Herido'
                : 'Activo';
        const statusBadge = document.getElementById('modalPlayerStatus');
        statusBadge.className = `status-badge ${player.status}`;
        document.getElementById('modalPlayerBio').textContent = player.bio;
        const totalHp = Math.max(player?.maxHp ?? player.hp ?? 0, 1);
        const currentHp = Math.max(0, Math.min(totalHp, player.hp ?? 0));
        document.getElementById('modalPlayerHP').textContent = `${currentHp}/${totalHp}`;
        document.getElementById('modalPlayerInjuries').textContent = player.injuries.length
            ? player.injuries.join(', ')
            : 'Sin lesiones registradas.';
        const stateValueEl = document.getElementById('modalPlayerState');
        const stateItem = stateValueEl ? stateValueEl.closest('.stat-item') : null;
        if (stateValueEl) {
            if (player.state) {
                stateValueEl.textContent = player.state;
                if (stateItem) {
                    stateItem.style.display = '';
                }
            } else {
                stateValueEl.textContent = '';
                if (stateItem) {
                    stateItem.style.display = 'none';
                }
            }
        }
        const imageEl = document.getElementById('modalPlayerImage');
        imageEl.src = player.image;
        imageEl.alt = `Avatar de ${player.name}`;
        this.playerModal.style.display = 'block';
    }

    showConfigModal() {
        this.configErrorEl.textContent = '';
        this.configModal.style.display = 'block';
    }

    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updatePlayersFromConfig() {
        try {
            const parsed = JSON.parse(this.playersConfigInput.value);
            if (!Array.isArray(parsed) || parsed.length < 1) {
                throw new Error('Debes proporcionar al menos un jugador.');
            }
            this.players = parsed.map((entry, index) => this.normalizePlayer(entry, index));
            this.playersLoaded = true;
            this.populatePlayersConfig();
            this.hideModal(this.configModal);
            this.updateDisplay();
            this.updateNextEventButton();
        } catch (error) {
            this.configErrorEl.textContent = error.message;
        }
    }

    pickRandom(collection) {
        if (!collection.length) return null;
        const index = Math.floor(Math.random() * collection.length);
        return collection[index];
    }

    checkForWinner() {
        const alive = this.players.filter(player => player.status === 'alive');
        if (alive.length <= 1) {
            this.finishGame();
            return true;
        }
        return false;
    }

    finishGame() {
        const alivePlayers = this.players.filter(player => player.status === 'alive');
        if (alivePlayers.length === 1) {
            this.addEvent(`🏆 ${alivePlayers[0].name} es el ganador de la simulación.`);
        } else {
            this.addEvent('🔥 No queda nadie en pie. La arena reclama a todos los combatientes.');
        }
        this.gameRunning = false;
        this.isProcessingEvent = false;
        this.updateNextEventButton();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BattleRoyaleSimulator();
});
