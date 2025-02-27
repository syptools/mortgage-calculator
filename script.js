document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const mortgageForm = document.getElementById('mortgage-form');
    const resultsSection = document.getElementById('results');
    const printButton = document.getElementById('print-button');
    
    // Chart variable for updating
    let paymentChart = null;
    
    // Form submission handler
    mortgageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const loanAmount = parseFloat(document.getElementById('loan-amount').value);
        const interestRate = parseFloat(document.getElementById('interest-rate').value);
        const loanTerm = parseInt(document.getElementById('loan-term').value);
        
        // Validate inputs
        if (!validateInputs(loanAmount, interestRate, loanTerm)) {
            return;
        }
        
        // Calculate mortgage details
        const mortgageDetails = calculateMortgage(loanAmount, interestRate, loanTerm);
        
        // Display results
        displayResults(mortgageDetails);
        
        // Generate amortization schedule
        generateAmortizationSchedule(loanAmount, interestRate, loanTerm, mortgageDetails.monthlyPayment);
        
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Print button handler
    printButton.addEventListener('click', function() {
        window.print();
    });
    
    // Input validation function
    function validateInputs(loanAmount, interestRate, loanTerm) {
        // Clear any previous error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
        
        let isValid = true;
        
        // Validate loan amount
        if (isNaN(loanAmount) || loanAmount <= 0) {
            showError('loan-amount', 'Please enter a valid loan amount greater than zero.');
            isValid = false;
        }
        
        // Validate interest rate
        if (isNaN(interestRate) || interestRate <= 0 || interestRate > 20) {
            showError('interest-rate', 'Please enter a valid interest rate between 0.1 and 20%.');
            isValid = false;
        }
        
        // Validate loan term
        if (isNaN(loanTerm) || loanTerm <= 0) {
            showError('loan-term', 'Please select a valid loan term.');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Show error message under an input
    function showError(inputId, message) {
        const inputElement = document.getElementById(inputId);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '0.25rem';
        errorElement.textContent = message;
        
        inputElement.parentNode.appendChild(errorElement);
        inputElement.style.borderColor = 'red';
        
        // Remove error when input changes
        inputElement.addEventListener('input', function() {
            errorElement.remove();
            inputElement.style.borderColor = '';
        }, { once: true });
    }
    
    // Calculate mortgage details
    function calculateMortgage(loanAmount, annualInterestRate, loanTermYears) {
        // Convert annual rate to monthly rate and years to months
        const monthlyRate = annualInterestRate / 100 / 12;
        const totalPayments = loanTermYears * 12;
        
        // Calculate monthly payment using formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
        // Where: P = payment, L = loan amount, c = monthly interest rate, n = number of payments
        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
            (Math.pow(1 + monthlyRate, totalPayments) - 1);
        
        // Calculate total payment and interest
        const totalPayment = monthlyPayment * totalPayments;
        const totalInterest = totalPayment - loanAmount;
        
        return {
            monthlyPayment: monthlyPayment,
            totalPayment: totalPayment,
            totalInterest: totalInterest,
            loanAmount: loanAmount
        };
    }
    
    // Display calculation results
    function displayResults(mortgageDetails) {
        // Update monthly payment
        document.getElementById('payment-value').textContent = numberWithCommas(mortgageDetails.monthlyPayment.toFixed(2));
        
        // Update payment breakdown
        document.getElementById('total-principal').textContent = '$' + numberWithCommas(mortgageDetails.loanAmount.toFixed(2));
        document.getElementById('total-interest').textContent = '$' + numberWithCommas(mortgageDetails.totalInterest.toFixed(2));
        document.getElementById('total-cost').textContent = '$' + numberWithCommas(mortgageDetails.totalPayment.toFixed(2));
        
        // Generate/update pie chart
        generatePaymentChart(mortgageDetails);
    }
    
    // Generate payment breakdown chart
    function generatePaymentChart(mortgageDetails) {
        const ctx = document.getElementById('payment-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (paymentChart) {
            paymentChart.destroy();
        }
        
        // Create new chart
        paymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Interest'],
                datasets: [{
                    data: [mortgageDetails.loanAmount, mortgageDetails.totalInterest],
                    backgroundColor: ['#3498db', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = Math.round((value / mortgageDetails.totalPayment) * 100);
                                return `${context.label}: $${numberWithCommas(value.toFixed(2))} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Generate amortization schedule table
    function generateAmortizationSchedule(loanAmount, annualInterestRate, loanTermYears, monthlyPayment) {
        const tableBody = document.getElementById('amortization-body');
        tableBody.innerHTML = ''; // Clear existing table
        
        // Set up variables
        const monthlyRate = annualInterestRate / 100 / 12;
        const totalPayments = loanTermYears * 12;
        let remainingBalance = loanAmount;
        let currentDate = new Date();
        
        // Create rows for each payment
        for (let paymentNumber = 1; paymentNumber <= totalPayments; paymentNumber++) {
            // Calculate interest and principal for this payment
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            // Update remaining balance
            remainingBalance -= principalPayment;
            
            // Handle small floating point errors
            if (remainingBalance < 0.01) remainingBalance = 0;
            
            // Calculate payment date
            currentDate.setMonth(currentDate.getMonth() + 1);
            const paymentDate = formatDate(currentDate);
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${paymentNumber}</td>
                <td>${paymentDate}</td>
                <td>$${numberWithCommas(monthlyPayment.toFixed(2))}</td>
                <td>$${numberWithCommas(principalPayment.toFixed(2))}</td>
                <td>$${numberWithCommas(interestPayment.toFixed(2))}</td>
                <td>$${numberWithCommas(remainingBalance.toFixed(2))}</td>
            `;
            
            tableBody.appendChild(row);
        }
    }
    
    // Format date as MMM YYYY
    function formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    // Format number with commas
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
});