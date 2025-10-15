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
        this.globalContext = '';

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
        this.contextInput = document.getElementById('gameContext');
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

        if (this.contextInput) {
            this.contextInput.addEventListener('input', () => {
                this.globalContext = this.contextInput.value;
            });
        }

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
        this.globalContext = this.contextInput ? this.contextInput.value : '';
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
            const eventPayload = await this.generateEvent();
            this.removeLoadingEvents();
            if (eventPayload?.eventText) {
                this.addEvent(eventPayload.eventText);
            }
            const outcomeLogs = this.applyEventOutcome(eventPayload?.eventOutcome);
            outcomeLogs.forEach(log => this.addEvent(log));
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
        const availablePlayers = this.players.filter(player => player.status !== 'dead');
        if (!availablePlayers.length) {
            throw new Error('No hay jugadores disponibles para generar un evento.');
        }

        const participants = this.selectParticipantsForEvent(availablePlayers);
        const trimmedContext = typeof this.globalContext === 'string' ? this.globalContext.trim() : '';
        const contextText = trimmedContext || 'Sin contexto adicional proporcionado por el usuario.';
        const participantBlocks = participants.map(player => {
            const injuries = player.injuries.length ? player.injuries.join(', ') : 'ninguna';
            const state = player.state ? player.state : 'sin novedades';
            return `ID ${player.id} - ${player.name}\nEstado: ${player.status}\nHP: ${player.hp}/${player.maxHp}\nLesiones: ${injuries}\nEstado mental/físico: ${state}\nBiografía: ${player.bio}`;
        }).join('\n\n');

        const prompt = `Simulador de battle royale en español. Ronda ${this.round}.
Contexto general: ${contextText}

Participantes involucrados en este evento:
${participantBlocks}

Genera un evento breve en español (máximo 120 palabras) que solo involucre a los participantes listados. Mantén coherencia con sus estados actuales.
Debes responder ÚNICAMENTE con un objeto JSON válido que siga exactamente esta estructura y orden de campos:
{
  "eventText": "Texto narrativo del evento en español",
  "eventOutcome": {
    "summary": "Resumen breve de las consecuencias",
    "effects": [
      {
        "participantId": <ID numérico>,
        "status": "alive" | "injured" | "dead",
        "hpDelta": <número entero (negativo si pierde HP, positivo si gana HP, 0 si se mantiene)>,
        "injuries": ["lista opcional de lesiones nuevas o agravadas"],
        "state": "Descripción breve del estado mental o físico tras el evento"
      }
    ]
  }
}
Reglas obligatorias:
- Incluye exactamente un objeto de efecto por cada participante listado, sin añadir otros personajes.
- Usa los IDs proporcionados.
- Si un participante muere, su estado debe ser "dead" y el hpDelta reflejar el daño recibido.
- Si no hay cambios para un participante, usa hpDelta 0, mantén su estado actual y deja injuries como un arreglo vacío.
- El resumen debe ser coherente con los efectos listados.`;

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
                        content: 'Eres un narrador épico de un battle royale apto para todo público. Usa un tono emocionante y claro y sigue estrictamente las instrucciones de formato JSON.'
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
        const trimmed = message.trim();
        const parsed = this.safeParseEventPayload(trimmed);
        if (!parsed) {
            throw new Error('La respuesta del modelo no es un JSON válido.');
        }
        return parsed;
    }

    safeParseEventPayload(rawText) {
        if (!rawText) return null;
        try {
            const parsed = JSON.parse(rawText);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (error) {
            console.error('No se pudo analizar el JSON del evento:', error, rawText);
            return null;
        }
    }

    selectParticipantsForEvent(players) {
        const pool = players.slice();
        const maxCount = Math.min(3, pool.length);
        const count = Math.max(1, Math.floor(Math.random() * maxCount) + 1);
        const selected = [];
        while (selected.length < count && pool.length) {
            const index = Math.floor(Math.random() * pool.length);
            selected.push(pool.splice(index, 1)[0]);
        }
        return selected;
    }

    applyEventOutcome(eventOutcome) {
        if (!eventOutcome || typeof eventOutcome !== 'object') {
            return [];
        }

        const logs = [];
        const { summary, effects } = eventOutcome;
        if (Array.isArray(effects)) {
            effects.forEach(effect => {
                const playerId = Number(effect?.participantId);
                if (!Number.isFinite(playerId)) return;
                const player = this.players.find(candidate => candidate.id === playerId);
                if (!player) return;

                const hpDelta = Number.isFinite(effect?.hpDelta) ? Math.round(effect.hpDelta) : 0;
                if (hpDelta !== 0) {
                    const targetHp = Math.max(0, Math.min(player.maxHp, player.hp + hpDelta));
                    player.hp = targetHp;
                }

                if (Array.isArray(effect?.injuries)) {
                    effect.injuries
                        .map(injury => typeof injury === 'string' ? injury.trim() : '')
                        .filter(Boolean)
                        .forEach(injury => {
                            if (!player.injuries.includes(injury)) {
                                player.injuries.push(injury);
                            }
                        });
                }

                if (typeof effect?.state === 'string') {
                    const trimmedState = effect.state.trim();
                    if (trimmedState) {
                        player.state = trimmedState;
                    }
                }

                const status = typeof effect?.status === 'string' ? effect.status.trim().toLowerCase() : '';
                if (status === 'dead') {
                    this.eliminatePlayer(player);
                    logs.push(`❌ ${player.name} cae en combate tras el evento.`);
                    return;
                }
                if (status === 'injured') {
                    player.status = 'injured';
                    logs.push(`${player.name} queda herido (${player.hp}/${player.maxHp} HP).`);
                } else if (status === 'alive') {
                    player.status = 'alive';
                    if (hpDelta < 0) {
                        logs.push(`${player.name} resiste el golpe y mantiene la pelea (${player.hp}/${player.maxHp} HP).`);
                    } else if (hpDelta > 0) {
                        logs.push(`${player.name} se recupera un poco (${player.hp}/${player.maxHp} HP).`);
                    }
                }
            });
        }

        if (typeof summary === 'string' && summary.trim()) {
            logs.unshift(summary.trim());
        }

        return logs;
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
