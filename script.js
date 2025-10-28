window.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  const visualizerContainer = document.getElementById("visualizer");

  // Check if token is in URL hash
  function getAccessToken() {
    const hash = window.location.hash.substring(1); // remove #
    const params = new URLSearchParams(hash);
    const tokenFromHash = params.get("access_token");

    if (tokenFromHash) {
      // Save in sessionStorage so refresh doesn’t lose it
      sessionStorage.setItem("spotify_token", tokenFromHash);
      // Remove hash from URL
      history.replaceState(null, "", window.location.pathname);
      return tokenFromHash;
    }

    // Otherwise, try sessionStorage
    return sessionStorage.getItem("spotify_token");
  }

  const accessToken = getAccessToken();

  if (accessToken) {
    // Hide login button
    if (loginButton) loginButton.style.display = "none";

    // Start the visualizer
    startVisualizer(accessToken);
  } else {
    // Show login button
    if (loginButton) {
      loginButton.style.display = "block";
      loginButton.addEventListener("click", () => {
        window.location.href = "https://auth.avinylmix.com/login";
      });
    }
  }

  function startVisualizer(token) {
    console.log("Spotify access token:", token);

    // Placeholder: replace with your visualizer logic
    visualizerContainer.innerHTML = `<p style="color:white;">Visualizer started!</p>`;

    // Example: fetch currently playing track
    // fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    //   headers: { Authorization: `Bearer ${token}` }
    // }).then(res => res.json()).then(console.log);
  }
});
