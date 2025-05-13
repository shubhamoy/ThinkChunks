"use strict";
const body = document.body;
const numAInput = document.getElementById('numA');
const numBInput = document.getElementById('numB');
const btnCalc = document.getElementById('btnCalc');
const btnNext = document.getElementById('btnNext');
const btnPrev = document.getElementById('btnPrev');
const btnChange = document.getElementById('btnChangeOrder');
const orderIndicator = document.getElementById('orderIndicator');
const btnReset = document.getElementById('btnReset');

const progressBar = document.getElementById('progressBar');
const wrapper  = document.querySelector('.progress-container');

let A, B, trueProduct, approxSum = 0;
let cells = [], stepNumber = 0, totalSteps = 0;
let sortedByMagnitude = true; // default largest→smallest

let segmentPercents = [];       // e.g. [75, 10, 5, …]
let segmentColors  = [];        // e.g. ["hsl(...)", "hsl(...)", …]
let prevProgress   = 0;         // remember where we left off
let currentHue     = Math.random() * 360;
const GOLDEN_ANGLE = 137.508;   // for well-spaced hues

function checkInputs() {
  const aVal = numAInput.value.trim();
  const bVal = numBInput.value.trim();
  const aNum = Number(aVal);
  const bNum = Number(bVal);

  // valid if both non-empty, integers, and ≥ 0
  const valid =
    aVal !== '' &&
    bVal !== '' &&
    Number.isInteger(aNum) &&
    Number.isInteger(bNum) &&
    aNum >= 0 &&
    bNum >= 0;
  
    const errEl = document.getElementById('inputError');
    if (!valid) {
      errEl.textContent = 'Please enter non-negative integers only.';
      errEl.style.display = "block";
    } else {
      errEl.textContent = '';
    }

  btnCalc.disabled = !valid;
}

numAInput.addEventListener('input', checkInputs);
numBInput.addEventListener('input', checkInputs);
checkInputs();

function updateUI() {
  btnCalc.disabled = stepNumber > 0;
  btnNext.disabled = stepNumber === 0 || stepNumber >= totalSteps;
  // Change button text to 'Done' when on the last step
  if (totalSteps > 0 && stepNumber === totalSteps) {
    btnNext.innerHTML = `<i class="fa fa-check fa-2x"></i> Done`;
  } else {
    btnNext.innerHTML = `<i class="fa fa-arrow-right fa-2x"></i>`;
  }
  btnPrev.disabled = stepNumber <= 1;
  btnReset.disabled = stepNumber === 0;
  document.getElementById('stepIndicator').textContent = `Step ${stepNumber} of ${totalSteps}`;
  let story = '';
  if (stepNumber === 1) story = `About to multiply ${A} × ${B}. Ready?`;
  else if (stepNumber === 2) story = `Break down numbers into place-value chunks.`;
  else if (stepNumber > 2 && stepNumber <= totalSteps) {
    const { el } = cells[stepNumber - 3];
    const aVal = +el.dataset.a;
    const bVal = +el.dataset.b;
    const value = +el.dataset.value;
    const countZeros = n => { let cnt=0; while(n%10===0 && n!==0){n/=10;cnt++;} return cnt; };
    const za = countZeros(aVal), zb = countZeros(bVal);
    if (za + zb > 0) {
      const baseA = aVal / 10**za, baseB = bVal / 10**zb;
      story = `We’re multiplying ${aVal} × ${bVal}. That’s ${baseA}×${baseB}=${baseA*baseB}, plus ${za+zb} zero(es) = ${value.toLocaleString()}.`;
    } else story = `Multiply ${aVal} × ${bVal} = ${value}.`;
  } else story = `Great job! You've completed all steps.`;
  document.getElementById('story').textContent = story;
  document.getElementById('approxSum').textContent = approxSum.toLocaleString();
  const acc = totalSteps > 2 ? (approxSum / trueProduct) * 100 : 0;
  document.getElementById('accuracy').textContent = `${acc.toFixed(2)}%`;
  document.getElementById('error').textContent = `${(100 - acc).toFixed(2)}%`;
  // progressBar.style.width = `${acc}%`;
  // after:
  updateProgressBar(acc);
}

btnCalc.addEventListener('click', () => {
  body.classList.add('loaded');
  A = Number(numA.value);
  B = Number(numB.value);
  trueProduct = A * B;
  document.getElementById('trueProduct').textContent = trueProduct.toLocaleString();
  const aChunks = splitPlace(A);
  const bChunks = splitPlace(B);
  totalSteps = 2 + aChunks.length * bChunks.length;
  drawPlaceholder(A, B);
  approxSum = 0;
  cells = [];
  stepNumber = 1;
  segmentPercents = [];
  segmentColors  = [];
  prevProgress   = 0;
  updateUI();
  
});

btnNext.addEventListener('click', () => {
  if (stepNumber === 1) {
    const aChunks = splitPlace(A);
    const bChunks = splitPlace(B);
    drawGrid(aChunks, bChunks);
    let list = Array.from(document.querySelectorAll('.product')).map(td => ({ el: td, value: +td.dataset.value }));
    list.sort((x, y) => sortedByMagnitude ? y.value - x.value : x.value - y.value);
    cells = list;
  }
  if (stepNumber >= 2 && stepNumber < totalSteps) {
    const idx = stepNumber - 2;
    const { el, value } = cells[idx];
    el.classList.replace('hidden', 'visible');
    approxSum += value;
  }
  stepNumber = Math.min(stepNumber + 1, totalSteps);
  updateUI();
});

btnPrev.addEventListener('click', () => {
  if (stepNumber > 2) {
    stepNumber--;
    const idx = stepNumber - 2;
    const { el, value } = cells[idx];
    el.classList.replace('visible', 'hidden');
    approxSum -= value;
  } else stepNumber = 1;
  updateUI();
});

btnChange.addEventListener('click', () => {
  sortedByMagnitude = !sortedByMagnitude;
  orderIndicator.textContent = sortedByMagnitude ? 'Largest → Smallest' : 'Smallest → Largest';
  progressBar.style = "";
  approxSum = 0;
  stepNumber = 1;
  prevProgress = 0;
  segmentPercents = [];
  segmentColors  = [];
  drawPlaceholder(A, B);
  updateUI();
});

btnReset.addEventListener('click', () => {
  body.classList.remove('loaded');
  numAInput.disabled = false;
  numBInput.disabled = false;
  sortedByMagnitude = true;
  orderIndicator.textContent = 'Largest → Smallest';
  stepNumber = 0;
  totalSteps = 0;
  approxSum = 0;
  cells = [];
  segmentPercents = [];
  segmentColors  = [];
  document.getElementById('matrixHead').innerHTML = '';
  document.getElementById('matrixBody').innerHTML = '';
  document.getElementById('trueProduct').textContent = '–';
  segmentPercents = [];
  segmentColors  = [];
  prevProgress   = 0;
  updateUI();
});

function drawPlaceholder(a, b) {
  document.getElementById('matrixHead').innerHTML = `<tr><th>${a} × ${b}</th></tr>`;
  document.getElementById('matrixBody').innerHTML = '';
}

function splitPlace(num) {
  let arr = [], p = 1, n = num;
  while (n > 0) {
    arr.unshift((n % 10) * p);
    n = Math.floor(n / 10);
    p *= 10;
  }
  return arr;
}

function drawGrid(aArr, bArr) {
  document.getElementById('matrixHead').innerHTML = `<tr><th>${A} × ${B}</th>${bArr.map(v => `<th>${v}</th>`).join('')}</tr>`;
  const prods = aArr.flatMap(a => bArr.map(b => a * b)).sort((x, y) => y - x);
  const largeTh = prods[Math.ceil(prods.length / 3) - 1];
  const medTh = prods[Math.ceil(2 * prods.length / 3) - 1];
  document.getElementById('matrixBody').innerHTML =
    aArr.map(a => `<tr><th>${a}</th>${bArr.map(b => { const p = a * b; const cls = p >= largeTh ? 'large' : p >= medTh ? 'medium' : 'small'; return `<td data-a='${a}' data-b='${b}' data-value='${p}' class='product hidden ${cls}'>${p.toLocaleString()}</td>` }).join('')}</tr>`).join('');
}

function getNextColor() {
  // rotate hue by the “golden angle” for even distribution
  currentHue = (currentHue + GOLDEN_ANGLE) % 360;
  return `hsl(${currentHue.toFixed(1)},70%,50%)`;
}

function updateProgressBar(acc) {
  // 1. record new delta
  const delta = acc - prevProgress;

  if (delta > 0) {
    segmentPercents.push(delta);
    segmentColors.push(getNextColor());
    prevProgress = acc;
  }
  let cum = 0;
  const stops = segmentPercents.flatMap((pct, i) => {
    const start = (cum    / acc) * 100;
    const end   = ((cum + pct) / acc) * 100;
    cum += pct;
    const c = segmentColors[i];
    return [`${c} ${start.toFixed(2)}%`, `${c} ${end.toFixed(2)}%`];
  });
  progressBar.style.width = `${acc}%`;
  progressBar.style.backgroundImage = 
    `linear-gradient(to right, ${stops.join(', ')})`;
}

// Initialize UI
updateUI();