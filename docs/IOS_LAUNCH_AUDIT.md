# Calorfy: estado de preparación para App Store

Actualizado: 21 de julio de 2026

## Veredicto

La base técnica ya es candidata a pruebas de lanzamiento. No debe enviarse aún a revisión pública: faltan la membresía Apple Developer, un build firmado de TestFlight, la prueba manual completa en iPhone y completar la ficha de App Store Connect.

## Estado verificado

| Área | Estado | Evidencia |
| --- | --- | --- |
| Plataforma | Verde | Expo SDK 56, React Native 0.85 y nueva arquitectura. SDK 56 usa la infraestructura Xcode/iOS SDK vigente para envíos de 2026. |
| Dependencias | Verde | `expo install --check` informa que están actualizadas. |
| Código | Verde | TypeScript estricto sin errores. |
| Pruebas | Verde | 8 suites y 29 tests automatizados aprobados. |
| Backend | Verde | Supabase Auth, Postgres con RLS, migraciones versionadas y funciones servidoras. |
| Secretos | Verde | Clarifai y Edamam se consumen desde `analyze-meal`; el cliente solo contiene la publishable key de Supabase. |
| Borrado | Verde | `delete-account` está desplegada. La persona puede iniciar el borrado completo desde Ajustes; las filas usan cascada y los archivos se eliminan antes de borrar Auth. |
| Privacidad | Amarillo | Política y soporte están dentro de la app. Las URLs públicas quedan pendientes del dominio oficial de Calorfy. |
| Privacy Manifest | Amarillo | React Native, Expo FileSystem, Expo Constants y AsyncStorage incluyen manifiestos propios sin tracking. Falta validar el manifiesto agregado dentro del archive firmado. |
| iOS | Amarillo | Bundle ID, permisos localizados, build number y declaración de cifrado configurados. Falta compilar/firma/TestFlight por no estar activa la membresía de Apple. |
| QA | Amarillo | Falta matriz manual en iPhone físico, VoiceOver, permisos negados, red lenta/sin red y flujo integral de cuenta. |

## Datos que deben declararse en App Privacy

La respuesta final debe coincidir con el comportamiento de la versión enviada. Para la versión actual:

- Información de contacto: correo electrónico, vinculado a la identidad, para funcionalidad de la app.
- Salud y actividad: peso, altura, edad/fecha inferida, sexo, objetivos y datos nutricionales, vinculados a la identidad, para funcionalidad y personalización.
- Contenido del usuario: comidas, recetas/planes y fotos elegidas para análisis, vinculados a la identidad, para funcionalidad.
- Identificadores: ID interno de usuario, vinculado a la identidad, para autenticación y seguridad.
- No se usa tracking entre apps o sitios y no se venden datos.
- Proveedores operativos: Supabase; para la función opcional de escaneo, Clarifai y Edamam.

Revisar nuevamente estas respuestas si se agrega analytics, crash reporting, publicidad, HealthKit o pagos.

## Metadatos preparados

- Privacy Policy URL: pendiente de publicar en el dominio oficial de Calorfy.
- Support URL: pendiente de publicar en el dominio oficial de Calorfy.
- Bundle ID: `com.calorfy.calorfylite`
- Categoría sugerida: Health & Fitness; secundaria Food & Drink.
- App solo para iPhone en v1 (`supportsTablet: false`).
- Cifrado: únicamente transporte estándar provisto por el sistema (`ITSAppUsesNonExemptEncryption: false`).
- Permisos nativos: cámara y selección de fotos explicados en español, inglés y portugués; micrófono bloqueado porque Calorfy no lo utiliza.
- La descripción y las capturas no deben presentar estimaciones como diagnóstico o tratamiento médico.

## Trabajo pendiente antes de enviar

1. Activar Apple Developer, registrar el Bundle ID y crear la app en App Store Connect.
2. Publicar política de privacidad y soporte en el dominio oficial de Calorfy y comprobar ambas URLs sin login.
3. Crear una cuenta demo estable para App Review y escribir credenciales/notas de revisión.
4. Generar build EAS `production`, subirlo a TestFlight y probarlo desde instalación limpia.
5. Ejecutar la matriz manual de `docs/IOS_TEST_MATRIX.md` en el iPhone físico.
6. Completar App Privacy, rating de edad, copyright, descripción, keywords y capturas.
7. Corregir cualquier crash o bloqueo; recién entonces enviar a revisión.

## Condición de aprobado interno

- CI, Expo Doctor, TypeScript, tests y bundles iOS/web verdes.
- Cero botones inertes o datos demo visibles en producción.
- Registro, confirmación de correo, login, recuperación, logout y borrado probados con la configuración de producción.
- Escaneo probado aceptando y denegando permisos; mensajes comprensibles sin red.
- Tema claro/oscuro, español/inglés/portugués y tamaños de iPhone revisados.
- Política y soporte accesibles públicamente y dentro de la app.
- TestFlight sin crashes bloqueantes durante la prueba final.
