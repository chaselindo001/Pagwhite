<?php
// Configuração da API Blackcat
if (!defined('BLACKCAT_API_KEY')) {
    define('BLACKCAT_API_KEY', getenv('BLACKCAT_API_KEY') ?: 'SUA_API_KEY_AQUI');
}

if (!defined('BLACKCAT_BASE_URL')) {
    define('BLACKCAT_BASE_URL', 'https://api.blackcatoficial.com/api');
}
