# Estrategia de datos alimentarios LATAM

## Principio

Calorfy debe distinguir entre alimento, nombre local, preparación, porción y valor nutricional. “Palta”, “aguacate” y “abacate” pueden referirse al mismo alimento; una arepa colombiana y una venezolana pueden compartir nombre pero tener composición y porción distintas.

## Capas

1. `foods`: identidad canónica del alimento o preparación.
2. `food_names`: nombres, regionalismos, sinónimos y errores frecuentes por país/locale.
3. `food_country_presence`: presencia, tradición, región y popularidad por mercado.
4. `food_portions`: medidas caseras locales convertidas a gramos.
5. `food_nutrients`: valores por 100 g, método, fuente y confianza.
6. `recipe_ingredients`: composición reproducible de platos tradicionales.
7. `food_submissions`: aportes comunitarios aislados del catálogo verificado.

## Calidad y licencias

- No importar una tabla únicamente porque sea pública en internet.
- Registrar editor, versión, URL, licencia y atribución obligatoria.
- Mantener la fuente en `pending_review` hasta confirmar reutilización comercial.
- Conservar códigos originales y tagnames INFOODS.
- Marcar valores como medidos, calculados, estimados, prestados, traza o no detectados.
- Publicar únicamente alimentos con `verification_status = verified`.

## Orden de cobertura recomendado

1. Argentina, México, Brasil, Colombia, Perú y Chile.
2. Uruguay, Paraguay, Bolivia, Ecuador y Venezuela.
3. Centroamérica, Caribe hispano, Puerto Rico y Haití.

La primera carga debe priorizar 100–200 preparaciones de alta frecuencia por mercado, con porciones domésticas reales y nombres locales, antes que intentar importar miles de filas poco curadas.

## Pipeline de importación

1. Guardar el archivo fuente original fuera del cliente.
2. Transformar a un formato staging reproducible.
3. Validar unidades, duplicados, rangos, energía calculada y códigos INFOODS.
4. Revisar nombres regionales y porciones con una persona del país.
5. Importar como `in_review`.
6. Aprobar fuente y alimento en un proceso de curación con auditoría.
