<?php
// Carrega chaves de API do arquivo seguro de chaves local (se existir)
if (file_exists(__DIR__ . '/keys.php')) {
    require_once __DIR__ . '/keys.php';
}

if (!defined('BLACKCAT_API_KEY')) {
    define('BLACKCAT_API_KEY', getenv('BLACKCAT_API_KEY') ?: 'SUA_API_KEY_AQUI');
}

if (!defined('BLACKCAT_PUBLIC_KEY')) {
    define('BLACKCAT_PUBLIC_KEY', getenv('BLACKCAT_PUBLIC_KEY') ?: '');
}

if (!defined('BLACKCAT_BASE_URL')) {
    define('BLACKCAT_BASE_URL', 'https://api.blackcatoficial.com/api');
}
