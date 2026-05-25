// ARKO checkout mockup — light interactions only

(() => {
  // ---------- Method tabs ----------
  const methods = document.querySelectorAll('.method');
  const forms = document.querySelectorAll('[data-form]');
  methods.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.method;
      methods.forEach((m) => {
        const active = m === btn;
        m.classList.toggle('method--active', active);
        m.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      forms.forEach((f) => {
        f.hidden = f.dataset.form !== key;
      });
    });
  });

  // ---------- Card number formatting ----------
  const cardInput = document.getElementById('card-number');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = raw.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // ---------- Expiration formatting ----------
  const expInput = document.getElementById('exp');
  if (expInput) {
    expInput.addEventListener('input', (e) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
      e.target.value = raw.length >= 3 ? `${raw.slice(0, 2)} / ${raw.slice(2)}` : raw;
    });
  }

  // ---------- CVC ----------
  const cvcInput = document.getElementById('cvc');
  if (cvcInput) {
    cvcInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }
})();
