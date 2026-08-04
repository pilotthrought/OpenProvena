-- ============================================
-- OpenProvena Database Initialization
-- Script SQL pour créer les tables initiales
-- ============================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: domains
-- Domaines analysés
-- ============================================
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    trust_level VARCHAR(20),
    category VARCHAR(50),
    domain_age INTEGER,
    registration_date TIMESTAMP,
    owner VARCHAR(255),
    registrar VARCHAR(255),
    ai_generated_probability DECIMAL(5,2) DEFAULT 0,
    content_quality DECIMAL(5,2) DEFAULT 0,
    fact_check_overlap DECIMAL(5,2) DEFAULT 0,
    citation_quality DECIMAL(5,2) DEFAULT 0,
    confidence DECIMAL(5,2) DEFAULT 0,
    explanation TEXT,
    last_analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_score ON domains(score);
CREATE INDEX IF NOT EXISTS idx_domains_trust_level ON domains(trust_level);
CREATE INDEX IF NOT EXISTS idx_domains_category ON domains(category);

-- ============================================
-- Table: analyses
-- Historique des analyses
-- ============================================
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    trust_level VARCHAR(20),
    category VARCHAR(50),
    ai_generated_probability DECIMAL(5,2) DEFAULT 0,
    content_quality DECIMAL(5,2) DEFAULT 0,
    confidence DECIMAL(5,2) DEFAULT 0,
    explanation TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les analyses récentes
CREATE INDEX IF NOT EXISTS idx_analyses_domain_id ON analyses(domain_id);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON analyses(analyzed_at DESC);

-- ============================================
-- Table: signals
-- Signaux de confiance détectés
-- ============================================
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    value DECIMAL(5,2) CHECK (value >= 0 AND value <= 100),
    weight DECIMAL(3,2) CHECK (weight >= 0 AND weight <= 1),
    category VARCHAR(50),
    source VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signals_analysis_id ON signals(analysis_id);
CREATE INDEX IF NOT EXISTS idx_signals_category ON signals(category);

-- ============================================
-- Table: narratives
-- Narratifs suivis
-- ============================================
CREATE TABLE IF NOT EXISTS narratives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    sentiment VARCHAR(20),
    spread_score INTEGER CHECK (spread_score >= 0 AND spread_score <= 100),
    reach BIGINT DEFAULT 0,
    velocity DECIMAL(5,2) DEFAULT 0,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_narratives_sentiment ON narratives(sentiment);
CREATE INDEX IF NOT EXISTS idx_narratives_spread_score ON narratives(spread_score DESC);

-- ============================================
-- Table: users
-- Utilisateurs (optionnel, pour le dashboard)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'viewer',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- Table: api_keys
-- Clés API pour l'authentification
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    rate_limit INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- ============================================
-- Table: audit_log
-- Journal d'audit pour la conformité
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- Table: recommendations
-- Recommandations générées
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    recommendation TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON recommendations(analysis_id);

-- ============================================
-- Fonctions trigger pour updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applique le trigger aux tables qui ont updated_at
CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Vues pour les statistiques
-- ============================================

-- Vue: Statistiques globales
CREATE OR REPLACE VIEW v_global_stats AS
SELECT 
    COUNT(DISTINCT d.id) as total_domains,
    COUNT(a.id) as total_analyses,
    ROUND(AVG(d.score), 2) as avg_score,
    COUNT(DISTINCT u.id) as total_users,
    MAX(a.analyzed_at) as last_analysis_at
FROM domains d
LEFT JOIN analyses a ON a.domain_id = d.id
LEFT JOIN users u ON u.created_at IS NOT NULL;

-- Vue: Top domaines par score
CREATE OR REPLACE VIEW v_top_domains AS
SELECT 
    domain,
    score,
    trust_level,
    category,
    last_analyzed_at
FROM domains
WHERE score IS NOT NULL
ORDER BY score DESC
LIMIT 100;

-- Vue: Narratifs tendance
CREATE OR REPLACE VIEW v_trending_narratives AS
SELECT 
    id,
    title,
    sentiment,
    spread_score,
    reach,
    velocity,
    last_updated_at
FROM narratives
WHERE last_updated_at > NOW() - INTERVAL '7 days'
ORDER BY spread_score DESC
LIMIT 20;

-- ============================================
-- Données de démonstration (optionnel)
-- ============================================
-- Décommenter pour ajouter des données de test

-- INSERT INTO domains (domain, score, trust_level, category, domain_age, owner) VALUES
--     ('lemonde.fr', 85, 'high', 'news', 7300, 'Le Monde'),
--     ('wikipedia.org', 92, 'very_high', 'educational', 5475, 'Wikimedia Foundation'),
--     ('twitter.com', 45, 'medium', 'social', 5110, 'Twitter Inc.'),
--     ('bbc.com', 88, 'high', 'news', 7300, 'BBC'),
--     ('nytimes.com', 82, 'high', 'news', 5110, 'NY Times');

COMMENT ON TABLE domains IS 'Domaines analysés par OpenProvena';
COMMENT ON TABLE analyses IS 'Historique des analyses de confiance';
COMMENT ON TABLE signals IS 'Signaux de confiance individuels détectés';
COMMENT ON TABLE narratives IS 'Narratifs suivis et leur propagation';
COMMENT ON TABLE users IS 'Utilisateurs de la plateforme';
COMMENT ON TABLE api_keys IS 'Clés API pour l''authentification externe';
