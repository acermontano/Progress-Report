// Helper function to display messages
function showMessage(message, type = 'info') {
    const messageDisplay = document.getElementById('message-display');
    if (messageDisplay) {
        messageDisplay.textContent = message;
        messageDisplay.className = `message-box ${type}`;
        messageDisplay.style.display = 'block';
        setTimeout(() => {
            messageDisplay.style.display = 'none';
        }, 3000);
    } else {
        console.log(`Message: ${message}`);
    }
}

// Helper function to generate distinct colors
function generateColors(numColors) {
    const colors = [];
    const baseHue = Math.floor(Math.random() * 360);
    for (let i = 0; i < numColors; i++) {
        const hue = (baseHue + (i * (360 / numColors))) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
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
                        text: 'Spending Breakdown by Category',
                        color: '#ffffff'
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
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Aggregate income and expenses by month
    const monthlyData = {};
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
                        backgroundColor: 'rgba(29, 185, 84, 0.8)',
                        borderColor: 'rgba(29, 185, 84, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: monthlyExpenses,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
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

// Function to render transactions in the list (for CHART.html)
function renderTransactions(filterCategory = 'all', filterType = 'all') {
    const transactionList = document.getElementById('transaction-list');
    if (!transactionList) return;

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
            const amountColor = transaction.type === 'expense' ? 'red' : '#1DB954';
            // Find the original index for deletion (important after filtering/sorting)
            const originalIndex = transactions.findIndex(t => t.description === transaction.description && t.amount === transaction.amount && t.category === transaction.category && t.type === transaction.type && t.date === transaction.date );
            listItem.innerHTML = `
                <span>${transaction.description} (${transaction.category}) - <span style="color: ${amountColor};">${sign}PHP ${transaction.amount.toFixed(2)}</span></span>
                <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
                <button class="delete-btn" data-index="${originalIndex}">Delete</button>
            `;
            transactionList.appendChild(listItem);
        });
    }
    attachDeleteButtonListeners(); // Re-attach listeners after rendering
}

// Attach event listeners for delete buttons (delegation for dynamic elements)
function attachDeleteButtonListeners() {
    const transactionList = document.getElementById('transaction-list');
    if (transactionList) {
        transactionList.removeEventListener('click', handleDeleteClick); // Remove old listener
        transactionList.addEventListener('click', handleDeleteClick); // Add new listener
    }
}

function handleDeleteClick(event) {
    if (event.target.classList.contains('delete-btn')) {
        const indexToDelete = parseInt(event.target.dataset.index);
        deleteTransaction(indexToDelete);
    }
}

// Function to delete a transaction (for CHART.html)
function deleteTransaction(index) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    if (index > -1 && index < transactions.length) {
        transactions.splice(index, 1); // Remove the transaction at the given index
        localStorage.setItem('transactions', JSON.stringify(transactions));
        showMessage('Transaction deleted successfully!', 'success');
        // NEWLY ADDED CODE: Update relevant UI elements on CHART.html after deletion
        renderTransactions(); // Re-render the list
        updatePieChart(); // Update charts
        updateMonthlyChart();
    } else {
        showMessage('Error: Transaction not found.', 'error');
    }
}


// DOMContentLoaded listener for CHART.html
document.addEventListener('DOMContentLoaded', () => {
    // Filter Controls Logic
    const filterCategory = document.getElementById('filter-category');
    const filterType = document.getElementById('filter-type');

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

    // Initial renders for CHART.html elements
    renderTransactions(); // Render initial transactions list
    updatePieChart();     // Update pie chart
    updateMonthlyChart(); // Update monthly bar chart

    // NEWLY ADDED CODE: Listen for storage events from other tabs/windows
    window.addEventListener('storage', (event) => {
        // Check if the 'transactions' key in localStorage was changed
        if (event.key === 'transactions') { // Only transactions affect charts and list here
            console.log('localStorage change detected in another tab/window. Updating UI...');
            // Trigger all relevant UI updates for CHART.html
            renderTransactions();
            updatePieChart();
            updateMonthlyChart();
        }
    });
});
