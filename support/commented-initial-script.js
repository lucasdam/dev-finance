const Modal = { // Objeto para manipular o modal.
    open() {
        document
            .querySelector('.modal-overlay')
            .classList
            .add('active') // Adiciona a class 'active', mostrando o modal.
    },
    close() {
        document
            .querySelector('.modal-overlay')
            .classList
            .remove('active') // Remove a class 'active', escondendo o modal.
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem('dev.finances:transactions')) || [] // Pega um item do localStorage. Se não tiver nenhum chave dessa dev.finances:transactions no localStorage, retorna um array vazio
        // Setei como string, mas quando for preciso pegar de volta, tem que estar como array novamente. O parse transforma de string para array/objeto
    },

    set(transactions) {
        localStorage.setItem('dev.finances:transactions', JSON.stringify(transactions)) // setItem para guardar no localStorage, dev.finan... nome que escolho para identificar, objeto JSON e funcionalidade stringfy para transformar meu array transactions em string
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction) {
        Transaction.all.push(transaction)

        App.reload()
    },

    remove(index) {
        Transaction.all.splice(index, 1)

        App.reload()
    },

    incomes() { // Para cada transação, se ela for MAIOR que 0, soma a INCOME e retorna essa variável
        let income = 0

        Transaction.all.forEach(transaction => {
            if (transaction.amount > 0) {
                income += transaction.amount
            }
        })

        return income
    },

    expenses() { // Para cada transação, se ela for MENOR que 0, soma a EXPENSE e retorna essa variável
        let expense = 0

        Transaction.all.forEach(transaction => {
            if (transaction.amount < 0) {
                expense += transaction.amount
            }
        })

        return expense
    },
    
    total() { // incomes + expenses pois já tem o sinal de - em expenses, e + com - = -
        return Transaction.incomes() + Transaction.expenses()
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'), // Armazena todo o tbody, tag no HTML que é pai das tr

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index
        DOM.transactionsContainer.appendChild(tr) // Torna as tr (que mostram as transações na tela) filhas de tbody (que chamo de transactionsContainer)
    },

    innerHTMLTransaction(transaction, index) { // Retorna a const html que armazena todas as td (contando descrição, valor e data) da tr
        const CSSclass = transaction.amount >= 0 ? 'income' : 'expense' // Se o valor for >= 0 (valor positivo), retorna income, se não, retorna expense

        const amount = Utils.formatCurrency(transaction.amount)

        const html = `
        <td class="description">${transaction.description}</td>
        <td class=${CSSclass}>${amount}</td>
        <td class="date">${transaction.date}</td>
        <td>
            <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
        </td>
        `

        return html
    },

    updateBalance() { // Atualiza os valores de Balanço (entradas, saídas e total) formatando-os
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = '' // Deixa o tbody vazio
    }
}

const Utils = { // Objeto com algumas "ferramentas" úteis
    formatAmount(value) { // Transforma em number e multiplica por 100 para eliminar ponto ou vírgula: Ex: 8,00 -> 800
        value = Number(value.replace(/\,\./g, '' )) * 100

        return value
    },

    formatDate(date) { // Usa o split para separar dia, mês e ano. O separador é o -. Esse split transforma os valores separados em elementos de um array, que serão retornados na ordem de data correta.
        const splittedDate = date.split('-')

        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },

    formatCurrency(value) { // Função para formatar valores (ponto, vírgula, sinal...)
        const signal = Number(value) < 0 ? '-' : '' // Transforma o que vier como argumento em número, e se for menor que 0, retorna o sinal de - (menos), senaõ, retorna vazio
        value = String(value).replace(/\D/g, '') // Transforma o que vier em value em String. Regex para pegar só os números, sem símbolos ou sinais.
        value = Number(value) / 100 // Pega o que vier de value, transforma em Number e divide por 100. (O que estava como, 1054 será agora 10.54)
        value = value.toLocaleString('pt-BR', { // Localização português-Brasil
            style: 'currency', // Define o estilo como moeda
            currency: 'BRL' // Que tipo de moeda? Real brasileiro. Vai colocar o R$ e substituir . por ,
        })

        return signal + value // Retorna o sinal e o valor (tudo formatado)
    }
}

/* RegEx:
    - O que está entre as barras / / define a expressão regular 
    - O \D serve para achar só números
    - O g (global) serve para pegar não apenas o primeiro elemento encontrado pela expressão, mas os repetidos também
*/

const Form = {
    description: document.querySelector('input#description'), // Pega o conteúdo HTML inteiro
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() { // Pega apenas o valor do conteúdo do HTML
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    validateFields() {
        const { description, amount, date } = Form.getValues() // Desestruturação

        // trim faz uma limpeza de espaços vazios na string. Verifica se description ou amount ou date estão vazios.
        if (description.trim() === '' || amount.trim() === '' || date.trim() === '') {
            throw new Error('Por favor, preencha todos os campos.')
        }
    },

    formatValues() { // Pega os valores de cada elemento e chama seus formatadores. Retorna os valores do formulário já formatados.
        let { description, amount, date } = Form.getValues()

        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)
        
        return { description, amount, date }
    },

    clearFields() { // Irá ser chamado após o usuário salvar um formulário preenchido. Serve para apagar os campos.
        Form.description.value = ''
        Form.amount.value = ''
        Form.date.value = ''
    },

    submit(event) {
        event.preventDefault()

        try {
            Form.validateFields()
            const transaction = Form.formatValues()
            Transaction.add(transaction) // Salva a transação. Nesse .add já tem um App.reload() para atualizar as transações
            Form.clearFields()
            Modal.close() // Chama o método que irá fechar o modal
        } catch (error) {
            alert(error.message)       
        }
    }
}

const App = {
    init() {
        Transaction.all.forEach((transaction, index) => { // Para cada elemento (que chamo de 'transaction') dentro do array transactions, roda a funcionalidade addTransaction que adiciona a transação do momento.
            DOM.addTransaction(transaction, index)
        })
        // Ou Transaction.all.forEach(DOM.addTransaction)

        DOM.updateBalance() /* Atualiza a DOM */

        Storage.set(Transaction.all) /* Atualiza onde está sendo guardado os dados */
    },

    reload() {
        DOM.clearTransactions() // Chama esse método para limpar as transações. Dessa forma não irá repetir transações na hora que chamar o init novamente (que popula o tbody)
        
        App.init()
    }
}

App.init()

/* transactions

[
    {
        description: 'Luz',
        amount: -50001,
        date: '23/01/2021'
    },
    {
        description: 'Criação website',
        amount: 500000,
        date: '23/01/2021'
    },
    {
        description: 'Internet',
        amount: -20012,
        date: '23/01/2021'
    },
    {
        description: 'App desenvolvido',
        amount: 200000,
        date: '30/01/2021'
    }
],
*/