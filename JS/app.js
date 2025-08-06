// Alterna entre telas de cadastro e login
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
});

// Sistema de notificações
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  
  const icones = {
    sucesso: 'fa-check-circle',
    erro: 'fa-exclamation-circle',
    aviso: 'fa-exclamation-triangle'
  };
  
  notificacao.innerHTML = `
    <i class="fas ${icones[tipo] || 'fa-info-circle'}"></i>
    ${mensagem}
  `;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => notificacao.classList.add('mostrar'), 10);
  
  setTimeout(() => {
    notificacao.classList.remove('mostrar');
    setTimeout(() => notificacao.remove(), 300);
  }, 5000);
}

// Controle de loading
function mostrarCarregamento(botao, carregando) {
  if (carregando) {
    botao.disabled = true;
    const carregador = document.createElement('span');
    carregador.className = 'carregador';
    botao.appendChild(carregador);
  } else {
    botao.disabled = false;
    const carregador = botao.querySelector('.carregador');
    if (carregador) carregador.remove();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const formularioCadastro = document.getElementById("registerForm");
  const formularioLogin = document.getElementById("loginForm");
  const botaoCadastro = formularioCadastro?.querySelector('button[type="submit"]');
  const botaoLogin = formularioLogin?.querySelector('button[type="submit"]');

  // Cadastro de usuário
  formularioCadastro?.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarCarregamento(botaoCadastro, true);

    const nome = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const senha = document.getElementById("registerPassword").value.trim();

    await new Promise(resolve => setTimeout(resolve, 500));

    // Validações
    if (!nome || !email || !senha) {
      mostrarNotificacao("Preencha todos os campos para cadastro.", "erro");
      mostrarCarregamento(botaoCadastro, false);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      mostrarNotificacao("Por favor, insira um e-mail válido.", "erro");
      mostrarCarregamento(botaoCadastro, false);
      return;
    }

    const usuariosCadastrados = JSON.parse(localStorage.getItem('usuarios')) || [];
    if (usuariosCadastrados.some(u => u.email === email)) {
      mostrarNotificacao("Este e-mail já está cadastrado. Faça login.", "aviso");
      container.classList.remove("right-panel-active");
      mostrarCarregamento(botaoCadastro, false);
      return;
    }

    if (senha.length < 6) {
      mostrarNotificacao("A senha deve ter pelo menos 6 caracteres.", "erro");
      mostrarCarregamento(botaoCadastro, false);
      return;
    }

    // Cria novo usuário
    const novoUsuario = {
      nome,
      email,
      senha,
      tipo: email.endsWith('@funcionario.com') ? 'funcionario' : 'cliente'
    };

    usuariosCadastrados.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuariosCadastrados));

    mostrarNotificacao("Conta criada com sucesso!");
    mostrarCarregamento(botaoCadastro, false);
    formularioCadastro.reset();
    
    setTimeout(() => {
      container.classList.remove("right-panel-active");
    }, 2000);
  });

  // Login do usuário
  formularioLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarCarregamento(botaoLogin, true);

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const senha = document.getElementById("loginPassword").value.trim();

    await new Promise(resolve => setTimeout(resolve, 500));

    const usuariosCadastrados = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuario = usuariosCadastrados.find(u => u.email === email && u.senha === senha);

    if (!usuario) {
      mostrarNotificacao("E-mail ou senha incorretos.", "erro");
      mostrarCarregamento(botaoLogin, false);
      return;
    }

    // Armazena sessão com todos os dados necessários
    localStorage.setItem('usuarioLogado', JSON.stringify({
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      logadoEm: new Date().toISOString()
    }));
    
    mostrarNotificacao(`Bem-vindo, ${usuario.nome}!`, "sucesso");
    mostrarCarregamento(botaoLogin, false);
    
    setTimeout(() => {
      window.location.href = usuario.tipo === 'funcionario' 
        ? "funcionario.html"
        : "index.html";
    }, 1500);
  });
});