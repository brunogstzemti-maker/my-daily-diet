import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Salad, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL for recovery token (hash fragment)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        // Set the session from the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });
        
        if (!error) {
          setIsValidSession(true);
        }
      } else if (session) {
        setIsValidSession(true);
      }
      
      setChecking(false);
    };

    checkSession();
  }, []);

  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return hasMinLength && hasUpperCase && hasNumber && hasSymbol;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: "As senhas não coincidem" 
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({ 
        variant: "destructive", 
        title: "Senha fraca", 
        description: "A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, número e símbolo" 
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    setLoading(false);
    
    if (error) {
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: error.message 
      });
    } else {
      setSuccess(true);
      // Sign out and redirect to login after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 3000);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Link inválido ou expirado</h1>
          <p className="text-muted-foreground mb-6">
            Este link de recuperação não é válido ou já expirou. Solicite um novo link.
          </p>
          <Button onClick={() => navigate('/recuperar-senha')}>
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Senha alterada!</h1>
          <p className="text-muted-foreground mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Salad className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Criar nova senha</h1>
          <p className="text-muted-foreground mt-2">Digite sua nova senha abaixo</p>
        </div>

        <div className="card-elevated p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 8 caracteres, com maiúscula, número e símbolo
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
