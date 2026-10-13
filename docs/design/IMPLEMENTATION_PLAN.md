# IMPLEMENTATION_PLAN — Roadmap Superpowers

**Stack objetivo:** Phaser + TypeScript + Vite, navegador, resolución lógica 320×180, nearest-neighbor. Verificar que la sesión Work realmente creó/buildó archivos; no inventar estado.

1. **Sprint 0 (fundación):** proyecto ejecutable, escena, controles WASD/flechas, disparar, límites y placeholders. README PowerShell. **Aceptar:** build y ejecución verificados.
2. **Sprint 1 (ruta):** fondo parallax mínimo, una especie de bug, colisiones, vida/derrota, fragmento y score, un obstáculo. **Aceptar:** ruta jugable y reinicio sin error.
3. **Sprint 2 (PachaShift):** CHARGING/READY/SLOW/RELEASE/RECOVERY, tiempos separados para mundo y jugador, captura por radio, devolución, cambio LCD. **Aceptar:** tecla activa solo lista, movimiento libre, proyectiles no dañan tras captura, pausa correcta.
4. **Sprint 3 (Amaru):** módulos reutilizables, 3 fases basadas en salud/eventos, ataques telegrafiados, escudo fracturable, liberación. **Aceptar:** jefe vencible/reintentable y retorno a guardián tras victoria.
5. **Sprint 4 (arte):** generar asset requests al usuario, integrar sprites verificados de Kipu y Amaru, escenario, HUD, sonidos, PachaShift, accesibilidad y rendimiento. **Aceptar:** 320×180 legible y assets legítimos/consistentes.
6. **Sprint 5 (si viable):** Marea del Desfase corta, más obstáculos, score por eficiencia y mapa de nodos simplificado. No sacrificar MVP por exceso de contenido.
7. **Posterior:** ciudades adicionales, guardianes, LOOP/PARALLEL/GUARD, Códice expandido, PWA, clasificaciones, más rutas.

## Criterios transversales
Pruebas de build y jugabilidad, colisiones, temporizadores, score no explotable, HUD comprensible, legibilidad monocromática, fps estables, interfaz responsive, licencia, fuentes culturales y reglas del evento comprobadas. Playtest con jugador que no programa y otro que sí; medir comprensión de PachaShift, satisfacción del momento WOW, controles y dificultad. Documentar resultados reales y pendientes.
