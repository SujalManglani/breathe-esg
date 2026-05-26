# Breathe ESG

Smart ESG Emissions Dashboard built with React + Django REST Framework.

This project simulates an enterprise ESG ingestion and analyst review platform for handling emissions data from multiple business sources such as SAP systems, utility providers, and travel vendors.

---

# Features

- CSV ingestion pipeline
- Multi-source ESG data handling
- SAP, Utility, and Travel source support
- Unit normalization
- Emission calculations
- Suspicious record detection
- Analyst review workflow
- Record approval/rejection/locking
- Audit logging
- Dashboard analytics
- Modern glassmorphism UI
- Source-aware validation
- Raw payload preservation

---

# Tech Stack

## Frontend
- React
- TailwindCSS
- Axios
- Chart.js

## Backend
- Django
- Django REST Framework
- Pandas
- SQLite

---

# Project Structure

```bash
BREATHE-ESG/
│
├── backend/
│   ├── config/
│   ├── ingestion/
│   ├── sample_data/
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│
├── README.md
├── MODEL.md
├── DECISIONS.md
├── TRADEOFFS.md
├── SOURCES.md
└── .gitignore