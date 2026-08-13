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

$cpfRaw = $input['cpf'] ?? $_GET['cpf'] ?? '';
$cpfDigits = preg_replace('/\D/', '', $cpfRaw);

if (strlen($cpfDigits) !== 11) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Informe um CPF válido com 11 dígitos.']);
    exit;
}

function formatCpf($d) {
    return substr($d, 0, 3) . '.' . substr($d, 3, 3) . '.' . substr($d, 6, 3) . '-' . substr($d, 9, 2);
}

$cpfFmt = formatCpf($cpfDigits);

echo json_encode([
    'success' => true,
    'lead' => [
        'nome' => 'Cliente Solicitante',
        'cpf_digits' => $cpfDigits,
        'cpf' => $cpfDigits,
        'cpf_formatado' => $cpfFmt,
        'email' => 'cliente' . $cpfDigits . '@gmail.com',
        'telefone' => '11999999999'
    ],
    'request' => [
        'valor_emprestimo' => 4600.00,
        'valor_emprestimo_fmt' => 'R$ 4.600,00',
        'num_parcelas' => 24,
        'parcela_valor' => 30.90,
        'parcela_valor_fmt' => 'R$ 30,90',
        'valor_total_fmt' => 'R$ 4.600,00'
    ]
]);
