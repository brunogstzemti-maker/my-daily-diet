import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Salad, 
  Coffee, 
  Sun, 
  Sunset, 
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
  Home
} from 'lucide-react';
import { DietPlan, UserData, formatMealsForDB } from '@/lib/diet-calculator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const mealIcons: Record<string, React.ReactNode> = {
  'Café da Manhã': <Coffee className="w-5 h-5" />,
  'Lanche da Manhã': <Sun className="w-5 h-5" />,
  'Almoço': <Salad className="w-5 h-5" />,
  'Lanche da Tarde': <Apple className="w-5 h-5" />,
  'Jantar': <Moon className="w-5 h-5" />,
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
                  Trocar
                  {showSubs[index] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            
            {showSubs[index] && food.substitutes && (
              <div className="mt-2 pl-3 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Substituições:</p>
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
            Nenhuma dieta gerada
          </h2>
          <Link to="/criar-dieta">
            <Button>Criar minha dieta</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Faça login para salvar",
        description: "Você precisa estar logado para salvar sua dieta.",
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
        title: "Dieta salva!",
        description: "Sua dieta foi salva com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua dieta. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    // Create printable version
    const printContent = document.getElementById('diet-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Minha Dieta Personalizada - ${userData.name}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1a7a5e; margin-bottom: 24px; }
              h2 { color: #333; margin-top: 32px; }
              .stats { display: flex; gap: 24px; margin-bottom: 32px; padding: 16px; background: #f0fdf4; border-radius: 12px; }
              .stat { text-align: center; }
              .stat-value { font-size: 24px; font-weight: bold; color: #1a7a5e; }
              .stat-label { font-size: 12px; color: #666; }
              .meal { margin-bottom: 24px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 12px; }
              .meal h3 { margin: 0 0 12px 0; color: #1a7a5e; }
              .food { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
              .food:last-child { border-bottom: none; }
              .warning { margin-top: 40px; padding: 16px; background: #fff7ed; border-radius: 12px; font-size: 14px; color: #9a3412; }
            </style>
          </head>
          <body>
            <h1>🥗 Dieta Personalizada para ${userData.name}</h1>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${dietPlan.targetCalories}</div>
                <div class="stat-label">Calorias/dia</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dietPlan.mealsPerDay}</div>
                <div class="stat-label">Refeições</div>
              </div>
              <div class="stat">
                <div class="stat-value">${dietPlan.dietFocus}</div>
                <div class="stat-label">Foco</div>
              </div>
            </div>

            ${Object.values(dietPlan.meals).map(meal => `
              <div class="meal">
                <h3>${meal.name} ${meal.time ? `(${meal.time})` : ''}</h3>
                ${meal.foods.map(food => `
                  <div class="food">
                    <strong>${food.item}</strong> - ${food.portion}
                    ${food.substitutes ? `<br><small style="color:#666">Substituições: ${food.substitutes.join(', ')}</small>` : ''}
                  </div>
                `).join('')}
              </div>
            `).join('')}

            <div class="warning">
              ⚠️ <strong>Aviso:</strong> Esta dieta é educativa e não substitui o acompanhamento de um nutricionista profissional.
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
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
                Minhas dietas
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sair
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
              Sua Dieta Personalizada
            </h1>
            <p className="text-muted-foreground">
              Preparamos um plano especial para você, {userData.name}!
            </p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-4 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
            <Flame className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{dietPlan.targetCalories}</p>
            <p className="text-xs text-muted-foreground">Calorias/dia</p>
          </div>
          <div className="card-elevated p-4 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{dietPlan.mealsPerDay}</p>
            <p className="text-xs text-muted-foreground">Refeições</p>
          </div>
          <div className="card-elevated p-4 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">{dietPlan.dietFocus}</p>
            <p className="text-xs text-muted-foreground">Foco</p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="card-elevated p-4 mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-3">📊 Parâmetros do seu plano</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Taxa Metabólica (BMR):</span>
              <span className="font-medium text-foreground ml-2">{dietPlan.bmr} kcal</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gasto Diário (TDEE):</span>
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
          <h2 className="font-display text-xl font-semibold text-foreground">🥗 Dieta Diária</h2>
          
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

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 mb-8 animate-fade-in" style={{ animationDelay: '1000ms' }}>
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-warning-foreground">
            <strong>Aviso:</strong> Esta dieta é educativa e não substitui o acompanhamento de um nutricionista profissional. Consulte um especialista antes de iniciar qualquer programa alimentar.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '1100ms' }}>
          <Button onClick={() => navigate('/criar-dieta')} variant="outline" className="flex-1 gap-2">
            <RefreshCw className="w-4 h-4" />
            Gerar nova dieta
          </Button>
          <Button onClick={handleDownloadPDF} variant="secondary" className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Baixar PDF
          </Button>
          <Button onClick={handleSave} variant="hero" disabled={saving} className="flex-1 gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar dieta
              </>
            )}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}