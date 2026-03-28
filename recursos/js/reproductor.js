function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function loadVideoPlayer() {
    const serieId = getUrlParameter('serie');
    const capId = parseInt(getUrlParameter('cap'), 10); 

    const videoSource = document.getElementById('video-source');
    const backLink = document.querySelector('.back-link');

    if (!serieId || !seriesData[serieId] || isNaN(capId)) {
        document.getElementById('cap-title').textContent = 'Error de Carga';
        document.getElementById('cap-description').textContent = 'No se pudo encontrar la serie o el capítulo.';
        videoSource.src = ''; 
        if (backLink) backLink.href = 'index.html'; 
        return;
    }

    const serie = seriesData[serieId];
    const capitulo = serie.capitulos.find(c => c.id === capId);

    if (!capitulo) {
        document.getElementById('cap-title').textContent = `${serie.title} - Capítulo No Encontrado`;
        document.getElementById('cap-description').textContent = 'El número de capítulo no existe para esta serie.';
        videoSource.src = ''; 
        if (backLink) backLink.href = `serie.html?id=${serieId}`; 
        return;
    }
    
    videoSource.src = capitulo.videoPath;
    
    document.getElementById('video-player').load();
    
    document.getElementById('page-title').textContent = `${serie.title} - C.${capitulo.id}`;
    document.getElementById('cap-title').textContent = `${capitulo.id}. ${capitulo.title}`;
    document.getElementById('cap-description').innerHTML = `<strong>Descripción:</strong> ${capitulo.description}`;
    document.getElementById('cap-meta').innerHTML = `<strong>Duración:</strong> ${capitulo.duration} | <strong>Serie:</strong> ${serie.title}`;

    if (backLink) {
        backLink.href = `serie.html?id=${serieId}`;
    }

    const nextCapId = capId + 1;
    const nextCap = serie.capitulos.find(c => c.id === nextCapId);
    const sidebar = document.querySelector('.sidebar');
    const nextEpisodeItem = document.querySelector('.next-episode-item');

    if (nextCap && sidebar && nextEpisodeItem) {
        nextEpisodeItem.href = `reproductor.html?serie=${serieId}&cap=${nextCapId}`;
        document.querySelector('.next-thumb').textContent = `Cap ${nextCap.id}`;
        document.querySelector('.next-details strong').textContent = `${nextCap.id}. ${nextCap.title}`;
        document.querySelector('.next-details span').textContent = `${nextCap.duration} - Siguiente`;
    } else {
        if (sidebar) sidebar.innerHTML = '<h3>Fin de la Lista</h3><p>No hay más capítulos disponibles en este momento.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadVideoPlayer);