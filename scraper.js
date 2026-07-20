const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } = require('firebase/firestore');
const axios = require('axios');

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

const YOUTUBE_API_KEY = "AIzaSyAjbt-L3NLaRi_0ZFwwI6-7xu3-nTkWkY0";

// 🎬 सभी 6 कैटेगरीज के लिए सटीक सर्च क्वेरी
const categoriesToFetch = [
    { name: "shorts", query: "Hindi Trending Shorts" },
    { name: "status", query: "Hindi Video Status Song" },
    { name: "motivation", query: "Hindi Motivational Shorts Status" },
    { name: "sad", query: "Sad Hindi Shorts Status Song" },
    { name: "romantic", query: "Romantic Love Shorts Video" },
    { name: "fullsong", query: "Latest Hindi Full Video Song 2026" }
];

// 🧹 पुराना डेटा साफ़ करने का फ़ंक्शन
async function deleteOldData() {
    console.log("🧹 पुराना डेटा साफ़ किया जा रहा है...");
    try {
        const querySnapshot = await getDocs(collection(db, "trending_reels"));
        const deletePromises = [];
        querySnapshot.forEach((document) => {
            deletePromises.push(deleteDoc(doc(db, "trending_reels", document.id)));
        });
        await Promise.all(deletePromises);
        console.log("✅ पुराना डेटा साफ़ हो गया!");
    } catch (err) { 
        console.error("डिलीट एरर:", err); 
    }
}

// 🚀 मुख्य स्क्रैपर जो हर कैटेगरी के 20 वीडियो लाएगा
async function startAutoScraper() {
    try {
        await deleteOldData();
        console.log("🚀 Multi-Category Scraper (20 Videos per Category) चालू हो रहा है...");
        let totalCount = 0;

        for (let cat of categoriesToFetch) {
            try {
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(cat.query)}&type=video&videoEmbeddable=true&regionCode=IN&maxResults=20&key=${YOUTUBE_API_KEY}`;
                const response = await axios.get(url);
                
                for (let video of response.data.items) {
                    if (!video.id.videoId) continue;

                    await addDoc(collection(db, "trending_reels"), {
                        title: video.snippet.title,
                        category: cat.name,
                        youtubeId: video.id.videoId,
                        views: `${Math.floor(Math.random() * 800 + 100)}K`,
                        trending: Math.random() > 0.4 ? true : false,
                        createdAt: serverTimestamp()
                    });
                    totalCount++;
                }
                console.log(`✅ ${cat.name} कैटेगरी के 20 वीडियो लोड हो गए!`);
            } catch (catErr) {
                console.error(`❌ ${cat.name} एरर:`, catErr.message);
            }
        }

        console.log(`\n🎉 कुल ${totalCount} (6 x 20 = 120) नए वीडियो सफलतापूर्वक लोड हो गए!`);
        process.exit(0);
    } catch (e) {
        console.error("❌ मुख्य एरर: ", e);
        process.exit(1);
    }
}

startAutoScraper();
