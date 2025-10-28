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

  const numBars = 64;
  let currentTrackId = null;
  let segments = [];
  let trackStartTime = 0;
  let isPlaying = false;

  async function fetchCurrentlyPlaying() {
    try {
      const res = await fetch("https://auth.avinylmix.com/currently-playing", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        isPlaying = false;
        return;
      }
      const data = await res.json();
      if (!data.item || data.is_playing === false) {
        isPlaying = false;
        return;
      }

      isPlaying = true;

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
      isPlaying = false;
    }
  }

  fetchCurrentlyPlaying();
  setInterval(fetchCurrentlyPlaying, 5000);

  let previousSegment = null;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPlaying && segments.length > 0) {
      const nowMs = Date.now() - trackStartTime;
      // Find current segment
      const currentSegment = segments.find(s => s.start * 1000 <= nowMs && (s.start + s.duration) * 1000 > nowMs);
      if (currentSegment) {
        // Linear interpolation for smooth bar growth
        const segmentProgress = ((nowMs - currentSegment.start * 1000) / (currentSegment.duration * 1000));
        const loudness = Math.min(currentSegment.loudness_max + 60, 60) / 60;

        const barHeight = loudness * canvas.height * 0.8;

        const barWidth = canvas.width / numBars;

        for (let i = 0; i < numBars; i++) {
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
    }

    requestAnimationFrame(draw);
  }

  draw();
});
