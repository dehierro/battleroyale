const DEFAULT_PLAYERS = [
    {
        name: 'Alex "Halcón" Ortega',
        bio: 'Ex francotirador militar que huyó tras revelar corrupción. Confía en su mira y en su código moral propio.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
        hp: 100,
        injuries: [],
        mentalState: 'Enfocado y paciente.'
    },
    {
        name: 'Bianca "Volt" Salvatierra',
        bio: 'Ingeniera eléctrica que fabrica trampas improvisadas con cualquier cosa. Ama los desafíos imposibles.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bianca',
        hp: 95,
        injuries: [],
        mentalState: 'Creativa, pensando en su próximo invento.'
    },
    {
        name: 'Carlos "Furia" Montalvo',
        bio: 'Ex luchador clandestino con reputación de invencible. Busca redención tras una pelea que salió mal.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Carlos',
        hp: 115,
        injuries: [],
        mentalState: 'Agitado, ansioso por probar su fuerza.'
    },
    {
        name: 'Daria "Silente" Novak',
        bio: 'Espía retirada especializada en infiltración. Prefiere actuar desde las sombras y observar antes de atacar.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daria',
        hp: 90,
        injuries: [],
        mentalState: 'Serena, evaluando cada paso.'
    },
    {
        name: 'Elias "Trémolo" Ruiz',
        bio: 'Músico callejero que oculta cuchillas en su guitarra. Usa el ritmo para anticipar los movimientos rivales.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Elias',
        hp: 100,
        injuries: [],
        mentalState: 'Inspirado, tarareando melodías de batalla.'
    },
    {
        name: 'Farah "Sombra" Haddad',
        bio: 'Ladrona profesional que domina la evasión. Conoce todos los escondites y rutas alternativas.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Farah',
        hp: 92,
        injuries: [],
        mentalState: 'Alerta a cualquier destello de movimiento.'
    },
    {
        name: 'Gael "Runo" Ibarra',
        bio: 'Programador que convirtió drones agrícolas en centinelas personales. Observa el terreno desde el aire.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gael',
        hp: 88,
        injuries: [],
        mentalState: 'Analítico, evaluando rutas óptimas.'
    },
    {
        name: 'Helena "Valkiria" Torres',
        bio: 'Bombera que sobrevivió a incendios masivos. Conoce el comportamiento del fuego mejor que nadie.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Helena',
        hp: 110,
        injuries: [],
        mentalState: 'Determinada, con sangre fría.'
    },
    {
        name: 'Iñaki "Eco" Larrea',
        bio: 'Guía de montaña y paramédico. Tiene habilidades de supervivencia y una ética protectora arraigada.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Inaki',
        hp: 105,
        injuries: [],
        mentalState: 'Empático, pendiente de los demás.'
    },
    {
        name: 'Jimena "Ráfaga" Galván',
        bio: 'Piloto de rally que ama la velocidad extrema. Sus maniobras sorprenden a cualquiera.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jimena',
        hp: 100,
        injuries: [],
        mentalState: 'Acelerada, buscando nuevas rutas.'
    },
    {
        name: 'Koji "Niebla" Tanaka',
        bio: 'Botánico experto en toxinas y antídotos. Lleva un herbario portátil con sorpresas.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Koji',
        hp: 96,
        injuries: [],
        mentalState: 'Curioso, clasificando plantas mentales.'
    },
    {
        name: 'Luna "Hex" Fernández',
        bio: 'Streamer de juegos de terror que disfruta planear trampas psicológicas para su audiencia.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
        hp: 94,
        injuries: [],
        mentalState: 'Juguetona, pensando en la narrativa perfecta.'
    },
    {
        name: 'Matías "Ancla" Roldán',
        bio: 'Pescador de aguas profundas con fuerza descomunal y paciencia infinita.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Matias',
        hp: 120,
        injuries: [],
        mentalState: 'Tranquilo, respirando al ritmo del oleaje.'
    },
    {
        name: 'Nadia "Pulse" Karim',
        bio: 'Doctora de urgencias que improvisa quirófanos con recursos mínimos. Nunca abandona a un aliado.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nadia',
        hp: 102,
        injuries: [],
        mentalState: 'Empática, buscando a quién ayudar.'
    },
    {
        name: 'Octavio "Mirlo" Solís',
        bio: 'Cartógrafo que dibuja el terreno en segundos. Lee el paisaje como si fuera música.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Octavio',
        hp: 98,
        injuries: [],
        mentalState: 'Concentrado en los contornos del mapa.'
    },
    {
        name: 'Paula "Fénix" Rivero',
        bio: 'Sobreviviente de un desastre natural. Transformó la adversidad en resiliencia inquebrantable.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Paula',
        hp: 108,
        injuries: [],
        mentalState: 'Optimista, recordando su renacer.'
    },
    {
        name: 'Quintín "Ajedrez" Paredes',
        bio: 'Gran maestro de ajedrez obsesionado con la estrategia. Cada combate es una partida perfecta.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Quintin',
        hp: 90,
        injuries: [],
        mentalState: 'Calculador, visualizando jugadas futuras.'
    },
    {
        name: 'Renata "Puma" Andrade',
        bio: 'Atleta de parkour con reflejos felinos. Domina el terreno urbano y natural por igual.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Renata',
        hp: 99,
        injuries: [],
        mentalState: 'Impaciente por lanzarse a correr.'
    },
    {
        name: 'Said "Oráculo" Rahman',
        bio: 'Psicólogo criminal que predice decisiones bajo presión. Entiende el miedo mejor que nadie.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Said',
        hp: 97,
        injuries: [],
        mentalState: 'Sereno, leyendo el lenguaje corporal ajeno.'
    },
    {
        name: 'Tamara "Relámpago" Küster',
        bio: 'Esgrimista olímpica que persigue la perfección en cada golpe. Ambiciosa hasta la médula.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tamara',
        hp: 101,
        injuries: [],
        mentalState: 'Firme, repasando sus técnicas.'
    },
    {
        name: 'Ulises "Crux" Mendoza',
        bio: 'Ex sacerdote convertido en estratega táctico. Mezcla calma espiritual con disciplina militar.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ulises',
        hp: 104,
        injuries: [],
        mentalState: 'Meditativo, murmurando plegarias.'
    },
    {
        name: 'Vera "Tempestad" Kuznetsova',
        bio: 'Meteoróloga que predice tormentas al detalle. Usa el clima como arma.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vera',
        hp: 93,
        injuries: [],
        mentalState: 'Entusiasmada por los cambios atmosféricos.'
    },
    {
        name: 'Wendy "Aurora" Campos',
        bio: 'Ilusionista que manipula la percepción con trucos de luces. Su espectáculo ahora es mortal.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Wendy',
        hp: 92,
        injuries: [],
        mentalState: 'Enigmática, practicando nuevos engaños.'
    },
    {
        name: 'Ximena "Torque" Vidal',
        bio: 'Mecánica especializada en vehículos pesados. Puede convertir chatarra en un monstruo rodante.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ximena',
        hp: 107,
        injuries: [],
        mentalState: 'Confiada, ajustando imaginarios tornillos.'
    },
    {
        name: 'Yago "Astilla" Moret',
        bio: 'Carpintero de supervivencia que fabrica herramientas en minutos. Cree que la madera habla.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yago',
        hp: 99,
        injuries: [],
        mentalState: 'Sereno, escuchando el entorno.'
    },
    {
        name: 'Zara "Bruma" Delgado',
        bio: 'Contrabandista que domina rutas clandestinas y contactos en cada puerto.',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zara',
        hp: 100,
        injuries: [],
        mentalState: 'Pragmática, calculando riesgos.'
    }
];

class BattleRoyaleSimulator {
    constructor() {
        this.players = [];
        this.round = 0;
        this.apiKey = '';
        this.gameRunning = false;
        this.eventTimer = null;
        this.events = [];
        this.delaySeconds = 8;

        this.cacheDom();
        this.registerEventListeners();
        this.loadDefaultPlayers();
        this.updateDisplay();
    }

    cacheDom() {
        this.playersListEl = document.getElementById('playersList');
        this.eventsLogEl = document.getElementById('eventsLog');
        this.roundNumberEl = document.getElementById('roundNumber');
        this.playersAliveEl = document.getElementById('playersAlive');
        this.playersInjuredEl = document.getElementById('playersInjured');
        this.playersDeadEl = document.getElementById('playersDead');
        this.eventDelayInput = document.getElementById('eventDelay');
        this.eventDelayLabel = document.getElementById('eventDelayLabel');
        this.apiKeyInput = document.getElementById('apiKey');
        this.configModal = document.getElementById('configModal');
        this.playerModal = document.getElementById('playerModal');
        this.playersConfigInput = document.getElementById('playersConfig');
        this.configErrorEl = document.getElementById('configError');
    }

    registerEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('pauseGame').addEventListener('click', () => this.togglePause());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
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

        this.eventDelayInput.addEventListener('input', () => {
            this.delaySeconds = Number(this.eventDelayInput.value);
            this.eventDelayLabel.textContent = `${this.delaySeconds} s`;
            if (this.gameRunning) {
                this.scheduleNextEvent(true);
            }
        });
    }

    loadDefaultPlayers() {
        this.players = DEFAULT_PLAYERS.map((player, index) => ({
            id: index + 1,
            ...JSON.parse(JSON.stringify(player)),
            status: 'alive',
            roundEliminated: null
        }));
        this.playersConfigInput.value = JSON.stringify(DEFAULT_PLAYERS, null, 2);
    }

    startGame() {
        if (this.gameRunning) return;
        this.apiKey = this.apiKeyInput.value.trim();
        if (!this.apiKey) {
            alert('Introduce tu clave de API de OpenAI para comenzar la simulación.');
            return;
        }
        this.gameRunning = true;
        this.round = 0;
        this.events = [];
        this.updateDisplay();
        this.addEvent('La arena se activa. 24 combatientes entran en juego.');
        this.scheduleNextEvent();
        document.getElementById('startGame').disabled = true;
        document.getElementById('pauseGame').disabled = false;
        this.apiKeyInput.disabled = true;
    }

    togglePause() {
        if (!this.gameRunning) return;
        if (this.eventTimer) {
            clearTimeout(this.eventTimer);
            this.eventTimer = null;
            document.getElementById('pauseGame').textContent = 'Reanudar';
        } else {
            document.getElementById('pauseGame').textContent = 'Pausar';
            this.scheduleNextEvent();
        }
    }

    resetGame() {
        this.stopTimer();
        this.gameRunning = false;
        this.round = 0;
        this.events = [];
        this.loadDefaultPlayers();
        this.updateDisplay();
        this.apiKeyInput.disabled = false;
        this.apiKeyInput.value = '';
        document.getElementById('startGame').disabled = false;
        document.getElementById('pauseGame').disabled = true;
        document.getElementById('pauseGame').textContent = 'Pausar';
    }

    scheduleNextEvent(reschedule = false) {
        if (reschedule && this.eventTimer) {
            clearTimeout(this.eventTimer);
        }
        this.eventTimer = setTimeout(() => this.runEventTurn(), this.delaySeconds * 1000);
    }

    stopTimer() {
        if (this.eventTimer) {
            clearTimeout(this.eventTimer);
            this.eventTimer = null;
        }
    }

    async runEventTurn() {
        if (!this.gameRunning) return;
        this.round += 1;

        const alivePlayers = this.players.filter(player => player.status === 'alive');
        if (alivePlayers.length <= 1) {
            this.finishGame();
            return;
        }

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
        if (this.checkForWinner()) {
            return;
        }
        if (this.gameRunning) {
            this.scheduleNextEvent();
        }
    }

    async generateEvent() {
        const alivePlayers = this.players.filter(player => player.status === 'alive');
        const injuredPlayers = this.players.filter(player => player.status === 'injured');

        const rosterSummary = alivePlayers
            .map(player => `${player.name} (${player.hp} HP, lesiones: ${player.injuries.length ? player.injuries.join(', ') : 'ninguna'}, mental: ${player.mentalState})`)
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
            victim.mentalState = this.pickRandom([
                'Tenso pero decidido.',
                'Furioso por la emboscada.',
                'Ansioso, necesita reagruparse.',
                'Sarcástico para ocultar el dolor.'
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
        player.mentalState = 'Sin vida.';
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

    renderPlayers() {
        if (!this.playersListEl) return;
        this.playersListEl.innerHTML = '';
        this.players.forEach(player => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `player-card status-${player.status}`;
            const hpPercent = Math.round((Math.max(Math.min(player.hp, 120), 0) / 120) * 100);
            card.innerHTML = `
                <div class="player-identity">
                    <img src="${player.image}" alt="Avatar de ${player.name}" loading="lazy" />
                    <div>
                        <h3>${player.name}</h3>
                        <p class="player-bio">${player.bio}</p>
                    </div>
                </div>
                <div class="player-stats-compact">
                    <div class="hp-bar">
                        <div class="hp-fill" style="width: ${hpPercent}%;"></div>
                    </div>
                    <div class="status-line">
                        <span>${player.hp} HP</span>
                        <span>${player.status === 'dead' ? 'Eliminado' : player.status === 'injured' ? 'Herido' : 'Activo'}</span>
                    </div>
                    <div class="mental-line">${player.mentalState}</div>
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
        document.getElementById('modalPlayerHP').textContent = `${player.hp} HP`;
        document.getElementById('modalPlayerInjuries').textContent = player.injuries.length
            ? player.injuries.join(', ')
            : 'Sin lesiones registradas.';
        document.getElementById('modalPlayerMental').textContent = player.mentalState;
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
            if (!Array.isArray(parsed) || parsed.length !== 24) {
                throw new Error('Debe proporcionar exactamente 24 jugadores.');
            }
            this.players = parsed.map((entry, index) => ({
                id: index + 1,
                name: entry.name ?? `Jugador ${index + 1}`,
                bio: entry.bio ?? 'Sin biografía disponible.',
                image: entry.image ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(entry.name ?? `Player${index + 1}`)}`,
                hp: Number.isFinite(entry.hp) ? Math.max(0, Math.min(120, entry.hp)) : 100,
                injuries: Array.isArray(entry.injuries) ? entry.injuries.slice(0, 5) : [],
                mentalState: entry.mentalState ?? 'Enfocado en sobrevivir.',
                status: 'alive',
                roundEliminated: null
            }));
            this.hideModal(this.configModal);
            this.updateDisplay();
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
        this.stopTimer();
        const alivePlayers = this.players.filter(player => player.status === 'alive');
        if (alivePlayers.length === 1) {
            this.addEvent(`🏆 ${alivePlayers[0].name} es el ganador de la simulación.`);
        } else {
            this.addEvent('🔥 No queda nadie en pie. La arena reclama a todos los combatientes.');
        }
        this.gameRunning = false;
        document.getElementById('pauseGame').disabled = true;
        document.getElementById('pauseGame').textContent = 'Pausar';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BattleRoyaleSimulator();
});
