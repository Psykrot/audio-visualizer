const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const deviceSelect = document.getElementById("device-select");

const WIDTH = 500;
const HEIGHT = 400;

let context, analyser, freqs;
const opts = {
  smoothing: 0.6,
  fft: 8,
  minDecibels: -70,
  scale: 0.2,
  glow: 10,
  color1: [203, 36, 128],
  color2: [41, 200, 192],
  color3: [24, 137, 218],
  fillOpacity: 0.6,
  lineWidth: 1,
  blend: "screen",
  shift: 50,
  width: 60,
  amp: 1
};

function range(i) { return Array.from(Array(i).keys()); }
const shuffle = [1,3,0,4,2];
function freq(channel, i) { return freqs[2*channel + shuffle[i]*6]; }
function scale(i) { const x = Math.abs(2-i); return (3-x)/3 * opts.amp; }

function path(channel) {
  const color = opts[`color${channel+1}`].map(Math.floor);
  ctx.fillStyle = `rgba(${color},${opts.fillOpacity})`;
  ctx.strokeStyle = ctx.shadowColor = `rgb(${color})`;
  ctx.lineWidth = opts.lineWidth;
  ctx.shadowBlur = opts.glow;
  ctx.globalCompositeOperation = opts.blend;

  const m = HEIGHT/2;
  const offset = (WIDTH - 15*opts.width)/2;
  const x = range(15).map(i => offset + channel*opts.shift + i*opts.width);
  const y = range(5).map(i => Math.max(0, m - scale(i) * freq(channel,i)));
  const h = 2*m;

  ctx.beginPath();
  ctx.moveTo(0,m);
  ctx.lineTo(x[0], m+1);
  ctx.bezierCurveTo(x[1],m+1,x[2],y[0],x[3],y[0]);
  ctx.bezierCurveTo(x[4],y[0],x[4],y[1],x[5],y[1]);
  ctx.bezierCurveTo(x[6],y[1],x[6],y[2],x[7],y[2]);
  ctx.bezierCurveTo(x[8],y[2],x[8],y[3],x[9],y[3]);
  ctx.bezierCurveTo(x[10],y[3],x[10],y[4],x[11],y[4]);
  ctx.bezierCurveTo(x[12],y[4],x[12],m,x[13],m);
  ctx.lineTo(1000,m+1);
  ctx.lineTo(x[13], m-1);
  ctx.bezierCurveTo(x[12],m,x[12],h-y[4],x[11],h-y[4]);
  ctx.bezierCurveTo(x[10],h-y[4],x[10],h-y[3],x[9],h-y[3]);
  ctx.bezierCurveTo(x[8],h-y[3],x[8],h-y[2],x[7],h-y[2]);
  ctx.bezierCurveTo(x[6],h-y[2],x[6],h-y[1],x[5],h-y[1]);
  ctx.bezierCurveTo(x[4],h-y[1],x[4],h-y[0],x[3],h-y[0]);
  ctx.bezierCurveTo(x[2],h-y[0],x[1],m,x[0],m);
  ctx.lineTo(0,m);
  ctx.fill();
  ctx.stroke();
}

function visualize() {
  analyser.smoothingTimeConstant = opts.smoothing;
  analyser.fftSize = Math.pow(2, opts.fft);
  analyser.minDecibels = opts.minDecibels;
  analyser.maxDecibels = 0;
  analyser.getByteFrequencyData(freqs);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  path(0);
  path(1);
  path(2);

  requestAnimationFrame(visualize);
}

async function start() {
  context = new AudioContext();
  await context.resume();
  analyser = context.createAnalyser();
  freqs = new Uint8Array(analyser.frequencyBinCount);

  // Attempt Voicemeeter B2 first
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: "VM432:5" } }
    });
  } catch (err) {
    console.warn("Voicemeeter B2 not found, falling back to default input", err);
    // populate dropdown
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === "audioinput");
    audioInputs.forEach(d => {
      const option = document.createElement("option");
      option.value = d.deviceId;
      option.text = d.label || `Input ${d.deviceId}`;
      deviceSelect.appendChild(option);
    });
    deviceSelect.style.display = "block";
    deviceSelect.onchange = async () => {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceSelect.value } }
      });
      connectStream(s);
    };
    return;
  }

  connectStream(stream);
  startBtn.remove();
}

function connectStream(stream) {
  const input = context.createMediaStreamSource(stream);
  input.connect(analyser);
  visualize();
}

startBtn.addEventListener("click", start);
