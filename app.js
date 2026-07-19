// 1. Firebase SDK Imports (CDN के ज़रिए लाइव कनेक्शन) - 💡 यहाँ orderBy को दोबारा जोड़ा है
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. आपकी Vinsona Media की सीक्रेट चाबी 🔑
const firebaseConfig = {
  apiKey: "AIzaSyDRxDMwj1yU-gfVl3z3MYe7QfB3U_EvXS8",
  authDomain: "vinsona-media.firebaseapp.com",
  projectId: "vinsona-media",
  storageBucket: "vinsona-media.firebasestorage.app",
  messagingSenderId: "858167007545",
  appId: "1:858167007545:web:0cec92359af21fb2cbf0e8",
  measurementId: "G-6SSPRFJ9S3"
};

// Firebase को चालू करें
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. लाइव डेटा स्टोर करने के लिए एरे वेरिएबल
let sampleData = []; 

// 4. फ़ायरबेस से लाइव ऑटोमैटिक डेटा खींचने का लॉजिक (डॉक्यूमेंट आईडी के हिसाब से सॉर्टेड 🚀)
function listenToTrendingContent() {
    console.log("📡 फ़ायरबेस लाइव डेटाबेस से कनेक्ट हो रहा है...");
    // 💡 यहाँ "__name__" (डॉक्यूमेंट आईडी) के हिसाब से लेटेस्ट डेटा को सबसे ऊपर लाने का पक्का लॉजिक डाला है
    const q = query(collection(db, "trending_reels"), orderBy("__name__", "desc"), limit(100));
    
    onSnapshot(q, (querySnapshot) => {
        sampleData = [];
        querySnapshot.forEach((doc) => {
            sampleData.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ डेटाबेस से ${sampleData.length} वीडियो सफलतापूर्वक लोड हुए!`);
        filterData(); 
    }, (error) => {
        console.error("❌ फ़ायरबेस से डेटा रीड करने में एरर:", error);
        const container = document.getElementById('content-container');
        if(container) container.innerHTML = `<p style="color:red;">डेटा लोड करने में समस्या आई। कृपया रिफ्रेश करें।</p>`;
    });
}

// एलिमेंट्स और वेरिएबल्स
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
const scrollTopBtn = document.getElementById('scrollTopBtn');
const exitModal = document.getElementById("exit-modal");
const notificationEl = document.getElementById("live-notification");
const notifTextEl = document.getElementById("notif-text");

// 🎬 वीडियो पॉपअप के नए एलिमेंट्स
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

const legalPages = {
    privacy: `<h2>Privacy Policy</h2><p>Vinsona Media में आपका स्वागत है। हम अपने यूज़र्स की प्राइवेसी का पूरा सम्मान करते हैं</p>`,
    terms: `<h2>Terms & Conditions</h2><p>Vinsona Media का उपयोग करके आप निम्नलिखित शर्तों से सहमत होते हैं:</p>`,
    dmca: `<h2>DMCA / Copyright Policy</h2><p>यदि आप किसी सामग्री के मालिक हैं और हटाना चाहते हैं, तो <strong>vinsona9818@gmail.com</strong> पर ईमेल करें।</p>`,
    contact: `<h2>Contact Us</h2><p><strong>ईमेल:</strong> vinsona9818@gmail.com</p>`
};

window.showLegalPage = function(pageKey) { if(legalText && legalModal) { legalText.innerHTML = legalPages[pageKey]; legalModal.classList.remove('hidden'); } }
window.closeLegalPage = function() { if(legalModal) legalModal.classList.add('hidden'); }

// 🎬 वीडियो पॉपअप खोलने का फंक्शन
window.openVideoPopup = function(itemId) {
    const item = sampleData.find(d => d.id === itemId);
    if (!item) return;

    if(popupVideoTitle) popupVideoTitle.innerText = item.title;
    if(popupVideoViews) popupVideoViews.innerText = `👁️ ${item.views || 0} व्यूज`;
    
    const wrapper = document.querySelector('.video-player-wrapper');
    if(wrapper) {
        if (item.videoUrl && (item.videoUrl.includes('embed') || item.videoUrl.includes('instagram.com') || item.videoUrl.includes('youtube.com'))) {
            wrapper.innerHTML = `<iframe src="${item.videoUrl}" width="100%" height="450px" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
        } else if (item.videoUrl) {
            wrapper.innerHTML = `
                <video id="popup-video-player" controls width="100%" height="auto">
                    <source src="${item.videoUrl}" type="video/mp4">
                </video>
            `;
        }
    }

    if(popupDownloadBtn) {
        popupDownloadBtn.onclick = function() {
            if(videoPopupModal) videoPopupModal.classList.add("hidden");
            triggerTimer(item.videoUrl || item.audioUrl);
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
        container.innerHTML = `<p style="color: #aaa; padding: 40px; font-size: 16px;">यहाँ दिखाने के लिए कोई वीडियो या रिंगटोन नहीं है...</p>`;
        if(loadMoreBtn) loadMoreBtn.style.display = "none";
        return;
    }

    const limitedData = data.slice(0, itemsShown);

    limitedData.forEach(item => {
        const isFav = favorites.includes(item.id);
        const card = document.createElement('div');
        card.className = 'card';
        const whatsappText = encodeURIComponent(`🔥 Vinsona Media पर इसे डाउनलोड करें: ${item.title}`);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText} 👉 ` + window.location.href;

        card.innerHTML = `
            ${item.trending ? '<span class="trending-badge">🔥 Trending</span>' : ''}
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${item.id}')">♥</button>
            <h3>${item.title || 'शीर्षक उपलब्ध नहीं'}</h3>
            <div class="star-rating">${item.rating || '⭐⭐⭐⭐⭐'}</div>
            <div class="card-stats"><span>👁️ ${item.views || 0} व्यूज</span><span>📥 ${item.downloads || 0} डाउनलोड</span></div>
            ${item.audioUrl ? `<audio id="audio-${item.id}" controls><source src="${item.audioUrl}" type="audio/mp3"></audio>` : ''}
            <div class="button-group">
                <div class="row-btns">
                    ${item.audioUrl ? `<button class="download-btn audio-btn" onclick="triggerTimer('${item.audioUrl}')">📥 MP3</button>` : ''}
                    ${item.videoUrl ? `<button class="download-btn video-btn" onclick="openVideoPopup('${item.id}')">🎥 Video</button>` : ''}
                </div>
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-btn">🟢 Share on WhatsApp</a>
                <button class="copy-btn" onclick="copyLink('${item.title || ''}')">🔗 Copy Link</button>
            </div>
        `;
        container.appendChild(card);
    });
    if(loadMoreBtn) {
        if(itemsShown >= data.length) { loadMoreBtn.style.display = "none"; } else { loadMoreBtn.style.display = "inline-block"; }
    }
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

if(loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => { itemsShown += 20; filterData(); });
}

window.toggleFavorite = function(id) {
    if(favorites.includes(id)) { favorites = favorites.filter(favId => favId !== id); } else { favorites.push(id); }
    localStorage.setItem('vinsona_favs', JSON.stringify(favorites)); filterData();
}
window.copyLink = function(title) { navigator.clipboard.writeText(window.location.href); alert(`"${title}" का लिंक कॉपी हो गया है!`); }

function filterData() {
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    let filtered = sampleData;
    if (currentCategory !== 'all') filtered = filtered.filter(item => item.category === currentCategory);
    if (showOnlyTrending) filtered = filtered.filter(item => item.trending === true);
    if (keyword) filtered = filtered.filter(item => item.title.toLowerCase().includes(keyword));
    displayCards(filtered);
}

document.getElementById('filter-trending')?.addEventListener('click', () => { showOnlyTrending = true; itemsShown = 40; filterData(); });
document.getElementById('filter-all-tags')?.addEventListener('click', () => { showOnlyTrending = false; itemsShown = 40; filterData(); });
searchInput?.addEventListener('input', () => { itemsShown = 40; filterData(); });
catButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        catButtons.forEach(b => b.classList.remove('active')); e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-category'); itemsShown = 40; filterData();
    });
});

window.onscroll = function() { if (scrollTopBtn) { if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) { scrollTopBtn.style.display = "block"; } else { scrollTopBtn.style.display = "none"; } } };
if(scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

document.addEventListener("mouseleave", function (e) { if (e.clientY < 0 && exitModal) { exitModal.classList.remove("hidden"); } });
window.closeExitModal = function() { if(exitModal) exitModal.classList.add("hidden"); }

const fakeNames = ["अमित", "रोहन", "राहुल", "विकास"];
const fakeActions = ["ने अभी-अभी वीडियो डाउनलोड किया 🎥", "ने नई रिंगटोन डाउनलोड की 🎵"];
function showFakeNotification() {
    if(!notificationEl || !notifTextEl) return;
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const act = fakeActions[Math.floor(Math.random() * fakeActions.length)];
    notifTextEl.innerText = `⚡ ${name} ${act}`; notificationEl.classList.remove("hidden");
    setTimeout(() => { notificationEl.classList.add("hidden"); }, 4000);
}
setInterval(showFakeNotification, 15000);

// लाइव फ़ायरबेस लिसनर शुरू किया
listenToTrendingContent();
