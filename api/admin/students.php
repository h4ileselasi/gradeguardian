<?php
/**
 * Administrator enrolment console API.
 *
 *   GET                     lists enrolled students
 *   POST action=enrol       creates a student account with a temporary password
 *   POST action=reset       issues a new temporary password
 *   POST action=status      activates or deactivates an account
 *   POST action=delete      removes an account and everything belonging to it
 *
 * Every route is behind require_admin(), so a student who calls these by hand
 * receives 403 and nothing happens.
 */
declare(strict_types=1);
require __DIR__ . '/../config.php';

$admin = require_admin();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $rows = db()->query(
        'SELECT u.user_id AS id, u.index_number AS indexNumber, u.full_name AS fullName,
                u.email, u.role, u.status, u.must_change_password AS mustChangePassword,
                DATE_FORMAT(u.last_login, "%Y-%m-%d %H:%i") AS lastLogin,
                DATE_FORMAT(u.created_at, "%Y-%m-%d")       AS enrolledOn,
                (SELECT COUNT(*) FROM course c WHERE c.user_id = u.user_id) AS courseCount
           FROM user u ORDER BY u.role DESC, u.full_name'
    )->fetchAll();
    json_out(['ok' => true, 'students' => $rows, 'csrf' => csrf_token()]);
}

require_post();
require_csrf();
$in     = body();
$action = (string) ($in['action'] ?? '');

/** A readable temporary password; the student is forced to replace it at first login. */
function temp_password(): string
{
    $words = ['amber', 'brisk', 'cedar', 'delta', 'ember', 'flint', 'grove', 'harbo', 'ivory', 'jasper'];
    return $words[random_int(0, count($words) - 1)] . '-' . random_int(1000, 9999);
}

if ($action === 'enrol') {
    $index = clean($in['indexNumber'] ?? '', 20);
    $name  = clean($in['fullName'] ?? '', 120);
    $email = clean($in['email'] ?? '', 160);

    if ($index === '' || $name === '') {
        fail(400, 'An index number and a full name are required.');
    }
    if (!preg_match('/^[A-Za-z0-9-]{4,20}$/', $index)) {
        fail(400, 'The index number may contain only letters, digits and hyphens.');
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail(400, 'That email address is not valid.');
    }

    $st = db()->prepare('SELECT 1 FROM user WHERE index_number = ? OR (email = ? AND email <> "") LIMIT 1');
    $st->execute([$index, $email]);
    if ($st->fetch()) {
        fail(409, 'A student with that index number or email is already enrolled.');
    }

    $temp = temp_password();
    db()->prepare(
        'INSERT INTO user (index_number, full_name, email, password_hash, role, status, must_change_password)
         VALUES (?, ?, ?, ?, "student", "active", 1)'
    )->execute([$index, $name, $email !== '' ? $email : null,
                password_hash($temp, PASSWORD_BCRYPT, ['cost' => 12])]);

    json_out(['ok' => true, 'indexNumber' => $index, 'temporaryPassword' => $temp], 201);
}

$id = (int) ($in['id'] ?? 0);
if ($id <= 0) {
    fail(400, 'No student was selected.');
}
if ($id === (int) $admin['user_id']) {
    fail(400, 'You cannot change your own account from this console.');
}

if ($action === 'reset') {
    $temp = temp_password();
    db()->prepare('UPDATE user SET password_hash = ?, must_change_password = 1 WHERE user_id = ? AND role = "student"')
        ->execute([password_hash($temp, PASSWORD_BCRYPT, ['cost' => 12]), $id]);
    json_out(['ok' => true, 'temporaryPassword' => $temp]);
}

if ($action === 'status') {
    $status = ($in['status'] ?? '') === 'inactive' ? 'inactive' : 'active';
    db()->prepare('UPDATE user SET status = ? WHERE user_id = ? AND role = "student"')->execute([$status, $id]);
    json_out(['ok' => true, 'status' => $status]);
}

if ($action === 'delete') {
    /* The foreign keys cascade, so the student's courses, marks, sessions,
       tasks, decks and vault items are removed with the account. */
    db()->prepare('DELETE FROM user WHERE user_id = ? AND role = "student"')->execute([$id]);
    json_out(['ok' => true]);
}

fail(400, 'Unknown action.');
