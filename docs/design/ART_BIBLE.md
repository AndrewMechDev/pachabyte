# ART_BIBLE — Dirección retro andina híbrida

## Regla innegociable
Lámina de Kipu y Amaru reafirmada por usuario es referencia principal. Personajes 2D pixel-art, ricos en turquesa/oro con corrupción violeta, escenarios peruanos, modo LCD monocromático durante PachaShift. Inspiraciones Space Impact/Cuphead/Hollow Knight/Treasure Towers son abstractas: no usar sus recursos.

## Paleta inicial
Turquesa Kipu `#35B9AE`, verde oscuro `#173D32`, oro `#E7BD67`, menta LCD `#A5D6B0`, terracota `#C66D49`, morado Desfase `#8759AD`, marfil `#F1E5C5`. Ajustar sombras y contraste según necesidades, sin reemplazar esencia. Usar rojo y blanco peruano solo como acentos ocasionales si aportan, no convertir Kipu en una bandera.

## Kipu
Silueta flotante redondeada, dos antenas con puntas oro, ojos grandes expresivos, rombo dorado, cinta turquesa/dorada con motivos geométricos inventados inspirados en conexiones y quipus. No añadir piernas, ropa, armas ni alteraciones de anatomía. Cuerpo visible objetivo ~32×32 dentro de celda 48×48, sujeto a pruebas; hoja de vistas de frente/perfil/espalda como guía, no asset final. Prueba experimental 16×20 NO reemplaza escala aprobada. Animaciones: idle, mover, disparar, daño, Shift enter/captura, victoria; pivote constante. Cinta puede animarse aparte.

## Amaru-01
Jefe serpentino grande modular: cabeza expresiva ~48×48, cuello/cuerpo segmentos ~24×24, cola ~32×32, núcleo ~16×16 (tamaños tentativos). Turquesa, oro y escala morada de corrupción; modo restaurado sereno. Cabeza y cuerpo siguen trayectorias suavemente sin sacrificar el aspecto pixel. Telegráficos claros para ataques y escudo vulnerable. Producir módulos por separado, no una spritesheet rígida gigantesca.

## Escenario/efectos
Lienzo 320×180. Background por capas de parallax suave (volcán, arquitectura de sillar estilizada, suelo), con poco ruido visual sobre gameplay. Durante PachaShift el color va a verdes LCD; distinguir rombos capturables de peligros no capturables mediante siluetas, no solo color. Campo de captura correspondiente a radio real (~28px de ensayo), destellos cortos, nada de flashes agresivos. Sonidos breves originales/licenciados, nostalgia de botones Nokia sin copiar grabaciones.

## Exportación
PNG RGBA transparente, spritesheets con frames/celdas/pivotes uniformes, nearest-neighbor y escala entera cuando sea posible. SVG solo como fuente editable opcional; PNG nativo optimizado como resultado. **Generar una imagen de estilo pixel art no garantiza proporciones, verdadera transparencia ni 16×20 exactos.** Verificar siempre con inspección de archivo y prueba a 1×.
