(() => {
  const $ = id => document.getElementById(id);
  const form = $('registration-form');
  const packageSelect = $('package');
  const sizeWrap = $('shirt-size-wrap');
  const sizeSelect = $('shirt_size');
  const total = $('total');
  const prices = { no_shirt: 59.90, with_shirt: 99.90 };
  const whatsappNumber = '5581999510223';
  const pixKey = '52.244.653/0001-10';
  const STORAGE_KEY = 'jp_sports_local_registrations_v1';
  const PASSWORD_KEY = 'jp_sports_admin_password_hash_v1';
  let authMode = 'login';
  const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const readRegistrations = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
  const saveRegistrations = rows => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  const packageName = key => key === 'with_shirt' ? 'Com camisa azul' : 'Sem camisa';

  function updatePackage() {
    const selected = packageSelect.value;
    const hasShirt = selected === 'with_shirt';
    sizeWrap.classList.toggle('hidden', !hasShirt);
    sizeSelect.required = hasShirt;
    total.textContent = prices[selected] ? money(prices[selected]) : 'Selecione seu pacote';
  }
  packageSelect.addEventListener('change', updatePackage);

  // Hash local simples para compatibilidade; isto não substitui autenticação de servidor.
  function hashPassword(password) {
    let hash = 2166136261;
    for (let i = 0; i < password.length; i++) {
      hash ^= password.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function setAuthMode(mode) {
    authMode = mode;
    const first = !localStorage.getItem(PASSWORD_KEY);
    $('auth-title').textContent = first ? 'Criar senha administrativa' : 'Acesso administrativo';
    $('auth-description').textContent = first ? 'Defina uma senha para proteger o painel neste navegador.' : 'Digite sua senha para consultar as inscrições salvas neste navegador.';
    $('new-password-label').classList.toggle('hidden', !first);
    $('confirm-password-label').classList.toggle('hidden', !first);
    $('current-password-label').classList.toggle('hidden', first);
    // Hidden required inputs still block native form submission unless disabled.
    $('new-password').disabled = !first;
    $('confirm-password').disabled = !first;
    $('admin-password').disabled = first;
    $('new-password').required = first;
    $('confirm-password').required = first;
    $('admin-password').required = !first;
    $('auth-submit').textContent = first ? 'Criar senha e acessar' : 'Entrar';
    $('login-message').textContent = '';
  }

  function showAdmin() {
    $('public-view').classList.add('hidden');
    $('admin-view').classList.remove('hidden');
    $('admin-auth-card').classList.remove('hidden');
    $('admin-dashboard').classList.add('hidden');
    setAuthMode('login');
  }
  function showPublic() {
    $('admin-view').classList.add('hidden');
    $('public-view').classList.remove('hidden');
  }
  $('admin-open').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname + location.search + '#admin');
    showAdmin();
  });
  $('back-public').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    showPublic();
  });

  $('admin-auth-form').addEventListener('submit', event => {
    event.preventDefault();
    const first = !localStorage.getItem(PASSWORD_KEY);
    const message = $('login-message');
    message.textContent = '';
    try {
      if (first) {
        const password = $('new-password').value;
        if (password.length < 8) { message.textContent = 'A senha precisa ter pelo menos 8 caracteres.'; return; }
        if (password !== $('confirm-password').value) { message.textContent = 'As senhas não conferem.'; return; }
        localStorage.setItem(PASSWORD_KEY, hashPassword(password));
      } else {
        const entered = hashPassword($('admin-password').value);
        if (entered !== localStorage.getItem(PASSWORD_KEY)) { message.textContent = 'Senha incorreta.'; return; }
      }
      $('admin-auth-card').classList.add('hidden');
      $('admin-dashboard').classList.remove('hidden');
      renderDashboard();
    } catch (error) {
      message.textContent = 'Não foi possível abrir o painel neste navegador. Verifique se o armazenamento local está habilitado e tente novamente.';
      console.error('Falha no acesso administrativo:', error);
    }
  });

  function renderDashboard() {
    const rows = readRegistrations();
    $('stat-total').textContent = rows.length;
    $('stat-3k').textContent = rows.filter(r => r.distance === '3 km').length;
    $('stat-5k').textContent = rows.filter(r => r.distance === '5 km').length;
    $('stat-shirts').textContent = rows.filter(r => r.package === 'with_shirt').length;
    $('empty-list').classList.toggle('hidden', rows.length > 0);
    const body = $('registrations-body');
    body.innerHTML = '';
    rows.slice().reverse().forEach(row => {
      const tr = document.createElement('tr');
      const values = [new Date(row.createdAt).toLocaleString('pt-BR'), row.name, row.phone, row.distance, packageName(row.package) + (row.shirtSize ? ` (${row.shirtSize})` : ''), money(row.amount)];
      values.forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.appendChild(td); });
      const method = document.createElement('td');
      method.textContent = row.paymentMethod || 'Pix';
      tr.appendChild(method);
      const status = document.createElement('td');
      const select = document.createElement('select');
      ['Pendente','Pago'].forEach(label => { const option = document.createElement('option'); option.value = label; option.textContent = label; select.appendChild(option); });
      select.value = row.paymentStatus || 'Pendente';
      select.addEventListener('change', () => { const all = readRegistrations(); const target = all.find(r => r.id === row.id); if (target) target.paymentStatus = select.value; saveRegistrations(all); });
      status.appendChild(select); tr.appendChild(status);
      const actions = document.createElement('td');
      const del = document.createElement('button'); del.type = 'button'; del.className = 'btn outline'; del.textContent = 'Excluir';
      del.addEventListener('click', () => { if (confirm(`Excluir a solicitação de ${row.name} deste navegador?`)) { saveRegistrations(readRegistrations().filter(r => r.id !== row.id)); renderDashboard(); } });
      actions.appendChild(del); tr.appendChild(actions); body.appendChild(tr);
    });
  }

  $('admin-logout').addEventListener('click', () => { $('admin-dashboard').classList.add('hidden'); $('admin-auth-card').classList.remove('hidden'); $('admin-auth-form').reset(); setAuthMode('login'); });
  $('export-csv').addEventListener('click', () => {
    const rows = readRegistrations();
    if (!rows.length) { alert('Não há inscrições para exportar neste navegador.'); return; }
    const headers = ['Data','Nome','WhatsApp','E-mail','Distância','Pacote','Tamanho','Valor','Forma de pagamento','Status do pagamento'];
    const csvRows = rows.map(r => [new Date(r.createdAt).toLocaleString('pt-BR'),r.name,r.phone,r.email,r.distance,packageName(r.package),r.shirtSize || '',money(r.amount),r.paymentMethod || 'Pix',r.paymentStatus || 'Pendente']);
    const csv = [headers,...csvRows].map(line => line.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'inscritos-jp-sports.csv'; a.click(); URL.revokeObjectURL(url);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const packageKey = data.get('package');
    const amount = prices[packageKey];
    const registration = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      createdAt: new Date().toISOString(),
      name: String(data.get('full_name')).trim(), phone: String(data.get('phone')).trim(),
      email: String(data.get('email')).trim(), distance: data.get('distance'), package: packageKey,
      shirtSize: packageKey === 'with_shirt' ? data.get('shirt_size') : '', amount,
      paymentMethod: String(data.get('payment_method') || 'Pix'),
      paymentStatus: 'Pendente'
    };
    const saved = readRegistrations(); saved.push(registration); saveRegistrations(saved);
    const message = [
      'Olá! Quero solicitar minha inscrição no Treinão Novembro Azul do JP.', '',
      `Nome: ${registration.name}`, `WhatsApp: ${registration.phone}`, `E-mail: ${registration.email}`,
      `Distância: ${registration.distance}`, `Pacote: ${packageName(packageKey)}`,
      ...(registration.shirtSize ? [`Tamanho da camisa: ${registration.shirtSize}`] : []),
      `Valor: ${money(amount)}`, 'Pagamento: Pix', `Chave Pix (CNPJ): ${pixKey}`, '',
      'Estou ciente de que a inscrição será confirmada após o retorno da organização e a confirmação do pagamento.'
    ].join('\n');
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    $('form-message').textContent = 'Solicitação salva neste navegador. O WhatsApp foi aberto para você enviar a mensagem. A vaga ainda depende da confirmação da organização.';
    if (!opened) $('form-message').textContent += ' Se o WhatsApp não abriu, permita pop-ups e tente novamente.';
    form.reset(); updatePackage();
  });
  updatePackage();
  if (location.hash === '#admin' || new URLSearchParams(location.search).has('admin')) showAdmin();
  window.addEventListener('hashchange', () => {
    if (location.hash === '#admin') showAdmin();
  });
})();
