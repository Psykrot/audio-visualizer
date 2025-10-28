window.addEventListener("load", () => {
  const loginButton = document.getElementById("login-button");
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Get token from session storage
  function getAccessToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromHash = params.get("access_token");
    if (tokenFromHash) {
      sessionStorage.setItem("spotify_token", tokenFromHash);
      history.replaceState(null, "", window.location.pathname);
      return tokenFromHash;
    }
    return sessionStorage.getItem("spotify_token");
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    loginButton.style.display = "block";
    loginButton.onclick = () => {
      window.location.href = "https://auth.avinylmix.com/login";
    };
    return;
  } else {
    loginButton.style.display = "none";
  }

  // ----------------------
  // Visualizer Setup
  // ----------------------
  const numBars = 64;
  let currentTrackId = null;
  let segments = [];
  let trackStartTime = 0;

  async function fetchCurrentlyPlaying() {
    try {
      const res = await fetch("https://auth.avinylmix.com/currently-playing", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      if (!data.item) return;

      // If track changed, fetch audio analysis
      if (data.item.id !== currentTrackId) {
        currentTrackId = data.item.id;
        const analysisRes = await fetch(`https://auth.avinylmix.com/audio-analysis/${currentTrackId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const analysis = await analysisRes.json();
        segments = analysis.segments || [];
      }

      trackStartTime = Date.now() - data.progress_ms;
    } catch (err) {
      console.error("Spotify fetch error:", err);
    }
  }

  fetchCurrentlyPlaying();
  setInterval(fetchCurrentlyPlaying, 5000); // update track info

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (segments.length > 0) {
      const nowMs = Date.now() - trackStartTime;
      // Find segment matching current time
      const currentSegment = segments.find(s => s.start * 1000 <= nowMs && (s.start + s.duration) * 1000 > nowMs);

      const loudness = currentSegment ? Math.min(currentSegment.loudness_max + 60, 60) / 60 : 0.1;

      // Smooth random-ish bar heights based on loudness
      for (let i = 0; i < numBars; i++) {
        const barHeight = loudness * canvas.height * (0.5 + Math.random() * 0.5);
        const barWidth = canvas.width / numBars;
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
    } else {
      // fallback: random bars
      for (let i = 0; i < numBars; i++) {
        const barHeight = Math.random() * canvas.height * 0.7;
        const barWidth = canvas.width / numBars;
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
    }

    requestAnimationFrame(draw);
  }

  draw();
});
