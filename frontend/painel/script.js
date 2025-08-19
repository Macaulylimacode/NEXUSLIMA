
   const LS_KEYS = {
    SESSION: 'nx.session',
  };
  
  // ----- Utils -----
  const onlyDigits = (s='') => (s || '').replace(/\D/g,'');
  const brl = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  
  // Máscaras (exibição)
  const maskCPF   = v => (v||'').replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
  const maskCNPJ  = v => (v||'').replace(/\D/g,'').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3\/$4-$5');
  const maskPhone = v => {
    const d = onlyDigits(v).slice(0,11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  };
  const maskPixRandom = v => onlyDigits(v).slice(0,32);
  
  // Detecção tipo de chave PIX + regras
  function detectPixType(v){
    const s = (v||'').trim();
    const d = onlyDigits(s);
  
    // telefone
    if (/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(s) || d.length===10 || d.length===11){
      return {type:'telefone', valid: d.length===10||d.length===11, format:maskPhone(s), hint:'Informe DDD + número'};
    }
    // CPF
    if (d.length===11){
      return {type:'cpf', valid:true, format:maskCPF(d), hint:''};
    }
    // CNPJ
    if (d.length===14){
      return {type:'cnpj', valid:true, format:maskCNPJ(d), hint:''};
    }
    // email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)){
      return {type:'email', valid:true, format:s, hint:''};
    }
    // aleatória (UUID/32 chars)
    if (d.length>0){
      const fmt = maskPixRandom(d);
      return {type:'aleatoria', valid: fmt.length>=20 && fmt.length<=32, format:fmt, hint:'20 a 32 dígitos'};
    }
    return {type:'desconhecida', valid:false, format:s, hint:'Digite telefone/CPF/CNPJ/email/chave aleatória'};
  }
  
  // CPF válido (para quando quiser validar)
  function isValidCPF(cpf){
    cpf = onlyDigits(cpf);
    if (!cpf || cpf.length!==11 || /^(\d)\1+$/.test(cpf)) return false;
    let s=0; for(let i=0;i<9;i++) s += parseInt(cpf.charAt(i))*(10-i);
    let r=11-(s%11); if (r>=10) r=0; if (r!==parseInt(cpf.charAt(9))) return false;
    s=0; for(let i=0;i<10;i++) s += parseInt(cpf.charAt(i))*(11-i);
    r=11-(s%11); if (r>=10) r=0; return r===parseInt(cpf.charAt(10));
  }
  
  // ----- Dados Simulados -----
  // • Dois logins disponíveis:
  //   - Cliente: CPF 000.000.001-91, senha 1234
  //   - Gerente: CPF 111.444.777-35, senha admin
  const MOCK = (() => {
    const today = new Date();
    const within = (y,m,d)=> new Date(y,m-1,d).toISOString();
  
    // clientes (10) – datas entre Jun e Ago/2025 (mascarados na UI)
    const clientes = [
      {id:1, nome:'Ana Souza', cpf:'00000000191', empresa:{nome:'Petrobras', cnpj:'33000167000101'}, cadastradoEm:within(2025,6,3),  saldo:12873.42},
      {id:2, nome:'Bruno Lima', cpf:'86288366704', empresa:{nome:'Vale', cnpj:'33530486000129'},       cadastradoEm:within(2025,6,15), saldo:4873.10},
      {id:3, nome:'Carla Nunes', cpf:'39053344705', empresa:{nome:'Itaú Unibanco', cnpj:'60701190000104'}, cadastradoEm:within(2025,6,28), saldo:905.22},
      {id:4, nome:'Diego Santos', cpf:'29537914810', empresa:{nome:'Ambev', cnpj:'07526557000100'},   cadastradoEm:within(2025,7,4),  saldo:15202.00},
      {id:5, nome:'Elisa Prado', cpf:'62648716020', empresa:{nome:'Natura', cnpj:'71673919000158'},   cadastradoEm:within(2025,7,12), saldo:380.00},
      {id:6, nome:'Felipe Alves', cpf:'98765432100', empresa:{nome:'Magazine Luiza', cnpj:'47960950000121'}, cadastradoEm:within(2025,7,19), saldo:2410.77},
      {id:7, nome:'Gabriela Reis', cpf:'12312312387', empresa:{nome:'Banco do Brasil', cnpj:'00000000000191'}, cadastradoEm:within(2025,7,29), saldo:777.00},
      {id:8, nome:'Heitor Mota', cpf:'82648599001', empresa:{nome:'Bradesco', cnpj:'60746948000112'}, cadastradoEm:within(2025,8,2),  saldo:190.35},
      {id:9, nome:'Isabela Rocha', cpf:'74185296320', empresa:{nome:'B3', cnpj:'09364621000160'},     cadastradoEm:within(2025,8,9),  saldo:5400.00},
      {id:10,nome:'João Pedro', cpf:'10293847566', empresa:{nome:'WEG', cnpj:'84866328000141'},       cadastradoEm:within(2025,8,13), saldo:11890.90},
    ];
  
    // transações simples por cliente (só para demo do dashboard)
    const transacoesBase = (id)=>[
      {id:1, tipo:'CREDITO', valor:1200.00, descricao:'Depósito', data:new Date(2025,7,1,10,10).toISOString()},
      {id:2, tipo:'DEBITO',  valor: 120.50, descricao:'PIX Mercado', data:new Date(2025,7,2,14,5).toISOString()},
      {id:3, tipo:'DEBITO',  valor:  80.90, descricao:'Assinatura', data:new Date(2025,7,6,8,30).toISOString()},
    ];
  
    return {
      clientes,
      transacoes: Object.fromEntries(clientes.map(c=>[c.id, transacoesBase(c.id)])),
      gerenteCPF:'11144477735',
      clienteCPF:'00000000191',
    };
  })();
  
  // ----- Sessão -----
  function setSession(s){ localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(s)); }
  function getSession(){
    try{ return JSON.parse(localStorage.getItem(LS_KEYS.SESSION)||'null'); }catch{return null;}
  }
  function clearSession(){ localStorage.removeItem(LS_KEYS.SESSION); }
  
  // ----- Inicializações por página -----
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'login') initLogin();
    if (page === 'dashboard') initDashboard();
    if (page === 'gerente') initGerente();
  });
  
  // =================== LOGIN ===================
  function initLogin(){
    const form = document.getElementById('formLogin');
    const cpf  = document.getElementById('cpf');
    const senha= document.getElementById('senha');
    const toast= makeToast();
  
    // máscara dinâmica
    cpf.addEventListener('input', ()=> { cpf.value = maskCPF(cpf.value); });
  
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      
      const cpfDigits = onlyDigits(cpf.value);
      const pass = senha.value.trim();
  
      // Simples: dois logins
      if (cpfDigits === MOCK.gerenteCPF && pass==='admin'){
        setSession({tipo:'gerente', nome:'Macauly Lima (Gerente)', cpf:cpfDigits});
        location.href='gerente.html';
        return;
      }
      if (cpfDigits === MOCK.clienteCPF && pass==='1234'){
        setSession({tipo:'cliente', nome:'Cliente Nexus', cpf:cpfDigits, clienteId:1});
        location.href='dashboard.html';
        return;
      }
      
      toast.show('Credenciais inválidas. Dica: cliente 000.000.001-91 / 1234 ou gerente 111.444.777-35 / admin', 5000);
    });
  }
  
  // ================= DASHBOARD (CLIENTE) =================
  function initDashboard(){
    const session = getSession();
    if (!session || session.tipo!=='cliente') { location.href='login.html'; return; }
  
    // UI
    document.getElementById('nomeUser').textContent = session.nome || 'Cliente';
    document.getElementById('logoutBtn').addEventListener('click', ()=>{ clearSession(); location.href='login.html'; });
  
    // Saldo + extrato
    const cliente = MOCK.clientes.find(c=>c.id === (session.clienteId||1)) || MOCK.clientes[0];
    const txs = MOCK.transacoes[cliente.id] || [];
    updateSaldo(cliente.saldo);
    renderExtrato(txs);
  
    // Gráfico de saldo simulado
    renderSaldoChart('saldoChart', cliente);
  
    // PIX UI
    const btnPix  = document.getElementById('btnPix');
    const pixBox  = document.getElementById('pixExtra');
    const pixVal  = document.getElementById('pixValor');
    const pixKey  = document.getElementById('pixChave');
    const pixType = document.getElementById('pixTipo');
    const btnOk   = document.getElementById('btnConfirmPix');
    const help    = document.getElementById('pixHelp');
    const toast   = makeToast();
  
    btnPix.addEventListener('click', ()=>{
      pixBox.classList.toggle('hidden');
      if (!pixBox.classList.contains('hidden')) pixKey.focus();
    });
  
    // formatações por tipo
    function applyMask(){
      const t = pixType.value;
      let v = pixKey.value;
      if (t==='telefone') v = maskPhone(v);
      else if (t==='cpf') v = maskCPF(v);
      else if (t==='cnpj') v = maskCNPJ(v);
      else if (t==='aleatoria') v = maskPixRandom(v);
      pixKey.value = v;
      // dica
      const det = detectPixType(pixKey.value);
      help.textContent = det.type==='aleatoria'
        ? 'Chave aleatória: 20 a 32 dígitos.'
        : (det.hint || '');
    }
    pixType.addEventListener('change', applyMask);
    pixKey.addEventListener('input', applyMask);
  
    btnOk.addEventListener('click', ()=>{
      const valor = Number(pixVal.value);
      const key = (pixKey.value||'').trim();
      const tipoSel = pixType.value;
  
      if (!(valor>0)) return toast.show('Informe um valor válido.', 2500);
  
      // valida por tipo
      const det = detectPixType(key);
      if (tipoSel==='telefone' && det.type!=='telefone') return toast.show('Informe um telefone válido (DDD + número).', 2500);
      if (tipoSel==='cpf' && det.type!=='cpf') return toast.show('Informe um CPF válido.', 2500);
      if (tipoSel==='cnpj' && det.type!=='cnpj') return toast.show('Informe um CNPJ válido.', 2500);
      if (tipoSel==='email' && det.type!=='email') return toast.show('Informe um e-mail válido.', 2500);
      if (tipoSel==='aleatoria' && !(det.type==='aleatoria' && det.valid)) return toast.show('Chave aleatória precisa ter 20 a 32 dígitos.', 3000);
  
      // processa
      if (cliente.saldo < valor) return toast.show('Saldo insuficiente.', 2500);
      cliente.saldo = Number((cliente.saldo - valor).toFixed(2));
      updateSaldo(cliente.saldo);
  
      // adiciona extrato
      const novo = {
        id: (txs.at(-1)?.id||0)+1,
        tipo:'DEBITO',
        valor,
        descricao:`PIX para ${tipoSel.toUpperCase()}: ${det.format}`,
        data:new Date().toISOString()
      };
      txs.unshift(novo);
      renderExtrato(txs);
      toast.show('PIX enviado com sucesso (simulado).', 2500);
  
      // limpa campos
      pixVal.value=''; pixKey.value=''; pixBox.classList.add('hidden');
    });
  }
  
  function updateSaldo(v){
    document.getElementById('saldo').textContent = brl(v);
  }
  function renderExtrato(txs){
    const el = document.getElementById('extrato'); el.innerHTML='';
    if (!txs.length){
      el.innerHTML = `<div class="small">Sem movimentações ainda.</div>`;
      return;
    }
    txs.slice(0,20).forEach(t=>{
      const row = document.createElement('div');
      row.className='row';
      row.style.justifyContent='space-between';
      row.innerHTML = `
        <div>
          <div><strong>${t.tipo==='DEBITO'?'–':'+'} ${brl(t.valor)}</strong></div>
          <div class="small">${t.descricao||'-'}</div>
        </div>
        <div class="small">${new Date(t.data).toLocaleString('pt-BR')}</div>
      `;
      el.appendChild(row);
    });
  }
  function renderSaldoChart(canvasId, cliente){
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const base = [cliente.saldo*0.75, cliente.saldo*0.8, cliente.saldo*0.7, cliente.saldo*0.85, cliente.saldo*0.9, cliente.saldo*0.95, cliente.saldo];
    new Chart(ctx, {
      type:'line',
      data:{
        labels:['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Agora'],
        datasets:[{ label:'Saldo (R$)', data:base.map(v=>Number(v.toFixed(2))) }]
      },
      options:{
        responsive:true,
        scales:{ x:{ grid:{color:'#202738'}}, y:{ grid:{color:'#202738'} } },
        plugins:{ legend:{labels:{color:'#cfd5e3'}} }
      }
    });
  }
  
  // ================= GERENTE =================
  function initGerente(){
    const session = getSession();
    if (!session || session.tipo!=='gerente'){ location.href='login.html'; return; }
  
    document.getElementById('logoutBtn').addEventListener('click', ()=>{ clearSession(); location.href='login.html'; });
  
    const input = document.getElementById('filtro');
    const tbody = document.getElementById('tbodyClientes');
    const metA = document.getElementById('mTotal');
    const metB = document.getElementById('mSaldo');
    const metC = document.getElementById('mMedia');
    const metD = document.getElementById('mNovos');
  
    function maskedCPF(cpf){ const d=onlyDigits(cpf); return d.replace(/(\d{3})\d{6}(\d{2})/,'$1.***.***-$2'); }
    function maskedCNPJ(cnpj){ const d=onlyDigits(cnpj); return d.replace(/(\d{2})(\d{3})(\d{3})\d{4}(\d{2})/,'$1.$2.$3.****-$4'); }
  
    function filtrar(){
      const q = (input.value||'').toLowerCase().trim();
      const list = MOCK.clientes.filter(c=>{
        const empresa = c.empresa?.nome?.toLowerCase() || '';
        const cnpj = maskCNPJ(c.empresa?.cnpj||'');
        const cpf = maskCPF(c.cpf||'');
        return [c.nome.toLowerCase(), empresa, cnpj, cpf].some(v=>v.includes(q));
      });
      render(list);
      atualizarMetricas(list);
    }
  
    function render(list){
      tbody.innerHTML='';
      list.forEach(c=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c.nome}</td>
          <td>${c.empresa?.nome||'-'}</td>
          <td class="small">${maskedCNPJ(c.empresa?.cnpj||'')}</td>
          <td class="small">${maskedCPF(c.cpf||'')}</td>
          <td>${brl(c.saldo)}</td>
          <td class="small">${new Date(c.cadastradoEm).toLocaleDateString('pt-BR')}</td>
          <td><span class="badge ${c.saldo>1000?'ok':'muted'}">${c.saldo>1000?'Ativo':'Básico'}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  
    function atualizarMetricas(list){
      const total = list.length;
      const saldo = list.reduce((s,c)=>s+Number(c.saldo||0),0);
      const media = total? saldo/total : 0;
      const agora = new Date();
      const novos = list.filter(c=>{
        const d = new Date(c.cadastradoEm);
        const diff = (agora - d) / (1000*60*60*24);
        return diff <= 30; // últimos 30 dias
      }).length;
  
      metA.textContent = total;
      metB.textContent = brl(saldo);
      metC.textContent = brl(media);
      metD.textContent = novos;
      renderChart(list);
    }
  
    function renderChart(list){
      const ctx = document.getElementById('chartClientes');
      if (!ctx) return;
      const byMonth = {};
      list.forEach(c=>{
        const d = new Date(c.cadastradoEm);
        const k = `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        byMonth[k] = (byMonth[k]||0)+1;
      });
      const labels = Object.keys(byMonth).sort((a,b)=>{
        const [ma,ya]=a.split('/').map(Number); const [mb,yb]=b.split('/').map(Number);
        return ya===yb ? ma-mb : ya-yb;
      });
      const data = labels.map(l=>byMonth[l]);
      new Chart(ctx, {
        type:'bar',
        data:{ labels, datasets:[{ label:'Novos clientes', data }] },
        options:{
          responsive:true,
          scales:{ x:{ grid:{color:'#202738'}}, y:{ grid:{color:'#202738'}, ticks:{ precision:0 } } },
          plugins:{ legend:{labels:{color:'#cfd5e3'}} }
        }
      });
    }
  
    // primeira renderização
    render(MOCK.clientes);
    atualizarMetricas(MOCK.clientes);
    input.addEventListener('input', filtrar);
  }
  
  // ----- Toast -----
  function makeToast(){
    let el = document.querySelector('.toast');
    if (!el){ el = document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
    let t = null;
    return {
      show(msg, ms=2500){
        el.textContent = msg; el.classList.add('show');
        clearTimeout(t); t = setTimeout(()=> el.classList.remove('show'), ms);
      }
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const clientesKey = "clientesData";
    let clientes = JSON.parse(localStorage.getItem(clientesKey)) || [];
  
    // Se não houver dados, cria 10 clientes fictícios
    if (clientes.length === 0) {
      clientes = gerarClientesFicticios();
      localStorage.setItem(clientesKey, JSON.stringify(clientes));
    }
  
    // Alternar abas
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
  
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
        document.querySelector(`#tab-${btn.dataset.tab}`).classList.add("active");
      });
    });
  
    // Render tabela e métricas
    function renderClientes(filtro = "") {
      const tbody = document.getElementById("tbodyClientes");
      tbody.innerHTML = "";
      let filtrados = clientes.filter(c =>
        `${c.nome} ${c.empresa} ${c.cnpj} ${c.cpf}`.toLowerCase().includes(filtro.toLowerCase())
      );
  
      filtrados.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.nome}</td>
          <td>${c.empresa}</td>
          <td>${mascararCNPJ(c.cnpj)}</td>
          <td>${mascararCPF(c.cpf)}</td>
          <td>${c.saldo.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td>
          <td>${c.cadastrado}</td>
          <td>${c.status}</td>
        `;
        tbody.appendChild(tr);
      });
  
      atualizarMetricas(filtrados);
    }
  
    function atualizarMetricas(data) {
      document.getElementById("mTotal").textContent = data.length;
      const saldoTotal = data.reduce((sum, c) => sum + c.saldo, 0);
      document.getElementById("mSaldo").textContent = saldoTotal.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
      document.getElementById("mMedia").textContent = (saldoTotal / data.length).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
      document.getElementById("mNovos").textContent = data.filter(c => {
        const hoje = new Date();
        const dt = new Date(c.cadastrado.split("/").reverse().join("-"));
        const diff = (hoje - dt) / (1000*60*60*24);
        return diff <= 30;
      }).length;
    }
  
    // Filtro
    document.getElementById("filtro").addEventListener("input", e => {
      renderClientes(e.target.value);
    });
  
    // Cadastro
    document.getElementById("formCadastro").addEventListener("submit", e => {
      e.preventDefault();
      const nome = document.getElementById("nome").value;
      const empresa = document.getElementById("empresa").value;
      const cnpj = document.getElementById("cnpj").value;
      const cpf = document.getElementById("cpf").value;
      const saldo = parseFloat(document.getElementById("saldo").value);
      const status = document.getElementById("status").value;
  
      const login = nome.toLowerCase().split(" ")[0] + Math.floor(Math.random()*1000);
      const senha = Math.random().toString(36).slice(-8);
  
      const novo = {
        nome, empresa, cnpj, cpf, saldo, status,
        cadastrado: new Date().toLocaleDateString("pt-BR"),
        login, senha
      };
      clientes.push(novo);
      localStorage.setItem(clientesKey, JSON.stringify(clientes));
      renderClientes();
  
      const dadosLogin = document.getElementById("dadosLogin");
      dadosLogin.innerHTML = `<strong>Login:</strong> ${login} &nbsp; <strong>Senha:</strong> ${senha}`;
      dadosLogin.classList.remove("hidden");
      e.target.reset();
    });
  
    // Máscaras
    function mascararCPF(cpf) {
      return cpf.replace(/(\d{3})\d{3}(\d{3})/, "$1***$2");
    }
    function mascararCNPJ(cnpj) {
      return cnpj.replace(/(\d{2})\d{3}(\d{3})/, "$1***$2");
    }
  
    // Gráfico
    const ctx = document.getElementById("chartClientes").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jun", "Jul", "Ago"],
        datasets: [{
          label: "Novos clientes",
          data: [4, 3, 3],
          borderColor: "#0f62fe",
          backgroundColor: "rgba(15,98,254,0.3)",
          fill: true
        }]
      }
    });
  
    renderClientes();
  
    function gerarClientesFicticios() {
      return [
        {nome:"Carlos Silva",empresa:"Petrobras",cnpj:"33.000.167/0001-01",cpf:"12345678901",saldo:12000,status:"Ativo",cadastrado:"14/06/2025"},
        {nome:"Maria Souza",empresa:"Vale S.A.",cnpj:"33.592.510/0001-54",cpf:"98765432100",saldo:8400,status:"Ativo",cadastrado:"18/06/2025"},
        {nome:"João Pereira",empresa:"Ambev S.A.",cnpj:"07.526.557/0001-00",cpf:"45678912300",saldo:5600,status:"Ativo",cadastrado:"25/06/2025"},
        {nome:"Ana Costa",empresa:"Magazine Luiza",cnpj:"47.960.950/0001-21",cpf:"32165498700",saldo:7300,status:"Ativo",cadastrado:"02/07/2025"},
        {nome:"Paulo Santos",empresa:"Bradesco",cnpj:"60.746.948/0001-12",cpf:"85296374100",saldo:9100,status:"Ativo",cadastrado:"10/07/2025"},
        {nome:"Fernanda Lima",empresa:"Itaú Unibanco",cnpj:"60.701.190/0001-04",cpf:"75315945600",saldo:15000,status:"Ativo",cadastrado:"15/07/2025"},
        {nome:"Ricardo Alves",empresa:"Banco do Brasil",cnpj:"00.000.000/0001-91",cpf:"95175345600",saldo:11200,status:"Ativo",cadastrado:"20/07/2025"},
        {nome:"Juliana Dias",empresa:"B3 S.A.",cnpj:"09.346.601/0001-25",cpf:"15975348600",saldo:8700,status:"Ativo",cadastrado:"25/07/2025"},
        {nome:"Felipe Rocha",empresa:"Eletrobras",cnpj:"00.001.180/0001-92",cpf:"35715948600",saldo:6200,status:"Ativo",cadastrado:"30/07/2025"},
        {nome:"Patrícia Moraes",empresa:"Embraer",cnpj:"07.164.563/0001-68",cpf:"25845678900",saldo:9400,status:"Ativo",cadastrado:"05/08/2025"}
      ];
    }
  });
  

  
  // ----- Chatbot -----
  let chatbotCollapsed = false;
  
  // Respostas pré-definidas do chatbot
  const chatbotResponses = {
    'oi': 'Olá! Como posso ajudar você hoje?',
    'ola': 'Olá! Como posso ajudar você hoje?',
    'ajuda': 'Posso ajudar com informações sobre:\n• Login e acesso\n• Recuperação de senha\n• Suporte técnico\n• Informações gerais',
    'login': 'Para fazer login, use seu CPF e senha cadastrados. Se esqueceu sua senha, clique em "Esqueceu a senha?"',
    'senha': 'Se esqueceu sua senha, clique no link "Esqueceu a senha?" na tela de login. Uma nova senha será enviada para seu email.',
    'cpf': 'O CPF é seu documento de identificação. Use apenas os números, sem pontos ou traços.',
    'erro': 'Se estiver com problemas para acessar, verifique se seu CPF e senha estão corretos. Caso persista, entre em contato conosco.',
    'contato': 'Para suporte, você pode:\n• Usar este chat\n• Enviar email para suporte@nexuslima.com\n• Ligar para 0800-123-4567',
    'horario': 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h.',
    'default': 'Desculpe, não entendi sua pergunta. Pode reformular ou digite "ajuda" para ver as opções disponíveis.'
  };
  
  function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatbotBody = document.getElementById('chatbotBody');
    const toggle = document.querySelector('.chatbot-toggle');
    
    chatbotCollapsed = !chatbotCollapsed;
    
    if (chatbotCollapsed) {
      chatbot.classList.add('collapsed');
      toggle.textContent = '+';
    } else {
      chatbot.classList.remove('collapsed');
      toggle.textContent = '−';
    }
  }
  
  function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Adiciona mensagem do usuário
    addMessage(message, 'user');
    input.value = '';
    
    // Simula processamento
    setTimeout(() => {
      const response = getChatbotResponse(message);
      addMessage(response, 'bot');
    }, 500);
  }
  
  function addMessage(text, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll para a última mensagem
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  function getChatbotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Verifica palavras-chave nas respostas
    for (const [key, response] of Object.entries(chatbotResponses)) {
      if (lowerMessage.includes(key) && key !== 'default') {
        return response;
      }
    }
    
    return chatbotResponses.default;
  }
  
  // Permite enviar mensagem com Enter
  document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
  });
  
  // ----- Sistema de Cookies -----
  let cookiesPreferences = {
    essential: true,      // Sempre ativo
    analytics: false,     // Padrão desativado
    marketing: false,     // Padrão desativado
    preferences: false    // Padrão desativado
  };
  
  // Carrega preferências salvas
  function loadCookiesPreferences() {
    const saved = localStorage.getItem('cookiesPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        cookiesPreferences = { ...cookiesPreferences, ...parsed };
      } catch (e) {
        console.error('Erro ao carregar preferências de cookies:', e);
      }
    }
    updateCookiesUI();
  }
  
  // Atualiza a interface com as preferências atuais
  function updateCookiesUI() {
    document.getElementById('analyticsCookies').checked = cookiesPreferences.analytics;
    document.getElementById('marketingCookies').checked = cookiesPreferences.marketing;
    document.getElementById('preferenceCookies').checked = cookiesPreferences.preferences;
  }
  
  // Abre o modal de cookies
  function openCookiesModal() {
    const modal = document.getElementById('cookiesModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Carrega preferências atuais
    loadCookiesPreferences();
  }
  
  // Fecha o modal de cookies
  function closeCookiesModal() {
    const modal = document.getElementById('cookiesModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
  
  // Salva as preferências de cookies
  function saveCookiesPreferences() {
    cookiesPreferences.analytics = document.getElementById('analyticsCookies').checked;
    cookiesPreferences.marketing = document.getElementById('marketingCookies').checked;
    cookiesPreferences.preferences = document.getElementById('preferenceCookies').checked;
    
    // Salva no localStorage
    localStorage.setItem('cookiesPreferences', JSON.stringify(cookiesPreferences));
    
    // Aplica as preferências
    applyCookiesPreferences();
    
    // Fecha o modal
    closeCookiesModal();
    
    // Mostra confirmação
    showToast('Preferências de cookies salvas com sucesso!', 'success');
  }
  
  // Restaura as preferências padrão
  function resetCookiesPreferences() {
    cookiesPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    updateCookiesUI();
    
    // Salva no localStorage
    localStorage.setItem('cookiesPreferences', JSON.stringify(cookiesPreferences));
    
    // Aplica as preferências
    applyCookiesPreferences();
    
    showToast('Preferências de cookies restauradas ao padrão!', 'info');
  }
  
  // Aplica as preferências de cookies
  function applyCookiesPreferences() {
    // Cookies essenciais sempre ativos
    if (cookiesPreferences.essential) {
      // Implementar lógica para cookies essenciais
      console.log('Cookies essenciais ativos');
    }
    
    // Cookies de analytics
    if (cookiesPreferences.analytics) {
      // Implementar Google Analytics, etc.
      console.log('Cookies de analytics ativos');
    } else {
      // Desativar analytics
      console.log('Cookies de analytics desativados');
    }
    
    // Cookies de marketing
    if (cookiesPreferences.marketing) {
      // Implementar pixels de rastreamento, etc.
      console.log('Cookies de marketing ativos');
    } else {
      // Desativar marketing
      console.log('Cookies de marketing desativados');
    }
    
    // Cookies de preferências
    if (cookiesPreferences.preferences) {
      // Salvar preferências do usuário
      console.log('Cookies de preferências ativos');
    } else {
      // Limpar preferências salvas
      console.log('Cookies de preferências desativados');
    }
  }
  
  // Fecha o modal ao clicar fora dele
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('cookiesModal');
    if (e.target === modal) {
      closeCookiesModal();
    }
  });
  
  // Fecha o modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCookiesModal();
    }
  });
  
  // Carrega preferências ao inicializar
  document.addEventListener('DOMContentLoaded', () => {
    loadCookiesPreferences();
    applyCookiesPreferences();
    
    // Inicializa funcionalidades do modal de ajuda
    initHelpSearch();
    initHelpModalEvents();
    
      // Inicializa funcionalidades do modal de adicionar dinheiro
  initAddMoneyModalEvents();
  
  // Inicializa funcionalidades do chatbot do gerente
  initManagerChatbot();
  
  // Inicializa formatação de moeda
  initCurrencyFormatting();
  });
  
  // Modal de Ajuda
  function openHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Foca no campo de pesquisa
    setTimeout(() => {
      const searchInput = document.getElementById('helpSearch');
      if (searchInput) searchInput.focus();
    }, 300);
  }
  
  function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Fecha todas as respostas abertas
    const activeItems = document.querySelectorAll('.help-item.active');
    activeItems.forEach(item => item.classList.remove('active'));
  }
  
  function toggleHelpAnswer(id) {
    const item = document.getElementById(id).parentElement;
    const isActive = item.classList.contains('active');
    
    // Fecha todas as outras respostas
    const allItems = document.querySelectorAll('.help-item');
    allItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
      }
    });
    
    // Alterna o item atual
    item.classList.toggle('active');
  }
  
  // Pesquisa no modal de ajuda
  function initHelpSearch() {
    const searchInput = document.getElementById('helpSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const helpItems = document.querySelectorAll('.help-item');
      
      helpItems.forEach(item => {
        const question = item.querySelector('.help-question span').textContent.toLowerCase();
        const answer = item.querySelector('.help-answer p').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.style.display = 'block';
          // Destaca o termo encontrado
          if (searchTerm.length > 2) {
            highlightText(item, searchTerm);
          }
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
  
  function highlightText(element, term) {
    const question = element.querySelector('.help-question span');
    const answer = element.querySelector('.help-answer p');
    
    if (question && answer) {
      question.innerHTML = question.textContent.replace(
        new RegExp(term, 'gi'),
        match => `<mark style="background: rgba(142, 91, 255, 0.3); color: inherit; padding: 2px 4px; border-radius: 4px;">${match}</mark>`
      );
      
      answer.innerHTML = answer.textContent.replace(
        new RegExp(term, 'gi'),
        match => `<mark style="background: rgba(142, 91, 255, 0.3); color: inherit; padding: 2px 4px; border-radius: 4px;">${match}</mark>`
      );
    }
  }
  
  // Fechar modal ao clicar fora ou pressionar ESC
  function initHelpModalEvents() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeHelpModal();
      }
    });
    
    // Fechar ao pressionar ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeHelpModal();
      }
    });
  }
  
  // Modal para Adicionar Dinheiro
  function openAddMoneyModal() {
    const modal = document.getElementById('addMoneyModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Reset das seleções
    document.querySelectorAll('.payment-method').forEach(method => {
      method.classList.remove('selected');
    });
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.checked = false;
    });
    document.getElementById('addMoneyAmount').value = '';
    document.getElementById('addMoneyDescription').value = '';
  }
  
  function closeAddMoneyModal() {
    const modal = document.getElementById('addMoneyModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
  
  function selectPaymentMethod(method) {
    // Remove seleção anterior
    document.querySelectorAll('.payment-method').forEach(m => {
      m.classList.remove('selected');
    });
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.checked = false;
    });
    
    // Seleciona o método escolhido
    const selectedMethod = document.querySelector(`[onclick="selectPaymentMethod('${method}')"]`);
    selectedMethod.classList.add('selected');
    document.getElementById(`${method}Radio`).checked = true;
  }
  
  function processAddMoney() {
    const amount = document.getElementById('addMoneyAmount').value;
    const description = document.getElementById('addMoneyDescription').value;
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!amount || amount <= 0) {
      alert('Por favor, informe um valor válido.');
      return;
    }
    
    if (!selectedMethod) {
      alert('Por favor, selecione um método de pagamento.');
      return;
    }
    
    const method = selectedMethod.value;
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    if (method === 'pix') {
      // Simula geração de QR Code PIX
      alert(`QR Code PIX gerado para R$ ${formattedAmount}\n\nEscaneie com seu app bancário para completar o pagamento.`);
    } else if (method === 'boleto') {
      // Simula geração de boleto
      alert(`Boleto bancário gerado para R$ ${formattedAmount}\n\nCódigo: 12345.67890.12345.678901\nVencimento: ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}`);
    }
    
    closeAddMoneyModal();
  }
  
  // Chatbot para Desenvolvedores
  function toggleDevChatbot() {
    const chatbot = document.getElementById('devChatbot');
    chatbot.classList.toggle('collapsed');
  }
  
  let selectedSpecialist = null;
  let specialistName = '';
  
  function selectSpecialist(specialist) {
    selectedSpecialist = specialist;
    
    // Define o nome do especialista
    const specialists = {
      'macauly': 'Macauly Lima (Segurança de Dados)',
      'armando': 'Armando Oliveira (Back-end)',
      'felipe': 'Felipe Amorim (Front-end)'
    };
    
    specialistName = specialists[specialist];
    
    // Limpa as mensagens e mostra a seleção
    const messages = document.getElementById('devChatMessages');
    messages.innerHTML = `
      <div class="message bot">
        <div class="message-content">
          Você está conversando com <strong>${specialistName}</strong>
        </div>
      </div>
      <div class="message bot">
        <div class="message-content">
          Como posso ajudá-lo hoje?
        </div>
      </div>
    `;
    
    // Mostra o campo de input
    document.getElementById('devChatInput').style.display = 'flex';
    
    // Adiciona evento para Enter
    document.getElementById('devMessageInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendDevMessage();
      }
    });
    
    // Foca no input
    document.getElementById('devMessageInput').focus();
  }
  
  function sendDevMessage() {
    const input = document.getElementById('devMessageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messages = document.getElementById('devChatMessages');
    
    // Adiciona mensagem do usuário
    messages.innerHTML += `
      <div class="message user">
        <div class="message-content">
          ${message}
        </div>
      </div>
    `;
    
    // Limpa o input
    input.value = '';
    
    // Simula resposta automática
    setTimeout(() => {
      messages.innerHTML += `
        <div class="message bot">
          <div class="message-content">
            Sua mensagem foi enviada para ${specialistName}. 
            <br><br>
            <strong>Status:</strong> Aguardando resposta...
            <br><br>
            <small>Você será notificado quando o especialista responder.</small>
          </div>
        </div>
      `;
      
      // Scroll para baixo
      messages.scrollTop = messages.scrollHeight;
      
      // Envia notificação para a página do gerente (simulação)
      sendNotificationToManager(specialistName, message);
      
    }, 1000);
    
    // Scroll para baixo
    messages.scrollTop = messages.scrollHeight;
  }
  
  function sendNotificationToManager(specialist, message) {
    // Simula envio de notificação para a página do gerente
    const notification = {
      type: 'dev_support_request',
      specialist: specialist,
      client: document.getElementById('nomeUser')?.textContent || 'Cliente',
      message: message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Salva no localStorage para simular comunicação entre páginas
    const notifications = JSON.parse(localStorage.getItem('devNotifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('devNotifications', JSON.stringify(JSON.stringify(notifications)));
    
    console.log('Notificação enviada para o gerente:', notification);
    
    // Mostra toast de confirmação
    if (typeof showToast === 'function') {
      showToast(`Solicitação enviada para ${specialist}!`, 'success');
    } else {
      alert(`Solicitação enviada para ${specialist}!`);
    }
  }
  
  // Inicializa eventos do modal de adicionar dinheiro
  function initAddMoneyModalEvents() {
    const modal = document.getElementById('addMoneyModal');
    if (!modal) return;
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeAddMoneyModal();
      }
    });
    
    // Fechar ao pressionar ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeAddMoneyModal();
      }
    });
  }
  
  // Chatbot para Gerente
  function toggleManagerChatbot() {
    const chatbot = document.getElementById('managerChatbot');
    chatbot.classList.toggle('collapsed');
  }
  
  function initManagerChatbot() {
    // Verifica se estamos na página do gerente
    if (document.body.getAttribute('data-page') !== 'gerente') return;
    
    // Carrega solicitações existentes
    carregarSolicitacoes();
    
    // Verifica novas solicitações a cada 5 segundos
    setInterval(verificarNovasSolicitacoes, 5000);
  }
  
  function carregarSolicitacoes() {
    const container = document.getElementById('requestsContainer');
    if (!container) return;
    
    try {
      const notifications = JSON.parse(localStorage.getItem('devNotifications') || '[]');
      const parsedNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];
      
      if (parsedNotifications.length === 0) {
        container.innerHTML = '<div class="message bot"><div class="message-content">Nenhuma solicitação pendente.</div></div>';
        return;
      }
      
      container.innerHTML = '';
      parsedNotifications.forEach((notification, index) => {
        if (notification.status === 'pending') {
          const requestItem = criarItemSolicitacao(notification, index);
          container.appendChild(requestItem);
        }
      });
      
      // Atualiza badge
      atualizarBadgeSolicitacoes(parsedNotifications.filter(n => n.status === 'pending').length);
      
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      container.innerHTML = '<div class="message bot"><div class="message-content">Erro ao carregar solicitações.</div></div>';
    }
  }
  
  function criarItemSolicitacao(notification, index) {
    const div = document.createElement('div');
    div.className = 'request-item';
    
    const timeAgo = calcularTempoAtrasado(notification.timestamp);
    
    // Verifica se já foi respondida
    const isResponded = notification.status === 'responded';
    const hasResponse = notification.response;
    
    div.innerHTML = `
      <div class="request-header">
        <span class="request-specialist">${notification.specialist}</span>
        <span class="request-time">${timeAgo}</span>
      </div>
      <div class="request-client">Cliente: ${notification.client}</div>
      <div class="request-message">${notification.message}</div>
      ${hasResponse ? `
        <div class="request-response">
          <div class="response-label">📤 Sua resposta:</div>
          <div class="response-content">${notification.response.message}</div>
          <div class="response-time">${calcularTempoAtrasado(notification.response.timestamp)}</div>
        </div>
      ` : ''}
      <div class="request-actions">
        ${!isResponded ? `
          <button class="request-btn respond" onclick="responderSolicitacao(${index})">
            Responder
          </button>
        ` : `
          <button class="request-btn respond" onclick="responderSolicitacao(${index})" style="opacity: 0.6; cursor: not-allowed;" disabled>
            Respondido
          </button>
        `}
        <button class="request-btn close" onclick="fecharSolicitacao(${index})">
          Fechar
        </button>
      </div>
    `;
    
    return div;
  }
  
  function calcularTempoAtrasado(timestamp) {
    const agora = new Date();
    const dataNotificacao = new Date(timestamp);
    const diffMs = agora - dataNotificacao;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHrs < 24) return `${diffHrs}h atrás`;
    return `${Math.floor(diffHrs / 24)}d atrás`;
  }
  
  function atualizarBadgeSolicitacoes(count) {
    const badge = document.getElementById('requestBadge');
    if (!badge) return;
    
    if (count > 0) {
      badge.style.display = 'flex';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  }
  
  function responderSolicitacao(index) {
    try {
      const notifications = JSON.parse(localStorage.getItem('devNotifications') || '[]');
      const parsedNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];
      
      if (parsedNotifications[index]) {
        const notification = parsedNotifications[index];
        
        // Mostra o campo de resposta
        const responseInput = document.getElementById('managerResponseInput');
        const respondingTo = document.getElementById('respondingTo');
        const responseText = document.getElementById('managerResponseText');
        
        // Atualiza o texto de quem está respondendo
        respondingTo.textContent = `Respondendo para: ${notification.client} (${notification.specialist})`;
        
        // Limpa o campo de resposta
        responseText.value = '';
        
        // Mostra o campo de resposta
        responseInput.style.display = 'block';
        
        // Foca no campo de texto
        responseText.focus();
        
        // Armazena o índice da solicitação para envio
        responseInput.setAttribute('data-request-index', index);
        
        // Esconde o campo de resposta após um tempo se não houver interação
        setTimeout(() => {
          if (responseText.value === '') {
            closeResponseInput();
          }
        }, 30000); // 30 segundos
      }
    } catch (error) {
      console.error('Erro ao responder solicitação:', error);
    }
  }
  
  function closeResponseInput() {
    const responseInput = document.getElementById('managerResponseInput');
    responseInput.style.display = 'none';
    
    // Limpa o campo de texto
    const responseText = document.getElementById('managerResponseText');
    responseText.value = '';
    
    // Remove o índice da solicitação
    responseInput.removeAttribute('data-request-index');
  }
  
  function sendManagerResponse() {
    try {
      const responseInput = document.getElementById('managerResponseInput');
      const responseText = document.getElementById('managerResponseText');
      const requestIndex = responseInput.getAttribute('data-request-index');
      
      if (!requestIndex || !responseText.value.trim()) {
        alert('Por favor, digite uma resposta.');
        return;
      }
      
      const notifications = JSON.parse(localStorage.getItem('devNotifications') || '[]');
      const parsedNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];
      
      if (parsedNotifications[requestIndex]) {
        const notification = parsedNotifications[requestIndex];
        
        // Adiciona a resposta à notificação
        parsedNotifications[requestIndex].response = {
          message: responseText.value.trim(),
          timestamp: new Date().toISOString(),
          manager: 'Gerente Nexus Lima'
        };
        
        // Marca como respondida
        parsedNotifications[requestIndex].status = 'responded';
        
        // Salva no localStorage
        localStorage.setItem('devNotifications', JSON.stringify(JSON.stringify(parsedNotifications)));
        
        // Mostra confirmação
        alert(`Resposta enviada com sucesso para ${notification.client}!\n\nResposta: ${responseText.value.trim()}`);
        
        // Fecha o campo de resposta
        closeResponseInput();
        
        // Recarrega as solicitações
        carregarSolicitacoes();
        
        // Simula envio da resposta para o cliente (via localStorage)
        enviarRespostaParaCliente(notification, responseText.value.trim());
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      alert('Erro ao enviar resposta. Tente novamente.');
    }
  }
  
  function enviarRespostaParaCliente(notification, response) {
    // Simula envio da resposta para o cliente
    const clientResponse = {
      type: 'manager_response',
      specialist: notification.specialist,
      client: notification.client,
      originalMessage: notification.message,
      response: response,
      timestamp: new Date().toISOString(),
      manager: 'Gerente Nexus Lima'
    };
    
    // Salva a resposta para o cliente
    const clientResponses = JSON.parse(localStorage.getItem('clientResponses') || '[]');
    clientResponses.push(clientResponse);
    localStorage.setItem('clientResponses', JSON.stringify(clientResponses));
    
    console.log('Resposta enviada para o cliente:', clientResponse);
  }
  
  // Formatação de moeda brasileira
  function formatarMoeda(valor) {
    if (typeof valor === 'string') {
      valor = parseFloat(valor);
    }
    
    if (isNaN(valor)) {
      return 'R$ 0,00';
    }
    
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  function initCurrencyFormatting() {
    // Aplica formatação de moeda em todos os elementos que mostram valores
    const elementosMoeda = document.querySelectorAll('[id*="saldo"], [id*="valor"], [id*="receita"], [id*="media"]');
    
    elementosMoeda.forEach(elemento => {
      if (elemento.textContent.includes('R$')) {
        const valorAtual = elemento.textContent;
        if (valorAtual !== 'R$ 0,00') {
          // Extrai o valor numérico e reformata
          const valorNumerico = parseFloat(valorAtual.replace(/[^\d,.-]/g, '').replace(',', '.'));
          if (!isNaN(valorNumerico)) {
            elemento.textContent = formatarMoeda(valorNumerico);
          }
        }
      }
    });
    
    // Aplica formatação em inputs de valor
    const inputsValor = document.querySelectorAll('input[type="number"][placeholder*="R$"], input[type="number"][placeholder*="Valor"]');
    inputsValor.forEach(input => {
      input.addEventListener('blur', function() {
        if (this.value && !isNaN(this.value)) {
          this.placeholder = formatarMoeda(parseFloat(this.value));
        }
      });
    });
  }
  function fecharSolicitacao(index) {
    try {
      const notifications = JSON.parse(localStorage.getItem('devNotifications') || '[]');
      const parsedNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];
      
      if (parsedNotifications[index]) {
        // Remove a solicitação
        parsedNotifications.splice(index, 1);
        localStorage.setItem('devNotifications', JSON.stringify(JSON.stringify(parsedNotifications)));
        
        // Recarrega solicitações
        carregarSolicitacoes();
      }
    } catch (error) {
      console.error('Erro ao fechar solicitação:', error);
    }
  }
  
  function verificarNovasSolicitacoes() {
    // Verifica se há novas solicitações
    try {
      const notifications = JSON.parse(localStorage.getItem('devNotifications') || '[]');
      const parsedNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];
      const pendingCount = parsedNotifications.filter(n => n.status === 'pending').length;
      
      if (pendingCount > 0) {
        // Atualiza badge
        atualizarBadgeSolicitacoes(pendingCount);
        
        // Se o chatbot estiver fechado, mostra notificação
        const chatbot = document.getElementById('managerChatbot');
        if (chatbot && chatbot.classList.contains('collapsed')) {
          // Pode adicionar uma notificação visual aqui
          console.log(`${pendingCount} nova(s) solicitação(ões) recebida(s)`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar novas solicitações:', error);
    }
  }
  