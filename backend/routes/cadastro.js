
import express from 'express';
import bcrypt from 'bcrypt';
const router = express.Router();

// --- Função para validar CPF ---
function validarCPF(cpf) {
  const num = cpf.replace(/\D/g, '');
  if (num.length !== 11 || /^(\d)\1+$/.test(num)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(num.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  if (resto >= 10) resto = 0;
  if (resto !== parseInt(num.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(num.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  if (resto >= 10) resto = 0;
  return resto === parseInt(num.charAt(10));
}

// --- Função para validar maioridade ---
function isMaiorDeIdade(dataStr) {
  const hoje = new Date();
  const nasc = new Date(dataStr);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade >= 18;
}

// --- Rota de Cadastro ---
router.post('/api/cadastrar', async (req, res) => {
  const { nome_completo, cpf, data_nascimento, senha } = req.body;

  // 1️⃣ Campos obrigatórios
  if (!nome_completo || !cpf || !data_nascimento || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  // 2️⃣ Valida CPF
  if (!validarCPF(cpf)) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  // 3️⃣ Valida maioridade
  if (!isMaiorDeIdade(data_nascimento)) {
    return res.status(400).json({ error: 'É necessário ter 18 anos ou mais para se cadastrar' });
  }

  try {
    // 4️⃣ Verifica duplicidade
    const jaExiste = await db('usuarios').where({ cpf }).first();
    if (jaExiste) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // 5️⃣ Gera hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // 6️⃣ Salva no banco
    await db('usuarios').insert({
      nome_completo,
      cpf,
      data_nascimento,
      senha: senhaHash
    });

    // 7️⃣ Retorna sucesso
    return res.status(201).json({ message: 'Cadastro realizado com sucesso' });

  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
