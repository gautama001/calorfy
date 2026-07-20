import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Settings
      personalize_goals: 'Personalize Your Goals',
      daily_calorie_goal: 'Daily Calorie Goal',
      macros: 'Macronutrients (Protein/Carbs/Fats)',
      protein: 'Protein',
      carbs: 'Carbs',
      fats: 'Fats',
      preferred_reminder_hour: 'Preferred Reminder Hour',
      dark_mode: 'Dark Mode',
      choose_language: 'Choose Language',
      save: 'Save',
      saved: 'Saved',
      settings_saved: 'Settings saved successfully!',
      language_changed: 'Language Changed',
      language_set_to: 'Language set to',

      // Upload
      upload_meal: 'Upload your meal',
      no_image_selected: 'No image selected',
      choose_from_gallery: 'Choose from Gallery',
      take_photo: 'Take Photo',
      analyze: 'Analyze',
      recently_uploaded: 'Recently Uploaded',
      analysisResult: 'Analysis Result',
      scannedMeal: 'Scanned Meal',
      saving: 'Saving...',
      saveMeal: 'Save Meal',
      category: 'Category',
      loggedAt: 'Logged at',

      // Tabs
      today: 'Today',
      scan: 'Scan',
      diets: 'Diets',
      goals: 'Goals',
      settings: 'Settings',

      // Diets
      explore_diets: 'Explore Diets',
      keto: 'Keto',
      paleo: 'Paleo',
      vegan: 'Vegan',
      mediterranean: 'Mediterranean',
      raw_food: 'Raw Food',
      macrobiotic: 'Macrobiotic',

      // Meals
      meals: 'Meals',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      snack: 'Snack',
      dinner: 'Dinner',
      editMeal: 'Edit Meal',
      youTappedOn: 'You tapped on',
      over: 'Over',
      left: 'Left',
      selectCategory: 'Select Category',
      pleaseSelectCategory: 'Please select a category',

      // Goals
      goals_saved: 'Your goal data has been saved!',
      target_weight: 'Target Weight',
      current_weight: 'Current Weight',
      height: 'Height (cm)',
      age: 'Age',
      sex: 'Sex (M/F)',
      underweight: 'Underweight',
      healthy: 'Healthy',
      overweight: 'Overweight',
      obese: 'Obese',
      bmiResult: 'Your BMI is',
      goal: 'Goal',
      diet: 'Diet',
      maintain_weight: 'Maintain weight',
      lose_weight: 'Lose weight',
      gain_weight: 'Gain weight',
      gain_muscle: 'Gain muscle',
      suggested_calories: 'Suggested daily calories',
      today_label: 'Today'
    },
  },
  es: {
    translation: {
      // Settings
      personalize_goals: 'Personaliza tus Metas',
      daily_calorie_goal: 'Meta Calórica Diaria',
      macros: 'Macronutrientes (Proteína/Carbohidratos/Grasas)',
      protein: 'Proteína',
      carbs: 'Carbohidratos',
      fats: 'Grasas',
      preferred_reminder_hour: 'Hora Preferida para Recordatorio',
      dark_mode: 'Modo Oscuro',
      choose_language: 'Elegir Idioma',
      save: 'Guardar',
      saved: 'Guardado',
      settings_saved: '¡Configuraciones guardadas exitosamente!',
      language_changed: 'Idioma Cambiado',
      language_set_to: 'Idioma cambiado a',

      // Upload
      upload_meal: 'Sube tu comida',
      no_image_selected: 'No se seleccionó imagen',
      choose_from_gallery: 'Elegir de la galería',
      take_photo: 'Tomar foto',
      analyze: 'Analizar',
      recently_uploaded: 'Subido recientemente',
      analysisResult: 'Resultado del Análisis',
      scannedMeal: 'Comida Escaneada',
      saving: 'Guardando...',
      saveMeal: 'Guardar Comida',
      category: 'Categoría',
      loggedAt: 'Registrado a las',

      // Tabs
      today: 'Hoy',
      scan: 'Escanear',
      diets: 'Dietas',
      goals: 'Metas',
      settings: 'Configuración',

      // Diets
      explore_diets: 'Explorar Dietas',
      keto: 'Keto',
      paleo: 'Paleo',
      vegan: 'Vegana',
      mediterranean: 'Mediterránea',
      raw_food: 'Crudivegana',
      macrobiotic: 'Macrobiótica',

      // Meals
      meals: 'Comidas',
      breakfast: 'Desayuno',
      lunch: 'Almuerzo',
      snack: 'Snack',
      dinner: 'Cena',
      editMeal: 'Editar Comida',
      youTappedOn: 'Tocaste',
      over: 'Excedido',
      left: 'Restante',
      selectCategory: 'Selecciona una Categoría',
      pleaseSelectCategory: 'Por favor, selecciona una categoría',

      // Goals
      goals_saved: '¡Tus metas fueron guardadas!',
      target_weight: 'Peso Objetivo',
      current_weight: 'Peso Actual',
      height: 'Altura (cm)',
      age: 'Edad',
      sex: 'Sexo (M/F)',
      underweight: 'Bajo peso',
      healthy: 'Saludable',
      overweight: 'Sobrepeso',
      obese: 'Obeso',
      bmiResult: 'Tu IMC es',
      goal: 'Objetivo',
      diet: 'Dieta',
      maintain_weight: 'Mantener peso',
      lose_weight: 'Bajar de peso',
      gain_weight: 'Subir de peso',
      gain_muscle: 'Ganar masa muscular',
      suggested_calories: 'Calorías diarias sugeridas',
      today_label: 'Hoy'
    },
  },
  pt: {
    translation: {
      // Settings
      personalize_goals: 'Personalize suas Metas',
      daily_calorie_goal: 'Meta Calórica Diária',
      macros: 'Macronutrientes (Proteína/Carboidratos/Gorduras)',
      protein: 'Proteína',
      carbs: 'Carboidratos',
      fats: 'Gorduras',
      preferred_reminder_hour: 'Hora Preferida para Lembrete',
      dark_mode: 'Modo Escuro',
      choose_language: 'Escolher Idioma',
      save: 'Salvar',
      saved: 'Salvo',
      settings_saved: 'Configurações salvas com sucesso!',
      language_changed: 'Idioma Alterado',
      language_set_to: 'Idioma alterado para',

      // Upload
      upload_meal: 'Carregue sua refeição',
      no_image_selected: 'Nenhuma imagem selecionada',
      choose_from_gallery: 'Escolher da Galeria',
      take_photo: 'Tirar foto',
      analyze: 'Analisar',
      recently_uploaded: 'Recentemente carregado',
      analysisResult: 'Resultado da Análise',
      scannedMeal: 'Refeição Escaneada',
      saving: 'Salvando...',
      saveMeal: 'Salvar Refeição',
      category: 'Categoria',
      loggedAt: 'Registrado às',

      // Tabs
      today: 'Hoje',
      scan: 'Escanear',
      diets: 'Dietas',
      goals: 'Metas',
      settings: 'Configurações',

      // Diets
      explore_diets: 'Explorar Dietas',
      keto: 'Keto',
      paleo: 'Paleo',
      vegan: 'Vegano',
      mediterranean: 'Mediterrânea',
      raw_food: 'Comida Crua',
      macrobiotic: 'Macrobiótica',

      // Meals
      meals: 'Refeições',
      breakfast: 'Café da manhã',
      lunch: 'Almoço',
      snack: 'Lanche',
      dinner: 'Jantar',
      editMeal: 'Editar Refeição',
      youTappedOn: 'Você selecionou',
      over: 'Acima',
      left: 'Restante',
      selectCategory: 'Selecionar Categoria',
      pleaseSelectCategory: 'Por favor, selecione uma categoria',

      // Goals
      goals_saved: 'Suas metas foram salvas!',
      target_weight: 'Peso Alvo',
      current_weight: 'Peso Atual',
      height: 'Altura (cm)',
      age: 'Idade',
      sex: 'Sexo (M/F)',
      underweight: 'Abaixo do peso',
      healthy: 'Saudável',
      overweight: 'Sobrepeso',
      obese: 'Obeso',
      bmiResult: 'Seu IMC é',
      goal: 'Objetivo',
      diet: 'Dieta',
      maintain_weight: 'Manter peso',
      lose_weight: 'Perder peso',
      gain_weight: 'Ganhar peso',
      gain_muscle: 'Ganhar massa muscular',
      suggested_calories: 'Calorias diárias sugeridas',
      today_label: 'Hoje'
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
