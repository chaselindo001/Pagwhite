<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;

$cpfDigits = preg_replace('/\D/', '', $input['cpf_digits'] ?? $input['cpf'] ?? $_GET['cpf'] ?? '');

$lead = [
    'nome' => trim($input['nome'] ?? $input['name'] ?? 'Cliente Solicitante'),
    'cpf_digits' => $cpfDigits,
    'cpf' => $cpfDigits,
    'email' => trim($input['email'] ?? ($cpfDigits ? 'cliente' . $cpfDigits . '@gmail.com' : '')),
    'telefone' => trim($input['telefone'] ?? $input['phone'] ?? '11999999999'),
    'updated_at' => date('c')
];

echo json_encode([
    'success' => true,
    'lead' => $lead
]);
