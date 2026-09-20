CaseAssist
Project Title

CaseAssist: A Multi-Agent AI Legal Rights and Dispute Intelligence Platform

Vision

CaseAssist is an AI-powered legal intelligence platform designed to help users understand legal issues, identify potentially relevant rights, analyze evidence readiness, detect inconsistencies, retrieve similar legal cases, assess risks, simulate possible dispute pathways, and generate actionable legal intelligence reports.

CaseAssist is a legal information and decision-support system.

It is NOT:

A lawyer
A judge
A law firm
A replacement for legal professionals
A system that determines guilt or innocence
A system that guarantees outcomes
Core Workflow

User Problem
↓
Fact Extraction Agent
↓
Legal Domain Classification Agent
↓
Rights Identification Agent
↓
Evidence Sufficiency Agent
↓
Contradiction Detection Agent
↓
Case Retrieval Agent
↓
Risk Prediction Agent
↓
Scenario Simulation Agent
↓
Action Recommendation Agent
↓
Verification Layer
↓
Legal Intelligence Report Generator
↓
Final Legal Intelligence Report

Multi-Agent Architecture
Agent 1 – Fact Extraction Agent

Purpose:

Extract structured facts from natural language.

Outputs:

Entities
Dates
Locations
Events
Claims
Timeline
Relationships

Primary AI:

NLP
NER
LLM extraction
Agent 2 – Legal Domain Classification Agent

Purpose:

Identify likely legal domain.

Examples:

Employment
Consumer
Property
Rental
Insurance
Cybercrime
Online Fraud
Contract
Financial
Other

Output:

Domain
Confidence
Explanation
Agent 3 – Rights Identification Agent

Purpose:

Identify potentially relevant rights, duties, protections and obligations.

Output must always use:

"Potentially relevant"

Never:

"You definitely have this right."

Agent 4 – Evidence Sufficiency Agent

Purpose:

Assess available evidence.

Outputs:

Available evidence
Missing evidence
Weakly supported claims
Evidence readiness score
Agent 5 – Contradiction Detection Agent

Purpose:

Detect:

Direct contradictions
Timeline inconsistencies
Missing information
Ambiguous statements

The system must never accuse users of dishonesty.

Agent 6 – Case Retrieval Agent

Purpose:

Retrieve semantically similar legal cases and documents.

Technology:

Embeddings
Vector Search
RAG

The system must not claim similar cases guarantee similar outcomes.

Agent 7 – Risk Prediction Agent

Purpose:

Estimate:

Evidence risk
Documentation risk
Missing-information risk
Procedural complexity risk

The system must never predict legal victory or guilt.

Agent 8 – Scenario Simulation Agent

Purpose:

Generate possible future pathways.

Examples:

Negotiation
Settlement
Complaint
Mediation
Legal proceedings

All outputs are hypothetical possibilities.

Agent 9 – Action Recommendation Agent

Purpose:

Provide explainable next-step recommendations.

Examples:

Organize evidence
Preserve communications
Gather documents
Consider dispute resolution channels
Seek professional legal assistance
Analytics Mapping
Descriptive Analytics
Fact Extraction
Case Summary
Domain Detection
Rights Overview
Diagnostic Analytics
Evidence Gaps
Missing Information
Contradiction Detection
Predictive Analytics
Risk Analysis
Scenario Simulation
Prescriptive Analytics
Recommendations
Suggested Next Steps
Privacy Rules

Uploaded user evidence:

Process temporarily
Analyze
Generate report
Delete automatically

Permanent storage of uploaded evidence is prohibited.

PostgreSQL and Qdrant must not be used as permanent storage for user evidence.

Technology Stack

Frontend:

React
Vite

Backend:

Spring Boot
Java 21

AI Service:

FastAPI
Python 3.11

Database:

PostgreSQL

Vector Database:

Qdrant

Version Control:

Git

Containerization:

Docker
LegalMind AI

LegalMind AI is a supporting assistant.

It explains:

Reports
Risk scores
Evidence analysis
Rights information
CaseAssist features

LegalMind AI is not the primary analysis engine.

UI Requirement

Main content:

70–75%

LegalMind AI:

25–30% width

Height:

40–50% viewport

Position:

Middle-right floating assistant

LegalMind AI must not be a full-height sidebar.

CaseState

CaseState is the shared structured memory used by all agents.

Each agent reads from CaseState and writes back to CaseState.

CaseState is the central orchestration object.

Current Development Phase

Phase 3:

System Setup and Foundation

Status:

In Progress