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

// Available foods for selection
export const availableFoods = {
  proteins: [
    { id: 'frango', label: 'Frango' },
    { id: 'peixe', label: 'Peixe' },
    { id: 'carne-bovina', label: 'Carne bovina' },
    { id: 'ovos', label: 'Ovos' },
    { id: 'tofu', label: 'Tofu' },
    { id: 'lentilha', label: 'Lentilha' },
    { id: 'grao-de-bico', label: 'Grão-de-bico' },
    { id: 'peru', label: 'Peru' },
  ],
  carbs: [
    { id: 'arroz-integral', label: 'Arroz integral' },
    { id: 'batata-doce', label: 'Batata doce' },
    { id: 'pao-integral', label: 'Pão integral' },
    { id: 'aveia', label: 'Aveia' },
    { id: 'tapioca', label: 'Tapioca' },
    { id: 'quinoa', label: 'Quinoa' },
    { id: 'macarrao-integral', label: 'Macarrão integral' },
    { id: 'cuscuz', label: 'Cuscuz' },
  ],
  vegetables: [
    { id: 'brocolis', label: 'Brócolis' },
    { id: 'espinafre', label: 'Espinafre' },
    { id: 'cenoura', label: 'Cenoura' },
    { id: 'abobrinha', label: 'Abobrinha' },
    { id: 'tomate', label: 'Tomate' },
    { id: 'pepino', label: 'Pepino' },
    { id: 'couve', label: 'Couve' },
    { id: 'alface', label: 'Alface' },
  ],
  fruits: [
    { id: 'banana', label: 'Banana' },
    { id: 'maca', label: 'Maçã' },
    { id: 'laranja', label: 'Laranja' },
    { id: 'morango', label: 'Morango' },
    { id: 'mamao', label: 'Mamão' },
    { id: 'abacate', label: 'Abacate' },
    { id: 'melao', label: 'Melão' },
    { id: 'uva', label: 'Uva' },
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
        { id: 'ovos', option: '2 ovos mexidos' },
        { id: 'tofu', option: '3 colheres de tofu mexido' },
        { id: 'lentilha', option: '150g de lentilha' },
        { id: 'grao-de-bico', option: '150g de grão-de-bico' },
      ]
    : [
        { id: 'frango', option: '150g de frango grelhado' },
        { id: 'peixe', option: '150g de peixe assado' },
        { id: 'carne-bovina', option: '120g de carne magra' },
        { id: 'ovos', option: '2 ovos mexidos' },
        { id: 'peru', option: '2 fatias de peito de peru' },
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
        { id: 'tapioca', option: '1 tapioca média' },
        { id: 'batata-doce', option: '2 batatas doces médias' },
        { id: 'arroz-integral', option: '4 colheres de arroz integral' },
        { id: 'quinoa', option: '3 colheres de quinoa' },
        { id: 'cuscuz', option: '3 colheres de cuscuz' },
      ]
    : [
        { id: 'arroz-integral', option: '4 colheres de arroz integral' },
        { id: 'pao-integral', option: '2 fatias de pão integral' },
        { id: 'batata-doce', option: '2 batatas doces médias' },
        { id: 'aveia', option: '3 colheres de aveia' },
        { id: 'tapioca', option: '1 tapioca média' },
        { id: 'macarrao-integral', option: '3 colheres de macarrão integral' },
        { id: 'quinoa', option: '3 colheres de quinoa' },
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
    { id: 'banana', option: '1 banana média' },
    { id: 'maca', option: '1 maçã média' },
    { id: 'mamao', option: '1 fatia de mamão' },
    { id: 'laranja', option: '1 laranja média' },
    { id: 'morango', option: '10 morangos' },
    { id: 'melao', option: '1 fatia de melão' },
    { id: 'abacate', option: '½ abacate pequeno' },
    { id: 'uva', option: '1 cacho pequeno de uvas' },
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
    { id: 'brocolis', option: 'brócolis refogado' },
    { id: 'espinafre', option: 'espinafre refogado' },
    { id: 'cenoura', option: 'cenoura cozida' },
    { id: 'abobrinha', option: 'abobrinha grelhada' },
    { id: 'couve', option: 'couve refogada' },
    { id: 'alface', option: 'salada de alface' },
    { id: 'tomate', option: 'tomate em salada' },
    { id: 'pepino', option: 'pepino em salada' },
  ];

  const sorted = allVeggies.sort((a, b) => {
    const aFav = hasFavorite(favorites, a.id) ? 0 : 1;
    const bFav = hasFavorite(favorites, b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return sorted.map(v => v.option);
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
    lunch: generateLunch(targetCalories, hasGlutenRestriction, isVegetarian, favorites),
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
    ? ['1 copo de leite de amêndoas', '1 copo de suco natural', '1 xícara de café preto']
    : ['1 copo de leite desnatado', '1 copo de vitamina de frutas', '1 xícara de café com leite'];

  return {
    name: 'Café da Manhã',
    time: '07:00',
    foods: [
      { item: proteinOptions[0], portion: 'porção', substitutes: proteinOptions.slice(1) },
      { item: carbOptions[0], portion: 'porção', substitutes: carbOptions.slice(1) },
      { item: fruitOptions[0], portion: '1 unidade', substitutes: fruitOptions.slice(1) },
      { item: drinkOptions[0], portion: '200ml', substitutes: drinkOptions.slice(1) },
    ],
  };
}

function generateMorningSnack(calories: number, noLactose: boolean, noSweets: boolean, favorites?: string[]): Meal {
  const fruitOptions = getPreferredFruits(favorites).slice(0, 3);
  
  const snackOptions = noLactose
    ? ['1 punhado de castanhas (30g)', fruitOptions[0], '2 cookies de aveia sem lactose']
    : ['1 iogurte natural', '1 fatia de queijo branco', fruitOptions[0]];

  return {
    name: 'Lanche da Manhã',
    time: '10:00',
    foods: [
      { item: noSweets ? '1 punhado de castanhas (30g)' : snackOptions[0], portion: 'porção', substitutes: [fruitOptions[0], '2 torradas integrais'] },
    ],
  };
}

function generateLunch(calories: number, noGluten: boolean, vegetarian: boolean, favorites?: string[]): Meal {
  const proteinOptions = getPreferredProtein(favorites, vegetarian).slice(0, 3);
  const carbOptions = getPreferredCarbs(favorites, noGluten).slice(0, 3);
  const veggieOptions = getPreferredVegetables(favorites).slice(0, 3);

  return {
    name: 'Almoço',
    time: '12:30',
    foods: [
      { item: 'Salada verde à vontade', portion: 'à vontade', substitutes: ['Mix de folhas', 'Salada de tomate e pepino'] },
      { item: carbOptions[0], portion: '4 colheres', substitutes: carbOptions.slice(1) },
      { item: '3 colheres de feijão', portion: '3 colheres', substitutes: ['Lentilha', 'Grão-de-bico'] },
      { item: proteinOptions[0], portion: '150g', substitutes: proteinOptions.slice(1) },
      { item: `Legumes refogados (${veggieOptions[0]}, ${veggieOptions[1] || 'cenoura'})`, portion: '1 xícara', substitutes: veggieOptions.slice(2) },
    ],
  };
}

function generateAfternoonSnack(calories: number, noLactose: boolean, noSweets: boolean, favorites?: string[]): Meal {
  const fruitOptions = getPreferredFruits(favorites).slice(0, 3);
  
  const options = noLactose
    ? [fruitOptions[0] + ' com pasta de amendoim', '1 fatia de bolo de banana sem lactose', 'Mix de frutas secas']
    : ['1 iogurte grego natural', '1 fatia de queijo com ' + fruitOptions[0], 'Vitamina de frutas'];

  return {
    name: 'Lanche da Tarde',
    time: '16:00',
    foods: [
      { item: noSweets ? fruitOptions[0] + ' com 1 colher de pasta de amendoim' : options[0], portion: 'porção', substitutes: ['1 barrinha de cereal', '1 punhado de amêndoas'] },
      { item: '1 xícara de chá verde', portion: '200ml', substitutes: ['Água de coco', 'Suco natural'] },
    ],
  };
}

function generateDinner(calories: number, noGluten: boolean, vegetarian: boolean, favorites?: string[]): Meal {
  const proteinOptions = getPreferredProtein(favorites, vegetarian).slice(0, 3);
  const veggieOptions = getPreferredVegetables(favorites).slice(0, 3);

  const sideOptions = noGluten
    ? ['Purê de batata doce', 'Legumes assados', 'Salada com quinoa']
    : ['2 fatias de pão integral', 'Sopa de legumes', 'Salada com croutons integrais'];

  return {
    name: 'Jantar',
    time: '19:30',
    foods: [
      { item: `Salada de ${veggieOptions[0]} e ${veggieOptions[1] || 'folhas verdes'}`, portion: 'à vontade', substitutes: ['Sopa de legumes', 'Caldo verde'] },
      { item: proteinOptions[0], portion: '150g', substitutes: proteinOptions.slice(1) },
      { item: sideOptions[0], portion: 'porção', substitutes: sideOptions.slice(1) },
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
