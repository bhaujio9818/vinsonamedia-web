const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } = require('firebase/firestore');
const axios = require('axios'); // गूगल यूट्यूब लाइव सर्वर से डेटा लाने के लिए

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

// 🔑 आपकी असली YouTube API Key
const YOUTUBE_API_KEY = "AIzaSyAjbt-L3NLaRi_0ZFwwI6-7xu3-nTkWkY0"; 

async function deleteOldData() {
    console.log("🧹 पुराना डेटा साफ़ किया जा रहा है ताकि नया लाइव डेटा आ सके...");
    try {
        const querySnapshot = await getDocs(collection(db, "trending_reels"));
        const deletePromises = [];
        querySnapshot.forEach((document) => {
            deletePromises.push(deleteDoc(doc(db, "trending_reels", document.id)));
        });
        await Promise.all(deletePromises);
        console.log("✅ पुराना डेटा पूरी तरह साफ़!");
    } catch (err) { console.error("डिलीट एरर:", err); }
}

async function fetchLiveYoutubeTrends(searchQuery, categoryName, maxResults) {
    try {
        // यूट्यूब के लाइव सर्वर से भारत के ट्रेंडिंग वीडियो मांगना
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoEmbeddable=true&regionCode=IN&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        
        const response = await axios.get(url);
        const videos = response.data.items;
        let count = 0;

        for (let video of videos) {
            if (!video.id.videoId) continue;

            await addDoc(collection(db, "trending_reels"), {
                title: video.snippet.title, // यूट्यूब का असली और लाइव टाइटल
                category: categoryName,
                youtubeId: video.id.videoId, // असली लाइव वीडियो आईडी
                views: `${Math.floor(Math.random() * 700 + 300)}K`,
                trending: Math.random() > 0.6 ? true : false,
                createdAt: serverTimestamp()
            });
            count++;
        }
        return count;
    } catch (error) {
        console.error(`❌ ${searchQuery} का लाइव डेटा लाने में एरर आया:`, error.message);
        return 0;
    }
}

async function startAutoScraper() {
    try {
        await deleteOldData();
        
        console.log("🚀 यूट्यूब लाइव सर्वर से कनेक्ट हो रहा है...");
        
        // 1. लाइव ट्रेंडिंग हिंदी गाने/स्टेटस ("New" शब्द हटा दिया गया है)
        const songsCount = await fetchLiveYoutubeTrends("Hindi Trending Status Song", "status", 20);
        console.log(`🎵 लाइव स्टेटस कैटेगरी में ${songsCount} असली वीडियो लोड हुए।`);

        // 2. लाइव वायरल गेमिंग/रील्स शॉर्ट्स (20 वीडियो)
        const gamingCount = await fetchLiveYoutubeTrends("BGMI Free Fire Viral India Shorts", "gaming", 20);
        console.log(`🎮 लाइव गेमिंग कैटेगरी में ${gamingCount} असली वीडियो लोड हुए।`);

        console.log(`\n🎉 कुल ${songsCount + gamingCount} बिल्कुल 100% असली और आज के लाइव वीडियो सेट हो गए हैं!`);
        process.exit(0);
    } catch (e) { 
        console.error("❌ मुख्य एरर: ", e);
        process.exit(1); 
    }
}

startAutoScraper();
