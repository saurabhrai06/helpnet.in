# 🆘 helpnet.in – Civic Help Platform

**Live Site:** https://ravishrk124.github.io/helpnet.in/

A real-time, hyperlocal web app for civic help requests, neighborhood alerts, and community support.

---

## 📌 What is helpnet.in?

**helpnet.in** is a community-powered civic assistance platform designed to bring people together during everyday challenges or emergencies. Whether you're offering help, reporting a local issue, or in need of urgent aid — helpnet.in lets you post, view, and respond in real time.

---

## 🚀 Features

✅ Real-time post feed (Need / Offer / Alert)  
✅ Live location-based map with markers (via Leaflet.js)  
✅ Post urgency levels (High, Medium, Low)  
✅ Network Information API (shows online status, speed, quality)  
✅ Offline support & dynamic map toggle for slow networks  
✅ Filter by category + scroll to post from history  
✅ Dark mode toggle ☀️🌙  
✅ LocalStorage saves your own post history  
✅ Dummy data generator for demo & testing  
✅ Notification system (floating alerts with "View" option)  
✅ AI suggest button placeholder (Gemini removed; ready for ChatGPT integration if desired)

---

## 🧠 Tech Stack

- **HTML, CSS, JavaScript**
- **Leaflet.js** – Interactive maps
- **Geolocation API** – Detects user location
- **Network Information API** – Adapts UI for slow connections
- **LocalStorage API** – Stores user post history
- **Intersection Observer API** – (ready for scroll animations)
- *(Optional)* Gemini / ChatGPT AI (currently disabled)

---

## 🗺️ How It Works

1. The user allows location access.
2. The map centers around them, and dummy posts appear.
3. Users can:
   - Post "Need", "Offer", or "Alert"
   - Filter posts
   - React or respond to others
4. App adapts based on network type (shows/hides map).
5. History, theme, and post data are saved locally.

---

## 📂 Folder Structure
<pre> ``` 📁 helpnet.in/ ├── 📄 index.html ├── 🎨 style.css ├── 🧠 script.js └── 📂 assets/ (optional - icons/images) ``` </pre>


---

## 🌍 Hosting

The app is hosted using **GitHub Pages** at:  
🔗https://ravishrk124.github.io/helpnet.in/

---


## 📦 Future Ideas (Not Yet Implemented)

- ChatGPT-based reply suggestions (secured via backend)
- PWA support for installable offline usage
- Push notifications for new nearby posts
- Trust/reputation system for responders
- Media uploads (photos of local issues)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.  
Feel free to fork and adapt this platform for your community.

---

## 📄 License

MIT License — Open for community use and adaptation.

---

## 🙌 Made with ❤️ by [Ravish Kumar](https://github.com/ravishrk124)
