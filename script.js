const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const deviceSelect = document.getElementById("device-select");
const numBars = 64;

let audioCtx;
let analyser;
let dataArray;
let source;

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Draw visualizer bars
function draw() {
  if (!analyser) return;

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / numBars;

  for (let i = 0; i < numBars; i++) {
    const value = dataArray[Math.floor(i * dataArray.length / numBars)];
    const barHeight = (value / 255) * canvas.height * 0.8;
    const x = i * barWidth;
    const y = canvas.height - barHeight;

    const gradient = ctx.createLinearGradient(x, y, x + barWidth, canvas.height);
    gradient.addColorStop(0, "#ff6ec4");
    gradient.addColorStop(0.3, "#7873f5");
    gradient.addColorStop(0.6, "#f9e07f");
    gradient.addColorStop(1, "#00ffea");

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = gradient;
    ctx.fillRect(x, y, barWidth * 0.8, barHeight);
  }

  requestAnimationFrame(draw);
}

// Setup audio stream
async function setupAudio(deviceId) {
  try {
    if (audioCtx) await audioCtx.close();
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();

    const constraints = deviceId ? { audio: { deviceId: { exact: deviceId } } } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    draw();
  } catch (err) {
    console.error("Audio access failed:", err);
    populateDeviceSelect();
  }
}

// Populate device dropdown
async function populateDeviceSelect() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter(d => d.kind === "audioinput");

  if (audioInputs.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("No audio input devices found", 20, 40);
    return;
  }

  deviceSelect.innerHTML = "";
  audioInputs.forEach(d => {
    const option = document.createElement("option");
    option.value = d.deviceId;
    option.text = d.label || `Input ${d.deviceId}`;
    deviceSelect.appendChild(option);
  });

  deviceSelect.style.display = "block";
  deviceSelect.onchange = () => setupAudio(deviceSelect.value);
}

// Start by prompting for audio input
setupAudio();
