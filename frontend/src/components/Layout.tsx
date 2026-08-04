// Layout principal pour OpenProvena
// Structure de base avec Header, Footer et contenu

import React, { ReactNode } from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  fullWidth?: boolean;
}

/**
 * Layout principal de l'application
 * Inclut Header et Footer ainsi que le contenu principal
 */
export default function Layout({ 
  children, 
  showFooter = true,
  fullWidth = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header />
      
      {/* Contenu principal */}
      <main 
        id="main-content"
        className="flex-1"
        role="main"
      >
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * Layout pour les pages de documentation
 */
export function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      
      <div className="flex-1 flex">
        {/* Sidebar de navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-secondary-200 bg-white">
          <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Documentation</h3>
            <ul className="space-y-2">
              <li>
                <a href="/docs/introduction" className="nav-link block">
                  Introduction
                </a>
              </li>
              <li>
                <a href="/docs/api" className="nav-link block">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/docs/authentication" className="nav-link block">
                  Authentication
                </a>
              </li>
              <li>
                <a href="/docs/sdks" className="nav-link block">
                  SDKs
                </a>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* Contenu */}
        <main className="flex-1 p-8" role="main">
          <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-card p-8">
            {children}
          </article>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

/**
 * Layout pour le dashboard
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Header />
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border-r border-secondary-200">
          <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard" className="nav-link block nav-link-active">
                  Vue d'ensemble
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analyses" className="nav-link block">
                  Mes analyses
                </Link>
              </li>
              <li>
                <Link href="/dashboard/favorites" className="nav-link block">
                  Favoris
                </Link>
              </li>
              <li>
                <Link href="/dashboard/alerts" className="nav-link block">
                  Alertes
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* Contenu principal */}
        <main className="flex-1 p-6" role="main">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
