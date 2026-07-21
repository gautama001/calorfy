import type { DietGuide, DietKey, DietRecipe } from '@/lib/dietCatalog';

export type CatalogLanguage = 'es' | 'en' | 'pt';

export function catalogLanguage(language?: string): CatalogLanguage {
  const code = language?.split('-')[0];
  return code === 'en' || code === 'pt' ? code : 'es';
}

type GuideCopy = Pick<DietGuide, 'name' | 'shortName' | 'description' | 'principles' | 'tags'>;

const guideCopy: Record<'en' | 'pt', Record<DietKey, GuideCopy>> = {
  en: {
    latam_balanced: { name: 'Balanced LATAM', shortName: 'LATAM', description: 'Everyday Latin American meals with balanced portions, legumes, grains, vegetables and varied proteins.', principles: ['Familiar, accessible dishes', 'Fill half the plate with vegetables when possible', 'Vary legumes, grains and proteins'], tags: ['Flexible', 'Regional', 'Family-friendly'] },
    mediterranean: { name: 'Mediterranean', shortName: 'Mediterranean', description: 'Prioritizes vegetables, legumes, fish, whole grains, nuts and olive oil.', principles: ['Mostly unsaturated fats', 'Vegetables at every meal', 'Fish and legumes frequently'], tags: ['Heart healthy', 'Flexible'] },
    high_protein: { name: 'High protein', shortName: 'High protein', description: 'Higher-protein options designed for satiety, recovery and muscle-building goals.', principles: ['Protein spread throughout the day', 'Animal and plant sources', 'Carbohydrates matched to activity'], tags: ['Protein', 'Training'] },
    vegetarian: { name: 'Vegetarian', shortName: 'Vegetarian', description: 'Meat- and fish-free meals that include eggs, dairy, legumes, tofu and grains.', principles: ['Rotate protein sources', 'Combine legumes and grains', 'Pay attention to iron, B12 and omega-3'], tags: ['Meat-free', 'Flexible'] },
    vegan: { name: 'Vegan', shortName: 'Vegan', description: 'Fully plant-based recipes built around legumes, tofu, seeds, nuts, fruit and vegetables.', principles: ['Varied plant proteins', 'Appropriate B12 supplementation', 'Minimally processed foods'], tags: ['100% plant-based', 'Fiber'] },
    keto: { name: 'Ketogenic', shortName: 'Keto', description: 'Very low in carbohydrates and high in fat, with non-starchy vegetables and moderate protein.', principles: ['Very limited carbohydrates', 'Quality fat sources', 'Not suitable for everyone'], tags: ['Very low carb'] },
    low_carb: { name: 'Low carb', shortName: 'Low carb', description: 'Reduces flour and sugar without necessarily following a ketogenic diet.', principles: ['Vegetables as the foundation', 'Protein at every meal', 'Selected, measured carbohydrates'], tags: ['Low carb', 'Flexible'] },
    gluten_free: { name: 'Gluten-free', shortName: 'Gluten-free', description: 'Naturally wheat-, barley- and rye-free recipes using rice, corn, quinoa, potato and cassava.', principles: ['Avoid cross-contact when managing celiac disease', 'Prefer naturally gluten-free foods', 'Check product labels'], tags: ['Gluten-free', 'Celiac-friendly'] },
    paleo: { name: 'Paleo', shortName: 'Paleo', description: 'Focuses on meat, fish, eggs, fruit, vegetables, tubers, seeds and nuts.', principles: ['No grains or legumes', 'Minimally processed food', 'Tubers as an energy source'], tags: ['Grain-free', 'Minimally processed'] },
    macrobiotic: { name: 'Macrobiotic', shortName: 'Macrobiotic', description: 'Meals centered on whole grains, vegetables, legumes, seaweed and simple preparation.', principles: ['Whole grains as the foundation', 'Seasonal produce', 'Simple cooking and plant variety'], tags: ['Whole grain', 'Plant-forward'] },
  },
  pt: {
    latam_balanced: { name: 'Equilibrada LATAM', shortName: 'LATAM', description: 'Refeições cotidianas da América Latina com porções equilibradas, leguminosas, cereais, vegetais e proteínas variadas.', principles: ['Pratos conhecidos e acessíveis', 'Metade do prato com vegetais quando possível', 'Variar leguminosas, cereais e proteínas'], tags: ['Flexível', 'Regional', 'Familiar'] },
    mediterranean: { name: 'Mediterrânea', shortName: 'Mediterrânea', description: 'Prioriza vegetais, leguminosas, peixe, cereais integrais, castanhas e azeite.', principles: ['Gorduras principalmente insaturadas', 'Vegetais em todas as refeições', 'Peixe e leguminosas com frequência'], tags: ['Cardioprotetora', 'Flexível'] },
    high_protein: { name: 'Alta em proteínas', shortName: 'Proteica', description: 'Opções com maior densidade proteica para saciedade, recuperação e ganho de massa muscular.', principles: ['Proteína distribuída ao longo do dia', 'Fontes animais e vegetais', 'Carboidratos conforme a atividade'], tags: ['Proteína', 'Treino'] },
    vegetarian: { name: 'Vegetariana', shortName: 'Vegetariana', description: 'Alimentação sem carnes nem peixe, com ovos, laticínios, leguminosas, tofu e cereais.', principles: ['Alternar fontes de proteína', 'Combinar leguminosas e cereais', 'Cuidar de ferro, B12 e ômega-3'], tags: ['Sem carne', 'Flexível'] },
    vegan: { name: 'Vegana', shortName: 'Vegana', description: 'Receitas totalmente vegetais à base de leguminosas, tofu, sementes, castanhas, frutas e verduras.', principles: ['Proteínas vegetais variadas', 'Suplementação adequada de B12', 'Alimentos minimamente processados'], tags: ['100% vegetal', 'Fibras'] },
    keto: { name: 'Cetogênica', shortName: 'Keto', description: 'Muito baixa em carboidratos e rica em gorduras, com vegetais sem amido e proteína moderada.', principles: ['Carboidratos muito limitados', 'Gorduras de boa qualidade', 'Não é adequada para todas as pessoas'], tags: ['Muito baixo carboidrato'] },
    low_carb: { name: 'Baixa em carboidratos', shortName: 'Low carb', description: 'Reduz farinhas e açúcares sem necessariamente chegar a uma dieta cetogênica.', principles: ['Vegetais como base', 'Proteína em todas as refeições', 'Carboidratos escolhidos e medidos'], tags: ['Baixo carboidrato', 'Flexível'] },
    gluten_free: { name: 'Sem glúten', shortName: 'Sem glúten', description: 'Receitas naturalmente livres de trigo, cevada e centeio, com arroz, milho, quinoa, batata e mandioca.', principles: ['Evitar contaminação cruzada em caso de doença celíaca', 'Preferir alimentos naturalmente sem glúten', 'Verificar os rótulos'], tags: ['Sem glúten', 'Doença celíaca'] },
    paleo: { name: 'Paleo', shortName: 'Paleo', description: 'Foca em carnes, peixe, ovos, frutas, verduras, tubérculos, sementes e castanhas.', principles: ['Sem cereais nem leguminosas', 'Comida pouco processada', 'Tubérculos como fonte de energia'], tags: ['Sem cereais', 'Pouco processado'] },
    macrobiotic: { name: 'Macrobiótica', shortName: 'Macrobiótica', description: 'Pratos centrados em cereais integrais, vegetais, leguminosas, algas e preparações simples.', principles: ['Cereais integrais como base', 'Produtos da estação', 'Cozimento simples e variedade vegetal'], tags: ['Integral', 'Vegetal'] },
  },
};

const names: Record<'en' | 'pt', Record<DietKey, string[]>> = {
  en: {
    latam_balanced: ['Arepa with eggs and avocado','Oatmeal with banana and peanuts','Chicken, quinoa and vegetables','Light lentil stew','Yogurt with fruit and seeds','Hummus with vegetable sticks and corn','Hake with sweet potato and salad','Black bean tacos'],
    mediterranean: ['Greek yogurt with walnuts','Toast with tomato and feta','Tuna and chickpea salad','Salmon with lemon quinoa','Hummus with whole-wheat pita','Apple, ricotta and almonds','Fish with roasted vegetables','Chicken with eggplant and couscous'],
    high_protein: ['High-protein omelet','Protein oatmeal with cocoa','Chicken and rice bowl','Lean beef with potatoes','High-protein yogurt with berries','Turkey and cheese rolls','Salmon with pea purée','Beef and bean chili'],
    vegetarian: ['Eggs with spinach and toast','Oat and ricotta pancakes','Quinoa and egg salad','Lentil burgers','Ricotta with pear and walnuts','Caprese toast','Chickpea and egg curry','Eggplant and ricotta lasagna'],
    vegan: ['Oatmeal with berries','Scrambled tofu with arepa','Tofu and brown rice bowl','Quinoa with chickpeas','Hummus with vegetables','No-bake oat and date bar','Chickpea curry','Bean and avocado tacos'],
    keto: ['Eggs with avocado and bacon','Egg and cheese muffins','Keto Caesar salad','Beef with cauliflower rice','Walnuts, cheese and olives','Ham and mozzarella rolls','Salmon with asparagus','Coconut chicken curry'],
    low_carb: ['Mushroom omelet','Yogurt with seeds and strawberries','Chicken lettuce wraps','Beef and vegetable bowl','Egg, avocado and tomato','Cottage cheese with cucumber','Beef-stuffed zucchini','Fish with cauliflower purée'],
    gluten_free: ['Arepa with cheese and tomato','Quinoa and apple porridge','Chicken with rice and beans','Potato omelet with salad','Rice cakes with ricotta','Yogurt with gluten-free granola','Beef and cassava pie','Mushroom risotto'],
    paleo: ['Eggs with sweet potato and avocado','Banana and almond bowl','Chicken with roasted squash','Beef and avocado salad','Apple with almond butter','Egg and mixed nuts','Fish with vegetables and sweet potato','Meatballs with zucchini'],
    macrobiotic: ['Brown rice with apple','Miso soup with tofu','Rice, adzuki bean and squash bowl','Soba with tofu and vegetables','Rice and sesame balls','Cooked pear with walnuts','Barley and vegetable soup','Tempeh with rice and broccoli'],
  },
  pt: {
    latam_balanced: ['Arepa com ovo e abacate','Aveia com banana e amendoim','Frango, quinoa e vegetais','Ensopado leve de lentilhas','Iogurte com frutas e sementes','Homus com palitos de vegetais e milho','Merluza com batata-doce e salada','Tacos de feijão-preto'],
    mediterranean: ['Iogurte grego com nozes','Torradas com tomate e feta','Salada de atum e grão-de-bico','Salmão com quinoa ao limão','Homus com pão pita integral','Maçã, ricota e amêndoas','Peixe com legumes assados','Frango com berinjela e cuscuz'],
    high_protein: ['Omelete proteico','Aveia proteica com cacau','Bowl de frango e arroz','Carne magra com batatas','Iogurte proteico com frutas vermelhas','Rolinhos de peru e queijo','Salmão com purê de ervilhas','Chili de carne e feijão'],
    vegetarian: ['Ovos com espinafre e torrada','Panquecas de aveia e ricota','Salada de quinoa e ovo','Hambúrgueres de lentilha','Ricota com pera e nozes','Torrada caprese','Curry de grão-de-bico e ovo','Lasanha de berinjela e ricota'],
    vegan: ['Aveia com frutas vermelhas','Tofu mexido com arepa','Bowl de tofu e arroz integral','Quinoa com grão-de-bico','Homus com vegetais','Barra de aveia e tâmaras','Curry de grão-de-bico','Tacos de feijão e abacate'],
    keto: ['Ovos com abacate e bacon','Muffins de ovo e queijo','Salada Caesar keto','Carne com arroz de couve-flor','Nozes, queijo e azeitonas','Rolinhos de presunto e muçarela','Salmão com aspargos','Frango ao curry com coco'],
    low_carb: ['Omelete de cogumelos','Iogurte com sementes e morango','Wraps de alface com frango','Bowl de carne e vegetais','Ovo, abacate e tomate','Queijo cottage com pepino','Abobrinhas recheadas com carne','Peixe com purê de couve-flor'],
    gluten_free: ['Arepa com queijo e tomate','Mingau de quinoa e maçã','Frango com arroz e feijão','Tortilha de batata e salada','Biscoitos de arroz com ricota','Iogurte com granola sem glúten','Escondidinho de carne e mandioca','Risoto de cogumelos'],
    paleo: ['Ovos com batata-doce e abacate','Bowl de banana e amêndoas','Frango com abóbora assada','Salada de carne e abacate','Maçã com pasta de amêndoas','Ovo e mix de castanhas','Peixe com vegetais e batata-doce','Almôndegas com abobrinha'],
    macrobiotic: ['Arroz integral com maçã','Sopa de missô com tofu','Bowl de arroz, adzuki e abóbora','Soba com tofu e vegetais','Bolinhas de arroz e gergelim','Pera cozida com nozes','Sopa de cevada e vegetais','Tempeh com arroz e brócolis'],
  },
};

const ingredientPairs: Record<string, [string, string]> = {
  'aceite de oliva':['olive oil','azeite'], aceitunas:['olives','azeitonas'], ajo:['garlic','alho'], albahaca:['basil','manjericão'], 'alga nori':['nori seaweed','alga nori'], 'alga wakame':['wakame seaweed','alga wakame'], almendras:['almonds','amêndoas'], apio:['celery','aipo'], arepa:['arepa','arepa'], 'arepa de maíz':['corn arepa','arepa de milho'], arroz:['rice','arroz'], 'arroz arborio':['arborio rice','arroz arbóreo'], 'arroz integral':['brown rice','arroz integral'], arvejas:['peas','ervilhas'], atún:['tuna','atum'], avena:['oats','aveia'], banana:['banana','banana'], batata:['sweet potato','batata-doce'], 'bebida vegetal':['plant-based drink','bebida vegetal'], berenjena:['eggplant','berinjela'], brócoli:['broccoli','brócolis'], cacao:['cocoa','cacau'], calabacín:['zucchini','abobrinha'], calabaza:['squash','abóbora'], caldo:['broth','caldo'], canela:['cinnamon','canela'], carne:['beef','carne'], 'carne magra':['lean beef','carne magra'], cebada:['barley','cevada'], cebolla:['onion','cebola'], champiñones:['mushrooms','cogumelos'], chía:['chia seeds','chia'], claras:['egg whites','claras'], coco:['coconut','coco'], coliflor:['cauliflower','couve-flor'], comino:['cumin','cominho'], 'couscous integral':['whole-wheat couscous','cuscuz integral'], crema:['cream','creme de leite'], cúrcuma:['turmeric','cúrcuma'], curry:['curry','curry'], dátiles:['dates','tâmaras'], edamame:['edamame','edamame'], ensalada:['salad','salada'], espárragos:['asparagus','aspargos'], especias:['spices','especiarias'], espinaca:['spinach','espinafre'], 'fideos soba':['soba noodles','macarrão soba'], 'frijoles negros':['black beans','feijão-preto'], fruta:['fruit','fruta'], 'fruta de estación':['seasonal fruit','fruta da estação'], frutillas:['strawberries','morangos'], 'frutos rojos':['berries','frutas vermelhas'], 'galletas de arroz':['rice cakes','biscoitos de arroz'], garbanzos:['chickpeas','grão-de-bico'], 'granola sin TACC':['gluten-free granola','granola sem glúten'], 'harina de maíz':['corn flour','farinha de milho'], hierbas:['herbs','ervas'], 'hojas verdes':['leafy greens','folhas verdes'], hongos:['mushrooms','cogumelos'], huevo:['egg','ovo'], huevos:['eggs','ovos'], hummus:['hummus','homus'], jamón:['ham','presunto'], jengibre:['ginger','gengibre'], leche:['milk','leite'], 'leche de coco':['coconut milk','leite de coco'], lechuga:['lettuce','alface'], lentejas:['lentils','lentilhas'], limón:['lemon','limão'], mandioca:['cassava','mandioca'], maní:['peanuts','amendoim'], manteca:['butter','manteiga'], 'manteca de almendras':['almond butter','pasta de amêndoas'], manzana:['apple','maçã'], mayonesa:['mayonnaise','maionese'], merluza:['hake','merluza'], miel:['honey','mel'], miso:['miso','missô'], mostaza:['mustard','mostarda'], mozzarella:['mozzarella','muçarela'], nueces:['walnuts','nozes'], orégano:['oregano','orégano'], palta:['avocado','abacate'], 'pan integral':['whole-wheat bread','pão integral'], 'pan pita integral':['whole-wheat pita','pão pita integral'], panceta:['bacon','bacon'], papa:['potato','batata'], parmesano:['Parmesan','parmesão'], pavo:['turkey','peru'], pepino:['cucumber','pepino'], pera:['pear','pera'], perejil:['parsley','salsa'], pescado:['fish','peixe'], 'pescado blanco':['white fish','peixe branco'], pimentón:['paprika','páprica'], pimiento:['bell pepper','pimentão'], pollo:['chicken','frango'], porotos:['beans','feijão'], 'porotos aduki':['adzuki beans','feijão-azuki'], 'porotos rojos':['red beans','feijão-vermelho'], 'proteína en polvo':['protein powder','proteína em pó'], puerro:['leek','alho-poró'], queso:['cheese','queijo'], 'queso cottage':['cottage cheese','queijo cottage'], 'queso feta':['feta cheese','queijo feta'], 'queso magro':['low-fat cheese','queijo magro'], quinoa:['quinoa','quinoa'], repollo:['cabbage','repolho'], ricota:['ricotta','ricota'], rúcula:['arugula','rúcula'], salmón:['salmon','salmão'], 'salsa de tomate':['tomato sauce','molho de tomate'], semillas:['seeds','sementes'], sésamo:['sesame','gergelim'], tahini:['tahini','tahine'], tempeh:['tempeh','tempeh'], tofu:['tofu','tofu'], tomate:['tomato','tomate'], tortillas:['tortillas','tortilhas'], 'tortillas de maíz':['corn tortillas','tortilhas de milho'], 'tostadas de maíz':['corn tostadas','tostadas de milho'], verdeo:['green onion','cebolinha'], yogur:['yogurt','iogurte'], 'yogur alto en proteína':['high-protein yogurt','iogurte proteico'], 'yogur griego':['Greek yogurt','iogurte grego'], 'yogur natural':['plain yogurt','iogurte natural'], zanahoria:['carrot','cenoura'], zapallitos:['zucchini','abobrinha'], zapallo:['squash','abóbora'], zucchini:['zucchini','abobrinha'],
};

export function localizeDietGuide(guide: DietGuide | undefined, language?: string): DietGuide | undefined {
  const lang = catalogLanguage(language);
  if (!guide || lang === 'es') return guide;
  return { ...guide, ...guideCopy[lang][guide.key] };
}

export function localizeDietRecipe(recipe: DietRecipe | undefined, language?: string): DietRecipe | undefined {
  const lang = catalogLanguage(language);
  if (!recipe || lang === 'es') return recipe;
  const index = Number(recipe.id.slice(recipe.id.lastIndexOf('-') + 1)) - 1;
  const ingredients = recipe.ingredients.map((ingredient) => ingredientPairs[ingredient]?.[lang === 'en' ? 0 : 1] ?? ingredient);
  const list = new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(ingredients);
  const summary = lang === 'en' ? `A practical, balanced dish made with ${list}.` : `Um prato prático e equilibrado preparado com ${list}.`;
  const instructions = lang === 'en'
    ? ['Prepare and measure all the ingredients.', recipe.category === 'snack' ? 'Combine the ingredients and portion before serving.' : 'Cook the ingredients until ready and assemble the dish.', 'Serve the portion and season to taste.']
    : ['Separe e meça todos os ingredientes.', recipe.category === 'snack' ? 'Combine os ingredientes e porcione antes de servir.' : 'Cozinhe os ingredientes até o ponto e monte o prato.', 'Sirva a porção e ajuste os temperos a gosto.'];
  return { ...recipe, name: names[lang][recipe.diet][index] ?? recipe.name, summary, ingredients, instructions };
}

export function localizeDietGuides(guides: DietGuide[], language?: string) {
  return guides.map((guide) => localizeDietGuide(guide, language)!);
}

export function localizeDietRecipes(recipes: DietRecipe[], language?: string) {
  return recipes.map((recipe) => localizeDietRecipe(recipe, language)!);
}
