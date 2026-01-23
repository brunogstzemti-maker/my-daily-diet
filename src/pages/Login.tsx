import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Salad, Mail, Lock, User, CheckCircle2, XCircle } from 'lucide-react';

const validatePassword = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

const isPasswordValid = (password: string) => {
  const validation = validatePassword(password);
  return validation.minLength && validation.hasUppercase && validation.hasNumber && validation.hasSymbol;
};

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const passwordValidation = validatePassword(formData.password);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFirstAccess && !isPasswordValid(formData.password)) {
      toast({ 
        variant: "destructive", 
        title: "Senha fraca", 
        description: "Sua senha deve ter no mínimo 8 caracteres, letra maiúscula, número e símbolo." 
      });
      return;
    }
    
    setLoading(true);

    try {
      if (isFirstAccess) {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          toast({ variant: "destructive", title: "Erro no cadastro", description: error.message });
        } else {
          toast({ title: "Conta criada!", description: "Bem-vindo ao Dieta Específica Personalizada." });
          navigate('/');
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({ variant: "destructive", title: "Erro no login", description: error.message });
        } else {
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Salad className="w-8 h-8 text-primary" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isFirstAccess ? 'Criar minha conta' : 'Entrar na minha conta'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isFirstAccess ? 'Configure sua senha para começar' : 'Acesse sua dieta personalizada'}
          </p>
        </div>

        <div className="card-elevated p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isFirstAccess && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
                  required
                  minLength={isFirstAccess ? 8 : 6}
                />
              </div>
              
              {isFirstAccess && formData.password && (
                <div className="mt-3 space-y-1.5 text-sm">
                  <PasswordRequirement met={passwordValidation.minLength} text="Mínimo 8 caracteres" />
                  <PasswordRequirement met={passwordValidation.hasUppercase} text="Letra maiúscula" />
                  <PasswordRequirement met={passwordValidation.hasNumber} text="Número" />
                  <PasswordRequirement met={passwordValidation.hasSymbol} text="Símbolo (!@#$%...)" />
                </div>
              )}
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFirstAccess ? 'Criar conta' : 'Entrar')}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border space-y-3 text-center text-sm">
            <button
              onClick={() => setIsFirstAccess(!isFirstAccess)}
              className="text-primary hover:underline font-medium"
            >
              {isFirstAccess ? 'Já tenho conta' : 'Primeiro acesso? Criar senha'}
            </button>
            
            {!isFirstAccess && (
              <div>
                <Link to="/recuperar-senha" className="text-muted-foreground hover:text-primary">
                  Esqueceu a senha?
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-muted-foreground'}`}>
      {met ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );
}