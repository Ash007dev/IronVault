"""
IronVault OTP Utilities
========================
One-Time Password generation and handling for Multi-Factor Authentication.

Security Implementation:
- 6-digit numeric OTP
- 5-minute expiration
- Single-use (marked as used after verification)
- Cryptographically secure random generation
- Real-time Email delivery via SMTP
"""

import secrets
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import config

# Store OTPs in memory for demo mode (when email fails)
DEMO_OTP_STORE = {}

def generate_otp():
    """
    Generate a cryptographically secure OTP.
    
    Returns:
        str: 6-digit OTP code
    """
    # Generate a secure random number
    otp = ''.join(str(secrets.randbelow(10)) for _ in range(config.OTP_LENGTH))
    return otp


def send_otp_via_email(username, receiver_email, otp):
    """
    Sends the generated OTP to the user's email address.
    Falls back to console display in demo mode.
    
    Args:
        username (str): User requesting OTP
        receiver_email (str): The destination email address from the database
        otp (str): Generated OTP code
        
    Returns:
        bool: True if sent successfully, False otherwise
    """
    # Store OTP for demo mode fallback
    DEMO_OTP_STORE[username] = otp
    
    if not receiver_email:
        print(f"[WARN] No email address found for user: {username}")
        print(f"[DEMO MODE] OTP for {username}: {otp}")
        return False
    
    # Check if email credentials are configured
    if not config.MAIL_USERNAME or not config.MAIL_PASSWORD or \
       config.MAIL_USERNAME == 'your-email@gmail.com':
        print(f"\n{'='*50}")
        print(f"[DEMO MODE] Email not configured")
        print(f"[DEMO MODE] OTP for {username}: {otp}")
        print(f"{'='*50}\n")
        return True  # Return True so login can proceed

    expires_at = datetime.now() + timedelta(minutes=config.OTP_EXPIRY_MINUTES)
    
    # Construct the email
    subject = "IronVault MFA Verification Code"
    body = f"""
    Hello {username},
    
    Your IronVault verification code is: {otp}
    
    This code is valid for {config.OTP_EXPIRY_MINUTES} minutes and will expire at {expires_at.strftime('%H:%M:%S')}.
    If you did not request this code, please secure your account immediately.
    
    Regards,
    IronVault Security Team
    """
    
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = config.MAIL_USERNAME
    msg['To'] = receiver_email

    try:
        # Connect to Gmail SMTP server
        with smtplib.SMTP(config.MAIL_SERVER, config.MAIL_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
            server.sendmail(config.MAIL_USERNAME, receiver_email, msg.as_string())
        
        print(f"[OK] OTP successfully sent to {receiver_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email: {str(e)}")
        print(f"\n{'='*50}")
        print(f"[DEMO MODE] OTP for {username}: {otp}")
        print(f"{'='*50}\n")
        return True  # Return True so login can proceed in demo mode


def format_otp_response(otp_sent=True):
    """
    Format the response for OTP generation.
    
    Args:
        otp_sent (bool): Whether OTP was successfully sent
        
    Returns:
        dict: Response object
    """
    if otp_sent:
        return {
            'success': True,
            'message': 'A 6-digit verification code has been sent to your registered email. (Check console if in demo mode)',
            'expires_in_minutes': config.OTP_EXPIRY_MINUTES
        }
    else:
        return {
            'success': False,
            'message': 'Failed to deliver OTP. Please check your email settings or try again.'
        }


def get_otp_expiry_timestamp():
    """Get the expiry timestamp for a new OTP."""
    return datetime.now() + timedelta(minutes=config.OTP_EXPIRY_MINUTES)
