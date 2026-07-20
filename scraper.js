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

// 🔑 Keys
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

async function startAutoScraper() {
    try {
        await deleteOldData();
        console.log("🚀 AI Trend Engine चालू हो रहा है...");

        let searchTerms = ["Hindi Trending Songs Status", "Viral Instagram Reel Songs"];

        // 1. Spotify से भारत के टॉप ट्रेंडिंग गाने निकालना
        const spotifyToken = await getSpotifyToken();
        if (spotifyToken) {
            try {
                const spRes = await axios.get('https://api.spotify.com/v1/search?q=Top%20Hindi%20Hits&type=track&market=IN&limit=5', {
                    headers: { 'Authorization': `Bearer ${spotifyToken}` }
                });
                const spotifyTracks = spRes.data.tracks.items.map(t => `${t.name} ${t.artists[0].name}`);
                if (spotifyTracks.length > 0) {
                    searchTerms = spotifyTracks;
                    console.log("🎵 Spotify के टॉप गानों की लिस्ट मिल गई है!");
                }
            } catch (e) {
                console.log("Spotify fallback active.");
            }
        }

        let count = 0;
        // 2. ट्रेंडिंग गानों का वीडियो डेटाबेस में सेव करना
        for (let term of searchTerms) {
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(term)}&type=video&videoEmbeddable=true&regionCode=IN&maxResults=3&key=${YOUTUBE_API_KEY}`;
            const ytRes = await axios.get(ytUrl);

            for (let video of ytRes.data.items) {
                if (!video.id.videoId) continue;

                await addDoc(collection(db, "trending_reels"), {
                    title: video.snippet.title,
                    category: "status",
                    youtubeId: video.id.videoId,
                    views: `${Math.floor(Math.random() * 800 + 200)}K`,
                    trending: true,
                    createdAt: serverTimestamp()
                });
                count++;
            }
        }

        console.log(`\n🎉 सफलता! कुल ${count} वीडियो और गाने वेबसाइट पर लाइव लोड हो गए!`);
        process.exit(0);
    } catch (e) {
        console.error("❌ मुख्य एरर: ", e);
        process.exit(1);
    }
}

startAutoScraper();
