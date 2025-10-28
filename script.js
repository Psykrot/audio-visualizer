window.addEventListener("load", () => {
  const loginButton = document.getElementById("login-button");
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");

  // Resize canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // --- Parse token from URL hash ---
  function getAccessToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromHash = params.get("access_token");
    if (tokenFromHash) {
      sessionStorage.setItem("spotify_token", tokenFromHash);
      // Remove hash so button stays hidden
      history.replaceState(null, "", window.location.pathname);
      return tokenFromHash;
    }
    return sessionStorage.getItem("spotify_token");
  }

  const accessToken = getAccessToken();

  // Show/hide login button
  if (accessToken) {
    loginButton.style.display = "none"; // Force hide
    startVisualizer(accessToken);
  } else {
    loginButton.style.display = "block";
    loginButton.onclick = () => {
      window.location.href = "https://auth.avinylmix.com/login";
    };
  }

  // --- Visualizer ---
  function startVisualizer(token) {
    console.log("Spotify token:", token);

    // Placeholder: simple bars for now
    const numBars = 64;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < numBars; i++) {
        const height = Math.random() * canvas.height * 0.7;

        const barWidth = canvas.width / numBars;
        const x = i * barWidth;
        const y = canvas.height - height;

        const gradient = ctx.createLinearGradient(x, y, x + barWidth, canvas.height);
        gradient.addColorStop(0, "#ff6ec4");
        gradient.addColorStop(0.3, "#7873f5");
        gradient.addColorStop(0.6, "#f9e07f");
        gradient.addColorStop(1, "#00ffea");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * 0.8, height);
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
});
