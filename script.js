document.addEventListener('DOMContentLoaded', function() {

    // --- FUNÇÕES AUXILIARES ---

    function isUserLoggedIn() {
        const user = localStorage.getItem('userData');
        if (!user) return false;

        const userData = JSON.parse(user);
        if (userData.expires && Date.now() > userData.expires) {
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            return false;
        }
        return userData.loggedIn === true;
    }

    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf == '') return false;
        if (cpf.length != 11 ||
            cpf == "00000000000" ||
            cpf == "11111111111" ||
            cpf == "22222222222" ||
            cpf == "33333333333" ||
            cpf == "44444444444" ||
            cpf == "55555555555" ||
            cpf == "66666666666" ||
            cpf == "77777777777" ||
            cpf == "88888888888" ||
            cpf == "99999999999")
            return false;
        add = 0;
        for (i = 0; i < 9; i++)
            add += parseInt(cpf.charAt(i)) * (10 - i);
        rev = 11 - (add % 11);
        if (rev == 10 || rev == 11)
            rev = 0;
        if (rev != parseInt(cpf.charAt(9)))
            return false;
        // Valida 2o digito
        add = 0;
        for (i = 0; i < 10; i++)
            add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev == 10 || rev == 11)
            rev = 0;
        if (rev != parseInt(cpf.charAt(10)))
            return false;
        return true;
    }

    function validarCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, '');

        if (cnpj == '') return false;

        if (cnpj.length != 14)
            return false;
        if (cnpj == "00000000000000" ||
            cnpj == "11111111111111" ||
            cnpj == "22222222222222" ||
            cnpj == "33333333333333" ||
            cnpj == "44444444444444" ||
            cnpj == "55555555555555" ||
            cnpj == "66666666666666" ||
            cnpj == "77777777777777" ||
            cnpj == "88888888888888" ||
            cnpj == "99999999999999")
            return false;
        tamanho = cnpj.length - 2
        numeros = cnpj.substring(0, tamanho);
        digitos = cnpj.substring(tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0))
            return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1))
            return false;

        return true;
    }

    function isAdmin() {
        const user = localStorage.getItem('userData');
        return user ? JSON.parse(user).admin : false;
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function generateCustomId() {
        let id = "COPA-";
        const numbers = "0123456789";
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for (let i = 0; i < 8; i++) {
            id += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        for (let i = 0; i < 4; i++) {
            id += letters.charAt(Math.floor(Math.random() * letters.length));
        }

        return id;
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            alert(message);
        }
    }

    function hideError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // --- INICIALIZAÇÃO ---
    if (!isUserLoggedIn() && !window.location.pathname.includes('login.html')) {
        window.location.href = '/login.html';
        return;
    }

    // --- Variáveis de controle de página/aba ---
    let currentPage = 1;
    const totalPages = 15;

    // Mapeamento inverso
    const sectionNumberToName = {
        1: 'identificadores',
        2: 'dados-visita',
        3: 'dados-controle',
        4: 'dados-responsaveis',
        5: 'composicao-familiar',
        6: 'despesas',
        7: 'lazer-cultura',
        8: 'participacao-organizacao',
        9: 'dados-moradia',
        10: 'dados-animais',
        11: 'dados-mobilidade',
        12: 'sustentabilidade',
        13: 'violencia',
        14: 'documentacao',
        15: 'observacoes-finais'
    };

    // --- Funções de Manipulação de Event Listeners ---

    const prevButton = document.getElementById('prev-button');
    if (prevButton) {
        prevButton.addEventListener('click', prevPage);
    }

    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.addEventListener('click', nextPage);
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tabName;
            if (tabName) {
                openTab(tabName);
            }
        });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(displayCadastroList, 300));
    }

    const novoCadastroButton = document.getElementById('novo-cadastro-button');
    if (novoCadastroButton) {
        novoCadastroButton.addEventListener('click', novoCadastro);
    }
    const forms = document.querySelectorAll(".form-section");
    forms.forEach(form => {
        const saveButton = form.querySelector('.save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const sectionNumber = form.id.replace('form-section-', '');
                handleAutoSave(sectionNumber);
            });
        }

        if (form.id === 'form-section-5') {
            const addMembroButton = form.querySelector("#add-membro");
            if (addMembroButton) {
                addMembroButton.addEventListener('click', addMembro);
            }
        }

        if (form.id === 'form-section-13') {
            const addViolenciaButton = form.querySelector("#add-violencia");
            if (addViolenciaButton) {
                addViolenciaButton.addEventListener('click', addViolencia);
            }
        }

        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          input.addEventListener('input', () => {
            const sectionNumber = form.id.replace('form-section-', '');
            debounce(handleAutoSave, 500)(sectionNumber);
          });
            input.addEventListener('focus', hideError);

        });
    });

    const finalizarButton = document.getElementById('finalizar-cadastro');
    if (finalizarButton) {
        finalizarButton.addEventListener('click', finalizarCadastro);
    }

    // Menu Mobile
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            const tabs = document.getElementById('tabs');
            tabs.classList.toggle('active');
        });
    }

// --- Inicialização (ao carregar a página) ---
    if (isUserLoggedIn()) {
        openTab('dashboard');
    }

    // --- FUNÇÕES DE CONTROLE DE PÁGINA/ABA ---

    function nextPage() {
        hideError();
        if (currentPage < totalPages) {
            const currentForm = document.getElementById(`form-section-${currentPage}`);
            if (currentForm) {
                currentForm.classList.remove('active');
            }
            currentPage++;
            const nextForm = document.getElementById(`form-section-${currentPage}`);
            if (nextForm) {
                nextForm.classList.add('active');
            }
            updateButtons();
        }
    }

    function prevPage() {
        hideError();
        if (currentPage > 1) {
            const currentForm = document.getElementById(`form-section-${currentPage}`);
            if (currentForm) {
                currentForm.classList.remove('active');
            }
            currentPage--;
            const prevForm = document.getElementById(`form-section-${currentPage}`);
            if (prevForm) {
                prevForm.classList.add('active');
            }
            updateButtons();
        }
    }

    function updateButtons() {
        for (let i = 1; i <= totalPages; i++) {
            const form = document.getElementById(`form-section-${i}`);
            if (form) {
                const prevButton = form.querySelector(".prev-button");
                const nextButton = form.querySelector(".next-button");
                if (prevButton) {
                    prevButton.style.display = i === 1 ? "none" : "inline-block";
                }

                if (nextButton) {
                    nextButton.style.display = i === totalPages ? "none" : "inline-block";
                }
            }
        }
    }

    function showPage(pageNumber) {
        hideError();
        for (let i = 1; i <= totalPages; i++) {
            const form = document.getElementById(`form-section-${i}`);
            if (form) {
                form.classList.remove('active');
            }
        }
        const targetForm = document.getElementById(`form-section-${pageNumber}`);
        if (targetForm) {
            targetForm.classList.add('active');
        }
        currentPage = pageNumber;
        updateButtons();
    }



    // --- FUNÇÕES DE INTERAÇÃO 
    function openTab(tabName) {
        hideError();
        const tabContents = document.querySelectorAll(".tab-content");
        tabContents.forEach(content => content.classList.remove("active"));

        const tabButtons = document.querySelectorAll(".tab-button");
        tabButtons.forEach(button => button.classList.remove("active"));

        const selectedTabContent = document.getElementById(tabName + "-content");
        if (selectedTabContent) {
            selectedTabContent.classList.add("active");
        }

        const activeButton = document.querySelector(`.tab-button[data-tab-name="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add("active");
        }

        if (tabName === 'dashboard') {
            displayCadastroList();
        }

        if (tabName === 'estatisticas') {
            if (!isAdmin()) {
                alert("Acesso não autorizado para estatísticas.");
                openTab('dashboard');
                return;
            }

            getSheetData(data => {
                createAgeChart(data.idades);
                createSituacaoOcupacionalChart(data.situacoesOcupacionais);
            });
        }
    }


    function generateMemberId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function addMembro() {
        hideError();
        const membrosFamiliaDiv = document.getElementById("membros-familia");
        const membroIndex = membrosFamiliaDiv.children.length + 1;
        const membroId = generateMemberId();

        const membroDiv = document.createElement("div");
        membroDiv.classList.add("membro-familia");
        membroDiv.setAttribute('id', `membro-${membroId}`);

        membroDiv.innerHTML = `
            <h3>Membro <span class="math-inline">\{membroIndex\}</h3\>
<input type\="hidden" name\="membros\[\]\[id\]" value\="</span>{membroId}" class="membro-id">

            <label for="nomeMembro${membroIndex}">Nome:</label>
            <input type="text" id="nomeMembro${membroIndex}" name="membros[][nome]" class="nomeMembro" required><br><br>

            <label for="idadeMembro${membroIndex}">Idade (Anos completos):</label>
            <input type="number" id="idadeMembro${membroIndex}" name="membros[][idade]" class="idadeMembro" required><br><br>

            <label for="generoMembro${membroIndex}">Gênero:</label>
            <select id="generoMembro${membroIndex}" name="membros[][genero]" class="generoMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - FEMININO</option>
                <option value="2">2 - MASCULINO</option>
                <option value="3">3 - NÃO BINARIO</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="posicaoMembro${membroIndex}">Posição Familiar:</label>
            <select id="posicaoMembro${membroIndex}" name="membros[][posicao]" class="posicaoMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - RESPONSAVEL</option>
                <option value="2">2 - CÔNJUGE</option>
                <option value="3">3 - FILHO(A)</option>
                <option value="4">4 - ENTEADO(A)</option>
                <option value="5">5 - PAI/MÃE</option>
                <option value="6">6 - AVÔ/AVÓ</option>
                <option value="7">7 - IRMÃO(A)</option>
                <option value="8">8 - CUNHADO(A)</option>
                <option value="9">9 - SOGRO(A)</option>
                <option value="10">10 - GENRO/NORA</option>
                <option value="11">11 - NETO(A)</option>
                <option value="12">12 - OUTROS PARENTES</option>
                <option value="13">13 - PADRASTO/MADRASTA</option>
                <option value="14">14 - AGREGADO(A)</option>
                <option value="15">15 - OUTROS</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="situacaoOcupacionalMembro${membroIndex}">Situação Ocupacional:</label>
            <select id="situacaoOcupacionalMembro${membroIndex}" name="membros[][situacaoOcupacional]" class="situacaoOcupacionalMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - DESEMPREGADO</option>
                <option value="2">2 - ASSALARIADO C/ REG.</option>
                <option value="3">3 - ASSALARIADO S/ REG.</option>
                <option value="4">4 - TRABALHADOR TEMPORÁRIO OU EVENTUAL (BICO)</option>
                <option value="5">5 - AUTÔNOMO</option>
                <option value="6">6 - FUNCIONÁRIO PÚBLICO</option>
                <option value="7">7 - EMPREGADOR</option>
                <option value="8">8 - ESTUDANTE/ESTÁGIARIO</option>
                <option value="9">9 - AFASTADO TEMPORARIAMENTE POR DOENÇA</option>
                <option value="10">10 - APOSENTADO</option>
                <option value="11">11 - PENSIONISTA</option>
                <option value="12">12 - INCAPAZ PARA O TRABALHO</option>
                <option value="13">13 - BENEFICIÁRIO(BPC-LOAS)</option>
                <option value="14">14 - DONA DE CASA</option>
                <option value="15">15 - MENOR DE 10 ANOS, NÃO TRAB./ESTUDA</option>
                <option value="16">16 - NÃO DESEJA TRABALHAR</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="estadoCivilMembro${membroIndex}">Estado Civil:</label>
            <select id="estadoCivilMembro${membroIndex}" name="membros[][estadoCivil]" class="estadoCivilMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - SOLTEIRO</option>
                <option value="2">2 - CASADO(A)</option>
                <option value="3">3 - DIVORC./DESQ.</option>
                <option value="4">4 - UNIÃO ESTÁVEL</option>
                <option value="5">5 - SEPARADO(A)</option>
                <option value="6">6 - SEPARADO(A) E VIVE EM RELAÇÃO CONSENSUAL</option>
                <option value="7">7 - VIÚVO(A)</option>
                <option value="8">8 - VIVE JUNTO</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>
            
            <label for="grupoEtnicoMembro${membroIndex}">Grupo Étnico Racial:</label>
            <select id="grupoEtnicoMembro${membroIndex}" name="membros[][grupoEtnico]" class="grupoEtnicoMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - BRANCA</option>
                <option value="2">2 - PRETA</option>
                <option value="3">3 - AMARELA</option>
                <option value="4">4 - PARDA</option>
                <option value="5">5 - INDÍGENAS</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="pneMembro${membroIndex}">PNE:</label>
            <select id="pneMembro${membroIndex}" name="membros[][pne]" class="pneMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM, VISUAL</option>
                <option value="3">3 - SIM, AUDITIVA</option>
                <option value="4">4 - SIM, INTELECTUAL</option>
                <option value="5">5 - SIM, FÍSICA</option>
                <option value="6">6 - SIM, MULTIPLAS</option>
                <option value="7">7 - SIM, NANISMO</option>  
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="cidMembro${membroIndex}">CID:</label>
            <input type="text" id="cidMembro${membroIndex}" name="membros[][cid]" class="cidMembro"><br><br>

            <label for="espectroAutistaMembro${membroIndex}">Portador do espectro autista?</label>
            <select id="espectroAutistaMembro${membroIndex}" name="membros[][espectroAutista]" class="espectroAutistaMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="temCancerMembro${membroIndex}">Tem cancer ou doença degenerativa?</label>
            <select id="temCancerMembro${membroIndex}" name="membros[][temCancer]" class="temCancerMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>
            
            <label for="gestanteMembro${membroIndex}">É gestante?</label>
            <select id="gestanteMembro${membroIndex}" name="membros[][gestante]" class="gestanteMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="profissaoMembro${membroIndex}">Profissão:</label>
            <input type="text" id="profissaoMembro${membroIndex}" name="membros[][profissao]" class="profissaoMembro"><br><br>

            <label for="frequentaEscolaMembro${membroIndex}">Frequenta escola?</label>
            <select id="frequentaEscolaMembro${membroIndex}" name="membros[][frequentaEscola]" class="frequentaEscolaMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="cursoQueFrequentaMembro${membroIndex}">Curso que frequenta:</label>
            <select id="cursoQueFrequentaMembro${membroIndex}" name="membros[][cursoQueFrequenta]" class="cursoQueFrequentaMembro" required>
            <option value="">Selecione</option>
            <option value="1">1 - CRECHE</option>
            <option value="2">2 - EMEI</option>
            <option value="3">3 - 1º ANO ENS. FUND.</option>
            <option value="4">4 - 2º ANO ENS. FUND.</option>
            <option value="5">5 - 3º ANO ENS. FUND.</option>
            <option value="6">6 - 4º ANO ENS. FUND.</option>
            <option value="7">7 - 5º ANO ENS. FUND.</option>
            <option value="8">8 - 6º ANO ENS. FUND.</option>
            <option value="9">9 - 7º ANO ENS. FUND.</option>
            <option value="10">10 - 8º ANO ENS. FUND.</option>
            <option value="11">11 - 9º ANO ENS. FUND.</option>
            <option value="12">12 - SUPLETIVO FUND.</option>
            <option value="13">13 - 1ª SÉRIE ENS. MÉD.</option>
            <option value="14">14 - 2ª SÉRIE ENS. MÉD.</option>
            <option value="15">15 - 3ª SÉRIE ENS. MÉD.</option>
            <option value="16">16 - SUPLETIVO ENS. MÉD.</option>
            <option value="17">17 - CURSO TÉCNICO</option>
            <option value="18">18 - NÍVEL SUPERIOR</option>
            <option value="19">19 - MESTRADO</option>
            <option value="20">20 - DOUTORADO</option>
            <option value="21">21 - NÃO SE APLICA</option>
            <option value="99">99 - SEM INF.</option>
        </select><br><br>

        <label for="estudouAteMembro${membroIndex}">Estudou até?</label>
        <select id="estudouAteMembro${membroIndex}" name="membros[][estudouAte]" class="estudouAteMembro" required>
            <option value="">Selecione</option>
            <option value="1">1 - SEM ESCOLARIZAÇÃO</option>
            <option value="2">2 - EMEI</option>
            <option value="3">3 - 1º ANO ENS. FUND.</option>
            <option value="4">4 - 2º ANO ENS. FUND.</option>
            <option value="5">5 - 3º ANO ENS. FUND.</option>
            <option value="6">6 - 4º ANO ENS. FUND.</option>
            <option value="7">7 - 5º ANO ENS. FUND.</option>
            <option value="8">8 - 6º ANO ENS. FUND.</option>
            <option value="9">9 - 7º ANO ENS. FUND.</option>
            <option value="10">10 - 8º ANO ENS. FUND.</option>
            <option value="11">11 - 9º ANO ENS. FUND.</option>
            <option value="12">12 - SUPLETIVO FUND.</option>
            <option value="13">13 - 1ª SÉRIE ENS. MÉD.</option>
            <option value="14">14 - 2ª SÉRIE ENS. MÉD.</option>
            <option value="15">15 - 3ª SÉRIE ENS. MÉD.</option>
            <option value="16">16 - SUPLETIVO ENS. MÉD.</option>
            <option value="17">17 - NÍVEL SUPERIOR</option>
            <option value="18">18 - MESTRADO</option>
            <option value="19">19 - DOUTORADO</option>
            <option value="99">99 - SEM INF.</option>
        </select><br><br>

            <label for="temRendaPropriaMembro${membroIndex}">Tem renda principal?</label>
            <select id="temRendaPropriaMembro${membroIndex}" name="membros[][temRendaPropria]" class="temRendaPropriaMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="rendaPropriaValorMembro${membroIndex}">Renda principal valor:</label>
            <input type="number" id="rendaPropriaValorMembro${membroIndex}" name="membros[][rendaPropriaValor]" class="rendaPropriaValorMembro"><br><br>

            <label for="haOutraFonte${membroIndex}">Há outra fonte de renda?</label>
            <select id="haOutraFonte${membroIndex}" name="membros[][haOutraFonte]" class = "haOutraFonteMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="outraRendaValorMembro${membroIndex}">Outra fonte de renda valor:</label>
            <input type="number" id="outraRendaValorMembro${membroIndex}" name="membros[][outraRendaValor]" class="outraRendaValorMembro"><br><br>

            <label for="temBeneficiosMembro${membroIndex}">Tem benefícios?</label>
            <select id="temBeneficiosMembro${membroIndex}" name="membros[][temBeneficios]" class="temBeneficiosMembro" required>
                <option value="">Selecione</option>
                <option value="1">1 - NÃO</option>
                <option value="2">2 - SIM</option>
                <option value="99">99 - SEM INF.</option>
            </select><br><br>

            <label for="beneficioValorMembro${membroIndex}">Benefícios valor:</label>
            <input type="number" id="beneficioValorMembro${membroIndex}" name="membros[][beneficioValor]" class="beneficioValorMembro"><br><br>

            <button type="button" class="remove-membro" data-membro-id="${membroId}">Remover</button>
        `;

        membrosFamiliaDiv.appendChild(membroDiv);

        const removeButton = membroDiv.querySelector('.remove-membro');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                const membroId = this.getAttribute('data-membro-id');
                removeMembro(membroId);
            });
        }

        atualizarNumerosMembros();
    }

    function removeMembro(membroId) {
        const membroDiv = document.getElementById(membroId);
        if (membroDiv) {
            const cadastroId = document.getElementById('numeroCadastro').value;

            let cadastroData = {};
            const existingDataString = localStorage.getItem(cadastroId);
            if (existingDataString) {
                cadastroData = JSON.parse(existingDataString);
            }
            if (!cadastroData['composicao-familiar']) {
                cadastroData['composicao-familiar'] = {};
            }
            if (!cadastroData['composicao-familiar'].membrosRemovidos) {
                cadastroData['composicao-familiar'].membrosRemovidos = [];
            }
            cadastroData['composicao-familiar'].membrosRemovidos.push({ id: membroId.replace('membro-', ''), deleted: true });

            localStorage.setItem(cadastroId, JSON.stringify(cadastroData));

            membroDiv.parentNode.removeChild(membroDiv);
            atualizarNumerosMembros();
        }
    }


    function atualizarNumerosMembros() {
        const membrosFamiliaDiv = document.getElementById("membros-familia");
        const membros = membrosFamiliaDiv.querySelectorAll(".membro-familia");
        membros.forEach((membro, index) => {
            const numeroMembro = membro.querySelector("h3");
            if (numeroMembro) {
                numeroMembro.textContent = `Membro ${index + 1}`;
            }
        });
    }

    const membrosFamiliaDiv = document.getElementById("membros-familia"); 
    if (membrosFamiliaDiv) { 
        membrosFamiliaDiv.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-membro')) {
                const membroId = event.target.getAttribute('data-membro-id');
                removeMembro(membroId);
            }
        });
    }


    function addViolencia() {
        hideError();
        const violenciaCamposDiv = document.getElementById('violencia-campos');
        const violenciaIndex = violenciaCamposDiv.children.length + 1;
        const violenciaId = generateViolenciaId();

        const camposDiv = document.createElement("div");
        camposDiv.classList.add("violencia-ocorrencia");
        camposDiv.setAttribute('id', `violencia-${violenciaId}`);
        camposDiv.innerHTML = `
            <h3>Ocorrência ${violenciaIndex}</h3>
<input type="hidden" class="violencia-id" name="violencia[][id]" value="${violenciaId}">

            <h4>Óbitos na Família (nos últimos 5 anos)</h4>

            <label for="idadeViolencia${violenciaIndex}">Idade:</label>
            <input type="number" class="idadeViolencia" name="violencia[][idade]" id="idadeViolencia${violenciaIndex}"><br><br>

            <label for="motivoViolencia${violenciaIndex}">Motivo:</label>
            <select class="motivoViolencia" name="violencia[][motivo]" id="motivoViolencia${violenciaIndex}">
                <option value="">Selecione</option>
                <option value="1">1 - DOENÇA</option>
                <option value="2">2 - COVID</option>
                <option value="3">3 - ACIDENTE</option>
                <option value="4">4 - VIOLÊNCIA</option>
                <option value="5">5 - OUTRO</option>
            </select><br><br>

            <label for="outroMotivoViolencia${violenciaIndex}">Outro Motivo:</label>
            <input type="text" class="outroMotivoViolencia" name="violencia[][outroMotivo]" id="outroMotivoViolencia${violenciaIndex}"><br><br>

            <label for="anoOcorridoViolencia${violenciaIndex}">Ano do Ocorrido:</label>
            <input type="number" class="anoOcorridoViolencia" name="violencia[][anoOcorrido]" id="anoOcorridoViolencia${violenciaIndex}"><br><br>

            <button type="button" class="remove-violencia" data-violencia-id="${violenciaId}">Remover</button>
        `;

        violenciaCamposDiv.appendChild(camposDiv);

        const removeButton = camposDiv.querySelector('.remove-violencia');
        if(removeButton){
          removeButton.addEventListener('click', function() {
              const violenciaId = this.getAttribute('data-violencia-id');
              removeViolencia(violenciaId);
          });
        }


        atualizarNumerosViolencia();
    }

    function generateViolenciaId() {
        return 'violencia-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function atualizarNumerosViolencia() {
        const violenciaCamposDiv = document.getElementById("violencia-campos");
        const ocorrencias = violenciaCamposDiv.querySelectorAll(".violencia-ocorrencia");
        ocorrencias.forEach((ocorrencia, index) => {
            const numeroOcorrencia = ocorrencia.querySelector("h3"); 
            if (numeroOcorrencia) {
                numeroOcorrencia.textContent = `Ocorrência ${index + 1}`;
            }
        });
    }

    function removeViolencia(violenciaId) {
    const violenciaDiv = document.getElementById(`violencia-${violenciaId}`);
    if (violenciaDiv) {
        const cadastroId = document.getElementById('numeroCadastro').value;

        let cadastroData = {};
        const existingDataString = localStorage.getItem(cadastroId);
        if (existingDataString) {
            cadastroData = JSON.parse(existingDataString);
        }

        if (!cadastroData['violencia']) {
            cadastroData['violencia'] = {};
        }

        if (!cadastroData['violencia'].ocorrenciasRemovidas) {
            cadastroData['violencia'].ocorrenciasRemovidas = [];
        }
        cadastroData['violencia'].ocorrenciasRemovidas.push({ id: violenciaId, deleted: true });

        localStorage.setItem(cadastroId, JSON.stringify(cadastroData));

        violenciaDiv.parentNode.removeChild(violenciaDiv);

        atualizarNumerosViolencia();
    }
  }

  // --- FUNÇÕES DE AUTOSAVE E ENVIO ---

  function handleAutoSave(sectionNumber) {
    hideError();
    const section = sectionNumberToName[sectionNumber];
    console.log("Section Number:", sectionNumber);
    console.log("Section Name:", section);

    if (section === 'dados-responsaveis') {
        const cpfResponsavel1 = document.getElementById('cpfResponsavel1').value;
        const cpfTutorResponsavel1 = document.getElementById('cpfTutorResponsavel1').value;
        const cpfResponsavel2 = document.getElementById('cpfResponsavel2').value;
        const cpfTutorResponsavel2 = document.getElementById('cpfTutorResponsavel2').value;
        const cnpjCpfFontePagadoraResponsavel1 = document.getElementById('cnpjCpfFontePagadoraResponsavel1').value;
        const cnpjCpfFontePagadoraResponsavel2 = document.getElementById('cnpjCpfFontePagadoraResponsavel2').value;


        if (cpfResponsavel1 && !validarCPF(cpfResponsavel1)) {
            showError('CPF do Primeiro Responsável inválido.');
            return;
        }
        if (cpfTutorResponsavel1 && !validarCPF(cpfTutorResponsavel1)) {
            showError('CPF do Tutor do Primeiro Responsável inválido.');
            return;
        }
        if (cpfResponsavel2 && !validarCPF(cpfResponsavel2)) {
            showError('CPF do Segundo Responsável inválido.');
            return;
        }
        if (cpfTutorResponsavel2 && !validarCPF(cpfTutorResponsavel2)) {
            showError('CPF do Tutor do Segundo Responsável inválido.');
            return;
        }
        if(cnpjCpfFontePagadoraResponsavel1 && cnpjCpfFontePagadoraResponsavel1.length === 14){
            if(!validarCNPJ(cnpjCpfFontePagadoraResponsavel1)){
                showError('CNPJ da fonte pagadora do Primeiro Responsável é inválido.');
                return;
            }
        }
        if(cnpjCpfFontePagadoraResponsavel1 && cnpjCpfFontePagadoraResponsavel1.length === 11){
            if(!validarCPF(cnpjCpfFontePagadoraResponsavel1)){
                showError('CPF da fonte pagadora do Primeiro Responsável é inválido.');
                return;
            }
        }

        if(cnpjCpfFontePagadoraResponsavel2 && cnpjCpfFontePagadoraResponsavel2.length === 14){
            if(!validarCNPJ(cnpjCpfFontePagadoraResponsavel2)){
                showError('CNPJ da fonte pagadora do Segundo Responsável é inválido.');
                return;
            }
        }
        if(cnpjCpfFontePagadoraResponsavel2 && cnpjCpfFontePagadoraResponsavel2.length === 11){
            if(!validarCPF(cnpjCpfFontePagadoraResponsavel2)){
                showError('CPF da fonte pagadora do Segundo Responsável é inválido.');
                return;
            }
        }
    }

    if (!section) {
        console.error('Seção desconhecida:', sectionNumber);
        return;
    }

    const form = document.getElementById(`form-section-${sectionNumber}`);
    const formData = new FormData(form);
    const cadastroId = document.getElementById('numeroCadastro').value;

    let cadastroData = {};
    const existingDataString = localStorage.getItem(cadastroId);
    if (existingDataString) {
        cadastroData = JSON.parse(existingDataString);
    }

    if (!cadastroData[section]) {
        cadastroData[section] = {};
    }

    if (cadastroId && !cadastroData[section]['cadastroId']) {
        cadastroData[section]['cadastroId'] = cadastroId;
    }


    let currentData = {}; 

    if (section === 'composicao-familiar') {
        const membrosFamiliaDiv = document.getElementById("membros-familia");
        const membros = [];
        for (let i = 0; i < membrosFamiliaDiv.children.length; i++) {
            const membroDiv = membrosFamiliaDiv.children[i];
            const membroIdElement = membroDiv.querySelector('.membro-id');
            const membroId = membroIdElement ? membroIdElement.value : generateMemberId();
            const nome = membroDiv.querySelector(`.nomeMembro`).value;
            const idade = membroDiv.querySelector(`.idadeMembro`).value;
            const genero = membroDiv.querySelector(`.generoMembro`).value;
            const posicao = membroDiv.querySelector(`.posicaoMembro`).value;
            const situacaoOcupacional = membroDiv.querySelector(`.situacaoOcupacionalMembro`).value;
            const estadoCivil = membroDiv.querySelector(`.estadoCivilMembro`).value;
            const grupoEtnico = membroDiv.querySelector(`.grupoEtnicoMembro`).value;
            const pne = membroDiv.querySelector(`.pneMembro`).value;
            const cid = membroDiv.querySelector(`.cidMembro`).value;
            const espectroAutista = membroDiv.querySelector(`.espectroAutistaMembro`).value;
            const temCancer = membroDiv.querySelector(`.temCancerMembro`).value;
            const gestante = membroDiv.querySelector(`.gestanteMembro`).value;
            const profissao = membroDiv.querySelector(`.profissaoMembro`).value;
            const frequentaEscola = membroDiv.querySelector(`.frequentaEscolaMembro`).value;
            const cursoQueFrequenta = membroDiv.querySelector(`.cursoQueFrequentaMembro`).value; 
            const estudouAte = membroDiv.querySelector(`.estudouAteMembro`).value; 
            const temRendaPropria = membroDiv.querySelector(`.temRendaPropriaMembro`).value;
            const rendaPropriaValor = membroDiv.querySelector(`.rendaPropriaValorMembro`).value;
            const haOutraFonte = membroDiv.querySelector(`.haOutraFonteMembro`).value; 
            const outraRendaValor = membroDiv.querySelector(`.outraRendaValorMembro`).value; 
            const temBeneficios = membroDiv.querySelector(`.temBeneficiosMembro`).value;
            const beneficioValor = membroDiv.querySelector(`.beneficioValorMembro`).value;


            membros.push({
                id: membroId,
                nome: nome,
                idade: idade,
                genero: genero,
                posicao: posicao,
                situacaoOcupacional: situacaoOcupacional,
                estadoCivil: estadoCivil,
                grupoEtnico: grupoEtnico,
                pne: pne,
                cid: cid,
                espectroAutista: espectroAutista,
                temCancer: temCancer,
                gestante: gestante,
                profissao: profissao,
                frequentaEscola: frequentaEscola,
                cursoQueFrequenta: cursoQueFrequenta,
                estudouAte: estudouAte,
                temRendaPropria: temRendaPropria,
                rendaPropriaValor: rendaPropriaValor,
                haOutraFonte: haOutraFonte,
                outraRendaValor: outraRendaValor,
                temBeneficios: temBeneficios,
                beneficioValor: beneficioValor
            });
        }

        currentData['listaMembros'] = [cadastroId];
        for (let membro of membros) {
            currentData['listaMembros'].push(
                membro.nome,
                membro.idade,
                membro.genero,
                membro.posicao,
                membro.situacaoOcupacional,
                membro.estadoCivil,
                membro.grupoEtnico,
                membro.pne,
                membro.cid,
                membro.espectroAutista,
                membro.temCancer,
                membro.gestante,
                membro.profissao,
                membro.frequentaEscola,
                membro.cursoQueFrequenta,
                membro.estudouAte,
                membro.temRendaPropria,
                membro.rendaPropriaValor,
                membro.haOutraFonte,
                membro.outraRendaValor,
                membro.temBeneficios,
                membro.beneficioValor
            );
        }
        cadastroData[section] = { 'membros': membros, 'listaMembros': currentData['listaMembros'] };

    } else if (section === 'violencia') {
        const violenciaCamposDiv = document.getElementById("violencia-campos");
        const ocorrencias = [];

        for (let i = 0; i < violenciaCamposDiv.children.length; i++) {
            const ocorrenciaDiv = violenciaCamposDiv.children[i];
            const ocorrenciaIdElement = ocorrenciaDiv.querySelector('[class^="violencia-id"]');
            const ocorrenciaId = ocorrenciaIdElement ? ocorrenciaIdElement.value : generateViolenciaId();
            const idade = ocorrenciaDiv.querySelector(`[class^="idadeViolencia"]`).value;
            const motivo = ocorrenciaDiv.querySelector(`[class^="motivoViolencia"]`).value;
            const outroMotivo = ocorrenciaDiv.querySelector(`[class^="outroMotivoViolencia"]`).value;
            const anoOcorrido = ocorrenciaDiv.querySelector(`[class^="anoOcorridoViolencia"]`).value;

            ocorrencias.push({
                id: ocorrenciaId,
                idade: idade,
                motivo: motivo,
                outroMotivo: outroMotivo,
                anoOcorrido: anoOcorrido
            });
        }

        currentData['ocorrencias'] = ocorrencias;
        cadastroData[section] = { ocorrencias: ocorrencias };

        const leiMariaPenha = document.getElementById("leiMariaPenha").value;
        cadastroData[section]['leiMariaPenha'] = leiMariaPenha; 
        currentData['leiMariaPenha'] = leiMariaPenha;

    }
    else {
        for (const [key, value] of formData.entries()) {
             currentData[key] = value;
        }
       cadastroData[section] = currentData;
    }


    const storedData = JSON.parse(localStorage.getItem(cadastroId) || '{}')[section] || {};
    const isEqual = deepEqual(storedData, currentData);

    if (!isEqual) {
        console.log("Dados da seção", sectionNumber, "foram alterados. Agendando para salvamento...");
        console.log("Dados armazenados (storedData):", storedData);
        console.log("Dados atuais (currentData):", currentData);

        localStorage.setItem(cadastroId, JSON.stringify(cadastroData));


    } else {
        console.log("Dados da seção", sectionNumber, "não foram alterados. Salvamento ignorado.");
    }
}


  function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true; 

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false; 
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false; 

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;

function sendBatchedRequests() {
    if (!isUserLoggedIn()) {
        console.log('Usuário não está logado.');
        window.location.href = 'login.html';
        return;
    }

    const sectionsToSend = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("COPA-")) {
            const cadastroData = JSON.parse(localStorage.getItem(key));

            for (const sectionName in cadastroData) {
                if (cadastroData.hasOwnProperty(sectionName)) {
                    if (sectionName != "membrosRemovidos" && sectionName != "ocorrenciasRemovidas") { 
                        const sectionData = cadastroData[sectionName];
                        const sectionNumber = Object.keys(sectionNumberToName).find(key => sectionNumberToName[key] === sectionName);

                        if (sectionNumber) {
                            sectionsToSend.push({
                                cadastroId: key,
                                section: sectionName,
                                data: sectionData,
                                sectionNumber: parseInt(sectionNumber)
                            });
                        }
                    }
                }
            }
        }
    }

    if (sectionsToSend.length === 0) {
        console.log("Nenhuma seção para salvar.");
        return;
    }

    const batchedData = {
        sections: sectionsToSend
    };

    console.log("Enviando requisições em lote:", batchedData);

    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Token de autenticação não encontrado.');
        alert('Você não está autenticado.  Redirecionando para o login.');
        logout();
        return;
    }

    fetch('https://southamerica-east1-gta-banco.cloudfunctions.net/salvarDadosSocioeconomicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify(batchedData),
        })
        .then((response) => {
            console.log("Resposta da Cloud Function:", response);

            if (!response.ok) {
                if (response.status === 403) {
                    alert("Sua sessão expirou. Por favor, faça login novamente.");
                    logout();
                    return;
                } else {
                    return response.text().then(text => {
                      let errorMessage = text;
                       try {
                         const data = JSON.parse(text);
                         errorMessage = data.message || 'Erro desconhecido';
                       } catch (parseError) {
                       }
                        throw new Error(`Erro HTTP ${response.status}: ${errorMessage}`);
                    });
                }
            }
            return response.json();
        })
        .then((result) => {
            console.log('Sucesso:', result);
            if (result.status === 'success') {
                console.log("Lote salvo com sucesso!");
                result.results.forEach(res => {
                    if (res.status === 'success') {
                        const cadastroId = res.message.includes("Seção atualizada") || res.message.includes("Seção inserida") ? sectionsToSend.find(s => s.sectionNumber === res.section).cadastroId : null;
                        if (cadastroId) {
                            let cadastroData = JSON.parse(localStorage.getItem(cadastroId));
                            if (cadastroData) {
                                const sectionName = sectionNumberToName[res.section];
                                if (cadastroData[sectionName]) {
                                    delete cadastroData[sectionName] 
                                    localStorage.setItem(cadastroId, JSON.stringify(cadastroData)); 

                                }
                            }
                        }
                    }
                });


            } else {
                console.error("Erro ao salvar lote:", result.message, "Detalhes:", result.results);
                if (result.results && Array.isArray(result.results)) {
                    result.results.forEach(error => {
                        if (error.status === 'error') {
                            console.error(`Erro na seção ${error.section}: ${error.message}`);
                            const errorMessageDiv = document.getElementById(`mensagem-${sectionNumberToName[error.section]}`);
                            if (errorMessageDiv) {
                                errorMessageDiv.textContent = `Erro ao salvar: ${error.message}`;
                                errorMessageDiv.classList.add('erro');
                                errorMessageDiv.style.display = 'block';
                            }
                        }
                    });
                }
            }
        })
      .catch((error) => {
        console.error('Erro:', error);
        showError(`Erro de comunicação com o servidor: ${error.message}`);

        sectionsToSend.forEach(section => {
            let cadastroData = JSON.parse(localStorage.getItem(section.cadastroId) || '{}');
            cadastroData[section.section] = section.data;
            localStorage.setItem(section.cadastroId, JSON.stringify(cadastroData));
        });
    });
}


  document.querySelectorAll('.save-button').forEach(button => {
      button.addEventListener('click', sendBatchedRequests);
  });

  //Função que encerra a sessão do usuário
  function finalizarCadastro(){
    const cadastroId = document.getElementById('numeroCadastro').value; 

    if (cadastroId) {
        sendBatchedRequests();
    }

    alert("Cadastro finalizado com sucesso!");
    openTab('dashboard');
  }

  // --- Outras Funções---

  function carregarCadastro(cadastroId) {
    hideError();
    const token = localStorage.getItem('authToken');

    fetch('https://southamerica-east1-gta-banco.cloudfunctions.net/salvarDadosSocioeconomicos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'get_cadastro', cadastroId: cadastroId })
    })
    .then(response => {
        if (!response.ok) {
            if(response.status === 403) {
                alert("Sessão expirada. Redirecionando para login.");
                logout();
                return;
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const cadastroData = data.cadastro;


            const forms = document.querySelectorAll(".form-section");
            forms.forEach(form => {

              if(form.id === 'form-section-5') {
                const membrosFamiliaDiv = document.getElementById("membros-familia");
                membrosFamiliaDiv.innerHTML = '';
              }
              if(form.id === 'form-section-13') {
                const violenciaCamposDiv = document.getElementById('violencia-campos');
                violenciaCamposDiv.innerHTML = '';
              }

                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (input.id !== 'numeroCadastro' && input.id !== 'projeto') {
                        if (input.type === 'radio' || input.type === 'checkbox') {
                            input.checked = false;
                        } else if (input.type !== 'button') {
                            input.value = '';
                        }
                    }
                });
            });

            for (let i = 1; i <= totalPages; i++) {
                const sectionName = sectionNumberToName[i];
                const form = document.getElementById(`form-section-${i}`);

                if (form) {
                    const sectionData = cadastroData[sectionName];
                        if (sectionData) {
                        const inputs = form.querySelectorAll('input, select, textarea');
                        inputs.forEach(input => {
                            if(input.name === 'membros[][id]'){
                                const membros = sectionData.membros || [];
                                membros.forEach((membro, index) => {
                                    addMembro();
                                    const membroDiv = document.getElementById("membros-familia").children[index];
                                    for (const key in membro) {
                                        const inputField = membroDiv.querySelector(`.${key}Membro`);
                                        if (inputField) {
                                          inputField.value = membro[key] || '';
                                        }
                                    }
                                });
                            }
                            else if (input.name === 'violencia[][id]'){
                                const ocorrencias = sectionData.ocorrencias || [];
                                ocorrencias.forEach(ocorrencia => {
                                    addViolencia();
                                    const ocorrenciaDiv = document.getElementById('violencia-campos').lastElementChild;
                                    for(const key in ocorrencia){
                                      const inputField = ocorrenciaDiv.querySelector(`.${key}Violencia`);
                                      if (inputField) {
                                        inputField.value = ocorrencia[key] || '';
                                      }
                                    }
                                })

                            }
                            else if (input.name === 'violencia[leiMariaPenha]') {
                                input.value = sectionData.leiMariaPenha || '';
                            }

                            else if (sectionData.hasOwnProperty(input.name)) {
                                    if (Array.isArray(sectionData[input.name])) {
                                    if (input.type === 'checkbox') {
                                        input.checked = sectionData[input.name].includes(input.value);
                                    } else {
                                        input.value = sectionData[input.name].join(', ');
                                    }
                                    } else {
                                    if (input.type === 'checkbox' || input.type === 'radio') {
                                        input.checked = sectionData[input.name] === input.value;
                                    }
                                      else{
                                        input.value = sectionData[input.name] || '';
                                      }
                                    }
                            }
                        });

                            if (sectionName === 'identificadores') {
                                const numeroCadastroInput = document.getElementById('numeroCadastro');
                                if (numeroCadastroInput) {
                                    numeroCadastroInput.value = cadastroId;
                                    numeroCadastroInput.disabled = true;
                                }
                                const cadastroIdInput = document.getElementById('cadastroId');
                                if (cadastroIdInput) {
                                    cadastroIdInput.value = cadastroId;
                                }
                            }
                        }
                }
            }

            openTab('cadastro');
            showPage(1);

        } else {
            console.error('Erro ao carregar cadastro:', data.message);
            alert('Erro ao carregar cadastro.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao carregar cadastro. Por favor, tente novamente.');
    });
  }

  function displayCadastroList() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const listaCadastros = document.getElementById('lista-cadastros');
    listaCadastros.innerHTML = '';

    const searchInput = document.getElementById('search-input').value.toLowerCase();

    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Token de autenticação não encontrado.');
        alert('Você não está autenticado.');
        logout();
        return;
    }

    fetch('https://southamerica-east1-gta-banco.cloudfunctions.net/salvarDadosSocioeconomicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({ action: 'get_cadastros' })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    alert("Sessão expirada. Redirecionando para login.");
                    logout();
                    return;
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                const cadastros = data.cadastros.filter(cadastro => {
                    return cadastro.cadastroId.toLowerCase().includes(searchInput) ||
                        (cadastro.projeto && cadastro.projeto.toLowerCase().includes(searchInput)) ||
                        (cadastro.nomeCompleto && cadastro.nomeCompleto.toLowerCase().includes(searchInput));
                });

                cadastros.forEach(cadastro => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
        Cadastro: ${cadastro.cadastroId} - Projeto: ${cadastro.projeto || 'N/A'} - Nome Completo: ${cadastro.nomeCompleto || 'N/A'}
        <button class="view-button">Visualizar</button>
        ${isAdmin() ? `<button class="delete-button"><i class="fas fa-trash-alt"></i></button>` : ''}
    `;

                    const viewButton = listItem.querySelector('.view-button');
                    viewButton.addEventListener('click', () => {
                        hideError();
                        openTab('cadastro');
                        carregarCadastro(cadastro.cadastroId);
                    });

                    if (isAdmin()) {
                        const deleteButton = listItem.querySelector('.delete-button');
                        deleteButton.addEventListener('click', () => {
                            deletarCadastro(cadastro.cadastroId);
                        });
                    }

                    listaCadastros.appendChild(listItem);
                });

                if (cadastros.length === 0) {
                    const listItem = document.createElement('li');
                    listItem.textContent = "Nenhum cadastro encontrado.";
                    listaCadastros.appendChild(listItem);
                }
            } else {
                console.error('Erro ao obter a lista de cadastros:', data.message);
                alert('Erro ao obter a lista de cadastros. Verifique o console para mais detalhes.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showError('Erro ao fazer a requisição. Verifique o console para mais detalhes.'); // Usa showError
        });
  }


  function getSheetData(callback) {
    if (!isAdmin()) {
        alert("Acesso não autorizado para estatísticas.");
        openTab('dashboard');
        return;
    }

    const token = localStorage.getItem('authToken');

    fetch('https://southamerica-east1-gta-banco.cloudfunctions.net/salvarDadosSocioeconomicos?action=getStats', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403){
                alert("Acesso não autorizado para estatísticas.");
                openTab('dashboard'); 
                return; 
            }
            throw new Error('Erro na requisição: ' + response.status); 
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            callback(data.data);
        } else {
            console.error('Erro ao obter dados da planilha:', data.message);
        }
    })
    .catch(error => {
        console.error('Erro na requisição:', error);
    });
  }

  function createAgeChart(idades) {
    const ctx = document.getElementById('idadeChart').getContext('2d');
    if (!Array.isArray(idades) || idades.length === 0) {
      console.warn("Dados de idade inválidos ou vazios:", idades);
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
          labels: idades.map(String),
          datasets: [{
              label: 'Distribuição de Idades',
              data: idades,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          },
          plugins: {
              legend: {
                display: false
              }
          }
      }
    });
  }

  function createSituacaoOcupacionalChart(situacoes) {
    const ctx = document.getElementById('situacaoOcupacionalChart').getContext('2d');
    const labels = Object.keys(situacoes);
    const data = Object.values(situacoes);

    if (labels.length === 0) {
        console.warn("Dados de situação ocupacional vazios.");
        return;
    }

    new Chart(ctx, {
      type: 'pie',
      data: {
          labels: labels,
          datasets: [{
              label: 'Situação Ocupacional',
              data: data,
              backgroundColor: [
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(153, 102, 255, 0.5)',
                  'rgba(255, 159, 64, 0.5)'
              ],
              borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
          }]
      },
      options: {
          plugins: {
              legend: {
                  display: true, 
                  position: 'bottom'
              }
          }
      }
    });
  }


  function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);

      const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset()*60000));

      const day = String(adjustedDate.getDate()).padStart(2, '0');
      const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const year = adjustedDate.getFullYear();
      return `${day}/${month}/${year}`;
    }

    function formatTime(timeString) {
      if (!timeString) return '';
      return timeString;
    }


  function novoCadastro() {
      if (!isAdmin()) {
        alert("Acesso não autorizado.");
        return;
      }
        const forms = document.querySelectorAll(".form-section");
        forms.forEach(form => {

        if (form.id === 'form-section-5'){
            const membrosFamiliaDiv = document.getElementById("membros-familia");
            membrosFamiliaDiv.innerHTML = ''; 

        }
        if(form.id === 'form-section-13'){
            const violenciaCamposDiv = document.getElementById('violencia-campos');
            violenciaCamposDiv.innerHTML = '';
        }
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.id !== 'numeroCadastro' && input.id !== 'projeto') { 
                if (input.type === 'radio' || input.type === 'checkbox') {
                    input.checked = false;
                } else if (input.type !== 'button') {
                    input.value = '';
                }
            }
        });

        });

        const novoId = generateCustomId();

        const numeroCadastroInput = document.getElementById('numeroCadastro');
        if (numeroCadastroInput && !numeroCadastroInput.value) {
        numeroCadastroInput.value = novoId;
        numeroCadastroInput.disabled = true;


        const cadastroIdInput = document.getElementById('cadastroId');
          if (cadastroIdInput) {
              cadastroIdInput.value = novoId;
          }
        }


        const cadastradorInput = document.getElementById('cadastrador');
        if (cadastradorInput) {
        const userData = JSON.parse(localStorage.getItem('userData'));
          if(userData) {
            cadastradorInput.value = userData.username || '';
            cadastradorInput.readOnly = true;

          }

        }

        const dataVisitaInput = document.getElementById('dataVisita');
        const horaVisitaInput = document.getElementById('horaVisita');
        if (dataVisitaInput && horaVisitaInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');

        dataVisitaInput.value = `${year}-${month}-${day}`;
        horaVisitaInput.value = `${hours}:${minutes}`;
        }

        openTab('cadastro');
        showPage(1);
    }


    function deletarCadastro(cadastroId) {
    if (confirm(`Tem certeza que deseja deletar o cadastro ${cadastroId}?`)) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('Token de autenticação não encontrado.');
            alert('Você não está autenticado. Redirecionando para o login.');
            logout();
            return;
        }

        // Cloud function
        fetch('https://southamerica-east1-gta-banco.cloudfunctions.net/salvarDadosSocioeconomicos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token, // Importante para o CORS
                },
                body: JSON.stringify({
                    cadastroId: cadastroId,
                    action: 'delete' // Define a ação como 'delete'
                }),
            })
            .then((response) => {
                if (!response.ok) {
                    if (response.status === 403) {
                        alert("Sessão expirada. Redirecionando para login.");
                        logout();
                        return;
                    }
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then((result) => {
                console.log('Resposta da Cloud Function:', result);
                if (result.status === 'success') {
                    alert(`Cadastro ${cadastroId} deletado com sucesso!`);
                    localStorage.removeItem(cadastroId); 
                    displayCadastroList(); 
                } else {
                    alert(`Erro ao deletar cadastro ${cadastroId}: ${result.message}`);
                }
            })
            .catch((error) => {
                console.error('Erro:', error);
                showError(`Erro ao deletar cadastro ${cadastroId}. Por favor, tente novamente.`); 

            });
      }
    }

    function finalizarCadastro(){
        sendBatchedRequests();
        alert("Cadastro finalizado com sucesso!");
        openTab('dashboard');
    }

  })