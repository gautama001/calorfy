import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { type LanguageDetectorAsyncModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import { Platform } from 'react-native';

const supportedLanguages = ['es', 'en', 'pt'] as const;

function deviceLanguage() {
  const language = getLocales()[0]?.languageCode ?? 'es';
  return supportedLanguages.includes(language as (typeof supportedLanguages)[number]) ? language : 'es';
}

const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      callback(deviceLanguage());
      return;
    }
    AsyncStorage.getItem('appLanguage')
      .then((saved) => callback(saved ?? deviceLanguage()))
      .catch(() => callback(deviceLanguage()));
  },
  init: () => undefined,
  cacheUserLanguage: (language) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    void AsyncStorage.setItem('appLanguage', language);
  },
};

const en = {
  personalize_goals: 'Personalize your goals', daily_calorie_goal: 'Daily calorie goal', macros: 'Macronutrients',
  protein: 'Protein', carbs: 'Carbs', fats: 'Fats', calories: 'Calories', preferred_reminder_hour: 'Preferred reminder time', dark_mode: 'Dark mode',
  choose_language: 'Choose language', save: 'Save', saved: 'Saved', settings_saved: 'Settings saved successfully!',
  language_changed: 'Language changed', language_set_to: 'Language set to', error: 'Error',
  error_loading_settings: 'There was a problem loading the settings.', error_saving_settings: 'There was a problem saving the settings.',
  error_changing_language: 'Could not change language.', please_enter_valid_numbers: 'Please enter valid numeric values.',
  upload_meal: 'Upload your meal', no_image_selected: 'No image selected', choose_from_gallery: 'Choose from gallery', take_photo: 'Take photo',
  analyze: 'Analyze', recently_uploaded: 'Recently uploaded', analysisResult: 'Analysis result', scannedMeal: 'Scanned meal', saving: 'Saving...',
  saveMeal: 'Save meal', category: 'Category', loggedAt: 'Logged at', today: 'Today', scan: 'Scan', diets: 'Diets', goals: 'Goals', settings: 'Settings',
  explore_diets: 'Explore diets', keto: 'Keto', paleo: 'Paleo', vegan: 'Vegan', mediterranean: 'Mediterranean', raw_food: 'Raw food', macrobiotic: 'Macrobiotic', balanced: 'Balanced',
  meals: 'Meals', breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner', editMeal: 'Edit meal', youTappedOn: 'You tapped on',
  over: 'Over', left: 'Left', selectCategory: 'Select category', pleaseSelectCategory: 'Please select a category',
  goals_saved: 'Your goal plan has been saved.', target_weight: 'Target weight', current_weight: 'Current weight', height: 'Height', age: 'Age', sex: 'Sex',
  female: 'Female', male: 'Male', other: 'Other', prefer_not_to_say: 'Prefer not to say', underweight: 'Underweight', healthy: 'Healthy', overweight: 'Overweight', obese: 'Obesity range',
  bmiResult: 'BMI', goal: 'Goal', diet: 'Eating style', maintain_weight: 'Maintain weight', lose_weight: 'Lose weight', gain_weight: 'Gain weight', gain_muscle: 'Gain muscle',
  suggested_calories: 'Suggested daily calories', today_label: 'Today', progress: 'Progress', weight_progress: 'Weight progress', weight_trend: 'Weight trend',
  weight_history: 'Recent records', start_weight: 'Starting weight', start_label: 'Start', total_change: 'Total change', weekly_change: 'Last 7 days', remaining: 'Remaining',
  completed: 'completed', goal_line: 'Goal', measurements: 'records', add_first_weight: 'Save your first weight to start seeing your trend.',
  add_more_weights: 'Add at least two records on different days to unlock the chart.', save_today_weight: "Save today's weight", plan_summary: 'Daily plan',
  personal_details: 'Personal details', goal_preferences: 'Goal and preferences', estimated_plan_note: 'This is an estimate for guidance and does not replace professional advice.',
  sync_pending_title: 'Sync pending', sync_pending_body: 'We are showing the data saved on this device.', goals_save_error_title: 'We could not save your goals',
  weight_save_error_title: 'We could not save your weight', connection_retry: 'Check your connection and try again.', latest_records: 'Latest records', no_change: 'No change yet',
  range_7d: '7 days', range_1m: '1 month', range_12m: '12 months',
  discover: 'Discover', diet_explorer_intro: 'Explore practical eating styles, understand their foundations and find recipes ready to add to your diary.',
  search_diets: 'Search diets or approaches', diet_types: 'eating styles', recipes: 'recipes', no_diets_found: 'No eating styles match your search.',
  diet_not_found: 'Eating style not found.', diet_guidance_note: 'Use this guide as general information. Adapt it to your health, preferences and professional guidance.',
  recipe_library: 'Recipe library', nutrition_per_serving: 'Nutrition per serving', recipe_not_found: 'Recipe not found.', portion: 'Serving', ingredients: 'Ingredients',
  preparation: 'Preparation', add_to_diary: 'Add to diary', servings: 'Servings', meal_time: 'Meal time', add_recipe_to_today: "Add recipe to today",
  recipe_nutrition_note: 'Nutrition values are estimates and may vary by ingredients, brands and preparation.', added_to_diary: 'Added to diary',
  recipe_added_message: 'The recipe and its nutrition are now part of today.', view_today: 'View today', continue_exploring: 'Continue exploring', could_not_add_recipe: 'We could not add the recipe',
  session_required: 'Sign in again to add this recipe.',
  back_to_recipes: 'Back to recipes',
  weekly_plan: 'Weekly plan', personalized: 'Planning', weekly_plan_title: 'Your week',
  weekly_plan_intro: 'Meals organized around your goal, with portions you can adjust and recipes you can swap.',
  weekly_plan_error: 'We could not update your plan', build_your_week: 'Build your week', generate_weekly_plan: 'Generate weekly plan',
  daily_target: 'daily target', planned_for_day: 'planned for the day', swap: 'Swap', added: 'Added',
  plan_cta_title: 'Your weekly plan', plan_cta_body: 'Organize 7 days of meals and adapt portions to your goal.',
  choose_plan_style: 'Choose eating style', change_eating_style: 'Change eating style', apply_to_plan: 'Apply to plan', cancel: 'Cancel',
  settings_eyebrow: 'Preferences', settings_title: 'Settings', settings_intro: 'Adjust your nutrition and how Calorfy works for you.',
  nutrition_targets: 'Nutrition targets', automatic_recommendation: 'Automatic recommendation', manual_targets: 'Manual targets',
  based_on_your_profile: 'Based on your goal, current weight and eating style.', use_recommendation: 'Use recommendation', edit_manually: 'Edit manually',
  calorie_target: 'Calorie target', macro_distribution: 'Macro distribution', recommendation_note: 'These values are an estimate and can be adjusted at any time.',
  configured_for: 'Configured for', preferences: 'Preferences', appearance: 'Appearance', reminders: 'Reminders', language: 'Language',
  reminder_hint: 'Daily reminder time', profile_incomplete: 'Complete your profile in Goals for a more precise recommendation.', saving_changes: 'Saving changes...',
  high_protein: 'High protein', vegetarian: 'Vegetarian', low_carb: 'Low carb', gluten_free: 'Gluten-free',
  resting_energy: 'Resting metabolism', sedentary_maintenance: 'Maintenance without exercise', goal_adjustment: 'Goal adjustment',
};

const es: typeof en = {
  personalize_goals: 'Personalizá tus objetivos', daily_calorie_goal: 'Objetivo calórico diario', macros: 'Macronutrientes',
  protein: 'Proteínas', carbs: 'Carbohidratos', fats: 'Grasas', calories: 'Calorías', preferred_reminder_hour: 'Hora preferida del recordatorio', dark_mode: 'Modo oscuro',
  choose_language: 'Elegir idioma', save: 'Guardar', saved: 'Guardado', settings_saved: 'La configuración se guardó correctamente.',
  language_changed: 'Idioma actualizado', language_set_to: 'Idioma configurado en', error: 'Error',
  error_loading_settings: 'No pudimos cargar la configuración.', error_saving_settings: 'No pudimos guardar la configuración.',
  error_changing_language: 'No pudimos cambiar el idioma.', please_enter_valid_numbers: 'Ingresá valores numéricos válidos.',
  upload_meal: 'Subí tu comida', no_image_selected: 'No seleccionaste una imagen', choose_from_gallery: 'Elegir de la galería', take_photo: 'Tomar foto',
  analyze: 'Analizar', recently_uploaded: 'Subido recientemente', analysisResult: 'Resultado del análisis', scannedMeal: 'Comida escaneada', saving: 'Guardando...',
  saveMeal: 'Guardar comida', category: 'Categoría', loggedAt: 'Registrado a las', today: 'Hoy', scan: 'Escanear', diets: 'Dietas', goals: 'Objetivos', settings: 'Ajustes',
  explore_diets: 'Explorar dietas', keto: 'Keto', paleo: 'Paleo', vegan: 'Vegana', mediterranean: 'Mediterránea', raw_food: 'Crudivegana', macrobiotic: 'Macrobiótica', balanced: 'Equilibrada',
  meals: 'Comidas', breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Merienda', dinner: 'Cena', editMeal: 'Editar comida', youTappedOn: 'Seleccionaste',
  over: 'Excedido', left: 'Restante', selectCategory: 'Seleccionar categoría', pleaseSelectCategory: 'Seleccioná una categoría',
  goals_saved: 'Tu plan de objetivos quedó guardado.', target_weight: 'Peso objetivo', current_weight: 'Peso actual', height: 'Altura', age: 'Edad', sex: 'Sexo',
  female: 'Femenino', male: 'Masculino', other: 'Otro', prefer_not_to_say: 'Prefiero no decirlo', underweight: 'Bajo peso', healthy: 'Saludable', overweight: 'Sobrepeso', obese: 'Rango de obesidad',
  bmiResult: 'IMC', goal: 'Objetivo', diet: 'Estilo de alimentación', maintain_weight: 'Mantener el peso', lose_weight: 'Bajar de peso', gain_weight: 'Subir de peso', gain_muscle: 'Ganar masa muscular',
  suggested_calories: 'Calorías diarias sugeridas', today_label: 'Hoy', progress: 'Progreso', weight_progress: 'Progreso de peso', weight_trend: 'Evolución del peso',
  weight_history: 'Registros recientes', start_weight: 'Peso inicial', start_label: 'Inicio', total_change: 'Cambio total', weekly_change: 'Últimos 7 días', remaining: 'Faltan',
  completed: 'completado', goal_line: 'Objetivo', measurements: 'registros', add_first_weight: 'Guardá tu primer peso para empezar a ver la evolución.',
  add_more_weights: 'Agregá al menos dos registros en días distintos para habilitar la gráfica.', save_today_weight: 'Guardar peso de hoy', plan_summary: 'Plan diario',
  personal_details: 'Datos personales', goal_preferences: 'Objetivo y preferencias', estimated_plan_note: 'Es una estimación orientativa y no reemplaza el consejo de un profesional.',
  sync_pending_title: 'Sincronización pendiente', sync_pending_body: 'Mostramos los datos guardados en este dispositivo.', goals_save_error_title: 'No pudimos guardar tus objetivos',
  weight_save_error_title: 'No pudimos guardar tu peso', connection_retry: 'Revisá la conexión e intentá otra vez.', latest_records: 'Últimos registros', no_change: 'Sin cambios todavía',
  range_7d: '7 días', range_1m: '1 mes', range_12m: '12 meses',
  discover: 'Descubrir', diet_explorer_intro: 'Explorá estilos de alimentación prácticos, entendé sus bases y encontrá recetas listas para sumar al diario.',
  search_diets: 'Buscar dietas o enfoques', diet_types: 'estilos de alimentación', recipes: 'recetas', no_diets_found: 'No encontramos estilos que coincidan con tu búsqueda.',
  diet_not_found: 'No encontramos este estilo de alimentación.', diet_guidance_note: 'Usá esta guía como información general. Adaptala a tu salud, preferencias y acompañamiento profesional.',
  recipe_library: 'Biblioteca de recetas', nutrition_per_serving: 'Nutrición por porción', recipe_not_found: 'No encontramos esta receta.', portion: 'Porción', ingredients: 'Ingredientes',
  preparation: 'Preparación', add_to_diary: 'Agregar al diario', servings: 'Porciones', meal_time: 'Momento del día', add_recipe_to_today: 'Agregar receta a hoy',
  recipe_nutrition_note: 'Los valores nutricionales son estimados y pueden variar según ingredientes, marcas y preparación.', added_to_diary: 'Agregada al diario',
  recipe_added_message: 'La receta y sus nutrientes ya forman parte del día de hoy.', view_today: 'Ver Hoy', continue_exploring: 'Seguir explorando', could_not_add_recipe: 'No pudimos agregar la receta',
  session_required: 'Volvé a iniciar sesión para agregar esta receta.',
  back_to_recipes: 'Volver a las recetas',
  weekly_plan: 'Plan semanal', personalized: 'Planificación', weekly_plan_title: 'Tu semana',
  weekly_plan_intro: 'Comidas organizadas según tu objetivo, con porciones ajustables y recetas que podés intercambiar.',
  weekly_plan_error: 'No pudimos actualizar tu plan', build_your_week: 'Armá tu semana', generate_weekly_plan: 'Generar plan semanal',
  daily_target: 'objetivo diario', planned_for_day: 'planificado para el día', swap: 'Cambiar', added: 'Agregado',
  plan_cta_title: 'Tu plan semanal', plan_cta_body: 'Organizá 7 días de comidas y adaptá las porciones a tu objetivo.',
  choose_plan_style: 'Elegí el estilo de alimentación', change_eating_style: 'Cambiar estilo', apply_to_plan: 'Aplicar al plan', cancel: 'Cancelar',
  settings_eyebrow: 'Preferencias', settings_title: 'Configuración', settings_intro: 'Ajustá tu nutrición y la forma en que Calorfy funciona para vos.',
  nutrition_targets: 'Objetivos nutricionales', automatic_recommendation: 'Recomendación automática', manual_targets: 'Objetivos manuales',
  based_on_your_profile: 'Calculada según tu objetivo, peso actual y estilo de alimentación.', use_recommendation: 'Usar recomendación', edit_manually: 'Editar manualmente',
  calorie_target: 'Objetivo calórico', macro_distribution: 'Distribución de macros', recommendation_note: 'Estos valores son una estimación y podés ajustarlos cuando quieras.',
  configured_for: 'Configurado para', preferences: 'Preferencias', appearance: 'Apariencia', reminders: 'Recordatorios', language: 'Idioma',
  reminder_hint: 'Hora del recordatorio diario', profile_incomplete: 'Completá tu perfil en Objetivos para recibir una recomendación más precisa.', saving_changes: 'Guardando cambios...',
  high_protein: 'Alta en proteínas', vegetarian: 'Vegetariana', low_carb: 'Baja en carbohidratos', gluten_free: 'Sin gluten',
  resting_energy: 'Metabolismo en reposo', sedentary_maintenance: 'Mantenimiento sin ejercicio', goal_adjustment: 'Ajuste por objetivo',
};

const pt: typeof en = {
  personalize_goals: 'Personalize seus objetivos', daily_calorie_goal: 'Meta calórica diária', macros: 'Macronutrientes',
  protein: 'Proteínas', carbs: 'Carboidratos', fats: 'Gorduras', calories: 'Calorias', preferred_reminder_hour: 'Horário preferido do lembrete', dark_mode: 'Modo escuro',
  choose_language: 'Escolher idioma', save: 'Salvar', saved: 'Salvo', settings_saved: 'As configurações foram salvas.',
  language_changed: 'Idioma atualizado', language_set_to: 'Idioma definido como', error: 'Erro',
  error_loading_settings: 'Não foi possível carregar as configurações.', error_saving_settings: 'Não foi possível salvar as configurações.',
  error_changing_language: 'Não foi possível alterar o idioma.', please_enter_valid_numbers: 'Insira valores numéricos válidos.',
  upload_meal: 'Envie sua refeição', no_image_selected: 'Nenhuma imagem selecionada', choose_from_gallery: 'Escolher da galeria', take_photo: 'Tirar foto',
  analyze: 'Analisar', recently_uploaded: 'Enviado recentemente', analysisResult: 'Resultado da análise', scannedMeal: 'Refeição escaneada', saving: 'Salvando...',
  saveMeal: 'Salvar refeição', category: 'Categoria', loggedAt: 'Registrado às', today: 'Hoje', scan: 'Escanear', diets: 'Dietas', goals: 'Objetivos', settings: 'Ajustes',
  explore_diets: 'Explorar dietas', keto: 'Keto', paleo: 'Paleo', vegan: 'Vegana', mediterranean: 'Mediterrânea', raw_food: 'Alimentação crua', macrobiotic: 'Macrobiótica', balanced: 'Equilibrada',
  meals: 'Refeições', breakfast: 'Café da manhã', lunch: 'Almoço', snack: 'Lanche', dinner: 'Jantar', editMeal: 'Editar refeição', youTappedOn: 'Você selecionou',
  over: 'Acima', left: 'Restante', selectCategory: 'Selecionar categoria', pleaseSelectCategory: 'Selecione uma categoria',
  goals_saved: 'Seu plano de objetivos foi salvo.', target_weight: 'Peso alvo', current_weight: 'Peso atual', height: 'Altura', age: 'Idade', sex: 'Sexo',
  female: 'Feminino', male: 'Masculino', other: 'Outro', prefer_not_to_say: 'Prefiro não informar', underweight: 'Abaixo do peso', healthy: 'Saudável', overweight: 'Sobrepeso', obese: 'Faixa de obesidade',
  bmiResult: 'IMC', goal: 'Objetivo', diet: 'Estilo alimentar', maintain_weight: 'Manter o peso', lose_weight: 'Perder peso', gain_weight: 'Ganhar peso', gain_muscle: 'Ganhar massa muscular',
  suggested_calories: 'Calorias diárias sugeridas', today_label: 'Hoje', progress: 'Progresso', weight_progress: 'Progresso de peso', weight_trend: 'Evolução do peso',
  weight_history: 'Registros recentes', start_weight: 'Peso inicial', start_label: 'Início', total_change: 'Mudança total', weekly_change: 'Últimos 7 dias', remaining: 'Restam',
  completed: 'concluído', goal_line: 'Meta', measurements: 'registros', add_first_weight: 'Salve seu primeiro peso para começar a acompanhar a evolução.',
  add_more_weights: 'Adicione pelo menos dois registros em dias diferentes para liberar o gráfico.', save_today_weight: 'Salvar peso de hoje', plan_summary: 'Plano diário',
  personal_details: 'Dados pessoais', goal_preferences: 'Objetivo e preferências', estimated_plan_note: 'Esta é uma estimativa orientativa e não substitui aconselhamento profissional.',
  sync_pending_title: 'Sincronização pendente', sync_pending_body: 'Estamos mostrando os dados salvos neste dispositivo.', goals_save_error_title: 'Não foi possível salvar seus objetivos',
  weight_save_error_title: 'Não foi possível salvar seu peso', connection_retry: 'Verifique a conexão e tente novamente.', latest_records: 'Últimos registros', no_change: 'Ainda sem mudanças',
  range_7d: '7 dias', range_1m: '1 mês', range_12m: '12 meses',
  discover: 'Descobrir', diet_explorer_intro: 'Explore estilos alimentares práticos, entenda suas bases e encontre receitas prontas para adicionar ao diário.',
  search_diets: 'Buscar dietas ou abordagens', diet_types: 'estilos alimentares', recipes: 'receitas', no_diets_found: 'Nenhum estilo corresponde à sua busca.',
  diet_not_found: 'Estilo alimentar não encontrado.', diet_guidance_note: 'Use este guia como informação geral. Adapte-o à sua saúde, preferências e orientação profissional.',
  recipe_library: 'Biblioteca de receitas', nutrition_per_serving: 'Nutrição por porção', recipe_not_found: 'Receita não encontrada.', portion: 'Porção', ingredients: 'Ingredientes',
  preparation: 'Preparo', add_to_diary: 'Adicionar ao diário', servings: 'Porções', meal_time: 'Momento da refeição', add_recipe_to_today: 'Adicionar receita a hoje',
  recipe_nutrition_note: 'Os valores nutricionais são estimados e podem variar conforme ingredientes, marcas e preparo.', added_to_diary: 'Adicionada ao diário',
  recipe_added_message: 'A receita e seus nutrientes agora fazem parte do dia de hoje.', view_today: 'Ver Hoje', continue_exploring: 'Continuar explorando', could_not_add_recipe: 'Não foi possível adicionar a receita',
  session_required: 'Entre novamente para adicionar esta receita.',
  back_to_recipes: 'Voltar às receitas',
  weekly_plan: 'Plano semanal', personalized: 'Planejamento', weekly_plan_title: 'Sua semana',
  weekly_plan_intro: 'Refeições organizadas segundo sua meta, com porções ajustáveis e receitas intercambiáveis.',
  weekly_plan_error: 'Não foi possível atualizar seu plano', build_your_week: 'Monte sua semana', generate_weekly_plan: 'Gerar plano semanal',
  daily_target: 'meta diária', planned_for_day: 'planejado para o dia', swap: 'Trocar', added: 'Adicionado',
  plan_cta_title: 'Seu plano semanal', plan_cta_body: 'Organize 7 dias de refeições e adapte as porções à sua meta.',
  choose_plan_style: 'Escolha o estilo alimentar', change_eating_style: 'Alterar estilo', apply_to_plan: 'Aplicar ao plano', cancel: 'Cancelar',
  settings_eyebrow: 'Preferências', settings_title: 'Configurações', settings_intro: 'Ajuste sua nutrição e a forma como o Calorfy funciona para você.',
  nutrition_targets: 'Metas nutricionais', automatic_recommendation: 'Recomendação automática', manual_targets: 'Metas manuais',
  based_on_your_profile: 'Calculada conforme sua meta, peso atual e estilo alimentar.', use_recommendation: 'Usar recomendação', edit_manually: 'Editar manualmente',
  calorie_target: 'Meta calórica', macro_distribution: 'Distribuição de macros', recommendation_note: 'Estes valores são uma estimativa e podem ser ajustados quando quiser.',
  configured_for: 'Configurado para', preferences: 'Preferências', appearance: 'Aparência', reminders: 'Lembretes', language: 'Idioma',
  reminder_hint: 'Horário do lembrete diário', profile_incomplete: 'Complete seu perfil em Objetivos para receber uma recomendação mais precisa.', saving_changes: 'Salvando alterações...',
  high_protein: 'Alta em proteínas', vegetarian: 'Vegetariana', low_carb: 'Baixa em carboidratos', gluten_free: 'Sem glúten',
  resting_energy: 'Metabolismo em repouso', sedentary_maintenance: 'Manutenção sem exercício', goal_adjustment: 'Ajuste pela meta',
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es }, pt: { translation: pt } },
    fallbackLng: 'es',
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
