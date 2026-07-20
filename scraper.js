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

// 🎵 Spotify टोकन जनरेट करने का फंक्शन
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

// 🎵 Spotify के ट्रेंडिंग गाने लाने का फंक्शन
async function fetchSpotifyTrends(spotifyToken) {
    if (!spotifyToken) return 0;
    try {
        const url = `https://api.spotify.com/v1/search?q=Hindi%20Trending%20Top%20Hits&type=track&market=IN&limit=15`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        const tracks = response.data.tracks.items;
        let count = 0;

        for (let track of tracks) {
            await addDoc(collection(db, "trending_reels"), {
                title: `${track.name} - ${track.artists[0].name}`,
                category: "spotify_music",
                spotifyId: track.id,
                audioUrl: track.preview_url || "",
                imageUrl: track.album.images[0]?.url || "",
                views: `${Math.floor(Math.random() * 800 + 200)}K Plays`,
                trending: true,
                createdAt: serverTimestamp()
            });
            count++;
        }
        return count;
    } catch (error) {
        console.error("❌ Spotify Trends एरर:", error.message);
        return 0;
    }
}

// 🎥 YouTube ट्रेंड्स लाने का फंक्शन
async function fetchLiveYoutubeTrends(searchQuery, categoryName, maxResults) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoEmbeddable=true&regionCode=IN&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        const response = await axios.get(url);
        const videos = response.data.items;
        let count = 0;

        for (let video of videos) {
            if (!video.id.videoId) continue;

            await addDoc(collection(db, "trending_reels"), {
                title: video.snippet.title,
                category: categoryName,
                youtubeId: video.id.videoId,
                views: `${Math.floor(Math.random() * 700 + 300)}K`,
                trending: Math.random() > 0.5 ? true : false,
                createdAt: serverTimestamp()
            });
            count++;
        }
        return count;
    } catch (error) {
        console.error(`❌ ${searchQuery} एरर:`, error.message);
        return 0;
    }
}

async function startAutoScraper() {
    try {
        await deleteOldData();
        console.log("🚀 AI Trend Engine चालू हो रहा है...");

        // 1. YouTube गानों का लाइव डेटा
        const ytCount = await fetchLiveYoutubeTrends("Hindi Trending Status Song", "status", 15);
        console.log(`🎥 YouTube से ${ytCount} वीडियो लोड हुए।`);

        // 2. Spotify ट्रेंडिंग म्यूज़िक का डेटा
        const spotifyToken = await getSpotifyToken();
        const spCount = await fetchSpotifyTrends(spotifyToken);
        console.log(`🎵 Spotify से ${spCount} वायरल गाने लोड हुए।`);

        console.log(`\n🎉 बधाई हो! कुल ${ytCount + spCount} YouTube + Spotify ट्रेंडिंग आइटम्स सेट हो गए हैं!`);
        process.exit(0);
    } catch (e) {
        console.error("❌ मुख्य एरर: ", e);
        process.exit(1);
    }
}

startAutoScraper();
