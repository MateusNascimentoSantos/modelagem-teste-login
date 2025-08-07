document.addEventListener('DOMContentLoaded', function () {
    // =========================
    // Elementos da DOM
    // =========================
    const loginLogoutLink = document.getElementById("loginLogoutLink");
    const btnMeusAgendamentos = document.getElementById('btnMeusAgendamentos');
    const secaoAgendamentos = document.getElementById('meus-agendamentos');
    const bookingForm = document.querySelector('.booking-form');
    const bookingDateInput = document.getElementById('booking-date');
    const bookingTimeSelect = document.getElementById('booking-time');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const heroVideo = document.querySelector('.hero-video video');
    const playButton = document.querySelector('.play-button');

    // =========================
    // Sistema de Notificações
    // =========================
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        return notification;
    }

    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `${button.textContent} <span class="loader"></span>`;
        } else {
            button.disabled = false;
            button.innerHTML = button.textContent;
        }
    }

    // =========================
    // Controle de Login/Logout
    // =========================
    if (loginLogoutLink) {
        function updateLoginLogout() {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            if (usuarioLogado) {
                loginLogoutLink.textContent = "Logout";
                loginLogoutLink.href = "#";
                loginLogoutLink.style.cursor = "pointer";
            } else {
                loginLogoutLink.textContent = "Login";
                loginLogoutLink.href = "login.html";
                loginLogoutLink.style.cursor = "pointer";
            }
        }

        updateLoginLogout();

        loginLogoutLink.addEventListener("click", function (e) {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            if (usuarioLogado) {
                e.preventDefault();
                localStorage.removeItem("usuarioLogado");
                showNotification("Você saiu da sua conta!", "success");
                updateLoginLogout();
                setTimeout(() => window.location.reload(), 1500);
            }
        });
    }

    // =========================
    // Controle do botão "Meus Agendamentos"
    // =========================
    if (btnMeusAgendamentos) {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        
        if (usuarioLogado) {
            btnMeusAgendamentos.style.display = "inline-block";
            btnMeusAgendamentos.addEventListener('click', function (e) {
                e.preventDefault();
                carregarAgendamentos();
                secaoAgendamentos.style.display = "block";
                window.scrollTo({ top: secaoAgendamentos.offsetTop - 60, behavior: "smooth" });
            });
        } else {
            btnMeusAgendamentos.style.display = "none";
        }
    }

    // =========================
    // Menu Mobile
    // =========================
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function () {
            mainNav.classList.toggle('active');
        });

        const navLinks = document.querySelectorAll('.main-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('active');
                }
            });
        });
    }

    // =========================
    // Scroll suave
    // =========================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === "#" || !document.querySelector(targetId)) return;
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // =========================
    // Controle do vídeo do hero
    // =========================
    if (heroVideo && playButton) {
        heroVideo.addEventListener('click', function () {
            if (this.paused) {
                this.play();
                playButton.style.display = 'none';
            } else {
                this.pause();
                playButton.style.display = 'flex';
            }
        });

        heroVideo.addEventListener('pause', function () {
            playButton.style.display = 'flex';
        });

        heroVideo.addEventListener('play', function () {
            playButton.style.display = 'none';
        });

        playButton.addEventListener('click', function (e) {
            e.stopPropagation();
            heroVideo.play();
        });
    }

    // =========================
    // Animação ao rolar
    // =========================
    const animateOnScroll = function () {
        const elements = document.querySelectorAll('.service-card, .benefit-card, .testimonial-card');
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    const animatedElements = document.querySelectorAll('.service-card, .benefit-card, .testimonial-card');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();

    // =========================
    // GERENCIAMENTO DE AGENDAMENTOS
    // =========================

    // =========================
    // Funções Auxiliares
    // =========================
    function getServiceName(serviceKey) {
        const services = {
            'banho': 'Banho Completo',
            'tosa': 'Tosa Higiênica',
            'spa': 'SPA Pet',
            'consulta': 'Consulta Veterinária',
            'vacina': 'Vacinação'
        };
        return services[serviceKey] || serviceKey;
    }

    function getUnitName(unitKey) {
        const units = {
            'centro': 'PetCare Centro',
            'zona-sul': 'PetCare Zona Sul'
        };
        return units[unitKey] || unitKey;
    }

    // =========================
    // Função: Obter TODOS os agendamentos
    // =========================
    function getAllBookings() {
        try {
            const bookings = localStorage.getItem('allBookings');
            if (!bookings) return [];
            
            const parsed = JSON.parse(bookings);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Erro ao recuperar agendamentos:", e);
            return [];
        }
    }

    // =========================
    // Função: Salvar Agendamento
    // =========================
    function saveBooking(booking) {
        try {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            if (!usuarioLogado) {
                console.error("Usuário não logado");
                return false;
            }

            const completeBooking = {
                userEmail: usuarioLogado.email,
                userName: usuarioLogado.nome,
                petName: booking.petName,
                phone: booking.phone,
                petType: booking.petType,
                service: booking.service,
                unit: booking.unit,
                date: booking.date
            };

            const allBookings = getAllBookings();
            allBookings.push(completeBooking);
            
            localStorage.setItem('allBookings', JSON.stringify(allBookings));
            return true;
        } catch (e) {
            console.error("Erro ao salvar agendamento:", e);
            return false;
        }
    }

    // =========================
    // Função: Carregar Agendamentos (AJUSTADA PARA ID JSON)
    // =========================
    function carregarAgendamentos() {
        try {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            if (!usuarioLogado) {
                showNotification("Você precisa estar logado", "error");
                return;
            }

            const listaAgendamentos = document.getElementById('agendamentos-lista');
            const semAgendamentos = document.getElementById('sem-agendamentos');
            
            if (!listaAgendamentos || !semAgendamentos) return;

            // Busca TODOS os agendamentos
            const allBookings = getAllBookings();
            
            // Filtra pelo email do usuário logado
            const agendamentos = allBookings.filter(ag => {
                return ag.userEmail && ag.userEmail === usuarioLogado.email;
            });

            const tbody = listaAgendamentos.querySelector('tbody');
            tbody.innerHTML = "";

            if (agendamentos.length === 0) {
                listaAgendamentos.style.display = "none";
                semAgendamentos.style.display = "block";
                return;
            }

            // Ordena do mais recente para o mais antigo
            agendamentos.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Usa forEach com um ID único em JSON para cada agendamento
            agendamentos.forEach((ag) => {
                const dataHora = new Date(ag.date);
                const tr = document.createElement("tr");
                // Cria um ID único serializando em JSON o date, unit e petName
                const uniqueId = JSON.stringify({
                    date: ag.date,
                    unit: ag.unit,
                    petName: ag.petName
                });
                tr.innerHTML = `
                    <td>${ag.petName || 'Não informado'}</td>
                    <td>${getServiceName(ag.service)}</td>
                    <td>${getUnitName(ag.unit)}</td>
                    <td>${dataHora.toLocaleDateString('pt-BR')}</td>
                    <td>${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><button class="btn-action btn-cancelar" data-id='${uniqueId}'>Cancelar</button></td>
                `;
                tbody.appendChild(tr);
            });

            listaAgendamentos.style.display = "table";
            semAgendamentos.style.display = "none";

            // Ajuste no evento de cancelar
            document.querySelectorAll(".btn-cancelar").forEach(btn => {
                btn.addEventListener("click", function() {
                    const id = this.getAttribute("data-id");
                    cancelarAgendamento(id);
                });
            });
        } catch (e) {
            console.error("Erro ao carregar agendamentos:", e);
        }
    }

    // =========================
    // Função: Cancelar Agendamento (AJUSTADA PARA ID JSON)
    // =========================
    function cancelarAgendamento(id) {
        try {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            if (!usuarioLogado) {
                showNotification("Erro: Usuário não identificado", "error");
                return;
            }

            // Parse do ID JSON para obter as partes
            const { date, unit, petName } = JSON.parse(id);

            let allBookings = getAllBookings();
            const initialLength = allBookings.length;

            // Filtra removendo o agendamento específico
            allBookings = allBookings.filter(ag => 
                !(ag.userEmail === usuarioLogado.email && 
                  ag.date === date &&
                  ag.unit === unit &&
                  ag.petName === petName)
            );

            if (allBookings.length === initialLength) {
                showNotification("Agendamento não encontrado", "error");
                return;
            }

            localStorage.setItem('allBookings', JSON.stringify(allBookings));
            carregarAgendamentos();
            showNotification("Agendamento cancelado!", "success");
        } catch (e) {
            console.error("Erro ao cancelar agendamento:", e);
        }
    }

    // =========================
    // Gerar Horários Dinamicamente
    // =========================
    if (bookingDateInput) {
        const today = new Date().toISOString().split('T')[0];
        bookingDateInput.min = today;
    }

    if (bookingDateInput && bookingTimeSelect) {
        bookingTimeSelect.disabled = true;

        function gerarHorarios() {
            bookingTimeSelect.innerHTML = '<option value="">Selecione</option>';

            const dataSelecionada = bookingDateInput.value;
            if (!dataSelecionada) {
                bookingTimeSelect.disabled = true;
                return;
            }

            const dateObj = new Date(dataSelecionada + 'T00:00');
            let horarios = [];

            if (dateObj.getDay() === 6) { // Sábado
                for (let h = 8; h < 12; h++) {
                    horarios.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
                }
            } else if (dateObj.getDay() !== 0) { // Dias úteis
                for (let h = 8; h <= 18; h++) {
                    if (h !== 12) {
                        horarios.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
                    }
                }
            }

            horarios.forEach(hora => {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                bookingTimeSelect.appendChild(option);
            });

            bookingTimeSelect.disabled = false;
        }

        bookingDateInput.addEventListener('change', gerarHorarios);
        if (bookingDateInput.value) gerarHorarios();
    }

    // =========================
    // Formulário de Agendamento
    // =========================
    if (bookingForm) {
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            setButtonLoading(submitBtn, true);

            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            if (!usuarioLogado) {
                showNotification("Você precisa estar logado para agendar.", "error");
                setButtonLoading(submitBtn, false);
                setTimeout(() => window.location.href = "login.html", 1500);
                return;
            }

            // Coletar dados do formulário
            const formData = {
                petName: document.getElementById('name-pet').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                petType: document.getElementById('pet-type').value,
                service: document.getElementById('service').value,
                unit: document.getElementById('unit').value,
                date: bookingDateInput.value,
                time: bookingTimeSelect.value
            };

            // Validações
            if (Object.values(formData).some(v => !v)) {
                showNotification('Preencha todos os campos.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            const dataHoraCompleta = new Date(formData.date + 'T' + formData.time);
            
            if (dataHoraCompleta < new Date()) {
                showNotification('Não pode agendar no passado.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            if (dataHoraCompleta.getDay() === 0 || 
               (dataHoraCompleta.getDay() === 6 && 
               (dataHoraCompleta.getHours() < 8 || dataHoraCompleta.getHours() >= 12))) {
                showNotification('Fora do horário de funcionamento.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            // Verificar conflitos
            const conflito = getAllBookings().some(ag => {
                const agDate = new Date(ag.date);
                return ag.unit === formData.unit && agDate.getTime() === dataHoraCompleta.getTime();
            });

            if (conflito) {
                showNotification('Horário já ocupado.', 'error');
                setButtonLoading(submitBtn, false);
                return;
            }

            // Criar agendamento
            const booking = {
                userName: usuarioLogado.nome,
                userEmail: usuarioLogado.email,
                petName: formData.petName,
                phone: formData.phone,
                petType: formData.petType,
                service: formData.service,
                unit: formData.unit,
                date: dataHoraCompleta.toISOString()
            };

            if (saveBooking(booking)) {
                showNotification(`Agendamento para ${formData.petName} confirmado!`, 'success');
                
                // Resetar formulário
                bookingForm.reset();
                bookingTimeSelect.disabled = true;
                setButtonLoading(submitBtn, false);
                
                // Atualizar lista
                carregarAgendamentos();
                if (secaoAgendamentos) {
                    secaoAgendamentos.style.display = "block";
                    window.scrollTo({
                        top: secaoAgendamentos.offsetTop - 60,
                        behavior: 'smooth'
                    });
                }
            } else {
                showNotification("Erro ao salvar agendamento", "error");
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // =========================
    // Inicialização
    // =========================
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuarioLogado && secaoAgendamentos) {
        secaoAgendamentos.style.display = "block";
        carregarAgendamentos();
    }
});
