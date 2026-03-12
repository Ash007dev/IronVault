# 🎖️ IronVault - Tactical Credentials System

A comprehensive cybersecurity demonstration platform featuring military-grade encryption, digital signatures, multi-factor authentication, WebAuthn/Passkeys, and role-based access control.

[![Course](https://img.shields.io/badge/Course-23CSE313-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()
[![Python](https://img.shields.io/badge/Python-3.10+-yellow)]()
[![Next.js](https://img.shields.io/badge/Next.js-15+-black)]()

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Security Implementation](#-security-implementation)
- [User Roles](#-user-roles--access-control)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Demo Accounts](#-demo-accounts)
- [Testing](#-testing)

---

## 🔍 Overview

IronVault is a secure credential management system designed to demonstrate enterprise-level security concepts in a military-themed context. The platform showcases real-world implementations of cryptographic protocols, secure authentication mechanisms, and access control patterns.

### Key Objectives

- **Encryption at Rest**: All sensitive data encrypted with AES-256-CBC
- **Digital Signatures**: Mission documents signed with RSA-2048-PSS
- **Multi-Factor Authentication**: Email OTP + WebAuthn/Passkey support
- **Role-Based Access Control**: Hierarchical permission system
- **Complete Audit Trail**: All security events logged and monitored

---

## ✨ Features

### 🔐 Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **Password Security** | PBKDF2-SHA256 (100K iterations) | Secure password storage |
| **Data Encryption** | AES-256-CBC with random IV | Protect sensitive data |
| **Digital Signatures** | RSA-2048-PSS | Document authenticity |
| **Token Auth** | JWT with HS256 | Stateless authentication |
| **MFA** | Email OTP (6-digit, 5-min expiry) | Second factor verification |
| **Passkeys** | WebAuthn/FIDO2 | Passwordless authentication |

### 👤 User Features by Role

**Field Operative:**
- Personal encrypted credential vault
- CSPRNG-based secure password generation
- View intel from Commanding Officers
- WebAuthn passkey registration

**Commanding Officer:**
- Issue encrypted intel directives
- View operative missions
- Create signed operations
- Team management

**Central Command (HQ):**
- Complete personnel oversight
- Audit log monitoring (War Room)
- System-wide visibility
- Security event filtering

---

## 🏗️ Architecture

```
IronVault/
├── backend/                      # Flask API Server
│   ├── app.py                   # Application entry point
│   ├── config.py                # Configuration & key paths
│   ├── models.py                # Database schema & operations
│   ├── routes/
│   │   ├── auth.py              # Authentication & MFA
│   │   ├── credentials.py       # Operative vault CRUD
│   │   ├── missions.py          # Mission management
│   │   ├── intel.py             # Intel & operations
│   │   └── admin.py             # HQ administration
│   ├── utils/
│   │   ├── access_control.py    # RBAC & JWT middleware
│   │   ├── crypto.py            # Encryption utilities
│   │   ├── otp.py               # OTP generation/verification
│   │   └── webauthn_utils.py    # Passkey utilities
│   └── keys/                    # Auto-generated keys (gitignored)
│
└── frontend/                     # Next.js 15 Web App
    └── src/
        ├── app/
        │   ├── page.tsx         # Login page
        │   ├── signup/          # Registration
        │   ├── reset-password/  # Password recovery
        │   ├── profile/         # User settings & passkeys
        │   ├── operative/       # Field operative dashboards
        │   ├── co/              # Commanding officer views
        │   └── hq/              # Central command panels
        ├── components/          # Reusable UI components
        └── lib/
            └── api.ts           # API client
```

---

## 🔒 Security Implementation

### Password Hashing

```python
# PBKDF2-SHA256 with high iteration count
password_hash = hashlib.pbkdf2_hmac(
    'sha256',
    password.encode(),
    salt,
    100000  # 100K iterations for brute-force resistance
)
```

### AES-256-CBC Encryption

```python
# Encrypt sensitive data
cipher = Cipher(
    algorithms.AES(key),      # 256-bit key
    modes.CBC(iv),            # Random 16-byte IV
    backend=default_backend()
)
# IV prepended to ciphertext for decryption
```

### RSA Digital Signatures

```python
# Sign mission documents with PSS padding
signature = private_key.sign(
    document_bytes,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)
```

### JWT Authentication Flow

```
1. User submits credentials
2. Server validates password hash
3. OTP sent to registered email
4. User submits OTP
5. JWT issued with user claims
6. Token included in subsequent requests
```

### WebAuthn/Passkey Flow

```
Registration:
1. Server generates challenge
2. Client creates credential (biometric/security key)
3. Server stores public key

Authentication:
1. Server sends challenge
2. Client signs with private key
3. Server verifies signature
```

---

## 👥 User Roles & Access Control

### Role Hierarchy

| Role | Code | Description | Clearance |
|------|------|-------------|-----------|
| **Field Operative** | `operative` | Field Agent | Level 1 |
| **Commanding Officer** | `co` | Unit Commander | Level 2 |
| **Central Command** | `hq` | HQ Administrator | Level 3 |

### Permissions Matrix

| Resource | Operative | CO | HQ |
|----------|-----------|----|----|
| Credentials Vault | CRUD (own) | ❌ | ❌ |
| Missions | CRUD (own) | Read/Create | Read |
| Intel Reports | Read | CRUD | Read |
| Operations | ❌ | Create/Read | Read |
| Personnel | ❌ | ❌ | Read |
| Audit Logs | ❌ | ❌ | Read |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Gmail account (for OTP emails)

### 1. Clone & Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file for email
echo "EMAIL_USER=your-email@gmail.com" > .env
echo "EMAIL_PASS=your-app-password" >> .env

# Start server
python app.py
```

Server runs on **http://127.0.0.1:5000**

> **First Run**: Automatically generates:
> - 🔑 RSA-2048 key pair (`keys/private_key.pem`, `keys/public_key.pem`)
> - 🔐 AES-256 key (`keys/aes_key.key`)
> - 🗄️ SQLite database (`ironvault.db`)
> - 👤 Demo user accounts

### 2. Setup Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App runs on **http://localhost:3000**

### 3. Gmail App Password Setup

1. Enable 2-Factor Authentication on your Gmail
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in the `.env` file

---

## 📡 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create new user |
| `POST` | `/auth/login` | Initiate login (triggers OTP) |
| `POST` | `/auth/verify-otp` | Verify OTP and get JWT |
| `GET` | `/auth/me` | Get current user info |
| `POST` | `/auth/change-password` | Change password |
| `POST` | `/auth/request-password-reset` | Request reset OTP |
| `POST` | `/auth/reset-password` | Reset with OTP |

### WebAuthn Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/webauthn/register/options` | Get registration options |
| `POST` | `/auth/webauthn/register/verify` | Verify registration |
| `POST` | `/auth/webauthn/login/options` | Get authentication options |
| `POST` | `/auth/webauthn/login/verify` | Verify authentication |

### Resource Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `GET/POST` | `/credentials` | Credential vault | Operative |
| `GET/POST` | `/missions` | Mission assignments | All |
| `GET/POST` | `/intel` | Intel reports | CO/HQ |
| `POST` | `/intel/operation` | Create operation | CO |
| `GET` | `/admin/users` | List all users | HQ |
| `GET` | `/admin/audit-logs` | Audit trail | HQ |

---

## 🎮 Demo Accounts

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `hq_admin` | `admin123` | HQ | Central Command access |
| `alpha_co` | `manager123` | CO | Commanding Officer |
| `ghost_op` | `player123` | Operative | Field Operative |

> **Note**: OTP verification required for all logins

---

## 🧪 Testing

### Testing Scenarios

#### 1. Password Hashing Verification
```bash
# Login with correct credentials → Success
# Login with wrong password → "Invalid credentials"
```

#### 2. Encryption Testing
```bash
# Add credential to vault
# Check database → encrypted content (base64)
# View in app → decrypted plaintext
```

#### 3. Digital Signature Testing
```bash
# Create operation as CO
# View operation details → signature present
# Verify signature → "Valid"
```

#### 4. MFA Testing
```bash
# Login → OTP sent to email
# Submit correct OTP → Access granted
# Submit wrong OTP → "Invalid OTP"
# Wait 5 minutes → "OTP expired"
```

#### 5. RBAC Testing
```bash
# Operative accessing /admin → 403 Forbidden
# CO accessing /credentials → 403 Forbidden
# HQ accessing /admin → 200 OK
```

#### 6. Tamper Detection
```bash
# Create mission with signature
# Modify mission data in DB directly
# Verify signature → "Invalid signature detected"
```

#### 7. WebAuthn/Passkey Testing
```bash
# Register passkey in profile
# Logout and login with passkey
# No password required → Access granted
```

### Database Inspection

```bash
# Open SQLite database
sqlite3 backend/ironvault.db

# View users (passwords are hashed)
SELECT username, role, email FROM users;

# View encrypted credentials
SELECT target_system, encrypted_password FROM credentials;

# View audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/utils/crypto.py` | Encryption, signing, hashing |
| `backend/utils/access_control.py` | JWT & RBAC middleware |
| `backend/utils/otp.py` | OTP generation & verification |
| `backend/models.py` | Database schema & audit logging |
| `frontend/src/lib/api.ts` | API client with all endpoints |

---

## 🛡️ Security Considerations

1. **Keys**: Auto-generated on first run, stored in `backend/keys/`
2. **Database**: SQLite for demo, use PostgreSQL in production
3. **HTTPS**: Use HTTPS in production for encrypted transit
4. **Rate Limiting**: Implement for production deployment
5. **Key Rotation**: Implement periodic key rotation for production

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
