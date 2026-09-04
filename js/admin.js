const TMDB_API_KEY = 'f131da87533861d05eff315e68c09b28';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMTMxZGE4NzUzMzg2MWQwNWVmZjMxNWU2OGMwOWIyOCIsIm5iZiI6MTc4NjcxMjI3NC44NjgsInN1YiI6IjZhN2YxMGQyNzBiY2Q3MDdhZmJmOTE4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.EtjmmFfCkuuJ9djdpRKvq-WHA3ZMReR2TvUVl0FyGfs';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

let selectedItem = null;
let selectedType = null;
let episodesData = [];

function login() {
    const password = document.getElementById('passwordInput').value;
    if (password === 'iraqtv2026') {
        document.getElementById('loginCard').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    } else {
        alert('كلمة مرور خاطئة');
    }
}

async function searchTMDB() {
    const query = document.getElementById('tmdbSearch').value.trim();
    if (!query) return;
    
    const res = await fetch(`${TMDB_BASE}/search/multi?language=ar-SA&query=${query}&include_adult=false`, {
        headers: { 'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}` }
    });
    const data = await res.json();
    
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';
    
    data.results?.slice(0, 10).forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${IMG_BASE}${item.poster_path}" onerror="this.src='placeholder.jpg'">
            <div>
                <strong>${item.title || item.name}</strong><br>
                <small>${item.media_type === 'tv' ? 'مسلسل' : 'فيلم'} | ⭐ ${item.vote_average} | ${(item.release_date || item.first_air_date || '').slice(0,4)}</small>
            </div>
        `;
        card.onclick = () => selectItem(item);
        resultsDiv.appendChild(card);
    });
}

function selectItem(item) {
    selectedItem = item;
    selectedType = item.media_type === 'tv' ? 'tv' : 'movie';
    episodesData = [];
    
    document.getElementById('selectedCard').style.display = 'block';
    
    const infoDiv = document.getElementById('selectedInfo');
    infoDiv.innerHTML = `
        <img src="${IMG_BASE}${item.poster_path}" style="width: 120px; border-radius: 10px; margin-bottom: 10px;">
        <h3>${item.title || item.name}</h3>
        <p>⭐ ${item.vote_average} | ${(item.release_date || item.first_air_date || '').slice(0,4)}</p>
        <p>${item.overview || ''}</p>
    `;
    
    if (selectedType === 'tv') {
        document.getElementById('movieServers').style.display = 'none';
        document.getElementById('seriesServers').style.display = 'block';
    } else {
        document.getElementById('movieServers').style.display = 'block';
        document.getElementById('seriesServers').style.display = 'none';
    }
}

function addEpisode() {
    const season = document.getElementById('seasonNum').value;
    const episode = document.getElementById('episodeNum').value;
    
    if (!season || !episode) {
        alert('أدخل رقم الموسم والحلقة');
        return;
    }
    
    episodesData.push({
        season: parseInt(season),
        episode: parseInt(episode),
        servers: [
            document.getElementById('server1')?.value || '',
            document.getElementById('server2')?.value || '',
            document.getElementById('server3')?.value || '',
            document.getElementById('server4')?.value || '',
            document.getElementById('server5')?.value || ''
        ]
    });
    
    const listDiv = document.getElementById('episodesList');
    const epCard = document.createElement('div');
    epCard.className = 'result-card';
    epCard.innerHTML = `موسم ${season} - حلقة ${episode} ✅`;
    listDiv.appendChild(epCard);
    
    document.getElementById('seasonNum').value = '';
    document.getElementById('episodeNum').value = '';
}

function generateJSON() {
    if (!selectedItem) return;
    
    let json;
    
    if (selectedType === 'movie') {
        json = {
            id: selectedItem.id,
            type: 'movie',
            title: selectedItem.title || selectedItem.name,
            title_ar: selectedItem.title || selectedItem.name,
            poster: selectedItem.poster_path,
            backdrop: selectedItem.backdrop_path,
            year: (selectedItem.release_date || '').slice(0,4),
            rating: selectedItem.vote_average,
            overview: selectedItem.overview,
            servers: [
                document.getElementById('server1').value,
                document.getElementById('server2').value,
                document.getElementById('server3').value,
                document.getElementById('server4').value,
                document.getElementById('server5').value
            ]
        };
    } else {
        json = {
            id: selectedItem.id,
            type: 'tv',
            title: selectedItem.name,
            title_ar: selectedItem.name,
            poster: selectedItem.poster_path,
            backdrop: selectedItem.backdrop_path,
            year: (selectedItem.first_air_date || '').slice(0,4),
            rating: selectedItem.vote_average,
            overview: selectedItem.overview,
            episodes: episodesData
        };
    }
    
    document.getElementById('jsonOutput').textContent = JSON.stringify(json, null, 2);
}

function copyJSON() {
    const jsonText = document.getElementById('jsonOutput').textContent;
    if (!jsonText) {
        alert('قم بتوليد JSON أولاً');
        return;
    }
    
    navigator.clipboard.writeText(jsonText).then(() => {
        alert('تم النسخ! ✅');
    });
}
