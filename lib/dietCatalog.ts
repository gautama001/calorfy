import type { MealCategory } from '@/lib/diary';

export type DietKey = 'latam_balanced' | 'mediterranean' | 'high_protein' | 'vegetarian' | 'vegan' | 'keto' | 'low_carb' | 'gluten_free' | 'paleo' | 'macrobiotic';

export type DietRecipe = {
  id: string;
  diet: DietKey;
  category: MealCategory;
  name: string;
  summary: string;
  ingredients: string[];
  instructions: string[];
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DietGuide = {
  key: DietKey;
  name: string;
  shortName: string;
  description: string;
  principles: string[];
  tags: string[];
  accent: string;
};

type RecipeSeed = [MealCategory, string, string, number, number, number, number, number, string, string];

const guides: DietGuide[] = [
  { key: 'latam_balanced', name: 'Equilibrada LATAM', shortName: 'LATAM', description: 'Comidas cotidianas de América Latina con porciones completas, legumbres, cereales, vegetales y proteínas variadas.', principles: ['Platos conocidos y accesibles', 'Mitad del plato con vegetales cuando sea posible', 'Variedad de legumbres, cereales y proteínas'], tags: ['Flexible', 'Regional', 'Familiar'], accent: '#00A77D' },
  { key: 'mediterranean', name: 'Mediterránea', shortName: 'Mediterránea', description: 'Prioriza vegetales, legumbres, pescado, cereales integrales, frutos secos y aceite de oliva.', principles: ['Grasas principalmente insaturadas', 'Vegetales en cada comida', 'Pescado y legumbres con frecuencia'], tags: ['Cardiosaludable', 'Flexible'], accent: '#2F80A8' },
  { key: 'high_protein', name: 'Alta en proteínas', shortName: 'Proteica', description: 'Opciones con mayor densidad proteica para saciedad, recuperación y objetivos de masa muscular.', principles: ['Proteína distribuida durante el día', 'Fuentes animales y vegetales', 'Carbohidratos según actividad'], tags: ['Proteína', 'Entrenamiento'], accent: '#9A5D38' },
  { key: 'vegetarian', name: 'Vegetariana', shortName: 'Vegetariana', description: 'Alimentación sin carnes ni pescado que incorpora huevos, lácteos, legumbres, tofu y cereales.', principles: ['Rotar fuentes de proteína', 'Combinar legumbres y cereales', 'Cuidar hierro, B12 y omega-3'], tags: ['Sin carne', 'Flexible'], accent: '#5D963D' },
  { key: 'vegan', name: 'Vegana', shortName: 'Vegana', description: 'Recetas totalmente vegetales basadas en legumbres, tofu, semillas, frutos secos, frutas y verduras.', principles: ['Proteínas vegetales variadas', 'Suplementación de B12 indicada', 'Alimentos mínimamente procesados'], tags: ['100% vegetal', 'Fibra'], accent: '#4B8F62' },
  { key: 'keto', name: 'Cetogénica', shortName: 'Keto', description: 'Muy baja en carbohidratos y alta en grasas, con verduras no feculentas y proteínas moderadas.', principles: ['Carbohidratos muy limitados', 'Grasas de buena calidad', 'No es adecuada para todas las personas'], tags: ['Muy bajo carbohidrato'], accent: '#7556A8' },
  { key: 'low_carb', name: 'Baja en carbohidratos', shortName: 'Low carb', description: 'Reduce harinas y azúcares sin llegar necesariamente a una dieta cetogénica.', principles: ['Vegetales como base', 'Proteínas en cada comida', 'Carbohidratos elegidos y medidos'], tags: ['Bajo carbohidrato', 'Flexible'], accent: '#3F7F8A' },
  { key: 'gluten_free', name: 'Sin gluten', shortName: 'Sin gluten', description: 'Recetas naturalmente libres de trigo, cebada y centeno, con arroz, maíz, quinoa, papa y mandioca.', principles: ['Evitar contaminación cruzada si hay celiaquía', 'Preferir alimentos naturalmente sin gluten', 'Verificar etiquetas'], tags: ['Sin TACC', 'Celiaquía'], accent: '#C48B2C' },
  { key: 'paleo', name: 'Paleo', shortName: 'Paleo', description: 'Se enfoca en carnes, pescado, huevos, frutas, verduras, tubérculos, semillas y frutos secos.', principles: ['Sin cereales ni legumbres', 'Comida poco procesada', 'Tubérculos como fuente de energía'], tags: ['Sin cereales', 'No procesado'], accent: '#A6673B' },
  { key: 'macrobiotic', name: 'Macrobiótica', shortName: 'Macrobiótica', description: 'Platos centrados en granos integrales, vegetales, legumbres, algas y preparaciones simples.', principles: ['Granos integrales como base', 'Productos estacionales', 'Cocción simple y variedad vegetal'], tags: ['Integral', 'Vegetal'], accent: '#8B7650' },
];

const seeds: Record<DietKey, RecipeSeed[]> = {
  latam_balanced: [
    ['breakfast','Arepa con huevo y palta','Arepa de maíz con huevo revuelto, palta y tomate.',390,19,43,16,280,'arepa de maíz, huevo, palta, tomate','Dorá la arepa, cociná el huevo y serví con palta y tomate.'],
    ['breakfast','Avena con banana y maní','Avena cremosa con fruta, leche y maní tostado.',360,14,55,11,330,'avena, leche, banana, maní, canela','Cociná la avena con leche y terminá con banana, maní y canela.'],
    ['lunch','Pollo, quinoa y vegetales','Bowl completo con pollo dorado, quinoa y vegetales frescos.',510,42,51,15,430,'pollo, quinoa, tomate, pepino, zanahoria, limón','Cociná el pollo y la quinoa; armá el bowl con vegetales y limón.'],
    ['lunch','Guiso liviano de lentejas','Lentejas con zapallo, tomate, cebolla y carne magra.',480,31,61,13,480,'lentejas, carne magra, zapallo, tomate, cebolla, pimentón','Rehogá los vegetales, sumá carne y lentejas y cociná hasta espesar.'],
    ['snack','Yogur con fruta y semillas','Merienda simple con yogur natural, fruta fresca y chía.',230,13,30,7,260,'yogur natural, fruta de estación, chía','Serví el yogur con fruta cortada y semillas.'],
    ['snack','Hummus con bastones y maíz','Hummus casero acompañado con vegetales y tostadas de maíz.',250,9,34,10,240,'garbanzos, tahini, zanahoria, pepino, tostadas de maíz','Procesá el hummus y serví con los vegetales y tostadas.'],
    ['dinner','Merluza con batata y ensalada','Pescado al horno con batata asada y ensalada crocante.',470,38,48,14,430,'merluza, batata, repollo, zanahoria, limón','Horneá pescado y batata; acompañá con ensalada y limón.'],
    ['dinner','Tacos de frijoles negros','Tortillas de maíz con frijoles, repollo, palta y pico de gallo.',440,17,64,14,390,'tortillas de maíz, frijoles negros, repollo, palta, tomate','Calentá los frijoles y armá los tacos con vegetales frescos.'],
  ],
  mediterranean: [
    ['breakfast','Yogur griego con nueces','Yogur, frutos rojos, nueces, miel y canela.',330,19,31,15,280,'yogur griego, frutos rojos, nueces, miel, canela','Combiná todos los ingredientes y serví frío.'],
    ['breakfast','Tostadas con tomate y feta','Pan integral con tomate, aceite de oliva, feta y orégano.',350,14,42,15,250,'pan integral, tomate, queso feta, aceite de oliva, orégano','Tostá el pan y cubrí con tomate, feta, aceite y orégano.'],
    ['lunch','Ensalada de atún y garbanzos','Ensalada completa con atún, garbanzos, pepino y aceitunas.',470,35,40,19,420,'atún, garbanzos, pepino, tomate, aceitunas, aceite de oliva','Mezclá los ingredientes y condimentá con aceite y limón.'],
    ['lunch','Salmón con quinoa al limón','Salmón a la plancha sobre quinoa con hierbas y vegetales.',540,39,43,24,430,'salmón, quinoa, calabacín, limón, perejil, aceite de oliva','Cociná el salmón y serví sobre quinoa con vegetales y limón.'],
    ['snack','Hummus con pita integral','Hummus, pan pita, pimentón y aceite de oliva.',270,10,34,11,220,'hummus, pan pita integral, pimentón, aceite de oliva','Calentá el pita y serví con hummus, pimentón y aceite.'],
    ['snack','Manzana, ricota y almendras','Manzana fresca con ricota cremosa, almendras y canela.',240,12,28,10,250,'manzana, ricota, almendras, canela','Cortá la manzana y serví con ricota, almendras y canela.'],
    ['dinner','Pescado con verduras al horno','Pescado blanco con pimiento, cebolla, tomate y oliva.',430,38,29,18,440,'pescado blanco, pimiento, cebolla, tomate, aceite de oliva','Horneá todo junto con hierbas hasta que el pescado esté tierno.'],
    ['dinner','Pollo con berenjena y couscous','Pollo grillado con berenjena, couscous integral y hierbas.',500,42,49,16,450,'pollo, berenjena, couscous integral, tomate, hierbas','Grillá pollo y berenjena y serví sobre couscous hidratado.'],
  ],
  high_protein: [
    ['breakfast','Omelette proteico','Huevos y claras con espinaca, queso y tomate.',380,38,10,21,300,'huevos, claras, espinaca, queso magro, tomate','Cociná el omelette y rellená con vegetales y queso.'],
    ['breakfast','Avena proteica con cacao','Avena con yogur, proteína, cacao y banana.',440,35,56,10,360,'avena, yogur griego, proteína en polvo, cacao, banana','Cociná la avena y mezclá con el resto fuera del fuego.'],
    ['lunch','Bowl de pollo y arroz','Pechuga, arroz, edamame y vegetales con limón.',590,52,65,14,500,'pollo, arroz, edamame, brócoli, zanahoria','Cociná cada componente y armá el bowl.'],
    ['lunch','Carne magra con papas','Bife magro con papas al horno y ensalada.',610,49,55,21,520,'carne magra, papa, hojas verdes, tomate','Cociná la carne a punto y acompañá con papas y ensalada.'],
    ['snack','Yogur proteico con frutos rojos','Yogur alto en proteína con fruta y semillas.',250,26,25,6,280,'yogur alto en proteína, frutos rojos, chía','Combiná y dejá reposar cinco minutos.'],
    ['snack','Rollitos de pavo y queso','Rollitos fríos de pavo, queso magro y pepino.',220,29,8,8,190,'pavo, queso magro, pepino, mostaza','Enrollá el pavo con queso y serví con pepino.'],
    ['dinner','Salmón con puré de arvejas','Salmón grillado con puré de arvejas y ensalada.',560,44,42,24,460,'salmón, arvejas, limón, hojas verdes','Grillá el salmón y procesá las arvejas calientes con limón.'],
    ['dinner','Chili de carne y porotos','Carne magra, porotos rojos, tomate y especias.',530,45,50,17,500,'carne magra, porotos rojos, tomate, cebolla, comino','Dorá la carne y cociná con el resto hasta espesar.'],
  ],
  vegetarian: [
    ['breakfast','Huevos con espinaca y tostada','Huevos revueltos, espinaca, tomate y pan integral.',370,23,38,15,300,'huevos, espinaca, tomate, pan integral','Salteá la espinaca, sumá huevos y serví con tostada.'],
    ['breakfast','Pancakes de avena y ricota','Pancakes suaves con avena, ricota, huevo y fruta.',410,25,52,12,330,'avena, ricota, huevo, banana, canela','Procesá la mezcla y cociná porciones en sartén.'],
    ['lunch','Ensalada de quinoa y huevo','Quinoa, huevo, vegetales, semillas y aderezo de limón.',460,24,52,18,420,'quinoa, huevos, pepino, tomate, semillas','Armá la ensalada con quinoa fría y huevos cocidos.'],
    ['lunch','Hamburguesas de lentejas','Medallones de lentejas con ensalada y pan integral.',520,25,72,15,440,'lentejas, avena, cebolla, huevo, pan integral, ensalada','Procesá, formá medallones y cociná hasta dorar.'],
    ['snack','Ricota con pera y nueces','Ricota cremosa con pera, nueces y canela.',270,17,28,11,250,'ricota, pera, nueces, canela','Serví la ricota con pera y nueces picadas.'],
    ['snack','Tostada caprese','Pan integral con mozzarella, tomate y albahaca.',290,15,34,11,220,'pan integral, mozzarella, tomate, albahaca','Tostá el pan y agregá mozzarella, tomate y albahaca.'],
    ['dinner','Curry de garbanzos y huevo','Curry suave con garbanzos, huevo, tomate y espinaca.',490,25,57,18,470,'garbanzos, huevos, espinaca, tomate, curry','Cociná la salsa, sumá garbanzos y terminá con huevo.'],
    ['dinner','Lasaña de berenjena y ricota','Capas de berenjena, ricota, tomate y mozzarella.',510,31,35,27,450,'berenjena, ricota, mozzarella, salsa de tomate','Armá capas y horneá hasta gratinar.'],
  ],
  vegan: [
    ['breakfast','Avena con frutos rojos','Avena con bebida vegetal, frutos rojos, chía y nueces.',360,12,55,12,350,'avena, bebida vegetal, frutos rojos, chía, nueces','Cociná la avena y terminá con fruta y semillas.'],
    ['breakfast','Tofu revuelto con arepa','Tofu especiado con tomate, espinaca y arepa de maíz.',390,22,43,15,340,'tofu, tomate, espinaca, cúrcuma, arepa','Dorá el tofu con vegetales y serví con arepa.'],
    ['lunch','Bowl de tofu y arroz integral','Tofu, arroz, brócoli, zanahoria y sésamo.',510,26,67,17,470,'tofu, arroz integral, brócoli, zanahoria, sésamo','Dorá el tofu y serví con arroz y vegetales.'],
    ['lunch','Quinoa con garbanzos','Quinoa, garbanzos, pepino, tomate y limón.',470,19,70,13,450,'quinoa, garbanzos, pepino, tomate, limón','Mezclá quinoa y garbanzos cocidos con vegetales.'],
    ['snack','Hummus con vegetales','Hummus con zanahoria, apio y pepino.',210,8,26,9,250,'hummus, zanahoria, apio, pepino','Cortá los vegetales y serví con hummus.'],
    ['snack','Barrita de avena y dátiles','Avena, dátiles, almendras y coco sin cocción.',230,6,35,9,100,'avena, dátiles, almendras, coco','Procesá, compactá y enfriá antes de cortar.'],
    ['dinner','Curry de garbanzos','Garbanzos, espinaca, coco, tomate y arroz integral.',530,19,76,18,500,'garbanzos, espinaca, leche de coco, tomate, arroz','Cociná el curry y serví con arroz integral.'],
    ['dinner','Tacos de frijoles y palta','Tortillas de maíz con frijoles, repollo, palta y salsa.',450,16,67,15,400,'frijoles negros, tortillas, repollo, palta, tomate','Calentá el relleno y armá los tacos.'],
  ],
  keto: [
    ['breakfast','Huevos con palta y panceta','Huevos revueltos, palta y panceta crocante.',480,27,8,39,300,'huevos, palta, panceta, manteca','Dorá la panceta y cociná los huevos en la misma sartén.'],
    ['breakfast','Muffins de huevo y queso','Muffins horneados con huevo, queso y espinaca.',390,29,7,28,260,'huevos, queso, espinaca, crema','Mezclá y horneá en moldes hasta que estén firmes.'],
    ['lunch','Ensalada César keto','Pollo, lechuga, parmesano, palta y aderezo cremoso.',520,42,10,35,400,'pollo, lechuga, parmesano, palta, mayonesa','Grillá el pollo y armá la ensalada con el aderezo.'],
    ['lunch','Carne con arroz de coliflor','Carne salteada con coliflor, queso y crema.',560,39,13,39,420,'carne, coliflor, queso, crema, especias','Salteá la carne y serví sobre coliflor procesada y cocida.'],
    ['snack','Nueces, queso y aceitunas','Tabla pequeña de queso, nueces y aceitunas.',310,13,7,26,140,'queso, nueces, aceitunas','Porcioná los ingredientes y serví.'],
    ['snack','Rollitos de jamón y mozzarella','Mozzarella envuelta en jamón con hojas verdes.',260,24,4,17,170,'jamón, mozzarella, hojas verdes','Armá los rollitos y serví fríos.'],
    ['dinner','Salmón con espárragos','Salmón en manteca con espárragos al ajo.',590,42,9,43,410,'salmón, espárragos, manteca, ajo','Cociná el salmón y salteá los espárragos en la misma sartén.'],
    ['dinner','Pollo al curry con coco','Pollo, leche de coco, pimiento y curry.',550,43,14,36,430,'pollo, leche de coco, pimiento, curry','Dorá el pollo y cociná con coco, pimiento y curry.'],
  ],
  low_carb: [
    ['breakfast','Omelette de champiñones','Huevos, champiñones, queso y rúcula.',360,27,9,24,290,'huevos, champiñones, queso, rúcula','Salteá champiñones y cociná el omelette con queso.'],
    ['breakfast','Yogur con semillas y frutilla','Yogur griego con frutillas, chía y almendras.',300,21,22,15,280,'yogur griego, frutillas, chía, almendras','Combiná todos los ingredientes.'],
    ['lunch','Wraps de lechuga con pollo','Hojas de lechuga rellenas de pollo, palta y vegetales.',430,40,18,23,380,'pollo, lechuga, palta, tomate, cebolla','Salteá el pollo y armá los wraps de lechuga.'],
    ['lunch','Bowl de carne y vegetales','Carne magra con brócoli, pimiento y sésamo.',480,41,21,25,430,'carne magra, brócoli, pimiento, sésamo','Salteá todo a fuego alto y terminá con sésamo.'],
    ['snack','Huevo, palta y tomate','Huevo duro con palta, tomate y pimienta.',240,13,10,17,230,'huevo, palta, tomate','Cortá y serví con pimienta y limón.'],
    ['snack','Queso cottage con pepino','Cottage, pepino, hierbas y semillas.',190,22,9,8,240,'queso cottage, pepino, hierbas, semillas','Mezclá y serví frío.'],
    ['dinner','Zapallitos rellenos de carne','Zapallitos con carne, tomate y queso gratinado.',470,39,20,26,450,'zapallitos, carne, tomate, queso','Rellená los zapallitos y horneá hasta gratinar.'],
    ['dinner','Pescado con puré de coliflor','Pescado grillado con coliflor cremosa y espinaca.',440,40,18,22,440,'pescado, coliflor, espinaca, manteca','Grillá el pescado y serví con puré de coliflor.'],
  ],
  gluten_free: [
    ['breakfast','Arepa con queso y tomate','Arepa certificada sin gluten con queso y tomate.',380,16,48,14,280,'harina de maíz, queso, tomate','Cociná la arepa y rellená con queso y tomate.'],
    ['breakfast','Porridge de quinoa y manzana','Quinoa cocida en leche con manzana y canela.',350,13,56,9,340,'quinoa, leche, manzana, canela, nueces','Cociná la quinoa con leche y sumá manzana y canela.'],
    ['lunch','Pollo con arroz y porotos','Pollo, arroz, porotos, tomate y palta.',570,42,70,15,500,'pollo, arroz, porotos, tomate, palta','Cociná los ingredientes y armá un bowl.'],
    ['lunch','Tortilla de papa y ensalada','Tortilla al horno con papa, huevo y cebolla.',490,23,48,23,430,'papa, huevos, cebolla, ensalada','Cociná la tortilla y acompañá con ensalada.'],
    ['snack','Galletas de arroz con ricota','Galletas de arroz, ricota, miel y fruta.',240,11,38,6,190,'galletas de arroz, ricota, miel, fruta','Untá las galletas y terminá con fruta.'],
    ['snack','Mix de yogur y granola sin TACC','Yogur con granola certificada y semillas.',270,14,35,9,250,'yogur, granola sin TACC, semillas','Serví el yogur con granola y semillas.'],
    ['dinner','Pastel de carne y mandioca','Carne especiada cubierta con puré de mandioca.',560,35,62,19,500,'carne, mandioca, cebolla, pimiento','Prepará el relleno, cubrí con puré y horneá.'],
    ['dinner','Risotto de hongos','Arroz cremoso con hongos, caldo y parmesano.',520,17,70,19,460,'arroz arborio, hongos, caldo, parmesano','Agregá caldo de a poco al arroz y terminá con hongos.'],
  ],
  paleo: [
    ['breakfast','Huevos con batata y palta','Huevos con cubos de batata, palta y espinaca.',460,24,38,25,380,'huevos, batata, palta, espinaca','Dorá la batata y serví con huevos, palta y espinaca.'],
    ['breakfast','Bowl de banana y almendras','Banana, frutos rojos, almendras, coco y chía.',390,9,50,19,330,'banana, frutos rojos, almendras, coco, chía','Cortá la fruta y serví con almendras y semillas.'],
    ['lunch','Pollo con calabaza asada','Pollo, calabaza, hojas verdes y semillas.',520,43,42,20,460,'pollo, calabaza, hojas verdes, semillas','Horneá pollo y calabaza y acompañá con hojas verdes.'],
    ['lunch','Ensalada de carne y palta','Carne grillada con hojas, palta, tomate y pepino.',500,39,20,30,420,'carne, palta, hojas verdes, tomate, pepino','Grillá la carne y serví sobre la ensalada.'],
    ['snack','Manzana con manteca de almendras','Manzana con manteca pura de almendras y canela.',260,6,34,13,220,'manzana, manteca de almendras, canela','Cortá la manzana y acompañá con manteca de almendras.'],
    ['snack','Huevo y mix de frutos secos','Huevos duros con almendras y nueces.',280,17,8,21,170,'huevos, almendras, nueces','Porcioná y serví.'],
    ['dinner','Pescado con vegetales y batata','Pescado al horno con vegetales y batata.',510,40,45,19,470,'pescado, batata, calabacín, pimiento','Horneá todo con hierbas y aceite.'],
    ['dinner','Albóndigas con zucchini','Albóndigas de carne con fideos de zucchini y tomate.',480,38,24,26,450,'carne, zucchini, tomate, huevo','Formá albóndigas, cocinalas en tomate y serví con zucchini.'],
  ],
  macrobiotic: [
    ['breakfast','Arroz integral con manzana','Arroz integral cremoso con manzana, sésamo y canela.',350,9,64,7,350,'arroz integral, manzana, sésamo, canela','Cociná el arroz hasta que esté cremoso y sumá manzana.'],
    ['breakfast','Sopa de miso con tofu','Miso suave con tofu, wakame y cebolla de verdeo.',210,15,23,7,380,'miso, tofu, alga wakame, verdeo','Hidratá el alga, calentá el caldo y agregá el miso al final.'],
    ['lunch','Bowl de arroz, aduki y zapallo','Arroz integral con porotos aduki, zapallo y hojas.',490,18,83,9,500,'arroz integral, porotos aduki, zapallo, hojas verdes','Cociná por separado y armá el bowl.'],
    ['lunch','Soba con tofu y vegetales','Fideos soba con tofu, repollo, zanahoria y sésamo.',510,24,72,14,470,'fideos soba, tofu, repollo, zanahoria, sésamo','Salteá tofu y vegetales y mezclá con los fideos.'],
    ['snack','Bolas de arroz y sésamo','Pequeñas bolas de arroz integral con sésamo tostado.',220,6,40,5,160,'arroz integral, sésamo, alga nori','Formá las bolas y cubrí con sésamo y nori.'],
    ['snack','Pera cocida con nueces','Pera tibia con canela y nueces.',210,4,33,9,230,'pera, nueces, canela','Cociná la pera suavemente y terminá con nueces.'],
    ['dinner','Sopa de cebada y vegetales','Sopa espesa con cebada, puerro, zanahoria y hongos.',430,16,75,8,520,'cebada, puerro, zanahoria, hongos','Cociná lentamente hasta que la cebada esté tierna.'],
    ['dinner','Tempeh con arroz y brócoli','Tempeh dorado con arroz integral, brócoli y jengibre.',520,29,68,16,470,'tempeh, arroz integral, brócoli, jengibre','Dorá el tempeh y serví con arroz y brócoli al vapor.'],
  ],
};

function buildRecipes(): DietRecipe[] {
  return (Object.entries(seeds) as Array<[DietKey, RecipeSeed[]]>).flatMap(([diet, recipes]) => recipes.map((seed, index) => {
    const [category, name, summary, calories, protein, carbs, fat, servingGrams, ingredientText, method] = seed;
    return {
      id: `${diet}-${index + 1}`,
      diet,
      category,
      name,
      summary,
      calories,
      protein,
      carbs,
      fat,
      servingGrams,
      ingredients: ingredientText.split(', '),
      instructions: ['Prepará y medí todos los ingredientes.', method, 'Serví la porción y ajustá el condimento a gusto.'],
    };
  }));
}

export const DIET_GUIDES = guides;
export const DIET_RECIPES = buildRecipes();

export function getDietGuide(key: string | undefined) {
  return DIET_GUIDES.find((diet) => diet.key === key);
}

export function getDietRecipes(key: string | undefined) {
  return DIET_RECIPES.filter((recipe) => recipe.diet === key);
}

export function getDietRecipe(id: string | undefined) {
  return DIET_RECIPES.find((recipe) => recipe.id === id);
}
