// Check if access_token is in URL hash
function getAccessTokenFromHash() {
  const hash = window.location.hash.substring(1); // remove #
  const params = new URLSearchParams(hash);
  return params.get("access_token");
}

let accessToken = getAccessTokenFromHash();

const loginButton = document.getElementById("login-button");
const visualizerContainer = document.getElementById("visualizer");

// If we have a token, hide login button and start visualizer
if (accessToken) {
  if (loginButton) loginButton.style.display = "none";
  startVisualizer(accessToken);
} else {
  // Show login button
  if (loginButton) {
    loginButton.style.display = "block";
    loginButton.addEventListener("click", () => {
      // Redirect to your backend login
      window.location.href = "https://auth.avinylmix.com/login";
    });
  }
}

// Function to start visualizer (example)
function startVisualizer(token) {
  console.log("Access token:", token);

  // TODO: replace this with your audio visualizer logic
  visualizerContainer.innerHTML = `<p style="color:white;">Visualizer started with Spotify token!</p>`;

  // Example: you could fetch currently playing track:
  // fetch("https://api.spotify.com/v1/me/player/currently-playing", {
  //   headers: { Authorization: `Bearer ${token}` }
  // }).then(res => res.json()).then(console.log);
}
