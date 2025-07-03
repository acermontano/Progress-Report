document.addEventListener('DOMContentLoaded', () => {
    const incomeInput = document.getElementById('income-input');
    const setIncomeBtn = document.getElementById('set-income-btn');
    const balanceAmount = document.getElementById('balance-amount');
 
    let currentBalance = 0; // Initialize balance to 0
 
    // Load saved balance from localStorage if available
    if (localStorage.getItem('spendifyBalance')) {
        currentBalance = parseFloat(localStorage.getItem('spendifyBalance'));
        balanceAmount.textContent = `PHP ${currentBalance.toFixed(2)}`;
    }
 
    setIncomeBtn.addEventListener('click', () => {
        const income = parseFloat(incomeInput.value);
 
        if (!isNaN(income) && income >= 0) {
            currentBalance = income;
            balanceAmount.textContent = `PHP ${currentBalance.toFixed(2)}`;
            localStorage.setItem('spendifyBalance', currentBalance); // Save to localStorage
            incomeInput.value = ''; // Clear the input field after setting
        } else {
            alert('Please enter a valid positive number for your monthly income.');
        }
    });
});
