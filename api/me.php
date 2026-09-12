<?php
/** Reports who is signed in; the front end calls this before rendering. */
declare(strict_types=1);
require __DIR__ . '/config.php';
$u = current_user();
if ($u === null) {
    json_out(['ok' => true, 'authenticated' => false]);
}
json_out([
    'ok'            => true,
    'authenticated' => true,
    'csrf'          => csrf_token(),
    'user'          => [
        'id'                 => (int) $u['user_id'],
        'indexNumber'        => $u['index_number'],
        'name'               => $u['full_name'],
        'email'              => $u['email'],
        'role'               => $u['role'],
        'mustChangePassword' => (bool) $u['must_change_password'],
        'theme'              => $u['theme'],
        'weeklyGoal'         => (int) $u['weekly_goal'],
        'focusLen'           => (int) $u['focus_len'],
        'breakLen'           => (int) $u['break_len'],
    ],
]);
