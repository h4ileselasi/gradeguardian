# Deploying SAPTS on XAMPP

**Student Academic Progress Tracking System**
Ghana Communication Technology University — Faculty of Computing and Information Systems

This guide describes how to host the system on a local Apache server supplied by
XAMPP. The system is delivered as a local web application: no online hosting
provider and no external database server are involved.

---

## 1. Install XAMPP

Download XAMPP from <https://www.apachefriends.org> and run the installer.
During installation only the **Apache** component is required; MySQL, FileZilla,
Mercury and Tomcat can be left unselected, because this system stores its data
inside the browser rather than in a database server.

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
