import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, User, Ruler, Target, Activity, AlertCircle, Heart, Utensils, Cookie } from 'lucide-react';
import { UserData, generateDiet, availableFoods } from '@/lib/diet-calculator';
import { useToast } from '@/hooks/use-toast';

const goals = [
  { value: 'emagrecer-rapido', label: 'Emagrecer rápido' },
  { value: 'secar-barriga', label: 'Secar barriga' },
  { value: 'perder-5kg', label: 'Perder 5kg' },
  { value: 'manter-peso', label: 'Manter peso' },
];

const activityLevels = [
  { value: 'sedentario', label: 'Sedentário', description: 'Pouco ou nenhum exercício' },
  { value: 'leve', label: 'Leve', description: '1-3 dias de exercício por semana' },
  { value: 'moderado', label: 'Moderado', description: '3-5 dias de exercício por semana' },
  { value: 'intenso', label: 'Intenso', description: '6-7 dias de exercício por semana' },
];

const restrictions = [
  { id: 'nenhuma', label: 'Nenhuma restrição' },
  { id: 'sem-lactose', label: 'Sem lactose' },
  { id: 'sem-gluten', label: 'Sem glúten' },
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'sem-doces', label: 'Não gosto de doces' },
];

export default function DietForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    goal: '',
    activityLevel: '',
    restrictions: [] as string[],
    favoriteFoods: [] as string[],
  });

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRestriction = (restrictionId: string) => {
    setFormData(prev => {
      let newRestrictions = [...prev.restrictions];

      if (restrictionId === 'nenhuma') {
        newRestrictions = newRestrictions.includes('nenhuma') ? [] : ['nenhuma'];
      } else {
        newRestrictions = newRestrictions.filter(r => r !== 'nenhuma');
        if (newRestrictions.includes(restrictionId)) {
          newRestrictions = newRestrictions.filter(r => r !== restrictionId);
        } else {
          newRestrictions.push(restrictionId);
        }
      }

      return { ...prev, restrictions: newRestrictions };
    });
  };

  const toggleFavoriteFood = (foodId: string) => {
    setFormData(prev => {
      const newFavorites = prev.favoriteFoods.includes(foodId)
        ? prev.favoriteFoods.filter(f => f !== foodId)
        : [...prev.favoriteFoods, foodId];
      return { ...prev, favoriteFoods: newFavorites };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name || !formData.age || !formData.sex) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, idade e sexo.",
      });
      return false;
    }

    const age = parseInt(formData.age);
    if (age < 16 || age > 100) {
      toast({
        variant: "destructive",
        title: "Idade inválida",
        description: "A idade deve estar entre 16 e 100 anos.",
      });
      return false;
    }

    if (!formData.height || !formData.weight) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, informe sua altura e peso.",
      });
      return false;
    }

    if (!formData.goal) {
      toast({
        variant: "destructive",
        title: "Objetivo obrigatório",
        description: "Por favor, selecione seu objetivo.",
      });
      return false;
    }

    if (!formData.activityLevel) {
      toast({
        variant: "destructive",
        title: "Nível de atividade obrigatório",
        description: "Por favor, selecione seu nível de atividade física.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const userData: UserData = {
        name: formData.name,
        age: parseInt(formData.age),
        sex: formData.sex as 'masculino' | 'feminino',
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        goal: formData.goal as UserData['goal'],
        activityLevel: formData.activityLevel as UserData['activityLevel'],
        restrictions: formData.restrictions.filter(r => r !== 'nenhuma'),
        favoriteFoods: formData.favoriteFoods,
      };

      const dietPlan = generateDiet(userData);

      navigate('/resultado', {
        state: {
          userData,
          dietPlan,
        }
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar dieta",
        description: "Ocorreu um erro. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Criar Minha Dieta
          </h1>
          <p className="text-muted-foreground mt-2">
            Preencha suas informações para gerar um plano alimentar personalizado
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Info Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Dados Pessoais</h2>
                <p className="text-sm text-muted-foreground">Informações básicas sobre você</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Sua idade"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Sexo</Label>
                <Select value={formData.sex} onValueChange={(value) => updateField('sex', value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Body Measurements Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Medidas Corporais</h2>
                <p className="text-sm text-muted-foreground">Para calcular suas necessidades calóricas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ex: 170"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="weight">Peso atual (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.5"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </section>

          {/* Goal Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Seu Objetivo</h2>
                <p className="text-sm text-muted-foreground">O que você quer alcançar?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => updateField('goal', goal.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${formData.goal === goal.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                >
                  <span className={`font-medium text-sm ${formData.goal === goal.value ? 'text-primary' : 'text-foreground'}`}>
                    {goal.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Activity Level Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Nível de Atividade</h2>
                <p className="text-sm text-muted-foreground">Quanto você se exercita?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => updateField('activityLevel', level.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.activityLevel === level.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                >
                  <span className={`font-medium block ${formData.activityLevel === level.value ? 'text-primary' : 'text-foreground'}`}>
                    {level.label}
                  </span>
                  <span className="text-sm text-muted-foreground">{level.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Restrictions Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Restrições Alimentares</h2>
                <p className="text-sm text-muted-foreground">Selecione se houver alguma restrição</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {restrictions.map((restriction) => (
                <div
                  key={restriction.id}
                  onClick={() => toggleRestriction(restriction.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.restrictions.includes(restriction.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <Checkbox
                    checked={formData.restrictions.includes(restriction.id)}
                    className="pointer-events-none"
                  />
                  <span className={`font-medium text-sm ${formData.restrictions.includes(restriction.id) ? 'text-primary' : 'text-foreground'}`}>
                    {restriction.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Favorite Foods Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Alimentos Favoritos</h2>
                <p className="text-sm text-muted-foreground">Selecione os alimentos que você mais gosta (opcional)</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Proteins */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Proteínas</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableFoods.proteins.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => toggleFavoriteFood(food.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${formData.favoriteFoods.includes(food.id)
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-foreground'
                        }`}
                    >
                      <span className="text-lg">{food.emoji}</span>
                      <span>{food.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Carboidratos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableFoods.carbs.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => toggleFavoriteFood(food.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${formData.favoriteFoods.includes(food.id)
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-foreground'
                        }`}
                    >
                      <span className="text-lg">{food.emoji}</span>
                      <span>{food.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vegetables */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Vegetais</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableFoods.vegetables.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => toggleFavoriteFood(food.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${formData.favoriteFoods.includes(food.id)
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-foreground'
                        }`}
                    >
                      <span className="text-lg">{food.emoji}</span>
                      <span>{food.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fruits */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Frutas</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableFoods.fruits.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => toggleFavoriteFood(food.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${formData.favoriteFoods.includes(food.id)
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-foreground'
                        }`}
                    >
                      <span className="text-lg">{food.emoji}</span>
                      <span>{food.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweets */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Doces e Sobremesas (Opcional)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableFoods.sweets.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => toggleFavoriteFood(food.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${formData.favoriteFoods.includes(food.id)
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-foreground'
                        }`}
                    >
                      <span className="text-lg">{food.emoji}</span>
                      <span>{food.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formData.favoriteFoods.length > 0 && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{formData.favoriteFoods.length}</span> alimentos selecionados
                </p>
              </div>
            )}
          </section>

          {/* Submit Button */}
          <div className="flex justify-center md:justify-end pt-4">
            <Button onClick={handleSubmit} variant="hero" size="lg" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando sua dieta...
                </>
              ) : (
                <>
                  Gerar minha dieta personalizada
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      );
}
