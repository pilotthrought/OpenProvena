"""
OpenProvena Signal Agents — package exports.

Each agent lives in its own module for clean separation.
The trust_orchestrator imports directly from these modules.
"""

from app.agents.base import BaseAgent, SignalResult
from app.agents.domain_age import DomainAgeAgent
from app.agents.ownership import OwnershipAgent
from app.agents.citation_quality import CitationQualityAgent
from app.agents.factcheck import FactCheckAgent
from app.agents.editorial import EditorialQualityAgent
from app.agents.ai_detection import AIContentAgent
from app.agents.bot_detection import BotAmplificationAgent
from app.agents.narrative import NarrativePropagationAgent
from app.agents.security import SecurityRiskAgent
from app.agents.historical import HistoricalReliabilityAgent

ALL_AGENTS = [
    DomainAgeAgent,
    OwnershipAgent,
    CitationQualityAgent,
    FactCheckAgent,
    EditorialQualityAgent,
    AIContentAgent,
    BotAmplificationAgent,
    NarrativePropagationAgent,
    SecurityRiskAgent,
    HistoricalReliabilityAgent,
]

__all__ = [
    "BaseAgent",
    "SignalResult",
    "ALL_AGENTS",
    "DomainAgeAgent",
    "OwnershipAgent",
    "CitationQualityAgent",
    "FactCheckAgent",
    "EditorialQualityAgent",
    "AIContentAgent",
    "BotAmplificationAgent",
    "NarrativePropagationAgent",
    "SecurityRiskAgent",
    "HistoricalReliabilityAgent",
]
