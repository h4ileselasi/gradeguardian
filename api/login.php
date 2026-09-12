<?php
/** Signs a student or administrator in. */
declare(strict_types=1);
require __DIR__ . '/config.php';
require_post();
start_session();

$in       = body();
$identity = clean($in['identity'] ?? '', 160);   // index number or email
$password = (string) ($in['password'] ?? '');

if ($identity === '' || $password === '') {
    fail(400, 'Enter your index number and password.');
}

$st = db()->prepare(
    'SELECT user_id, password_hash, status, role, full_name, must_change_password
       FROM user WHERE index_number = ? OR email = ? LIMIT 1'
);
$st->execute([$identity, $identity]);
$u = $st->fetch();

/* Verify against a dummy hash when no row matched, so that a wrong index number
   and a wrong password take the same time and cannot be told apart. */
if (!$u) {
    password_verify($password, '$2y$12$usesomesillystringfoobarbazquxquuxcorgegraultgarplyw');
    fail(401, 'Index number or password is incorrect.');
}
if (!password_verify($password, $u['password_hash'])) {
    fail(401, 'Index number or password is incorrect.');
}
if ($u['status'] !== 'active') {
    fail(403, 'This account has been deactivated. Speak to your administrator.');
}

/* Re-hash transparently if the cost factor has since been raised. */
if (password_needs_rehash($u['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
    $up = db()->prepare('UPDATE user SET password_hash = ? WHERE user_id = ?');
    $up->execute([password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]), $u['user_id']]);
}

session_regenerate_id(true);               // defeats session fixation
$_SESSION['user_id'] = (int) $u['user_id'];
db()->prepare('UPDATE user SET last_login = NOW() WHERE user_id = ?')->execute([$u['user_id']]);

json_out([
    'ok'   => true,
    'user' => [
        'name'               => $u['full_name'],
        'role'               => $u['role'],
        'mustChangePassword' => (bool) $u['must_change_password'],
    ],
    'csrf' => csrf_token(),
]);
