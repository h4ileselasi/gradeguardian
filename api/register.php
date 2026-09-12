<?php
/** Self-enrolment: a student creates their own account. */
declare(strict_types=1);
require __DIR__ . '/config.php';
require_post();

$in       = body();
$index    = clean($in['indexNumber'] ?? '', 20);
$name     = clean($in['fullName'] ?? '', 120);
$email    = clean($in['email'] ?? '', 160);
$password = (string) ($in['password'] ?? '');

if ($index === '' || $name === '') {
    fail(400, 'Your index number and full name are required.');
}
if (!preg_match('/^[A-Za-z0-9-]{4,20}$/', $index)) {
    fail(400, 'The index number may contain only letters, digits and hyphens.');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(400, 'That email address is not valid.');
}
if ($problem = password_problem($password)) {
    fail(400, $problem);
}

$st = db()->prepare('SELECT 1 FROM user WHERE index_number = ? OR (email = ? AND email <> "") LIMIT 1');
$st->execute([$index, $email]);
if ($st->fetch()) {
    fail(409, 'An account already exists for that index number or email address.');
}

$ins = db()->prepare(
    'INSERT INTO user (index_number, full_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, "student", "active")'
);
$ins->execute([$index, $name, $email !== '' ? $email : null,
               password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])]);

start_session();
session_regenerate_id(true);
$_SESSION['user_id'] = (int) db()->lastInsertId();

json_out(['ok' => true, 'user' => ['name' => $name, 'role' => 'student'], 'csrf' => csrf_token()], 201);
