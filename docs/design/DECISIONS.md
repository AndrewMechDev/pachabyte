# Estado de decisiones — versionado de canon

## Confirmado explícitamente
- PachaByte, arcade lateral con desplazamiento, disparos, bugs, obstáculos y jefes; Kipu protagonista **original**, pequeño, turquesa y dorado.
- Las inspiraciones son Space Impact, Cuphead, Hollow Knight; incorporamos Treasure Towers para peligros, puntuación, objetos y urgencia, sin copiar.
- Retroandino híbrido con transición temporal a verde Nokia en PachaShift; mantener referencia aprobada de Kipu/Amaru.
- PachaShift: tiempo ralentizado + movimiento libre del jugador + interceptación y devolución de proyectiles.
- Guardianes tecnológicos peruanizados, al vencerlos son **liberados, no asesinados**; restauran y protegen sus rutas/nodos.
- Mundo inspirado en ciudades del Perú, con nodos y rutas; Arequipa como inicio, Amaru-01 primer jefe; bugs atacan a Kipu durante recorridos.
- Incorporar obstáculos, fragmentos, score, y presión ambiental inspirada en Treasure Towers. La **Marea del Desfase** es nuestra reinterpretación de ruta, no inundación literal.
- Si falta un asset, el agente prepara prompt y espera que el usuario lo genere en un chat de arte.

## Canon de trabajo, pero con detalles abiertos
- Trama de Pacha conecta regiones en un Perú alternativo; El Desfase corrompe sus rutas y guardianes; la liberación restaura color y conexión.
- Kipu nació de una conexión incompleta: origen preciso no fijado.
- Códice opcional muestra descubrimientos de tecnología y cultura contextualizados.

## Provisional/hipótesis
- Arequipa, Lima, Trujillo, Cusco, Puno e Iquitos como lugares candidatos: orden y responsables NO aprobados.
- Wisk'a (Go), Kallpa (Rust), Nina (Java), Kinti (Flutter), Qhapaq (Docker), Yaku (PHP), Ñan (Git): perfiles y poderes tentativos.
- Glitchlings, Corruptores y Sombras de Error: nombres de categorías tentativos.
- PachaShift 0,8 s reales, mundo 20 %, captura radio 28px y límite 6; requieren pruebas.
- Kipu cuerpo 32×32/celda 48×48; Amaru cabeza 48×48 y cuerpo modular; el experimento 16×20 NO modificó automáticamente la escala principal.
- Fórmula de score, ranks C/B/A/S y penalizaciones: sin validación de balance.
- Guion, diálogo, Códice, composición del mapa, la ruta de Marea y antagonista final: pendientes de aprobación.

## Inconsistencias resueltas
Antes se sugirió que Amaru daba REVERSE o LOOP. Convención de trabajo coherente: **REVERSE despierta durante combate**, Amaru liberado entrega **LOOP** como fragmento/descubrimiento; no prometer LOOP jugable en MVP si no existe. Se exploró SVG/3D; estilo aprobado sigue siendo pixel art 2D y animación modular. Los tiempos narrativos de fase no deben ser triggers rígidos.

## Preguntas abiertas prioritarias
¿Qué causó El Desfase: protección fallida o actor consciente? ¿Cuál es la verdad del nacimiento de Kipu y el “último fragmento”? ¿Cuál es el final? ¿Orden real de ciudades y asignaciones de guardianes? ¿Daño/corrupción/checkpoints y ranking final? ¿Reglas oficiales del hackathon sobre IA, trabajo previo, derechos y entrega?


## Decisiones del 13-10-2026 (primer playtest del usuario)
- **Balance de Amaru fase 2:** los valores tentativos de PachaShift se ajustan por playtest (radio de captura 40 px, cámara lenta 1,2 s, reembolso de medidor si no hay capturas, ventana de vulnerabilidad 6,5 s) y se añaden pistas contextuales y checkpoints por fase.
- **Aprobado por el usuario (mecánicas nuevas, no estaban en el canon):** *Ráfaga de la Trama* (objeto temporal de disparo triple y rápido), *Escudo* (absorbe un golpe) y *Corazón* (+1 de vida), raros en la ruta.
- **Bugs del MVP ampliados:** se implementan **Corruptor** (dispara de lejos, lento) y **Sombra de Error** (al morir se divide en dos menores), ya listados en CHARACTERS.md. Cada contacto o disparo quita un solo corazón con invulnerabilidad.
- **Racha (combo):** aciertos seguidos sin recibir daño multiplican la puntuación ×1 a ×4; recibir daño la reinicia. Encaja con "puntuación por eficiencia"; la fórmula sigue siendo provisional.
- **Guardianes inspirados en lenguajes:** se mantiene la regla de CHARACTERS.md: guardianes originales andinos con rasgos tecnológicos, sin reproducir mascotas ni logos oficiales. Estado corrupto → restaurado aplica a cada guardián.

## Ajustes de balance, ronda 2 (playtest 13-10-2026)
Veredicto del playtest en vivo: divertido, Amaru vencible pero caro, ruta larga y dura. Valores tentativos, reunidos en `src/game/balanceRules.ts` y a revisar con el siguiente playtest; el objetivo es que un jugador casual llegue sano a Amaru y lo venza en unos 2-3 minutos.
- **Umbral que restaura:** al empezar el umbral Kipu recupera 1 corazón (máx. 4) y el medidor de REVERSE sube al menos a 60; aviso "EL UMBRAL TE RESTAURA". Ambos valores pasan al combate.
- **Corazón extra en la ruta:** un segundo Corazón tras la zona de Memory Leak (unos 72 s), fuera de toda huella de peligros; nunca más de 2 Corazones en pantalla.
- **Ráfaga de la Trama:** dura 9 s (antes 6 s) y cada disparo de la Ráfaga hace 2 de daño a los bugs y a Amaru (antes 1). El escudo de Amaru sigue desviando disparos normales y de Ráfaga sin romperse; la racha sigue contando un acierto por disparo.
- **Amaru más llano:** 80 PV (antes 100); las fases salen de fracciones de su máximo (fase 2 a 2/3: PV 53; fase 3 a 1/3: PV 26). Kipu entra al combate con al menos 3 corazones y un Escudo ya activo (nunca dos); al empezar la fase 3 cae además un Corazón extra (se suman al Corazón de la fase 2 y al Escudo de la fase 3).
- **Racha contra Amaru:** con racha ×3 o ×4 cada acierto sobre Amaru carga REVERSE +25 (antes +15), para que REVERSE vuelva antes. Los golpes normales a Amaru siguen sin dar puntaje.
