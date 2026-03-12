"""
IronVault Intel API
=========================

Intelligence reports and operations management with encryption and digital signatures.

Endpoints:
- GET /intel - List all intel reports
- POST /intel - Upload new intel
- DELETE /intel/<id> - Delete intel
- POST /intel/operation - Create operation (digitally signed)
- GET /intel/operations - List all operations
- POST /intel/verify-operation - Verify operation signature
"""

import os
import json
from flask import Blueprint, request, jsonify, g, send_file
import sqlite3
from config import DATABASE_PATH, UPLOADS_PATH
from utils.crypto import encrypt_data, decrypt_data, sign_data, verify_signature
from utils.access_control import require_auth, require_role, get_client_ip
from models import create_audit_log

intel_bp = Blueprint('intel', __name__, url_prefix='/intel')


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@intel_bp.route('', methods=['GET'])
@require_auth
def list_intel():
    """List all intel reports."""
    role = g.user['role']
    
    conn = get_db()
    cursor = conn.cursor()
    
    if role == 'co':
        # COs see only their own intel
        cursor.execute('SELECT * FROM intel WHERE uploaded_by = ? ORDER BY created_at DESC', (g.user['user_id'],))
    else:
        # Operatives and HQ see all intel (read-only)
        cursor.execute('SELECT * FROM intel ORDER BY created_at DESC')
    
    intel_reports = cursor.fetchall()
    conn.close()
    
    # Decrypt content for display
    decrypted_intel = []
    for intel in intel_reports:
        try:
            decrypted_content = decrypt_data(intel['encrypted_content'])
            decrypted_intel.append({
                'id': intel['id'],
                'title': intel['title'],
                'description': intel['description'],
                'intel_type': intel['intel_type'],
                'content': decrypted_content,
                'uploaded_by': intel['uploaded_by'],
                'created_at': intel['created_at']
            })
        except Exception:
            pass
    
    return jsonify({
        'intel': decrypted_intel,
        'count': len(decrypted_intel)
    })


@intel_bp.route('', methods=['POST'])
@require_auth
@require_role('co')
def upload_intel():
    """Upload a new intel report."""
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    user_id = g.user['user_id']
    title = data['title']
    description = data.get('description', '')
    intel_type = data.get('intel_type', 'Field Report')
    content = data['content']
    
    # Encrypt intel content
    encrypted_content = encrypt_data(content)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO intel (uploaded_by, title, description, intel_type, encrypted_content)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, title, description, intel_type, encrypted_content))
    intel_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='INTEL_UPLOADED',
        details=f'Intel report "{title}" uploaded',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Intel report uploaded successfully',
        'intel_id': intel_id
    }), 201


@intel_bp.route('/<int:intel_id>', methods=['DELETE'])
@require_auth
@require_role('co')
def remove_intel(intel_id):
    """Delete an intel report."""
    user_id = g.user['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM intel WHERE id = ? AND uploaded_by = ?', (intel_id, user_id))
    intel = cursor.fetchone()
    
    if not intel:
        conn.close()
        return jsonify({'error': 'Intel not found or access denied'}), 404
    
    cursor.execute('DELETE FROM intel WHERE id = ?', (intel_id,))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='INTEL_DELETED',
        details=f'Intel ID {intel_id} deleted',
        ip_address=get_client_ip()
    )
    
    return jsonify({'success': True, 'message': 'Intel report deleted'})


# =============================================================================
# OPERATIONS (Digitally Signed) - formerly Bids
# =============================================================================

@intel_bp.route('/operation', methods=['POST'])
@require_auth
@require_role('co')
def create_operation():
    """Create an operation with digital signature."""
    data = request.get_json()
    
    if not data or not data.get('operative_name') or not data.get('budget_amount'):
        return jsonify({'error': 'Operative name and budget amount are required'}), 400
    
    user_id = g.user['user_id']
    operative_name = data['operative_name']
    budget_amount = int(data['budget_amount'])
    
    # Create operation data for signing
    op_data = json.dumps({
        'co_id': user_id,
        'operative_name': operative_name,
        'budget_amount': budget_amount,
        'timestamp': str(request.environ.get('REQUEST_TIME', ''))
    }, sort_keys=True)
    
    # Sign the operation
    signature = sign_data(op_data)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO operations (co_id, operative_name, budget_amount, op_data, signature)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, operative_name, budget_amount, op_data, signature))
    op_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='OPERATION_CREATED',
        details=f'Operation budget ₹{budget_amount} Cr for {operative_name}',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Operation created and digitally signed',
        'operation_id': op_id,
        'signature': signature[:50] + '...'  # Show partial signature
    }), 201


@intel_bp.route('/operations', methods=['GET'])
@require_auth
def list_operations():
    """List operations."""
    role = g.user['role']
    
    conn = get_db()
    cursor = conn.cursor()
    
    if role == 'co':
        cursor.execute('SELECT * FROM operations WHERE co_id = ? ORDER BY created_at DESC', (g.user['user_id'],))
    else:
        cursor.execute('SELECT * FROM operations ORDER BY created_at DESC')
    
    operations = cursor.fetchall()
    conn.close()
    
    return jsonify({
        'operations': [{
            'id': op['id'],
            'operative_name': op['operative_name'],
            'budget_amount': op['budget_amount'],
            'status': op['status'],
            'has_signature': bool(op['signature']),
            'created_at': op['created_at']
        } for op in operations],
        'count': len(operations)
    })


@intel_bp.route('/verify-operation/<int:op_id>', methods=['GET'])
@require_auth
def verify_operation(op_id):
    """Verify the digital signature of an operation."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM operations WHERE id = ?', (op_id,))
    op = cursor.fetchone()
    conn.close()
    
    if not op:
        return jsonify({'error': 'Operation not found'}), 404
    
    op = dict(op)
    
    # Verify signature
    is_valid = verify_signature(op['op_data'], op['signature'])
    
    return jsonify({
        'operation_id': op_id,
        'operative_name': op['operative_name'],
        'budget_amount': op['budget_amount'],
        'signature_valid': is_valid,
        'verification_status': '✅ AUTHENTIC' if is_valid else '❌ TAMPERED',
        'message': 'Operation integrity verified' if is_valid else 'Operation may have been tampered with!'
    })


@intel_bp.route('/tamper-operation/<int:op_id>', methods=['POST'])
@require_auth
@require_role('hq')
def tamper_operation(op_id):
    """
    DEMO ONLY: Simulate tampering by modifying data WITHOUT updating the signature.
    This demonstrates how digital signatures detect unauthorized modifications.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM operations WHERE id = ?', (op_id,))
    op = cursor.fetchone()
    
    if not op:
        conn.close()
        return jsonify({'error': 'Operation not found'}), 404
    
    # Tamper the data: increase budget by 1 million (without re-signing!)
    original_budget = op['budget_amount']
    tampered_budget = original_budget + 1000000
    
    # Modify the op_data to reflect tampered budget (but keep old signature!)
    op_data_dict = json.loads(op['op_data'])
    op_data_dict['budget_amount'] = tampered_budget
    tampered_op_data = json.dumps(op_data_dict, sort_keys=True)
    
    # Update database with tampered data but KEEP the original signature
    cursor.execute('''
        UPDATE operations SET budget_amount = ?, op_data = ?
        WHERE id = ?
    ''', (tampered_budget, tampered_op_data, op_id))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=g.user['user_id'],
        username=g.user['username'],
        action='SECURITY_TAMPER_DEMO',
        details=f'Operation {op_id} tampered for demo: ${original_budget} → ${tampered_budget}',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': f'Data tampered! Budget changed from ${original_budget:,} to ${tampered_budget:,}. Signature NOT updated.',
        'original_budget': original_budget,
        'tampered_budget': tampered_budget,
        'hint': 'Now click Verify to detect the tampering!'
    })
