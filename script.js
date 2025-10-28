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
  glow: 20,
  color1: [203, 36, 128],
  color2: [41, 200, 192],
  color3: [255, 223, 0],
  fillOpacity: 0.5,
  lineWidth: 2,
  blend: "screen",
  shift: 50,
  width: 60,
  amp: 1
};

// dat.GUI for tweaking
const gui = new dat.GUI();
gui.close();
gui.addColor(opts, "color1");
gui.addColor(opts, "color2");
gui.addColor(opts, "color3");
gui.add(opts, "fillOpacity", 0, 1);
gui.add(opts, "lineWidth", 0, 10).step(1);
gui.add(opts, "glow", 0, 100);
gui.add(opts, "blend", ["normal","multiply","screen","overlay","lighten","difference"]);
gui.add(opts, "smoothing", 0, 1);
gui.add(opts, "minDecibels", -100, 0);
gui.add(opts, "amp", 0, 5);
gui.add(opts, "width", 0, 60);
gui.add(opts, "shift", 0, 200);

function range(i){ return Array.from(Array(i).keys()); }
const shuffle = [1,3,0,4,2];

function freq(channel,i){
  const band = 2*channel + shuffle[i]*6;
  // scale lower frequencies down for more even bars
  return freqs[band] * (0.5 + 0.5*i/4);
}

function scale(i){ const x=Math.abs(2-i); return (3-x)/3 * opts.amp; }

function path(channel){
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
  ctx.bezierCurveTo(x[1], m+1, x[2], y[0], x[3], y[0]);
  ctx.bezierCurveTo(x[4], y[0], x[4], y[1], x[5], y[1]);
  ctx.bezierCurveTo(x[6], y[1], x[6], y[2], x[7], y[2]);
  ctx.bezierCurveTo(x[8], y[2], x[8], y[3], x[9], y[3]);
  ctx.bezierCurveTo(x[10], y[3], x[10], y[4], x[11], y[4]);
  ctx.bezierCurveTo(x[12], y[4], x[12], m, x[13], m);
  ctx.lineTo(1000,m+1);
  ctx.lineTo(x[13], m-1);
  ctx.bezierCurveTo(x[12], m, x[12], h-y[4], x[11], h-y[4]);
  ctx.bezierCurveTo(x[10], h-y[4], x[10], h-y[3], x[9], h-y[3]);
  ctx.bezierCurveTo(x[8], h-y[3], x[8], h-y[2], x[7], h-y[2]);
  ctx.bezierCurveTo(x[6], h-y[2], x[6], h-y[1], x[5], h-y[1]);
  ctx.bezierCurveTo(x[4], h-y[1], x[4], h-y[0], x[3], h-y[0]);
  ctx.bezierCurveTo(x[2], h-y[0], x[1], m, x[0], m);
  ctx.lineTo(0,m);
  ctx.fill();
  ctx.stroke();
}

function visualize(){
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

function onStream(stream){
  const input = context.createMediaStreamSource(stream);
  input.connect(analyser);
  visualize();
}

function onStreamError(e){
  document.body.innerHTML = "<h1>Requires HTTPS and audio access</h1>";
  console.error(e);
}

async function start(){
  context = new AudioContext();
  await context.resume();
  analyser = context.createAnalyser();
  freqs = new Uint8Array(analyser.frequencyBinCount);

  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    onStream(stream);
  }catch(e){
    onStreamError(e);
  }
  startBtn.remove();
}

startBtn.addEventListener("click", start);
