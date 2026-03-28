function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function loadSerieDetails() {
    const serieId = getUrlParameter('id');

    if (!serieId || !seriesData[serieId]) {
        document.getElementById('page-title').textContent = 'Serie No Encontrada';
        document.getElementById('serie-title').textContent = 'Error: Serie no encontrada.';
        document.getElementById('serie-synopsis').textContent = 'Por favor, regrese al catálogo e intente de nuevo.';
        const capitulosList = document.getElementById('capitulos-list');
        if (capitulosList) capitulosList.innerHTML = '';
        return;
    }

    const serie = seriesData[serieId];

    document.getElementById('page-title').textContent = `AniHub - ${serie.title}`;
    document.getElementById('serie-title').textContent = serie.title;
    
    document.getElementById('serie-metadata').innerHTML = serie.metadata.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
    
    document.getElementById('serie-synopsis').textContent = serie.synopsis;

    const posterElement = document.getElementById('serie-info-poster');
    posterElement.src = serie.poster;
    posterElement.alt = `Póster de la Serie ${serie.title}`;

    const capitulosList = document.getElementById('capitulos-list');
    
    capitulosList.innerHTML = '<h2>Temporada 1</h2>'; 

    serie.capitulos.forEach(capitulo => {
        const link = document.createElement('a');
        
        link.href = `reproductor.html?serie=${serieId}&cap=${capitulo.id}`;
        link.className = 'capitulo-link';

        let thumbnailContent;
        if (capitulo.thumbnailPath) {
            thumbnailContent = `<img src="${capitulo.thumbnailPath}" alt="Miniatura ${capitulo.id}" onerror="this.onerror=null; this.src='https://placehold.co/120x68/444/FFF?text=Cap ${capitulo.id}'" class="capitulo-image"/>`;
        } else {
            thumbnailContent = `Miniatura C.${capitulo.id}`;
        }
        
        link.innerHTML = `
            <div class="capitulo-item">
                <div class="capitulo-thumb">
                    ${thumbnailContent} 
                </div>
                <div class="capitulo-details">
                    <h3>${capitulo.id}. ${capitulo.title}</h3>
                    <p>Duración: ${capitulo.duration} | Descripción: ${capitulo.description}</p>
                </div>
            </div>
        `;
        capitulosList.appendChild(link);
    });
}

document.addEventListener('DOMContentLoaded', loadSerieDetails);