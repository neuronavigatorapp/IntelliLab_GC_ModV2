Reporting Guide

Endpoints
- GET /api/v1/reports/calibration/{id}?format=pdf|csv|xlsx|json
- GET /api/v1/reports/sequence/{id}?format=csv|json
- GET /api/v1/reports/qc?limit=100&format=csv|json
- GET /api/v1/reports/audit?format=csv|json

Notes
- CSV exports are streaming-friendly and small
- PDF/XLSX require reportlab/pandas+openpyxl; service falls back to CSV if not available


