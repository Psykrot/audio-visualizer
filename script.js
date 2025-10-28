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

  // Get token from URL hash or sessionStorage
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

  // -----------------------
  // Spotify Web Playback SDK
  // -----------------------
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "OBS Visualizer",
      getOAuthToken: cb => { cb(accessToken); },
      volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => console.error(message));
    player.addListener('authentication_error', ({ message }) => console.error(message));
    player.addListener('account_error', ({ message }) => console.error(message));
    player.addListener('playback_error', ({ message }) => console.error(message));

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      // Optionally transfer playback to this device
      fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ device_ids: [device_id], play: true })
      });
    });

    player.connect();

    // -----------------------
    // Web Audio Visualizer
    // -----------------------
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Create MediaElementSource using the Spotify player (hack: use <audio> element)
    const audioElem = document.createElement("audio");
    audioElem.crossOrigin = "anonymous";
    audioElem.autoplay = true;
    audioElem.src = ""; // Playback happens through SDK, we just use analyser
    const source = audioCtx.createMediaElementSource(audioElem);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Draw visualizer
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 255 * canvas.height * 0.8;
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
  };
});
