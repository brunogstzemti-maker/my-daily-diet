import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Salad, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [diagLog, setDiagLog] = useState<string>("");
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const runDiagnostics = async () => {
    setDiagLog("Iniciando...");
    const tEmail = `teste_${Math.random().toString(36).slice(2)}@teste.com`;
    const tPass = "123456";

    setDiagLog(`1. Criando user ${tEmail}...`);
    const { error: upErr } = await signUp(tEmail, tPass, "Tester");
    if (upErr) {
      setDiagLog(`FALHA CRIAÇÃO: ${upErr.message}`);
      return;
    }

    setDiagLog("2. Criado. Tentando logar...");
    const { error: inErr } = await signIn(tEmail, tPass);
    if (inErr) {
      setDiagLog(`FALHA LOGIN: ${inErr.message}`);
    } else {
      setDiagLog("SUCESSO TOTAL! FRONTEND OK.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        console.error("LOGIN ERROR DETAILED:", error);
        setLastError(error.message + (error.cause ? ` - ${error.cause}` : ""));
        toast({ variant: "destructive", title: "Erro no login", description: error.message });
      } else {
        navigate('/');
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
            Entrar na minha conta
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesse sua dieta personalizada
          </p>
        </div>

        <div className="card-elevated p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              Primeiro acesso? Use o email da sua compra e{' '}
              <Link to="/recuperar-senha" className="text-primary hover:underline font-medium">
                defina sua senha aqui
              </Link>
            </p>

            <div>
              <Link to="/recuperar-senha" className="text-muted-foreground hover:text-primary">
                Esqueceu a senha?
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE DIAGNÓSTICO TEMPORÁRIA */}
      <div className="mt-8 p-4 bg-black/80 text-green-400 text-xs font-mono rounded overflow-auto max-w-md mx-auto">
        <p className="font-bold text-white mb-2">🔍 DEBUG INFO:</p>
        <p>Project URL: {import.meta.env.VITE_SUPABASE_URL || "Hardcoded Fallback"}</p>
        <p>Email Length: {formData.email.length}</p>
        <p>Password: {formData.password}</p>
        <p className="text-red-400 mt-2">LAST ERROR: {lastError}</p>

        <button type="button" onClick={runDiagnostics} className="mt-4 w-full bg-yellow-600 text-white font-bold py-2 rounded text-xs hover:bg-yellow-700">
          RODAR DIAGNÓSTICO
        </button>
        {diagLog && <p className="mt-2 text-yellow-300 font-mono text-xs border-t border-yellow-600 pt-2">{diagLog}</p>}
      </div>

    </div>
  );
}