"""
IronVault HQ Admin API
====================

HQ Administrator endpoints for viewing personnel, operations, and audit logs.

Endpoints:
- GET /admin/personnel - List all personnel
- GET /admin/audit-logs - View security audit logs
- GET /admin/operations - View all operations
- GET /admin/acm - View Access Control Matrix
"""

from flask import Blueprint, jsonify, g
import sqlite3
from config import DATABASE_PATH, ACCESS_CONTROL_MATRIX
from utils.access_control import require_auth, require_role
from models import get_all_users, get_audit_logs

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@admin_bp.route('/users', methods=['GET'])
@require_auth
@require_role('hq')
def list_users():
    """List all registered personnel."""
    users = get_all_users()
    
    # Add role display names
    role_names = {
        'operative': '🎖️ Field Operative',
        'co': '⭐ Commanding Officer',
        'hq': '🏛️ Central Command'
    }
    
    for user in users:
        user['role_display'] = role_names.get(user['role'], user['role'])
    
    return jsonify({
        'users': users,
        'count': len(users),
        'by_role': {
            'operatives': len([u for u in users if u['role'] == 'operative']),
            'officers': len([u for u in users if u['role'] == 'co']),
            'command': len([u for u in users if u['role'] == 'hq'])
        }
    })


# Alias for personnel
@admin_bp.route('/personnel', methods=['GET'])
@require_auth
@require_role('hq')
def list_personnel():
    """List all registered personnel."""
    return list_users()


@admin_bp.route('/audit-logs', methods=['GET'])
@require_auth
@require_role('hq')
def list_audit_logs():
    """View security audit logs."""
    logs = get_audit_logs(limit=200)
    
    # Categorize actions
    action_icons = {
        'LOGIN_SUCCESS': '✅',
        'LOGIN_FAILED': '❌',
        'LOGIN_WEBAUTHN_SUCCESS': '👆',
        'REGISTER': '📝',
        'MISSION_CREATED': '🎯',
        'MISSION_DELETED': '🗑️',
        'INTEL_UPLOADED': '📊',
        'INTEL_DELETED': '🗑️',
        'OPERATION_CREATED': '⚡',
        'PASSWORD_RESET': '🔑',
        'CREDENTIAL_CREATED': '🔐',
        'CREDENTIAL_DELETED': '🗑️'
    }
    
    for log in logs:
        log['action_icon'] = action_icons.get(log['action'], '📌')
    
    return jsonify({
        'logs': logs,
        'count': len(logs)
    })


@admin_bp.route('/operations', methods=['GET'])
@require_auth
@require_role('hq')
def list_all_operations():
    """View all operations across units."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM operations ORDER BY created_at DESC')
    operations = cursor.fetchall()
    conn.close()
    
    total_budget = sum(op['budget_amount'] for op in operations)
    
    return jsonify({
        'operations': [{
            'id': op['id'],
            'operative_name': op['operative_name'],
            'budget_amount': op['budget_amount'],
            'budget_display': f"₹{op['budget_amount']} Cr",
            'status': op['status'],
            'created_at': op['created_at']
        } for op in operations],
        'count': len(operations),
        'total_budget': f"₹{total_budget} Cr"
    })


@admin_bp.route('/acm', methods=['GET'])
@require_auth
@require_role('hq')
def get_acm():
    """Get the Access Control Matrix."""
    return jsonify({
        'matrix': ACCESS_CONTROL_MATRIX,
        'subjects': ['operative', 'co', 'hq'],
        'objects': ['missions', 'intel', 'operations', 'personnel', 'audit_logs'],
        'description': 'Role-Based Access Control Matrix for IronVault'
    })


@admin_bp.route('/stats', methods=['GET'])
@require_auth
@require_role('hq')
def get_stats():
    """Get system statistics."""
    users = get_all_users()
    logs = get_audit_logs(limit=1000)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM operations')
    operations = cursor.fetchall()
    conn.close()
    
    total_budget = sum(op['budget_amount'] for op in operations)
    
    return jsonify({
        'personnel': {
            'total': len(users),
            'operatives': len([u for u in users if u['role'] == 'operative']),
            'officers': len([u for u in users if u['role'] == 'co']),
            'command': len([u for u in users if u['role'] == 'hq'])
        },
        'operations': {
            'total': len(operations),
            'total_budget': f"₹{total_budget} Cr",
            'pending': len([op for op in operations if op['status'] == 'pending']),
            'approved': len([op for op in operations if op['status'] == 'approved'])
        },
        'security': {
            'total_events': len(logs),
            'login_attempts': len([l for l in logs if 'LOGIN' in l['action']]),
            'failed_logins': len([l for l in logs if l['action'] == 'LOGIN_FAILED'])
        }
    })
