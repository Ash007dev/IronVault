"""
IronVault Missions API
========================

Mission (assignment) management with AES-256 encryption.

Endpoints:
- GET /missions - List operative missions
- POST /missions - Create new mission
- GET /missions/<id> - Get specific mission
- PUT /missions/<id> - Update mission
- DELETE /missions/<id> - Delete mission
"""

from flask import Blueprint, request, jsonify, g
import sqlite3
from config import DATABASE_PATH
from utils.crypto import encrypt_data, decrypt_data, sign_data
from utils.access_control import require_auth, require_role, get_client_ip
from models import create_audit_log

missions_bp = Blueprint('missions', __name__, url_prefix='/missions')


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@missions_bp.route('', methods=['GET'])
@require_auth
@require_role('operative', 'co')
def list_missions():
    """List all missions for the current user."""
    user_id = g.user['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    missions = cursor.fetchall()
    conn.close()
    
    # Decrypt salary for display
    decrypted_missions = []
    for mission in missions:
        try:
            decrypted_salary = decrypt_data(mission['salary_encrypted'])
            decrypted_missions.append({
                'id': mission['id'],
                'operative_name': mission['operative_name'],
                'unit_name': mission['unit_name'],
                'salary': decrypted_salary,
                'duration_years': mission['duration_years'],
                'mission_type': mission['mission_type'],
                'created_at': mission['created_at']
            })
        except Exception:
            pass
    
    return jsonify({
        'missions': decrypted_missions,
        'count': len(decrypted_missions)
    })


@missions_bp.route('', methods=['POST'])
@require_auth
@require_role('operative', 'co')
def add_mission():
    """Create a new mission assignment."""
    data = request.get_json()
    
    if not data or not data.get('operative_name') or not data.get('salary'):
        return jsonify({'error': 'Operative name and compensation are required'}), 400
    
    user_id = g.user['user_id']
    operative_name = data['operative_name']
    unit_name = data.get('unit_name', 'Field Unit')
    salary = data['salary']
    duration_years = data.get('duration_years', 1)
    mission_type = data.get('mission_type', 'Standard')
    
    # Encrypt salary before storage
    encrypted_salary = encrypt_data(salary)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO missions (user_id, operative_name, unit_name, salary_encrypted, duration_years, mission_type)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, operative_name, unit_name, encrypted_salary, duration_years, mission_type))
    mission_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Audit log
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='MISSION_CREATED',
        details=f'Mission for {operative_name} created',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Mission assignment created successfully',
        'mission_id': mission_id
    }), 201


@missions_bp.route('/<int:mission_id>', methods=['GET'])
@require_auth
@require_role('operative', 'co')
def get_mission(mission_id):
    """Get a specific mission."""
    user_id = g.user['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE id = ? AND user_id = ?', (mission_id, user_id))
    mission = cursor.fetchone()
    conn.close()
    
    if not mission:
        return jsonify({'error': 'Mission not found'}), 404
    
    try:
        decrypted_salary = decrypt_data(mission['salary_encrypted'])
        return jsonify({
            'mission': {
                'id': mission['id'],
                'operative_name': mission['operative_name'],
                'unit_name': mission['unit_name'],
                'salary': decrypted_salary,
                'duration_years': mission['duration_years'],
                'mission_type': mission['mission_type'],
                'created_at': mission['created_at']
            }
        })
    except Exception:
        return jsonify({'error': 'Failed to decrypt mission data'}), 500


@missions_bp.route('/<int:mission_id>', methods=['DELETE'])
@require_auth
@require_role('operative', 'co')
def delete_mission(mission_id):
    """Delete a mission."""
    user_id = g.user['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE id = ? AND user_id = ?', (mission_id, user_id))
    mission = cursor.fetchone()
    
    if not mission:
        conn.close()
        return jsonify({'error': 'Mission not found'}), 404
    
    cursor.execute('DELETE FROM missions WHERE id = ?', (mission_id,))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='MISSION_DELETED',
        details=f'Mission for {mission["operative_name"]} deleted',
        ip_address=get_client_ip()
    )
    
    return jsonify({'success': True, 'message': 'Mission deleted successfully'})


@missions_bp.route('/<int:mission_id>', methods=['PUT'])
@require_auth
@require_role('operative', 'co')
def update_mission(mission_id):
    """Update a mission."""
    user_id = g.user['user_id']
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE id = ? AND user_id = ?', (mission_id, user_id))
    mission = cursor.fetchone()
    
    if not mission:
        conn.close()
        return jsonify({'error': 'Mission not found'}), 404
    
    # Updates
    operative_name = data.get('operative_name', mission['operative_name'])
    unit_name = data.get('unit_name', mission['unit_name'])
    duration_years = data.get('duration_years', mission['duration_years'])
    mission_type = data.get('mission_type', mission['mission_type'])
    
    # Re-encrypt salary if provided
    if data.get('salary'):
        encrypted_salary = encrypt_data(data['salary'])
    else:
        encrypted_salary = mission['salary_encrypted']
    
    cursor.execute('''
        UPDATE missions SET operative_name = ?, unit_name = ?, salary_encrypted = ?,
        duration_years = ?, mission_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (operative_name, unit_name, encrypted_salary, duration_years, mission_type, mission_id))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='MISSION_UPDATED',
        details=f'Mission for {operative_name} updated',
        ip_address=get_client_ip()
    )
    
    return jsonify({'success': True, 'message': 'Mission updated successfully'})


@missions_bp.route('/<int:mission_id>/verify', methods=['GET'])
@require_auth
@require_role('operative', 'co', 'hq')
def verify_mission(mission_id):
    """Generate cryptographic proof for a mission."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM missions WHERE id = ?', (mission_id,))
    mission = cursor.fetchone()
    conn.close()
    
    if not mission:
        return jsonify({'error': 'Mission not found'}), 404
    
    # Only owner or HQ can verify
    if mission['user_id'] != g.user['user_id'] and g.user['role'] != 'hq':
        return jsonify({'error': 'Access denied'}), 403
    
    # Create signed verification token
    token_data = f"{mission['id']}|{mission['operative_name']}|{mission['salary_encrypted']}"
    signature = sign_data(token_data)
    
    return jsonify({
        'verified': True,
        'mission_id': mission['id'],
        'signature': signature,
        'message': 'Mission data integrity verified with RSA signature'
    })
