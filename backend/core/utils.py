def get_user_role(user):
    """
    Determine user role with proper priority:
    1. Admin (superuser or staff)
    2. Teacher (has teacher relationship)
    3. Student (has student relationship or student_id)
    """
    if user.is_superuser or user.is_staff:
        return 'admin'
    elif hasattr(user, 'teacher'):
        return 'teacher'
    elif hasattr(user, 'student') or getattr(user, 'student_id', None):
        return 'student'
    else:
        return 'unknown'
