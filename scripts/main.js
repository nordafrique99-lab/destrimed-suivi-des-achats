// scripts/main.js
// Gestion de l'installation PWA et du Service Worker

// Vérifier si le navigateur supporte les Service Workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[Service Worker] Enregistré avec succès:', registration.scope);
        
        // Vérifier les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[Service Worker] Mise à jour trouvée:', newWorker);
        });
      })
      .catch(function(error) {
        console.log('[Service Worker] Échec de l\'enregistrement:', error);
      });
  });
}

// Gestion de l'installation PWA
let deferredPrompt;
const installButton = document.createElement('button');

// Créer le bouton d'installation
function createInstallButton() {
  installButton.id = 'installButton';
  installButton.className = 'install-btn';
  installButton.innerHTML = '📱 Installer l\'app';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    display: none;
    transition: all 0.3s;
  `;
  
  installButton.addEventListener('mouseover', () => {
    installButton.style.backgroundColor = '#3a7bc8';
    installButton.style.transform = 'translateY(-2px)';
  });
  
  installButton.addEventListener('mouseout', () => {
    installButton.style.backgroundColor = '#4a90e2';
    installButton.style.transform = 'translateY(0)';
  });
  
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Afficher l'invite d'installation
    deferredPrompt.prompt();
    
    // Attendre que l'utilisateur réponde
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Résultat de l'installation: ${outcome}`);
    
    // Réinitialiser la variable
    deferredPrompt = null;
    
    // Masquer le bouton
    installButton.style.display = 'none';
  });
  
  document.body.appendChild(installButton);
}

// Écouter l'événement beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt déclenché');
  
  // Empêcher l'affichage automatique de l'invite
  e.preventDefault();
  
  // Stocker l'événement pour l'utiliser plus tard
  deferredPrompt = e;
  
  // Créer et afficher le bouton d'installation
  if (!document.getElementById('installButton')) {
    createInstallButton();
  }
  
  // Afficher le bouton
  installButton.style.display = 'block';
  
  // Masquer le bouton après 30 secondes
  setTimeout(() => {
    if (installButton.style.display === 'block') {
      installButton.style.display = 'none';
    }
  }, 30000);
});

// Vérifier si l'app est déjà installée
window.addEventListener('appinstalled', (e) => {
  console.log('[PWA] Application installée avec succès');
  installButton.style.display = 'none';
  deferredPrompt = null;
  
  // Afficher une notification de succès
  showInstallNotification();
});

// Fonction pour afficher une notification d'installation
function showInstallNotification() {
  // Vérifier si les notifications sont supportées
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification('DestriMed Installé', {
      body: 'L\'application a été installée avec succès !',
      icon: '/assets/icons/icon-192x192.png'
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('DestriMed Installé', {
          body: 'L\'application a été installée avec succès !',
          icon: '/assets/icons/icon-192x192.png'
        });
      }
    });
  }
}

// Vérifier le mode d'affichage
function checkDisplayMode() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('[PWA] Affichage en mode standalone');
    document.body.classList.add('standalone-mode');
  } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
    console.log('[PWA] Affichage en mode fullscreen');
    document.body.classList.add('fullscreen-mode');
  } else {
    console.log('[PWA] Affichage en mode navigateur');
    document.body.classList.add('browser-mode');
  }
}

// Gestion de la connexion réseau
function handleNetworkStatus() {
  const onlineStatus = document.createElement('div');
  onlineStatus.id = 'onlineStatus';
  onlineStatus.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 10px;
    text-align: center;
    font-weight: bold;
    z-index: 1001;
    display: none;
    transition: transform 0.3s;
  `;
  
  document.body.appendChild(onlineStatus);
  
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      onlineStatus.textContent = '✓ En ligne - Synchronisation disponible';
      onlineStatus.style.backgroundColor = '#4CAF50';
      onlineStatus.style.color = 'white';
      onlineStatus.style.display = 'block';
      
      // Masquer après 3 secondes
      setTimeout(() => {
        onlineStatus.style.display = 'none';
      }, 3000);
    } else {
      onlineStatus.textContent = '⚠ Hors ligne - Mode local uniquement';
      onlineStatus.style.backgroundColor = '#ff9800';
      onlineStatus.style.color = 'white';
      onlineStatus.style.display = 'block';
    }
  }
  
  // Écouter les changements de statut réseau
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Mettre à jour le statut initial
  updateOnlineStatus();
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier le mode d'affichage
  checkDisplayMode();
  
  // Gérer le statut réseau
  handleNetworkStatus();
  
  // Ajouter un écouteur pour les changements de mode d'affichage
  window.matchMedia('(display-mode: standalone)').addEventListener('change', checkDisplayMode);
  
  // Vérifier si l'app peut être installée
  if (window.matchMedia('(display-mode: browser)').matches) {
    // L'app n'est pas installée, on peut afficher le bouton d'installation
    // Le bouton sera affiché automatiquement quand beforeinstallprompt sera déclenché
  }
  
  // Ajouter un style pour le mode standalone
  const style = document.createElement('style');
  style.textContent = `
    .standalone-mode header {
      padding-top: env(safe-area-inset-top);
    }
    
    .standalone-mode footer {
      padding-bottom: env(safe-area-inset-bottom);
    }
    
    @media (display-mode: standalone) {
      body {
        user-select: none;
        -webkit-user-select: none;
      }
    }
  `;
  document.head.appendChild(style);
});