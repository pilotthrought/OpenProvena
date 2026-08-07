// Page À propos - About
// Présentation du projet OpenProvena

import React from 'react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Page À propos
 */
export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <SEO 
        title={t.about.title}
        description="Découvrez la mission et le fonctionnement d'OpenProvena"
        canonical="/about"
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 md:py-24">
        <div className="container-main">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 text-center">
            {t.about.title}
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto text-center leading-relaxed">
            Un standard ouvert pour évaluer la crédibilité de l'information
          </p>
        </div>
      </section>

      {/* Problème Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-main max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-8">
              Le problème
            </h2>
            
            <p className="text-secondary-600 mb-6 leading-relaxed">
              Aujourd'hui, on peut facilement vérifier si une connexion Internet est sécurisée.
              Mais, lorsqu'on lit un article, une réponse générée par une IA ou une publication sur un réseau social, 
              il est souvent très difficile de savoir rapidement :
            </p>
            
            <ul className="list-disc pl-6 mb-8 space-y-3 text-secondary-600">
              <li>d'où vient l'information ;</li>
              <li>quelles preuves la soutiennent ;</li>
              <li>si elle a été modifiée ;</li>
              <li>pourquoi on devrait lui faire confiance.</li>
            </ul>
            
            <p className="text-secondary-600 mb-6 leading-relaxed">
              On dispose d'outils pour sécuriser les communications.
            </p>
            
            <p className="text-secondary-600 leading-relaxed font-semibold">
              Beaucoup moins pour évaluer la confiance des informations elles-mêmes.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 md:py-20 bg-secondary-50">
        <div className="container-main max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-8">
              La solution : OpenProvena
            </h2>
            
            <p className="text-secondary-600 mb-6 leading-relaxed">
              C'est de cette réflexion qu'est né <strong className="text-primary-600">OpenProvena</strong>.
            </p>
            
            <p className="text-secondary-600 mb-6 leading-relaxed">
              L'idée est de construire un <strong>standard ouvert</strong> qui permette d'associer à une information :
            </p>
            
            <ul className="list-disc pl-6 mb-8 space-y-3 text-secondary-600">
              <li>sa <strong>provenance</strong> ;</li>
              <li>les <strong>preuves</strong> qui l'accompagnent ;</li>
              <li>différents <strong>indicateurs de confiance</strong>.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Principes Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-main max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-8">
              Nos principes
            </h2>
            
            <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-lg mb-8">
              <p className="text-secondary-700 leading-relaxed text-lg italic">
                "L'objectif n'est pas de décider de ce qui est vrai ou faux. 
                L'objectif est de donner à chacun les éléments nécessaires pour se faire son propre jugement."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnement Section */}
      <section className="py-16 md:py-20 bg-secondary-50">
        <div className="container-main">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary-900 mb-12 text-center">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Fonctionnalité 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Analyse</h3>
              <p className="text-secondary-600">
                Entrez une URL ou un domaine pour obtenir une analyse détaillée de sa crédibilité
              </p>
            </div>

            {/* Fonctionnalité 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Signaux</h3>
              <p className="text-secondary-600">
                Plus de 50 signaux analysés : âge du domaine, qualité des citations, transparence, etc.
              </p>
            </div>

            {/* Fonctionnalité 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Transparence</h3>
              <p className="text-secondary-600">
                Chaque score est expliqué avec les preuves qui le soutiennent
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-16 md:py-20 bg-primary-600">
        <div className="container-main text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            100% Open Source
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            OpenProvena est un projet communautaire. Tout le code est disponible, 
            les algorithmes sont transparents et documentés.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/pilotthrought/Openprovena"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Voir sur GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20 bg-secondary-900 text-white">
        <div className="container-main text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Contribuer
          </h2>
          <p className="text-secondary-300 mb-8 max-w-2xl mx-auto">
            Vous souhaitez participer au projet ? Découvrez comment contribuer sur GitHub.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/pilotthrought/Openprovena"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-secondary-800 font-semibold rounded-xl hover:bg-secondary-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.reddit.com/r/OpenProvena/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-secondary-800 font-semibold rounded-xl hover:bg-secondary-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
              </svg>
              Reddit
            </a>
            <a
              href="https://www.linkedin.com/company/openprovena"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-secondary-800 font-semibold rounded-xl hover:bg-secondary-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
