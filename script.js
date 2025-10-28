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

  // Get token
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

  if (accessToken) {
    loginButton.style.display = "none";
    startVisualizer(accessToken);
  } else {
    loginButton.style.display = "block";
    loginButton.onclick = () => {
      window.location.href = "https://auth.avinylmix.com/login";
    };
  }

  async function startVisualizer(token) {
    const numBars = 64;

    // Fetch current track periodically
    let trackId = null;
    let audioAnalysis = null;
    async function fetchTrack() {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 204 || !res.ok) return; // nothing playing
        const data = await res.json();
        if (!data.item) return;
        if (data.item.id !== trackId) {
          trackId = data.item.id;
          // Fetch audio analysis for new track
          const analysisRes = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          audioAnalysis = await analysisRes.json();
        }
      } catch (err) {
        console.error("Spotify fetch error", err);
      }
    }

    // Update track every 5 seconds
    fetchTrack();
    setInterval(fetchTrack, 5000);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let barHeights = new Array(numBars).fill(0);

      if (audioAnalysis && audioAnalysis.segments) {
        const segments = audioAnalysis.segments;
        const nowMs = performance.now() % (segments[segments.length - 1].start * 1000);
        const index = segments.findIndex(s => s.start * 1000 > nowMs);
        if (index >= 0) {
          for (let i = 0; i < numBars; i++) {
            const seg = segments[(index + i) % segments.length];
            barHeights[i] = Math.min(seg.loudness_max + 60, 60) / 60 * canvas.height * 0.8; // scale loudness
          }
        }
      } else {
        // fallback: random bars
        for (let i = 0; i < numBars; i++) {
          barHeights[i] = Math.random() * canvas.height * 0.7;
        }
      }

      // Draw bars
      const barWidth = canvas.width / numBars;
      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const y = canvas.height - barHeights[i];
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, canvas.height);
        gradient.addColorStop(0, "#ff6ec4");
        gradient.addColorStop(0.3, "#7873f5");
        gradient.addColorStop(0.6, "#f9e07f");
        gradient.addColorStop(1, "#00ffea");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * 0.8, barHeights[i]);
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
});
