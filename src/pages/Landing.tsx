import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Salad, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

const features = [
  'Dieta personalizada para seu corpo',
  'Cálculo automático de calorias',
  'Sugestões de substituições',
  'Opção de baixar em PDF',
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20" style={{ background: 'var(--gradient-hero)' }}>
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-8">
            <Salad className="w-10 h-10 text-primary" />
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Receba sua dieta{' '}
            <span className="gradient-text">personalizada</span>{' '}
            em segundos
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Responda algumas perguntas simples e veja exatamente o que comer para alcançar seus objetivos de emagrecimento.
          </p>

          {/* CTA Button */}
          <Link to="/criar-dieta">
            <Button variant="hero" size="xl" className="gap-3 group">
              <Sparkles className="w-5 h-5" />
              Criar minha dieta
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Features List */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/50 bg-card/50">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 Dieta Específica Personalizada</p>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Entrar na minha conta
          </Link>
        </div>
      </footer>
    </div>
  );
}