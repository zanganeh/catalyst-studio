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
    id: 'cms-migration',
    label: 'CMS Migration',
    prompt: 'Migrate my Sitecore website to Optimizely SaaS CMS with content modeling, personalization rules, and SEO preservation',
    icon: Cloud,
    color: 'blue'
  },
  {
    id: 'university-catalog',
    label: 'Course Catalog',
    prompt: 'Create a course catalog site for our university with program details, prerequisites, enrollment system, and student portal',
    icon: GraduationCap,
    color: 'purple'
  },
  {
    id: 'customer-portal',
    label: 'Customer Portal',
    prompt: 'Build a B2B customer portal with order tracking, invoice management, support tickets, and document library',
    icon: Users,
    color: 'green'
  },
  {
    id: 'hr-platform',
    label: 'HR Platform',
    prompt: 'Design an employee self-service HR platform with benefits enrollment, time tracking, and performance reviews',
    icon: Briefcase,
    color: 'orange'
  },
  {
    id: 'vendor-marketplace',
    label: 'Vendor Marketplace',
    prompt: 'Create a vendor management marketplace with RFP submissions, contract management, and compliance tracking',
    icon: ShoppingBag,
    color: 'indigo'
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    prompt: 'Develop an internal knowledge base with AI-powered search, article versioning, and department-specific access controls',
    icon: Code2,
    color: 'cyan'
  }
];

interface QuickCategoryTagsProps {
  onTagClick: (prompt: string) => void;
}

const colorClasses = {
  blue: 'bg-gray-800 text-blue-400 hover:bg-gray-700 border border-gray-700',
  purple: 'bg-gray-800 text-purple-400 hover:bg-gray-700 border border-gray-700',
  green: 'bg-gray-800 text-green-400 hover:bg-gray-700 border border-gray-700',
  orange: 'bg-gray-800 text-catalyst-orange hover:bg-gray-700 border border-gray-700',
  indigo: 'bg-gray-800 text-indigo-400 hover:bg-gray-700 border border-gray-700',
  cyan: 'bg-gray-800 text-cyan-400 hover:bg-gray-700 border border-gray-700'
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