// Diet calculation utilities

export interface UserData {
  name: string;
  age: number;
  sex: 'masculino' | 'feminino';
  height: number; // cm
  weight: number; // kg
  goal: 'emagrecer-rapido' | 'secar-barriga' | 'perder-5kg' | 'manter-peso';
  activityLevel: 'sedentario' | 'leve' | 'moderado' | 'intenso';
  restrictions: string[];
  favoriteFoods?: string[]; // New field for favorite foods
}

export interface Meal {
  name: string;
  foods: {
    item: string;
    portion: string;
    substitutes?: string[];
  }[];
  time?: string;
}

export interface DietPlan {
  bmr: number;
  tdee: number;
  targetCalories: number;
  dietFocus: string;
  mealsPerDay: number;
  meals: {
    breakfast: Meal;
    morningSnack: Meal;
    lunch: Meal;
    afternoonSnack: Meal;
    dinner: Meal;
  };
  favoriteFoods?: string[];
}

// Available foods for selection with emoji icons
export const availableFoods = {
  proteins: [
    { id: 'frango', label: 'Pollo', emoji: '🍗' },
    { id: 'peixe', label: 'Pescado', emoji: '🐟' },
    { id: 'carne-bovina', label: 'Carne de Res', emoji: '🥩' },
    { id: 'ovos', label: 'Huevos', emoji: '🥚' },
    { id: 'tofu', label: 'Tofu', emoji: '🧈' },
    { id: 'lentilha', label: 'Lentejas', emoji: '🫘' },
    { id: 'grao-de-bico', label: 'Garbanzos', emoji: '🫛' },
    { id: 'peru', label: 'Pavo', emoji: '🦃' },
  ],
  carbs: [
    { id: 'arroz-integral', label: 'Arroz Integral', emoji: '🍚' },
    { id: 'batata-doce', label: 'Batata (Camote)', emoji: '🍠' },
    { id: 'pao-integral', label: 'Pan Integral', emoji: '🍞' },
    { id: 'aveia', label: 'Avena', emoji: '🥣' },
    { id: 'tapioca', label: 'Tapioca', emoji: '🫓' },
    { id: 'quinoa', label: 'Quinua', emoji: '🌾' },
    { id: 'macarrao-integral', label: 'Pasta Integral', emoji: '🍝' },
    { id: 'cuscuz', label: 'Cuscús', emoji: '🥘' },
  ],
  vegetables: [
    { id: 'brocolis', label: 'Brócoli', emoji: '🥦' },
    { id: 'espinafre', label: 'Espinaca', emoji: '🥬' },
    { id: 'cenoura', label: 'Zanahoria', emoji: '🥕' },
    { id: 'abobrinha', label: 'Calabacín', emoji: '🥒' },
    { id: 'tomate', label: 'Tomate', emoji: '🍅' },
    { id: 'pepino', label: 'Pepino', emoji: '🥒' },
    { id: 'couve', label: 'Col Rizada (Kale)', emoji: '🥗' },
    { id: 'alface', label: 'Lechuga', emoji: '🥬' },
  ],
  fruits: [
    { id: 'banana', label: 'Banana', emoji: '🍌' },
    { id: 'maca', label: 'Manzana', emoji: '🍎' },
    { id: 'laranja', label: 'Naranja', emoji: '🍊' },
    { id: 'morango', label: 'Fresa', emoji: '🍓' },
    { id: 'mamao', label: 'Papaya', emoji: '🥭' },
    { id: 'abacate', label: 'Aguacate', emoji: '🥑' },
    { id: 'melao', label: 'Melón', emoji: '🍈' },
    { id: 'uva', label: 'Uvas', emoji: '🍇' },
  ],
  sweets: [
    { id: 'chocolate-70', label: 'Chocolate 70%', emoji: '🍫' },
    { id: 'doce-de-leite', label: 'Dulce de Leche', emoji: '🍯' },
    { id: 'brigadeiro', label: 'Brigadeiro (Trufa)', emoji: '🍘' },
    { id: 'pacoca', label: 'Paçoca (Dulce de Maní)', emoji: '🥜' },
    { id: 'sorvete', label: 'Helado', emoji: '🍦' },
    { id: 'gelatina', label: 'Gelatina', emoji: '🍮' },
  ],
};

// Calculate BMR using Mifflin-St Jeor equation
export function calculateBMR(weight: number, height: number, age: number, sex: 'masculino' | 'feminino'): number {
  if (sex === 'masculino') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

// Calculate TDEE based on activity level
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    'sedentario': 1.2,
    'leve': 1.375,
    'moderado': 1.55,
    'intenso': 1.725,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
}

// Calculate target calories based on goal
export function calculateTargetCalories(tdee: number, goal: string): number {
  const deficits: Record<string, number> = {
    'emagrecer-rapido': 0.75, // 25% deficit
    'secar-barriga': 0.80, // 20% deficit
    'perder-5kg': 0.85, // 15% deficit
    'manter-peso': 1.0, // maintenance
  };
  return Math.round(tdee * (deficits[goal] || 0.85));
}

// Determine diet focus based on goal
export function getDietFocus(goal: string): string {
  const focuses: Record<string, string> = {
    'emagrecer-rapido': 'Low Carb Moderado',
    'secar-barriga': 'Anti-inflamatória',
    'perder-5kg': 'Equilibrada',
    'manter-peso': 'Equilibrada',
  };
  return focuses[goal] || 'Equilibrada';
}

// Helper to check if user has a favorite food
function hasFavorite(favorites: string[] | undefined, foodId: string): boolean {
  return favorites?.includes(foodId) ?? false;
}

// Get preferred protein based on favorites
function getPreferredProtein(favorites: string[] | undefined, vegetarian: boolean): string[] {
  const allProteins = vegetarian
    ? [
      { id: 'ovos', option: '2 huevos revueltos' },
      { id: 'tofu', option: '3 cucharadas de tofu revuelto' },
      { id: 'lentilha', option: '150g de lentejas' },
      { id: 'grao-de-bico', option: '150g de garbanzos' },
    ]
    : [
      { id: 'frango', option: '150g de pollo a la plancha' },
      { id: 'peixe', option: '150g de pescado al horno' },
      { id: 'carne-bovina', option: '120g de carne magra' },
      { id: 'ovos', option: '2 huevos revueltos' },
      { id: 'peru', option: '2 rebanadas de pechuga de pavo' },
    ];

  // Sort by favorites first
  const sorted = allProteins.sort((a, b) => {
    const aFav = hasFavorite(favorites, a.id) ? 0 : 1;
    const bFav = hasFavorite(favorites, b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return sorted.map(p => p.option);
}

// Get preferred carbs based on favorites
function getPreferredCarbs(favorites: string[] | undefined, noGluten: boolean): string[] {
  const allCarbs = noGluten
    ? [
      { id: 'tapioca', option: '1 tapioca mediana' },
      { id: 'batata-doce', option: '2 camotes medianos' },
      { id: 'arroz-integral', option: '4 cucharadas de arroz integral' },
      { id: 'quinoa', option: '3 cucharadas de quinua' },
      { id: 'cuscuz', option: '3 cucharadas de cuscús' },
    ]
    : [
      { id: 'arroz-integral', option: '4 cucharadas de arroz integral' },
      { id: 'pao-integral', option: '2 rebanadas de pan integral' },
      { id: 'batata-doce', option: '2 camotes medianos' },
      { id: 'aveia', option: '3 cucharadas de avena' },
      { id: 'tapioca', option: '1 tapioca mediana' },
      { id: 'macarrao-integral', option: '3 cucharadas de pasta integral' },
      { id: 'quinoa', option: '3 cucharadas de quinua' },
    ];

  const sorted = allCarbs.sort((a, b) => {
    const aFav = hasFavorite(favorites, a.id) ? 0 : 1;
    const bFav = hasFavorite(favorites, b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return sorted.map(c => c.option);
}

// Get preferred fruits based on favorites
function getPreferredFruits(favorites: string[] | undefined): string[] {
  const allFruits = [
    { id: 'banana', option: '1 banana mediana' },
    { id: 'maca', option: '1 manzana mediana' },
    { id: 'mamao', option: '1 rebanada de papaya' },
    { id: 'laranja', option: '1 naranja mediana' },
    { id: 'morango', option: '10 fresas' },
    { id: 'melao', option: '1 rebanada de melón' },
    { id: 'abacate', option: '½ aguacate pequeño' },
    { id: 'uva', option: '1 racimo pequeño de uvas' },
  ];

  const sorted = allFruits.sort((a, b) => {
    const aFav = hasFavorite(favorites, a.id) ? 0 : 1;
    const bFav = hasFavorite(favorites, b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return sorted.map(f => f.option);
}

// Get preferred vegetables based on favorites
function getPreferredVegetables(favorites: string[] | undefined): string[] {
  const allVeggies = [
    { id: 'brocolis', option: 'brócoli salteado' },
    { id: 'espinafre', option: 'espinaca salteada' },
    { id: 'cenoura', option: 'zanahoria cocida' },
    { id: 'abobrinha', option: 'calabacín a la parrilla' },
    { id: 'couve', option: 'kale salteado' },
    { id: 'alface', option: 'ensalada de lechuga' },
    { id: 'tomate', option: 'ensalada de tomate' },
    { id: 'pepino', option: 'ensalada de pepino' },
  ];

  const sorted = allVeggies.sort((a, b) => {
    const aFav = hasFavorite(favorites, a.id) ? 0 : 1;
    const bFav = hasFavorite(favorites, b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return sorted.map(v => v.option);
}

// Get preferred sweets based on favorites
function getPreferredSweets(favorites: string[] | undefined): string[] {
  const allSweets = [
    { id: 'chocolate-70', option: '2 cuadros de Chocolate 70%' },
    { id: 'doce-de-leite', option: '1 cucharadita de Dulce de Leche' },
    { id: 'brigadeiro', option: '1 trufa/brigadeiro pequeño' },
    { id: 'pacoca', option: '1 dulce de maní' },
    { id: 'sorvete', option: '1 bola de Helado (de fruta)' },
    { id: 'gelatina', option: '1 copa de Gelatina' },
  ];

  const sorted = allSweets.sort((a, b) => {
    const aFav = hasFavorite(favorites, a.id) ? 0 : 1;
    const bFav = hasFavorite(favorites, b.id) ? 0 : 1;
    return aFav - bFav;
  });

  // Only return sweets that are actually in favorites, or default to chocolate if none selected but allowed
  const favoritesOnly = sorted.filter(s => hasFavorite(favorites, s.id));
  return favoritesOnly.length > 0 ? favoritesOnly.map(s => s.option) : [];
}

// Generate personalized diet based on user data
export function generateDiet(userData: UserData): DietPlan {
  const bmr = calculateBMR(userData.weight, userData.height, userData.age, userData.sex);
  const tdee = calculateTDEE(bmr, userData.activityLevel);
  const targetCalories = calculateTargetCalories(tdee, userData.goal);
  const dietFocus = getDietFocus(userData.goal);

  const hasLactoseRestriction = userData.restrictions.includes('sem-lactose');
  const hasGlutenRestriction = userData.restrictions.includes('sem-gluten');
  const isVegetarian = userData.restrictions.includes('vegetariano');
  const noSweets = userData.restrictions.includes('sem-doces');
  const favorites = userData.favoriteFoods;

  // Base meals adjusted for restrictions and favorites
  const meals = {
    breakfast: generateBreakfast(targetCalories, hasLactoseRestriction, hasGlutenRestriction, isVegetarian, favorites),
    morningSnack: generateMorningSnack(targetCalories, hasLactoseRestriction, noSweets, favorites),
    lunch: generateLunch(targetCalories, hasGlutenRestriction, isVegetarian, favorites, noSweets),
    afternoonSnack: generateAfternoonSnack(targetCalories, hasLactoseRestriction, noSweets, favorites),
    dinner: generateDinner(targetCalories, hasGlutenRestriction, isVegetarian, favorites),
  };

  return {
    bmr,
    tdee,
    targetCalories,
    dietFocus,
    mealsPerDay: 5,
    meals,
    favoriteFoods: userData.favoriteFoods,
  };
}

function generateBreakfast(calories: number, noLactose: boolean, noGluten: boolean, vegetarian: boolean, favorites?: string[]): Meal {
  const proteinOptions = getPreferredProtein(favorites, vegetarian).slice(0, 3);
  const carbOptions = getPreferredCarbs(favorites, noGluten).slice(0, 3);
  const fruitOptions = getPreferredFruits(favorites).slice(0, 3);

  const drinkOptions = noLactose
    ? ['1 vaso de leche de almendras', '1 vaso de jugo natural', '1 taza de café negro']
    : ['1 vaso de leche descremada', '1 licuado de frutas', '1 taza de café con leche'];

  return {
    name: 'Desayuno',
    time: '07:00',
    foods: [
      { item: proteinOptions[0], portion: 'porción', substitutes: proteinOptions.slice(1) },
      { item: carbOptions[0], portion: 'porción', substitutes: carbOptions.slice(1) },
      { item: fruitOptions[0], portion: '1 unidad', substitutes: fruitOptions.slice(1) },
      { item: drinkOptions[0], portion: '200ml', substitutes: drinkOptions.slice(1) },
    ],
  };
}

function generateMorningSnack(calories: number, noLactose: boolean, noSweets: boolean, favorites?: string[]): Meal {
  const fruitOptions = getPreferredFruits(favorites).slice(0, 3);

  const snackOptions = noLactose
    ? ['1 puñado de nueces (30g)', fruitOptions[0], '2 galletas de avena sin lactosa']
    : ['1 yogur natural', '1 rebanada de queso blanco', fruitOptions[0]];

  return {
    name: 'Merienda Matutina',
    time: '10:00',
    foods: [
      { item: noSweets ? '1 puñado de nueces (30g)' : snackOptions[0], portion: 'porción', substitutes: [fruitOptions[0], '2 tostadas integrales'] },
    ],
  };
}

function generateLunch(calories: number, noGluten: boolean, vegetarian: boolean, favorites?: string[], noSweets?: boolean): Meal {
  const proteinOptions = getPreferredProtein(favorites, vegetarian).slice(0, 3);
  const carbOptions = getPreferredCarbs(favorites, noGluten).slice(0, 3);
  const veggieOptions = getPreferredVegetables(favorites).slice(0, 3);

  // Logic for Dessert
  const sweetOptions = !noSweets ? getPreferredSweets(favorites) : [];
  const dessert = sweetOptions.length > 0 ? sweetOptions[0] : null;

  const foods = [
    { item: 'Ensalada verde al gusto', portion: 'al gusto', substitutes: ['Mezcla de hojas', 'Ensalada de tomate y pepino'] },
    { item: carbOptions[0], portion: '4 cucharadas', substitutes: carbOptions.slice(1) },
    { item: '3 cucharadas de frijoles', portion: '3 cucharadas', substitutes: ['Lentejas', 'Garbanzos'] },
    { item: proteinOptions[0], portion: '150g', substitutes: proteinOptions.slice(1) },
    { item: `Verduras salteadas (${veggieOptions[0]}, ${veggieOptions[1] || 'zanahoria'})`, portion: '1 taza', substitutes: veggieOptions.slice(2) },
  ];

  if (dessert) {
    foods.push({ item: `Postre: ${dessert}`, portion: '1 porción moderada', substitutes: sweetOptions.slice(1) });
  }

  return {
    name: 'Almuerzo',
    time: '12:30',
    foods: foods,
  };
}

function generateAfternoonSnack(calories: number, noLactose: boolean, noSweets: boolean, favorites?: string[]): Meal {
  const fruitOptions = getPreferredFruits(favorites).slice(0, 3);

  const options = noLactose
    ? [fruitOptions[0] + ' con mantequilla de maní', '1 rebanada de pastel de banana sin lactosa', 'Mezcla de frutos secos']
    : ['1 yogur griego natural', '1 rebanada de queso con ' + fruitOptions[0], 'Licuado de frutas'];

  return {
    name: 'Merienda de la Tarde',
    time: '16:00',
    foods: [
      { item: noSweets ? fruitOptions[0] + ' con 1 cucharada de mantequilla de maní' : options[0], portion: 'porción', substitutes: ['1 barrita de cereal', '1 puñado de almendras'] },
      { item: '1 taza de té verde', portion: '200ml', substitutes: ['Agua de coco', 'Jugo natural'] },
    ],
  };
}

function generateDinner(calories: number, noGluten: boolean, vegetarian: boolean, favorites?: string[]): Meal {
  const proteinOptions = getPreferredProtein(favorites, vegetarian).slice(0, 3);
  const veggieOptions = getPreferredVegetables(favorites).slice(0, 3);

  const sideOptions = noGluten
    ? ['Puré de camote', 'Verduras al horno', 'Ensalada con quinua']
    : ['2 rebanadas de pan integral', 'Sopa de verduras', 'Ensalada con crutones integrales'];

  return {
    name: 'Cena',
    time: '19:30',
    foods: [
      { item: `Ensalada de ${veggieOptions[0]} y ${veggieOptions[1] || 'hojas verdes'}`, portion: 'al gusto', substitutes: ['Sopa de verduras', 'Caldo verde'] },
      { item: proteinOptions[0], portion: '150g', substitutes: proteinOptions.slice(1) },
      { item: sideOptions[0], portion: 'porción', substitutes: sideOptions.slice(1) },
    ],
  };
}

// Format meal data for saving to database
export function formatMealsForDB(meals: DietPlan['meals']): object {
  return {
    breakfast: meals.breakfast,
    morningSnack: meals.morningSnack,
    lunch: meals.lunch,
    afternoonSnack: meals.afternoonSnack,
    dinner: meals.dinner,
  };
}
