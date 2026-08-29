// Page Explorer - Graphe de connaissances
// Visualisation interactive des relations entre sources

import { useRouter } from 'next/router';
import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Données de démonstration pour le graphe
 */
const DEMO_NODES = [
  { id: '1', type: 'domain', label: 'lemonde.fr', score: 85, x: 400, y: 200 },
  { id: '2', type: 'domain', label: 'wikipedia.org', score: 92, x: 200, y: 150 },
  { id: '3', type: 'author', label: 'Marie Dupont', score: 78, x: 300, y: 300 },
  { id: '4', type: 'organization', label: 'Reuters', score: 88, x: 500, y: 150 },
  { id: '5', type: 'domain', label: 'bbc.com', score: 86, x: 600, y: 250 },
  { id: '6', type: 'claim', label: 'Climate Change', score: 70, x: 400, y: 400 },
  { id: '7', type: 'organization', label: 'IPCC', score: 95, x: 550, y: 400 },
];

const DEMO_EDGES = [
  { id: 'e1', source: '1', target: '3', type: 'authored_by' },
  { id: 'e2', source: '1', target: '6', type: 'reports_on' },
  { id: 'e3', source: '4', target: '6', type: 'reports_on' },
  { id: 'e4', source: '5', target: '6', type: 'reports_on' },
  { id: 'e5', source: '7', target: '6', type: 'verifies' },
  { id: 'e6', source: '2', target: '3', type: 'employs' },
];

/**
 * Obtient la couleur selon le type de nœud
 */
function getNodeColor(type: string): string {
  switch (type) {
    case 'domain': return '#3b82f6';
    case 'author': return '#8b5cf6';
    case 'organization': return '#10b981';
    case 'claim': return '#f59e0b';
    case 'narrative': return '#ef4444';
    default: return '#6b7280';
  }
}

/**
 * Obtient la couleur selon le score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

/**
 * Composant SVG pour le graphe
 */
function GraphVisualization({ nodes, edges, selectedNode, onNodeClick }: {
  nodes: typeof DEMO_NODES;
  edges: typeof DEMO_EDGES;
  selectedNode: string | null;
  onNodeClick: (id: string) => void;
}) {
  return (
    <svg 
      viewBox="0 0 800 500" 
      className="w-full h-full bg-secondary-50 rounded-xl"
      style={{ minHeight: '400px' }}
    >
      {/* Gradient definitions */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
        </marker>
      </defs>

      {/* Arêtes */}
      {edges.map((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;

        return (
          <g key={edge.id}>
            <line
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#d1d5db"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="transition-all duration-200"
            />
          </g>
        );
      })}

      {/* Nœuds */}
      {nodes.map((node) => {
        const isSelected = selectedNode === node.id;
        const radius = isSelected ? 30 : 25;
        const color = getNodeColor(node.type);

        return (
          <g
            key={node.id}
            onClick={() => onNodeClick(node.id)}
            className="cursor-pointer"
          >
            {/* Cercle externe (halo) si sélectionné */}
            {isSelected && (
              <circle
                cx={node.x}
                cy={node.y}
                r={radius + 8}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.5"
              />
            )}
            
            {/* Cercle principal */}
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill={color}
              stroke={isSelected ? '#1f2937' : 'white'}
              strokeWidth={isSelected ? 3 : 2}
              className="transition-all duration-200 hover:opacity-80"
            />
            
            {/* Indicateur de score */}
            <circle
              cx={node.x + 15}
              cy={node.y - 15}
              r={10}
              fill={getScoreColor(node.score)}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={node.x + 15}
              y={node.y - 11}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="white"
            >
              {node.score}
            </text>

            {/* Label */}
            <text
              x={node.x}
              y={node.y + radius + 18}
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              fill="#374151"
              className="select-none"
            >
              {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
            </text>

            {/* Type badge */}
            <text
              x={node.x}
              y={node.y - 5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="white"
              className="select-none"
            >
              {node.type.charAt(0).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Page Explorer
 */
export default function ExplorerPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtre les nœuds selon la recherche
  const filteredNodes = DEMO_NODES.filter(node => 
    node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Récupère les détails du nœud sélectionné
  const selectedNodeData = DEMO_NODES.find(n => n.id === selectedNode);

  /**
   * Gère le clic sur un nœud
   */
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  }, [selectedNode]);

  return (
    <Layout>
      <SEO 
        title={t.explorer.title}
        description={t.explorer.subtitle}
        canonical="/explorer"
      />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          {t.explorer.title}
        </h1>
        <p className="text-secondary-600">
          {t.explorer.subtitle}
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t.explorer.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        {/* Filtres */}
        <div className="flex items-center gap-2">
          {['domain', 'author', 'organization', 'claim'].map((type) => (
            <button
              key={type}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
              style={{ 
                borderColor: getNodeColor(type),
                color: getNodeColor(type),
                backgroundColor: `${getNodeColor(type)}10`
              }}
            >
              {t.explorer.node_types[type as keyof typeof t.explorer.node_types] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Graphe principal */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Zone du graphe */}
        <div className="lg:col-span-3 card-elevated p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary-900">{t.explorer.knowledge_graph}</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors" title={t.explorer.zoom_in}>
                <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors" title={t.explorer.zoom_out}>
                <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors" title={t.explorer.reset_view}>
                <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          <GraphVisualization
            nodes={searchQuery ? filteredNodes : DEMO_NODES}
            edges={DEMO_EDGES}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
          />

          {/* Légende */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-secondary-500">{t.explorer.legend}</span>
            {[
              { type: 'domain', labelKey: 'explorer.node_types.domain' },
              { type: 'author', labelKey: 'explorer.node_types.author' },
              { type: 'organization', labelKey: 'explorer.node_types.organization' },
              { type: 'claim', labelKey: 'explorer.node_types.claim' },
            ].map((item) => (
              <span key={item.type} className="flex items-center gap-1.5">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getNodeColor(item.type) }}
                />
                <span className="text-secondary-600">{String(
                  item.labelKey.split('.').reduce((obj: unknown, k: string) => (obj as Record<string, unknown>)?.[k], t)
                )}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Panneau de détails */}
        <div className="space-y-6">
          {/* Détails du nœud sélectionné */}
          {selectedNodeData ? (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">{t.explorer.details}</h3>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-secondary-100 rounded"
                >
                  <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-secondary-500">{t.explorer.name}</p>
                  <p className="font-medium text-secondary-900">{selectedNodeData.label}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">{t.explorer.type}</p>
                  <p className="font-medium text-secondary-900 capitalize">{selectedNodeData.type}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">{t.explorer.score}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-secondary-900">{selectedNodeData.score}/100</span>
                    <span 
                      className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: getScoreColor(selectedNodeData.score) }}
                    >
                      {selectedNodeData.score >= 80 ? t.explorer.high : selectedNodeData.score >= 60 ? t.explorer.medium : t.explorer.low}
                    </span>
                  </div>
                </div>
                
                <button 
                  className="btn-primary w-full mt-4"
                  onClick={() => router.push(`/search?q=${selectedNodeData.label}`)}
                >
                  {t.explorer.analyze}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-elevated p-6 text-center">
              <svg className="w-12 h-12 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-secondary-500">
                {t.explorer.click_node_prompt}
              </p>
            </div>
          )}

          {/* Statistiques */}
          <div className="card-elevated p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">{t.explorer.statistics}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">{t.explorer.nodes}</span>
                <span className="font-semibold text-secondary-900">{DEMO_NODES.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">{t.explorer.connections}</span>
                <span className="font-semibold text-secondary-900">{DEMO_EDGES.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">{t.explorer.avg_score}</span>
                <span className="font-semibold text-secondary-900">
                  {Math.round(DEMO_NODES.reduce((acc, n) => acc + n.score, 0) / DEMO_NODES.length)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


