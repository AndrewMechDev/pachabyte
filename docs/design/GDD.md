# GDD — Documento de diseño jugable v1

## Género, plataforma y público
Arcade de acción y disparos 2D horizontal, single player, web (Phaser + TS + Vite), resolución lógica 320×180. Controles accesibles a novatos; referencias opcionales a programación para quien reconoce conceptos. Ritmo rápido y replayability con score.

## Bucle central
Entrar a ruta → avanzar lateralmente → combatir pequeños bugs y esquivar obstáculos → recolectar fragmentos → evitar corrupción creciente en segmentos especiales → arena de jefe → aprender patrón → activar PachaShift, captar y devolver proyectiles → liberar guardián → restablecer nodo/colores → score/Códice/nueva ruta.

## Interacciones
Kipu flota y se mueve libremente dentro de pantalla; dispara pulsos. Enemigos menores intentan alcanzarlo o atacar de lejos. Obstáculos introducen decisiones, no exámenes. Fragmentos recompensan riesgo y ayudan a recarga/score. En ciertas rutas, la Marea del Desfase avanza desde la izquierda y puede obligar a elegir entre recoger más o escapar. Los jefes mezclan proyectiles capturables y amenazas que hay que esquivar.

## Obstáculos temáticos (biblioteca de ideas, pendientes de prototipo)
Firewall: barrera y filtrado; Deadlock: mecanismos mutuamente bloqueados; Memory Leak: zona que drena recursos; Infinite Loop: sección que se repite hasta cambiar regla; Packet Loss: camino/objetos intermitentes telegrafiados; Glitch Zone: interferencia temporal. Metáforas tecnológicas, no simulación escolar. MVP solo uno fácil de entender.

## Score
Puntos por fragmentos, bugs superados, devoluciones y eficiencia. **Fórmula ilustrativa no aprobada:** `100 × fragmentos + 75 × bugs + 200 × devoluciones + 10 × max(0, 300 − segundos)`. Evaluar exploits, bonificación por supervivencia y rango C/B/A/S solo con pruebas; no convertirlo en regla final por inercia. HUD: vida, energía PachaShift, puntuación y vida del jefe.

## Progresión
Liberación cambia estado del nodo y abre conexión. Códice opcional registra cultura real con fuentes y conceptos de tecnología relacionados con guardianes. REVERSE disponible durante primer jefe; LOOP de Amaru como descubrimiento/desbloqueo futuro. Guardianes futuros pueden habilitar PARALLEL, GUARD y otras habilidades, pero no se desarrollan en MVP.

## Accesibilidad
Telegráficos y formas distinguibles aun con paleta verde; controles claros; evitar flashes intensos, movimientos de cámara extremos y textos largos. Pausa, reinicio y tutorial visual integrado.

## MVP
Ruta Arequipa de 3–5 min objetivo (no cronómetro forzado), una especie de bug, un obstáculo, fragmentos, score sencillo, presión limitada si cabe, Amaru 3 fases, PachaShift Reverse, restauración y resultado. Ampliación posterior a múltiples ciudades.
