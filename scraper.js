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

async function deleteOldData() {
    console.log("🧹 पुराना पुराना कचरा साफ़ हो रहा है...");
    try {
        const querySnapshot = await getDocs(collection(db, "trending_reels"));
        const deletePromises = [];
        querySnapshot.forEach((document) => {
            deletePromises.push(deleteDoc(doc(db, "trending_reels", document.id)));
        });
        await Promise.all(deletePromises);
        console.log("✅ पुराना डेटा साफ़!");
    } catch (err) { console.error(err); }
}

async function fetchTrendingMedia(type) {
    let list = [];
    const realAudioLinks = [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        "https://www.cfmedia.vzw.com/storage/tones/preview/44272.mp3", "https://www.cfmedia.vzw.com/storage/tones/preview/44265.mp3",
        "https://www.cfmedia.vzw.com/storage/tones/preview/44261.mp3", "https://www.cfmedia.vzw.com/storage/tones/preview/44259.mp3"
    ];

    try {
        // AI API से रियल वायरल कीवर्ड्स पर डेटा उठाना (रोज़ नया पेज खुलेगा)
        const randomPage = Math.floor(Math.random() * 8) + 1;
        const res = await axios.get(`https://api.pexels.com/videos/search?query=trending&per_page=20&page=${randomPage}`, {
            headers: { 'Authorization': '53307ac4bc5c427dd1a47f9750b7c2b4' },
            timeout: 8000
        });

        const videos = res.data.videos || [];
        videos.forEach((vid, index) => {
            const fileLink = vid.video_files && vid.video_files[0] ? vid.video_files[0].link : "";
            const randomSeed = Math.floor(Math.random() * 9000 + 1000);
            
            if (type === 'shorts' && index < 20) {
                list.push({
                    title: `🔥 India's Viral Short #${randomSeed}`,
                    videoUrl: fileLink,
                    audioUrl: realAudioLinks[index % realAudioLinks.length],
                    category: "gaming"
                });
            } else if (type === 'reels' && index < 20) {
                list.push({
                    title: `🎥 New Trending Reel #${randomSeed}`,
                    videoUrl: fileLink,
                    audioUrl: realAudioLinks[(index + 3) % realAudioLinks.length],
                    category: "status"
                });
            }
        });
    } catch (err) {
        console.log("⚠️ बैकअप जनरेटर एक्टिव...");
        for (let i = 0; i < 20; i++) {
            const seed = Math.floor(Math.random() * 9000 + 1000);
            list.push({
                title: type === 'shorts' ? `🔥 Fresh Short #${seed}` : `👉 Premium Reel #${seed}`,
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                audioUrl: realAudioLinks[i % realAudioLinks.length],
                category: type === 'shorts' ? "gaming" : "status"
            });
        }
    }
    return list;
}

async function startAutoScraper() {
    try {
        await deleteOldData();
        let total = 0;

        const reels = await fetchTrendingMedia('reels');
        for (let item of reels) {
            if(!item.videoUrl) continue;
            await addDoc(collection(db, "trending_reels"), {
                title: item.title, category: item.category,
                views: `${Math.floor(Math.random() * 450 + 50)}K`, downloads: `${Math.floor(Math.random() * 90 + 10)}K`,
                trending: true, audioUrl: item.audioUrl, videoUrl: item.videoUrl, createdAt: serverTimestamp()
            });
            total++;
        }

        const shorts = await fetchTrendingMedia('shorts');
        for (let item of shorts) {
            if(!item.videoUrl) continue;
            await addDoc(collection(db, "trending_reels"), {
                title: item.title, category: item.category,
                views: `${Math.floor(Math.random() * 800 + 200)}K`, downloads: `${Math.floor(Math.random() * 150 + 50)}K`,
                trending: true, audioUrl: item.audioUrl, videoUrl: item.videoUrl, createdAt: serverTimestamp()
            });
            total++;
        }
        console.log(`✅ सफलता! कुल ${total} नया और फ्रेश डेटा लाइव हो गया!`);
        process.exit(0);
    } catch (e) { process.exit(1); }
}
startAutoScraper();
