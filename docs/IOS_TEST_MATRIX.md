# Matriz de prueba iOS para release candidate

Registrar versión, build, modelo de iPhone, versión de iOS, resultado y evidencia por caso.

## Instalación y cuenta

- Instalación limpia abre login sin pantalla vacía ni contenido previo.
- Crear cuenta con correo válido; validar confirmación y retorno por deep link.
- Errores claros para correo inválido, contraseña débil, usuario existente y sin red.
- Login, recuperación de contraseña y persistencia de sesión tras cerrar/reabrir.
- Cerrar sesión elimina el acceso al diario.
- Eliminar cuenta requiere confirmación, vuelve a login y el usuario ya no puede autenticarse.

## Flujo principal

- Buscar alimentos con tres letras; cantidades en g, ml y cucharadas calculan correctamente.
- Preparar varios ítems y agregarlos en masa a desayuno, almuerzo, merienda y cena.
- Receta se agrega a la categoría elegida y vuelve correctamente a Hoy o Dietas.
- Plan semanal persiste tras reiniciar y respeta el estilo de alimentación.
- Guardar peso actualiza card, porcentaje, historial y rangos 7 días/1 mes/12 meses.
- Objetivos y macros automáticos se sincronizan y pueden editarse manualmente.

## Cámara, fotos y red

- Permiso de cámara aceptado, denegado y revocado desde Ajustes.
- Permiso de fototeca aceptado, limitado y denegado.
- Imagen grande, formato no esperado y alimento no reconocido muestran error recuperable.
- Sin red, red lenta y backend 500 no bloquean la navegación ni crean duplicados.

## Presentación y accesibilidad

- Tema claro/oscuro en todas las rutas; cambio persiste.
- Español, inglés y portugués no muestran keys ni textos cortados.
- iPhone compacto, estándar y Pro Max; portrait; teclado no tapa controles.
- VoiceOver anuncia botones/campos; orden de foco lógico; áreas táctiles cercanas a 44×44 pt.
- Tamaño de texto grande no oculta acciones críticas y el contraste sigue siendo legible.

## Legal y revisión

- Política de privacidad y soporte abren dentro de Ajustes.
- URLs públicas responden sin login.
- Cuenta demo de App Review permite recorrer todos los flujos.
- No aparecen menús de desarrollo, secretos, placeholders, alertas técnicas ni contenido de prueba.
