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
        this.currentEventIndex = -1;
        this.displayedEventId = null;
        this.eventIdCounter = 0;
        this.typingTimeouts = [];
        this.isTyping = false;

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
        this.eventRoundEl = document.getElementById('eventRound');
        this.eventStatusEl = document.getElementById('eventStatus');
        this.eventTextEl = document.getElementById('eventText');
        this.eventResolutionEl = document.getElementById('eventResolution');
        this.eventResolutionTextEl = document.getElementById('eventResolutionText');
        this.prevEventButton = document.getElementById('prevEvent');
        this.nextEventButton = document.getElementById('nextEvent');
    }

    registerEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        if (this.prevEventButton) {
            this.prevEventButton.addEventListener('click', () => this.navigateEvent(-1));
        }
        if (this.nextEventButton) {
            this.nextEventButton.addEventListener('click', () => this.handleNextEventAction());
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
                return;
            }
            const targetTag = event.target?.tagName?.toLowerCase?.();
            if (targetTag === 'textarea' || targetTag === 'input') {
                return;
            }
            const modalOpen = (this.playerModal && this.playerModal.style.display === 'block')
                || (this.configModal && this.configModal.style.display === 'block');
            if (modalOpen) {
                return;
            }
            if (event.key === 'ArrowLeft') {
                this.navigateEvent(-1);
            } else if (event.key === 'ArrowRight') {
                this.handleNextEventAction();
            }
        });

        if (this.contextInput) {
            this.contextInput.addEventListener('input', () => {
                this.globalContext = this.contextInput.value;
            });
        }

        this.updateEventControls();
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
        this.currentEventIndex = -1;
        this.displayedEventId = null;
        this.cancelTyping();
        this.updateDisplay();
        const aliveCount = this.players.filter(player => player.status !== 'dead').length;
        const rosterMessage = aliveCount === 1
            ? 'La arena se activa. Solo queda un combatiente en juego.'
            : `La arena se activa. ${aliveCount} combatientes entran en juego.`;
        this.addEvent(rosterMessage);
        document.getElementById('startGame').disabled = true;
        this.apiKeyInput.disabled = true;
        this.updateEventControls();
    }

    async resetGame() {
        this.gameRunning = false;
        this.isProcessingEvent = false;
        this.round = 0;
        this.events = [];
        this.currentEventIndex = -1;
        this.displayedEventId = null;
        this.cancelTyping();
        await this.loadPlayersFromFile();
        this.updateDisplay();
        this.apiKeyInput.disabled = false;
        this.apiKeyInput.value = '';
        document.getElementById('startGame').disabled = false;
        this.updateEventControls();
    }

    async runEventTurn() {
        if (!this.gameRunning || this.isProcessingEvent) return;

        if (this.isTyping && this.currentEventIndex >= 0) {
            this.showEvent(this.currentEventIndex, { instant: true });
        }

        const alivePlayers = this.players.filter(player => player.status === 'alive');
        if (alivePlayers.length <= 1) {
            this.finishGame();
            return;
        }

        const plan = this.planEventOutcome(alivePlayers);

        this.isProcessingEvent = true;
        this.updateEventControls();
        this.round += 1;
        this.addEvent(`⏳ Generando evento de la ronda ${this.round}...`, true);

        try {
            const eventDescription = await this.generateEvent(plan);
            this.removeLoadingEvents();
            this.addEvent(eventDescription);
            this.applyPlannedOutcome(plan);
        } catch (error) {
            console.error(error);
            this.removeLoadingEvents();
            const fallback = this.generateFallbackEvent(plan);
            this.addEvent(`⚠️ Error con la API (${error.message}). Evento alternativo: ${fallback}`);
            this.applyPlannedOutcome(plan);
        }

        this.updateDisplay();
        const hasWinner = this.checkForWinner();
        this.isProcessingEvent = false;
        if (!hasWinner) {
            this.updateEventControls();
        }
        this.updateEventControls();
    }

    planEventOutcome(alivePlayers) {
        if (!alivePlayers.length) {
            return { type: 'narrative', tone: 'serio', participants: [] };
        }

        const roll = Math.random();
        const maxParticipants = Math.min(3, alivePlayers.length);

        const pickGroup = (mandatory = []) => {
            const desired = Math.max(1, Math.floor(Math.random() * maxParticipants) + 1);
            const participants = [...mandatory];
            const pool = alivePlayers.filter(player => !participants.includes(player));
            while (participants.length < desired && pool.length) {
                const index = Math.floor(Math.random() * pool.length);
                participants.push(pool.splice(index, 1)[0]);
            }
            return participants;
        };

        if (roll < 0.1) {
            return {
                type: 'narrative',
                tone: 'comic',
                participants: pickGroup()
            };
        }

        if (roll < 0.3) {
            return {
                type: 'narrative',
                tone: 'serio',
                participants: pickGroup()
            };
        }

        const victim = this.pickRandom(alivePlayers);
        if (!victim) {
            return {
                type: 'narrative',
                tone: 'serio',
                participants: pickGroup()
            };
        }

        const participants = pickGroup([victim]);

        if (roll < 0.8) {
            const injuryOptions = [
                'contusión en el hombro',
                'corte profundo en el brazo',
                'esguince de tobillo',
                'quemadura leve',
                'costillas magulladas',
                'mareos persistentes'
            ];
            const stateOptions = [
                'Pierna lesionada',
                'Conmoción leve',
                'Aturdido por la explosión',
                'Infección incipiente',
                'Pánico momentáneo'
            ];
            const baseDamage = 10 + Math.floor(Math.random() * 16);
            if (victim.hp - baseDamage <= 0) {
                return {
                    type: 'elimination',
                    participants,
                    victim
                };
            }
            return {
                type: 'injury',
                participants,
                victim,
                damage: Math.max(1, Math.min(baseDamage, victim.hp - 1)),
                injury: this.pickRandom(injuryOptions),
                newState: this.pickRandom(stateOptions) || 'Malherido'
            };
        }

        return {
            type: 'elimination',
            participants,
            victim
        };
    }

    async generateEvent(plan) {
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

        const trimmedContext = typeof this.globalContext === 'string' ? this.globalContext.trim() : '';
        const arenaContext = trimmedContext
            ? `\nContexto general del escenario:\n${trimmedContext}\n`
            : '';

        const participants = Array.isArray(plan?.participants) && plan.participants.length
            ? plan.participants
            : this.selectParticipantsForEvent(alivePlayers);

        const participantsSummary = participants
            .map(player => {
                const state = player.state ? player.state : 'sin novedades';
                const injuries = player.injuries.length ? player.injuries.join(', ') : 'ninguna';
                return `${player.name} (${player.hp} HP, lesiones: ${injuries}, estado: ${state})`;
            })
            .join('\n');

        const participantsNames = participants.map(player => player.name).join(', ');

        let consequenceGuidance = 'Deja claro que todos los implicados salen ilesos y con vida.';
        if (plan?.type === 'narrative' && plan?.tone === 'comic') {
            consequenceGuidance = 'Usa un tono cómico y ligero. Remata con un detalle humorístico y confirma que nadie resulta herido ni muere.';
        } else if (plan?.type === 'narrative') {
            consequenceGuidance = 'Mantén un tono tenso pero sin comedia. Cierra la escena confirmando que nadie resulta herido ni muere.';
        } else if (plan?.type === 'injury' && plan?.victim) {
            consequenceGuidance = `Describe cómo ${plan.victim.name} resulta herido en la escena y pierde ${plan.damage} puntos de vida. Menciona una lesión compatible (${plan.injury}), que queda ${plan.newState} y que el resto de participantes continúa con vida.`;
        } else if (plan?.type === 'elimination' && plan?.victim) {
            consequenceGuidance = `Narra de forma explícita cómo ${plan.victim.name} muere en esta misma escena y precisa el estado final del resto de participantes.`;
        }

        const toneGuidance = plan?.type === 'narrative' && plan?.tone === 'comic'
            ? 'Usa humor breve y amable sin romper la coherencia de la escena.'
            : plan?.type === 'narrative'
                ? 'Mantén un tono serio y directo.'
                : 'Utiliza un tono intenso y claro.';

        const structureGuidance = 'Redacta un único párrafo en español de máximo 80 palabras, sin saltos de línea ni listas. Asegúrate de cerrar por completo la acción sin dejar promesas ni anticipos de futuros sucesos.';

        const prompt = `Estamos en un simulador de battle royale en español. Describe un único evento autoconclusivo para la ronda ${this.round}.
Datos del estado actual:
- ${alivePlayers.length} jugadores vivos.
- ${injuredPlayers.length} con lesiones.

Lista breve de jugadores:
${rosterSummary}

Contexto biográfico:
${bioContext}${arenaContext}

Personajes implicados obligatorios:
${participantsSummary}

Genera una escena breve centrada exclusivamente en esos personajes. ${toneGuidance} ${consequenceGuidance} ${structureGuidance} No incluyas a ningún otro personaje ajeno a la lista (${participantsNames}).`;

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

        const cleaned = this.extractJsonPayload(rawText);
        if (!cleaned) return null;

        try {
            const parsed = JSON.parse(cleaned);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (originalError) {
            const repaired = this.repairJsonPayload(cleaned);
            if (!repaired) {
                console.error('No se pudo analizar el JSON del evento:', originalError, rawText);
                return null;
            }

            try {
                const parsed = JSON.parse(repaired);
                if (!parsed || typeof parsed !== 'object') return null;
                console.warn('Se reparó un JSON incompleto devuelto por el modelo.');
                return parsed;
            } catch (repairedError) {
                console.error('No se pudo analizar el JSON del evento:', repairedError, rawText);
                return null;
            }
        }
    }

    extractJsonPayload(rawText) {
        if (!rawText) return '';

        let cleaned = rawText.trim();

        const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch && fencedMatch[1]) {
            cleaned = fencedMatch[1].trim();
        }

        const firstStructural = cleaned.search(/[\[{]/);
        const lastStructural = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        if (firstStructural !== -1 && lastStructural !== -1 && lastStructural > firstStructural) {
            cleaned = cleaned.slice(firstStructural, lastStructural + 1).trim();
        }

        return cleaned;
    }

    repairJsonPayload(payload) {
        if (!payload) return '';

        let repaired = payload.trim();

        const lastClosing = Math.max(repaired.lastIndexOf('}'), repaired.lastIndexOf(']'));
        if (lastClosing !== -1) {
            repaired = repaired.slice(0, lastClosing + 1);
        }

        repaired = repaired.replace(/,\s*(?=[}\]])/g, '');

        const stack = [];
        let inString = false;
        let escape = false;

        for (let i = 0; i < repaired.length; i += 1) {
            const char = repaired[i];
            if (inString) {
                if (escape) {
                    escape = false;
                    continue;
                }

                if (char === '\\') {
                    escape = true;
                    continue;
                }

                if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }

            if (char === '{' || char === '[') {
                stack.push(char);
                continue;
            }

            if (char === '}' || char === ']') {
                if (!stack.length) {
                    repaired = repaired.slice(0, i) + repaired.slice(i + 1);
                    i -= 1;
                    continue;
                }

                const opener = stack.pop();
                const expected = opener === '{' ? '}' : ']';
                if (char !== expected) {
                    repaired = `${repaired.slice(0, i)}${expected}${repaired.slice(i + 1)}`;
                }
            }
        }

        if (inString) {
            repaired += '"';
        }

        while (stack.length) {
            const opener = stack.pop();
            repaired += opener === '{' ? '}' : ']';
        }

        repaired = repaired.replace(/,\s*(?=[}\]])/g, '');

        return repaired.trim();
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

    applyPlannedOutcome(plan) {
        if (!plan) {
            this.addEvent('No se pudo determinar el resultado del evento.');
            return;
        }

        if (plan.type === 'narrative' || !plan.participants?.length) {
            return;
        }

        if (plan.type === 'injury' && plan.victim) {
            const victim = plan.victim;
            const damage = Math.max(1, Math.min(plan.damage ?? 10, victim.hp));
            victim.hp = Math.max(victim.hp - damage, 0);
            if (plan.injury && !victim.injuries.includes(plan.injury)) {
                victim.injuries.push(plan.injury);
            }
            if (plan.newState) {
                victim.state = plan.newState;
            }
            if (victim.hp <= 0) {
                this.eliminatePlayer(victim);
                this.addEvent(`${victim.name} no resiste las heridas y queda eliminado.`);
            } else {
                victim.status = 'injured';
                this.addEvent(`${victim.name} queda herido (-${damage} HP).`);
            }
            return;
        }

        if (plan.type === 'elimination' && plan.victim) {
            const target = plan.victim;
            this.eliminatePlayer(target);
            this.addEvent(`❌ ${target.name} ha sido eliminado en la ronda ${this.round}.`);
        }
    }

    eliminatePlayer(player) {
        player.status = 'dead';
        player.hp = 0;
        player.roundEliminated = this.round;
        player.state = 'Sin vida.';
    }

    generateFallbackEvent(plan) {
        if (!plan) {
            const generic = [
                'Una tormenta eléctrica recorre la arena, alterando la visibilidad.',
                'Se activa un enjambre de drones defectuosos que disparan bengalas sin control.',
                'Una zona del terreno comienza a hundirse lentamente creando pánico.',
                'Un rumor sobre un suministro legendario provoca movimientos desesperados.',
                'El sistema anuncia un cambio de reglas sorpresa y todos se tensionan.'
            ];
            return this.pickRandom(generic);
        }

        const names = (plan.participants ?? []).map(player => player.name).join(', ');
        if (plan.type === 'injury' && plan.victim) {
            return `Un fallo en la arena hiere a ${plan.victim.name}; pierde ${plan.damage} HP y queda ${plan.newState}.`;
        }
        if (plan.type === 'elimination' && plan.victim) {
            return `Un giro inesperado deja fuera de combate a ${plan.victim.name} durante la refriega.`;
        }
        if (plan.type === 'narrative' && plan.tone === 'comic') {
            return `Los participantes ${names || 'de la zona'} protagonizan un malentendido cómico y todos salen ilesos.`;
        }
        return `Los participantes ${names || 'de la zona'} se encuentran, pero la situación se resuelve sin heridas ni bajas.`;
    }

    addEvent(text, isLoading = false) {
        let providedResolution = '';
        if (text && typeof text === 'object' && !Array.isArray(text)) {
            const extracted = this.extractResolutionFromPayload(text);
            if (this.isMeaningfulEventText(extracted)) {
                providedResolution = extracted.trim();
            }
        }

        const bannedTexts = providedResolution
            ? new Set([providedResolution.trim().toLowerCase()])
            : null;

        const normalizedText = typeof text === 'string'
            ? text
            : this.normalizeEventText(text, new Set(), { bannedTexts });
        const finalText = normalizedText && normalizedText.trim()
            ? normalizedText.trim()
            : 'Evento sin descripción disponible.';
        const event = {
            id: ++this.eventIdCounter,
            round: this.round,
            text: finalText,
            isLoading,
            resolution: providedResolution
                || this.deriveResolutionFromText(finalText, this.round, isLoading)
        };
        this.events.push(event);
        const shouldAnimate = !isLoading;
        this.showEvent(this.events.length - 1, { instant: !shouldAnimate });
        this.updateEventControls();
    }

    normalizeEventText(payload, visited = new Set(), options = {}) {
        if (payload === null || payload === undefined) {
            return '';
        }

        const payloadType = typeof payload;
        if (payloadType === 'string') {
            const bannedTexts = options?.bannedTexts instanceof Set ? options.bannedTexts : null;
            return this.isBannedEventText(payload, bannedTexts) ? '' : payload;
        }
        if (payloadType === 'number' || payloadType === 'boolean') {
            return String(payload);
        }

        if (visited.has(payload)) {
            return '';
        }

        if (Array.isArray(payload)) {
            const bannedTexts = options?.bannedTexts instanceof Set ? options.bannedTexts : null;
            visited.add(payload);
            const parts = payload
                .map(item => this.normalizeEventText(item, visited, options))
                .filter(part => this.isMeaningfulEventText(part) && !this.isBannedEventText(part, bannedTexts));
            visited.delete(payload);
            return parts.join('\n');
        }

        if (payloadType === 'object') {
            visited.add(payload);
            const bannedTexts = options?.bannedTexts instanceof Set ? options.bannedTexts : null;
            const preferredKeys = [
                'summary',
                'narrative',
                'description',
                'text',
                'story',
                'details',
                'event',
                'title',
                'body',
                'outcome',
                'ending',
                'conclusion',
                'resumen',
                'descripcion',
                'descripción',
                'relato',
                'detalle',
                'detalles',
                'conclusion',
                'conclusión',
                'desenlace'
            ];

            const collected = [];
            for (const key of preferredKeys) {
                if (Object.prototype.hasOwnProperty.call(payload, key)) {
                    const candidate = this.normalizeEventText(payload[key], visited, options);
                    const trimmedCandidate = typeof candidate === 'string' ? candidate.trim() : '';
                    if (this.isMeaningfulEventText(trimmedCandidate) && !this.isBannedEventText(trimmedCandidate, bannedTexts)) {
                        collected.push(trimmedCandidate);
                    }
                }
            }

            if (!collected.length) {
                const ignoredKeys = new Set([
                    'round',
                    'ronda',
                    'turn',
                    'turno',
                    'id',
                    'resolution',
                    'resolucion',
                    'resolución',
                    'resolutiontext',
                    'resolution_text',
                    'texto_resolucion',
                    'texto_resolución',
                    'textoresolution'
                ]);
                for (const [key, value] of Object.entries(payload)) {
                    if (ignoredKeys.has(key.toLowerCase())) {
                        continue;
                    }
                    const candidate = this.normalizeEventText(value, visited, options);
                    const trimmedCandidate = typeof candidate === 'string' ? candidate.trim() : '';
                    if (this.isMeaningfulEventText(trimmedCandidate) && !this.isBannedEventText(trimmedCandidate, bannedTexts)) {
                        collected.push(trimmedCandidate);
                    }
                }
            }

            visited.delete(payload);
            if (collected.length) {
                return collected.join('\n\n');
            }
        }

        try {
            return JSON.stringify(payload);
        } catch (error) {
            console.warn('No se pudo convertir el evento a texto legible:', error);
            return String(payload);
        }
    }

    extractResolutionFromPayload(payload, visited = new Set()) {
        if (!payload || visited.has(payload)) {
            return '';
        }

        if (typeof payload === 'string') {
            const trimmed = payload.trim();
            return trimmed;
        }

        if (Array.isArray(payload)) {
            visited.add(payload);
            for (const item of payload) {
                const candidate = this.extractResolutionFromPayload(item, visited);
                if (this.isMeaningfulEventText(candidate)) {
                    visited.delete(payload);
                    return candidate.trim();
                }
            }
            visited.delete(payload);
            return '';
        }

        if (typeof payload !== 'object') {
            return '';
        }

        visited.add(payload);
        const resolutionKeys = [
            'resolution',
            'resolucion',
            'resolución',
            'resolutiontext',
            'resolution_text',
            'texto_resolucion',
            'texto_resolución',
            'textoresolution',
            'finalresolution',
            'final_resolution'
        ];

        for (const [key, value] of Object.entries(payload)) {
            const normalizedKey = key.toLowerCase();
            const matchesResolution = resolutionKeys.includes(normalizedKey)
                || normalizedKey.includes('resolution')
                || normalizedKey.includes('resoluci');
            if (!matchesResolution) {
                continue;
            }
            const candidate = this.extractResolutionFromPayload(value, visited);
            if (this.isMeaningfulEventText(candidate)) {
                visited.delete(payload);
                return candidate.trim();
            }
        }

        visited.delete(payload);
        return '';
    }

    isMeaningfulEventText(candidate) {
        if (typeof candidate !== 'string') {
            return false;
        }
        const trimmed = candidate.trim();
        if (!trimmed) {
            return false;
        }
        const numericPattern = /^[+-]?\d+(?:[.,]\d+)?$/;
        if (numericPattern.test(trimmed)) {
            return false;
        }
        return true;
    }

    isBannedEventText(candidate, bannedTexts) {
        if (!bannedTexts || !bannedTexts.size || typeof candidate !== 'string') {
            return false;
        }
        const normalized = candidate.trim().toLowerCase();
        if (!normalized) {
            return false;
        }
        return bannedTexts.has(normalized);
    }

    removeLoadingEvents() {
        const wasViewingLoading = this.currentEventIndex >= 0 && this.events[this.currentEventIndex]?.isLoading;
        this.events = this.events.filter(event => !event.isLoading);
        if (!this.events.length) {
            this.currentEventIndex = -1;
            this.displayedEventId = null;
        } else if (this.currentEventIndex >= this.events.length) {
            this.currentEventIndex = this.events.length - 1;
            this.displayedEventId = null;
        } else if (wasViewingLoading) {
            this.displayedEventId = null;
        }
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
        if (!this.events.length) {
            this.displayEmptyEvent();
            return;
        }

        if (this.currentEventIndex < 0 || this.currentEventIndex >= this.events.length) {
            this.showEvent(this.events.length - 1, { instant: true });
            return;
        }

        const currentEvent = this.events[this.currentEventIndex];
        if (!currentEvent) {
            this.displayEmptyEvent();
            return;
        }

        if (this.isTyping && currentEvent.id === this.displayedEventId) {
            this.updateEventControls();
            return;
        }

        if (currentEvent.id !== this.displayedEventId) {
            this.showEvent(this.currentEventIndex, { instant: true });
            return;
        }

        this.renderEventInstant(currentEvent);
        this.updateEventControls();
    }

    updateEventControls() {
        const hasEvents = this.events.length > 0;
        const atFirst = this.currentEventIndex <= 0;
        const atLatest = !hasEvents || this.currentEventIndex >= this.events.length - 1;
        const canGenerate = this.gameRunning && !this.isProcessingEvent;

        if (this.prevEventButton) {
            this.prevEventButton.disabled = !hasEvents || atFirst || this.isTyping;
        }

        if (this.nextEventButton) {
            const labelEl = this.nextEventButton.querySelector('.control-label');
            const action = atLatest ? 'generate' : 'navigate';
            if (!hasEvents) {
                this.nextEventButton.disabled = !canGenerate || this.isTyping;
            } else if (action === 'generate') {
                this.nextEventButton.disabled = !canGenerate || this.isTyping;
            } else {
                this.nextEventButton.disabled = this.isTyping;
            }
            this.nextEventButton.classList.toggle('loading', this.isProcessingEvent && action === 'generate');
            if (labelEl) {
                if (action === 'generate') {
                    labelEl.textContent = this.isProcessingEvent ? 'Generando...' : 'Generar';
                } else {
                    labelEl.textContent = 'Siguiente';
                }
            }
            const ariaLabel = action === 'generate'
                ? (this.isProcessingEvent ? 'Generando evento' : 'Generar nuevo evento')
                : 'Ver siguiente evento';
            this.nextEventButton.setAttribute('aria-label', ariaLabel);
        }
    }

    displayEmptyEvent() {
        this.cancelTyping();
        this.currentEventIndex = -1;
        this.displayedEventId = null;
        if (this.eventRoundEl) {
            this.eventRoundEl.textContent = 'Sin eventos';
        }
        if (this.eventStatusEl) {
            this.eventStatusEl.textContent = this.gameRunning ? 'Esperando evento' : 'En reposo';
        }
        if (this.eventTextEl) {
            this.eventTextEl.textContent = this.gameRunning
                ? 'Pulsa la flecha derecha para solicitar el próximo evento.'
                : 'Inicia la simulación para comenzar a narrar la arena.';
        }
        if (this.eventResolutionTextEl) {
            this.eventResolutionTextEl.textContent = this.gameRunning
                ? 'A la espera de acciones en la arena.'
                : 'Configura los combatientes y comienza la partida.';
        }
        this.hideResolution();
        this.updateEventControls();
    }

    cancelTyping() {
        this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.typingTimeouts = [];
        this.isTyping = false;
    }

    renderEventInstant(event) {
        if (!event) return;
        this.cancelTyping();
        this.displayedEventId = event.id;
        if (this.eventRoundEl) {
            this.eventRoundEl.textContent = `Ronda ${event.round}`;
        }
        if (this.eventStatusEl) {
            this.eventStatusEl.textContent = event.isLoading ? 'Generando...' : 'Resuelto';
        }
        if (this.eventTextEl) {
            this.eventTextEl.textContent = event.text;
        }
        if (event.isLoading) {
            this.hideResolution();
        } else {
            this.showResolution(event);
        }
        this.updateEventControls();
    }

    showEvent(index, { instant = false } = {}) {
        if (!this.events.length) {
            this.displayEmptyEvent();
            return;
        }

        const maxIndex = this.events.length - 1;
        const targetIndex = Math.min(Math.max(index, 0), maxIndex);
        const event = this.events[targetIndex];
        if (!event) {
            this.displayEmptyEvent();
            return;
        }

        this.currentEventIndex = targetIndex;
        this.displayedEventId = event.id;
        if (instant || event.isLoading || !event.text.length) {
            this.renderEventInstant(event);
            return;
        }

        this.cancelTyping();
        if (this.eventRoundEl) {
            this.eventRoundEl.textContent = `Ronda ${event.round}`;
        }
        if (this.eventStatusEl) {
            this.eventStatusEl.textContent = 'Narrando...';
        }
        if (this.eventTextEl) {
            this.eventTextEl.textContent = '';
        }
        this.hideResolution();
        this.isTyping = true;
        const characters = Array.from(event.text);
        const revealNext = (position) => {
            if (this.displayedEventId !== event.id || !this.eventTextEl) {
                return;
            }
            this.eventTextEl.textContent = characters.slice(0, position).join('');
            if (position < characters.length) {
                const timeout = setTimeout(() => revealNext(position + 1), 18);
                this.typingTimeouts.push(timeout);
            } else {
                this.isTyping = false;
                if (this.eventStatusEl) {
                    this.eventStatusEl.textContent = 'Resuelto';
                }
                const timeout = setTimeout(() => {
                    if (this.displayedEventId === event.id) {
                        this.showResolution(event);
                    }
                }, 280);
                this.typingTimeouts.push(timeout);
                this.updateEventControls();
            }
        };

        revealNext(1);
        this.updateEventControls();
    }

    showResolution(event) {
        if (!this.eventResolutionEl) return;
        if (this.eventResolutionTextEl) {
            this.eventResolutionTextEl.textContent = event?.resolution
                ? event.resolution
                : 'Evento completado.';
        }
        this.eventResolutionEl.classList.add('visible');
        this.eventResolutionEl.setAttribute('aria-hidden', 'false');
    }

    hideResolution() {
        if (!this.eventResolutionEl) return;
        this.eventResolutionEl.classList.remove('visible');
        this.eventResolutionEl.setAttribute('aria-hidden', 'true');
    }

    deriveResolutionFromText(text, round, isLoading = false) {
        if (isLoading) {
            return 'Narrativa en proceso...';
        }

        const normalized = (text || '').toLowerCase();
        if (!normalized) {
            return 'Evento registrado sin detalles adicionales.';
        }

        const cleanName = (raw) => raw
            .replace(/^[^A-Za-zÀ-ÿ0-9]+/, '')
            .trim();

        const eliminationMatch = text.match(/([A-Za-zÀ-ÿ'’`´\-\s]+?)\s+(?:ha sido|queda|no resiste|cae)[^.!?]*eliminad/i);
        if (eliminationMatch) {
            const name = cleanName(eliminationMatch[1]);
            if (name) {
                return `Baja confirmada: ${name}.`;
            }
            return `Baja confirmada durante la ronda ${round}.`;
        }

        const injuryMatch = text.match(/([A-Za-zÀ-ÿ'’`´\-\s]+?)\s+(?:queda|resulta)[^.!?]*herid/i);
        if (injuryMatch) {
            const name = cleanName(injuryMatch[1]);
            if (name) {
                return `${name} queda herido.`;
            }
            return 'Se registran nuevas lesiones en la arena.';
        }

        if (normalized.includes('pierde') && normalized.includes('hp')) {
            return 'Los puntos de vida de un combatiente han disminuido.';
        }
        if (normalized.includes('sin heridas') || normalized.includes('ileso') || normalized.includes('sin bajas')) {
            return 'Sin bajas ni heridas tras el encuentro.';
        }
        if (normalized.includes('error')) {
            return 'Evento alternativo aplicado por un fallo en la generación.';
        }
        if (normalized.includes('ganador') || normalized.includes('gana') || normalized.includes('victoria')) {
            return 'La simulación alcanza su desenlace final.';
        }

        return 'El evento concluye sin novedades críticas.';
    }

    navigateEvent(step) {
        if (!this.events.length) {
            return;
        }

        if (this.isTyping && this.currentEventIndex >= 0) {
            this.showEvent(this.currentEventIndex, { instant: true });
        }

        if (this.currentEventIndex < 0) {
            this.showEvent(0, { instant: true });
            return;
        }

        const targetIndex = Math.min(
            Math.max(this.currentEventIndex + step, 0),
            this.events.length - 1
        );
        if (targetIndex === this.currentEventIndex) {
            this.updateEventControls();
            return;
        }
        this.showEvent(targetIndex, { instant: true });
    }

    handleNextEventAction() {
        if (this.isTyping && this.currentEventIndex >= 0) {
            this.showEvent(this.currentEventIndex, { instant: true });
            return;
        }

        const hasEvents = this.events.length > 0;
        const atLatest = !hasEvents || this.currentEventIndex >= this.events.length - 1;

        if (atLatest) {
            if (this.gameRunning && !this.isProcessingEvent) {
                this.runEventTurn();
            }
        } else {
            this.navigateEvent(1);
        }
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
            this.updateEventControls();
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
        const survivors = this.players.filter(player => player.status !== 'dead');
        if (survivors.length <= 1) {
            this.finishGame();
            return true;
        }
        return false;
    }

    finishGame() {
        const survivors = this.players.filter(player => player.status !== 'dead');
        if (survivors.length === 1) {
            this.addEvent(`🏆 ${survivors[0].name} es el ganador de la simulación.`);
        } else {
            this.addEvent('🔥 No queda nadie en pie. La arena reclama a todos los combatientes.');
        }
        this.gameRunning = false;
        this.isProcessingEvent = false;
        this.updateEventControls();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BattleRoyaleSimulator();
});
