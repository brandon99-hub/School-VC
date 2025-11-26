# core/validators.py
from django.core.exceptions import ValidationError
import re

class CustomPasswordValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one digit.")
        if not re.search(r'[!@#$%^&*]', password):
            raise ValidationError("Password must contain at least one special character (!@#$%^&*).")
    def get_help_text(self):
        return "Password must contain at least one uppercase letter, lowercase letter, digit, and special character."