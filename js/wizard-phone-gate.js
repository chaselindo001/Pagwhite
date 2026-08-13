(function () {
  'use strict';

  var STYLE_ID = 'credpix-phone-gate-styles';
  var OPEN = false;

  function apiBase() {
    if (typeof window.credpixPath === 'function') {
      return window.credpixPath('/type/api');
    }
    var base = window.credpixGetBasePath ? window.credpixGetBasePath() : '';
    return (base || '') + '/type/api';
  }

  function readLead() {
    var keys = [
      window.credpixStorageKey ? window.credpixStorageKey('lead') : 'credpix:lead',
      'credpix:_root:lead',
      'credpix:_empa:lead',
      'credpix_lead',
    ];
    for (var i = 0; i < keys.length; i++) {
      try {
        var raw = localStorage.getItem(keys[i]);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  }

  function readNumber(keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = localStorage.getItem(keys[i]);
        if (v != null && v !== '') return Number(v);
      } catch (e) {}
    }
    return fallback;
  }

  function stripCountryCode(value) {
    var d = String(value || '').replace(/\D/g, '');
    if (d.indexOf('55') === 0 && d.length > 11) {
      d = d.slice(2);
    }
    return d.slice(0, 11);
  }

  function formatPhone(value) {
    var d = stripCountryCode(value);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) {
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    }
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function validPhone(value) {
    var d = stripCountryCode(value);
    return d.length >= 10 && d.length <= 11;
  }

  function normalizePhone(value) {
    return stripCountryCode(value);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '.credpix-phone-overlay{position:fixed;inset:0;background:rgba(15,27,54,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999;backdrop-filter:blur(2px)}' +
      '.credpix-phone-modal{width:100%;max-width:420px;background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(15,27,54,.25);padding:24px;font-family:Inter,system-ui,sans-serif}' +
      '.credpix-phone-modal h2{margin:0 0 8px;font-size:20px;color:#0f1b36}' +
      '.credpix-phone-modal p{margin:0 0 16px;font-size:14px;line-height:1.5;color:#5b6478}' +
      '.credpix-phone-modal label{display:block;font-size:12px;font-weight:600;color:#5b6478;margin-bottom:6px}' +
      '.credpix-phone-field{display:flex;align-items:stretch;border:1px solid #d7deea;border-radius:10px;overflow:hidden;margin-bottom:8px;background:#fff}' +
      '.credpix-phone-field:focus-within{border-color:#1351b4;box-shadow:0 0 0 3px rgba(19,81,180,.15)}' +
      '.credpix-phone-prefix{display:flex;align-items:center;padding:0 12px;font-size:16px;font-weight:600;color:#0f1b36;background:#eef2f8;border-right:1px solid #d7deea;white-space:nowrap;user-select:none}' +
      '.credpix-phone-modal input{width:100%;box-sizing:border-box;border:none;border-radius:0;padding:14px 12px;font-size:16px;margin-bottom:0}' +
      '.credpix-phone-modal input:focus{outline:none;box-shadow:none}' +
      '.credpix-phone-hint{font-size:12px;color:#5b6478;margin:-4px 0 8px;line-height:1.4}' +
      '.credpix-phone-error{color:#b42318;font-size:12px;min-height:18px;margin-bottom:12px}' +
      '.credpix-phone-actions{display:flex;gap:10px;margin-top:8px}' +
      '.credpix-phone-btn{flex:1;border:none;border-radius:10px;padding:14px 16px;font-size:15px;font-weight:600;cursor:pointer}' +
      '.credpix-phone-btn-primary{background:#1351b4;color:#fff}' +
      '.credpix-phone-btn-primary:disabled{opacity:.6;cursor:not-allowed}' +
      '.credpix-phone-btn-secondary{background:#eef2f8;color:#0f1b36}';
    document.head.appendChild(style);
  }

  function closeModal() {
    var overlay = document.querySelector('.credpix-phone-overlay');
    if (overlay) overlay.remove();
    OPEN = false;
  }

  function saveLeadLocal(lead, phone) {
    var payload = Object.assign({}, lead || {}, {
      telefone: phone,
      phone: phone,
    });
    var keys = [
      window.credpixStorageKey ? window.credpixStorageKey('lead') : 'credpix:lead',
      'credpix:_root:lead',
      'credpix:_empa:lead',
      'credpix_lead',
    ];
    keys.forEach(function (key) {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (e) {}
    });
    try {
      localStorage.setItem('credpix_telefone', phone);
    } catch (e) {}
  }

  async function submitPhone(phone, lead) {
    var valor = readNumber(
      [
        'valor_emprestimo',
        window.credpixStorageKey ? window.credpixStorageKey('valor_emprestimo') : '',
        'credpix:_empa:valor_emprestimo',
      ].filter(Boolean),
      null
    );

    var res = await fetch(apiBase() + '/lead/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone: phone,
        valor_emprestimo: valor,
        num_parcelas: readNumber(['credpix_num_parcelas'], null),
        nome: lead && lead.nome,
        cpf: lead && (lead.cpf_digits || lead.cpf),
      }),
    });

    var data = await res.json().catch(function () {
      return {};
    });

    if (!res.ok || !data.success) {
      throw new Error((data && data.message) || 'Não foi possível salvar seu telefone.');
    }

    saveLeadLocal(data.lead || lead, phone);
    return data;
  }

  function showModal(onContinue) {
    if (OPEN) return;
    OPEN = true;
    ensureStyles();

    var lead = readLead();
    var overlay = document.createElement('div');
    overlay.className = 'credpix-phone-overlay';
    overlay.innerHTML =
      '<div class="credpix-phone-modal" role="dialog" aria-modal="true" aria-labelledby="credpix-phone-title">' +
      '<h2 id="credpix-phone-title">Confirme seu telefone</h2>' +
      '<p>Para liberar o pagamento PIX e avisar sobre a aprovação, precisamos do seu WhatsApp ou celular.</p>' +
      '<label for="credpix-phone-input">WhatsApp ou celular</label>' +
      '<div class="credpix-phone-field">' +
      '<span class="credpix-phone-prefix" aria-hidden="true">+55</span>' +
      '<input id="credpix-phone-input" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(11) 99999-9999" aria-describedby="credpix-phone-hint" />' +
      '</div>' +
      '<p class="credpix-phone-hint" id="credpix-phone-hint">Digite apenas o DDD e o número, sem o código do país.</p>' +
      '<div class="credpix-phone-error" id="credpix-phone-error"></div>' +
      '<div class="credpix-phone-actions">' +
      '<button type="button" class="credpix-phone-btn credpix-phone-btn-secondary" id="credpix-phone-cancel">Voltar</button>' +
      '<button type="button" class="credpix-phone-btn credpix-phone-btn-primary" id="credpix-phone-submit">Continuar</button>' +
      '</div></div>';

    document.body.appendChild(overlay);

    var input = overlay.querySelector('#credpix-phone-input');
    var errorEl = overlay.querySelector('#credpix-phone-error');
    var submitBtn = overlay.querySelector('#credpix-phone-submit');
    var cancelBtn = overlay.querySelector('#credpix-phone-cancel');

    try {
      var saved = localStorage.getItem('credpix_telefone');
      if (saved) input.value = formatPhone(saved);
    } catch (e) {}

    input.addEventListener('input', function () {
      input.value = formatPhone(input.value);
      errorEl.textContent = '';
    });

    cancelBtn.addEventListener('click', function () {
      closeModal();
    });

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closeModal();
    });

    async function confirm() {
      var phone = normalizePhone(input.value);
      if (!validPhone(phone)) {
        errorEl.textContent = 'Informe um telefone válido com DDD (ex: 11 99999-9999).';
        input.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando…';
      errorEl.textContent = '';

      try {
        await submitPhone(phone, lead);
        closeModal();
        if (typeof onContinue === 'function') onContinue();
      } catch (err) {
        errorEl.textContent = err.message || 'Erro ao salvar. Tente novamente.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continuar';
      }
    }

    submitBtn.addEventListener('click', confirm);
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') confirm();
    });

    input.focus();
  }

  window.credpixPhoneGate = function (onContinue) {
    var saved = null;
    try {
      saved = localStorage.getItem('credpix_telefone');
    } catch (e) {}

    if (saved && validPhone(saved)) {
      submitPhone(normalizePhone(saved), readLead())
        .then(function () {
          if (typeof onContinue === 'function') onContinue();
        })
        .catch(function () {
          showModal(onContinue);
        });
      return;
    }

    showModal(onContinue);
  };
})();
