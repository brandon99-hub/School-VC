from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_welcome_email(user_email, first_name, password, role):
    """
    Sends a welcome email to a newly registered user with their credentials.
    """
    subject = f'Welcome to Kianda School - Your {role.capitalize()} Account'
    
    context = {
        'first_name': first_name,
        'email': user_email,
        'password': password,
        'role': role,
        'login_url': 'http://localhost:3000/login' # Base URL for the frontend
    }
    
    # HTML message
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #18216D;">Welcome to Kianda School!</h2>
                <p>Hello <strong>{first_name}</strong>,</p>
                <p>An account has been created for you as a <strong>{role.capitalize()}</strong>. You can now log in to the management portal using the credentials below:</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Username/Email:</strong> {user_email}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #eee; padding: 2px 5px;">{password}</code></p>
                </div>
                
                <p>For security reasons, we recommend that you change your password after your first login.</p>
                
                <a href="http://localhost:3000/login" style="display: inline-block; padding: 12px 25px; background-color: #18216D; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Login to Portal</a>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.EMAIL_HOST_USER,
            [user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False
