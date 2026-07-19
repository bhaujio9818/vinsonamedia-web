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

const container = document.getElementById('content-container');
const searchInput = document.getElementById('search-input');
const catButtons = document.querySelectorAll('.cat-btn');
const loadMoreBtn = document.getElementById("loadMoreBtn");
const videoPopupModal = document.getElementById("video-popup-modal");
const popupVideoTitle = document.getElementById("popup-video-title");
const closeVideoModalBtn = document.getElementById("close-video-modal");

let currentCategory = 'all';
let itemsShown = 40; 

window.openVideoPopup = function(itemId) {
    const item = sampleData.find(d => d.id === itemId);
    if (!item) return;

    if(popupVideoTitle) popupVideoTitle.innerText = item.title;
    
    const wrapper = document.querySelector('.video-player-wrapper');
    if(wrapper) {
        // यूट्यूब वीडियो या शॉर्ट्स को प्रीमियम एम्बेड प्लेयर में लोड करना
        wrapper.innerHTML = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${item.youtubeId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:10px;"></iframe>`;
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
        const card = document.createElement('div');
        card.className = 'card';
        const whatsappUrl = `https://api.whatsapp.com/send?text=` + encodeURIComponent(`🔥 देखें ट्रेंडिंग वीडियो: ${item.title} 👉 ` + window.location.href);

        card.innerHTML = `
            ${item.trending ? '<span class="trending-badge">🔥 Viral</span>' : ''}
            <h3>${item.title}</h3>
            <div class="star-rating">⭐⭐⭐⭐⭐</div>
            <div class="card-stats"><span>👁️ ${item.views} व्यूज</span></div>
            
            <!-- 🎬 यूट्यूब थंबनेल का असली चित्र -->
            <div class="video-preview-box" onclick="openVideoPopup('${item.id}')" style="cursor:pointer; background:#000; height:180px; border-radius:8px; overflow:hidden; margin-bottom:10px; position:relative;">
                <img src="https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg" width="100%" height="100%" style="object-fit: cover;">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.7); width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px;">▶</div>
            </div>
            
            <div class="button-group">
                <button class="download-btn video-btn" onclick="openVideoPopup('${item.id}')">🎥 Play Now</button>
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-btn">🟢 Share on WhatsApp</a>
            </div>
        `;
        container.appendChild(card);
    });
}

if(loadMoreBtn) loadMoreBtn.addEventListener("click", () => { itemsShown += 20; filterData(); });

function filterData() {
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    let filtered = sampleData;
    if (currentCategory !== 'all') filtered = filtered.filter(item => item.category === currentCategory);
    if (keyword) filtered = filtered.filter(item => item.title.toLowerCase().includes(keyword));
    displayCards(filtered);
}

searchInput?.addEventListener('input', () => { filterData(); });
catButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        catButtons.forEach(b => b.classList.remove('active')); e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-category'); filterData();
    });
});

listenToTrendingContent();
