// Usuários simulados
const usuarios = [
    { usuario: "cliente", senha: "1234", tipo: "cliente" },
    { usuario: "gerente", senha: "admin", tipo: "gerente" }
  ];
  
  // Login
  document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("error");
  
    const found = usuarios.find(u => u.usuario === user && u.senha === pass);
  
    if (found) {
      localStorage.setItem("tipo_usuario", found.tipo);
      if (found.tipo === "cliente") {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "gerente.html";
      }
    } else {
      errorEl.textContent = "Usuário ou senha inválidos.";
    }
  });
  
  // Chatbot básico
  const chatBody = document.getElementById("chatBody");
  const chatMessage = document.getElementById("chatMessage");
  const sendBtn = document.getElementById("sendBtn");
  
  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.classList.add("chat-message");
    div.textContent = (sender === "bot" ? "🤖 " : "Você: ") + text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  
  sendBtn.addEventListener("click", () => {
    const msg = chatMessage.value.trim();
    if (!msg) return;
    addMessage(msg, "user");
    chatMessage.value = "";
  
    setTimeout(() => {
      if (msg.toLowerCase().includes("login")) {
        addMessage("Para acessar, use seu usuário e senha fornecidos.", "bot");
      } else if (msg.toLowerCase().includes("suporte")) {
        addMessage("Nosso suporte está disponível 24h pelo e-mail suporte@nexuslima.com", "bot");
      } else {
        addMessage("Não entendi, poderia repetir?", "bot");
      }
    }, 500);
  });
  