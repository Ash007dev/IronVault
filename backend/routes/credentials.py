"""
IronVault Credentials Routes
============================
Handles personal credential vault for Operatives.
"""

from flask import Blueprint, request, jsonify, g
from models import get_db_connection, create_audit_log
from utils.crypto import aes_encrypt, aes_decrypt
from utils.access_control import require_auth, get_client_ip

credentials_bp = Blueprint('credentials', __name__, url_prefix='/credentials')


# =============================================================================
# INIT CREDENTIALS TABLE
# =============================================================================

def init_credentials_table():
    """Create the credentials table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
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
    conn.commit()
    conn.close()


# =============================================================================
# GET ALL CREDENTIALS
# =============================================================================

@credentials_bp.route('/', methods=['GET'])
@require_auth
def get_credentials():
    """Get all credentials for the current operative."""
    operator_id = g.user['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM credentials WHERE operator_id = ? ORDER BY created_at DESC',
        (operator_id,)
    )
    creds = cursor.fetchall()
    conn.close()
    
    result = []
    for cred in creds:
        cred_dict = dict(cred)
        # Decrypt access code for display
        try:
            cred_dict['access_code'] = aes_decrypt(cred_dict['access_code'], cred_dict['iv'])
        except:
            cred_dict['access_code'] = "[DECRYPTION ERROR]"
        result.append(cred_dict)
    
    return jsonify({'credentials': result})


# =============================================================================
# CREATE CREDENTIAL
# =============================================================================

@credentials_bp.route('/', methods=['POST'])
@require_auth
def create_credential():
    """Create a new credential."""
    data = request.get_json()
    
    if not data or not data.get('target_system') or not data.get('callsign') or not data.get('access_code'):
        return jsonify({'error': 'Target system, callsign, and access code are required'}), 400
    
    operator_id = g.user['user_id']
    
    # Encrypt the access code
    encrypted_code, iv = aes_encrypt(data['access_code'])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO credentials (operator_id, target_system, callsign, access_code, iv, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (operator_id, data['target_system'], data['callsign'], encrypted_code, iv, data.get('notes', '')))
    conn.commit()
    credential_id = cursor.lastrowid
    conn.close()
    
    create_audit_log(
        user_id=operator_id,
        username=g.user['username'],
        action='CREDENTIAL_CREATED',
        details=f"Created credential for: {data['target_system']}",
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Credential stored securely',
        'credential': {
            'id': credential_id,
            'target_system': data['target_system']
        }
    }), 201


# =============================================================================
# UPDATE CREDENTIAL
# =============================================================================

@credentials_bp.route('/<int:id>', methods=['PUT'])
@require_auth
def update_credential(id):
    """Update an existing credential."""
    operator_id = g.user['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM credentials WHERE id = ? AND operator_id = ?', (id, operator_id))
    credential = cursor.fetchone()
    
    if not credential:
        conn.close()
        return jsonify({'error': 'Credential not found'}), 404
    
    data = request.get_json()
    
    # Build update query dynamically
    updates = []
    values = []
    
    if data.get('target_system'):
        updates.append('target_system = ?')
        values.append(data['target_system'])
    if data.get('callsign'):
        updates.append('callsign = ?')
        values.append(data['callsign'])
    if data.get('access_code'):
        encrypted_code, iv = aes_encrypt(data['access_code'])
        updates.append('access_code = ?')
        values.append(encrypted_code)
        updates.append('iv = ?')
        values.append(iv)
    if 'notes' in data:
        updates.append('notes = ?')
        values.append(data['notes'])
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    values.append(id)
    values.append(operator_id)
    
    cursor.execute(
        f'UPDATE credentials SET {", ".join(updates)} WHERE id = ? AND operator_id = ?',
        values
    )
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=operator_id,
        username=g.user['username'],
        action='CREDENTIAL_UPDATED',
        details=f"Updated credential ID: {id}",
        ip_address=get_client_ip()
    )
    
    return jsonify({'success': True, 'message': 'Credential updated'})


# =============================================================================
# DELETE CREDENTIAL
# =============================================================================

@credentials_bp.route('/<int:id>', methods=['DELETE'])
@require_auth
def delete_credential(id):
    """Delete a credential."""
    operator_id = g.user['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get the credential first for audit log
    cursor.execute('SELECT target_system FROM credentials WHERE id = ? AND operator_id = ?', (id, operator_id))
    credential = cursor.fetchone()
    
    if not credential:
        conn.close()
        return jsonify({'error': 'Credential not found'}), 404
    
    target = credential['target_system']
    
    cursor.execute('DELETE FROM credentials WHERE id = ? AND operator_id = ?', (id, operator_id))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=operator_id,
        username=g.user['username'],
        action='CREDENTIAL_DELETED',
        details=f"Deleted credential: {target}",
        ip_address=get_client_ip()
    )
    
    return jsonify({'success': True, 'message': 'Credential scrubbed'})


# =============================================================================
# GET SINGLE CREDENTIAL
# =============================================================================

@credentials_bp.route('/<int:id>', methods=['GET'])
@require_auth
def get_credential(id):
    """Get a single credential."""
    operator_id = g.user['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM credentials WHERE id = ? AND operator_id = ?', (id, operator_id))
    credential = cursor.fetchone()
    conn.close()
    
    if not credential:
        return jsonify({'error': 'Credential not found'}), 404
    
    cred_dict = dict(credential)
    try:
        cred_dict['access_code'] = aes_decrypt(cred_dict['access_code'], cred_dict['iv'])
    except:
        cred_dict['access_code'] = "[DECRYPTION ERROR]"
    
    return jsonify({'credential': cred_dict})
