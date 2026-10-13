# COMBAT_DESIGN — Combate y PachaShift

## Controles de trabajo
WASD o flechas mover; Espacio/J disparar; Shift/K PachaShift cuando energía está lista; Esc pausa. Móvil posterior con pad táctil y botones grandes.

## Estados
Partida: intro → ruta → jefe → victoria/derrota → restauración/desbloqueo. PachaShift: CHARGING → READY → SLOW_MOTION → RELEASE → RECOVERY → CHARGING. Bloquear reentradas; pausa congela temporizadores relevantes; al morir jefe durante RELEASE completar resolución antes de victoria; capturados no dañan a Kipu.

## PachaShift REVERSE — valores tentativos para probar
Activación consume medidor cargado mediante aciertos o recolección, NO por recibir daño. Durante **0,8 s reales** el mundo avanza al **20 %**, Kipu al **100 %**. Campo de radio inicial **28 px**; hasta **6 proyectiles capturables** por activación. Kipu debe moverse para interceptar; los capturados quedan suspendidos/orbitando y son inofensivos. Al terminar, retornan automáticamente como proyectiles aliados al origen/jefe. Los ataques no capturables (contactos/ondas) siguen peligrosos. Una ventana sin capturas debe tener señal clara; el costo/no devolución se prueba. Periodo de recuperación para evitar spam.

## Secuencia WOW exacta
Amaru anticipa ráfaga abrumadora; medidor brilla → jugador pulsa Shift → audio se amortigua, paleta cambia de mundo andino a LCD verde, enemigos se ralentizan → el jugador se desplaza libremente e intercepta rombos con anillo → capturas orbitan y dejan de ser peligros → termina 0,8s, vuelve color/velocidad y se devuelven rayos → escudo se fractura, onda de color recupera parte de escenario → continúa combate, no cinemática larga.

## Amaru-01
Fase 1 aprendizaje: tres pulsos claros, esquivar, disparar. Fase 2 estratégica: bucles repetidos, ataques capturables que introducen Reverse y escudo vulnerable a devolución. Fase 3 final a salud baja: ráfagas, onda no capturable y ventana de vulnerabilidad. **Fases basadas en salud/eventos, nunca en tiempos fijos de guion.** Meta ilustrativa: jugador 4 vidas, jefe 100 HP, invulnerabilidad tras daño 1,1s, proyectiles 165px/s; se balancea.

## Riesgos
Excesivo poder de captura: limitar radio, energía, seis capturas, tipos. Demasiada dificultad: telegráficos y tutorial contextual. Confusión visual: rombos capturables vs peligros de otras formas, no confiar solo en color. Bugs de tiempo: separar reloj real/UI de escala del mundo. Repetición: alternar patrones y ventanas de contraataque. Escala 320×180: hitboxes más pequeñas que adornos. Validar todo con jugadores.
