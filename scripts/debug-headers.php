<?php
/**
 * Debug script to see what headers CloudFront is sending
 */
header('Content-Type: application/json');

$debug = [
    'all_headers' => getallheaders(),
    'server_vars' => $_SERVER,
    'https_status' => [
        'is_https' => is_ssl(),
        'server_https' => $_SERVER['HTTPS'] ?? 'not set',
        'server_port' => $_SERVER['SERVER_PORT'] ?? 'not set',
        'x_forwarded_proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? 'not set',
        'x_forwarded_host' => $_SERVER['HTTP_X_FORWARDED_HOST'] ?? 'not set'
    ]
];

function is_ssl() {
    if (isset($_SERVER['HTTPS'])) {
        if ('on' == strtolower($_SERVER['HTTPS'])) return true;
        if ('1' == $_SERVER['HTTPS']) return true;
    } elseif (isset($_SERVER['SERVER_PORT']) && ('443' == $_SERVER['SERVER_PORT'])) {
        return true;
    }
    return false;
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>