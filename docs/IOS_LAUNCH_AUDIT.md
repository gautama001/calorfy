# Calorfy: auditoría para lanzamiento iOS

Fecha de auditoría: 2026-07-20

## Veredicto

El producto es un prototipo funcional, no una candidata de lanzamiento. La arquitectura Expo/React Native permite mantener iOS y Android desde una base común, pero la rama actual no supera TypeScript, lint ni tests y contiene credenciales de servicios en el binario cliente. No debe enviarse todavía a TestFlight externo ni a revisión.

## Estado comprobado

| Área | Estado | Hallazgo |
| --- | --- | --- |
| Arquitectura | Amarillo | Expo Router y React Native son multiplataforma; solo existe el proyecto nativo Android, algo compatible con EAS/CNG pero que impide validar código nativo iOS localmente en Windows. |
| SDK | Rojo | Expo SDK 53 / React Native 0.79.2. La versión actual es SDK 57. La actualización debe hacerse por saltos y con pruebas en cada SDK. |
| TypeScript | Rojo | `tsc --noEmit` falla en navegación, tema, tipos de estado, componentes y símbolos iOS. |
| Lint | Rojo | No existe configuración ESLint; el intento de inicialización necesita descargar dependencias. |
| Tests | Rojo | Existe un único snapshot test y falla con React 19; no hay cobertura de flujos críticos. |
| Seguridad | Bloqueante | Claves de Clarifai, ImgBB y Edamam están embebidas en `upload.tsx`/`app.json`. Todo valor enviado en una app Expo es público. Deben revocarse y moverse detrás de un backend. |
| Autenticación | Bloqueante | Login y registro aceptan cualquier dato y navegan a la app; no existe cuenta real, sesión ni recuperación. |
| Privacidad | Bloqueante | Se suben fotos a ImgBB y luego a Clarifai sin consentimiento informado, política de privacidad ni control de retención/borrado. |
| iOS | Rojo | Faltaban bundle ID y descripciones de cámara/fotos; se agregó una base. Aún faltan credenciales Apple, builds EAS, TestFlight y metadatos. |
| UX/i18n | Rojo | Hay cadenas y emojis con encoding corrupto, mezcla de idiomas y fuentes no incluidas. |
| Funciones | Amarillo/Rojo | Registro local de comidas y metas existe. Recordatorios y pasos no son funciones reales. Las recetas de dietas están duplicadas y varias no corresponden a la dieta. |
| Datos | Amarillo | AsyncStorage sirve para MVP local, pero no hay esquema, migraciones, backups, sincronización ni borrado integral. |
| Accesibilidad | Rojo | Faltan labels/roles/hints, soporte de Dynamic Type verificado y pruebas de contraste/VoiceOver. |

## Cambios seguros realizados

- Nombre visible `Calorfy`, scheme `calorfy`, bundle ID iOS y build number inicial.
- Textos de permisos de cámara y fototeca para iOS.
- `.easignore` efectivo (el archivo anterior terminaba en `.txt`).
- Exclusión de archivos `.env` en Git y EAS. Esto no vuelve secretas las variables incluidas en el bundle: las claves deben residir en servidor.

## Plan de ejecución recomendado

### P0 — estabilizar y proteger

1. Revocar las tres credenciales expuestas y crear un backend/proxy mínimo con autenticación, rate limiting y validación.
2. Decidir el modelo de cuenta: cuenta real con borrado dentro de la app o eliminar login/signup para un MVP completamente local.
3. Corregir todos los errores TypeScript, montar correctamente el proveedor de tema y reparar navegación/rutas.
4. Reparar UTF-8 e internacionalización; definir español, inglés y portugués como locales completos o reducir idiomas para v1.
5. Configurar ESLint y tests deterministas; añadir pruebas de cálculo, persistencia, fallo de red y flujo foto → análisis → guardado.

### P1 — migrar plataforma

1. Crear una rama/copia limpia y actualizar SDK 53 → 54 → 55 → 56 → 57, ejecutando `expo install --fix`, `expo-doctor`, TypeScript y tests en cada salto.
2. Eliminar dependencias de React Navigation directas si Expo Router ya aporta las versiones compatibles; hoy hay dos copias con tipos incompatibles.
3. Agregar la dependencia faltante `expo-symbols` o reemplazarla por el sistema de iconos ya instalado.
4. Regenerar los proyectos nativos con prebuild/CNG; no mezclar manualmente el Android viejo con configuración generada sin revisar el diff.
5. Construir con un entorno que soporte Xcode/iOS 26 SDK. EAS Build es la ruta práctica desde Windows.

### P2 — calidad iPhone/TestFlight

1. Probar al menos iPhone SE/mini, tamaño estándar y Pro Max; modo claro/oscuro, permisos negados, sin red, API lenta, imagen grande y memoria baja.
2. Añadir estados de error/reintento/cancelación y evitar subir la foto hasta que la persona confirme el análisis.
3. Auditar VoiceOver, tamaños táctiles, Dynamic Type, contraste, teclado y safe areas.
4. Implementar analytics/crash reporting respetuoso de privacidad solo tras definir consentimiento y declaración de datos.
5. Preparar build `development`, build `preview` para TestFlight interno y build `production`, con canales/runtime coherentes si se usa EAS Update.

### P3 — App Store

1. Cuenta Apple Developer, App Store Connect, acuerdos fiscales/bancarios si aplica y registro del bundle ID.
2. Política de privacidad pública, URL de soporte, términos, mecanismo de borrado de cuenta/datos y formulario App Privacy.
3. Declarar tratamiento de fotos, identificadores y datos de salud/fitness con exactitud. No presentar cálculos nutricionales como consejo médico.
4. Capturas por tamaños requeridos, descripción, keywords, categoría, rating de edad y notas de revisión con cuenta demo si finalmente hay login.
5. TestFlight interno, luego externo, corrección de crashes/regresiones y recién entonces envío a revisión.

## Criterio de “listo para revisión”

- Cero errores de TypeScript/lint y suite de tests verde.
- Cero secretos dentro del bundle o historial activo; credenciales revocadas.
- Flujo principal probado en iPhone físico y TestFlight con permisos aceptados y denegados.
- Privacidad, soporte y borrado de datos disponibles desde la app y desde URLs públicas.
- Sin pantallas simuladas, botones inertes, contenido duplicado o texto corrupto.
- Build de producción firmado y compilado con el SDK mínimo vigente exigido por Apple.
