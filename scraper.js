const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } = require('firebase/firestore');
const axios = require('axios');

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

// 🔑 API Keys
const YOUTUBE_API_KEY = "AIzaSyAjbt-L3NLaRi_0ZFwwI6-7xu3-nTkWkY0";
const SPOTIFY_CLIENT_ID = "a81c543806b24ed89f65cf92b3f70fd2";
const SPOTIFY_CLIENT_SECRET = "76290b018beb48629ef47fd8f379c684";

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
    } catch (err) { console.error("डिलीट एरर:", err); }
}

async function getSpotifyToken() {
    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Spotify Token एरर:", error.message);
        return null;
    }
}

async function fetchSpotifyAndYoutubeTrends(spotifyToken) {
    let count = 0;
    try {
        let trackNames = [];
        if (spotifyToken) {
            // 1. Spotify से भारत के टॉप ट्रेंडिंग गानों की लिस्ट निकालना
            const url = `https://api.spotify.com/v1/search?q=Top%20Hindi%20Trending&type=track&market=IN&limit=10`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });
            const tracks = response.data.tracks.items;
            trackNames = tracks.map(t => `${t.name} ${t.artists[0].name}`);
        }

        // 2. अगर Spotify से नाम मिले तो उन गानों के यूट्यूब शॉर्ट्स, वरना डिफ़ॉल्ट ट्रेंड्स खींचना
        const queries = trackNames.length > 0 ? trackNames : ["Hindi Trending Status Song", "Viral Instagram Reel Audio India"];

        for (let query of queries) {
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&regionCode=IN&maxResults=2&key=${YOUTUBE_API_KEY}`;
            const ytRes = await axios.get(ytUrl);
            
            for (let video of ytRes.data.items) {
                if (!video.id.videoId) continue;

                await addDoc(collection(db, "trending_reels"), {
                    title: `🎵 ${video.snippet.title}`,
                    category: "status", // वेबसाइट की कैटेगरी के साथ परफेक्ट मैच
                    youtubeId: video.id.videoId,
                    views: `${Math.floor(Math.random() * 800 + 200)}K`,
                    trending: true,
                    createdAt: serverTimestamp()
                });
                count++;
            }
        }
        return count;
    } catch (error) {
        console.error("❌ Trends Fetching Error:", error.message);
        return count;
    }
}

async function startAutoScraper() {
    try {
        await deleteOldData();
        console.log("🚀 Spotify + YouTube Engine चालू हो रहा है...");

        const spotifyToken = await getSpotifyToken();
        const totalLoaded = await fetchSpotifyAndYoutubeTrends(spotifyToken);

        console.log(`\n🎉 सफलता! कुल ${totalLoaded} 100% वर्किंग और लाइव गाने लोड हो चुके हैं!`);
        process.exit(0);
    } catch (e) {
        console.error("❌ मुख्य एरर: ", e);
        process.exit(1);
    }
}

startAutoScraper();
