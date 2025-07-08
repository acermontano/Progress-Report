// Helper function to display messages instead of alert()
function showMessage(message, type = 'info') {
    const messageDisplay = document.getElementById('message-display');
    if (messageDisplay) {
        messageDisplay.textContent = message;
        messageDisplay.className = `message-box ${type}`; // Add type for styling (e.g., 'error', 'success')
        messageDisplay.style.display = 'block';
        setTimeout(() => {
            messageDisplay.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    } else {
        console.log(`Message: ${message}`); // Fallback for debugging if element not found
    }
}

// Helper function to generate distinct colors for the pie chart
function generateColors(numColors) {
    const colors = [];
    const baseHue = Math.floor(Math.random() * 360); // Start with a random hue
    for (let i = 0; i < numColors; i++) {
        // Distribute hues evenly around the color wheela
        const hue = (baseHue + (i * (360 / numColors))) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`); // Use HSLA for better control over vibrancy and transparency
    }
    return colors;
}

// Global variables for chart instances
let myPieChart;
let monthlyChart;

// Function to update the pie chart (for expenses by category)
function updatePieChart() {
    const ctx = document.getElementById('myPieChart');
    if (!ctx) {
        // console.error("Pie chart canvas element not found!"); // This is expected if on SPENDIFYpage.html
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Aggregate spending by category for expenses only
    const categorySpending = {};
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            if (categorySpending[transaction.category]) {
                categorySpending[transaction.category] += transaction.amount;
            } else {
                categorySpending[transaction.category] = transaction.amount;
            }
        }
    });

    const labels = Object.keys(categorySpending);
    const data = Object.values(categorySpending);
    const backgroundColors = generateColors(labels.length);

    // If a chart instance already exists, update its data
    if (myPieChart) {
        myPieChart.data.labels = labels;
        myPieChart.data.datasets[0].data = data;
        myPieChart.data.datasets[0].backgroundColor = backgroundColors;
        myPieChart.update();
    } else {
        // Otherwise, create a new chart instance
        myPieChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow canvas to resize freely
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff' // White color for legend text
                        }
                    },
                    title: {
                        display: true,
                        text: 'Spending Breakdown by Category',
                        color: '#ffffff' // White color for title
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += 'PHP ' + context.parsed.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Function to update the monthly spending comparison chart (Income vs. Expense)
function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) {
        // console.error("Monthly chart canvas element not found!"); // This is expected if on SPENDIFYpage.html
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Aggregate income and expenses by month
    const monthlyData = {}; // { 'YYYY-MM': { income: 0, expense: 0 } }
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!monthlyData[yearMonth]) {
            monthlyData[yearMonth] = { income: 0, expense: 0 };
        }

        if (transaction.type === 'income') {
            monthlyData[yearMonth].income += transaction.amount;
        } else if (transaction.type === 'expense') {
            monthlyData[yearMonth].expense += transaction.amount;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyIncomes = sortedMonths.map(month => monthlyData[month].income);
    const monthlyExpenses = sortedMonths.map(month => monthlyData[month].expense);

    if (monthlyChart) {
        monthlyChart.data.labels = sortedMonths;
        monthlyChart.data.datasets[0].data = monthlyIncomes;
        monthlyChart.data.datasets[1].data = monthlyExpenses;
        monthlyChart.update();
    } else {
        monthlyChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyIncomes,
                        backgroundColor: 'rgba(29, 185, 84, 0.8)', // Green for income
                        borderColor: 'rgba(29, 185, 84, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: monthlyExpenses,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red for expenses
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Income vs. Expenses',
                        color: '#ffffff'
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return 'PHP ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
}


// Function to render transactions in the list
function renderTransactions(filterCategory = 'all', filterType = 'all') {
    const transactionList = document.getElementById('transaction-list');
    if (!transactionList) return; // Exit if element not found (e.g., on SPENDIFYpage.html)

    transactionList.innerHTML = '';
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const filteredTransactions = transactions.filter(transaction => {
        const categoryMatch = filterCategory === 'all' || transaction.category === filterCategory;
        const typeMatch = filterType === 'all' || transaction.type === filterType;
        return categoryMatch && typeMatch;
    });

    // Sort transactions by date, newest first
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No transactions yet.';
        transactionList.appendChild(listItem);
    } else {
        filteredTransactions.forEach((transaction, index) => {
            const listItem = document.createElement('li');
            const sign = transaction.type === 'expense' ? '-' : '+';
            const amountColor = transaction.type === 'expense' ? 'red' : '#1DB954'; // Red for expense, green for income

            // Find the original index for deletion (important after filtering/sorting)
            const originalIndex = transactions.findIndex(t => 
                t.description === transaction.description && 
                t.amount === transaction.amount && 
                t.category === transaction.category && 
                t.type === transaction.type &&
                t.date === transaction.date // Use date for better uniqueness
            );

            listItem.innerHTML = `
                <span>${transaction.description} (${transaction.category}) - <span style="color: ${amountColor};">${sign}PHP ${transaction.amount.toFixed(2)}</span></span>
                <button class="delete-btn" data-original-index="${originalIndex}">Delete</button>
            `;
            transactionList.appendChild(listItem);
        });
    }
    // Trigger chart and budget updates after rendering transactions
    updatePieChart();
    updateMonthlyChart(); // Update monthly chart as well
    updateRemainingBudget();
    updateBalance();
    updateCurrentMonthlyIncome(); // Update current monthly income display
}

// Function to update the remaining budget display
function updateRemainingBudget() {
    const currentBudgetSpan = document.getElementById('current-budget');
    const remainingBudgetSpan = document.getElementById('remaining-budget');
    if (!currentBudgetSpan || !remainingBudgetSpan) return;

    const currentBudget = parseFloat(localStorage.getItem('spendifyBudget')) || 0;
    currentBudgetSpan.textContent = currentBudget.toFixed(2);

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const totalExpenses = transactions.reduce((sum, transaction) => {
        return transaction.type === 'expense' ? sum + transaction.amount : sum;
    }, 0);

    const remaining = currentBudget - totalExpenses;
    remainingBudgetSpan.textContent = remaining.toFixed(2);
}

// Function to update the current balance display
function updateBalance() {
    const balanceAmount = document.getElementById('balance-amount');
    if (!balanceAmount) return;

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Calculate net balance from all transactions
    const netBalance = transactions.reduce((sum, transaction) => {
        return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
    }, 0);

    balanceAmount.textContent = `PHP ${netBalance.toFixed(2)}`;
}

// Function to update the current monthly income display
function updateCurrentMonthlyIncome() {
    const currentMonthlyIncomeSpan = document.getElementById('current-monthly-income');
    if (!currentMonthlyIncomeSpan) return;

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const totalMonthlyIncome = transactions.reduce((sum, transaction) => {
        const transactionDate = new Date(transaction.date);
        if (transaction.type === 'income' && 
            transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
            return sum + transaction.amount;
        }
        return sum;
    }, 0);

    currentMonthlyIncomeSpan.textContent = totalMonthlyIncome.toFixed(2);
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Monthly Income Section Logic
    const incomeInput = document.getElementById('income-input');
    const setIncomeBtn = document.getElementById('set-income-btn');
    
    if (setIncomeBtn) {
        setIncomeBtn.addEventListener('click', () => {
            const income = parseFloat(incomeInput.value);
            if (!isNaN(income) && income >= 0) {
                const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                // Add income as a transaction with current date
                transactions.push({ 
                    description: 'Monthly Income', 
                    amount: income, 
                    category: 'salary', 
                    type: 'income', 
                    date: new Date().toISOString() // Store date in ISO format
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));
                showMessage('Monthly income added successfully!', 'success');
                incomeInput.value = '';
                renderTransactions(); // Re-render to update all displays
            } else {
                showMessage('Please enter a valid positive number for your monthly income.', 'error');
            }
        });
    }

    // Achievements Toggle
    const toggleButton = document.getElementById('toggle-achievements');
    const achievementList = document.getElementById('achievement-list');
    if (toggleButton && achievementList) {
        toggleButton.addEventListener('click', () => {
            achievementList.classList.toggle('hidden');
        });
    }

    // Transaction Form Logic
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const filterCategory = document.getElementById('filter-category');
    const filterType = document.getElementById('filter-type');

    if (transactionForm) {
        transactionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const type = document.getElementById('transaction-type').value; // Get transaction type

            if (description && !isNaN(amount) && amount > 0 && category && type) {
                const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                transactions.push({ 
                    description, 
                    amount, 
                    category, 
                    type, 
                    date: new Date().toISOString() // Store current date
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));
                showMessage('Transaction added successfully!', 'success');
                transactionForm.reset();
                renderTransactions(filterCategory ? filterCategory.value : 'all', filterType ? filterType.value : 'all'); // Re-render with current filters
            } else {
                showMessage('Please fill in all transaction details correctly.', 'error');
            }
        });
    }

    if (transactionList) {
        transactionList.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-btn')) {
                const originalIndex = parseInt(event.target.dataset.originalIndex);
                let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                
                if (originalIndex >= 0 && originalIndex < transactions.length) {
                    transactions.splice(originalIndex, 1);
                    localStorage.setItem('transactions', JSON.stringify(transactions));
                    showMessage('Transaction deleted successfully!', 'info');
                    renderTransactions(filterCategory ? filterCategory.value : 'all', filterType ? filterType.value : 'all'); // Re-render with current filters
                } else {
                    showMessage('Error: Could not delete transaction.', 'error');
                }
            }
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', () => {
            renderTransactions(filterCategory.value, filterType ? filterType.value : 'all');
        });
    }

    if (filterType) {
        filterType.addEventListener('change', () => {
            renderTransactions(filterCategory ? filterCategory.value : 'all', filterType.value);
        });
    }

    // Budget Section Logic
    const budgetInput = document.getElementById('budget-input');
    const setBudgetBtn = document.getElementById('set-budget-btn');

    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            const budget = parseFloat(budgetInput.value);
            if (!isNaN(budget) && budget >= 0) {
                localStorage.setItem('spendifyBudget', budget);
                showMessage('Budget set successfully!', 'success');
                budgetInput.value = '';
                updateRemainingBudget();
            } else {
                showMessage('Please enter a valid positive number for your budget.', 'error');
            }
        });
    }

    // Initial renders on page load for both pages
    // Check if elements exist before calling render functions
    if (document.getElementById('transaction-list')) {
        renderTransactions(); 
    }
    if (document.getElementById('myPieChart')) {
        updatePieChart();
    }
    if (document.getElementById('monthlyChart')) {
        updateMonthlyChart();
    }
    if (document.getElementById('balance-amount')) {
        updateBalance();
    }
    if (document.getElementById('current-budget')) {
        updateRemainingBudget();
    }
    if (document.getElementById('current-monthly-income')) {
        updateCurrentMonthlyIncome();
    }
});

