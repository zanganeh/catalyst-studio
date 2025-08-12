'use client';

import React from 'react';
import { 
  Users, 
  Code2, 
  GraduationCap, 
  ShoppingBag, 
  Briefcase, 
  Cloud 
} from 'lucide-react';

interface CategoryTag {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORY_TAGS: CategoryTag[] = [
  {
    id: 'crm',
    label: 'CRM',
    prompt: 'A customer relationship management system with contact tracking, deal pipeline, and analytics',
    icon: Users,
    color: 'blue'
  },
  {
    id: 'dev-tools',
    label: 'Dev Productivity',
    prompt: 'A developer productivity tool with code snippets, project management, and collaboration features',
    icon: Code2,
    color: 'purple'
  },
  {
    id: 'education',
    label: 'Educational',
    prompt: 'An educational platform with course management, student tracking, and interactive learning',
    icon: GraduationCap,
    color: 'green'
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    prompt: 'An online store with product catalog, shopping cart, and payment processing',
    icon: ShoppingBag,
    color: 'orange'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt: 'A professional portfolio website showcasing projects, skills, and contact information',
    icon: Briefcase,
    color: 'indigo'
  },
  {
    id: 'saas',
    label: 'SaaS Platform',
    prompt: 'A software-as-a-service platform with user authentication, subscription billing, and dashboard',
    icon: Cloud,
    color: 'cyan'
  }
];

interface QuickCategoryTagsProps {
  onTagClick: (prompt: string) => void;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
  purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50',
  green: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
  orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50',
  indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50',
  cyan: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50'
};

export function QuickCategoryTags({ onTagClick }: QuickCategoryTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_TAGS.map(tag => {
        const Icon = tag.icon;
        return (
          <button
            key={tag.id}
            onClick={() => onTagClick(tag.prompt)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 transform hover:scale-105
              ${colorClasses[tag.color as keyof typeof colorClasses]}
            `}
            aria-label={`Use ${tag.label} template`}
          >
            <Icon className="w-4 h-4" />
            <span>{tag.label}</span>
          </button>
        );
      })}
    </div>
  );
}