<?php
/** Lets the signed-in user change their own password. */
declare(strict_types=1);
require __DIR__ . '/config.php';
require_post();
$u = require_login();
require_csrf();

$in      = body();
$current = (string) ($in['currentPassword'] ?? '');
$next    = (string) ($in['newPassword'] ?? '');

$st = db()->prepare('SELECT password_hash, must_change_password FROM user WHERE user_id = ?');
$st->execute([$u['user_id']]);
$row = $st->fetch();

/* A student enrolled by an administrator sets their first password without
   knowing a previous one; everybody else must confirm the current password. */
if (!$row['must_change_password'] && !password_verify($current, $row['password_hash'])) {
    fail(401, 'Your current password is incorrect.');
}
if ($problem = password_problem($next)) {
    fail(400, $problem);
}
if (password_verify($next, $row['password_hash'])) {
    fail(400, 'The new password must be different from the current one.');
}

db()->prepare('UPDATE user SET password_hash = ?, must_change_password = 0 WHERE user_id = ?')
    ->execute([password_hash($next, PASSWORD_BCRYPT, ['cost' => 12]), $u['user_id']]);

session_regenerate_id(true);
json_out(['ok' => true]);
