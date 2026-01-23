import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Salad, Plus, LogOut, Trash2, Calendar, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedDiet {
  id: string;
  name: string;
  goal: string;
  target_calories: number;
  diet_focus: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [diets, setDiets] = useState<SavedDiet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDiets();
    }
  }, [user]);

  const fetchDiets = async () => {
    const { data, error } = await supabase
      .from('diets')
      .select('id, name, goal, target_calories, diet_focus, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDiets(data);
    }
    setLoading(false);
  };

  const deleteDiet = async (id: string) => {
    const { error } = await supabase.from('diets').delete().eq('id', id);
    if (!error) {
      setDiets(prev => prev.filter(d => d.id !== id));
      toast({ title: "Dieta excluída" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Salad className="w-8 h-8 text-primary" />
            <span className="font-display font-semibold text-foreground">Dieta Específica</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Olá, {profile?.name || 'Usuário'}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Minhas Dietas</h1>
          <Link to="/criar-dieta">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova dieta
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : diets.length === 0 ? (
          <div className="text-center py-16 card-elevated">
            <Salad className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Nenhuma dieta salva
            </h3>
            <p className="text-muted-foreground mb-6">
              Crie sua primeira dieta personalizada agora!
            </p>
            <Link to="/criar-dieta">
              <Button variant="hero">Criar minha dieta</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {diets.map((diet) => (
              <div key={diet.id} className="card-elevated p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{diet.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {diet.target_calories} kcal
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(diet.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDiet(diet.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}