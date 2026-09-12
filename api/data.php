<?php
/**
 * The signed-in student's academic records.
 *
 *   GET   returns every row belonging to this user, from the relational tables.
 *   POST  replaces them with the supplied set, inside one transaction.
 *
 * Every statement is filtered by user_id taken from the session, never from the
 * request, so one student can neither read nor write another student's records.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

/** The 4.0 letter scale used by the interface, applied server-side so the
    `grade` column is meaningful when read directly in phpMyAdmin. */
function letter_for(?float $score): ?string
{
    if ($score === null) return null;
    return match (true) {
        $score >= 80 => 'A',
        $score >= 75 => 'B+',
        $score >= 70 => 'B',
        $score >= 65 => 'C+',
        $score >= 60 => 'C',
        $score >= 55 => 'D+',
        $score >= 50 => 'D',
        default      => 'F',
    };
}

$u   = require_login();
$uid = (int) $u['user_id'];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $q = function (string $sql) use ($uid): array {
        $st = db()->prepare($sql);
        $st->execute([$uid]);
        return $st->fetchAll();
    };
    json_out([
        'ok'       => true,
        'courses'  => array_map(
            /* The interface keeps the numeric mark in `grade` and derives the
               letter itself, so send a number and cast it away from MySQL's string. */
            static function (array $c): array {
                $c['creditHours'] = (int) $c['creditHours'];
                $c['grade'] = $c['grade'] === null ? null : (float) $c['grade'];
                return $c;
            },
            $q('SELECT course_id AS id, code, name, credit_hours AS creditHours,
                       lecturer AS instructor, semester, score AS grade
                  FROM course WHERE user_id = ? ORDER BY code')
        ),
        'sessions' => $q('SELECT session_id AS id, course_id AS courseId, startedAt, minutes, session_type AS type
                            FROM (SELECT session_id, course_id, user_id,
                                         DATE_FORMAT(started_at, "%Y-%m-%dT%H:%i:%s") AS startedAt,
                                         minutes, session_type
                                    FROM study_session) s
                           WHERE user_id = ? ORDER BY startedAt'),
        'tasks'    => $q('SELECT task_id AS id, course_id AS courseId, title,
                                 DATE_FORMAT(due_date, "%Y-%m-%d") AS dueDate, priority, done
                            FROM task WHERE user_id = ? ORDER BY due_date'),
        'decks'    => $q('SELECT deck_id AS id, course_id AS courseId, name
                            FROM deck WHERE user_id = ? ORDER BY name'),
        'cards'    => $q('SELECT c.card_id AS id, c.deck_id AS deckId, c.front, c.back, c.mastered
                            FROM flashcard c JOIN deck d ON d.deck_id = c.deck_id
                           WHERE d.user_id = ? ORDER BY c.card_id'),
        'vault'    => $q('SELECT item_id AS id, course_id AS courseId, title, item_type AS type,
                                 note_body AS content, file_name AS fileName
                            FROM vault_item WHERE user_id = ? ORDER BY uploaded_at DESC'),
        'settings' => [
            'name'       => $u['full_name'],
            'email'      => $u['email'],
            'theme'      => $u['theme'],
            'weeklyGoal' => (int) $u['weekly_goal'],
            'focusLen'   => (int) $u['focus_len'],
            'breakLen'   => (int) $u['break_len'],
        ],
    ]);
}

require_post();
require_csrf();
$in = body();

$rows = static fn(string $k): array => is_array($in[$k] ?? null) ? $in[$k] : [];
$num  = static fn(mixed $v, int $d = 0): int => is_numeric($v) ? (int) $v : $d;
$orNull = static fn(mixed $v): ?int => ($v === null || $v === '' ) ? null : (int) $v;

$pdo = db();
$pdo->beginTransaction();
try {
    /* Replace this user's rows. Deleting the courses cascades to their
       assessments, sessions, tasks and vault items, so the order matters. */
    foreach (['vault_item', 'task', 'study_session'] as $t) {
        $pdo->prepare("DELETE FROM {$t} WHERE user_id = ?")->execute([$uid]);
    }
    $pdo->prepare('DELETE FROM flashcard WHERE deck_id IN (SELECT deck_id FROM deck WHERE user_id = ?)')->execute([$uid]);
    $pdo->prepare('DELETE FROM deck   WHERE user_id = ?')->execute([$uid]);
    $pdo->prepare('DELETE FROM course WHERE user_id = ?')->execute([$uid]);

    /* Client-side ids are remapped to the database's own ids. */
    $courseMap = [];
    $insCourse = $pdo->prepare(
        'INSERT INTO course (user_id, code, name, credit_hours, lecturer, semester, score, grade)
         VALUES (?,?,?,?,?,?,?,?)'
    );
    foreach ($rows('courses') as $c) {
        $score = isset($c['grade']) && is_numeric($c['grade']) ? (float) $c['grade'] : null;
        if ($score !== null && ($score < 0 || $score > 100)) {
            $score = null;                        // rejected rather than stored wrong
        }
        $insCourse->execute([
            $uid,
            clean($c['code'] ?? '', 16),
            clean($c['name'] ?? 'Untitled course', 160),
            max(1, min(12, $num($c['creditHours'] ?? 3, 3))),
            clean($c['instructor'] ?? '', 120) ?: null,
            clean($c['semester'] ?? '', 40) ?: null,
            $score,
            letter_for($score),
        ]);
        if (isset($c['id'])) {
            $courseMap[(string) $c['id']] = (int) $pdo->lastInsertId();
        }
    }
    $cid = static fn(mixed $v): ?int => isset($courseMap[(string) $v]) ? $courseMap[(string) $v] : null;

    $insSession = $pdo->prepare(
        'INSERT INTO study_session (user_id, course_id, started_at, minutes, session_type) VALUES (?,?,?,?,?)'
    );
    foreach ($rows('sessions') as $s) {
        $mins = $num($s['minutes'] ?? 0);
        if ($mins < 1 || $mins > 600) { continue; }
        $when = strtotime((string) ($s['startedAt'] ?? '')) ?: time();
        $insSession->execute([$uid, $cid($s['courseId'] ?? null), date('Y-m-d H:i:s', $when), $mins,
                              ($s['type'] ?? 'focus') === 'break' ? 'break' : 'focus']);
    }

    $insTask = $pdo->prepare(
        'INSERT INTO task (user_id, course_id, title, due_date, priority, done) VALUES (?,?,?,?,?,?)'
    );
    foreach ($rows('tasks') as $t) {
        $due = !empty($t['dueDate']) ? date('Y-m-d', strtotime((string) $t['dueDate']) ?: time()) : null;
        $pri = in_array($t['priority'] ?? '', ['low', 'medium', 'high'], true) ? $t['priority'] : 'medium';
        $insTask->execute([$uid, $cid($t['courseId'] ?? null), clean($t['title'] ?? 'Untitled', 200),
                           $due, $pri, !empty($t['done']) ? 1 : 0]);
    }

    $insDeck = $pdo->prepare('INSERT INTO deck (user_id, course_id, name) VALUES (?,?,?)');
    $insCard = $pdo->prepare('INSERT INTO flashcard (deck_id, front, back, mastered) VALUES (?,?,?,?)');
    $deckMap = [];
    foreach ($rows('decks') as $d) {
        $insDeck->execute([$uid, $cid($d['courseId'] ?? null), clean($d['name'] ?? 'Untitled deck', 160)]);
        if (isset($d['id'])) { $deckMap[(string) $d['id']] = (int) $pdo->lastInsertId(); }
    }
    foreach ($rows('cards') as $c) {
        $deck = $deckMap[(string) ($c['deckId'] ?? '')] ?? null;
        if ($deck === null) { continue; }          // a card with no surviving deck is dropped
        $insCard->execute([$deck, clean($c['front'] ?? '', 2000), clean($c['back'] ?? '', 2000),
                           !empty($c['mastered']) ? 1 : 0]);
    }

    $insVault = $pdo->prepare(
        'INSERT INTO vault_item (user_id, course_id, title, item_type, note_body, file_name) VALUES (?,?,?,?,?,?)'
    );
    foreach ($rows('vault') as $v) {
        $type = in_array($v['type'] ?? '', ['note', 'image', 'pdf'], true) ? $v['type'] : 'note';
        $insVault->execute([$uid, $cid($v['courseId'] ?? null), clean($v['title'] ?? 'Untitled', 200),
                            $type, clean($v['content'] ?? '', 60000) ?: null,
                            clean($v['fileName'] ?? '', 255) ?: null]);
    }

    if (is_array($in['settings'] ?? null)) {
        $s = $in['settings'];
        $pdo->prepare('UPDATE user SET full_name = ?, email = ?, theme = ?, weekly_goal = ?, focus_len = ?, break_len = ?
                        WHERE user_id = ?')
            ->execute([
                clean($s['name'] ?? $u['full_name'], 120) ?: $u['full_name'],
                clean($s['email'] ?? '', 160) ?: null,
                ($s['theme'] ?? 'light') === 'dark' ? 'dark' : 'light',
                max(1, min(100, $num($s['weeklyGoal'] ?? 10, 10))),
                max(5, min(120, $num($s['focusLen'] ?? 25, 25))),
                max(1, min(60,  $num($s['breakLen'] ?? 5, 5))),
                $uid,
            ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();                               // nothing is half-written
    fail(500, 'The records could not be saved. No change was made.');
}

json_out(['ok' => true, 'savedAt' => date('c')]);
