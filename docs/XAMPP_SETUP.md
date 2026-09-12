# Deploying SAPTS on XAMPP

**Student Academic Progress Tracking System**
Ghana Communication Technology University — Faculty of Computing and Information Systems

This guide describes how to host the system on a local Apache server supplied by
XAMPP. The system is delivered as a local web application: Apache serves the
pages and runs the PHP, MySQL holds the accounts and academic records, and no
online hosting provider is involved at any point.

---

## 1. Install XAMPP

Download XAMPP from <https://www.apachefriends.org> and run the installer.
Both the **Apache** and the **MySQL** components are required: Apache serves the
pages and runs the PHP that handles sign-in, and MySQL holds the accounts and the
academic records. FileZilla, Mercury and Tomcat can be left unselected.

## 2. Copy the project into the web root

Apache serves files from a folder called `htdocs`. Copy the entire project
folder into it and name the copy `sapts`:

| Operating system | Destination |
| --- | --- |
| Windows | `C:\xampp\htdocs\sapts` |
| macOS | `/Applications/XAMPP/htdocs/sapts` |
| Linux | `/opt/lampp/htdocs/sapts` |

After copying, the folder should contain `index.html`, `login.html`,
`admin.html`, `style.css`, `script.js`, `auth.js`, `.htaccess`, and the `api`,
`database` and `vendor` folders.

## 3. Start Apache and MySQL

Open the **XAMPP Control Panel** and click **Start** on the **Apache** row and on
the **MySQL** row. Both turn green. The system needs both: without MySQL nobody
can sign in.

## 4. Create the database

Open <http://localhost/phpmyadmin>, choose the **Import** tab, select
`database/sapts_schema.sql` from the project folder, and press **Go**. This
creates the `sapts` database, its eight tables and two accounts:

| Sign in as | Index number | Password |
| --- | --- | --- |
| Administrator | `ADMIN001` | `password123` |
| Student | `4211231018` | `password123` |

**Change both passwords immediately after the first sign-in.** They are published
here and in the SQL file, so they are not secret.

## 5. Open the system

In a browser, visit:

```
http://localhost/sapts/
```

The sign-in page appears. Sign in with one of the accounts above. A student
lands on their dashboard; the administrator lands on the enrolment console.

## 6. Enrol students

Sign in as the administrator. The **Enrolment Console** opens at
<http://localhost/sapts/admin.html> and lets you:

- **Enrol a student** — enter their index number and full name. The system
  generates a temporary password and shows it once. Give it to the student.
- **Reset a password** — issues a fresh temporary password if one is forgotten.
- **Deactivate or reactivate** an account, without deleting anything.
- **Remove** an account, which deletes that student's records with it.

A student signing in with a temporary password must choose their own before they
can reach the system. Students may also create their own account from the
**Create account** tab on the sign-in page, if your department allows it.

Each student sees only their own courses, marks, study sessions, tasks and notes.
The records are separated in the database by the account that owns them.

---

## 6. Optional: loading the relational schema

Everything the system stores can be inspected in phpMyAdmin. Open the `sapts`
database and look at the `user` table: the `password_hash` column holds bcrypt
hashes, never the passwords themselves. The academic tables each carry a
`user_id` identifying the student the row belongs to.

Four views reproduce in SQL the calculations the interface performs in
JavaScript. To see them, open the **SQL** tab and run:

```sql
USE sapts;
SELECT code, name, weighted_average, letter_grade, grade_points
  FROM v_course_grade ORDER BY code;
SELECT * FROM v_student_gpa;
```

The first query returns the five seeded courses with marks of 85, 78, 72, 66 and
58, and the second returns a grade point average of **2.89** across 14 credit
hours — the same figures shown on the application's dashboard.

Re-importing the schema file at any time resets the database to its initial
state, removing every account and record created since.

---

## Demonstrating the system on the defence day

1. Start **Apache and MySQL** from the XAMPP Control Panel before the session begins.
2. Open `http://localhost/sapts/` and confirm the sign-in page appears.
3. Sign in as the administrator and enrol a student live; show the temporary
   password being issued.
4. Sign in as that student in a private window, change the password when prompted,
   and show that their dashboard is empty — they cannot see anybody else's marks.
5. Open phpMyAdmin alongside and show the new row in the `user` table, with a
   bcrypt hash in `password_hash` rather than a readable password.
6. Disconnect from the internet if asked: every asset is bundled in `vendor/`, and
   the server is your own machine, so nothing depends on an outside connection.

## Troubleshooting

**Apache will not start / "port 80 in use"**
Another program (often Skype, IIS, or Windows' World Wide Web Publishing
Service) holds port 80. Either stop that program, or change Apache's port:
XAMPP Control Panel → **Config** → `httpd.conf`, change `Listen 80` to
`Listen 8080` and `ServerName localhost:80` to `ServerName localhost:8080`, then
restart Apache and visit `http://localhost:8080/sapts/`.

**The page loads without styling**
The folder was copied incompletely. Confirm that `style.css`, `script.js` and the
whole `vendor` folder sit beside `index.html`.

**"Object not found" or a directory listing appears**
The folder name in `htdocs` does not match the address being typed, or
`index.html` is missing from it. Check the spelling of the folder in the URL.

**"The system cannot reach your records"**
MySQL is not running, or the database has not been imported. Start MySQL in the
XAMPP Control Panel and complete step 4.

**A student has forgotten their password**
Sign in as the administrator, find them in the enrolment console and press
**Reset password**. A new temporary password is displayed once.

**Nobody can sign in at all**
Confirm the `sapts` database exists in phpMyAdmin and that its `user` table has
rows. If it is empty, import `database/sapts_schema.sql` again.

**Changes to the files are not visible**
Refresh with `Ctrl + F5` to bypass the browser cache. The bundled `.htaccess`
already instructs Apache to send `no-cache` for HTML, CSS and JavaScript.

---

## Why the files cannot simply be opened directly

Opening `index.html` by double-clicking it no longer works, and this is expected.
The sign-in, enrolment and record-keeping are handled by PHP running on the
server; a page opened from the file system has no server to talk to, so it cannot
authenticate anybody. The system must be reached through
`http://localhost/sapts/` with Apache and MySQL running.
