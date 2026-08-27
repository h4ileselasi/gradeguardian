# Deploying SAPTS on XAMPP

**Student Academic Progress Tracking System**
Ghana Communication Technology University — Faculty of Computing and Information Systems

This guide describes how to host the system on a local Apache server supplied by
XAMPP. The system is delivered as a local web application: no online hosting
provider and no external database server are involved.

---

## 1. Install XAMPP

Download XAMPP from <https://www.apachefriends.org> and run the installer.
The **Apache** component is required. Select **MySQL** as well if you intend to
load the relational schema described in section 6 — the application itself does
not need it, because it stores its data inside the browser. FileZilla, Mercury
and Tomcat can be left unselected.

## 2. Copy the project into the web root

Apache serves files from a folder called `htdocs`. Copy the entire project
folder into it and name the copy `sapts`:

| Operating system | Destination |
| --- | --- |
| Windows | `C:\xampp\htdocs\sapts` |
| macOS | `/Applications/XAMPP/htdocs/sapts` |
| Linux | `/opt/lampp/htdocs/sapts` |

After copying, the folder should contain `index.html`, `style.css`, `script.js`,
`.htaccess` and the `vendor` folder.

## 3. Start Apache

Open the **XAMPP Control Panel** and click **Start** on the Apache row. The row
turns green and reports the ports in use (80 and 443 by default).

## 4. Open the system

In a browser, visit:

```
http://localhost/sapts/
```

The dashboard loads and the system is ready to use. On a first run it seeds
sample data so that the charts and lists are populated for demonstration; this
can be cleared from **Settings → Reset All Data**.

---

## 6. Optional: loading the relational schema

The project ships `database/sapts_schema.sql`, which expresses the same data
model as SQL. The running application does not use it; it exists so that the
design can be inspected in a relational database and so the system can later be
extended to serve several students from one server.

1. Start **MySQL** from the XAMPP Control Panel, alongside Apache.
2. Open <http://localhost/phpmyadmin>.
3. Choose the **Import** tab, select `database/sapts_schema.sql`, and press **Go**.

The script creates a database named `sapts` containing eight tables, and it
loads sample data matching the figures the application shows. Four views
reproduce the calculations the application performs in JavaScript. To confirm
the import, open the **SQL** tab and run:

```sql
USE sapts;
SELECT code, name, weighted_average, letter_grade, grade_points
  FROM v_course_grade ORDER BY code;
SELECT * FROM v_student_gpa;
```

The first query returns the five seeded courses with marks of 85, 78, 72, 66 and
58, and the second returns a grade point average of **2.89** across 14 credit
hours — the same figures shown on the application's dashboard.

Alternatively, from a terminal:

```
mysql -u root -p < database/sapts_schema.sql
```

---

## Demonstrating the system on the defence day

1. Start Apache from the XAMPP Control Panel **before** the session begins.
2. Open `http://localhost/sapts/` and confirm the dashboard renders.
3. Disconnect from the internet if asked to prove the system runs offline — every
   asset (fonts, icons, Chart.js) is bundled inside `vendor/`, so the system
   continues to work.
4. Keep a JSON backup (**Settings → Export Backup**) on the same machine so the
   demonstration data can be restored instantly if anything is cleared.

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

**Data disappeared between sessions**
The browser's site data was cleared, or the system was opened from a different
browser or in a private window. Data is stored per browser, per origin. Restore
from a JSON backup via **Settings → Import Backup**.

**Changes to the files are not visible**
Refresh with `Ctrl + F5` to bypass the browser cache. The bundled `.htaccess`
already instructs Apache to send `no-cache` for HTML, CSS and JavaScript.

---

## Why a local server rather than opening the file directly

The system can technically be opened by double-clicking `index.html`, but serving
it through Apache is the correct arrangement for three reasons:

1. It reproduces a real deployment: the browser requests the application over
   HTTP from a web server, exactly as it would in production.
2. Browsers apply their normal origin rules to `http://localhost`, so storage
   behaves consistently, whereas `file://` pages are treated as opaque origins by
   some browsers.
3. The `.htaccess` configuration — MIME types, security headers and cache
   control — is only applied when Apache serves the files.
