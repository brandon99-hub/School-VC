# School Management Platform

This repository houses a Django REST backend and a React 19 frontend for a role-based school management system. Students, teachers, and admins share one codebase but experience different dashboards, permissions, and workflows.

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Repository Layout](#repository-layout)
3. [Backend (Django) Breakdown](#backend-django-breakdown)
4. [Frontend (React) Breakdown](#frontend-react-breakdown)
5. [Environment & Tooling](#environment--tooling)
6. [Running the Stack](#running-the-stack)

---

## High-Level Architecture
- **Backend**: Django 5.1 with Django REST Framework + SimpleJWT. Custom `Student` user model doubles as auth identity, and domain apps (`core`, `students`, `teachers`, `courses`) expose both HTML templates and REST endpoints.
- **Frontend**: React SPA consuming the REST API. Auth state lives in context, Axios handles JWT/refresh, and dashboards surface course enrollment, attendance, and announcements.
- **Security & Middleware**: CORS, rate limiting, access logging, password validators, Prometheus metrics.

---

## Repository Layout
```
PythonProject4/
├─ PythonProject4/
│  ├─ backend/                   # Django project root
│  └─ school-management-frontend # React app
└─ ...
```

### Backend Top-Level
- `manage.py`: Django entry point.
- `requirements.txt`: pinned dependencies (Django, DRF, SimpleJWT, CORS, crispy forms, Prometheus, etc.).
- `db.sqlite3`: default local database.
- `school_management/`: project settings, URLs, ASGI/WSGI.
- App folders: `core/`, `students/`, `teachers/`, `courses/`, each with models/serializers/views/urls.
- `static` & `staticfiles`: assets and collectstatic output.

### Frontend Top-Level
- `package.json`: React dependencies (React 19, react-router, axios, tailwind, testing libs) and scripts.
- `src/`: application code (components, contexts, hooks, API helpers, entry files).
- `public/`: CRA static assets.
- Config files: `tailwind.config.js`, `postcss.config.js`, `tsconfig.json` (React uses JS but CRA template includes TS config), `.gitignore`.

---

## Backend (Django) Breakdown

### `school_management/settings.py`
- Base configuration: debug, secret key, sqlite DB, installed apps, middleware (CORS, rate limiting, Prometheus, custom access logging).
- REST framework defaults: JWT authentication (`rest_framework_simplejwt.authentication.JWTAuthentication`) and default permission (`IsAuthenticated`), forcing explicit overrides per endpoint.
- CORS allowed origins (`localhost:3000`), CSRF trusted origins, session security toggles.
- Email SMTP placeholders (Gmail) for notifications.
- Custom user model set to `students.Student`.

### `school_management/urls.py`
- Routes admin, `core`, `students`, `teachers`, `courses` URL confs.
- Adds static media serving in debug mode.

### `core` App
- **Models (`core/models.py`)**: `StudentProfile`, `TeacherProfile`, `AdminProfile`, `Announcement`, `Notification`, `AcademicYear`, `AccessLog`. They track metadata beyond the main `Student` user.
- **Serializers (`core/serializers.py`)**: cover announcements, notifications, teachers, students, and user registration. `DynamicUserRegistrationSerializer` allows role-aware signup.
- **Permissions (`core/permissions.py`)**: `IsAdmin`, `IsTeacher` gate specific viewsets.
- **Validators (`core/validators.py`)**: custom password validation logic (e.g., complexity rules) hooked into Django settings.
- **Middleware**
  - `access_logging.py`: logs every request (user, path, method, status) to `AccessLog`.
  - `rate_limit.py`: wraps requests with `django-ratelimit`, defaulting to `100/h` per IP.
- **Views (`core/views.py`)**:
  - Auth flows: `CustomTokenObtainPairView` (SimpleJWT wrapper adding role metadata), `RegisterView`, `UserView` (current user data), `ProfileView` (REST profile read/write), `LogoutView`.
  - HTML dashboards for students/teachers/admin with aggregated counts.
  - CRUD viewsets (`TeacherViewSet`, `StudentViewSet`, `AnnouncementViewSet`), notifications list, CSRF token endpoint.
- **URLs (`core/urls.py`)**:
  - HTML routes: home, dashboard, profile, announcements, notifications.
  - API namespace `/core/api/`: auth endpoints (login, refresh, register, user, profile, logout, enroll), DRF router for students/courses/grades/teachers/announcements, notifications list.

### `students` App
- **Models (`students/models.py`)**: `Student` extends `AbstractUser` with fields (student_id, DOB, gender, address, phone, grade, `enrolled_courses` reverse relation). `StudentManager` overrides user creation; `Attendance` model tracks daily presence with unique `(student, date)` constraint.
- **Serializers (`students/serializers.py`)**: `StudentSerializer`, `AttendanceSerializer`.
- **Views (`students/views.py`)**:
  - REST endpoints: `student_courses_api`, `student_attendance`, `enroll_course` (JWT-protected). Emphasize use of `student.get_enrolled_courses()`.
  - HTML views: student CRUD, course registration/drop, attendance forms, profile editing.
  - AJAX endpoints for attendance status and marking attendance.
- **URLs (`students/urls.py`)**: wires list/detail/add/edit/delete, attendance pages, course registration endpoints, API endpoints for attendance and course data.
- **Management commands** (in `students/management/commands/`): data seeding (e.g., `seed_students`). Inspect directory for available scripts when prepping demo data.
- **Tests (`students/tests/test_api.py`)**: covers API behaviors (enrollment, attendance). Expand as features grow.

### `teachers` App
- **Models (`teachers/models.py`)**: `Teacher` tied to `settings.AUTH_USER_MODEL`, storing teacher_id, DOB, qualification, specialization, experience, address, phone. `TeacherAttendance` tracks presence with status (`Present`, `Absent`, `Leave`).
- **Serializers/Views/URLs**: similar pattern to students but teacher-centric (assignments, attendance lists, dashboards).
- **Admin**: registers teacher models for the admin panel.

- **Models (`courses/models.py`)**:
  - `Course`: metadata (name, code, credits, semester, dates, active flag, teacher FK, M2M to students).
  - `Assignment`, `Schedule`, `Grade`, `Attendance` (course-specific) capturing due dates, schedule entries, grade records, session attendance.
  - **LMS stack**: `Module` → `Lesson` → `LessonContent` (video/document/text/quiz references) plus `Quiz`, `QuizQuestion`, `QuizSubmission`, `QuizResponse`, `AssignmentSubmission`, and discussion models (`DiscussionThread`, `DiscussionComment`) so every course carries a structured learning path and collaboration surface.
- **Serializers (`courses/serializers.py`)**: nested serializers emit full module/lesson trees, quiz questions, submissions, and threaded discussions alongside the existing course/grade/attendance payloads.
- **Views (`courses/views.py`)**:
  - HTML: list/detail/edit/delete courses, schedule management, assignment views, enrollment checks.
  - DRF viewsets: `CourseViewSet`, `GradeViewSet`, `AttendanceViewSet`, plus new viewsets for modules, lessons, lesson content, quizzes, quiz submissions, assignment submissions, and discussion threads/comments.
  - `course_detail_api`: now returns the entire learning path (modules/lessons/content/quizzes), discussion feed, submission summaries, and student progress stats for the authenticated learner while keeping the same permission rules.
- **Management commands**: `seed_courses.py` to populate baseline data.
- **URLs (`courses/urls.py`)**: route names for HTML pages and include the DRF router via `core`.

### Shared Utilities
- `core/tests.py`, `students/tests.py`, `courses/tests.py`, etc., scaffolded for unit tests.
- `core/apps.py`, `students/apps.py`, etc., declare AppConfig entries.
- `core/__init__.py`, migrations directories, and cached bytecode under `__pycache__`.

---

## Frontend (React) Breakdown

### Entry & Global Assets
- `src/index.tsx`: CRA entry, renders `<App />`, imports global CSS, registers service worker hooks.
- `src/App.js`: Primary router. Sets up `BrowserRouter`, global `<Navbar />`, protected routes, and ties `AuthContext`/`AppStateContext` flows to initial data fetching (`fetchData` with `useApi`).
- `src/App.tsx`, `src/App.test.tsx`, `src/App.css`, `src/index.css`: CRA defaults (TS variant is unused but kept for reference/testing). `App.css` and `index.css` host base styles and Tailwind directives.
- `src/logo.svg`, `public/logo192.png`, etc.: CRA assets for favicons/PWA.

### API Layer (`src/api/`)
- `Client.js`: Axios instance with `baseURL` from `REACT_APP_API_BASE_URL`; uses `withCredentials`. Request interceptor attaches `Authorization: Bearer <token>` if present. Response interceptor handles 401 by attempting `/api/auth/refresh/` (SimpleJWT) and redirecting to `/login` on failure.
- `auth.js`: wrappers for login (`/api/auth/login/`), signup (`/api/auth/register/`), logout (`/api/auth/logout/`), user fetch (`/api/auth/user/`), profile (`/api/auth/profile/`).
- `courses.js`: helpers like `enrollStudent(courseId)` hitting `/api/auth/enroll/`.
- `attendance.js`, `grades.js`, `api/Client.js`: resource-specific API calls for attendance and grade data.

### Hooks
- `hooks/useApi.js`: `useCallback` + `useMemo` returning memoized `get/post/put/delete` wrappers around the Axios client. Captures errors, globally redirects on 401/403.

### Context Providers
- `context/AuthContext.js`: Manages auth state.
  - `authReducer` handles `LOGIN`, `LOGOUT`, `LOAD_USER`, `REFRESH_TOKEN`, `LOADING`.
  - `login(userData, accessToken, refreshToken)`: saves tokens, sets user state.
  - `logout()`: POST `/api/auth/logout/`, clears tokens, resets AppState context.
  - `loadUser()`: GET `/api/auth/user/`, merges role info, handles missing ID.
  - `useEffect` bootstraps auth by checking `refresh_token` and calling `loadUser`.
- `context/AppStateContext.js`: Global store for course and attendance collections.
  - `appReducer` actions: `SET_COURSES`, `SET_TEACHER_ATTENDANCE`, `SET_STUDENT_ATTENDANCE`, `SET_LOADING`, `SET_ERROR`, `CLEAR_STATE`.
  - Additional `needsRefresh` flag with `setNeedsRefresh` to signal data re-fetch.

### Components Overview (`src/components/`)

#### Common
- `common/Navbar.js`: Responsive nav with conditional teacher link, contact link, dropdown for profile/settings/logout, hides itself on `/login` and `/signup`.
- `common/LoadingSpinner.js`: Full-screen or inline spinner.

#### Auth
- `auth/Login.js`: Form handling email + password, calls `login` from `AuthContext`, handles error states.
- `auth/Signup.js`: Registration form (student vs teacher) linking to `/api/auth/register/`.
- `ProtectedRoute.js`: Wraps route elements, redirecting unauthenticated users to `/login`.

#### Dashboards & Layout
- `StudentDashboard.js`: Welcomes user by name, renders `StudentInfo`, `CourseList`, `AttendanceRecord`.
- `TeacherDashboard.js`: Teacher overview (assigned courses, attendance), references `TeacherInfo`, `TeacherAttendanceRecord`.
- `NotificationCenter.js`: Renders notifications once hooking to `/api/notifications/`.
- `StudentManagement.js`, `TeacherManagement.js`: scaffolds for admin-like management pages.

#### Detail Components
- `StudentInfo.js`: Displays profile data (grade, contact, enrollment counts).
- `TeacherInfo.js`: Shows teacher-specific details (specialization, experience).
- `CourseList.js`: Pulls enrolled courses from `AppStateContext`, handles search, pagination, open enrollment modal, enroll via API (`enrollStudent`), and view details via router navigation.
- `CourseModal.js`: Lists available courses, indicates which ones are already enrolled, triggers `onEnroll`.
- `CourseDetail.js`: Fetches `/courses/api/:id/` and renders the full LMS stack—module/lesson accordion, embedded content cards, quiz summaries, discussion threads, student submission history, plus the virtual-class schedule.
- `CourseForm.js`, `CourseDetail.js`, `CourseModal.js`: support course creation/editing (forms partially stubbed).
- `AttendanceRecord.js`: Student attendance summary (uses `AppStateContext.studentAttendance`).
- `TeacherAttendanceRecord.js`: Teacher view of class attendance submissions.
- `GradeForm.js`, `AttendanceForm.js`: Input forms for teachers to submit grades or attendance.
- `Contact.js`: Static contact page.
- `ProfilePage.js`: Calls `/api/auth/profile/` via `useApi`, allows editing user fields (name, email, phone, address, grade) and updates context on save.

#### Tests (`src/__tests__/`)
- `Login.test.js`: Exercises login form interactions.
- `Attendance.test.js`: Verifies attendance UI behavior.

### Styling & Config
- `tailwind.config.js`: Tailwind setup targeting `./src/**/*.{js,jsx,ts,tsx}`.
- `postcss.config.js`: PostCSS plugins (tailwindcss, autoprefixer).
- `App.css`, `index.css`: base styles and Tailwind layer imports.

---

## Environment & Tooling

### Backend
- Python 3.10+ (currently running 3.13.2).
- Virtualenv recommended: `py -3.13 -m venv .venv`, `.\.venv\Scripts\activate`.
- Install dependencies: `pip install -r requirements.txt`.
- Apply migrations: `python manage.py migrate`.
- (Optional) Seed data via management commands (`courses.management.commands.seed_courses`, etc.).
- Run server: `python manage.py runserver`.

### Frontend
- Node 18+.
- Install deps: `npm install`.
- Environment: `.env` with `REACT_APP_API_BASE_URL`.
- Development: `npm start` (`http://localhost:3000`).
- Tests: `npm test`.
- Production build: `npm run build`.

---

## Running the Stack

1. **Backend**
   ```powershell
   cd PythonProject4/PythonProject4/backend
   py -3.13 -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend**
   ```bash
   cd PythonProject4/PythonProject4/school-management-frontend
   npm install
   npm start
   ```

3. **Login flow**
   - Use `/api/auth/register/` to create a student or teacher.
   - Log in via the frontend `/login` page; tokens persist in `localStorage`.
   - Navigate dashboards/profile/course details without page reloads.

4. **Environment sync**
   - Ensure Django `CORS_ALLOWED_ORIGINS` includes the frontend origin.
   - Update `REACT_APP_API_BASE_URL` if backend isn’t on `localhost:8000`.

---

## Next Steps & Documentation TODOs
- Add API endpoint list (request/response schema) once stabilized.
- Document seed data commands for quick demo environments.
- Extend README with deployment recipes (Docker, CI/CD) when ready.
