// ===== Constants & State =====
const postData = []; // Stores all posts
const markerRefs = []; // Stores Leaflet marker objects
let userLocation = null; // {lat, lon}
let activeFilter = "all"; // Current filter for posts

// ===== Utility =====
/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Storage Module =====
/**
 * Handles saving and retrieving data from localStorage.
 */
const Storage = {
  /**
   * Saves a new post to localStorage (for user's history).
   * @param {Object} post - The post object to save.
   */
  savePost(post) {
    const saved = JSON.parse(localStorage.getItem("myPosts")) || [];
    saved.push(post);
    localStorage.setItem("myPosts", JSON.stringify(saved));
  },
  /**
   * Retrieves all saved posts from localStorage.
   * @returns {Array<Object>} An array of post objects.
   */
  getPosts() {
    return JSON.parse(localStorage.getItem("myPosts")) || [];
  },
  /**
   * Saves the current theme preference to localStorage.
   * @param {string} theme - 'light' or 'dark'.
   */
  saveTheme(theme) {
    localStorage.setItem("theme", theme);
  },
  /**
   * Retrieves the saved theme preference from localStorage.
   * @returns {string} The saved theme ('light' or 'dark'), defaults to 'light'.
   */
  getTheme() {
    return localStorage.getItem("theme") || "light";
  }
};

// ===== UI Module =====
/**
 * Manages all User Interface rendering and updates.
 */
const UI = {
  /**
   * Renders the main feed of posts based on the active filter.
   */
  renderFeed() {
    const container = document.getElementById("feedContainer");
    container.innerHTML = ""; // Clear existing posts

    // Filter posts based on activeFilter and sort by timestamp (newest first)
    const filtered = postData
      .filter(p => activeFilter === "all" || p.type === activeFilter)
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500 py-4">No posts found for this category.</p>';
    } else {
      filtered.forEach(p => this.addPostCard(p));
    }

    // Add Intersection Observer after posts are added
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target); // Animate once
        }
      });
    }, {
      threshold: 0.1,
    });

    // Observe all posts
    document.querySelectorAll("#feedContainer .post").forEach(post => {
      observer.observe(post);
    });

    // Scroll to feed section after rendering if not already there
    document.getElementById('feedSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },


  /**
   * Adds a single post card to the feed container.
   * @param {Object} post - The post object to render.
   */
  addPostCard(post) {
    const container = document.getElementById("feedContainer");
    const div = document.createElement("div");
    div.className = `post ${post.type}`;
    div.dataset.postId = post.id; // Store post ID for reliable lookups

    const postedAgo = Math.floor((Date.now() - post.timestamp) / 60000);
    // Determine post status based on expiration (30 minutes)
    const status = postedAgo > 30 ? "🔴 Expired" : "🟢 Active";
    const reactions = post.reactions;
    const reactionSummary = `👍 ${reactions.helped} ❤️ ${reactions.safe} 👎 ${reactions.unsolved}`;

    div.innerHTML = `
      <strong>${post.emoji} ${capitalize(post.type)}</strong> - <span>${post.urgency.toUpperCase()}</span><br>
      <p>${post.text}</p>
      <div class="info">
        Posted by: ${post.nickname || "Anonymous"}<br>
        🕒 ${postedAgo} min ago • ${status}<br>
        🙋 Responders: ${post.responders.join(', ') || "None"}<br>
        ${reactionSummary}
      </div>
      <div class="reactions">
        <button onclick="Actions.react('${post.id}', 'helped')">👍 Helped</button>
        <button onclick="Actions.react('${post.id}', 'safe')">❤️ Safe Now</button>
        <button onclick="Actions.react('${post.id}', 'unsolved')">👎 Unsolved</button>
        <button onclick="Actions.respond('${post.id}')">🚶 I'm Coming</button>
      </div>
    `;
    container.prepend(div); // Add to the top of the feed
  },

  /**
   * Updates the countdowns (time ago and status) for all displayed posts.
   */
  updateCountdowns() {
    const cards = document.querySelectorAll("#feedContainer .post");
    cards.forEach(card => {
      const postId = card.dataset.postId;
      const post = postData.find(p => p.id === postId);

      if (post) {
        const postedAgo = Math.floor((Date.now() - post.timestamp) / 60000);
        const status = postedAgo > 30 ? "🔴 Expired" : "🟢 Active";
        const infoEl = card.querySelector(".info");
        if (infoEl) {
          // Update the time and status line
          const lines = infoEl.innerHTML.split("<br>");
          lines[1] = `🕒 ${postedAgo} min ago • ${status}`;
          infoEl.innerHTML = lines.join("<br>");
        }
      }
    });
  },

  /**
   * Loads and displays the user's past posts from localStorage in the history section.
   */
  loadHistory() {
    const ul = document.getElementById("myHistory");
    ul.innerHTML = "";

    const history = Storage.getPosts();
    if (history.length === 0) {
      ul.innerHTML = "<li>No posts yet.</li>";
    } else {
      // Display newest first in history
      history.slice().reverse().forEach(p => {
        const li = document.createElement("li");
        const postedAgo = Math.floor((Date.now() - p.timestamp) / 60000);
        const status = postedAgo > 30 ? "🔴 Expired" : "🟢 Active";

        li.innerHTML = `
          ${p.emoji} <strong>${capitalize(p.type)}</strong>
          (${p.urgency.toUpperCase()})<br>
          🕒 ${postedAgo} min ago • ${status}<br>
          🧾 ${p.text.slice(0, 30)}...
          <button onclick="UI.scrollToPost('${p.id}')">👁 View</button>
        `;
        ul.appendChild(li);
      });
    }
  },

  /**
   * Scrolls the feed to a specific post and highlights it.
   * @param {string} postId - The ID of the post to scroll to.
   */
  scrollToPost(postId) {
    const target = document.querySelector(`#feedContainer .post[data-post-id="${postId}"]`);
    if (!target) {
        // Auto-switch to 'all' filter and retry
        document.querySelector("#filterList li.active")?.classList.remove("active");
        const allFilter = document.querySelector("#filterList li[data-type='all']");
        allFilter?.classList.add("active");
        activeFilter = "all";
        UI.renderFeed();
        MapManager.filterMarkers();
        setTimeout(() => this.scrollToPost(postId), 100); // Retry after re-render
        return;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('highlight'); // Add a class for temporary visual highlight
      setTimeout(() => {
          target.classList.remove('highlight');
      }, 1500); // Remove highlight after 1.5 seconds
  },

  /**
   * Displays a notification message in the floating notification container.
   * @param {string} message - The message to display.
   * @param {string} [type='info'] - Type of notification (e.g., 'info', 'success', 'error').
   * @param {string} [postId=null] - Optional ID of a post related to the notification, for 'View' button.
   */
  notify(message, type = 'info', postId = null) {
    const container = document.getElementById("notificationContainer");
    const notificationItem = document.createElement("div");
    notificationItem.className = `notification-item notification-${type}`; // Add type for potential styling

    notificationItem.innerHTML = `
      <span>${message}</span>
      ${postId ? `<button onclick="UI.scrollToPost('${postId}')">🔍 View</button>` : ''}
    `;

    container.appendChild(notificationItem); // Add to the bottom of the stack (due to flex-direction-reverse)

    // Set timeout to remove the notification after 10 seconds (changed from 20s)
    setTimeout(() => {
        notificationItem.style.animation = 'fadeOut 2s forwards'; // Apply fadeOut animation
        // Remove element after animation completes
        notificationItem.addEventListener('animationend', () => {
            notificationItem.remove();
        }, { once: true });
    }, 10000); // 10 seconds
  }
};

// ===== Map Manager =====
/**
 * Manages the Leaflet map and markers.
 */
const MapManager = {
  map: null,
  // Custom icons for different post types
  icons: {
    need: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/841/841364.png", iconSize: [30, 30] }),
    offer: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/148/148767.png", iconSize: [30, 30] }),
    alert: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/463/463612.png", iconSize: [30, 30] })
  },

  /**
   * Initializes the Leaflet map at the given coordinates.
   * @param {number} lat - Latitude for map center.
   * @param {number} lon - Longitude for map center.
   */
  initMap(lat, lon) {
    if (this.map) {
        this.map.remove(); // Remove existing map if re-initializing
    }
    this.map = L.map("map").setView([lat, lon], 15); // Set view with zoom level 15
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors" // Accurate attribution for OSM
    }).addTo(this.map);
  },

  /**
   * Adds a marker to the map for a given post.
   * @param {Object} post - The post object containing lat/lon and type.
   */
  addMarker(post) {
    const marker = L.marker([post.lat, post.lon], { icon: this.icons[post.type] }).addTo(this.map);
    marker.bindPopup(`<b>${post.emoji} ${capitalize(post.type)}</b><br>${post.text.slice(0, 50)}...`);
    markerRefs.push({ marker, type: post.type, id: post.id }); // Store post ID with marker for filtering
  },

  /**
   * Filters markers on the map based on the active filter and post expiration.
   */
  filterMarkers() {
    markerRefs.forEach(obj => {
      // Find the corresponding post to check its expiration status
      const post = postData.find(p => p.id === obj.id);
      // A post is considered expired if it's older than 30 minutes
      const isExpired = post ? (Date.now() - post.timestamp) / 60000 > 30 : true;

      // Show marker if it matches the active filter AND is not expired
      if (this.map && (activeFilter === "all" || obj.type === activeFilter) && !isExpired) {
        obj.marker.addTo(this.map);
      } else if (this.map) { // Ensure map exists before trying to remove layers
        this.map.removeLayer(obj.marker);
      }
    });
  }
};

// ===== Actions =====
/**
 * Contains functions for user interactions and data manipulation.
 */
const Actions = {
  /**
   * Handles the submission of the post creation form.
   * @param {Event} e - The form submission event.
   */
  postFormHandler(e) {
    e.preventDefault();
    const type = document.getElementById("type").value;
    const urgency = document.getElementById("urgency").value;
    const nickname = document.getElementById("nickname").value.trim();
    const text = document.getElementById("message").value.trim();
    const emoji = type === "need" ? "🆘" : type === "offer" ? "✅" : "⚠️";

    if (!text) {
        UI.notify("Please enter a message for your post.", 'error');
        return;
    }
    if (!userLocation) {
        UI.notify("Cannot post: Your location is not available yet. Please enable location services.", 'error');
        return;
    }

    const post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), // Unique ID
      type,
      urgency,
      nickname,
      text,
      emoji,
      lat: userLocation.lat,
      lon: userLocation.lon,
      timestamp: Date.now(),
      responders: [],
      reactions: {
        helped: 0,
        safe: 0,
        unsolved: 0
      }
    };

    postData.push(post);
    Storage.savePost(post); // Save to user's history
    UI.renderFeed(); // Re-render the feed to include the new post
    MapManager.addMarker(post);
    UI.loadHistory(); // Reload history to show new post
    document.getElementById("postForm").reset(); // Clear form
    UI.notify(`📣 Your ${type} post has been shared!`, 'success', post.id);
  },

  /**
   * Handles reactions (helped, safe, unsolved) to a post.
   * @param {string} postId - The ID of the post being reacted to.
   * @param {string} type - The type of reaction ('helped', 'safe', 'unsolved').
   */
  react(postId, type) {
    const post = postData.find(p => p.id === postId);
    if (post && post.reactions[type] !== undefined) {
      post.reactions[type]++;
      UI.notify(`🛎️ Someone marked "${post.text.slice(0, 30)}..." as ${type}!`, 'info', postId);
      UI.renderFeed(); // Re-render to update reaction counts
    }
  },

  /**
   * Simulates a user responding to a post.
   * @param {string} postId - The ID of the post to suggest a reply for.
   */
  respond(postId) {
    const post = postData.find(p => p.id === postId);
    if (!post) return;

    const nickname = prompt("Enter your nickname to respond:");
    if (nickname && nickname.trim()) {
      post.responders.push(nickname.trim());
      UI.notify(`🚶 ${nickname.trim()} is going to help "${post.text.slice(0, 25)}..."`, 'info', postId);
      UI.renderFeed(); // Re-render to update responders
    } else {
        UI.notify("Response cancelled or nickname was empty.", 'info');
    }
  }
};

// ===== App Initialization =====
/**
 * Main application object responsible for initializing all components.
 */
const App = {
  /**
   * Generates a set of dummy posts for demonstration purposes.
   * Posts are created with specific urgencies and random locations slightly offset from the user.
   */
  generateDummyPosts: function () {
    if (!userLocation) {
      console.warn("Cannot generate dummy posts: user location not available.");
      return;
    }

    const samplePosts = [
      { text: "Offering extra blankets, can drop off near main square", type: "offer", urgency: "medium" },
      { text: "Need urgent medicine from pharmacy, can't leave home.", type: "need", urgency: "high" },
      { text: "Streetlight not working on Elm Street, very dark!", type: "alert", urgency: "low" },
      { text: "Found a lost dog near the park, black lab, friendly.", type: "alert", urgency: "medium" },
      { text: "Need water delivery for elders on 5th Ave", type: "need", urgency: "medium" },
      { text: "Urgent: tree fallen blocking road near Oakwood bridge", type: "alert", urgency: "high" }
    ];

    const emojis = { need: "🆘", offer: "✅", alert: "⚠️" };
    const names = ["Amit", "Fatima", "John", "Meena", "Carlos", "Zoya"];

    // Generate 4 dummy posts, including the specific ones
    // To ensure variety, we'll pick 4 random unique posts from samplePosts
    const selectedPosts = [];
    const availableIndices = Array.from({length: samplePosts.length}, (_, i) => i);
    for (let i = 0; i < 4; i++) {
        if (availableIndices.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const selectedIndex = availableIndices.splice(randomIndex, 1)[0];
        selectedPosts.push(samplePosts[selectedIndex]);
    }


    selectedPosts.forEach(sample => {
      // Generate coordinates slightly offset from user's location
      const latOffset = (Math.random() - 0.5) * 0.01; // +/- 0.005 degrees lat
      const lonOffset = (Math.random() - 0.5) * 0.01; // +/- 0.005 degrees lon
      const timestamp = Date.now() - (Math.random() * 25 * 60 * 1000); // Randomly 0 to 25 mins ago

      const post = {
        id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), // Unique ID
        type: sample.type,
        urgency: sample.urgency,
        nickname: names[Math.floor(Math.random() * names.length)],
        text: sample.text,
        emoji: emojis[sample.type],
        lat: userLocation.lat + latOffset,
        lon: userLocation.lon + lonOffset,
        timestamp: timestamp,
        responders: [],
        reactions: {
          helped: Math.floor(Math.random() * 4),
          safe: Math.floor(Math.random() * 4),
          unsolved: Math.floor(Math.random() * 2)
        }
      };

      postData.push(post);
      MapManager.addMarker(post);
    });
    UI.renderFeed(); // Render feed after all dummy posts are added
  },

  /**
   * Generates a set of dummy notifications for demonstration purposes.
   */
  generateDummyNotifications: function() {
    // Generate exactly 2 dummy notifications, visible for 10 seconds
    UI.notify("Welcome to helpnet.in! Your community is here to help.", 'info');
    UI.notify("A new 'Need Help' post just appeared near you!", 'success');
  },

  /**
   * Initializes the entire application: geolocation, network monitoring, event listeners, etc.
   */
  init() {
    // Geolocation API: Get user's current position
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        userLocation = { lat: latitude, lon: longitude };
        document.getElementById("location").textContent = `📍 (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        MapManager.initMap(latitude, longitude); // Initialize map with user's location
        App.generateDummyPosts(); // Generate dummy data after map is initialized
        App.generateDummyNotifications(); // Generate dummy notifications after map is initialized
      },
      err => {
        document.getElementById("location").textContent = "⚠️ Location denied or unavailable.";
        UI.notify("Location access is required for helpnet.in to function.", 'error');
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true, // Request most precise location
        timeout: 10000, // 10 seconds to get location
        maximumAge: 0 // Don't use cached position
      }
    );

    // Network Information API: Monitor network status
    const onlineStatusEl = document.getElementById("onlineStatus");
    const networkTypeEl = document.getElementById("networkType");
    const networkSpeedEl = document.getElementById("networkSpeed");
    const networkQualityEl = document.getElementById("networkQuality");
    const loadMapBtn = document.getElementById("loadMapBtn");

    const updateNetworkDisplay = () => {
      // 1. Real-time Online/Offline Status
      if (navigator.onLine) {
          onlineStatusEl.textContent = "Online";
          onlineStatusEl.className = "network-badge online";
      } else {
          onlineStatusEl.textContent = "Offline";
          onlineStatusEl.className = "network-badge offline";
          UI.notify("You are offline. Features may be limited.", 'info');
      }

      // 2. Real-time Network Type and Speed (if Network Information API is available)
      if ("connection" in navigator) {
        const conn = navigator.connection;
        networkTypeEl.textContent = conn.effectiveType || "N/A";
        networkSpeedEl.textContent = conn.downlink !== undefined ? `${conn.downlink.toFixed(1)} Mbps` : "N/A";

        // 3. Derived "Network Quality" (Fake/Interpreted Metric)
        let quality = "Unknown";
        let qualityClass = "";

        if (conn.effectiveType === '4g' && conn.downlink >= 5) {
            quality = "Excellent";
            qualityClass = "excellent";
        } else if (conn.effectiveType === '4g' || (conn.effectiveType === '3g' && conn.downlink >= 1)) {
            quality = "Good";
            qualityClass = "good";
        } else if (conn.effectiveType === '3g' || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
            quality = "Fair";
            qualityClass = "fair";
            // No longer automatically hiding map here, just informing
        } else {
            quality = "Unknown";
            qualityClass = "";
        }
        networkQualityEl.textContent = quality;
        networkQualityEl.className = `network-badge ${qualityClass}`;

        // Always attempt to show the map if location is available.
        document.getElementById("map").style.display = "block";
        loadMapBtn.style.display = "none";

        if (!MapManager.map && userLocation) {
            markerRefs.length = 0;
            MapManager.initMap(userLocation.lat, userLocation.lon);
            postData.forEach(p => MapManager.addMarker(p));
            MapManager.filterMarkers();
        }

      } else {
        networkTypeEl.textContent = "N/A";
        networkSpeedEl.textContent = "N/A";
        networkQualityEl.textContent = "N/A";
        networkQualityEl.className = "network-badge";
      }
    };

    // Add event listeners for network changes
    if ("connection" in navigator) {
        navigator.connection.addEventListener("change", updateNetworkDisplay);
    }
    window.addEventListener("online", updateNetworkDisplay);
    window.addEventListener("offline", updateNetworkDisplay);
    updateNetworkDisplay(); // Initial call to set network status

    // Event listener for the "Load Map" button (still useful if map fails to load initially)
    loadMapBtn.addEventListener("click", () => {
      if (userLocation) {
        document.getElementById("map").style.display = "block";
        if (!MapManager.map) { // Only re-init if map is truly gone
            markerRefs.length = 0; // Clear markers for fresh load
            MapManager.initMap(userLocation.lat, userLocation.lon);
            postData.forEach(p => MapManager.addMarker(p));
            MapManager.filterMarkers();
        }
        loadMapBtn.style.display = "none";
      } else {
        UI.notify("Still waiting for your location to load the map.", 'info');
      }
    });

    // Event listener for post form submission
    document.getElementById("postForm").addEventListener("submit", Actions.postFormHandler);

    // Event listeners for category filter list items (now in header)
    document.querySelectorAll("#filterList li").forEach(li => {
      li.addEventListener("click", () => {
        // Remove 'active' class from previously active filter
        document.querySelector("#filterList li.active").classList.remove("active");
        // Add 'active' class to the clicked filter
        li.classList.add("active");
        // Update the active filter state
        activeFilter = li.dataset.type;
        UI.renderFeed(); // Re-render feed with new filter, and it will now also scroll
        MapManager.filterMarkers(); // Re-filter map markers
      });
    });

    // Theme toggle functionality
    const theme = Storage.getTheme();
    if (theme === "dark") document.body.classList.add("dark");
    document.getElementById("themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      Storage.saveTheme(document.body.classList.contains("dark") ? "dark" : "light");
    });

    // Load user's post history on startup
    UI.loadHistory();
    // Set up interval to update post countdowns (every 15 seconds)
    window.countdownInterval = setInterval(UI.updateCountdowns, 15000);
  }
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});