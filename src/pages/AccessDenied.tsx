import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-6">
          Sua conta não está ativa. Entre em contato com o suporte para mais informações.
        </p>
        <Link to="/login">
          <Button>Voltar para login</Button>
        </Link>
      </div>
    </div>
  );
}