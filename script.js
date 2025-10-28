const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const deviceSelect = document.getElementById("device-select");

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

// Draw audio level
function draw() {
  if (!analyser) return;

  analyser.getByteTimeDomainData(dataArray);

  // Compute RMS (overall loudness)
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128; // normalize -1 to 1
    sum += v * v;
  }
  const rms = Math.sqrt(sum / dataArray.length);

  // Log RMS for debugging
  console.log("RMS:", rms.toFixed(3));

  // Draw a single vertical bar representing audio level
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barHeight = rms * canvas.height * 3; // scale for visibility
  ctx.fillStyle = "#ff6ec4";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff6ec4";
  ctx.fillRect(canvas.width / 2 - 50, canvas.height - barHeight, 100, barHeight);

  requestAnimationFrame(draw);
}

// Setup audio stream
async function setupAudio(deviceId) {
  try {
    if (audioCtx) await audioCtx.close();
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true
    });

    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.fftSize);

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

// Always prompt for input first
setupAudio();
