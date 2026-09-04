// ============================================
// Configuration
// ============================================
const TMDB_API_KEY = 'f131da87533861d05eff315e68c09b28';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMTMxZGE4NzUzMzg2MWQwNWVmZjMxNWU2OGMwOWIyOCIsIm5iZiI6MTc4NjcxMjI3NC44NjgsInN1YiI6IjZhN2YxMGQyNzBiY2Q3MDdhZmJmOTE4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.EtjmmFfCkuuJ9djdpRKvq-WHA3ZMReR2TvUVl0FyGfs';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// ============================================
// State
// ============================================
let allMovies = [];
let allSeries = [];
let currentItem = null;
let currentServer = 0;
let currentSeason = 1;
let currentEpisode = 1;
let heroMovies = [];
let heroIndex = 0;
let heroInterval = null;

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadLocalData();
    setupSearch();
    setTimeout(() => document.getElementById('loadingScreen').classList.add('hidden'), 800);
});

// ============================================
// Fetch TMDB helper (للمعلومات والإضافات فقط)
// ============================================
async function fetchTMDB(endpoint) {
    const res = await fetch(`${TMDB_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}` }
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
}

// ============================================
// Load Local Data (القراءة من ملفاتك فقط)
// ============================================
async function loadLocalData() {
    try {
        // جلب الأفلام التي أضفتها أنت
        const resMovies = await fetch('data/movies.json');
        allMovies = await resMovies.json();
    } catch (e) {
        allMovies = [];
    }

    try {
        // جلب المسلسلات التي أضفتها أنت
        const resSeries = await fetch('data/series.json');
        allSeries = await resSeries.json();
    } catch (e) {
        allSeries = [];
    }

    // تجهيز السلايدر من أحدث أعمالك المضافة
    const combined = [...allMovies, ...allSeries];
    if (combined.length > 0) {
        heroMovies = combined.slice(0, 5);
        displayHero();
    }

    // عرض القوائم الخاصة بك فقط
    displayGrid('moviesGrid', allMovies, 'movie');
    displayGrid('seriesGrid', allSeries, 'tv');
    displayGrid('trendingGrid', combined, 'all');
}

// ============================================
// Hero Slider
// ============================================
function displayHero() {
    const slider = document.getElementById('heroSlider');
    slider.innerHTML = '';
    
    heroMovies.forEach((item, i) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
        const backdropImg = item.backdrop ? `${IMG_ORIGINAL}${item.backdrop}` : `${IMG_BASE}${item.poster}`;
        
        slide.innerHTML = `
            <img src="${backdropImg}" alt="${item.title_ar || item.title}">
            <div class="hero-info">
                <h1>${item.title_ar || item.title}</h1>
                <div class="rating">⭐ ${item.rating || 'N/A'} | ${item.year || ''}</div>
                <button class="watch-btn" onclick="openPlayer(${item.id}, '${item.type}')">▶ شاهد الآن</button>
            </div>
        `;
        slide.addEventListener('click', () => openPlayer(item.id, item.type));
        slider.appendChild(slide);
    });
    
    startHeroAutoPlay();
}

function startHeroAutoPlay() {
    clearInterval(heroInterval);
    if (heroMovies.length <= 1) return;
    heroInterval = setInterval(() => {
        const slides = document.querySelectorAll('.hero-slide');
        if (!slides.length) return;
        slides[heroIndex].classList.remove('active');
        heroIndex = (heroIndex + 1) % slides.length;
        slides[heroIndex].classList.add('active');
    }, 5000);
}

// ============================================
// Display Grids
// ============================================
function displayGrid(gridId, items, type) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    
    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="color:var(--text2); padding:10px;">لا توجد أعمال مضافة بعد.</p>';
        return;
    }
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        const itemType = item.type || type;
        const badge = itemType === 'tv' ? 'مسلسل' : 'فيلم';
        const posterImg = item.poster ? `${IMG_BASE}${item.poster}` : 'placeholder.jpg';
        
        card.innerHTML = `
            <img src="${posterImg}" loading="lazy" onerror="this.src='placeholder.jpg'">
            <span class="badge">${badge}</span>
            <div class="info">
                <h3>${item.title_ar || item.title}</h3>
                <div>⭐ ${item.rating || 'N/A'} | ${item.year || ''}</div>
            </div>
        `;
        
        card.addEventListener('click', () => openPlayer(item.id, itemType));
        grid.appendChild(card);
    });
}

// ============================================
// Player
// ============================================
function openPlayer(id, type) {
    const pool = type === 'tv' ? allSeries : allMovies;
    const item = pool.find(x => x.id == id);
    
    if (!item) {
        alert('هذا العمل غير متوفر في ملفات البيانات الخاصة بك');
        return;
    }

    currentItem = item;
    currentServer = 0;
    currentSeason = 1;
    currentEpisode = 1;
    
    document.getElementById('playerTitle').textContent = item.title_ar || item.title;
    document.getElementById('playerModal').classList.add('active');
    
    // إعداد تبويبات السيرفرات
    setupServerTabs();
    
    // إذا كان مسلسلاً، عرض المواسم والحلقات من ملفك
    if (type === 'tv' && item.episodes && item.episodes.length > 0) {
        showLocalEpisodeSelector();
    } else {
        document.getElementById('episodeSelector').innerHTML = '';
    }
    
    loadLocalServer(0);
}

function setupServerTabs() {
    const tabs = document.getElementById('serverTabs');
    tabs.innerHTML = '';
    
    const serversList = currentItem.servers || (currentItem.episodes && currentItem.episodes[0] ? currentItem.episodes[0].servers : []);
    
    serversList.forEach((serverUrl, i) => {
        if (!serverUrl) return; // عدم إظهار السيرفرات الفارغة
        const tab = document.createElement('button');
        tab.className = 'server-tab' + (i === 0 ? ' active' : '');
        tab.textContent = `سيرفر ${i + 1}`;
        tab.onclick = () => {
            currentServer = i;
            document.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadLocalServer(currentServer);
        };
        tabs.appendChild(tab);
    });
}

function showLocalEpisodeSelector() {
    const selector = document.getElementById('episodeSelector');
    selector.innerHTML = '';
    
    if (!currentItem.episodes) return;

    // استخراج المواسم المتاحة بملفك
    const seasons = [...new Set(currentItem.episodes.map(ep => ep.season))];
    
    const seasonDiv = document.createElement('div');
    seasonDiv.className = 'season-selector';
    
    seasons.forEach((seasonNum, idx) => {
        const btn = document.createElement('button');
        btn.className = 'season-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = `موسم ${seasonNum}`;
        btn.onclick = () => {
            currentSeason = seasonNum;
            document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderLocalEpisodes(seasonNum);
        };
        seasonDiv.appendChild(btn);
    });
    
    selector.appendChild(seasonDiv);
    
    const epDiv = document.createElement('div');
    epDiv.id = 'episodesList';
    epDiv.className = 'episode-selector';
    selector.appendChild(epDiv);
    
    renderLocalEpisodes(seasons[0]);
}

function renderLocalEpisodes(seasonNum) {
    const epDiv = document.getElementById('episodesList');
    epDiv.innerHTML = '';
    
    const seasonEps = currentItem.episodes.filter(ep => ep.season == seasonNum);
    
    seasonEps.forEach((ep, idx) => {
        const btn = document.createElement('button');
        btn.className = 'episode-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = `حلقة ${ep.episode}`;
        btn.onclick = () => {
            currentEpisode = ep.episode;
            document.querySelectorAll('.episode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLocalServer(currentServer);
        };
        epDiv.appendChild(btn);
    });
}

function loadLocalServer(index) {
    const frame = document.getElementById('playerFrame');
    if (!currentItem) return;
    
    let serverUrl = '';
    
    if (currentItem.type === 'tv' && currentItem.episodes) {
        const epData = currentItem.episodes.find(e => e.season == currentSeason && e.episode == currentEpisode);
        if (epData && epData.servers) {
            serverUrl = epData.servers[index] || epData.servers[0];
        }
    } else if (currentItem.servers) {
        serverUrl = currentItem.servers[index] || currentItem.servers[0];
    }
    
    frame.src = serverUrl || '';
}

function closePlayer() {
    document.getElementById('playerModal').classList.remove('active');
    document.getElementById('playerFrame').src = '';
}

// ============================================
// Search in Local Data
// ============================================
function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    
    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
            loadLocalData();
            return;
        }
        
        const filteredMovies = allMovies.filter(m => (m.title_ar || m.title).toLowerCase().includes(query));
        const filteredSeries = allSeries.filter(s => (s.title_ar || s.title).toLowerCase().includes(query));
        const combined = [...filteredMovies, ...filteredSeries];
        
        displayGrid('trendingGrid', combined, 'all');
    });
}

// ============================================
// Navigation
// ============================================
function toggleMenu() {
    document.getElementById('dropdownMenu').classList.toggle('active');
}

function showHome() {
    document.getElementById('dropdownMenu').classList.remove('active');
    loadLocalData();
}

function showMovies() {
    document.getElementById('dropdownMenu').classList.remove('active');
    displayGrid('trendingGrid', allMovies, 'movie');
}

function showSeries() {
    document.getElementById('dropdownMenu').classList.remove('active');
    displayGrid('trendingGrid', allSeries, 'tv');
}

function showFavorites() {
    document.getElementById('dropdownMenu').classList.remove('active');
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    displayGrid('trendingGrid', favs, 'all');
}

