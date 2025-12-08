'use client';

import { 
  Users, 
  Target, 
  Eye, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

export type AgentCategory = 'main' | 'intention' | 'observer' | 'guard-rails';

interface AgentCategorySelectorProps {
  currentCategory: AgentCategory;
}

export function AgentCategorySelector({ currentCategory }: AgentCategorySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categories = [
    {
      id: 'main',
      label: 'Agentes Principais',
      icon: Users,
      description: 'Configuração detalhada do atendimento'
    },
    {
      id: 'intention',
      label: 'Agentes de Intenção',
      icon: Target,
      description: 'Classificação de intenção do usuário'
    },
    {
      id: 'observer',
      label: 'Agentes Observadores',
      icon: Eye,
      description: 'Análise de sentimento e qualidade'
    },
    {
      id: 'guard-rails',
      label: 'Agentes Guard Rails',
      icon: ShieldCheck,
      description: 'Segurança e conformidade (Compliance)'
    }
  ];

  const activeCategory = categories.find(c => c.id === currentCategory) || categories[0];

  const handleSelect = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', categoryId);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full mb-6">
      <label className="text-sm text-muted-foreground mb-2 block">
        Categoria de Agentes
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full sm:w-[300px] justify-between h-12 px-4 bg-background/50 hover:bg-background/80"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                {activeCategory && <activeCategory.icon className="h-5 w-5" />}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm leading-none mb-1">
                  {activeCategory?.label}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {activeCategory?.description}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer",
                currentCategory === category.id && "bg-accent"
              )}
            >
              <category.icon className={cn(
                "h-5 w-5",
                currentCategory === category.id ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {category.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
