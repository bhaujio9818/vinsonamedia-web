import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDRxDMwj1yU-gfVl3z3MYe7QfB3U_EvXS8",
  authDomain: "vinsona-media.firebaseapp.com",
  projectId: "vinsona-media",
  storageBucket: "vinsona-media.firebasestorage.app",
  messagingSenderId: "858167007545",
  appId: "1:858167007545:web:0cec92359af21fb2cbf0e8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let sampleData = []; 

function listenToTrendingContent() {
    console.log("📡 फ़ायरबेस लाइव कनेक्ट हो रहा है...");
    const q = query(collection(db, "trending_reels"), limit(100));
    
    onSnapshot(q, (querySnapshot) => {
        sampleData = [];
        querySnapshot.forEach((doc) => {
            sampleData.push({ id: doc.id, ...doc.data() });
        });
        sampleData.reverse(); 
        filterData(); 
    }, (error) => {
        console.error("❌ एरर:", error);
    });
}

let favorites = JSON.parse(localStorage.getItem('vinsona_favs')) || [];
const container = document.getElementById('content-container');
const searchInput = document.getElementById('search-input');
const catButtons = document.querySelectorAll('.cat-btn');
const loadMoreBtn = document.getElementById("loadMoreBtn");
const downloadModal = document.getElementById("download-modal");
const timerNumber = document.getElementById("timer-number");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const cookieNotice = document.getElementById('cookie-notice');
const legalModal = document.getElementById('legal-modal');
const legalText = document.getElementById('legal-text');

const videoPopupModal = document.getElementById("video-popup-modal");
const popupVideoTitle = document.getElementById("popup-video-title");
const popupVideoViews = document.getElementById("popup-video-views");
const popupDownloadBtn = document.getElementById("popup-download-btn");
const closeVideoModalBtn = document.getElementById("close-video-modal");

let currentCategory = 'all';
let showOnlyTrending = false;
let itemsShown = 40; 

if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    });
}

if(localStorage.getItem('cookie_accepted') && cookieNotice) { cookieNotice.classList.add('hidden'); }
window.acceptCookies = function() { localStorage.setItem('cookie_accepted', 'true'); if(cookieNotice) cookieNotice.classList.add('hidden'); }

window.showLegalPage = function(pageKey) { 
    if(legalText && legalModal) { 
        legalText.innerHTML = `<h2>Policy Page</h2><p>Vinsona Media Content.</p>`; 
        legalModal.classList.remove('hidden'); 
    } 
}
window.closeLegalPage = function() { if(legalModal) legalModal.classList.add('hidden'); }

window.openVideoPopup = function(itemId) {
    const item = sampleData.find(d => d.id === itemId);
    if (!item) return;

    if(popupVideoTitle) popupVideoTitle.innerText = item.title;
    if(popupVideoViews) popupVideoViews.innerText = `👁️ ${item.views || 0} व्यूज`;
    
    const wrapper = document.querySelector('.video-player-wrapper');
    if(wrapper) {
        wrapper.innerHTML = `<video id="popup-video-player" controls width="100%" height="auto" autoplay poster="${item.videoUrl}#t=0.1"><source src="${item.videoUrl}" type="video/mp4"></video>`;
    }
    if(popupDownloadBtn) {
        popupDownloadBtn.onclick = function() {
            if(videoPopupModal) videoPopupModal.classList.add("hidden");
            triggerTimer(item.videoUrl);
        };
    }
    if(videoPopupModal) videoPopupModal.classList.remove("hidden");
};

if(closeVideoModalBtn) {
    closeVideoModalBtn.addEventListener('click', () => {
        if(videoPopupModal) videoPopupModal.classList.add("hidden");
        const wrapper = document.querySelector('.video-player-wrapper');
        if(wrapper) wrapper.innerHTML = ''; 
    });
}

function displayCards(data) {
    if(!container) return;
    container.innerHTML = '';
    if(data.length === 0) {
        container.innerHTML = `<p style="color: #aaa; padding: 40px;">कोई डेटा नहीं मिला...</p>`;
        return;
    }
    const limitedData = data.slice(0, itemsShown);
    limitedData.forEach(item => {
        const isFav = favorites.includes(item.id);
        const card = document.createElement('div');
        card.className = 'card';
        const whatsappUrl = `https://api.whatsapp.com/send?text=` + encodeURIComponent(`🔥 डाउनलोड करें: ${item.title} 👉 ` + window.location.href);

        card.innerHTML = `
            ${item.trending ? '<span class="trending-badge">🔥 Trending</span>' : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${item.id}')">♥</button>
            <h3>${item.title}</h3>
            <div class="star-rating">⭐⭐⭐⭐⭐</div>
            <div class="card-stats"><span>👁️ ${item.views} व्यूज</span><span>📥 ${item.downloads} डाउनलोड</span></div>
            
            <!-- 🎬 वीडियो साफ़ दिखने के लिए प्लेयर की पहली झलक -->
            <div class="video-preview-box" onclick="openVideoPopup('${item.id}')" style="cursor:pointer; background:#000; height:180px; border-radius:8px; overflow:hidden; margin-bottom:10px; position:relative;">
                <video width="100%" height="100%" style="object-fit: cover;" muted playsinline preload="metadata">
                    <source src="${item.videoUrl}#t=0.1" type="video/mp4">
                </video>
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.6); width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px;">▶</div>
            </div>

            ${item.audioUrl ? `<audio controls style="width:100%; margin-bottom:10px;"><source src="${item.audioUrl}" type="audio/mp3"></audio>` : ''}
            
            <div class="button-group">
                <div class="row-btns">
                    ${item.videoUrl ? `<button class="download-btn video-btn" onclick="openVideoPopup('${item.id}')">🎥 Video</button>` : ''}
                    ${item.audioUrl ? `<button class="download-btn audio-btn" onclick="triggerTimer('${item.audioUrl}')">📥 MP3</button>` : ''}
                </div>
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-btn">🟢 Share on WhatsApp</a>
            </div>
        `;
        container.appendChild(card);
    });
}

window.triggerTimer = function(url) {
    if(!url) return;
    if(downloadModal) downloadModal.classList.remove("hidden");
    let timeLeft = 3;
    if(timerNumber) timerNumber.innerText = timeLeft;
    const countdown = setInterval(() => {
        timeLeft--;
        if(timerNumber) timerNumber.innerText = timeLeft;
        if(timeLeft <= 0) { clearInterval(countdown); if(downloadModal) downloadModal.classList.add("hidden"); window.open(url, '_blank'); }
    }, 1000);
}

if(loadMoreBtn) loadMoreBtn.addEventListener("click", () => { itemsShown += 20; filterData(); });
window.toggleFavorite = function(id) {
    if(favorites.includes(id)) { favorites = favorites.filter(favId => favId !== id); } else { favorites.push(id); }
    localStorage.setItem('vinsona_favs', JSON.stringify(favorites)); filterData();
}

function filterData() {
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    let filtered = sampleData;
    if (currentCategory !== 'all') filtered = filtered.filter(item => item.category === currentCategory);
    if (showOnlyTrending) filtered = filtered.filter(item => item.trending === true);
    if (keyword) filtered = filtered.filter(item => item.title.toLowerCase().includes(keyword));
    displayCards(filtered);
}

document.getElementById('filter-trending')?.addEventListener('click', () => { showOnlyTrending = true; filterData(); });
document.getElementById('filter-all-tags')?.addEventListener('click', () => { showOnlyTrending = false; filterData(); });
searchInput?.addEventListener('input', () => { filterData(); });
catButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        catButtons.forEach(b => b.classList.remove('active')); e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-category'); filterData();
    });
});

listenToTrendingContent();
