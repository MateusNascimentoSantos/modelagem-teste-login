document.addEventListener('DOMContentLoaded', function () {
    // ============= [VERIFICAÇÃO DE LOGIN] =============
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado || usuarioLogado.tipo !== 'funcionario') {
        window.location.href = 'index.html';
        return;
    }

    // ============= [ELEMENTOS DOM] =============
    const elements = {
        filterDate: document.getElementById('filter-date'),
        filterUnit: document.getElementById('filter-unit'),
        bookingsTable: document.getElementById('bookingsTable'),
        totalBookings: document.getElementById('totalBookings'),
        dailyRevenue: document.getElementById('dailyRevenue'),
        logoutBtn: document.getElementById('logoutBtn'),
        newBookingBtn: document.getElementById('newBookingBtn'),
        bookingModal: document.getElementById('bookingModal'),
        closeModal: document.querySelector('.close-modal'),
        modalTitle: document.getElementById('modalTitle'),
        form: document.getElementById('adminBookingForm'),
        fields: {
            userName: document.getElementById('adminUserName'),
            petName: document.getElementById('adminPetName'),
            phone: document.getElementById('adminPhone'),
            service: document.getElementById('adminService'),
            unit: document.getElementById('adminUnit'),
            date: document.getElementById('adminDate'),
            time: document.getElementById('adminTime')
        },
        submitBtn: document.querySelector('#adminBookingForm button[type="submit"]')
    };

    // ============= [ESTADO DA APLICAÇÃO] =============
    let currentEditingIndex = null;

    // ============= [FUNÇÕES PRINCIPAIS] =============
    function initializePage() {
        const today = new Date();
        elements.filterDate.valueAsDate = today;

        if (usuarioLogado && elements.fields.userName) {
            elements.fields.userName.value = usuarioLogado.nome || '';
        }

        // Aplica máscara de telefone
        if (elements.fields.phone) {
            applyPhoneMask(elements.fields.phone);
        }

        loadBookings();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Filtros
        elements.filterDate.addEventListener('change', loadBookings);
        elements.filterUnit.addEventListener('change', loadBookings);

        // Botões
        elements.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        });

        elements.newBookingBtn.addEventListener('click', () => {
            resetModal();
            const today = new Date();
            elements.fields.date.valueAsDate = today;
            updateTimeOptions(today.toISOString().split('T')[0], elements.fields.unit.value);
            elements.bookingModal.style.display = 'block';
        });

        elements.closeModal.addEventListener('click', () => {
            elements.bookingModal.style.display = 'none';
        });

        // Modal
        window.addEventListener('click', (e) => {
            if (e.target === elements.bookingModal) {
                elements.bookingModal.style.display = 'none';
            }
        });

        // Formulário
        elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (currentEditingIndex !== null) {
                updateBooking(currentEditingIndex);
            } else {
                createNewBooking();
            }
        });

        // Listener para mudança de data
        elements.fields.date.addEventListener('change', function () {
            updateTimeOptions(this.value, elements.fields.unit.value);
        });

        // Listener para mudança de unidade
        elements.fields.unit.addEventListener('change', function () {
            if (elements.fields.date.value) {
                updateTimeOptions(elements.fields.date.value, this.value);
            }
        });
    }

    // ============= [GERENCIAMENTO DE AGENDAMENTOS] =============
    function loadBookings() {
        const filteredBookings = getFilteredBookings();
        renderBookingsTable(filteredBookings);
        updateSummary(filteredBookings);
    }

    function renderBookingsTable(bookings) {
        const tbody = elements.bookingsTable.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (bookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="no-bookings">Nenhum agendamento encontrado</td></tr>`;
            return;
        }

        bookings.forEach((booking, index) => {
            const date = new Date(booking.date);
            const time = date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${time}</td>
                <td>${booking.petName || 'N/A'}</td>
                <td>${booking.userName || 'N/A'}</td>
                <td>${getServiceName(booking.service)}</td>
                <td>R$ ${getServicePrice(booking.service).toFixed(2).replace('.', ',')}</td>
                <td>${getUnitName(booking.unit)}</td>
                <td>${booking.phone ? formatPhone(booking.phone) : 'N/A'}</td>
                <td class="actions">
                    <button class="btn-action edit" data-id="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" data-id="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Adiciona eventos aos botões de ação
        tbody.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const index = parseInt(button.getAttribute('data-id'));
                editBooking(index);
            });
        });

        tbody.querySelectorAll('.btn-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const index = parseInt(button.getAttribute('data-id'));
                deleteBooking(index);
            });
        });
    }

    function editBooking(index) {
        const allBookings = getAllBookings();
        const filteredBookings = getFilteredBookings();

        if (index < 0 || index >= filteredBookings.length) {
            console.error('Índice de agendamento inválido:', index);
            return;
        }

        const booking = filteredBookings[index];

        // Encontra o índice correspondente na lista completa
        const fullIndex = allBookings.findIndex(ag =>
            ag.date === booking.date &&
            ag.unit === booking.unit &&
            ag.petName === booking.petName &&
            ag.userName === booking.userName
        );

        if (fullIndex === -1) {
            console.error('Agendamento não encontrado na lista completa');
            return;
        }

        currentEditingIndex = fullIndex;

        // Preenche o formulário
        elements.fields.petName.value = booking.petName || '';
        elements.fields.userName.value = booking.userName || '';
        elements.fields.phone.value = booking.phone ? formatPhone(booking.phone) : '';
        elements.fields.service.value = booking.service || '';
        elements.fields.unit.value = booking.unit || '';

        const bookingDate = new Date(booking.date);
        elements.fields.date.valueAsDate = bookingDate;

        // Atualiza os horários disponíveis
        updateTimeOptions(bookingDate.toISOString().split('T')[0], booking.unit);

        // Seleciona o horário atual
        setTimeout(() => {
            elements.fields.time.value = `${String(bookingDate.getHours()).padStart(2, '0')}:${String(bookingDate.getMinutes()).padStart(2, '0')}`;
        }, 100);

        // Configura o modal
        elements.modalTitle.textContent = 'Editar Agendamento';
        elements.submitBtn.textContent = 'Atualizar Agendamento';
        elements.bookingModal.style.display = 'block';
    }

    function createNewBooking() {
        if (!validateForm()) return;

        const dateTimeString = `${elements.fields.date.value}T${elements.fields.time.value}`;
        const dateTime = new Date(dateTimeString);

        if (isNaN(dateTime.getTime())) {
            showNotification('Data/hora inválida!', 'error');
            return;
        }

        const phone = elements.fields.phone.value.replace(/\D/g, '');
        const userName = elements.fields.userName.value.trim();
        const petName = elements.fields.petName.value.trim();

        // Busca o usuário pelo nome para obter o email (insensível a maiúsculas)
        const allUsers = JSON.parse(localStorage.getItem('usuarios')) || [];
        const existingUser = allUsers.find(user => 
            user.nome.toLowerCase() === userName.toLowerCase()
        );

        if (!existingUser) {
           showNotification('Usuário não encontrado! Verifique o nome digitado.', 'error');

            return;
        }

        // Verifica conflitos
        const conflict = getAllBookings().some(ag => {
            const agDate = new Date(ag.date);
            return ag.unit === elements.fields.unit.value &&
                agDate.getTime() === dateTime.getTime();
        });

        if (conflict) {
            showNotification('Este horário já está ocupado. Escolha outro horário.', 'error');
        }

        // Cria o agendamento vinculado ao usuário
        const newBooking = {
            petName: petName,
            userName: existingUser.nome, // Usa o nome exato do cadastro
            phone: phone,
            service: elements.fields.service.value,
            unit: elements.fields.unit.value,
            date: dateTime.toISOString(),
            userEmail: existingUser.email, // Garante o vínculo correto
            petType: document.getElementById('adminPetType')?.value || 'Não especificado'
        };

        // Adiciona o pet ao usuário se não existir
        if (!existingUser.pets) {
            existingUser.pets = [];
        }
        
        const petExists = existingUser.pets.some(pet => 
            pet.nome.toLowerCase() === petName.toLowerCase()
        );
        
        if (!petExists) {
            existingUser.pets.push({
                nome: petName,
                tipo: newBooking.petType
            });
            
            // Atualiza o usuário no localStorage
            const userIndex = allUsers.findIndex(user => 
                user.email === existingUser.email
            );
            if (userIndex !== -1) {
                allUsers[userIndex] = existingUser;
                localStorage.setItem('usuarios', JSON.stringify(allUsers));
            }
        }

        try {
            const allBookings = getAllBookings();
            allBookings.push(newBooking);
            localStorage.setItem('allBookings', JSON.stringify(allBookings));

            elements.bookingModal.style.display = 'none';
            resetModal();
            loadBookings();
            showSuccessNotification('Agendamento criado com sucesso!');
        } catch (e) {
            showNotification('Erro ao criar agendamento.', 'error');
        }
    }

    function updateBooking(index) {
        if (!validateForm()) return;

        const dateTimeString = `${elements.fields.date.value}T${elements.fields.time.value}`;
        const dateTime = new Date(dateTimeString);

        if (isNaN(dateTime.getTime())) {
            showNotification('Data/hora inválida!', 'error');
            return;
        }

        const allBookings = getAllBookings();
        
        if (index < 0 || index >= allBookings.length) {
            showNotification('Índice de agendamento inválido!');
            return;
        }

        const originalBooking = allBookings[index];
        const phone = elements.fields.phone.value.replace(/\D/g, '');
        const userName = elements.fields.userName.value.trim();
        const petName = elements.fields.petName.value.trim();

        // Busca o usuário pelo nome (insensível a maiúsculas)
        const allUsers = JSON.parse(localStorage.getItem('usuarios')) || [];
        const existingUser = allUsers.find(user => 
            user.nome.toLowerCase() === userName.toLowerCase()
        );

        if (!existingUser) {
            showNotification('Usuário não encontrado! Verifique o nome digitado.');
            return;
        }

        // Verifica se o usuário foi alterado
        if (originalBooking.userName.toLowerCase() !== userName.toLowerCase()) {
            // Atualiza os pets do novo usuário
            if (!existingUser.pets) {
                existingUser.pets = [];
            }
            
            const petExists = existingUser.pets.some(pet => 
                pet.nome.toLowerCase() === petName.toLowerCase()
            );
            
            if (!petExists) {
                existingUser.pets.push({
                    nome: petName,
                    tipo: document.getElementById('adminPetType')?.value || 'Não especificado'
                });
                
                const userIndex = allUsers.findIndex(user => 
                    user.email === existingUser.email
                );
                if (userIndex !== -1) {
                    allUsers[userIndex] = existingUser;
                    localStorage.setItem('usuarios', JSON.stringify(allUsers));
                }
            }
        }

        // Verifica conflitos
        const conflict = allBookings.some((ag, i) => {
            if (i === index) return false;
            const agDate = new Date(ag.date);
            return ag.unit === elements.fields.unit.value &&
                   agDate.getTime() === dateTime.getTime();
        });

        if (conflict) {
            showNotification('Este horário já está ocupado nesta unidade. Por favor, escolha outro horário.');
            return;
        }

        const updatedBooking = {
            ...originalBooking,
            petName: petName,
            userName: existingUser.nome, // Usa o nome exato do cadastro
            phone: phone,
            service: elements.fields.service.value,
            unit: elements.fields.unit.value,
            date: dateTime.toISOString(),
            userEmail: existingUser.email, // Garante o email correto
            petType: document.getElementById('adminPetType')?.value || originalBooking.petType || 'Não especificado'
        };

        try {
            allBookings[index] = updatedBooking;
            localStorage.setItem('allBookings', JSON.stringify(allBookings));
            elements.bookingModal.style.display = 'none';
            resetModal();
            loadBookings();
            showSuccessNotification('Agendamento atualizado com sucesso!');
        } catch (e) {
            console.error('Erro ao atualizar agendamento:', e);
            showNotification('Erro ao atualizar agendamento. Verifique o console para detalhes.');
        }
    }

    function deleteBooking(index) {
        if (!showNotification('Tem certeza que deseja cancelar este agendamento?')) return;

        const filteredBookings = getFilteredBookings();
        if (index < 0 || index >= filteredBookings.length) return;

        const bookingToDelete = filteredBookings[index];
        const allBookings = getAllBookings();

        // Encontra o índice na lista completa
        const fullIndex = allBookings.findIndex(ag =>
            ag.date === bookingToDelete.date &&
            ag.unit === bookingToDelete.unit &&
            ag.petName === bookingToDelete.petName &&
            ag.userName === bookingToDelete.userName
        );

        if (fullIndex === -1) return;

        allBookings.splice(fullIndex, 1);
        localStorage.setItem('allBookings', JSON.stringify(allBookings));
        loadBookings();
        showSuccessNotification('Agendamento cancelado com sucesso!');
    }

    // ============= [FUNÇÕES AUXILIARES] =============
    function getFilteredBookings() {
        const selectedDate = elements.filterDate.value;
        const selectedUnit = elements.filterUnit.value;

        const allBookings = getAllBookings();
        return allBookings.filter(booking => {
            const bookingDate = new Date(booking.date).toISOString().split('T')[0];
            const matchesDate = selectedDate ? bookingDate === selectedDate : true;
            const matchesUnit = selectedUnit === 'todas' || booking.unit === selectedUnit;
            return matchesDate && matchesUnit;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function resetModal() {
        elements.modalTitle.textContent = 'Novo Agendamento';
        elements.submitBtn.textContent = 'Agendar';
        currentEditingIndex = null;

        // Limpa os campos (exceto nome do usuário)
        elements.form.reset();
        if (usuarioLogado && elements.fields.userName) {
            elements.fields.userName.value = usuarioLogado.nome || '';
        }
    }

    function validateForm() {
        const requiredFields = [
            elements.fields.petName,
            elements.fields.userName,
            elements.fields.service,
            elements.fields.unit,
            elements.fields.date,
            elements.fields.time
        ];

        for (const field of requiredFields) {
            if (!field.value) {
                showNotification('Preencha todos os campos obrigatórios!');
                field.focus();
                return false;
            }
        }

        // Validação do telefone (mínimo 10 dígitos)
        const phoneDigits = elements.fields.phone.value.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            showNotification('Informe um telefone válido com DDD e número!');
            elements.fields.phone.focus();
            return false;
        }

        return true;
    }

    function updateSummary(bookings) {
        if (!elements.totalBookings || !elements.dailyRevenue) return;

        elements.totalBookings.textContent = bookings.length;
        const totalRevenue = bookings.reduce((sum, booking) => sum + getServicePrice(booking.service), 0);
        elements.dailyRevenue.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
    }

    function getAllBookings() {
        try {
            const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
            return bookings.filter(booking =>
                booking.userName && booking.petName &&
                booking.service && booking.unit && booking.date
            );
        } catch (e) {
            console.error('Erro ao carregar agendamentos:', e);
            return [];
        }
    }

    function gerarHorariosDisponiveis(dataSelecionada, unidadeSelecionada) {
        const horariosDisponiveis = [];
        const dateObj = new Date(dataSelecionada + 'T00:00');
        const diaSemana = dateObj.getDay(); // 0=Domingo, 6=Sábado
        const allBookings = getAllBookings();

        // Horário de funcionamento
        let horaInicio = 8;
        let horaFim = 18;
        let intervalo = 30; // minutos

        // Ajustes para sábado
        if (diaSemana === 6) { // Sábado
            horaFim = 12;
        }

        // Não gera horários para domingo
        if (diaSemana === 0) {
            return [];
        }

        // Gerar todos os horários possíveis
        for (let hora = horaInicio; hora <= horaFim; hora++) {
            // Pular horário de almoço (12:00-13:00)
            if (hora === 12) continue;

            for (let minuto = 0; minuto < 60; minuto += intervalo) {
                const horaFormatada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
                const dataHoraCompleta = new Date(dataSelecionada + 'T' + horaFormatada);

                // Verificar se o horário já está ocupado
                const horarioOcupado = allBookings.some(ag => {
                    const agDate = new Date(ag.date);
                    return ag.unit === unidadeSelecionada &&
                        agDate.getTime() === dataHoraCompleta.getTime() &&
                        (currentEditingIndex === null ||
                            !allBookings[currentEditingIndex] ||
                            agDate.getTime() !== new Date(allBookings[currentEditingIndex].date).getTime());
                });

                if (!horarioOcupado && dataHoraCompleta > new Date()) {
                    horariosDisponiveis.push(horaFormatada);
                }
            }
        }

        return horariosDisponiveis;
    }

    function updateTimeOptions(date, unit) {
        const timeSelect = elements.fields.time;
        timeSelect.innerHTML = '<option value="">Selecione</option>';

        if (!date || !unit) {
            timeSelect.disabled = true;
            return;
        }

        const horarios = gerarHorariosDisponiveis(date, unit);

        if (horarios.length === 0) {
            timeSelect.disabled = true;
            showNotification('Nenhum horário disponível para esta data/unidade', 'warning');
            return;
        }

        horarios.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            timeSelect.appendChild(option);
        });

        timeSelect.disabled = false;
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 10);
    }

    function showSuccessNotification(message) {
        showNotification(message, 'success');
    }

    // ============= [MÁSCARA DE TELEFONE] =============
    function applyPhoneMask(input) {
        input.addEventListener('input', function (e) {
            let value = this.value.replace(/\D/g, '');

            if (value.length > 11) {
                value = value.substring(0, 11);
            }

            if (value.length > 0) {
                value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
            }

            this.value = value;
        });
    }

    function formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        return phone;
    }

    // ============= [FUNÇÕES DE NEGÓCIO] =============
    function getServicePrice(serviceKey) {
        const prices = {
            'banho': 45.00,
            'tosa': 65.00,
            'spa': 120.00,
            'consulta': 150.00,
            'vacina': 100.00
        };
        return prices[serviceKey] || 0;
    }

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

    // ============= [INICIALIZAÇÃO] =============
    initializePage();
});