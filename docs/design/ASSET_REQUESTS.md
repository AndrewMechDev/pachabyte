# Asset requests pendientes (Ruta 01)

Estado de cada pedido: `requested → review → approved → integrated → verified`. Mientras no llegue el asset, el juego usa un **placeholder procedural** etiquetado en el código. Adjunta siempre la lámina aprobada `assets/references/pachabyte-phase3-concept.png` en el chat de arte.

Nota técnica: la fuente puede ser más grande que el tamaño nativo. El proyecto la adapta con nearest-neighbor y alfa binaria (ver `docs/ART_BIBLE.md`). Lo importante es silueta legible, fondo realmente transparente y nada recortado.

| Prioridad | ID | Uso | Estado |
|---|---|---|---|
| 1 | `BUG_GLITCHLING` | Enemigo de la ruta | requested |
| 2 | `AMARU_SEGMENT`, `AMARU_TAIL`, `AMARU_CORE` | Cuerpo modular del jefe | requested |
| 3 | `AMARU_RESTORED` | Cabeza serena tras la liberación | requested |
| 4 | `KIPU_SHOOT`, `KIPU_SHIFT` | Frames de disparo y PachaShift | requested (opcional para MVP) |

---

## 1. BUG_GLITCHLING

**Objetivo jugable:** enemigo pequeño que persigue a Kipu en la ruta de Arequipa; muere con dos disparos.
**Estado:** sprite final. **Orientación:** mirando a la IZQUIERDA (entra por la derecha).
**Tamaño nativo:** 16×16 por frame, 4 frames en una tira horizontal de 64×16, sin padding. Pivote al centro (8,8). Hitbox ~10×10 centrada.
**Exclusiones:** sin texto, sin fondo, sin sombras proyectadas, sin parecerse a Kipu ni a mascotas o logos existentes.

> Proyecto PachaByte: usa la imagen aprobada ADJUNTA solo como referencia de estilo y paleta. Necesito un sprite final de un enemigo pequeño llamado Glitchling para un arcade 2D de 320×180 en pixel art retro andino híbrido. Es un error digital vivo: cuerpo compacto y anguloso de base morada (#8759AD) con bordes oscuros, un único ojo o núcleo brillante, y fragmentos de píxeles desplazados que sugieren interferencia (glitch). Silueta claramente distinta de Kipu (Kipu es redondo, turquesa y con antenas doradas) y que se reconozca aunque la pantalla esté en verde monocromo, es decir, por forma y no solo por color. Mira hacia la izquierda. Crea una tira horizontal de 4 frames de 16×16 píxeles nativos cada uno (64×16 en total), animación de flotar/vibrar en bucle, con el mismo pivote central en todos los frames, sobre fondo PNG realmente transparente. No añadas texto, logos, armas, fondo ni sombras. No copies obras o mascotas ajenas. Si no puedes garantizar el tamaño nativo y la transparencia reales, dilo explícitamente y entrega solo una propuesta visual a mayor tamaño.

## 2. AMARU_SEGMENT, AMARU_TAIL, AMARU_CORE

**Objetivo jugable:** cuerpo modular serpentino que sigue a la cabeza existente (`assets/prepared/amaru-head-v1-64x64.png`).
**Tamaño nativo:** segmento 24×24 (1 frame), cola 32×32 (1 frame, apuntando a la DERECHA porque la cabeza mira a la izquierda), núcleo 16×16 (2 frames de brillo, tira 32×16). Pivotes al centro.
**Exclusiones:** sin cabeza, sin fondo, sin efectos fuera de la silueta.

> Proyecto PachaByte: usa la lámina aprobada ADJUNTA como referencia obligatoria de Amaru-01. Necesito tres módulos sueltos del cuerpo de Amaru-01 para un arcade 2D de 320×180 en pixel art: (1) un segmento de cuerpo de 24×24 píxeles nativos con escamas turquesa, anillo dorado y una gema morada, visto de perfil; (2) una cola de 32×32 apuntando hacia la derecha, con el mismo estilo; (3) un núcleo brillante de 16×16 en dos frames (tira horizontal de 32×16) con brillo violeta pulsante. Conserva exactamente la paleta y el estilo de escamas de la lámina, contorno oscuro, clusters de píxeles intencionales y fondo PNG realmente transparente. Cada módulo en su propio archivo, centrado y sin recortes. No añadas la cabeza, texto, fondo, sombras ni brillos fuera de la silueta. No copies obras ajenas. Si no puedes garantizar tamaño nativo y transparencia reales, dilo y entrega solo una propuesta visual.

## 3. AMARU_RESTORED

**Objetivo jugable:** cabeza de Amaru en estado sereno, mostrada al liberarlo. Sustituye a la mezcla por código actual.
**Tamaño nativo:** 64×64, 1 frame, misma orientación (mirando a la IZQUIERDA), misma proporción y posición del ojo que `amaru-head-v1-64x64.png` para poder hacer un fundido entre ambas.

> Proyecto PachaByte: usa la lámina aprobada ADJUNTA (panel "RESTAURADA") y la cabeza actual de Amaru-01 como referencia. Necesito la cabeza de Amaru-01 en estado RESTAURADO y sereno: misma silueta, cuernos dorados y escamas turquesa, mirando a la izquierda, pero con la boca cerrada o apenas entreabierta, ojo calmado sin brillo violeta y sin ninguna corrupción morada. Debe superponerse exactamente sobre la cabeza actual (mismo encuadre y posición del ojo) para un fundido de corrupto a restaurado. 64×64 píxeles nativos, PNG con fondo realmente transparente. Sin texto, fondo, sombras ni efectos. Si no puedes garantizar el tamaño nativo y la transparencia, dilo y entrega solo una propuesta visual.

## 4. KIPU_SHOOT, KIPU_SHIFT (opcional para MVP)

**Objetivo jugable:** frames de disparo y de activación de PachaShift de Kipu volando.
**Tamaño nativo:** 32×40 por frame (mismo marco que `assets/prepared/kipu-v4-32x40.png`), mirando a la DERECHA, 4 frames cada uno en tiras horizontales (128×40). Pivote igual al sprite actual; la fila inferior ocupada no debe moverse entre frames.

> Proyecto PachaByte: usa la lámina aprobada ADJUNTA (paneles "DISPARAR" y "PACHASHIFT ACTIVO") y el sprite actual de Kipu como referencia obligatoria. Necesito dos animaciones de Kipu flotando, mirando a la derecha: DISPARAR (4 frames) y PACHASHIFT (4 frames con un anillo turquesa de energía alrededor). Cada frame mide 32×40 píxeles nativos; entrega cada animación como tira horizontal de 128×40 con el mismo encuadre y pivote del sprite actual. Conserva cuerpo redondo turquesa, dos antenas con puntas doradas, ojos grandes, rombo dorado en el pecho y cinta turquesa/dorada. Sin piernas, ropa, armas, texto ni fondo; PNG realmente transparente. Si no puedes garantizar tamaño y transparencia reales, dilo y entrega solo una propuesta visual.
