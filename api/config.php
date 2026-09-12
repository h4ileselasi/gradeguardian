<?php
/**
 * Student Academic Progress Tracking System — shared API bootstrap.
 *
 * Database connection, session handling and the small helpers every endpoint
 * uses. Nothing here emits output, so it is safe to require from any endpoint.
 */
declare(strict_types=1);

/* ---- Database connection -------------------------------------------------
   These are XAMPP's defaults. Change them if your MySQL uses other credentials. */
const DB_HOST = '127.0.0.1';
const DB_PORT = 3306;
const DB_NAME = 'sapts';
const DB_USER = 'root';
const DB_PASS = '';

/* A unix socket may be supplied instead of host/port (used by the test harness). */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $socket = getenv('SAPTS_DB_SOCKET') ?: '';
    $dsn = $socket !== ''
        ? sprintf('mysql:unix_socket=%s;dbname=%s;charset=utf8mb4', $socket, DB_NAME)
        : sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    try {
        $pdo = new PDO($dsn, getenv('SAPTS_DB_USER') ?: DB_USER, getenv('SAPTS_DB_PASS') ?: DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        fail(500, 'The system cannot reach the database. Start MySQL in the XAMPP Control Panel and confirm the sapts database has been imported.');
    }
    return $pdo;
}

/* ---- Session -------------------------------------------------------------- */
function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,          // not readable from JavaScript
        'samesite' => 'Lax',         // not sent on cross-site requests
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_name('SAPTSSESS');
    session_start();
}

/* ---- JSON responses ------------------------------------------------------- */
function json_out(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $message): never
{
    json_out(['ok' => false, 'error' => $message], $status);
}

/* ---- Request helpers ------------------------------------------------------ */
function body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        fail(405, 'This endpoint accepts POST requests only.');
    }
}

/* ---- Authentication guards ------------------------------------------------ */
function current_user(): ?array
{
    start_session();
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $st = db()->prepare(
        'SELECT user_id, index_number, full_name, email, role, status,
                must_change_password, theme, weekly_goal, focus_len, break_len
           FROM user WHERE user_id = ? LIMIT 1'
    );
    $st->execute([$_SESSION['user_id']]);
    $u = $st->fetch();
    if (!$u || $u['status'] !== 'active') {
        session_destroy();          // the account was deactivated mid-session
        return null;
    }
    return $u;
}

function require_login(): array
{
    $u = current_user();
    if ($u === null) {
        fail(401, 'You are not signed in.');
    }
    return $u;
}

function require_admin(): array
{
    $u = require_login();
    if ($u['role'] !== 'admin') {
        fail(403, 'This action is restricted to administrators.');
    }
    return $u;
}

/* ---- Cross-site request forgery ------------------------------------------- */
function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function require_csrf(): void
{
    start_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? (body()['csrf'] ?? '');
    if (empty($_SESSION['csrf']) || !is_string($sent) || !hash_equals($_SESSION['csrf'], $sent)) {
        fail(419, 'Your session has expired. Reload the page and try again.');
    }
}

/* ---- Validation ----------------------------------------------------------- */
function clean(mixed $v, int $max = 255): string
{
    return mb_substr(trim((string) $v), 0, $max);
}

/** Passwords are checked for length only; complexity rules push users to reuse. */
function password_problem(string $pw): ?string
{
    if (mb_strlen($pw) < 8)   return 'The password must be at least 8 characters long.';
    if (mb_strlen($pw) > 200) return 'The password is too long.';
    return null;
}
