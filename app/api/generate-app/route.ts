import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { appName } = await request.json()
  
  // For now, return hardcoded HTML for Calculator to test the flow
  // Later, this will call an LLM API
  if (appName === 'Calculator') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #000;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      padding: 20px;
    }
    .calculator {
      background: #1c1c1e;
      border-radius: 20px;
      padding: 20px;
      max-width: 300px;
      width: 100%;
    }
    .display {
      background: #000;
      color: #fff;
      font-size: 48px;
      text-align: right;
      padding: 20px;
      margin-bottom: 10px;
      border-radius: 10px;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      word-wrap: break-word;
    }
    .buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    button {
      background: #505050;
      color: #fff;
      border: none;
      font-size: 24px;
      padding: 20px;
      border-radius: 10px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:active { opacity: 0.7; }
    button.operator { background: #ff9500; }
    button.function { background: #a6a6a6; color: #000; }
    button.zero { grid-column: span 2; }
  </style>
</head>
<body>
  <div class="calculator">
    <div class="display" id="display">0</div>
    <div class="buttons">
      <button class="function" onclick="clearAll()">AC</button>
      <button class="function" onclick="clearEntry()">C</button>
      <button class="function" onclick="percent()">%</button>
      <button class="operator" onclick="operator('/')">÷</button>
      <button onclick="number('7')">7</button>
      <button onclick="number('8')">8</button>
      <button onclick="number('9')">9</button>
      <button class="operator" onclick="operator('*')">×</button>
      <button onclick="number('4')">4</button>
      <button onclick="number('5')">5</button>
      <button onclick="number('6')">6</button>
      <button class="operator" onclick="operator('-')">−</button>
      <button onclick="number('1')">1</button>
      <button onclick="number('2')">2</button>
      <button onclick="number('3')">3</button>
      <button class="operator" onclick="operator('+')">+</button>
      <button class="zero" onclick="number('0')">0</button>
      <button onclick="number('.')">.</button>
      <button class="operator" onclick="equals()">=</button>
    </div>
  </div>
  <script>
    let current = '0';
    let previous = null;
    let op = null;
    
    function updateDisplay() {
      document.getElementById('display').textContent = current;
    }
    
    function number(n) {
      if (current === '0') current = n;
      else current += n;
      updateDisplay();
    }
    
    function operator(o) {
      if (previous !== null) equals();
      previous = current;
      current = '0';
      op = o;
    }
    
    function equals() {
      if (previous === null || op === null) return;
      const prev = parseFloat(previous);
      const curr = parseFloat(current);
      let result;
      switch(op) {
        case '+': result = prev + curr; break;
        case '-': result = prev - curr; break;
        case '*': result = prev * curr; break;
        case '/': result = prev / curr; break;
        default: return;
      }
      current = result.toString();
      previous = null;
      op = null;
      updateDisplay();
    }
    
    function clearAll() {
      current = '0';
      previous = null;
      op = null;
      updateDisplay();
    }
    
    function clearEntry() {
      current = '0';
      updateDisplay();
    }
    
    function percent() {
      current = (parseFloat(current) / 100).toString();
      updateDisplay();
    }
    
    // Notify parent that app is ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'app-ready', appName: 'Calculator' }, '*');
    }
  </script>
</body>
</html>
    `
    
    return NextResponse.json({ html })
  }
  
  return NextResponse.json({ error: 'App not found' }, { status: 404 })
}

