import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const CLARIFAI_MODEL = 'food-item-recognition';
const CLARIFAI_MODEL_VERSION = '1d5fd481e0cf4826aa72ec3ff049e044';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { imageBase64 } = await request.json();
    if (typeof imageBase64 !== 'string' || imageBase64.length === 0 || imageBase64.length > 14_000_000) {
      return Response.json({ error: 'Invalid image' }, { status: 400 });
    }

    const clarifaiPat = Deno.env.get('CLARIFAI_PAT');
    const edamamAppId = Deno.env.get('EDAMAM_APP_ID');
    const edamamAppKey = Deno.env.get('EDAMAM_APP_KEY');
    if (!clarifaiPat || !edamamAppId || !edamamAppKey) throw new Error('Server secrets are not configured');

    const recognitionResponse = await fetch(
      `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL}/versions/${CLARIFAI_MODEL_VERSION}/outputs`,
      {
        method: 'POST',
        headers: { Authorization: `Key ${clarifaiPat}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: [{ data: { image: { base64: imageBase64 } } }] }),
      },
    );
    if (!recognitionResponse.ok) throw new Error(`Recognition failed: ${recognitionResponse.status}`);
    const recognition = await recognitionResponse.json();
    const name = recognition.outputs?.[0]?.data?.concepts?.[0]?.name;
    if (!name) return Response.json({ error: 'Food not recognized' }, { status: 422 });

    const parserResponse = await fetch(
      `https://api.edamam.com/api/food-database/v2/parser?ingr=${encodeURIComponent(name)}&app_id=${edamamAppId}&app_key=${edamamAppKey}`,
    );
    if (!parserResponse.ok) throw new Error(`Nutrition parser failed: ${parserResponse.status}`);
    const parser = await parserResponse.json();
    const food = parser.parsed?.[0]?.food ?? parser.hints?.[0]?.food;
    if (!food) return Response.json({ error: 'Nutrition data not found' }, { status: 422 });

    const nutrientsResponse = await fetch(
      `https://api.edamam.com/api/food-database/v2/nutrients?app_id=${edamamAppId}&app_key=${edamamAppKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: [{ quantity: 1, measureURI: 'http://www.edamam.com/ontologies/edamam.owl#Measure_unit', foodId: food.foodId }] }),
      },
    );
    if (!nutrientsResponse.ok) throw new Error(`Nutrients request failed: ${nutrientsResponse.status}`);
    const nutrition = await nutrientsResponse.json();

    return Response.json({ name, nutrients: nutrition.totalNutrients });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Analysis failed' }, { status: 500 });
  }
});
