const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const numBars = 64;

async function setupAudio() {
  try {
    // Ask for the Voicemeeter output device
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: "VM432:5" }
      }
    });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = canvas.width / numBars;

      for (let i = 0; i < numBars; i++) {
        // Map frequency bins to bars
        const value = dataArray[Math.floor(i * bufferLength / numBars)];
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

    draw();

  } catch (err) {
    console.error("Audio access failed:", err);
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("Failed to access Voicemeeter output", 20, 40);
  }
}

setupAudio();
