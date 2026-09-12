/* ============================================================
   Student Academic Progress Tracking System (SAPTS)
   Authentication and server-sync helper.

   Every page loads this before its own script. It wraps the PHP
   API, keeps the CSRF token for the session, and provides the
   guard that sends signed-out visitors to the login page.
   ============================================================ */

"use strict";

const Auth = (() => {
  let csrf = null;
  let user = null;

  /** POST JSON to an endpoint, raising the server's own message on failure. */
  async function post(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: JSON.stringify(payload || {}),
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error(
        "The server did not respond as expected. Check that Apache and MySQL are running in XAMPP.",
      );
    }
    if (data.csrf) csrf = data.csrf;
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || "The request failed.");
    }
    return data;
  }

  async function get(url) {
    const res = await fetch(url, { credentials: "same-origin" });
    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error(
        "The server did not respond as expected. Check that Apache and MySQL are running in XAMPP.",
      );
    }
    if (data.csrf) csrf = data.csrf;
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || "The request failed.");
    }
    return data;
  }

  /** Who is signed in, if anyone. Never throws for an anonymous visitor. */
  async function me() {
    try {
      const s = await get("api/me.php");
      user = s.authenticated ? s.user : null;
      return s;
    } catch {
      return { authenticated: false };
    }
  }

  /**
   * Page guard. Resolves with the signed-in user, or redirects and never
   * resolves. `role` optionally restricts the page to "admin".
   */
  async function requireUser(role) {
    const s = await me();
    if (!s.authenticated) {
      location.replace("login.html");
      return new Promise(() => {});
    }
    if (s.user.mustChangePassword) {
      location.replace("login.html");
      return new Promise(() => {});
    }
    if (role && s.user.role !== role) {
      location.replace("index.html");
      return new Promise(() => {});
    }
    return s.user;
  }

  async function logout() {
    try {
      await post("api/logout.php", {});
    } catch {
      /* signing out locally matters more than the server's reply */
    }
    location.replace("login.html");
  }

  return {
    post,
    get,
    me,
    requireUser,
    logout,
    get csrf() {
      return csrf;
    },
    get user() {
      return user;
    },
  };
})();
