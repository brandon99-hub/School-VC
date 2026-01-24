"""
Manual Migration Fix Script
This script fixes the circular dependency issue by manually inserting the CBC migration
into the django_migrations table.
"""

import sqlite3
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Check if CBC migration already exists
cursor.execute("SELECT * FROM django_migrations WHERE app='cbc' AND name='0001_initial'")
existing = cursor.fetchone()

if existing:
    print("✅ CBC migration already exists in database")
else:
    # Insert the CBC migration record
    cursor.execute("""
        INSERT INTO django_migrations (app, name, applied)
        VALUES ('cbc', '0001_initial', ?)
    """, (datetime.now(),))
    
    conn.commit()
    print("✅ Successfully inserted CBC migration record")

# Verify
cursor.execute("SELECT app, name FROM django_migrations WHERE app IN ('cbc', 'courses') ORDER BY id DESC LIMIT 5")
recent_migrations = cursor.fetchall()
print("\n📋 Recent migrations:")
for app, name in recent_migrations:
    print(f"  - {app}.{name}")

conn.close()
print("\n✅ Migration history fixed! You can now run: python manage.py migrate")
