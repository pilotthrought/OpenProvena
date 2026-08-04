# OpenprovenaBeta

OPEN TRUST INFRASTRUCTURE
=============================================================
                 ┌────────────────────┐
                 │    UTILISATEURS    │
                 └──────────┬─────────┘
                 ┌────────────────────┐
                 ▼                    ▼
         ┌────────────────┐   ┌────────────────┐
         │  Web App       │   │ Public API     │
         │ Dashboard UI   │   │ REST/GraphQL   │
         └───────┬────────┘   └───────┬────────┘
                 │                    │
                 └────────────────────┘
                           │
                           ▼
               ┌─────────────────────────┐
               │     API GATEWAY         │
               │ Authentication / RBAC   │
               │ Rate Limiting / Billing │
               └───────────┬─────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Search Service │ │ Trust Scoring  │ │ Graph Explorer │
│ URL Lookup     │ │ Engine         │ │ Relationships  │
└──────┬─────────┘ └───────┬────────┘ └───────┬────────┘
       │                   │                  │
       └───────────────────┼──────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   TRUST ORCHESTRATOR     │
              │ Workflow / Pipelines     │
              │ Agent Coordination       │
              └────────────┬─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │ Source Agent  │ │ Content Agent │ │ Claims Agent  │
  │ Domain Trust  │ │ NLP Extraction│ │ Fact Signals  │
  └──────┬────────┘ └──────┬────────┘ └──────┬────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────┐
    │               SIGNAL LAYER                  │
    ├─────────────────────────────────────────────┤
    │ Domain Age                                  │
    │ Ownership Transparency                      │
    │ Citation Quality                            │
    │ Fact-check Overlap                          │
    │ Editorial Quality                           │
    │ AI-generated Content Detection              │
    │ Bot / Amplification Detection               │
    │ Narrative Propagation                       │
    │ Malware / Security Risk                     │
    │ Historical Reliability                      │
    └─────────────────────┬───────────────────────┘
                          │
                          ▼
             ┌──────────────────────────┐
             │     SCORING ENGINE       │
             │ Probabilistic Models     │
             │ Weighted Rules           │
             │ Confidence Estimation    │
             │ Explainability Layer     │
             └────────────┬─────────────┘
                          │
                          ▼
        ┌───────────────────────────┐
        │   KNOWLEDGE GRAPH LAYER   │
        │ Domains                   │
        │ Authors                   │
        │ Organizations             │
        │ Claims                    │
        │ Narratives                │
        │ Fact-checks               │
        │ Social Clusters           │
        └──────────┬────────────────┘
                   │
                   ▼
       ┌────────────────────────────┐
       │      DATA STORAGE          │
       ├────────────────────────────┤
       │ PostgreSQL                 │
       │ Neo4j / Memgraph           │
       │ Elasticsearch/OpenSearch   │
       │ ClickHouse                 │
       │ Object Storage (S3)        │
       └──────────┬─────────────────┘
                  │
                  ▼
      ┌──────────────────────────────┐
      │      INGESTION LAYER         │
      ├──────────────────────────────┤
      │ Web Crawlers                 │
      │ RSS Collectors               │
      │ Social Stream Ingestion      │
      │ YouTube / Podcast Parsing    │
      │ User Reports                 │
      │ Fact-check Databases         │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │      INFRASTRUCTURE          │
      ├──────────────────────────────┤
      │ Kubernetes                   │
      │ Docker                       │
      │ Kafka / RabbitMQ             │
      │ Ray / Celery                 │
      │ Redis Cache                  │
      │ CDN                          │
      │ Monitoring / Observability   │
      └──────────────────────────────┘
