# Simulador Battle Royale

Aplicación web de una simulación estilo battle royale que narra la partida de forma automática con ayuda de modelos de OpenAI. Veinticuatro combatientes completamente configurables avanzan ronda a ronda, sufren lesiones, experimentan cambios emocionales y pueden caer en el combate.

## Características principales

- ✅ 24 personajes con nombre, avatar, puntos de vida, estado mental y biografía.
- ✅ Generación automática de eventos narrativos por ronda usando la API de OpenAI (modelo `gpt-4o-mini`).
- ✅ Sistema de turnos totalmente automático con control de velocidad y opción de pausa.
- ✅ Editor JSON para personalizar rápidamente la lista completa de jugadores (nombre, imagen, HP, bio y estado).
- ✅ Registro visual de eventos recientes y panel de estado para cada participante.
- ✅ Eventos alternativos de respaldo cuando la llamada a la API falle.

## Cómo usarlo

1. Abre `index.html` en un navegador moderno.
2. Introduce tu clave de API de OpenAI en el campo correspondiente.
3. (Opcional) Pulsa **Configurar jugadores** para editar la lista inicial de combatientes en formato JSON.
4. Ajusta la velocidad de generación de eventos mediante el control deslizante.
5. Pulsa **Comenzar simulación** y observa la narración automática.
6. Puedes pausar/reanudar la simulación o reiniciarla en cualquier momento.

> **Nota:** La aplicación necesita una clave válida de OpenAI para generar narrativas dinámicas. Si no se puede contactar con la API, el sistema mostrará eventos de respaldo y continuará la simulación.

## Desarrollo local

No es necesario un entorno de compilación. Para servir los archivos con un servidor local:

```bash
python3 -m http.server 8000
```

Después visita `http://localhost:8000` en tu navegador.

## Arquitectura de archivos

- `index.html`: estructura de la interfaz.
- `style.css`: estilos y diseño responsivo.
- `script.js`: lógica de simulación, integración con OpenAI y controles de UI.
