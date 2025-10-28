const loginButton = document.getElementById("login-button");
const loginContainer = document.getElementById("login-container");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioData = new Array(64).fill(0);
let token = null;

// Login button click
loginButton.addEventListener("click", () => {
  window.location.href = "https://auth.avinylmix.com/login";
});

// Check for token in sessionStorage
token = sessionStorage.getItem("spotify_access_token");

if (token) {
  loginContainer.style.display = "none";
  startVisualizer();
}

// Poll backend for token after login redirect
async function checkToken() {
  try {
    const res = await fetch("https://auth.avinylmix.com/get-token", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      token = data.access_token;
      if (token) {
        sessionStorage.setItem("spotify_access_token", token);
        loginContainer.style.display = "none";
        startVisualizer();
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Call every 2 seconds until token exists
setInterval(() => {
  if (!token) checkToken();
}, 2000);

// Visualizer drawing
function drawVisualizer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / audioData.length;
  audioData.forEach((value, i) => {
    const barHeight = value * canvas.height;
    const x = i * barWidth;
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, canvas.height);
    gradient.addColorStop(0, "#ff6ec7"); // Pink
    gradient.addColorStop(0.5, "#ffd700"); // Gold
    gradient.addColorStop(1, "#1babe9"); // Blue
    ctx.fillStyle = gradient;
    ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
  });

  requestAnimationFrame(drawVisualizer);
}

// Poll Spotify API for audio features
async function updateAudioData() {
  if (!token) return;

  try {
    const trackRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!trackRes.ok) {
      audioData.fill(0);
      return;
    }

    const trackData = await trackRes.json();
    if (!trackData || !trackData.item) {
      audioData.fill(0);
      return;
    }

    const featuresRes = await fetch(
      `https://api.spotify.com/v1/audio-features/${trackData.item.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const features = await featuresRes.json();
    // Map energy/loudness/danceability to 0-1 range
    audioData = Array.from({ length: 64 }, () =>
      Math.random() * (features.energy || 0.5)
    );
  } catch (err) {
    console.error(err);
  }
}

// Start visualizer loop
function startVisualizer() {
  setInterval(updateAudioData, 100); // update audio every 100ms
  drawVisualizer();
}
