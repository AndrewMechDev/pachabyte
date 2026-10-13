# ASSET_PIPELINE — Intercambio obligatorio con otro chat

Cada vez que el agente necesite un asset que no exista debe entregar al usuario un **Asset Request** según plantilla. El usuario llevará el prompt y la lámina visual aprobada a otro chat, generará una propuesta y la devolverá. El agente debe inspeccionar el archivo devuelto, no asumir que el resultado coincide.

## Pasos
1. Identificar ID, propósito, prioridad, estado y dependencia.
2. Consultar ART_BIBLE/CHARACTERS y pedir que se adjunte lámina aprobada de Kipu/Amaru.
3. Redactar prompt autónomo: descripción, vista, paleta, medidas **nativas exactas**, número de frames, transparencia, pivote, escala y lo que NO debe aparecer.
4. Informar si se pide **concept art** o **asset final**; no mezclarlos. Adjuntar checklist.
5. Continuar solo con código independiente o placeholder claramente temporal.
6. Al recibir arte: verificar existencia, dimensiones, alfa genuina, contenido dentro del canvas, alineación, coherencia entre frames, legibilidad a 1×, derechos/licencias.
7. Pedir corrección si falla. Registrar `requested → review → approved → integrated → verified`.

## Prohibiciones
No tratar sprites ilustrados grandes como spritesheets finales. No afirmar “PNG exactamente 16×20 con alfa” sin inspección; en el chat anterior se obtuvo arte de gran tamaño en una solicitud de 16×20, no conformidad técnica comprobada. No recortar una lámina con fondos y dar por terminados frames. No variar silueta/colores aprobados por capricho. No replicar mascotas oficiales de tecnologías ni íconos comerciales sin revisar permiso.

## IDs sugeridos
`KIPU_IDLE`, `KIPU_SHOOT`, `KIPU_SHIFT`, `AMARU_HEAD`, `AMARU_SEGMENT`, `AMARU_RESTORED`, `BUG_GLITCHLING`, `FX_REVERSE`, `FX_SHIFT_RING`, `BG_AREQUIPA`, `UI_HUD`. Registrar nombre, archivo, ruta, versión, autor/origen, licencia, tamaño, pivote y tests.
