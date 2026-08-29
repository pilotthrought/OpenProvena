// Composant FeatureCard pour OpenProvena
// Carte de présentation des fonctionnalités

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
  className?: string;
}

/**
 * Composant FeatureCard
 * Affiche une fonctionnalité avec icône et description
 */
export default function FeatureCard({
  title,
  description,
  icon,
  link,
  className = '',
}: FeatureCardProps) {
  const { t } = useLanguage();
  const content = (
    <div 
      className={`
        card-elevated p-6
        group cursor-pointer
        hover:scale-[1.02] hover:shadow-elevated
        transition-all duration-300
        ${className}
      `}
    >
      {/* Icône */}
      <div className="w-14 h-14 mb-5 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-600 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
        {icon}
      </div>
      
      {/* Titre */}
      <h3 className="text-xl font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors duration-200">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-secondary-600 leading-relaxed">
        {description}
      </p>
      
      {/* Indicateur de lien */}
      {link && (
        <div className="mt-4 flex items-center text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span>{t.common.learn_more}</span>
          <svg 
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  // Si un lien est fourni, wrap dans un Link
  if (link) {
    return (
      <a href={link} className="block">
        {content}
      </a>
    );
  }

  return content;
}

/**
 * Résout une clé de traduction (ex: 'hero.trust_analysis') dans l'objet de traductions
 */
function getLabel(t: Record<string, unknown>, key: string): string {
  // @ts-expect-error - Navigation dynamique dans l'objet
  const value = key.split('.').reduce((obj, k) => obj?.[k], t);
  return typeof value === 'string' ? value : key;
}

/**
 * Définitions des features pour la page d'accueil
 */
export function getHomeFeatures(t: Record<string, unknown>) {
  return [
    {
      id: 'trust-analysis',
      title: getLabel(t, 'hero.trust_analysis'),
      description: getLabel(t, 'hero.trust_analysis_desc'),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      link: '/search',
    },
    {
      id: 'source-tracking',
      title: getLabel(t, 'hero.source_tracking'),
      description: getLabel(t, 'hero.source_tracking_desc'),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      link: '/explorer',
    },
    {
      id: 'narrative-tracking',
      title: getLabel(t, 'hero.narrative_tracking'),
      description: getLabel(t, 'hero.narrative_tracking_desc'),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: '/explorer?view=narratives',
    },
    {
      id: 'ai-detection',
      title: getLabel(t, 'hero.ai_detection'),
      description: getLabel(t, 'hero.ai_detection_desc'),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      link: '/docs/ai-detection',
    },
  ];
}

// Rétrocompatibilité : constante avec clés de traduction
export const HOME_FEATURES = [
  {
    id: 'trust-analysis',
    titleKey: 'hero.trust_analysis',
    descriptionKey: 'hero.trust_analysis_desc',
    link: '/search',
  },
  {
    id: 'source-tracking',
    titleKey: 'hero.source_tracking',
    descriptionKey: 'hero.source_tracking_desc',
    link: '/explorer',
  },
  {
    id: 'narrative-tracking',
    titleKey: 'hero.narrative_tracking',
    descriptionKey: 'hero.narrative_tracking_desc',
    link: '/explorer?view=narratives',
  },
  {
    id: 'ai-detection',
    titleKey: 'hero.ai_detection',
    descriptionKey: 'hero.ai_detection_desc',
    link: '/docs/ai-detection',
  },
];
