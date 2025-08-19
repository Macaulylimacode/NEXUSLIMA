import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, ensureSchema } from './db.js';
import express from 'express';
import cadastroRoutes from './routes/cadastro.js';


app.use(express.json());

app.use(cadastroRoutes);

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// middlewares
app.use(helmet());
app.use(cors({
  origin: true, // para dev
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// cria schema
await ensureSchema();

// helpers
function gerarNumeroConta(idUsuario) {
  return String(1000000 + Number(idUsuario));
}

// auth
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, tipo_usuario }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
function requireGerente(req, res, next) {
  if (req.user?.tipo_usuario !== 'gerente')
    return res.status(403).json({ error: 'Acesso negado' });
  next();
}

/* =====================  AUTENTICAÇÃO  ===================== */

async function handleRegister(req, res) {
  const { nome, cpf, data_nascimento, senha } = req.body || {};
  if (!nome || !cpf || !data_nascimento || !senha) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, cpf, data_nascimento, senha' });
  }
  const conn = await db();
  try {
    const [dup] = await conn.execute('SELECT id FROM usuarios WHERE cpf = ?', [cpf]);
    if (dup.length) return res.status(409).json({ error: 'CPF já cadastrado' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const [ins] = await conn.execute(
      'INSERT INTO usuarios (nome, cpf, data_nascimento, senha_hash, tipo_usuario) VALUES (?,?,?,?,?)',
      [nome, cpf, data_nascimento, senha_hash, 'cliente']
    );
    const userId = ins.insertId;

    const numero = gerarNumeroConta(userId);
    await conn.execute(
      'INSERT INTO contas (usuario_id, agencia, numero, saldo) VALUES (?,?,?,?)',
      [userId, '0001', numero, 0]
    );

    // cria um projeto de exemplo
    await conn.execute(
      'INSERT INTO projetos (usuario_id, titulo, status) VALUES (?,?,?)',
      [userId, 'Onboarding', 'em_andamento']
    );

    return res.json({ message: 'Cadastro realizado', usuario_id: userId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao cadastrar' });
  } finally {
    await conn.end();
  }
}

// rotas de cadastro (inclui /api/cadastrar aceitando nome_completo)
app.post('/api/register', handleRegister);
app.post('/auth/register', handleRegister);
app.post('/api/cadastrar', (req, res) => {
  const { nome_completo } = req.body || {};
  req.body.nome = nome_completo;
  return handleRegister(req, res);
});

async function handleLogin(req, res) {
  const { cpf, senha } = req.body || {};
  if (!cpf || !senha) return res.status(400).json({ message: 'CPF e senha são obrigatórios' });

  const conn = await db();
  try {
    const [rows] = await conn.execute('SELECT * FROM usuarios WHERE cpf = ?', [cpf]);
    if (!rows.length) return res.status(401).json({ message: 'Credenciais inválidas' });

    const user = rows[0];
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user.id, tipo_usuario: user.tipo_usuario, nome: user.nome }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, tipo_usuario: user.tipo_usuario, nome: user.nome });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Erro ao autenticar' });
  } finally {
    await conn.end();
  }
}
app.post('/api/login', handleLogin);
app.post('/auth/login', handleLogin);

// recuperação de senha (demo: gera token e retorna no response)
app.post('/api/forgot', async (req, res) => {
  const { cpf } = req.body || {};
  if (!cpf) return res.status(400).json({ error: 'CPF é obrigatório' });

  const conn = await db();
  try {
    const [u] = await conn.execute('SELECT id FROM usuarios WHERE cpf=?', [cpf]);
    if (!u.length) return res.json({ message: 'Se CPF existir, enviaremos instruções.' });

    const token = Math.random().toString(36).slice(2, 10);
    await conn.execute(
      'REPLACE INTO password_resets (usuario_id, token, expira_em) VALUES (?,?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
      [u[0].id, token]
    );
    // Em produção você enviaria este token por e-mail/SMS.
    return res.json({ message: 'Token gerado', token_demo: token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao gerar token' });
  } finally {
    await conn.end();
  }
});

app.post('/api/reset', async (req, res) => {
  const { token, nova_senha } = req.body || {};
  if (!token || !nova_senha) return res.status(400).json({ error: 'Token e nova_senha são obrigatórios' });

  const conn = await db();
  try {
    const [r] = await conn.execute(
      'SELECT usuario_id FROM password_resets WHERE token=? AND expira_em > NOW()',
      [token]
    );
    if (!r.length) return res.status(400).json({ error: 'Token inválido/expirado' });

    const senha_hash = await bcrypt.hash(nova_senha, 10);
    await conn.execute('UPDATE usuarios SET senha_hash=? WHERE id=?', [senha_hash, r[0].usuario_id]);
    await conn.execute('DELETE FROM password_resets WHERE token=?', [token]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  } finally {
    await conn.end();
  }
});

/* =====================  ÁREA DO CLIENTE  ===================== */

app.get('/api/saldo', auth, async (req, res) => {
  const conn = await db();
  try {
    const [rows] = await conn.execute('SELECT saldo FROM contas WHERE usuario_id=? LIMIT 1', [req.user.id]);
    const saldo = rows[0]?.saldo ?? 0;
    res.json({ saldo: Number(saldo) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar saldo' });
  } finally { await conn.end(); }
});

app.get('/api/extrato', auth, async (req, res) => {
  const conn = await db();
  try {
    const [conta] = await conn.execute('SELECT id FROM contas WHERE usuario_id=?', [req.user.id]);
    const contaId = conta[0]?.id;
    if (!contaId) return res.json({ transacoes: [] });
    const [txs] = await conn.execute(
      `SELECT id, tipo, valor, descricao, criado_em AS data
       FROM transacoes WHERE conta_id=? ORDER BY id DESC LIMIT 50`, [contaId]
    );
    res.json({ transacoes: txs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar extrato' });
  } finally { await conn.end(); }
});

// PIX/transferência mock (débito próprio + crédito próprio “PIX Recebido” só para demo)
app.post('/api/pix', auth, async (req, res) => {
  const { valor, descricao } = req.body || {};
  const val = Number(valor);
  if (!(val > 0)) return res.status(400).json({ error: 'Valor inválido' });

  const conn = await db();
  try {
    await conn.beginTransaction();
    const [conta] = await conn.execute('SELECT id,saldo FROM contas WHERE usuario_id=? FOR UPDATE', [req.user.id]);
    if (!conta.length) throw new Error('Conta não encontrada');
    if (Number(conta[0].saldo) < val) { await conn.rollback(); return res.status(400).json({ error: 'Saldo insuficiente' }); }

    // débito (saída)
    await conn.execute('UPDATE contas SET saldo=saldo-? WHERE id=?', [val, conta[0].id]);
    await conn.execute('INSERT INTO transacoes (conta_id,tipo,valor,descricao) VALUES (?,?,?,?)',
      [conta[0].id,'DEBITO',val, descricao || 'PIX Enviado']);

    // crédito (entrada mock, só para ter movimento)
    await conn.execute('UPDATE contas SET saldo=saldo+? WHERE id=?', [val, conta[0].id]);
    await conn.execute('INSERT INTO transacoes (conta_id,tipo,valor,descricao) VALUES (?,?,?,?)',
      [conta[0].id,'CREDITO',val, 'PIX Recebido (simulação)']);

    await conn.commit();
    res.json({ ok:true });
  } catch (e) {
    console.error(e);
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'Erro no PIX' });
  } finally { await conn.end(); }
});

// projetos do usuário
app.get('/api/projetos', auth, async (req, res) => {
  const conn = await db();
  try {
    const [rows] = await conn.execute('SELECT id,titulo,status,criado_em FROM projetos WHERE usuario_id=? ORDER BY id DESC', [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  } finally { await conn.end(); }
});

/* =====================  GERENTE  ===================== */

app.get('/api/gerente/clientes', auth, requireGerente, async (req, res) => {
  const conn = await db();
  try {
    const [rows] = await conn.execute(`
      SELECT u.id, u.nome, u.cpf, u.tipo_usuario,
             c.numero AS conta, c.agencia, c.saldo
      FROM usuarios u JOIN contas c ON c.usuario_id = u.id
      ORDER BY u.id DESC`);
    const masked = rows.map(r => ({ ...r, cpf: r.cpf?.replace(/^(\d{3})\d{6}(\d{2})$/, '$1***.***-$2') }));
    res.json(masked);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  } finally { await conn.end(); }
});

app.get('/api/gerente/metricas', auth, requireGerente, async (req, res) => {
  const conn = await db();
  try {
    const [[{ total_usuarios }]] = await conn.query('SELECT COUNT(*) AS total_usuarios FROM usuarios');
    const [[{ total_contratos }]] = await conn.query('SELECT COUNT(*) AS total_contratos FROM projetos');
    const [[{ total_transacoes }]] = await conn.query('SELECT COUNT(*) AS total_transacoes FROM transacoes');
    res.json({ total_usuarios, total_contratos, total_transacoes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  } finally { await conn.end(); }
});

/* =====================  CHATBOT LOGS  ===================== */
app.post('/api/chatlogs', async (req, res) => {
  const { usuario_id, pergunta, resposta } = req.body || {};
  if (!pergunta || !resposta) return res.status(400).json({ erro: 'pergunta e resposta são obrigatórias' });

  const conn = await db();
  try {
    await conn.execute('INSERT INTO chat_logs (usuario_id, pergunta, resposta) VALUES (?,?,?)',
      [usuario_id || null, pergunta, resposta]);
    res.json({ sucesso: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao salvar log' });
  } finally { await conn.end(); }
});

app.get('/api/chatlogs', auth, requireGerente, async (_req, res) => {
  const conn = await db();
  try {
    const [rows] = await conn.execute('SELECT id,usuario_id,pergunta,resposta,data_hora FROM chat_logs ORDER BY id DESC LIMIT 500');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao buscar logs' });
  } finally { await conn.end(); }
});

/* =====================  HEALTH + FRONTEND  ===================== */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// servir frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA-friendly: redireciona root para index.html
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, () => console.log(`ML Digital rodando em http://localhost:${PORT}`));