// Composant TrustScore pour OpenProvena
// Affiche le score de confiance avec barre de progression et badge

import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TrustLevel } from '@/types';

interface TrustScoreProps {
  score: number;
  trustLevel?: TrustLevel;
  showLabel?: boolean;
  showBadge?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

/**
 * Obtient la classe CSS selon le niveau de confiance
 */
function getTrustLevelClass(level: TrustLevel): string {
  switch (level) {
    case 'very_high':
    case 'high':
      return 'trust-badge-high';
    case 'medium':
      return 'trust-badge-medium';
    case 'low':
    case 'very_low':
      return 'trust-badge-low';
    default:
      return 'trust-badge-unknown';
  }
}

/**
 * Obtient la couleur du stroke SVG selon le score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500';
  if (score >= 60) return 'stroke-lime-500';
  if (score >= 40) return 'stroke-yellow-500';
  if (score >= 20) return 'stroke-orange-500';
  return 'stroke-red-500';
}

/**
 * Obtient la classe de couleur de fond pour les badges
 */
function getBadgeColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-lime-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Détermine le niveau de confiance selon le score
 */
function getTrustLevelFromScore(score: number): TrustLevel {
  if (score >= 85) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  if (score >= 0) return 'very_low';
  return 'unknown';
}

/**
 * Obtient la traduction du niveau de confiance
 */
function getTrustLevelTranslation(t: Record<string, unknown>, level: TrustLevel): string {
  const key = `trust_levels.${level}` as keyof typeof t;
  return (t[key] as string) || level;
}

/**
 * Taille du cercle SVG selon la prop size
 */
const SIZE_CONFIG = {
  small: { circle: 60, stroke: 4, text: 'text-sm', circleSize: 188 },
  medium: { circle: 80, stroke: 5, text: 'text-lg', circleSize: 251 },
  large: { circle: 120, stroke: 6, text: 'text-2xl', circleSize: 377 },
};

/**
 * Composant TrustScore
 * Affiche un score visuel avec barre de progression et badge optionnel
 */
export default function TrustScore({
  score,
  trustLevel,
  showLabel = true,
  showBadge = true,
  size = 'medium',
  animated = true,
}: TrustScoreProps) {
  const { t } = useLanguage();
  
  // Détermine le niveau de confiance si non fourni
  const effectiveLevel = trustLevel || getTrustLevelFromScore(score);
  
  // Calcule la configuration de taille
  const sizeConfig = SIZE_CONFIG[size];
  
  // Calcule le pourcentage pour la barre SVG
  const percentage = useMemo(() => Math.min(100, Math.max(0, score)), [score]);
  
  // Rayon et circonférence pour le cercle
  const radius = (sizeConfig.circle - sizeConfig.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Traduction du niveau
  const levelLabel = getTrustLevelTranslation(t, effectiveLevel);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Cercle de score SVG */}
      <div className="relative" style={{ width: sizeConfig.circle, height: sizeConfig.circle }}>
        {/* Fond du cercle */}
        <svg
          className="transform -rotate-90"
          width={sizeConfig.circle}
          height={sizeConfig.circle}
          viewBox={`0 0 ${sizeConfig.circle} ${sizeConfig.circle}`}
        >
          {/* Cercle de fond */}
          <circle
            cx={sizeConfig.circle / 2}
            cy={sizeConfig.circle / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizeConfig.stroke}
            className="text-secondary-200"
          />
          {/* Cercle de progression */}
          <circle
            cx={sizeConfig.circle / 2}
            cy={sizeConfig.circle / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizeConfig.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${getScoreColor(score)} transition-all duration-1000 ${animated ? 'ease-out' : ''}`}
          />
        </svg>
        
        {/* Score texte au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-secondary-900 ${sizeConfig.text}`}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-secondary-500">/ 100</span>
        </div>
      </div>

      {/* Label du niveau de confiance */}
      {showLabel && (
        <div className={`trust-badge ${getTrustLevelClass(effectiveLevel)}`}>
          {/* Indicateur visuel */}
          <span 
            className={`w-2 h-2 rounded-full ${getBadgeColor(score)}`}
            aria-hidden="true"
          />
          <span>{levelLabel}</span>
        </div>
      )}

      {/* Badge optionnel */}
      {showBadge && (
        <div className="flex items-center gap-2 text-xs text-secondary-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t.results.overall_score}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Composant TrustBar
 * Version simplifiée avec barre de progression horizontale
 */
interface TrustBarProps {
  score: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrustBar({ score, showLabel = true, label, size = 'md', className = '' }: TrustBarProps) {
  const { t } = useLanguage();
  const effectiveLevel = getTrustLevelFromScore(score);
  const levelLabel = label || getTrustLevelTranslation(t, effectiveLevel);
  
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-secondary-600">{levelLabel}</span>
          <span className="text-sm font-medium text-secondary-900">{Math.round(score)}%</span>
        </div>
      )}
      <div className={`progress-bar ${heightClasses[size]}`}>
        <div
          className={`progress-bar-fill ${getBadgeColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/**
 * Composant TrustBadge
 * Badge simple avec le niveau de confiance
 */
interface TrustBadgeProps {
  score: number;
  trustLevel?: TrustLevel;
  showScore?: boolean;
  className?: string;
}

export function TrustBadge({ score, trustLevel, showScore = true, className = '' }: TrustBadgeProps) {
  const effectiveLevel = trustLevel || getTrustLevelFromScore(score);
  
  return (
    <div className={`trust-badge ${getTrustLevelClass(effectiveLevel)} ${className}`}>
      <span 
        className={`w-2 h-2 rounded-full ${getBadgeColor(score)}`}
        aria-hidden="true"
      />
      <span>{getTrustLevelTranslation({ trust_levels: useLanguage().t.trust_levels }, effectiveLevel)}</span>
      {showScore && (
        <span className="font-bold ml-1">({Math.round(score)})</span>
      )}
    </div>
  );
}
