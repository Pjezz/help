// Variables globales
let debugMode = false;
let userFavorites = new Set();
let currentRecommendations = [];

// Función para formatear precio
function formatPrice(price) {
  if (typeof price === 'number') {
    return `$${price.toLocaleString('es-GT')}`;
  }
  return price || 'Precio no disponible';
}

// Función para crear una tarjeta de auto
function createCarCard(car, index) {
  const card = document.createElement('div');
  card.className = 'car-card';
  
  // Agregar delay de animación basado en el índice
  card.style.animationDelay = `${index * 0.1}s`;
  
  const imageHtml = car.image ? 
    `<div class="car-image"><img src="${car.image}" alt="${car.name}"></div>` :
    `<div class="car-image"><div class="no-image">Imagen no disponible</div></div>`;
  
  const featuresHtml = car.features && Array.isArray(car.features) && car.features.length > 0 ? 
    `<div class="car-features">
       <h4>Características destacadas</h4>
       <ul>
         ${car.features.slice(0, 5).map(feature => `<li>${feature}</li>`).join('')}
         ${car.features.length > 5 ? `<li class="more-features">+${car.features.length - 5} más características</li>` : ''}
       </ul>
     </div>` : '';
  
  // Mostrar puntuación de similitud si está disponible
  const scoreHtml = car.similarity_score ? 
    `<div class="similarity-score">
       <span class="score-label">Compatibilidad:</span>
       <span class="score-value">${Math.round(car.similarity_score)}%</span>
       ${car.demographic_bonus ? `<span class="demographic-bonus">+${car.demographic_bonus} demográfico</span>` : ''}
     </div>` : '';
  
  // Verificar si está en favoritos
  const isFavorite = userFavorites.has(car.id);
  const favoriteText = isFavorite ? '💔 Quitar de Favoritos' : '❤️ Agregar a Favoritos';
  const favoriteClass = isFavorite ? 'added' : '';
  
  card.innerHTML = `
    ${imageHtml}
    <div class="car-info">
      <div class="car-name">${car.name || 'Nombre no disponible'}</div>
      <div class="car-brand">${car.brand || 'Marca no disponible'}</div>
      <div class="car-price">${formatPrice(car.price)}</div>
      ${scoreHtml}
      <div class="car-details">
        <div class="detail"><strong>Tipo:</strong> ${car.type || 'No especificado'}</div>
        <div class="detail"><strong>Combustible:</strong> ${car.fuel || 'No especificado'}</div>
        <div class="detail"><strong>Transmisión:</strong> ${car.transmission || 'No especificado'}</div>
        <div class="detail"><strong>Año:</strong> ${car.year || 'No especificado'}</div>
      </div>
      ${featuresHtml}
      <div class="car-actions">
        <button onclick="openCarDetailsModal(${JSON.stringify(car).replace(/"/g, '&quot;')})" class="details-btn">
          🔍 Ver detalles
        </button>
        <button onclick="toggleFavorite('${car.id}', this)" class="favorite-btn ${favoriteClass}">
          ${favoriteText}
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// Función para alternar favoritos
async function toggleFavorite(carId, buttonElement) {
  try {
    const car = currentRecommendations.find(c => c.id === carId);
    if (!car) return;

    const isFavorite = userFavorites.has(carId);
    
    if (isFavorite) {
      // Quitar de favoritos
      const response = await fetch('/api/remove-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId: carId })
      });
      
      if (response.ok) {
        userFavorites.delete(carId);
        buttonElement.textContent = '❤️ Agregar a Favoritos';
        buttonElement.classList.remove('added');
        showToast('Eliminado de favoritos', 'success');
      }
    } else {
      // Agregar a favoritos
      const response = await fetch('/api/add-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car: car })
      });
      
      if (response.ok) {
        userFavorites.add(carId);
        buttonElement.textContent = '💔 Quitar de Favoritos';
        buttonElement.classList.add('added');
        showToast('Agregado a favoritos', 'success');
      }
    }
  } catch (error) {
    console.error('Error al cambiar favorito:', error);
    showToast('Error al cambiar favorito', 'error');
  }
}

// Función para mostrar toast notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Animar salida y eliminar
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);ayuda