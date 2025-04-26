// Initialize matrices
let size = 2;
let matrixA = createMatrix(size);
let matrixB = createMatrix(size);
let history = [];
let presets = [];

// DOM elements
const sizeSelect = document.getElementById('matrix-size');
const operationSelect = document.getElementById('operation');
const calculateBtn = document.getElementById('calculate');
const randomizeBtn = document.getElementById('randomize');
const savePresetBtn = document.getElementById('save-preset');
const powerInput = document.getElementById('power-input');
const powerValue = document.getElementById('power-value');
const gridA = document.getElementById('grid-a');
const gridB = document.getElementById('grid-b');
const resultContainer = document.getElementById('result-container');
const resultDiv = document.getElementById('result');
const stepsDiv = document.getElementById('steps');
const toggleStepsBtn = document.getElementById('toggleSteps');
const historyList = document.getElementById('history-list');
const presetsList = document.getElementById('presets-list');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Initialize the calculator
function init() {
    renderMatrices();
    
    // Event listeners
    sizeSelect.addEventListener('change', (e) => {
        size = parseInt(e.target.value);
        matrixA = createMatrix(size);
        matrixB = createMatrix(size);
        renderMatrices();
        hideResult();
    });
    
    calculateBtn.addEventListener('click', calculate);
    randomizeBtn.addEventListener('click', randomize);
    savePresetBtn.addEventListener('click', savePreset);
    toggleStepsBtn.addEventListener('click', toggleSteps);
    
    // Hide matrix B for unary operations initially
    toggleOperationDependentUI();
    operationSelect.addEventListener('change', toggleOperationDependentUI);
    
    // Load presets from localStorage
    loadPresets();
    
    // Initialize tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and panels
            tabs.forEach(t => t.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
        });
    });
}

// Create empty matrix
function createMatrix(size) {
    return Array(size).fill().map(() => Array(size).fill(0));
}

// Render matrices to DOM
function renderMatrices() {
    renderMatrix(gridA, matrixA, 'A');
    renderMatrix(gridB, matrixB, 'B');
}

function renderMatrix(grid, matrix, prefix) {
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'matrix-cell';
            input.value = matrix[i][j];
            input.dataset.row = i;
            input.dataset.col = j;
            input.dataset.matrix = prefix;
            input.addEventListener('input', updateMatrix);
            grid.appendChild(input);
        }
    }
}

// Update matrix when input changes
function updateMatrix(e) {
    const input = e.target;
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    const value = parseFloat(input.value) || 0;
    
    if (input.dataset.matrix === 'A') {
        matrixA[row][col] = value;
    } else {
        matrixB[row][col] = value;
    }
}

// Toggle visibility of matrix B and other UI elements based on operation
function toggleOperationDependentUI() {
    const operation = operationSelect.value;
    const needsTwoMatrices = ['add', 'subtract', 'multiply'].includes(operation);
    document.getElementById('matrix-b').style.display = needsTwoMatrices ? 'block' : 'none';
    
    // Show/hide power input for power operation
    powerInput.style.display = operation === 'power' ? 'block' : 'none';
}

// Save current matrices as preset
function savePreset() {
    const presetName = prompt('Enter a name for this preset:');
    if (presetName) {
        const preset = {
            name: presetName,
            size: size,
            matrixA: JSON.parse(JSON.stringify(matrixA)),
            matrixB: JSON.parse(JSON.stringify(matrixB))
        };
        
        presets.push(preset);
        savePresetsToLocalStorage();
        renderPresets();
    }
}

// Save presets to localStorage
function savePresetsToLocalStorage() {
    localStorage.setItem('matrixPresets', JSON.stringify(presets));
}

// Load presets from localStorage
function loadPresets() {
    const savedPresets = localStorage.getItem('matrixPresets');
    if (savedPresets) {
        presets = JSON.parse(savedPresets);
        renderPresets();
    }
}

// Render presets list
function renderPresets() {
    presetsList.innerHTML = '';
    
    if (presets.length === 0) {
        presetsList.innerHTML = '<p>No presets saved yet.</p>';
        return;
    }
    
    presets.forEach((preset, index) => {
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item';
        presetItem.innerHTML = `
            <span>${preset.name} (${preset.size}×${preset.size})</span>
            <button class="delete-preset" data-index="${index}">Delete</button>
        `;
        presetItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-preset')) {
                loadPreset(preset);
            }
        });
        presetsList.appendChild(presetItem);
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            presets.splice(index, 1);
            savePresetsToLocalStorage();
            renderPresets();
        });
    });
}

// Load preset
function loadPreset(preset) {
    size = preset.size;
    matrixA = JSON.parse(JSON.stringify(preset.matrixA));
    matrixB = JSON.parse(JSON.stringify(preset.matrixB));
    
    // Update size select
    sizeSelect.value = size;
    
    // Render matrices
    renderMatrices();
    hideResult();
}

// Toggle calculation steps visibility
function toggleSteps() {
    const isHidden = !stepsDiv.classList.contains('active');
    stepsDiv.classList.toggle('active');
    toggleStepsBtn.textContent = isHidden ? 'Hide Calculation Steps' : 'Show Calculation Steps';
}

// Add calculation to history
function addToHistory(operation, result, matrixA, matrixB) {
    const historyItem = {
        operation,
        result: JSON.parse(JSON.stringify(result)),
        matrixA: JSON.parse(JSON.stringify(matrixA)),
        matrixB: JSON.parse(JSON.stringify(matrixB)),
        timestamp: new Date().toLocaleTimeString(),
        size
    };
    
    history.unshift(historyItem);
    if (history.length > 10) {
        history.pop();
    }
    
    renderHistory();
}

// Render history list
function renderHistory() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p>No calculations performed yet.</p>';
        return;
    }
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>${item.timestamp} - ${getOperationName(item.operation)} (${item.size}×${item.size})</div>
        `;
        historyItem.addEventListener('click', () => {
            loadHistoryItem(item);
        });
        historyList.appendChild(historyItem);
    });
}

// Get operation name
function getOperationName(operation) {
    const operationNames = {
        'add': 'Addition (A+B)',
        'subtract': 'Subtraction (A-B)',
        'multiply': 'Multiplication (A×B)',
        'determinant': 'Determinant (A)',
        'inverse': 'Inverse (A)',
        'transpose': 'Transpose (A)',
        'eigenvalues': 'Eigenvalues (A)',
        'power': 'Power (A^n)'
    };
    
    return operationNames[operation] || operation;
}

// Load history item
function loadHistoryItem(item) {
    size = item.size;
    matrixA = JSON.parse(JSON.stringify(item.matrixA));
    matrixB = JSON.parse(JSON.stringify(item.matrixB));
    
    // Update size select
    sizeSelect.value = size;
    
    // Update operation select
    operationSelect.value = item.operation;
    toggleOperationDependentUI();
    
    // Render matrices
    renderMatrices();
    
    // Display result
    displayResult(item.result);
}

// Randomize matrix values
function randomize() {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            matrixA[i][j] = Math.floor(Math.random() * 10) - 2; // Values between -2 and 7
            matrixB[i][j] = Math.floor(Math.random() * 10) - 2;
        }
    }
    renderMatrices();
    hideResult();
}

// Hide result container
function hideResult() {
    resultContainer.classList.add('hidden');
    stepsDiv.classList.remove('active');
    toggleStepsBtn.textContent = 'Show Calculation Steps';
}

// Show result container
function showResult() {
    resultContainer.classList.remove('hidden');
}

// Main calculation function
function calculate() {
    const operation = operationSelect.value;
    let result;
    let steps = [];
    
    try {
        switch (operation) {
            case 'add':
                [result, steps] = addMatrices(matrixA, matrixB);
                break;
            case 'subtract':
                [result, steps] = subtractMatrices(matrixA, matrixB);
                break;
            case 'multiply':
                [result, steps] = multiplyMatrices(matrixA, matrixB);
                break;
            case 'determinant':
                [result, steps] = calculateDeterminant(matrixA);
                break;
            case 'inverse':
                [result, steps] = inverse(matrixA);
                break;
            case 'transpose':
                [result, steps] = transpose(matrixA);
                break;
            case 'eigenvalues':
                [result, steps] = calculateEigenvalues(matrixA);
                break;
            case 'power':
                const power = parseInt(powerValue.value) || 2;
                [result, steps] = matrixPower(matrixA, power);
                break;
            default:
                throw new Error('Unknown operation');
        }
        
        displayResult(result);
        displaySteps(steps);
        addToHistory(operation, result, matrixA, matrixB);
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        stepsDiv.innerHTML = '';
        showResult();
    }
}

// Display result
function displayResult(result) {
    if (Array.isArray(result) && result.length === 1 && typeof result[0] === 'string') {
        // Display string result (like eigenvalues)
        resultDiv.innerHTML = `<p>${result[0]}</p>`;
    } else if (Array.isArray(result) && result.length === 1 && typeof result[0] !== 'object') {
        // Display scalar result (like determinant)
        resultDiv.innerHTML = `<p>${Number.isInteger(result[0]) ? result[0] : result[0].toFixed(4)}</p>`;
    } else {
        // Display matrix result
        let html = '<div class="matrix-grid" style="display: grid; grid-template-columns: repeat(' + result[0].length + ', 1fr); gap: 5px;">';
        
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result[0].length; j++) {
                const value = Number.isInteger(result[i][j]) ? 
                    result[i][j] : result[i][j].toFixed(2);
                html += `<div style="padding: 10px; background: #2e2e33; text-align: center; color: #FFE14D;">${value}</div>`;
            }
        }
        
        html += '</div>';
        resultDiv.innerHTML = html;
    }
    
    showResult();
}

// Display calculation steps
function displaySteps(steps) {
    if (!steps || steps.length === 0) {
        stepsDiv.innerHTML = '<p>No calculation steps available for this operation.</p>';
        return;
    }
    
    let html = '';
    steps.forEach((step, index) => {
        html += `<div class="step">
            <div class="step-title">Step ${index + 1}: ${step.title}</div>
            <div class="step-content">${step.content}</div>
        </div>`;
    });
    
    stepsDiv.innerHTML = html;
}

// Matrix operations with steps
function addMatrices(a, b) {
    const result = Array(size).fill().map(() => Array(size).fill(0));
    const steps = [{
        title: 'Add corresponding elements',
        content: 'For each position (i,j), calculate a[i][j] + b[i][j]'
    }];
    
    let stepContent = '';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            result[i][j] = a[i][j] + b[i][j];
            stepContent += `Position (${i+1},${j+1}): ${a[i][j]} + ${b[i][j]} = ${result[i][j]}<br>`;
        }
    }
    
    steps[0].content = stepContent;
    return [result, steps];
}

function subtractMatrices(a, b) {
    const result = Array(size).fill().map(() => Array(size).fill(0));
    const steps = [{
        title: 'Subtract corresponding elements',
        content: 'For each position (i,j), calculate a[i][j] - b[i][j]'
    }];
    
    let stepContent = '';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            result[i][j] = a[i][j] - b[i][j];
            stepContent += `Position (${i+1},${j+1}): ${a[i][j]} - ${b[i][j]} = ${result[i][j]}<br>`;
        }
    }
    
    steps[0].content = stepContent;
    return [result, steps];
}

function multiplyMatrices(a, b) {
    const result = Array(size).fill().map(() => Array(size).fill(0));
    const steps = [{
        title: 'Calculate dot products',
        content: 'For each position (i,j), calculate the sum of products of row i elements from A with column j elements from B'
    }];
    
    let stepContent = '';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let sum = 0;
            let calculation = `C[${i+1}][${j+1}] = `;
            
            for (let k = 0; k < size; k++) {
                sum += a[i][k] * b[k][j];
                calculation += `${a[i][k]} × ${b[k][j]}`;
                if (k < size - 1) calculation += ' + ';
            }
            
            result[i][j] = sum;
            calculation += ` = ${sum}<br>`;
            stepContent += calculation;
        }
    }
    
    steps[0].content = stepContent;
    return [result, steps];
}

function calculateDeterminant(matrix) {
    let det = 0;
    let steps = [];
    
    if (size === 2) {
        det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        steps.push({
            title: 'Calculate 2×2 determinant',
            content: `Det = ${matrix[0][0]} × ${matrix[1][1]} - ${matrix[0][1]} × ${matrix[1][0]} = ${det}`
        });
    } else if (size === 3) {
        det = 
            matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
            matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
            matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
            
        steps.push({
            title: 'Calculate 3×3 determinant using cofactor expansion',
            content: `
                Det = ${matrix[0][0]} × [(${matrix[1][1]} × ${matrix[2][2]}) - (${matrix[1][2]} × ${matrix[2][1]})] - 
                ${matrix[0][1]} × [(${matrix[1][0]} × ${matrix[2][2]}) - (${matrix[1][2]} × ${matrix[2][0]})] + 
                ${matrix[0][2]} × [(${matrix[1][0]} × ${matrix[2][1]}) - (${matrix[1][1]} × ${matrix[2][0]})]<br><br>
                Det = ${matrix[0][0]} × [${matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]}] - 
                ${matrix[0][1]} × [${matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]}] + 
                ${matrix[0][2]} × [${matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]}]<br><br>
                Det = ${matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1])} - 
                ${matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0])} + 
                ${matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])}


                Det = ${det}
                `
                });
                } else {
                throw new Error('Determinant calculation for matrices larger than 3×3 is not supported');
                }
                
                return [[det], steps];
                }
                
                function inverse(matrix) {
                if (size !== 2) {
                throw new Error('Inverse calculation is only supported for 2×2 matrices');
                }
                
                const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
                if (det === 0) {
                    throw new Error('Matrix is singular (determinant is 0), inverse does not exist');
                }
                
                const result = [
                    [matrix[1][1] / det, -matrix[0][1] / det],
                    [-matrix[1][0] / det, matrix[0][0] / det]
                ];
                
                const steps = [
                    {
                        title: 'Calculate determinant',
                        content: `Det = ${matrix[0][0]} × ${matrix[1][1]} - ${matrix[0][1]} × ${matrix[1][0]} = ${det}`
                    },
                    {
                        title: 'Swap diagonal elements and negate off-diagonal elements',
                        content: `New matrix: [${matrix[1][1]}, ${-matrix[0][1]}; ${-matrix[1][0]}, ${matrix[0][0]}]`
                    },
                    {
                        title: 'Divide each element by determinant',
                        content: `Inverse = [${result[0][0].toFixed(4)}, ${result[0][1].toFixed(4)}; ${result[1][0].toFixed(4)}, ${result[1][1].toFixed(4)}]`
                    }
                ];
                
                return [result, steps];
                }
                
                function transpose(matrix) {
                const result = Array(size).fill().map(() => Array(size).fill(0));
                const steps = [{
                title: 'Swap rows and columns',
                content: 'For each position (i,j), the element becomes the element at (j,i) in the original matrix'
                }];
                
                let stepContent = '';
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        result[i][j] = matrix[j][i];
                        stepContent += `Position (${i+1},${j+1}): ${matrix[j][i]}<br>`;
                    }
                }
                
                steps[0].content = stepContent;
                return [result, steps];
                }
                
                function calculateEigenvalues(matrix) {
                if (size !== 2) {
                throw new Error('Eigenvalue calculation is only supported for 2×2 matrices');
                }
                
                const a = matrix[0][0];
                const b = matrix[0][1];
                const c = matrix[1][0];
                const d = matrix[1][1];
                
                // Calculate trace and determinant
                const trace = a + d;
                const det = a * d - b * c;
                
                // Calculate discriminant
                const discriminant = trace * trace - 4 * det;
                
                let eigenvalues;
                if (discriminant > 0) {
                    const sqrtDiscriminant = Math.sqrt(discriminant);
                    const lambda1 = (trace + sqrtDiscriminant) / 2;
                    const lambda2 = (trace - sqrtDiscriminant) / 2;
                    eigenvalues = [`λ₁ = ${lambda1.toFixed(4)}, λ₂ = ${lambda2.toFixed(4)}`];
                } else if (discriminant === 0) {
                    const lambda = trace / 2;
                    eigenvalues = [`λ = ${lambda.toFixed(4)} (repeated)`];
                } else {
                    const realPart = trace / 2;
                    const imaginaryPart = Math.sqrt(-discriminant) / 2;
                    eigenvalues = [
                        `λ₁ = ${realPart.toFixed(4)} + ${imaginaryPart.toFixed(4)}i`,
                        `λ₂ = ${realPart.toFixed(4)} - ${imaginaryPart.toFixed(4)}i`
                    ];
                }
                
                const steps = [
                    {
                        title: 'Calculate trace and determinant',
                        content: `Trace = ${a} + ${d} = ${trace}<br>Determinant = ${a} × ${d} - ${b} × ${c} = ${det}`
                    },
                    {
                        title: 'Calculate discriminant',
                        content: `Discriminant = Trace² - 4 × Det = ${trace}² - 4 × ${det} = ${discriminant}`
                    },
                    {
                        title: 'Calculate eigenvalues',
                        content: `Eigenvalues: ${eigenvalues.join('<br>')}`
                    }
                ];
                
                return [eigenvalues, steps];
                }
                
                function matrixPower(matrix, power) {
                if (power < 1 || !Number.isInteger(power)) {
                throw new Error('Power must be a positive integer');
                }
                
                let result = matrix;
                const steps = [];
                
                // For power 1, just return the matrix
                if (power === 1) {
                    steps.push({
                        title: 'Matrix to the power of 1',
                        content: 'The result is the matrix itself'
                    });
                    return [result, steps];
                }
                
                // For higher powers, multiply iteratively
                for (let p = 2; p <= power; p++) {
                    const [newResult, multiplySteps] = multiplyMatrices(result, matrix);
                    result = newResult;
                    
                    steps.push({
                        title: `Step ${p-1}: Multiply by original matrix (A^${p})`,
                        content: multiplySteps[0].content
                    });
                }
                
                return [result, steps];
                }
                
                // Initialize the calculator when the DOM is loaded
                document.addEventListener('DOMContentLoaded', init);