# AI + OCR + ML + Blockchain Document Verification Platform

> Institutional-grade, tamper-resistant document verification web platform integrating Optical Character Recognition (OCR), Error Level Analysis (ELA), Machine Learning anomaly detection, synthetic authorized registry validation, and EVM blockchain notarization.

---

## 1. Project Overview & Problem Statement

### Problem Statement
Traditional academic and institutional credential verification suffers from slow manual inspection, vulnerable digital repositories, and rampant forgery through digital manipulation. Modern verification systems must automate entity extraction, detect subtle splicing and compression anomalies, cross-reference authorized databases, and preserve an unalterable audit trail while strictly upholding data security and candidate privacy.

### Solution
**DocVerify.ai** is a full-stack, institutional-grade web platform that implements a 12-step verification lifecycle:
1. **Document Ingestion**: Multi-format support (PDF, PNG, JPG, JPEG) up to 10MB with strict MIME/payload validation.
2. **User Consent & Document Categorization**: Explicit consent declaration and classification (Degrees, Diplomas, Transcripts, Licenses).
3. **Computer Vision Preprocessing**: Orientation correction, noise reduction, and morphological thresholding.
4. **Optical Character Recognition (OCR)**: Sub-pixel word-level bounding boxes and clarity confidence scoring.
5. **Deterministic Document Understanding**: Field normalization mapping Certificate IDs, Candidate Names, DOB, Institutions, Courses, and Issue Years.
6. **Synthetic Authorized Registry Cross-Check**: Deterministic matching against clearly-labelled demo registries.
7. **Visual & Forensics Heatmap (ELA)**: Error Level Analysis (ELA) and edge discontinuity checks rendered on an interactive visual heatmap (Green, Yellow, Orange, Red).
8. **Explainable ML Anomaly Detection**: Isolation Forest model evaluating multi-dimensional feature vectors.
9. **Centralized Explainable Risk Engine**: Configurable transparent penalty weights yielding a 0–100 risk score and risk level (LOW, MEDIUM, HIGH).
10. **Definitive Decision Engine**: Classifies submissions into `VERIFIED`, `SUSPICIOUS`, or `REJECTED`.
11. **EVM Blockchain Notarization**: Canonical SHA-256 fingerprint registered on an EVM smart contract ledger (no private personal data or documents stored on-chain).
12. **Verification Receipt & QR Code**: Cryptographic printable receipt and public verification QR code pointing to safe public lookups.

---

## 2. Architecture

```text
                    WEBSITE (React + Vite)
                              │
               ┌──────────────┴──────────────┐
               │                             │
             PUBLIC                    OWNER / ADMIN
               │                             │
          ┌────┼─────┐                 ┌─────┴─────┐
          │    │     │                 │           │
        Verify Receipt Help Desk    Dashboard   Management
          │          │                    │
          │      Chatbot/Complaint        │
          │                               │
          └──────────────┬────────────────┘
                         │
                 FastAPI Backend
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         PostgreSQL      ML      Blockchain (EVM)
              │    (Isolation    (DocumentVerification.sol)
              ▼      Forest)
      Verification Data
```

React communicates **strictly** with FastAPI. React never directly connects to PostgreSQL, OCR libraries, ML models, or Blockchain RPC nodes.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router v7
- **Styling**: Tailwind CSS + Custom Design System (`#0F172A`, `#2563EB`, `#0EA5A4`, `#F8FAFC`)
- **Icons**: Lucide Icons
- **Motion**: Framer Motion
- **HTTP Client**: Axios with automatic JWT interceptors
- **QR Generator**: `qrcode.react`

### Backend
- **Framework**: Python 3.14 + FastAPI
- **Data Validation**: Pydantic v2
- **ORM & DB**: SQLAlchemy 2.0 + Alembic Migrations
- **Database Driver**: `psycopg` (v3 binary)
- **Database**: PostgreSQL 17
- **Auth & Cryptography**: JWT (HS256) + Argon2id Password Hashing (`argon2-cffi`)
- **Computer Vision**: OpenCV (`opencv-python`) + Pillow
- **OCR Engine**: Tesseract OCR / Optical Layout Bounding Box Analyzer
- **Machine Learning**: scikit-learn (Isolation Forest) + NumPy
- **QR Generation**: Python `qrcode[pil]`

### Blockchain
- **Smart Contract**: Solidity `^0.8.20` (`DocumentVerification.sol`)
- **Network**: EVM-Compatible (Chain ID: 31337 / Ethereum Testnets)
- **Web3 Driver**: Web3.py & ethers.js

---

## 4. Directory Structure

```text
document-verification/
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, RiskScore, HeatmapViewer, etc.)
│   │   ├── pages/              # 20+ Views (Home, Verify, Results, Admin, Owner, etc.)
│   │   ├── layouts/            # MainLayout and DashboardLayout
│   │   ├── services/           # Axios API client layer
│   │   ├── hooks/              # useAuth context hook
│   │   ├── animations/         # Framer Motion transitions
│   │   ├── App.jsx             # React Router routing table & guards
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Tailwind design tokens
│   ├── package.json
│   └── vite.config.js          # Tailwind Vite plugin & backend proxy
│
├── backend/
│   ├── main.py                 # FastAPI app, seeding lifecycle, static routes
│   ├── config.py               # Environment configuration
│   ├── database.py             # SQLAlchemy engine & session dependency
│   ├── auth/                   # Argon2 security, JWT tokens, RBAC dependencies
│   ├── models/                 # SQLAlchemy models (users, verifications, complaints)
│   ├── schemas/                # Pydantic schemas (Section 22 fixed contract)
│   ├── routes/                 # API routers (verify, public, complaints, faqs, admin, owner)
│   ├── services/               # 14 Modular microservices (OCR, ELA, Heatmap, Risk, etc.)
│   ├── data/
│   │   └── synthetic_registry.json # Clearly-labelled synthetic academic demo data
│   ├── migrations/             # Alembic migration scripts
│   └── uploads/                # Secured local documents & generated heatmaps
│
├── blockchain/
│   ├── contracts/
│   │   └── DocumentVerification.sol # EVM smart contract
│   └── deployment/
│       └── deploy.py           # EVM deployment helper
│
├── test_documents/
│   ├── genuine/                # Generates VERIFIED status
│   ├── modified/               # Generates SUSPICIOUS status + red heatmap
│   └── unknown/                # Generates REJECTED status
│
├── test_suite.py               # Automated end-to-end verification suite
├── alembic.ini                 # Database migrations configuration
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
└── README.md                   # Complete architectural guide
```

---

## 5. PostgreSQL Setup & Database Initialization

1. **Verify PostgreSQL is Running**:
   PostgreSQL 17 is configured locally on port `5432`.
   ```powershell
   Get-Service *postgre*
   ```

2. **Database Creation**:
   ```sql
   CREATE DATABASE document_verification;
   ```

3. **Configure `DATABASE_URL`** in `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/document_verification
   ```

4. **Run Alembic Migrations**:
   ```powershell
   python -m alembic upgrade head
   ```

5. **Tables Verified**:
   - `users`
   - `documents`
   - `registry_records`
   - `verification_results`
   - `verification_checks`
   - `blockchain_records`
   - `complaints`
   - `faq`
   - `website_content`
   - `verification_settings`
   - `admin_logs`

---

## 6. First Owner Setup

On the very first backend startup, the system automatically inspects if an `OWNER` account exists in PostgreSQL.
- If **no** Owner exists, it reads `OWNER_EMAIL`, `OWNER_NAME`, and `OWNER_INITIAL_PASSWORD` from `.env`, hashes the password with Argon2id, and creates the sole initial Owner.
- If an Owner **already** exists, no duplicate is created.
- Passwords are never logged, never returned by APIs, and cannot be viewed in Admin/Owner tables.

### Default Accounts for Demonstration:
| Role | Email | Password | Access Level |
|---|---|---|---|
| **OWNER** | `owner@docverify.local` | `OwnerSecurePass2026!` | Full Governance & Owner Panel |
| **ADMIN** | `admin@docverify.local` | `AdminPass2026!` | Operations & Security Dashboard |
| **USER** | `user@docverify.local` | `UserPass2026!` | Verification & Personal Dashboard |

*(Convenient 1-click credential fill buttons are built directly into the Login screen for testing!)*

---

## 7. Starting the Full-Stack Application

### Start the Backend (FastAPI)
```powershell
cd a:\sh2
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- API Health Endpoint: `http://127.0.0.1:8000/api/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### Start the Frontend (Vite + React)
```powershell
cd a:\sh2\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application: `http://localhost:5173`

---

## 8. Demo Document Scenarios & How to Test

Three synthetic test certificates are generated in `test_documents/` and available via **1-Click Demo Buttons** on the `/verify` page:

1. **Genuine Demo Document** (`test_documents/genuine/degree_certificate_genuine.png`):
   - Certificate ID: `CERT-2026-IND-01`
   - Candidate: `Rahul Sharma`
   - **Expected Outcome**: `VERIFIED` (Risk: 0/100, 100% Registry Match, Green Heatmap).
2. **Modified Demo Document** (`test_documents/modified/degree_certificate_modified.png`):
   - Certificate ID: `CERT-2026-IND-01`
   - Candidate: `Vikramaditya Roy` (Altered name with visual compression patch)
   - **Expected Outcome**: `SUSPICIOUS` (Candidate Name mismatch, Red Anomaly Heatmap region).
3. **Unknown Demo Document** (`test_documents/unknown/degree_certificate_unknown.png`):
   - Certificate ID: `CERT-9999-FAKE-00`
   - **Expected Outcome**: `REJECTED` (Not present in Synthetic Academic Registry).

---

## 9. Running the Automated Test Suite

An automated end-to-end integration test is provided in `test_suite.py`:
```powershell
python a:\sh2\test_suite.py
```
This tests:
- User signup and login with Argon2
- 401 Unauthorized password rejection
- RBAC permissions (User 403 on Admin/Owner, Admin 403 on Owner, Owner 200)
- End-to-end processing of Genuine, Modified, and Unknown documents
- Heatmap generation on disk
- On-chain EVM cryptographic proof registration
- Public verification with strict data privacy
- Complaint filing and admin resolution
- Owner website content editor and verification settings updates

---

## 10. Security & Privacy Safeguards

- **Zero-Knowledge Privacy**: No original document files, OCR raw text, or candidate personal identity data is stored on the blockchain.
- **Argon2id Password Security**: Passwords are never stored in plaintext and never transmitted in API responses.
- **Backend-Enforced RBAC**: Endpoint security is strictly enforced in FastAPI route dependencies; unauthorized requests receive `403 Forbidden`.
- **Public Verification Separation**: The public verification endpoint `/verify/{id}` exposes only non-sensitive cryptographic proofs (Document SHA-256 digest, EVM Transaction ID, Block number, and Status) without leaking source documents or internal forensic heatmaps.
- **Read-Only Blockchain**: Administrative panels have no functionality to modify, delete, or rewrite blockchain transactions.
#   d o c V e r i f y  
 