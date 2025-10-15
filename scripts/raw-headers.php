<?php
// Simple script to show all received headers - no WordPress loading
header('Content-Type: text/plain');

echo "=== ALL SERVER VARIABLES ===\n";
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0 || in_array($key, ['HTTPS', 'SERVER_PORT', 'REQUEST_SCHEME'])) {
        echo "$key: $value\n";
    }
}

echo "\n=== FORWARDED HEADERS ===\n";
echo "X-Forwarded-Proto: " . ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? 'NOT SET') . "\n";
echo "X-Forwarded-Host: " . ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? 'NOT SET') . "\n";
echo "HTTPS: " . ($_SERVER['HTTPS'] ?? 'NOT SET') . "\n";
echo "SERVER_PORT: " . ($_SERVER['SERVER_PORT'] ?? 'NOT SET') . "\n";
?>