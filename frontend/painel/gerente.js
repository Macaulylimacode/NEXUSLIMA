document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('usuario') !== 'Gerente') {
    alert('Acesso restrito.');
    window.location.href = 'login.html';
  }

  const clientes = [
    { nome: "Carlos Souza", empresa: "Petrobras S.A.", cnpj: "33.000.167/0001-01", cpf: "12345678901", data: "2025-06-15", saldo: 15000.75 },
    { nome: "Ana Lima", empresa: "Vale S.A.", cnpj: "33.592.510/0001-54", cpf: "98765432100", data: "2025-06-25", saldo: 8420.00 },
    { nome: "João Silva", empresa: "Magazine Luiza S.A.", cnpj: "47.960.950/0001-21", cpf: "45678912399", data: "2025-07-01", saldo: 5200.50 },
    { nome: "Mariana Costa", empresa: "Banco do Brasil S.A.", cnpj: "00.000.000/0001-91", cpf: "32165498777", data: "2025-07-10", saldo: 9800.00 },
    { nome: "Lucas Martins", empresa: "Itaú Unibanco S.A.", cnpj: "60.701.190/0001-04", cpf: "65432198788", data: "2025-07-20", saldo: 4320.99 },
    { nome: "Fernanda Souza", empresa: "Ambev S.A.", cnpj: "07.526.557/0001-00", cpf: "74185296355", data: "2025-07-25", saldo: 12000.00 },
    { nome: "Ricardo Pereira", empresa: "Eletrobras S.A.", cnpj: "00.001.180/0001-26", cpf: "85296374166", data: "2025-08-01", saldo: 25000.00 },
    { nome: "Paula Andrade", empresa: "Embraer S.A.", cnpj: "07.164.811/0001-05", cpf: "96325874144", data: "2025-08-05", saldo: 3200.40 },
    { nome: "Gabriel Rocha", empresa: "Gerdau S.A.", cnpj: "33.611.500/0001-19", cpf: "14725836922", data: "2025-08-08", saldo: 7450.70 },
    { nome: "Juliana Alves", empresa: "Lojas Renner S.A.", cnpj: "92.754.738/0001-62", cpf: "25836914733", data: "2025-08-10", saldo: 8650.90 }
  ];

  function mascararCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4");
  }

  function carregarClientes(lista) {
    const tbody = document.querySelector("#tabelaClientes tbody");
    tbody.innerHTML = "";
    lista.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.empresa}</td>
        <td>${c.cnpj}</td>
        <td>${mascararCPF(c.cpf)}</td>
        <td>${new Date(c.data).toLocaleDateString("pt-BR")}</td>
        <td>${c.saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      `;
      tbody.appendChild(tr);
    });
    atualizarMetricas(lista);
  }

  function atualizarMetricas(lista) {
    const totalClientes = lista.length;
    const totalSaldo = lista.reduce((acc, c) => acc + c.saldo, 0);
    document.getElementById("metricas").innerHTML = `
      <li>Total de clientes: ${totalClientes}</li>
      <li>Saldo total: ${totalSaldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</li>
    `;
  }

  document.getElementById("filtro").addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = clientes.filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      c.empresa.toLowerCase().includes(termo) ||
      c.cnpj.includes(termo)
    );
    carregarClientes(filtrados);
  });

  carregarClientes(clientes);
});

function logout() {
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}
