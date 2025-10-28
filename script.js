window.addEventListener("load", () => {
  const loginButton = document.getElementById("login-button");
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");

  // Resize canvas to fill window
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Get Spotify token from hash or sessionStorage
  let accessToken = null;
  if (window.location.hash.includes("access_token=")) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    accessToken = params.get("access_token");
    if (accessToken) sessionStorage.setItem("spotify_token", accessToken);
    history.replaceState(null, "", window.location.pathname);
  }

  if (!accessToken) {
    accessToken = sessionStorage.getItem("spotify_token");
  }

  // Show/hide login button
  if (accessToken) {
    loginButton.style.display = "none";
    startVisualizer(accessToken);
  } else {
    loginButton.style.display = "block";
    loginButton.onclick = () => {
      window.location.href = "https://auth.avinylmix.com/login";
    };
  }

  // ---------------------
  // Visualizer function
  // ---------------------
  function startVisualizer(token) {
    console.log("Spotify token:", token);

    const numBars = 64;
    const bars = new Array(numBars).fill(0);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < numBars; i++) {
        const height = Math.random() * canvas.height * 0.7; // placeholder for audio data

        const barWidth = canvas.width / numBars;
        const x = i * barWidth;
        const y = canvas.height - height;

        // Vaporwave gradient colors
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
