# AGENTS.md — Política obligatoria para cualquier agente

## Trabajo
Leer `DECISIONS.md` y archivos aplicables antes de implementar. No reinterpretar unilateralmente la trama, los diseños, las ciudades ni las decisiones aprobadas. Distinguir datos implementados de propuestas. Usar metodología Superpowers como flujo: brainstorming → diseño validado → plan de pasos pequeños → ejecución → pruebas y verificación. Documentar decisiones nuevas.

## Premisa que NO puede perderse
PachaByte mezcla *principios generales*, no assets, de **Space Impact** (arcade lateral, controles simples, disparos, nostalgia Nokia), **Cuphead** (jefes expresivos y patrones telegráficos), **Hollow Knight** (atmósfera, misterio y narración ambiental) y **Treasure Towers** (obstáculos, recolección, score y presión del entorno). Propiedad original: mundo retroandino, Kipu, guardianes tecnológicos peruanizados, Trama de Pacha, Desfase, Marea y PachaShift. No replicar personajes, música, arte, diseños de niveles ni efectos distintivos de juegos ajenos.

## Si necesitas ilustraciones, sprites, fondos, audio, mapas, UI o animaciones
**AVISA AL USUARIO ANTES DE PRODUCIR O INTEGRAR UN ASSET DEFINITIVO.** Entrega un **ASSET REQUEST** completo siguiendo `ASSET_REQUEST_TEMPLATE.md`, con un prompt autónomo para otro chat, imagen aprobada que debe adjuntarse, aspecto, tamaño exacto, orientación, número de frames, pivotes, transparencias, restricciones y pruebas. El usuario generará el recurso y lo compartirá. Espera a recibirlo para integrarlo. Puedes seguir con placeholders anunciados o tareas independientes. Nunca presentes la ilustración conceptual como sprite 16×20 o spritesheet 48×48 sin verificar los bytes, resolución nativa y canal alfa.

## Reporte obligatorio tras cada tarea
- Completado realmente, archivos modificados y comandos ejecutados.
- Verificado con pruebas/build o limitaciones.
- Pendiente, riesgos y próximo paso.
- Assets bloqueantes y **prompt listo para copiar**, si aplica.
- Cambios propuestos que requieren autorización.

## Restricciones
Mantener 2D Phaser + TypeScript + Vite, resolución lógica 320×180, pixel art retro andino híbrido; 3D solo con nueva aprobación. No generar diez regiones ni un metroidvania completo para el MVP. No asumir licencia sobre mascotas/logos de lenguajes. La identidad peruana debe ser contextualizada e investigada; los motivos inventados no pueden venderse como símbolos históricos auténticos. La integración no debe depender de recordar otros chats: documentar cada decisión en estos archivos y compartir imágenes aprobadas.
