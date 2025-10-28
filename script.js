const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
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

// Setup audio stream (always prompt)
async function setupAudio() {
  try {
    if (audioCtx) audioCtx.close(); // Close previous context
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Ask for any microphone/audio input
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("Audio access denied or failed", 20, 40);
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

// Always prompt for audio input
setupAudio();
