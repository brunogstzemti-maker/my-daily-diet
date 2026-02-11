import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Salad,
  Coffee,
  Sun,
  Moon,
  Apple,
  RefreshCw,
  Download,
  Save,
  AlertTriangle,
  Flame,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogOut,
  Home,
  ArrowLeftRight,
  ShoppingCart,
  Check,
  FileText
} from 'lucide-react';
import { DietPlan, UserData, formatMealsForDB } from '@/lib/diet-calculator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import jsPDF from 'jspdf';

const mealIcons: Record<string, React.ReactNode> = {
  'Desayuno': <Coffee className="w-5 h-5" />,
  'Merienda Matutina': <Sun className="w-5 h-5" />,
  'Almuerzo': <Salad className="w-5 h-5" />,
  'Merienda de la Tarde': <Apple className="w-5 h-5" />,
  'Cena': <Moon className="w-5 h-5" />,
};

interface MealCardProps {
  meal: {
    name: string;
    time?: string;
    foods: {
      item: string;
      portion: string;
      substitutes?: string[];
    }[];
  };
}

function MealCard({ meal }: MealCardProps) {
  const [showSubs, setShowSubs] = useState<Record<number, boolean>>({});

  const toggleSubs = (index: number) => {
    setShowSubs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="meal-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {mealIcons[meal.name] || <Salad className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">{meal.name}</h3>
            {meal.time && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                {meal.time}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {meal.foods.map((food, index) => (
          <div key={index} className="pl-4 border-l-2 border-primary/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-foreground font-medium">{food.item}</p>
                <p className="text-sm text-muted-foreground">{food.portion}</p>
              </div>
              {food.substitutes && food.substitutes.length > 0 && (
                <button
                  onClick={() => toggleSubs(index)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  Cambiar
                  {showSubs[index] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {showSubs[index] && food.substitutes && (
              <div className="mt-2 pl-3 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Sustituciones:</p>
                {food.substitutes.map((sub, subIndex) => (
                  <p key={subIndex} className="text-sm text-muted-foreground">• {sub}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DietResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { userData, dietPlan } = location.state as { userData: UserData; dietPlan: DietPlan } || {};

  if (!userData || !dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Ninguna dieta generada
          </h2>
          <Link to="/criar-dieta">
            <Button>Crear mi dieta</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión para guardar",
        description: "Necesitas estar conectado para guardar tu dieta.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: { pathname: '/resultado' }, userData, dietPlan } });
      return;
    }

    setSaving(true);
    try {
      const dietData = {
        user_id: user.id,
        name: userData.name,
        age: userData.age,
        sex: userData.sex,
        height: userData.height,
        weight: userData.weight,
        goal: userData.goal,
        activity_level: userData.activityLevel,
        restrictions: userData.restrictions,
        bmr: dietPlan.bmr,
        tdee: dietPlan.tdee,
        target_calories: dietPlan.targetCalories,
        diet_focus: dietPlan.dietFocus,
        meals: formatMealsForDB(dietPlan.meals) as any,
      };

      const { error } = await supabase.from('diets').insert(dietData);

      if (error) throw error;

      toast({
        title: "¡Dieta guardada!",
        description: "Tu dieta fue guardada con éxito.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No fue posible guardar tu dieta. Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Helper function to add text and handle page breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...color);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.text(text, margin, y);
      y += fontSize * 0.5 + 2;
    };

    // Title
    addText('Dieta Personalizada', 22, true, [26, 122, 94]);
    addText(`Preparada para: ${userData.name}`, 14, false, [100, 100, 100]);
    y += 5;

    // Stats
    addText('Resumen del Plan', 16, true);
    addText(`• Calorías diarias: ${dietPlan.targetCalories} kcal`);
    addText(`• Número de comidas: ${dietPlan.mealsPerDay}`);
    addText(`• Enfoque de la dieta: ${dietPlan.dietFocus}`);
    addText(`• Tasa Metabólica (BMR): ${dietPlan.bmr} kcal`);
    addText(`• Gasto Diario (TDEE): ${dietPlan.tdee} kcal`);
    addText(`• Déficit calórico: ${dietPlan.tdee - dietPlan.targetCalories} kcal`);
    y += 8;

    // Meals
    addText('Plan Alimenticio Diario', 16, true, [26, 122, 94]);
    y += 3;

    Object.values(dietPlan.meals).forEach((meal) => {
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      addText(`${meal.name}${meal.time ? ` (${meal.time})` : ''}`, 14, true);

      meal.foods.forEach((food) => {
        addText(`  • ${food.item} - ${food.portion}`, 11);
        if (food.substitutes && food.substitutes.length > 0) {
          addText(`    Sustituciones: ${food.substitutes.join(', ')}`, 9, false, [120, 120, 120]);
        }
      });
      y += 4;
    });

    // Warning
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }
    y += 10;
    pdf.setFillColor(255, 247, 237);
    pdf.rect(margin - 5, y - 5, pageWidth - margin * 2 + 10, 25, 'F');
    addText('⚠️ Aviso Importante', 12, true, [154, 52, 18]);
    addText('Esta dieta es educativa y no sustituye el acompañamiento', 10, false, [154, 52, 18]);
    addText('de un nutricionista profesional.', 10, false, [154, 52, 18]);

    // Save
    pdf.save(`dieta-${userData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);

    toast({
      title: "¡PDF generado!",
      description: "Tu dieta fue descargada con éxito.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
            <span className="text-sm">Início</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-primary hover:underline">
                Mis dietas
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto" id="diet-content">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Salad className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Tu Dieta Personalizada
            </h1>
            <p className="text-muted-foreground">
              ¡Preparamos un plan especial para ti, {userData.name}!
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="card-elevated p-3 sm:p-4 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-foreground">{dietPlan.targetCalories}</p>
              <p className="text-xs text-muted-foreground">Calorías/día</p>
            </div>
            <div className="card-elevated p-3 sm:p-4 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-foreground">{dietPlan.mealsPerDay}</p>
              <p className="text-xs text-muted-foreground">Comidas</p>
            </div>
            <div className="card-elevated p-3 sm:p-4 text-center animate-slide-up col-span-2 sm:col-span-1" style={{ animationDelay: '300ms' }}>
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
              <p className="text-sm sm:text-base font-bold text-foreground leading-tight">{dietPlan.dietFocus}</p>
              <p className="text-xs text-muted-foreground mt-1">Enfoque</p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="card-elevated p-4 mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h3 className="font-display font-semibold text-foreground mb-3">📊 Parámetros de tu plan</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tasa Metabólica (BMR):</span>
                <span className="font-medium text-foreground ml-2">{dietPlan.bmr} kcal</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gasto Diario (TDEE):</span>
                <span className="font-medium text-foreground ml-2">{dietPlan.tdee} kcal</span>
              </div>
              <div>
                <span className="text-muted-foreground">Déficit calórico:</span>
                <span className="font-medium text-foreground ml-2">{dietPlan.tdee - dietPlan.targetCalories} kcal</span>
              </div>
              <div>
                <span className="text-muted-foreground">Objetivo:</span>
                <span className="font-medium text-foreground ml-2 capitalize">{userData.goal.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-4 mb-8">
            <h2 className="font-display text-xl font-semibold text-foreground">🥗 Dieta Diaria</h2>

            <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
              <MealCard meal={dietPlan.meals.breakfast} />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
              <MealCard meal={dietPlan.meals.morningSnack} />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '700ms' }}>
              <MealCard meal={dietPlan.meals.lunch} />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '800ms' }}>
              <MealCard meal={dietPlan.meals.afternoonSnack} />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '900ms' }}>
              <MealCard meal={dietPlan.meals.dinner} />
            </div>
          </div>

          {/* Substitution Guide */}
          <div className="card-elevated p-6 mb-8 animate-fade-in" style={{ animationDelay: '1000ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">📖 Guía de Sustituciones</h2>
                <p className="text-sm text-muted-foreground">Intercambia alimentos sin perder resultados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold text-foreground mb-2">🥩 Proteínas</h4>
                <p className="text-sm text-muted-foreground mb-2">Todas tienen valor proteico similar (por 100g):</p>
                <div className="flex flex-wrap gap-2">
                  {['Pollo a la parrilla', 'Pescado al horno', 'Carne magra', 'Huevos (2 unid.)', 'Tofu', 'Lentejas'].map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-card text-sm text-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold text-foreground mb-2">🍚 Carbohidratos</h4>
                <p className="text-sm text-muted-foreground mb-2">Misma porción de carbohidratos complejos:</p>
                <div className="flex flex-wrap gap-2">
                  {['Arroz integral', 'Camote', 'Quinua', 'Pasta integral', 'Pan integral', 'Avena'].map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-card text-sm text-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold text-foreground mb-2">🥬 Vegetales y Hojas</h4>
                <p className="text-sm text-muted-foreground mb-2">Bajas calorías, puede variar a gusto:</p>
                <div className="flex flex-wrap gap-2">
                  {['Lechuga', 'Rúcula', 'Espinaca', 'Brócoli', 'Kale', 'Berro', 'Acelga'].map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-card text-sm text-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold text-foreground mb-2">🍎 Frutas</h4>
                <p className="text-sm text-muted-foreground mb-2">1 porción equivale a:</p>
                <div className="flex flex-wrap gap-2">
                  {['1 manzana', '1 banana', '1 naranja', '1 rebanada de melón', '10 fresas', '1 pera', '2 kiwis'].map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-card text-sm text-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold text-foreground mb-2">🥛 Lácteos y Alternativas</h4>
                <p className="text-sm text-muted-foreground mb-2">Opciones con valor nutricional similar:</p>
                <div className="flex flex-wrap gap-2">
                  {['Leche descremada', 'Yogur natural', 'Leche de almendras', 'Queso cottage', 'Ricota', 'Leche de coco'].map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-card text-sm text-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shopping List */}
          <div className="card-elevated p-6 mb-8 animate-fade-in" style={{ animationDelay: '1100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">🛒 Lista de Compras</h2>
                  <p className="text-sm text-muted-foreground">Todo lo que necesitas para la semana</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">🥩</span>
                  Proteínas
                </h4>
                <ul className="space-y-2">
                  {[
                    'Pechuga de pollo (1kg)',
                    'Huevos (2 docenas)',
                    'Pescado (filete de tilapia o similar - 500g)',
                    userData.restrictions.includes('vegetariano') ? 'Tofu (500g)' : 'Carne magra (500g)',
                    'Frijoles (500g)',
                    'Lentejas (500g)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">🍚</span>
                  Carbohidratos
                </h4>
                <ul className="space-y-2">
                  {[
                    'Arroz integral (1kg)',
                    userData.restrictions.includes('sem-gluten') ? 'Pan sin gluten (1 paquete)' : 'Pan integral (1 paquete)',
                    'Camote (1kg)',
                    userData.restrictions.includes('sem-gluten') ? 'Tapioca (500g)' : 'Avena (500g)',
                    'Pasta integral (500g)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">🥬</span>
                  Vegetales y Hojas
                </h4>
                <ul className="space-y-2">
                  {[
                    'Lechuga (2 unidades)',
                    'Tomate (500g)',
                    'Pepino (3 unidades)',
                    'Brócoli (2 manojos)',
                    'Zanahoria (500g)',
                    'Calabacín (3 unidades)',
                    'Kale (1 manojo)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">🍎</span>
                  Frutas
                </h4>
                <ul className="space-y-2">
                  {[
                    'Bananas (1 racimo)',
                    'Manzanas (6 unidades)',
                    'Naranjas (6 unidades)',
                    'Papaya (1 unidad)',
                    'Limones (6 unidades)',
                    'Fresas (1 bandeja)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">🥛</span>
                  Lácteos
                </h4>
                <ul className="space-y-2">
                  {(userData.restrictions.includes('sem-lactose') ? [
                    'Leche de almendras (1L)',
                    'Yogur sin lactosa (4 unidades)',
                    'Queso sin lactosa (200g)',
                  ] : [
                    'Leche descremada (2L)',
                    'Yogur natural (4 unidades)',
                    'Queso blanco (200g)',
                    'Ricota (200g)',
                  ]).map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">🥜</span>
                  Otros
                </h4>
                <ul className="space-y-2">
                  {[
                    'Aceite de oliva extra virgen (500ml)',
                    'Nueces/almendras (200g)',
                    'Mantequilla de maní (200g)',
                    'Té verde (1 caja)',
                    'Condimentos naturales (ajo, cebolla)',
                    'Sal, pimienta, hierbas',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 mb-8 animate-fade-in" style={{ animationDelay: '1200ms' }}>
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-foreground">
              <strong>Aviso:</strong> Esta dieta es educativa y no sustituye el acompañamiento de un nutricionista profesional. Consulta a un especialista antes de iniciar cualquier programa alimenticio.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '1100ms' }}>
            <Button onClick={() => navigate('/criar-dieta')} variant="outline" className="flex-1 gap-2">
              <RefreshCw className="w-4 h-4" />
              Generar nueva dieta
            </Button>
            <Button onClick={handleDownloadPDF} variant="secondary" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
            <Button onClick={handleSave} variant="hero" disabled={saving} className="flex-1 gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar dieta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}