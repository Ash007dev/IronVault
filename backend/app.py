"""
IronVault - Tactical Credentials System
==========================================

A comprehensive demonstration of cybersecurity concepts including:
- Encryption (AES-256-CBC)
- Digital Signatures (RSA-PSS)
- Multi-Factor Authentication (OTP)
- Role-Based Access Control (RBAC)
- Password Hashing (PBKDF2-SHA256)

Course: 23CSE313 - Foundations of Cyber Security

Usage:
    python app.py
    
Server runs on http://127.0.0.1:5000

Demo Accounts:
    hq_admin / admin123 (Central Command)
    alpha_co / manager123 (Commanding Officer)
    ghost_op / player123 (Field Operative)
"""

from flask import Flask, jsonify
from flask_cors import CORS
from models import init_db
from routes.auth import auth_bp
from routes.missions import missions_bp
from routes.intel import intel_bp
from routes.admin import admin_bp
from routes.credentials import credentials_bp
from routes.documents import documents_bp

# =============================================================================
# APP INITIALIZATION
# =============================================================================

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Disable strict slashes to prevent 308 redirects on trailing slashes
    app.url_map.strict_slashes = False
    
    # Enable CORS for frontend - support all localhost ports
    CORS(app, resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://localhost:3001", 
                "http://localhost:3002",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:3002",
                "http://127.0.0.1:5173"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(missions_bp)
    app.register_blueprint(intel_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(credentials_bp)
    app.register_blueprint(documents_bp)
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'name': 'IronVault API',
            'version': '2.0.0',
            'description': 'Tactical Credentials System',
            'security_features': [
                'AES-256-CBC Encryption',
                'RSA-PSS Digital Signatures',
                'PBKDF2-SHA256 Password Hashing',
                'JWT Authentication',
                'Multi-Factor Authentication (OTP)',
                'Role-Based Access Control'
            ],
            'endpoints': {
                'auth': '/auth/*',
                'missions': '/missions/*',
                'intel': '/intel/*',
                'admin': '/admin/*',
                'credentials': '/credentials/*'
            }
        })
    
    # Health check
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'})
    
    return app


# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("[IRONVAULT] Tactical Credentials System")
    print("=" * 60)
    print("Course: 23CSE313 - Foundations of Cyber Security")
    print("=" * 60 + "\n")
    
    # Initialize database
    print("[*] Initializing database...")
    init_db()
    
    # Create app
    app = create_app()
    
    print("\n" + "=" * 60)
    print("[+] Server starting on http://127.0.0.1:5000")
    print("=" * 60)
    print("\n[API] Endpoints:")
    print("   POST /auth/register      - Create account")
    print("   POST /auth/login         - Login (sends OTP)")
    print("   POST /auth/verify-otp    - Complete MFA")
    print("   GET  /missions           - Operative mission vault")
    print("   POST /intel/*            - CO intel reports")
    print("   GET  /admin/personnel    - View all personnel")
    print("   GET  /admin/audit-logs   - Security logs")
    print("=" * 60 + "\n")
    
    # Run server on all interfaces
    app.run(debug=True, host='0.0.0.0', port=5000)

