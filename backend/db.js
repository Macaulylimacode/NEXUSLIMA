import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export async function db() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'ml_digital',
    multipleStatements: true
  });
  return conn;
}

export async function ensureSchema() {
  const conn = await db();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        cpf VARCHAR(14) NOT NULL UNIQUE,
        data_nascimento DATE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        tipo_usuario ENUM('cliente','gerente') NOT NULL DEFAULT 'cliente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS contas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        agencia VARCHAR(10) NOT NULL,
        numero VARCHAR(20) NOT NULL UNIQUE,
        saldo DECIMAL(12,2) NOT NULL DEFAULT 0,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS transacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conta_id INT NOT NULL,
        tipo ENUM('DEBITO','CREDITO') NOT NULL,
        valor DECIMAL(12,2) NOT NULL,
        descricao VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conta_id) REFERENCES contas(id)
      );
      CREATE TABLE IF NOT EXISTS projetos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        titulo VARCHAR(120) NOT NULL,
        status ENUM('em_andamento','concluido','pendente') NOT NULL DEFAULT 'em_andamento',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS chat_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NULL,
        pergunta TEXT NOT NULL,
        resposta TEXT NOT NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS password_resets (
        usuario_id INT PRIMARY KEY,
        token VARCHAR(50) NOT NULL UNIQUE,
        expira_em DATETIME NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    // cria um gerente default se não houver
    const [g] = await conn.query("SELECT id FROM usuarios WHERE tipo_usuario='gerente' LIMIT 1");
    if (!g.length) {
      const senha_hash = await (await import('bcryptjs')).default.hash('admin123', 10);
      const [ins] = await conn.execute(
        "INSERT INTO usuarios (nome,cpf,data_nascimento,senha_hash,tipo_usuario) VALUES (?,?,?,?,?)",
        ['Macauly Lima','000.000.000-00','1990-01-01',senha_hash,'gerente']
      );
      const numero = String(1000000 + Number(ins.insertId));
      await conn.execute("INSERT INTO contas (usuario_id,agencia,numero,saldo) VALUES (?,?,?,?)",
        [ins.insertId,'0001',numero,0]);
    }
  } finally {
    await conn.end();
  }
}