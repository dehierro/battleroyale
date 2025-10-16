# Simulador Battle Royale

Aplicación web de una simulación estilo battle royale que narra la partida de forma automática con ayuda de modelos de OpenAI. Veinticuatro combatientes completamente configurables avanzan ronda a ronda, sufren lesiones, experimentan cambios emocionales y pueden caer en el combate.

## Características principales

- ✅ 24 personajes con nombre, avatar, puntos de vida, estado mental y biografía.
- ✅ Generación automática de eventos narrativos por ronda usando la API de OpenAI (modelo `gpt-4o-mini`).
- ✅ Sistema de turnos totalmente automático con control de velocidad y opción de pausa.
- ✅ Editor JSON para personalizar rápidamente la lista completa de jugadores (nombre, imagen, HP, bio y estado).
- ✅ Registro visual de eventos recientes y panel de estado para cada participante.
- ✅ Fase de inicialización que genera retratos pixel art medievales mediante la API de imágenes de OpenAI.
- ✅ Eventos alternativos de respaldo cuando la llamada a la API falle.

## Cómo usarlo

1. Ejecuta `npm start` para levantar el servidor local incluido en el proyecto.
2. Abre `http://localhost:3000` en un navegador moderno.
3. Introduce tu clave de API de OpenAI en el campo correspondiente.
4. Pulsa **Inicializar historia** para preparar los retratos pixel art de los participantes. Este paso descarga o genera las imágenes en `images/players_pixelart`.
5. (Opcional) Pulsa **Configurar jugadores** para editar la lista inicial de combatientes en formato JSON.
6. Pulsa **Comenzar simulación** y observa la narración automática. Puedes pausar/reanudar la simulación o reiniciarla en cualquier momento.

> **Nota:** La aplicación necesita una clave válida de OpenAI para generar narrativas dinámicas. Si no se puede contactar con la API, el sistema mostrará eventos de respaldo y continuará la simulación.

## Desarrollo local

No es necesario un entorno de compilación, pero se incluye un servidor Node.js para facilitar la escritura de imágenes generadas:

```bash
npm start
```

El servidor queda disponible en `http://localhost:3000` y expone el endpoint `/api/pixel-art` que guarda los retratos en `images/players_pixelart`.

## Arquitectura de archivos

- `index.html`: estructura de la interfaz.
- `style.css`: estilos y diseño responsivo.
- `script.js`: lógica de simulación, integración con OpenAI y controles de UI.
- `server.js`: servidor estático con endpoint para almacenar los retratos pixel art generados.
