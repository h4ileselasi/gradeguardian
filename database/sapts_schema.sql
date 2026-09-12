-- =====================================================================
--  Student Academic Progress Tracking System (SAPTS)
--  Relational schema for MySQL / MariaDB as supplied with XAMPP
--
--  Ghana Communication Technology University (GCTU)
--  Faculty of Computing and Information Systems
--
--  This script creates the database used by the system: user accounts with
--  hashed passwords and roles, and the academic tables described by the entity relationship
--  diagram in Figure 3.4 of the project report. The delivered system
--  persists these same entities on the client, through the Web Storage
--  API and IndexedDB; this schema expresses that identical model in SQL
--  and is the migration path to a shared, multi-user deployment.
--
--  To load it:  XAMPP Control Panel -> start Apache and MySQL
--               http://localhost/phpmyadmin  ->  Import  ->  this file
--  Or:          mysql -u root -p < sapts_schema.sql
-- =====================================================================

DROP DATABASE IF EXISTS sapts;
CREATE DATABASE sapts
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE sapts;

-- ---------------------------------------------------------------------
-- USER — one row per student. In the delivered single-user system this
-- table holds exactly one row, corresponding to the settings record.
-- ---------------------------------------------------------------------
CREATE TABLE user (
  user_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  index_number  VARCHAR(20)     NOT NULL  COMMENT 'student index number; the login identifier',
  full_name     VARCHAR(120)    NOT NULL,
  email         VARCHAR(160)        NULL,
  password_hash VARCHAR(255)    NOT NULL  COMMENT 'bcrypt hash from PHP password_hash(); never a plain password',
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  must_change_password TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'set when an admin enrols a student with a temporary password',
  theme         ENUM('light','dark') NOT NULL DEFAULT 'light',
  weekly_goal   TINYINT UNSIGNED NOT NULL DEFAULT 10  COMMENT 'target study hours per week',
  focus_len     TINYINT UNSIGNED NOT NULL DEFAULT 25  COMMENT 'pomodoro focus minutes',
  break_len     TINYINT UNSIGNED NOT NULL DEFAULT 5   COMMENT 'pomodoro break minutes',
  last_login    DATETIME            NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_index (index_number),
  UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- COURSE — a subject the student is registered for. One user owns many
-- courses (1:M).
-- ---------------------------------------------------------------------
CREATE TABLE course (
  course_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  code          VARCHAR(16)     NOT NULL  COMMENT 'e.g. CSCD 301',
  name          VARCHAR(160)    NOT NULL,
  credit_hours  TINYINT UNSIGNED NOT NULL DEFAULT 3,
  lecturer      VARCHAR(120)        NULL,
  semester      VARCHAR(40)         NULL,
  score         DECIMAL(5,2)        NULL  COMMENT 'weighted average, 0.00-100.00',
  grade         VARCHAR(2)          NULL  COMMENT 'A, B+, B, C+, C, D+, D, F',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id),
  UNIQUE KEY uq_course_user_code (user_id, code),
  KEY ix_course_user (user_id),
  CONSTRAINT fk_course_user
    FOREIGN KEY (user_id) REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_course_score  CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT ck_course_credit CHECK (credit_hours BETWEEN 1 AND 12)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ASSESSMENT — a weighted component of a course (quiz, assignment,
-- mid-semester, examination). One course has many assessments (1:M).
-- The weights of a course's assessments are expected to total 100.
-- ---------------------------------------------------------------------
CREATE TABLE assessment (
  assessment_id INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  course_id     INT UNSIGNED    NOT NULL,
  title         VARCHAR(120)    NOT NULL,
  weight        DECIMAL(5,2)    NOT NULL  COMMENT 'percentage of the final mark',
  score         DECIMAL(6,2)        NULL,
  max_score     DECIMAL(6,2)    NOT NULL DEFAULT 100.00,
  recorded_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assessment_id),
  KEY ix_assessment_course (course_id),
  CONSTRAINT fk_assessment_course
    FOREIGN KEY (course_id) REFERENCES course (course_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_assessment_weight CHECK (weight > 0 AND weight <= 100),
  CONSTRAINT ck_assessment_score  CHECK (score IS NULL OR score >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- STUDY_SESSION — a logged period of focused study, produced by the
-- pomodoro timer or entered manually. One course has many sessions (1:M).
-- ---------------------------------------------------------------------
CREATE TABLE study_session (
  session_id    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  course_id     INT UNSIGNED        NULL  COMMENT 'NULL = general study',
  started_at    DATETIME        NOT NULL,
  minutes       SMALLINT UNSIGNED NOT NULL,
  session_type  ENUM('focus','break') NOT NULL DEFAULT 'focus',
  PRIMARY KEY (session_id),
  KEY ix_session_user_date (user_id, started_at),
  KEY ix_session_course (course_id),
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_session_course
    FOREIGN KEY (course_id) REFERENCES course (course_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_session_minutes CHECK (minutes > 0 AND minutes <= 600)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TASK — a goal or deadline. One course has many tasks (1:M); a task
-- need not belong to a course.
-- ---------------------------------------------------------------------
CREATE TABLE task (
  task_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  course_id     INT UNSIGNED        NULL,
  title         VARCHAR(200)    NOT NULL,
  due_date      DATE                NULL,
  priority      ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  done          TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id),
  KEY ix_task_user_due (user_id, due_date),
  KEY ix_task_course (course_id),
  CONSTRAINT fk_task_user
    FOREIGN KEY (user_id) REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_course
    FOREIGN KEY (course_id) REFERENCES course (course_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- DECK and FLASHCARD — revision material. One deck has many cards (1:M).
-- ---------------------------------------------------------------------
CREATE TABLE deck (
  deck_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  course_id     INT UNSIGNED        NULL,
  name          VARCHAR(160)    NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (deck_id),
  KEY ix_deck_user (user_id),
  CONSTRAINT fk_deck_user
    FOREIGN KEY (user_id) REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_deck_course
    FOREIGN KEY (course_id) REFERENCES course (course_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE flashcard (
  card_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  deck_id       INT UNSIGNED    NOT NULL,
  front         TEXT            NOT NULL,
  back          TEXT            NOT NULL,
  mastered      TINYINT(1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (card_id),
  KEY ix_card_deck (deck_id),
  CONSTRAINT fk_card_deck
    FOREIGN KEY (deck_id) REFERENCES deck (deck_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VAULT_ITEM — a note or an uploaded document. In the delivered system
-- the binary itself lives in IndexedDB; here it is a BLOB, with the
-- metadata alongside it.
-- ---------------------------------------------------------------------
CREATE TABLE vault_item (
  item_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  course_id     INT UNSIGNED        NULL,
  title         VARCHAR(200)    NOT NULL,
  item_type     ENUM('note','image','pdf') NOT NULL DEFAULT 'note',
  note_body     TEXT                NULL  COMMENT 'used when item_type = note',
  file_name     VARCHAR(255)        NULL,
  file_data     LONGBLOB            NULL  COMMENT 'used when item_type <> note',
  uploaded_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  KEY ix_vault_user (user_id),
  KEY ix_vault_course (course_id),
  CONSTRAINT fk_vault_user
    FOREIGN KEY (user_id) REFERENCES user (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_vault_course
    FOREIGN KEY (course_id) REFERENCES course (course_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
--  VIEWS — the calculations the application performs in JavaScript,
--  expressed in SQL so that the same figures can be produced by query.
-- =====================================================================

-- Weighted average per course, from its assessment components.
CREATE OR REPLACE VIEW v_course_average AS
SELECT
    c.course_id,
    c.user_id,
    c.code,
    c.name,
    c.credit_hours,
    ROUND(SUM(a.score / a.max_score * a.weight) / NULLIF(SUM(a.weight), 0) * 100, 2)
      AS weighted_average
FROM course c
LEFT JOIN assessment a
       ON a.course_id = c.course_id
      AND a.score IS NOT NULL
GROUP BY c.course_id, c.user_id, c.code, c.name, c.credit_hours;

-- Letter grade and grade points on the 4.0 scale used by Ghanaian
-- universities, matching the grading table in the application.
CREATE OR REPLACE VIEW v_course_grade AS
SELECT
    v.*,
    CASE
      WHEN v.weighted_average >= 80 THEN 'A'
      WHEN v.weighted_average >= 75 THEN 'B+'
      WHEN v.weighted_average >= 70 THEN 'B'
      WHEN v.weighted_average >= 65 THEN 'C+'
      WHEN v.weighted_average >= 60 THEN 'C'
      WHEN v.weighted_average >= 55 THEN 'D+'
      WHEN v.weighted_average >= 50 THEN 'D'
      WHEN v.weighted_average IS NULL THEN NULL
      ELSE 'F'
    END AS letter_grade,
    CASE
      WHEN v.weighted_average >= 80 THEN 4.0
      WHEN v.weighted_average >= 75 THEN 3.5
      WHEN v.weighted_average >= 70 THEN 3.0
      WHEN v.weighted_average >= 65 THEN 2.5
      WHEN v.weighted_average >= 60 THEN 2.0
      WHEN v.weighted_average >= 55 THEN 1.5
      WHEN v.weighted_average >= 50 THEN 1.0
      WHEN v.weighted_average IS NULL THEN NULL
      ELSE 0.0
    END AS grade_points
FROM v_course_average v;

-- Credit-weighted grade point average per student.
CREATE OR REPLACE VIEW v_student_gpa AS
SELECT
    user_id,
    ROUND(SUM(grade_points * credit_hours) / NULLIF(SUM(credit_hours), 0), 2) AS gpa,
    SUM(credit_hours) AS total_credits
FROM v_course_grade
WHERE grade_points IS NOT NULL
GROUP BY user_id;

-- Study hours per course, for the effort-against-outcome comparison.
CREATE OR REPLACE VIEW v_study_by_course AS
SELECT
    s.user_id,
    s.course_id,
    c.code,
    ROUND(SUM(s.minutes) / 60, 1) AS total_hours,
    COUNT(*)                      AS session_count
FROM study_session s
LEFT JOIN course c ON c.course_id = s.course_id
WHERE s.session_type = 'focus'
GROUP BY s.user_id, s.course_id, c.code;

-- =====================================================================
--  SAMPLE DATA — mirrors the demonstration data seeded by the
--  application, so the views can be shown returning real figures.
-- =====================================================================

-- Two accounts are seeded: an administrator who enrols students, and one
-- student. Both passwords are 'password123'; the stored value is a bcrypt hash,
-- so the plain password appears nowhere in the database. Change them after the
-- first login.
INSERT INTO user (user_id, index_number, full_name, email, password_hash, role, theme, weekly_goal) VALUES
  (1, '4211231018', 'Richard Yawlui', 'richard.yawlui@gctu.edu.gh',
   '$2y$12$1MJWUJHTjTL.M6wHfCMaAOuNcM5EpErfUGRGtqXc3MqDtKWD9r.ja', 'student', 'light', 10),
  (2, 'ADMIN001',   'System Administrator', 'admin@gctu.edu.gh',
   '$2y$12$1MJWUJHTjTL.M6wHfCMaAOuNcM5EpErfUGRGtqXc3MqDtKWD9r.ja', 'admin', 'light', 10);

INSERT INTO course (course_id, user_id, code, name, credit_hours, lecturer, semester) VALUES
  (1, 1, 'CSCD 301', 'Web Development',      3, 'Dr. Mensah',  'Semester 1'),
  (2, 1, 'CSCD 302', 'Database Systems',     3, 'Prof. Asare', 'Semester 1'),
  (3, 1, 'CSCD 303', 'Network Security',     2, 'Dr. Owusu',   'Semester 1'),
  (4, 1, 'CSCD 304', 'Software Engineering', 3, 'Dr. Boateng', 'Semester 1'),
  (5, 1, 'CSCD 305', 'Operating Systems',    3, 'Prof. Adjei', 'Semester 1');

-- Components chosen so that each course totals the mark the application
-- seeds for it: 85, 78, 72, 66 and 58 respectively.
INSERT INTO assessment (course_id, title, weight, score, max_score) VALUES
  (1, 'Quiz 1', 10,  9.0, 10), (1, 'Assignment', 20, 17.0, 20), (1, 'Examination', 70, 59.0, 70),
  (2, 'Quiz 1', 10,  8.0, 10), (2, 'Assignment', 20, 16.0, 20), (2, 'Examination', 70, 54.0, 70),
  (3, 'Quiz 1', 10,  7.5, 10), (3, 'Assignment', 20, 15.0, 20), (3, 'Examination', 70, 49.5, 70),
  (4, 'Quiz 1', 10,  7.0, 10), (4, 'Assignment', 20, 13.0, 20), (4, 'Examination', 70, 46.0, 70),
  (5, 'Quiz 1', 10,  6.0, 10), (5, 'Assignment', 20, 11.0, 20), (5, 'Examination', 70, 41.0, 70);

INSERT INTO study_session (user_id, course_id, started_at, minutes, session_type) VALUES
  (1, 1, '2026-02-16 09:00:00', 50, 'focus'),
  (1, 2, '2026-02-16 14:00:00', 25, 'focus'),
  (1, 5, '2026-02-17 10:30:00', 50, 'focus'),
  (1, 2, '2026-02-18 16:00:00', 75, 'focus'),
  (1, 4, '2026-02-19 08:00:00', 25, 'focus'),
  (1, 1, '2026-02-20 11:00:00', 50, 'focus'),
  (1, 3, '2026-02-21 15:00:00', 25, 'focus');

INSERT INTO task (user_id, course_id, title, due_date, priority, done) VALUES
  (1, 2, 'Submit Database ER diagram',  '2026-02-20', 'high',   0),
  (1, 5, 'Read Operating Systems ch. 4','2026-02-22', 'medium', 0),
  (1, 1, 'Finish portfolio project',    '2026-02-25', 'high',   0),
  (1, 4, 'Group presentation slides',   '2026-02-27', 'medium', 0),
  (1, 3, 'Revise subnetting exercises', '2026-02-18', 'low',    1);

INSERT INTO deck (deck_id, user_id, course_id, name) VALUES
  (1, 1, 2, 'Normalisation'),
  (2, 1, 3, 'Networking Protocols');

INSERT INTO flashcard (deck_id, front, back, mastered) VALUES
  (1, 'What does 1NF require?', 'Every attribute holds a single atomic value; no repeating groups.', 1),
  (1, 'What does 2NF add?',     'No partial dependency of a non-key attribute on part of a composite key.', 0),
  (1, 'What does 3NF add?',     'No transitive dependency of a non-key attribute on another non-key attribute.', 0),
  (2, 'Which layer is TCP?',    'The transport layer, layer 4 of the OSI model.', 1),
  (2, 'What port does HTTPS use?', 'Port 443.', 1);

INSERT INTO vault_item (user_id, course_id, title, item_type, note_body) VALUES
  (1, 2, 'ERD revision notes', 'note', 'Entities: user, course, assessment, study_session, task, deck, flashcard, vault_item.'),
  (1, 1, 'CSS Grid summary',   'note', 'grid-template-columns, grid-area, gap; use minmax() for responsive tracks.');

-- =====================================================================
--  Verification queries — run these to demonstrate the schema.
-- =====================================================================
-- SELECT * FROM v_course_grade ORDER BY code;
-- SELECT * FROM v_student_gpa;
-- SELECT * FROM v_study_by_course ORDER BY total_hours DESC;
