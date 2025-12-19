import { MessageSquare, BookOpen, Brain, Kanban, Bot, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Tipo para items de navegação do sidebar
 *
 * Princípio: Interface Segregation (SOLID)
 * Apenas os campos necessários para renderizar um item
 */
export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string | number;
  items?: {
    title: string;
    url: string;
  }[];
}

/**
 * Configuração dos items de navegação do LIVIA
 *
 * Princípio: Single Responsibility (SOLID)
 * Arquivo dedicado apenas à configuração de navegação
 */
export const navItems: NavItem[] = [
  {
    title: 'Livechat',
    url: '/livechat',
    icon: MessageSquare,
  },
  {
    title: 'CRM',
    url: '/crm',
    icon: Kanban,
    badge: 'BETA',
  },
  {
    title: 'Base de Conhecimento',
    url: '/knowledge-base',
    icon: BookOpen,
  },
  {
    title: 'Treinamento Neurocore',
    url: '/neurocore',
    icon: Brain,
  },
  {
    title: 'Meus Agentes IA',
    url: '/meus-agentes',
    icon: Bot,
    items: [
      {
        title: 'Principais',
        url: '/meus-agentes?category=main',
      },
      {
        title: 'Intenção',
        url: '/meus-agentes?category=intention',
      },
      {
        title: 'Observadores',
        url: '/meus-agentes?category=observer',
      },
      {
        title: 'Guard Rails',
        url: '/meus-agentes?category=guard-rails',
      },
    ],
  },
  {
    title: 'Relatórios',
    url: '/relatorios/principal',
    icon: BarChart3,
    items: [
      {
        title: 'Principal',
        url: '/relatorios/principal',
      },
      {
        title: 'Funil',
        url: '/relatorios/funil',
      },
      {
        title: 'Tags',
        url: '/relatorios/tags',
      },
    ],
  },
];
