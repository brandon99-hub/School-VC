"""
Create CBC tables manually
Since we faked the migration, we need to actually create the tables
"""

import sqlite3

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Create CBC tables
tables = [
    """
    CREATE TABLE IF NOT EXISTS cbc_gradelevel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(20) NOT NULL,
        curriculum_type VARCHAR(10) NOT NULL,
        "order" INTEGER NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT 1
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cbc_learningarea (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        grade_level_id INTEGER NOT NULL REFERENCES cbc_gradelevel(id),
        teacher_id INTEGER NOT NULL REFERENCES teachers_teacher(id),
        UNIQUE(name, grade_level_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cbc_learningarea_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learningarea_id INTEGER NOT NULL REFERENCES cbc_learningarea(id),
        student_id INTEGER NOT NULL REFERENCES students_student(id),
        UNIQUE(learningarea_id, student_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cbc_strand (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        learning_area_id INTEGER NOT NULL REFERENCES cbc_learningarea(id),
        UNIQUE(learning_area_id, "order")
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cbc_substrand (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        strand_id INTEGER NOT NULL REFERENCES cbc_strand(id),
        UNIQUE(strand_id, "order")
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cbc_learningoutcome (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        "order" INTEGER NOT NULL,
        suggested_activities TEXT NOT NULL,
        sub_strand_id INTEGER NOT NULL REFERENCES cbc_substrand(id),
        UNIQUE(sub_strand_id, "order")
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cbc_competencyassessment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competency_level VARCHAR(2) NOT NULL,
        assessment_date DATE NOT NULL,
        teacher_comment TEXT NOT NULL,
        evidence TEXT NOT NULL,
        assignment_submission_id INTEGER REFERENCES courses_assignmentsubmission(id),
        learning_outcome_id INTEGER NOT NULL REFERENCES cbc_learningoutcome(id),
        student_id INTEGER NOT NULL REFERENCES students_student(id),
        teacher_id INTEGER NOT NULL REFERENCES teachers_teacher(id)
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS cbc_compete_student_518a11_idx 
    ON cbc_competencyassessment (student_id, learning_outcome_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS cbc_compete_assessm_0328df_idx 
    ON cbc_competencyassessment (assessment_date)
    """
]

for sql in tables:
    try:
        cursor.execute(sql)
        print(f"✅ Created table/index")
    except Exception as e:
        print(f"⚠️  {e}")

conn.commit()
conn.close()

print("\n✅ All CBC tables created successfully!")
print("You can now run: python manage.py seed_cbc_data")
