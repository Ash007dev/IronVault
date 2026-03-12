"""
IronVault Documents API
========================

Secure document upload with encryption and digital signatures.

Encrypted Token Format:
    Base64( IV[16 bytes] + Signature[256 bytes] + Ciphertext )
    
    - IV: Random initialization vector for AES-256-CBC
    - Signature: RSA-2048-PSS signature of ciphertext  
    - Ciphertext: AES-256-CBC encrypted file content

Endpoints:
- POST /documents/upload - Upload and encrypt a document
- GET /documents - List all documents
- GET /documents/<id> - Get document details
- GET /documents/<id>/download - Download decrypted document
- GET /documents/<id>/verify - Verify document signature
- POST /documents/<id>/tamper - Demo: Tamper with document (HQ only)
"""

import os
import json
from flask import Blueprint, request, jsonify, g, send_file
import sqlite3
from io import BytesIO
from config import DATABASE_PATH, UPLOADS_PATH
from utils.crypto import encrypt_file_with_signature, decrypt_file_with_signature
from utils.access_control import require_auth, require_role, get_client_ip
from models import create_audit_log

documents_bp = Blueprint('documents', __name__, url_prefix='/documents')


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@documents_bp.route('/upload', methods=['POST'])
@require_auth
@require_role('co')
def upload_document():
    """
    Upload and encrypt a document (PDF).
    The document is encrypted with AES-256-CBC and signed with RSA-PSS.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Only allow PDF files
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    # Get metadata
    title = request.form.get('title', file.filename)
    description = request.form.get('description', '')
    classification = request.form.get('classification', 'CONFIDENTIAL')
    
    # Read file data
    file_data = file.read()
    original_size = len(file_data)
    
    # Encrypt and sign the file
    encrypted_token, token_info = encrypt_file_with_signature(file_data)
    
    # Store in database
    user_id = g.user['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO documents (
            uploaded_by, filename, title, description, classification,
            encrypted_token, original_size, iv_size, signature_size, ciphertext_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id, file.filename, title, description, classification,
        encrypted_token, original_size,
        token_info['iv_size'], token_info['signature_size'], token_info['ciphertext_size']
    ))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Audit log
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='DOCUMENT_UPLOADED',
        details=f'Document "{title}" encrypted and uploaded ({original_size} bytes)',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Document encrypted and uploaded successfully',
        'document_id': doc_id,
        'encryption_info': {
            'format': token_info['format'],
            'iv_bytes': token_info['iv_size'],
            'signature_bytes': token_info['signature_size'],
            'ciphertext_bytes': token_info['ciphertext_size'],
            'total_encrypted_size': token_info['total_size'],
            'original_size': original_size
        },
        'token_preview': encrypted_token[:100] + '...'
    }), 201


@documents_bp.route('', methods=['GET'])
@require_auth
def list_documents():
    """List all documents."""
    role = g.user['role']
    
    conn = get_db()
    cursor = conn.cursor()
    
    if role == 'co':
        # COs see only their own documents
        cursor.execute('''
            SELECT d.*, u.username as uploader_name 
            FROM documents d 
            JOIN users u ON d.uploaded_by = u.id
            WHERE d.uploaded_by = ? 
            ORDER BY d.created_at DESC
        ''', (g.user['user_id'],))
    else:
        # Operatives and HQ see all documents
        cursor.execute('''
            SELECT d.*, u.username as uploader_name 
            FROM documents d 
            JOIN users u ON d.uploaded_by = u.id
            ORDER BY d.created_at DESC
        ''')
    
    documents = cursor.fetchall()
    conn.close()
    
    return jsonify({
        'documents': [{
            'id': doc['id'],
            'filename': doc['filename'],
            'title': doc['title'],
            'description': doc['description'],
            'classification': doc['classification'],
            'original_size': doc['original_size'],
            'uploaded_by': doc['uploader_name'],
            'created_at': doc['created_at'],
            'encrypted_token': doc['encrypted_token'],
            'is_tampered': bool(doc['is_tampered']) if 'is_tampered' in doc.keys() else False,
            'encryption_info': {
                'format': 'Base64( IV[16] + Signature[256] + Ciphertext )',
                'iv_bytes': doc['iv_size'],
                'signature_bytes': doc['signature_size'],
                'ciphertext_bytes': doc['ciphertext_size']
            }
        } for doc in documents],
        'count': len(documents)
    })


@documents_bp.route('/<int:doc_id>', methods=['GET'])
@require_auth
def get_document(doc_id):
    """Get document details including encrypted token."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT d.*, u.username as uploader_name 
        FROM documents d 
        JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?
    ''', (doc_id,))
    doc = cursor.fetchone()
    conn.close()
    
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    
    return jsonify({
        'document': {
            'id': doc['id'],
            'filename': doc['filename'],
            'title': doc['title'],
            'description': doc['description'],
            'classification': doc['classification'],
            'original_size': doc['original_size'],
            'uploaded_by': doc['uploader_name'],
            'created_at': doc['created_at'],
            'encrypted_token': doc['encrypted_token'],
            'encryption_info': {
                'format': 'Base64( IV[16 bytes] + Signature[256 bytes] + Ciphertext )',
                'iv_bytes': doc['iv_size'],
                'signature_bytes': doc['signature_size'],
                'ciphertext_bytes': doc['ciphertext_size'],
                'algorithm': 'AES-256-CBC + RSA-2048-PSS'
            }
        }
    })


@documents_bp.route('/<int:doc_id>/download', methods=['GET'])
@require_auth
def download_document(doc_id):
    """Download and decrypt a document."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
    doc = cursor.fetchone()
    conn.close()
    
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    
    # Decrypt the document
    success, result, signature_valid = decrypt_file_with_signature(doc['encrypted_token'])
    
    if not success:
        return jsonify({'error': f'Decryption failed: {result}'}), 500
    
    # Log the download
    create_audit_log(
        user_id=g.user['user_id'],
        username=g.user['username'],
        action='DOCUMENT_DOWNLOADED',
        details=f'Document "{doc["title"]}" downloaded (signature: {"valid" if signature_valid else "INVALID"})',
        ip_address=get_client_ip()
    )
    
    # Return the decrypted file
    return send_file(
        BytesIO(result),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=doc['filename']
    )


@documents_bp.route('/<int:doc_id>/verify', methods=['GET'])
@require_auth
def verify_document(doc_id):
    """Verify the digital signature of a document."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
    doc = cursor.fetchone()
    conn.close()
    
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    
    # Decrypt and verify
    success, result, signature_valid = decrypt_file_with_signature(doc['encrypted_token'])
    
    create_audit_log(
        user_id=g.user['user_id'],
        username=g.user['username'],
        action='DOCUMENT_VERIFIED',
        details=f'Document "{doc["title"]}" verification: {"AUTHENTIC" if signature_valid else "TAMPERED"}',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'document_id': doc_id,
        'title': doc['title'],
        'signature_valid': signature_valid,
        'verification_status': '✅ AUTHENTIC' if signature_valid else '❌ TAMPERED',
        'message': 'Digital signature verified - document is authentic' if signature_valid 
                   else 'SIGNATURE INVALID - Document has been tampered with!',
        'encryption_info': {
            'format': 'Base64( IV[16 bytes] + Signature[256 bytes] + Ciphertext )',
            'iv_bytes': doc['iv_size'],
            'signature_bytes': doc['signature_size'],
            'ciphertext_bytes': doc['ciphertext_size']
        }
    })


@documents_bp.route('/<int:doc_id>/tamper', methods=['POST'])
@require_auth
@require_role('hq')
def tamper_document(doc_id):
    """
    DEMO ONLY: Simulate tampering by corrupting the encrypted data.
    This demonstrates how digital signatures detect unauthorized modifications.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        return jsonify({'error': 'Document not found'}), 404
    
    # Store original token before tampering (for reset feature)
    original_token = doc['original_token'] or doc['encrypted_token']
    
    # Get the encrypted token and corrupt some bytes in the ciphertext area
    import base64
    encrypted_data = base64.b64decode(doc['encrypted_token'])
    
    # Convert to bytearray so we can modify it
    tampered_data = bytearray(encrypted_data)
    
    # Corrupt some bytes in the ciphertext portion (after IV[16] + Signature[256])
    if len(tampered_data) > 300:
        # Flip some bits in the ciphertext
        tampered_data[280] = (tampered_data[280] + 1) % 256
        tampered_data[281] = (tampered_data[281] + 1) % 256
        tampered_data[282] = (tampered_data[282] + 1) % 256
    
    # Re-encode
    tampered_token = base64.b64encode(bytes(tampered_data)).decode('utf-8')
    
    # Update database with tampered data and save original for reset
    cursor.execute('''
        UPDATE documents SET encrypted_token = ?, original_token = ?, is_tampered = 1
        WHERE id = ?
    ''', (tampered_token, original_token, doc_id))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=g.user['user_id'],
        username=g.user['username'],
        action='SECURITY_TAMPER_DEMO',
        details=f'Document "{doc["title"]}" tampered for demo purposes',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Document has been tampered! The ciphertext was modified but the signature was NOT updated.',
        'hint': 'Click Verify to detect the tampering - the RSA signature will now be invalid!',
        'tamper_details': {
            'bytes_modified': 3,
            'location': 'Ciphertext area (bytes 280-282)',
            'signature_updated': False
        }
    })


@documents_bp.route('/<int:doc_id>/reset', methods=['POST'])
@require_auth
@require_role('hq')
def reset_document(doc_id):
    """
    DEMO ONLY: Reset a tampered document to its original state.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM documents WHERE id = ?', (doc_id,))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        return jsonify({'error': 'Document not found'}), 404
    
    if not doc['original_token']:
        conn.close()
        return jsonify({'error': 'No original backup found - document was never tampered'}), 400
    
    # Restore the original token
    cursor.execute('''
        UPDATE documents SET encrypted_token = ?, is_tampered = 0
        WHERE id = ?
    ''', (doc['original_token'], doc_id))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=g.user['user_id'],
        username=g.user['username'],
        action='SECURITY_RESET_DEMO',
        details=f'Document "{doc["title"]}" reset to original state',
        ip_address=get_client_ip()
    )
    
    return jsonify({
        'success': True,
        'message': 'Document has been reset to its original state!',
        'hint': 'Click Verify to confirm - the RSA signature should now be valid again.'
    })


@documents_bp.route('/<int:doc_id>', methods=['DELETE'])
@require_auth
@require_role('co')
def delete_document(doc_id):
    """Delete a document."""
    user_id = g.user['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM documents WHERE id = ? AND uploaded_by = ?', (doc_id, user_id))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        return jsonify({'error': 'Document not found or access denied'}), 404
    
    cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
    conn.commit()
    conn.close()
    
    create_audit_log(
        user_id=user_id,
        username=g.user['username'],
        action='DOCUMENT_DELETED',
        details=f'Document "{doc["title"]}" deleted',
        ip_address=get_client_ip()
    )
    
    return jsonify({'success': True, 'message': 'Document deleted successfully'})
