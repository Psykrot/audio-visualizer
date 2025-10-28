window.addEventListener("DOMContentLoaded", () => {
  // Parse access token from URL hash
  const hash = window.location.hash.substring(1); // remove #
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");

  const loginButton = document.getElementById("login-button");
  const visualizerContainer = document.getElementById("visualizer");

  if (accessToken) {
    // Hide login button
    if (loginButton) loginButton.style.display = "none";

    // Clear URL hash so it doesn't show in address bar
    history.replaceState(null, "", window.location.pathname);

    // Start visualizer
    startVisualizer(accessToken);
  } else {
    // Show login button
    if (loginButton) {
      loginButton.style.display = "block";
      loginButton.addEventListener("click", () => {
        // Redirect to backend login
        window.location.href = "https://auth.avinylmix.com/login";
      });
    }
  }

  function startVisualizer(token) {
    console.log("Spotify access token:", token);

    // Example placeholder
    visualizerContainer.innerHTML = `<p style="color:white;">Visualizer started!</p>`;

    // TODO: fetch currently playing track or start audio visualizer
    // fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    //   headers: { Authorization: `Bearer ${token}` }
    // }).then(res => res.json()).then(console.log);
  }
});
