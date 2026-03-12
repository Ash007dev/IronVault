"""
IronVault Configuration
========================

Security parameters and application settings for the
Tactical Credentials System.

Security Features:
- AES-256-CBC for mission/intel encryption
- RSA-2048-PSS for operation signing
- PBKDF2-SHA256 for password hashing
- JWT for session management
- OTP for multi-factor authentication
"""

import os
from dotenv import load_dotenv
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# Load environment variables from .env file
load_dotenv()

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'ironvault.db')
UPLOADS_PATH = os.path.join(os.path.dirname(__file__), 'uploads')
KEYS_PATH = os.path.join(os.path.dirname(__file__), 'keys')

# Create directories if they don't exist
os.makedirs(UPLOADS_PATH, exist_ok=True)
os.makedirs(KEYS_PATH, exist_ok=True)

# =============================================================================
# EMAIL / SMTP CONFIGURATION
# =============================================================================
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_SERVER = "smtp.gmail.com"
MAIL_PORT = 587

# =============================================================================
# KEY MANAGEMENT
# =============================================================================
RSA_PRIVATE_KEY_PATH = os.path.join(KEYS_PATH, 'private_key.pem')
RSA_PUBLIC_KEY_PATH = os.path.join(KEYS_PATH, 'public_key.pem')
AES_KEY_PATH = os.path.join(KEYS_PATH, 'aes_key.bin')


def load_or_generate_rsa_keys():
    """
    Load existing RSA keys or generate new ones.
    Keys are persisted to maintain signature validity across restarts.
    """
    if os.path.exists(RSA_PRIVATE_KEY_PATH) and os.path.exists(RSA_PUBLIC_KEY_PATH):
        # Load existing keys
        with open(RSA_PRIVATE_KEY_PATH, 'rb') as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )
        with open(RSA_PUBLIC_KEY_PATH, 'rb') as f:
            public_key = serialization.load_pem_public_key(
                f.read(),
                backend=default_backend()
            )
        print("[OK] Loaded existing RSA keys from disk")
    else:
        # Generate new keys
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        # Save keys to disk
        with open(RSA_PRIVATE_KEY_PATH, 'wb') as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        with open(RSA_PUBLIC_KEY_PATH, 'wb') as f:
            f.write(public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        print("[OK] Generated new RSA-2048 key pair")
    
    return private_key, public_key


def load_or_generate_aes_key():
    """
    Load existing AES key or generate a new one.
    """
    if os.path.exists(AES_KEY_PATH):
        with open(AES_KEY_PATH, 'rb') as f:
            aes_key = f.read()
        print("[OK] Loaded existing AES-256 key from disk")
    else:
        aes_key = os.urandom(32)  # 256 bits
        with open(AES_KEY_PATH, 'wb') as f:
            f.write(aes_key)
        print("[OK] Generated new AES-256 key")
    
    return aes_key


# Initialize keys at module load
RSA_PRIVATE_KEY, RSA_PUBLIC_KEY = load_or_generate_rsa_keys()
AES_KEY = load_or_generate_aes_key()

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
JWT_SECRET = os.getenv('SECRET_KEY', 'ironvault-jwt-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24

# =============================================================================
# OTP CONFIGURATION
# =============================================================================
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5

# =============================================================================
# WEBAUTHN CONFIGURATION
# =============================================================================
RP_ID = "localhost"
RP_NAME = "IronVault"
# Support multiple localhost ports for development
WEBAUTHN_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
ORIGIN = "http://localhost:3000"  # Default fallback

# =============================================================================
# PASSWORD POLICY (NIST SP 800-63-2)
# =============================================================================
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_LOWERCASE = True
PASSWORD_REQUIRE_DIGIT = True
PASSWORD_REQUIRE_SPECIAL = True

# PBKDF2 Configuration (NIST recommended: 100,000+ iterations)
PBKDF2_ITERATIONS = 100000

# =============================================================================
# ACCESS CONTROL MATRIX (ACM)
# =============================================================================
# 3 Subjects: operative, co, hq
# 4 Objects: missions, intel, operations, personnel, audit_logs

ACCESS_CONTROL_MATRIX = {
    'operative': {
        'missions': ['create', 'read', 'update', 'delete'],  # Manage own missions
        'credentials': ['create', 'read', 'update', 'delete'],  # Manage vault
        'intel': ['read'],  # View intel reports
        'personnel': [],  # No access
        'audit_logs': [],  # No access
    },
    'co': {
        'missions': ['create', 'read', 'update'],  # Manage operative missions
        'intel': ['create', 'read', 'update', 'delete'],  # Full control
        'operations': ['create', 'read'],  # Create operations
        'personnel': [],  # No access
        'audit_logs': [],  # No access
    },
    'hq': {
        'missions': ['read'],  # View all missions
        'intel': ['read'],  # View all intel
        'operations': ['read'],  # View all operations
        'personnel': ['read'],  # View all personnel
        'audit_logs': ['read'],  # View all audit logs
    }
}


def check_permission(role, resource, action):
    """Check if a role has permission to perform an action on a resource."""
    if role not in ACCESS_CONTROL_MATRIX:
        return False
    if resource not in ACCESS_CONTROL_MATRIX[role]:
        return False
    return action in ACCESS_CONTROL_MATRIX[role][resource]


# =============================================================================
# SECURITY FEATURES LIST (For Display)
# =============================================================================
SECURITY_FEATURES = [
    'AES-256-CBC encryption for sensitive data',
    'RSA-PSS digital signatures for bid verification',
    'PBKDF2 with 100,000 iterations for password hashing',
    'Role-based access control (RBAC) with ACM',
    'Multi-factor authentication (OTP + WebAuthn)',
    'JWT-based session management'
]

# Security concepts for documentation
SECURITY_CONCEPTS = {
    'encryption': 'Converting plaintext to ciphertext using AES-256-CBC',
    'hashing': 'One-way function to store passwords securely with PBKDF2',
    'digital_signatures': 'RSA-PSS signatures to verify auction bid authenticity',
    'mfa': 'Multi-factor authentication combining password + OTP',
    'webauthn': 'Passwordless authentication using biometrics/passkeys'
}

# Countermeasures for common threats
COUNTERMEASURES = {
    'sql_injection': 'Parameterized queries in all database operations',
    'xss': 'Content-Security-Policy headers and input sanitization',
    'csrf': 'Token-based verification for state-changing requests',
    'brute_force': 'Rate limiting and account lockout after failed attempts',
    'mitm': 'HTTPS encryption for all communications'
}
