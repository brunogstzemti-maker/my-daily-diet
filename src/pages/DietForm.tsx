import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Loader2, User, Ruler, Target, Activity, AlertCircle } from 'lucide-react';
import { UserData, generateDiet } from '@/lib/diet-calculator';
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
  const [step, setStep] = useState(1);
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

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.name || !formData.age || !formData.sex) {
          toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos.",
          });
          return false;
        }
        if (parseInt(formData.age) < 16 || parseInt(formData.age) > 100) {
          toast({
            variant: "destructive",
            title: "Idade inválida",
            description: "A idade deve estar entre 16 e 100 anos.",
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.height || !formData.weight) {
          toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, informe sua altura e peso.",
          });
          return false;
        }
        return true;
      case 3:
        if (!formData.goal) {
          toast({
            variant: "destructive",
            title: "Objetivo obrigatório",
            description: "Por favor, selecione seu objetivo.",
          });
          return false;
        }
        return true;
      case 4:
        if (!formData.activityLevel) {
          toast({
            variant: "destructive",
            title: "Nível de atividade obrigatório",
            description: "Por favor, selecione seu nível de atividade física.",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
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
      };
      
      const dietPlan = generateDiet(userData);
      
      // Navigate to results with the diet plan
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

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Passo {step} de {totalSteps}</span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="card-elevated p-6 md:p-8">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Dados Pessoais</h2>
                  <p className="text-sm text-muted-foreground">Conte-nos um pouco sobre você</p>
                </div>
              </div>

              <div className="space-y-5">
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
            </div>
          )}

          {/* Step 2: Body Measurements */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Medidas Corporais</h2>
                  <p className="text-sm text-muted-foreground">Para calcular suas necessidades</p>
                </div>
              </div>

              <div className="space-y-5">
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
            </div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Seu Objetivo</h2>
                  <p className="text-sm text-muted-foreground">O que você quer alcançar?</p>
                </div>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => updateField('goal', goal.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.goal === goal.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <span className={`font-medium ${formData.goal === goal.value ? 'text-primary' : 'text-foreground'}`}>
                      {goal.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Activity Level */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Nível de Atividade</h2>
                  <p className="text-sm text-muted-foreground">Quanto você se exercita?</p>
                </div>
              </div>

              <div className="space-y-3">
                {activityLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateField('activityLevel', level.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.activityLevel === level.value
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
            </div>
          )}

          {/* Step 5: Restrictions */}
          {step === 5 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Restrições Alimentares</h2>
                  <p className="text-sm text-muted-foreground">Selecione se houver</p>
                </div>
              </div>

              <div className="space-y-3">
                {restrictions.map((restriction) => (
                  <div
                    key={restriction.id}
                    onClick={() => toggleRestriction(restriction.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      formData.restrictions.includes(restriction.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={formData.restrictions.includes(restriction.id)}
                      className="pointer-events-none"
                    />
                    <span className={`font-medium ${formData.restrictions.includes(restriction.id) ? 'text-primary' : 'text-foreground'}`}>
                      {restriction.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button variant="ghost" onClick={prevStep} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Início
              </Button>
            )}

            {step < totalSteps ? (
              <Button onClick={nextStep} className="gap-2">
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="hero" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    Gerar minha dieta
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}