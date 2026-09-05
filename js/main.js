// ============================================
// عراق تي في - Main JavaScript
// ============================================

// TMDB API Configuration
const TMDB_API_KEY = 'f131da87533861d05eff315e68c09b28';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMTMxZGE4NzUzMzg2MWQwNWVmZjMxNWU2OGMwOWIyOCIsIm5iZiI6MTc4NjcxMjI3NC44NjgsInN1YiI6IjZhN2YxMGQyNzBiY2Q3MDdhZmJmOTE4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.EtjmmFfCkuuJ9djdpRKvq-WHA3ZMReR2TvUVl0FyGfs';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// State
let heroItems = [];
let heroIndex = 0;
let heroInterval = null;
let currentPlayerItem = null;
let currentServer = 0;
let currentSeason = 1;
let currentEpisode = 1;
let favorites = JSON.parse(localStorage.getItem('iraqTvFavorites') || '[]');
let adminContent = JSON.parse(localStorage.getItem('iraqTvContent') || '[]');

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadAllContent();
    setupSearch();
    loadHero();
    loadFavorites();
});

// ============================================
// TMDB API
// ============================================
async function fetchTMDB(endpoint) {
    try {
        const response = await fetch(`${TMDB_BASE}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json;charset=utf-8'
            }
        });
        if (!response.ok) throw new Error('API Error');
        return await response.json();
    } catch (error) {
        console.error('TMDB Error:', error);
        return null;
    }
}

// ============================================
// Load All Content
// ============================================
async function loadAllContent() {
    showLoading();
    
    try {
        // Trending
        const trending = await fetchTMDB('/trending/all/week?language=ar-SA&page=1');
        if (trending?.results) {
            displayGrid('trendingGrid', trending.results.slice(0, 12));
        }
        
        // Popular Movies
        const movies = await fetchTMDB('/movie/popular?language=ar-SA&page=1');
        if (movies?.results) {
            displayGrid('moviesGrid', movies.results.slice(0, 12));
        }
        
        // Popular TV Shows
        const series = await fetchTMDB('/tv/popular?language=ar-SA&page=1');
        if (series?.results) {
            displayGrid('seriesGrid', series.results.slice(0, 12));
        }
        
        // Load Admin Content
        displayAdminContent();
        
    } catch (error) {
        console.error('Load Error:', error);
    }
    
    hideLoading();
}

// ============================================
// Hero Slider
// ============================================
async function loadHero() {
    const data = await fetchTMDB('/trending/all/week?language=ar-SA&page=1');
    if (!data?.results) return;
    
    // Combine with admin hero items
    const adminHeroItems = adminContent.filter(item => item.showInHero);
    heroItems = [...adminHeroItems, ...data.results.slice(0, 5)];
    
    displayHero();
    startHeroAutoplay();
}

function displayHero() {
    const container = document.getElementById('heroContainer');
    const dots = document.getElementById('heroDots');
    container.innerHTML = '';
    dots.innerHTML = '';
    
    heroItems.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide' + (index === 0 ? ' active' : '');
        
        const backdrop = item.backdrop_path 
            ? `${IMG_ORIGINAL}${item.backdrop_path}`
            : item.backdrop || 'https://via.placeholder.com/1920x1080?text=No+Image';
        
        const title = item.title || item.name || 'بدون عنوان';
        const rating = item.vote_average?.toFixed(1) || item.rating || 'N/A';
        const overview = item.overview || 'لا توجد قصة متاحة';
        
        slide.innerHTML = `
            <img src="${backdrop}" alt="${title}">
            <div class="hero-info">
                <h1 class="hero-title">${title}</h1>
                <div class="hero-meta">
                    <span class="hero-rating">⭐ ${rating}</span>
                    <span class="hero-year">📅 ${(item.release_date || item.first_air_date || '').slice(0, 4) || 'N/A'}</span>
                </div>
                <p class="hero-overview">${overview}</p>
                <button class="hero-watch-btn" onclick="openPlayer(${item.id || 0}, '${item.media_type || item.type || 'movie'}')">
                    ▶ مشاهدة الآن
                </button>
            </div>
        `;
        
        slide.addEventListener('click', () => openPlayer(item.id || 0, item.media_type || item.type || 'movie'));
        container.appendChild(slide);
        
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (index === 0 ? ' active' : '');
        dot.onclick = () => goToHeroSlide(index);
        dots.appendChild(dot);
    });
}

function startHeroAutoplay() {
    clearInterval(heroInterval);
    heroInterval = setInterval(() => changeHero(1), 5000);
}

function changeHero(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    slides[heroIndex].classList.remove('active');
    heroIndex = (heroIndex + direction + slides.length) % slides.length;
    slides[heroIndex].classList.add('active');
    
    updateHeroDots();
    startHeroAutoplay();
}

function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    slides[heroIndex].classList.remove('active');
    heroIndex = index;
    slides[heroIndex].classList.add('active');
    
    updateHeroDots();
    startHeroAutoplay();
}

function updateHeroDots() {
    document.querySelectorAll('.hero-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === heroIndex);
    });
}

// ============================================
// Display Grids
// ============================================
function displayGrid(gridId, items) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    
    items.forEach(item => {
        const card = createMovieCard(item);
        grid.appendChild(card);
    });
}

function createMovieCard(item) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const poster = item.poster_path 
        ? `${IMG_BASE}${item.poster_path}`
        : item.poster || 'https://via.placeholder.com/500x750?text=No+Image';
    
    const title = item.title || item.name || 'بدون عنوان';
    const rating = item.vote_average?.toFixed(1) || item.rating || 'N/A';
    const type = item.media_type || item.type || 'movie';
    const badge = type === 'tv' || type === 'series' ? 'مسلسل' : 'فيلم';
    
    card.innerHTML = `
        <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
        <span class="movie-card-badge ${type === 'tv' || type === 'series' ? 'series' : ''}">${badge}</span>
        <div class="movie-card-info">
            <div class="movie-card-title">${title}</div>
            <div class="movie-card-rating">⭐ ${rating}</div>
        </div>
    `;
    
    card.addEventListener('click', () => openPlayer(item.id || 0, type));
    return card;
}

// ============================================
// Display Admin Content
// ============================================
function displayAdminContent() {
    if (!adminContent.length) return;
    
    const movieItems = adminContent.filter(item => item.type === 'movie');
    const seriesItems = adminContent.filter(item => item.type === 'series');
    
    if (movieItems.length) {
        const grid = document.getElementById('moviesGrid');
        movieItems.forEach(item => {
            grid.appendChild(createMovieCard(item));
        });
    }
    
    if (seriesItems.length) {
        const grid = document.getElementById('seriesGrid');
        seriesItems.forEach(item => {
            grid.appendChild(createMovieCard(item));
        });
    }
}

// ============================================
// Player
// ============================================
async function openPlayer(id, type) {
    showLoading();
    
    try {
        let item = null;
        
        // Check if it's admin content
        const adminItem = adminContent.find(i => i.id === id);
        if (adminItem) {
            item = adminItem;
        } else if (id > 0) {
            const endpoint = type === 'tv' ? `/tv/${id}?language=ar-SA` : `/movie/${id}?language=ar-SA`;
            item = await fetchTMDB(endpoint);
        }
        
        if (!item) {
            alert('لم يتم العثور على المحتوى');
            return;
        }
        
        currentPlayerItem = item;
        currentServer = 0;
        currentSeason = 1;
        currentEpisode = 1;
        
        document.getElementById('playerTitle').textContent = item.title || item.name || 'بدون عنوان';
        document.getElementById('playerModal').classList.add('active');
        
        // Update favorite button
        updatePlayerFavButton();
        
        // Setup server tabs
        setupServerTabs();
        
        // Setup episode selector if series
        if (type === 'tv' || type === 'series') {
            setupEpisodeSelector();
        } else {
            document.getElementById('episodeSelector').innerHTML = '';
        }
        
        loadServer(0);
        
    } catch (error) {
        console.error('Player Error:', error);
        alert('حدث خطأ في تحميل المشغل');
    }
    
    hideLoading();
}

function setupServerTabs() {
    const tabsContainer = document.getElementById('serverTabs');
    tabsContainer.innerHTML = '';
    
    const servers = getServerUrls();
    
    servers.forEach((server, index) => {
        const tab = document.createElement('button');
        tab.className = 'server-tab' + (index === 0 ? ' active' : '');
        tab.textContent = `سيرفر ${index + 1}`;
        tab.onclick = () => {
            currentServer = index;
            document.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadServer(index);
        };
        tabsContainer.appendChild(tab);
    });
}

function getServerUrls() {
    const item = currentPlayerItem;
    if (!item) return [];
    
    const id = item.id;
    const type = item.type || item.media_type || 'movie';
    
    // If admin content with custom servers
    if (item.servers && item.servers.length) {
        return item.servers;
    }
    
    if (type === 'tv' || type === 'series') {
        return [
            `https://vidsrc.cc/v2/embed/tv/${id}/${currentSeason}/${currentEpisode}`,
            `https://embed.su/embed/tv/${id}/${currentSeason}/${currentEpisode}`,
            `https://vidsrc.vip/embed/tv/${id}/${currentSeason}/${currentEpisode}`,
            `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`,
            `https://vidsrc.me/embed/tv?tmdb=${id}&season=${currentSeason}&episode=${currentEpisode}`
        ];
    }
    
    return [
        `https://vidsrc.cc/v2/embed/movie/${id}`,
        `https://embed.su/embed/movie/${id}`,
        `https://vidsrc.vip/embed/movie/${id}`,
        `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        `https://vidsrc.me/embed/movie?tmdb=${id}`
    ];
}

function loadServer(index) {
    const frame = document.getElementById('playerFrame');
    const servers = getServerUrls();
    
    if (servers[index]) {
        frame.src = servers[index];
    }
}

function closePlayer() {
    document.getElementById('playerModal').classList.remove('active');
    document.getElementById('playerFrame').src = '';
}

// ============================================
// Episode Selector
// ============================================
async function setupEpisodeSelector() {
    const selector = document.getElementById('episodeSelector');
    selector.innerHTML = '';
    
    const item = currentPlayerItem;
    
    // Season selector
    if (item.seasons && item.seasons.length) {
        const seasonDiv = document.createElement('div');
        seasonDiv.className = 'season-selector';
        
        item.seasons.forEach(season => {
            if (season.season_number === 0) return;
            const btn = document.createElement('button');
            btn.className = 'season-btn' + (season.season_number === 1 ? ' active' : '');
            btn.textContent = `موسم ${season.season_number}`;
            btn.onclick = () => {
                currentSeason = season.season_number;
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadEpisodes(currentSeason);
            };
            seasonDiv.appendChild(btn);
        });
        
        selector.appendChild(seasonDiv);
    }
    
    // Episodes container
    const episodesDiv = document.createElement('div');
    episodesDiv.id = 'episodesList';
    episodesDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;';
    selector.appendChild(episodesDiv);
    
    await loadEpisodes(1);
}

async function loadEpisodes(season) {
    const episodesDiv = document.getElementById('episodesList');
    if (!episodesDiv) return;
    
    episodesDiv.innerHTML = '';
    
    const item = currentPlayerItem;
    const id = item.id;
    
    try {
        const data = await fetchTMDB(`/tv/${id}/season/${season}?language=ar-SA`);
        
        if (data?.episodes) {
            data.episodes.forEach(ep => {
                const btn = document.createElement('button');
                btn.className = 'episode-btn' + (ep.episode_number === 1 ? ' active' : '');
                btn.textContent = `حلقة ${ep.episode_number}`;
                btn.onclick = () => {
                    currentEpisode = ep.episode_number;
                    document.querySelectorAll('.episode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    loadServer(currentServer);
                };
                episodesDiv.appendChild(btn);
            });
        }
    } catch (error) {
        console.error('Episodes Error:', error);
    }
}

// ============================================
// Favorites
// ============================================
function loadFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!favorites.length) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">لا توجد عناصر في المفضلة ❤️</p>';
        return;
    }
    
    favorites.forEach(item => {
        grid.appendChild(createMovieCard(item));
    });
}

function togglePlayerFavorite() {
    if (!currentPlayerItem) return;
    
    const index = favorites.findIndex(f => f.id === currentPlayerItem.id);
    
    if (index === -1) {
        favorites.push(currentPlayerItem);
        showToast('تمت الإضافة إلى المفضلة ❤️');
    } else {
        favorites.splice(index, 1);
        showToast('تمت الإزالة من المفضلة');
    }
    
    localStorage.setItem('iraqTvFavorites', JSON.stringify(favorites));
    updatePlayerFavButton();
}

function updatePlayerFavButton() {
    const btn = document.getElementById('playerFavBtn');
    if (!btn || !currentPlayerItem) return;
    
    const isFav = favorites.some(f => f.id === currentPlayerItem.id);
    btn.textContent = isFav ? '❤️' : '🤍';
}

// ============================================
// Search
// ============================================
function setupSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    let timeout;
    
    input.addEventListener('input', () => {
        clearTimeout(timeout);
        const query = input.value.trim();
        
        if (query.length < 2) {
            results.classList.remove('active');
            return;
        }
        
        timeout = setTimeout(async () => {
            const data = await fetchTMDB(`/search/multi?language=ar-SA&query=${encodeURIComponent(query)}&include_adult=false&page=1`);
            
            if (data?.results?.length) {
                results.innerHTML = '';
                results.classList.add('active');
                
                data.results.slice(0, 8).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `
                        <img src="${IMG_BASE}${item.poster_path}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
                        <div class="result-info">
                            <div class="result-title">${item.title || item.name}</div>
                            <div class="result-meta">${item.media_type === 'tv' ? '📺 مسلسل' : '🎬 فيلم'} | ⭐ ${item.vote_average?.toFixed(1)}</div>
                        </div>
                    `;
                    div.onclick = () => {
                        openPlayer(item.id, item.media_type);
                        results.classList.remove('active');
                        input.value = '';
                    };
                    results.appendChild(div);
                });
            }
        }, 400);
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            results.classList.remove('active');
        }
    });
}

// ============================================
// Navigation
// ============================================
function toggleMenu() {
    document.getElementById('menuDropdown').classList.toggle('active');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-links')) {
        document.getElementById('menuDropdown').classList.remove('active');
    }
});

function showSection(section) {
    document.getElementById('menuDropdown').classList.remove('active');
    
    // Hide all sections
    document.getElementById('trendingSection').style.display = 'none';
    document.getElementById('moviesSection').style.display = 'none';
    document.getElementById('seriesSection').style.display = 'none';
    document.getElementById('favoritesSection').style.display = 'none';
    document.getElementById('heroSlider').style.display = 'none';
    
    switch(section) {
        case 'home':
            document.getElementById('trendingSection').style.display = 'block';
            document.getElementById('moviesSection').style.display = 'block';
            document.getElementById('seriesSection').style.display = 'block';
            document.getElementById('heroSlider').style.display = 'block';
            break;
        case 'movies':
            document.getElementById('moviesSection').style.display = 'block';
            break;
        case 'series':
            document.getElementById('seriesSection').style.display = 'block';
            break;
        case 'favorites':
            document.getElementById('favoritesSection').style.display = 'block';
            loadFavorites();
            break;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Admin Panel
// ============================================
function openAdminPanel() {
    document.getElementById('menuDropdown').classList.remove('active');
    document.getElementById('adminModal').classList.add('active');
}

function closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('active');
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'iraqtv2026') {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        displayAdminList();
    } else {
        alert('كلمة مرور خاطئة');
    }
}

function addContent() {
    const title = document.getElementById('adminTitle').value;
    const type = document.getElementById('adminType').value;
    const poster = document.getElementById('adminPoster').value;
    const backdrop = document.getElementById('adminBackdrop').value;
    const rating = parseFloat(document.getElementById('adminRating').value) || 0;
    const showInHero = document.getElementById('adminHero').checked;
    
    if (!title) {
        alert('أدخل عنوان العمل');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        title,
        type,
        poster,
        backdrop,
        rating,
        showInHero,
        servers: [
            document.getElementById('adminServer1').value,
            document.getElementById('adminServer2').value,
            document.getElementById('adminServer3').value,
            document.getElementById('adminServer4').value,
            document.getElementById('adminServer5').value
        ].filter(Boolean)
    };
    
    adminContent.push(newItem);
    localStorage.setItem('iraqTvContent', JSON.stringify(adminContent));
    
    // Clear form
    document.getElementById('adminTitle').value = '';
    document.getElementById('adminPoster').value = '';
    document.getElementById('adminBackdrop').value = '';
    document.getElementById('adminServer1').value = '';
    document.getElementById('adminServer2').value = '';
    document.getElementById('adminServer3').value = '';
    document.getElementById('adminServer4').value = '';
    document.getElementById('adminServer5').value = '';
    document.getElementById('adminRating').value = '';
    document.getElementById('adminHero').checked = false;
    
    displayAdminList();
    showToast('تمت الإضافة بنجاح ✅');
}

function displayAdminList() {
    const listDiv = document.getElementById('adminContentList');
    listDiv.innerHTML = '';
    
    if (!adminContent.length) {
        listDiv.innerHTML = '<p>لا يوجد محتوى مضاف</p>';
        return;
    }
    
    adminContent.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--glass-bg); border-radius: 8px; margin-bottom: 10px;';
        div.innerHTML = `
            <span>${item.title}</span>
            <span>(${item.type === 'movie' ? 'فيلم' : 'مسلسل'})</span>
            <button onclick="deleteContent(${index})" style="background: var(--accent); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: auto;">حذف</button>
        `;
        listDiv.appendChild(div);
    });
}

function deleteContent(index) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        adminContent.splice(index, 1);
        localStorage.setItem('iraqTvContent', JSON.stringify(adminContent));
        displayAdminList();
        showToast('تم الحذف ✅');
    }
}

// ============================================
// Utilities
// ============================================
function showLoading() {
    document.getElementById('loadingBar').classList.add('active');
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingBar').classList.remove('active');
    }, 500);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 50%;
        transform: translateX(50%);
        background: var(--bg-secondary);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 15px 30px;
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
        font-family: var(--font-main);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
