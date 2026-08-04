// Page À propos - About
// Présentation du projet OpenProvena

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Équipe fondatrice
 */
const TEAM_MEMBERS = [
  {
    name: 'Dr. Marie Dubois',
    role: 'Directrice de recherche',
    bio: 'Experte en désinformation et médias numériques',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    name: 'Prof. Jean Martin',
    role: 'Architecte technique',
    bio: 'Spécialiste en systèmes d\'information et IA',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  },
  {
    name: 'Dr. Sophie Bernard',
    role: 'Responsable IA/NLP',
    bio: 'Rechercheuse en traitement du langage naturel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  },
];

/**
 * Partenaires et sponsors
 */
const PARTNERS = [
  { name: 'CNRS', logo: '/logos/cnrs.svg' },
  { name: 'Université Paris-Saclay', logo: '/logos/ups.svg' },
  { name: 'INRIA', logo: '/logos/inria.svg' },
  { name: 'European Research Council', logo: '/logos/erc.svg' },
];

/**
 * Page À propos
 */
export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <SEO 
        title={t.about.title}
        description="Découvrez la mission et l'équipe derrière OpenProvena"
        canonical="/about"
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-main text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
            {t.about.title}
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            OpenProvena est une infrastructure ouverte et communautaire dédiée à la lutte contre la désinformation 
            et à la promotion de l'accès à une information fiable et vérifiable.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container-main">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                Notre mission
              </span>
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">
                Combattre la désinformation par la transparence
              </h2>
              <p className="text-secondary-600 leading-relaxed mb-6">
                {t.about.mission_text}
              </p>
              <p className="text-secondary-600 leading-relaxed">
                Dans un monde où l'information circule instantanément, il est crucial de disposer d'outils 
                permettant de vérifier la crédibilité des sources. OpenProvena répond à ce besoin en fournissant 
                une plateforme open source, transparente et accessible à tous.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-600 mb-2">50+</p>
                  <p className="text-secondary-600 text-sm">Signaux analysés</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-600 mb-2">10K+</p>
                  <p className="text-secondary-600 text-sm">Utilisateurs actifs</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-600 mb-2">1M+</p>
                  <p className="text-secondary-600 text-sm">Analyses effectuées</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary-600 mb-2">100%</p>
                  <p className="text-secondary-600 text-sm">Open Source</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="py-20 bg-secondary-50">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Nos valeurs</h2>
            <div className="divider-gradient mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Transparence */}
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {t.about.transparency_title}
              </h3>
              <p className="text-secondary-600">
                {t.about.transparency_text}
              </p>
            </div>

            {/* Communauté */}
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {t.about.community_title}
              </h3>
              <p className="text-secondary-600">
                {t.about.community_text}
              </p>
            </div>

            {/* Open Source */}
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {t.about.open_source_title}
              </h3>
              <p className="text-secondary-600">
                {t.about.open_source_text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Équipe Section */}
      <section className="py-20 bg-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Équipe fondatrice</h2>
            <div className="divider-gradient mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="text-center">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-32 h-32 mx-auto mb-4 rounded-full object-cover shadow-md"
                />
                <h3 className="text-lg font-semibold text-secondary-900">{member.name}</h3>
                <p className="text-primary-600 text-sm mb-2">{member.role}</p>
                <p className="text-secondary-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partenaires Section */}
      <section className="py-20 bg-secondary-50">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">Partenaires et sponsors</h2>
            <p className="text-secondary-600">
              OpenProvena est soutenu par des institutions académiques et de recherche de premier plan
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-12">
            {PARTNERS.map((partner) => (
              <div 
                key={partner.name}
                className="flex items-center gap-3 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <div className="w-12 h-12 bg-secondary-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold">{partner.name.substring(0, 2)}</span>
                </div>
                <span className="font-medium">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-secondary-900 text-white">
        <div className="container-main text-center">
          <h2 className="text-3xl font-bold mb-4">{t.about.contact_title}</h2>
          <p className="text-secondary-300 mb-8">
            Vous avez des questions ou souhaitez contribuer au projet ?
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`mailto:${t.about.contact_email}`}
              className="px-8 py-4 bg-white text-secondary-900 font-semibold rounded-xl hover:bg-secondary-100 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t.about.contact_email}
            </a>
            <a
              href="https://github.com/openprovena/openprovena/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-secondary-800 font-semibold rounded-xl hover:bg-secondary-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Discussions GitHub
            </a>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary-600">
        <div className="container-main text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Rejoignez le mouvement OpenProvena
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Que vous soyez développeur, researcher, ou simplement quelqu'un qui se soucie de la qualité de l'information, 
            il y a une place pour vous dans notre communauté.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/getting-started"
              className="px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors duration-200"
            >
              Commencer
            </Link>
            <a
              href="https://github.com/openprovena/openprovena"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-primary-800 text-white font-semibold rounded-xl hover:bg-primary-900 transition-colors duration-200"
            >
              Contribuer sur GitHub
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
