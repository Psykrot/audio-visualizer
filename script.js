const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const deviceSelect = document.getElementById("device-select");
const numBars = 64;

let analyser;
let dataArray;
let audioCtx;
let source;

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Setup audio stream
async function setupAudio(deviceId) {
  try {
    if (audioCtx) audioCtx.close(); // Close previous context if exists
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true
    });

    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    draw();
  } catch (err) {
    console.error("Audio access failed:", err);
    populateDeviceSelect();
  }
}

// Populate dropdown if default device fails
async function populateDeviceSelect() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter(d => d.kind === "audioinput");

  deviceSelect.innerHTML = "";
  audioInputs.forEach(device => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `Input ${device.deviceId}`;
    deviceSelect.appendChild(option);
  });

  if (audioInputs.length > 0) {
    deviceSelect.style.display = "block";
    deviceSelect.onchange = () => setupAudio(deviceSelect.value);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("No audio input devices found", 20, 40);
  }
}

// Draw visualizer
function draw() {
  if (!analyser) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  analyser.getByteFrequencyData(dataArray);

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
    ctx.fillRect(x, y, barWidth * 0.8, barHeight);
  }

  requestAnimationFrame(draw);
}

// Try Voicemeeter by default
setupAudio("VM432:5");
