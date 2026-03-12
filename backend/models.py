"""
IronVault Database Models
==========================

SQLite database schema for the Tactical Credentials System.

Tables:
- users: Operative, CO, HQ accounts
- otp_codes: Multi-factor authentication codes
- missions: Encrypted assignment records
- intel: Encrypted intel documents
- operations: Digitally signed operations
- audit_logs: Security event tracking
- login_attempts: Rate limiting
- webauthn_credentials: Passkey storage
- credentials: Encrypted vault items
"""

import sqlite3
from config import DATABASE_PATH


def get_db_connection():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('operative', 'co', 'hq')),
            email TEXT,
            team_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # OTP codes for MFA
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Missions (formerly contracts - encrypted)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            operative_name TEXT NOT NULL,
            unit_name TEXT NOT NULL,
            salary_encrypted TEXT NOT NULL,
            duration_years INTEGER,
            mission_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Intel (formerly strategies - encrypted)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS intel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uploaded_by INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            intel_type TEXT,
            encrypted_content TEXT NOT NULL,
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    ''')
    
    # Operations (formerly bids - digitally signed)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS operations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            co_id INTEGER NOT NULL,
            operative_name TEXT NOT NULL,
            budget_amount INTEGER NOT NULL,
            op_data TEXT NOT NULL,
            signature TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (co_id) REFERENCES users(id)
        )
    ''')
    
    # Audit Logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Login Attempts (for rate limiting)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            ip_address TEXT,
            success INTEGER DEFAULT 0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Credentials Vault (IronVault - encrypted credential storage)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operator_id INTEGER NOT NULL,
            target_system TEXT NOT NULL,
            callsign TEXT NOT NULL,
            access_code TEXT NOT NULL,
            iv TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (operator_id) REFERENCES users(id)
        )
    ''')
    
    # WebAuthn Credentials (Passkeys)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS webauthn_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            credential_id TEXT NOT NULL,
            public_key TEXT NOT NULL,
            sign_count INTEGER DEFAULT 0,
            transports TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Encrypted Documents (PDFs with signature)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uploaded_by INTEGER NOT NULL,
            filename TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            classification TEXT DEFAULT 'CONFIDENTIAL',
            encrypted_token TEXT NOT NULL,
            original_token TEXT,
            original_size INTEGER NOT NULL,
            iv_size INTEGER NOT NULL,
            signature_size INTEGER NOT NULL,
            ciphertext_size INTEGER NOT NULL,
            is_tampered INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✓ Database initialized successfully")
    
    # Create demo accounts
    create_demo_accounts()


def create_demo_accounts():
    """Create demo accounts for testing."""
    from utils.crypto import hash_password
    
    # All accounts use same password and email for easy testing
    demo_password = 'Ash01@army'
    demo_email = 'ashish007tup@gmail.com'
    
    demo_users = [
        ('hq_admin', demo_password, 'hq', demo_email, 'Central Command'),
        ('alpha_co', demo_password, 'co', demo_email, 'Alpha Division'),
        ('ghost_op', demo_password, 'operative', demo_email, 'Field Operations'),
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for username, password, role, email, team in demo_users:
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if not cursor.fetchone():
            password_hash, salt = hash_password(password)
            cursor.execute('''
                INSERT INTO users (username, password_hash, salt, role, email, team_name)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, password_hash, salt, role, email, team))
            print(f"  ✓ Demo account created: {username} ({role})")
    
    conn.commit()
    conn.close()


# =============================================================================
# USER OPERATIONS
# =============================================================================

def create_user(username, password_hash, salt, role, email=None, team_name=None):
    """Create a new user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (username, password_hash, salt, role, email, team_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, password_hash, salt, role, email, team_name))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {'id': user_id, 'username': username, 'role': role}
    except sqlite3.IntegrityError:
        conn.close()
        return None


def get_user_by_username(username):
    """Get user by username."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None


def get_user_by_id(user_id):
    """Get user by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None


def get_user_by_email(email):
    """Get user by email address."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', (email,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None


def get_all_users():
    """Get all users."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, role, email, team_name, created_at FROM users')
    users = cursor.fetchall()
    conn.close()
    return [dict(u) for u in users]


def update_user_password(username, password_hash, salt):
    """Update user password."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users SET password_hash = ?, salt = ? WHERE username = ?
    ''', (password_hash, salt, username))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success


# =============================================================================
# OTP OPERATIONS
# =============================================================================

def create_otp(username, otp_code):
    """Create a new OTP code."""
    from datetime import datetime, timedelta
    from config import OTP_EXPIRY_MINUTES
    
    expires_at = datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO otp_codes (username, otp_code, expires_at)
        VALUES (?, ?, ?)
    ''', (username, otp_code, expires_at))
    conn.commit()
    conn.close()


def verify_otp(username, otp_code, consume=True):
    """Verify OTP code.
    
    Args:
        username (str): Username to verify OTP for
        otp_code (str): The OTP code to verify
        consume (bool): Whether to mark the OTP as used. Default True.
    
    Returns:
        bool: True if OTP is valid
    """
    from datetime import datetime
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM otp_codes 
        WHERE username = ? AND otp_code = ? AND used = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
    ''', (username, otp_code, datetime.now()))
    otp = cursor.fetchone()
    
    if otp:
        if consume:
            cursor.execute('UPDATE otp_codes SET used = 1 WHERE id = ?', (otp['id'],))
            conn.commit()
        conn.close()
        return True
    
    conn.close()
    return False


# =============================================================================
# MISSION OPERATIONS (formerly contracts)
# =============================================================================

def create_mission(user_id, operative_name, unit_name, salary_encrypted, duration_years=1, mission_type='Standard'):
    """Create a new mission assignment."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO missions (user_id, operative_name, unit_name, salary_encrypted, duration_years, mission_type)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, operative_name, unit_name, salary_encrypted, duration_years, mission_type))
    conn.commit()
    mission_id = cursor.lastrowid
    conn.close()
    return mission_id


def get_missions_by_user(user_id):
    """Get all missions for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    missions = cursor.fetchall()
    conn.close()
    return [dict(m) for m in missions]


def get_mission_by_id(mission_id):
    """Get mission by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE id = ?', (mission_id,))
    mission = cursor.fetchone()
    conn.close()
    return dict(mission) if mission else None


def delete_mission(mission_id, user_id):
    """Delete a mission."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM missions WHERE id = ? AND user_id = ?', (mission_id, user_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success


# =============================================================================
# INTEL OPERATIONS (formerly strategies)
# =============================================================================

def create_intel(uploaded_by, title, description, intel_type, encrypted_content, file_path=None):
    """Create a new intel report."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO intel (uploaded_by, title, description, intel_type, encrypted_content, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (uploaded_by, title, description, intel_type, encrypted_content, file_path))
    conn.commit()
    intel_id = cursor.lastrowid
    conn.close()
    return intel_id


def get_all_intel():
    """Get all intel reports."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.*, u.username as uploaded_by_name, u.team_name
        FROM intel i
        JOIN users u ON i.uploaded_by = u.id
        ORDER BY i.created_at DESC
    ''')
    intel = cursor.fetchall()
    conn.close()
    return [dict(i) for i in intel]


def get_intel_by_co(co_id):
    """Get intel uploaded by a specific CO."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM intel WHERE uploaded_by = ? ORDER BY created_at DESC', (co_id,))
    intel = cursor.fetchall()
    conn.close()
    return [dict(i) for i in intel]


def delete_intel(intel_id, co_id):
    """Delete an intel report."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM intel WHERE id = ? AND uploaded_by = ?', (intel_id, co_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success


# =============================================================================
# OPERATION OPERATIONS (formerly bids)
# =============================================================================

def create_operation(co_id, operative_name, budget_amount, op_data, signature):
    """Create a new operation."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO operations (co_id, operative_name, budget_amount, op_data, signature)
        VALUES (?, ?, ?, ?, ?)
    ''', (co_id, operative_name, budget_amount, op_data, signature))
    conn.commit()
    op_id = cursor.lastrowid
    conn.close()
    return op_id


def get_operations_by_co(co_id):
    """Get all operations by a CO."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM operations WHERE co_id = ? ORDER BY created_at DESC', (co_id,))
    operations = cursor.fetchall()
    conn.close()
    return [dict(o) for o in operations]


def get_all_operations():
    """Get all operations."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT o.*, u.username as co_name, u.team_name
        FROM operations o
        JOIN users u ON o.co_id = u.id
        ORDER BY o.created_at DESC
    ''')
    operations = cursor.fetchall()
    conn.close()
    return [dict(o) for o in operations]


# =============================================================================
# AUDIT LOG OPERATIONS
# =============================================================================

def create_audit_log(user_id, username, action, details=None, ip_address=None):
    """Create an audit log entry."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO audit_logs (user_id, username, action, details, ip_address)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, username, action, details, ip_address))
    conn.commit()
    conn.close()


def get_audit_logs(limit=100):
    """Get recent audit logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', (limit,))
    logs = cursor.fetchall()
    conn.close()
    return [dict(log) for log in logs]


# =============================================================================
# LOGIN ATTEMPTS (Rate Limiting)
# =============================================================================

def record_login_attempt(username, ip_address, success):
    """Record a login attempt."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO login_attempts (username, ip_address, success)
        VALUES (?, ?, ?)
    ''', (username, ip_address, 1 if success else 0))
    conn.commit()
    conn.close()


def is_rate_limited(username, ip_address, max_attempts=5, window_minutes=15):
    """Check if user is rate limited."""
    from datetime import datetime, timedelta
    
    conn = get_db_connection()
    cursor = conn.cursor()
    since = datetime.now() - timedelta(minutes=window_minutes)
    cursor.execute('''
        SELECT COUNT(*) as count FROM login_attempts
        WHERE (username = ? OR ip_address = ?) AND success = 0 AND timestamp > ?
    ''', (username, ip_address, since))
    result = cursor.fetchone()
    conn.close()
    return result['count'] >= max_attempts


def clear_login_attempts(username):
    """Clear login attempts for a user after successful login."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM login_attempts WHERE username = ?', (username,))
    conn.commit()
    conn.close()


# =============================================================================
# WEBAUTHN OPERATIONS
# =============================================================================

def create_webauthn_credential(user_id, credential_id, public_key, sign_count, transports):
    """Save a new WebAuthn credential."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO webauthn_credentials 
        (user_id, credential_id, public_key, sign_count, transports)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, credential_id, public_key, sign_count, str(transports)))
    conn.commit()
    conn.close()
    return True


def get_webauthn_credentials(user_id):
    """Get all credentials for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM webauthn_credentials WHERE user_id = ?', (user_id,))
    creds = cursor.fetchall()
    conn.close()
    return [dict(c) for c in creds]


def get_credential_by_id(credential_id):
    """Get a credential by its unique ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM webauthn_credentials WHERE credential_id = ?', (credential_id,))
    cred = cursor.fetchone()
    conn.close()
    return dict(cred) if cred else None


def update_credential_counter(credential_id, sign_count):
    """Update signature counter."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE webauthn_credentials SET sign_count = ? WHERE credential_id = ?',
        (sign_count, credential_id)
    )
    conn.commit()
    conn.close()


# =============================================================================
# SEED DEMO DATA
# =============================================================================

def seed_demo_users(hash_password_func):
    """Seed demo users (called from app.py)."""
    # Already handled in create_demo_accounts
    pass
