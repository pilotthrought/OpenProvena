// Composant SearchBar pour OpenProvena
// Barre de recherche principale avec validation d'URL

import React, { useState, useCallback, KeyboardEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  size?: 'default' | 'large';
  autoFocus?: boolean;
}

/**
 * Valide si une chaîne est une URL ou un domaine valide
 */
function isValidInput(input: string): boolean {
  if (!input.trim()) return false;
  
  // Patterns de validation
  const urlPattern = /^https?:\/\/.+/i;
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
  
  return urlPattern.test(input) || domainPattern.test(input);
}

/**
 * Composant SearchBar
 * Barre de recherche avec validation et feedback visuel
 */
export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder,
  size = 'default',
  autoFocus = false,
}: SearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');

  // Placeholder par défaut
  const inputPlaceholder = placeholder || t.hero.search_placeholder;

  /**
   * Gère la soumission de la recherche
   */
  const handleSubmit = useCallback(() => {
    const trimmedQuery = query.trim();
    
    // Validation de l'URL/domaine
    if (!trimmedQuery) {
      setError(t.errors.invalid_url);
      return;
    }
    
    if (!isValidInput(trimmedQuery)) {
      setError(t.errors.invalid_url);
      return;
    }
    
    setError('');
    onSearch(trimmedQuery);
  }, [query, onSearch, t]);

  /**
   * Gère l'événement Enter
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isLoading) {
        handleSubmit();
      }
    },
    [handleSubmit, isLoading]
  );

  /**
   * Gère le changement de valeur
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Efface l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  // Classes conditionnelles selon la taille
  const sizeClasses = {
    default: 'py-4 text-base',
    large: 'py-5 text-lg',
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Container principal */}
      <div
        className={`
          relative flex items-center
          bg-white rounded-2xl
          border-2 transition-all duration-200
          ${isFocused 
            ? 'border-primary-500 shadow-glow ring-4 ring-primary-100' 
            : 'border-secondary-200 hover:border-secondary-300'
          }
          ${error ? 'border-red-500' : ''}
          ${size === 'large' ? 'shadow-elevated' : 'shadow-card'}
        `}
      >
        {/* Icône de recherche */}
        <div className="pl-5 flex-shrink-0">
          <svg
            className={`w-6 h-6 ${isLoading ? 'text-primary-500 animate-pulse' : 'text-secondary-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isLoading ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            )}
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={inputPlaceholder}
          autoFocus={autoFocus}
          disabled={isLoading}
          className={`
            flex-1 px-4
            bg-transparent
            text-secondary-900
            placeholder:text-secondary-400
            ${sizeClasses[size]}
            focus:outline-none
            disabled:opacity-50
          `}
          aria-label={t.search.title}
          aria-invalid={!!error}
          aria-describedby={error ? 'search-error' : undefined}
        />

        {/* Bouton de recherche */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !query.trim()}
          className={`
            m-2 px-6 py-3
            bg-primary-600 text-white font-semibold
            rounded-xl
            transition-all duration-200
            hover:bg-primary-700 hover:shadow-lg
            focus:ring-4 focus:ring-primary-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${size === 'large' ? 'text-lg' : 'text-base'}
          `}
          aria-label={t.search.button}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t.search.analyzing}
            </span>
          ) : (
            t.search.button
          )}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <p 
          id="search-error" 
          className="mt-3 text-sm text-red-600 flex items-center gap-2"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Indices visuels */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-secondary-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          URL
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Domaine
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          HTTPS
        </span>
      </div>
    </div>
  );
}
