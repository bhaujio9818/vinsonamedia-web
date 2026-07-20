import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Firebase Configuration
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

let allVideos = [];
let filteredVideos = [];
let currentCategory = "all";
let currentSearch = "";
let isTrendingOnly = false;
let displayedCount = 12;

// 🚀 Page Initializer
document.addEventListener("DOMContentLoaded", () => {
    fetchVideos();
    setupEventListeners();
});

// 🎬 Fetch Videos from Firebase
async function fetchVideos() {
    const container = document.getElementById("content-container");
    try {
        const q = query(collection(db, "trending_reels"), orderBy("createdAt", "desc"), limit(120));
        const querySnapshot = await getDocs(q);
        
        allVideos = [];
        querySnapshot.forEach((doc) => {
            allVideos.push({ id: doc.id, ...doc.data() });
        });

        applyFilters();
    } catch (error) {
        console.error("Error fetching videos:", error);
        if(container) container.innerHTML = `<p style="text-align:center; color:#ff4d4d;">वीडियो लोड करने में समस्या आई। कृपया रिफ्रेश करें।</p>`;
    }
}

// 🎯 Render Video Cards (Fixed Theme Color Issue for Light Mode)
function renderCards(videosToRender) {
    const container = document.getElementById("content-container");
    if (!container) return;

    if (videosToRender.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#aaa; grid-column: 1/-1; padding: 40px 0;">कोई वीडियो नहीं मिला! 🔍</p>`;
        return;
    }

    container.innerHTML = videosToRender.slice(0, displayedCount).map(video => `
        <div class="card" onclick="openVideoModal('${video.youtubeId}', '${escapeHtml(video.title)}', '${video.views || '100K'}')">
            <div class="thumbnail-wrapper" style="position:relative; aspect-ratio:16/9; background:#000; border-radius:12px; overflow:hidden;">
                <img src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg" alt="${escapeHtml(video.title)}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                <div class="play-icon" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.6); border-radius:50%; width:45px; height:45px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px;">▶</div>
                ${video.trending ? `<span class="badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:#fff; font-size:11px; padding:3px 8px; border-radius:4px; font-weight:bold;">🔥 HOT</span>` : ''}
            </div>
            <div class="card-info" style="padding:12px 5px;">
                <h4 style="margin:0 0 6px 0; font-size:14px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(video.title)}</h4>
                <div style="font-size:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span>👁️ ${video.views || '100K'} व्यूज</span>
                    <span style="text-transform:uppercase; background:rgba(128,128,128,0.2); padding:2px 6px; border-radius:4px; font-size:10px;">${video.category || 'shorts'}</span>
                </div>
            </div>
        </div>
    `).join('');

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
        if (displayedCount >= videosToRender.length) {
            loadMoreBtn.style.display = "none";
        } else {
            loadMoreBtn.style.display = "block";
        }
    }
}

// 🔍 Filter & Search Logic
function applyFilters() {
    filteredVideos = allVideos.filter(video => {
        const matchesCategory = (currentCategory === "all") || (video.category === currentCategory);
        const matchesSearch = video.title.toLowerCase().includes(currentSearch.toLowerCase());
        const matchesTrending = isTrendingOnly ? video.trending === true : true;
        return matchesCategory && matchesSearch && matchesTrending;
    });

    displayedCount = 12;
    renderCards(filteredVideos);
}

// ⚙️ Setup Event Listeners
function setupEventListeners() {
    // Categories
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentCategory = e.target.getAttribute("data-category");
            applyFilters();
        });
    });

    // Search Box
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value.trim();
            applyFilters();
        });
    }

    // Trending Tags
    const filterTrending = document.getElementById("filter-trending");
    const filterAllTags = document.getElementById("filter-all-tags");

    if (filterTrending) {
        filterTrending.addEventListener("click", () => {
            isTrendingOnly = true;
            applyFilters();
        });
    }
    if (filterAllTags) {
        filterAllTags.addEventListener("click", () => {
            isTrendingOnly = false;
            applyFilters();
        });
    }

    // Load More Button
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            displayedCount += 12;
            renderCards(filteredVideos);
        });
    }

    // Modal Close
    const closeVideoModal = document.getElementById("close-video-modal");
    if (closeVideoModal) {
        closeVideoModal.addEventListener("click", closePopup);
    }

    // Scroll Top Button
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            scrollTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
        });
        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // Theme Toggle
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
        });
    }
}

// 🎥 Open Video Modal
window.openVideoModal = function(youtubeId, title, views) {
    const modal = document.getElementById("video-popup-modal");
    const wrapper = document.querySelector(".video-player-wrapper");
    const titleEl = document.getElementById("popup-video-title");
    const viewsEl = document.getElementById("popup-video-views");
    const actionBtn = document.getElementById("popup-download-btn");

    if (!modal || !wrapper) return;

    wrapper.innerHTML = `
        <iframe width="100%" height="315" src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" 
        title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:12px;"></iframe>
    `;

    if (titleEl) titleEl.innerText = title;
    if (viewsEl) viewsEl.innerText = `👁️ ${views} व्यूज`;

    if (actionBtn) {
        actionBtn.onclick = () => window.triggerTimer(youtubeId);
    }

    modal.classList.remove("hidden");
};

// 🛑 Close Modal
function closePopup() {
    const modal = document.getElementById("video-popup-modal");
    const wrapper = document.querySelector(".video-player-wrapper");
    if (wrapper) wrapper.innerHTML = "";
    if (modal) modal.classList.add("hidden");
}

// 🛡️ AdSense Safe - Watch Full Video Timer Handler
window.triggerTimer = function(youtubeId) {
    if (!youtubeId) return;
    
    const downloadModal = document.getElementById("download-modal");
    const timerNumber = document.getElementById("timer-number");
    
    if (downloadModal) downloadModal.classList.remove("hidden");
    let timeLeft = 3;
    if (timerNumber) timerNumber.innerText = timeLeft;
    
    const countdown = setInterval(() => {
        timeLeft--;
        if (timerNumber) timerNumber.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            if (downloadModal) downloadModal.classList.add("hidden");
            
            // 🎬 Direct Official YouTube Video Player View
            window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
        }
    }, 1000);
};

// 📜 Policy Pages Data & Handlers
const legalData = {
    privacy: `
        <h2>Privacy Policy</h2>
        <p>Vinsona Media आपकी प्राइवेसी का ध्यान रखता है। हम आपकी पसंद और यूजर एक्सपीरियंस को बेहतर बनाने के लिए कुकीज़ (Cookies) का उपयोग करते हैं। आपकी कोई भी पर्सनल जानकारी सेव नहीं की जाती है। गूगल एडसेंस (AdSense) विज्ञापनों के लिए कुकीज़ का उपयोग कर सकता है।</p>
    `,
    terms: `
        <h2>Terms & Conditions</h2>
        <p>Vinsona Media एक एंटरटेनमेंट प्लेटफॉर्म है। इस वेबसाइट पर उपलब्ध सामग्री केवल प्रचार और मनोरंजन के उद्देश्य से उपलब्ध कराई जाती है।</p>
    `,
    dmca: `
        <h2>DMCA / Copyright Policy</h2>
        <p>Vinsona Media सभी कॉपीराइट नियमों का सम्मान करता है। यदि आप किसी सामग्री के वैध मालिक हैं और उसे साइट से हटवाना चाहते हैं, तो कृपया vinsona9818@gmail.com पर संपर्क करें। हम 24-48 घंटों में इसे हटा देंगे।</p>
    `
};

window.showLegalPage = function(type) {
    const legalModal = document.getElementById("legal-modal");
    const legalText = document.getElementById("legal-text");
    
    if (legalModal && legalText && legalData[type]) {
        legalText.innerHTML = legalData[type];
        legalModal.classList.remove("hidden");
    }
};

window.closeLegalPage = function() {
    const legalModal = document.getElementById("legal-modal");
    if (legalModal) {
        legalModal.classList.add("hidden");
    }
};

window.acceptCookies = function() {
    const bar = document.getElementById("cookie-notice");
    if (bar) bar.style.display = "none";
};

// 🛠️ Utility: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
