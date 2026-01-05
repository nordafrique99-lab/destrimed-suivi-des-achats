# DestriMed - Suivi des Livraisons

Application web progressive (PWA) pour le suivi des livraisons de l'entreprise DestriMed.

## 🌟 Fonctionnalités

- **PWA Complète** : Installation sur bureau et mobile
- **Hors ligne** : Fonctionne sans connexion Internet
- **Interface moderne** : Thèmes jour/nuit
- **Gestion complète** : Suivi des livraisons, agents, clients
- **Export multi-format** : TXT, Excel, PDF
- **Sécurité** : Code de sécurité pour les actions sensibles
- **Synchronisation** : Données stockées localement avec sauvegarde

## 📱 Installation

### Installation en tant qu'application (PWA)
1. Ouvrir l'application dans Chrome/Edge
2. Cliquer sur "Installer l'app" (bouton en bas à droite)
3. Suivre les instructions d'installation

### Installation locale (développement)
1. Cloner le dépôt
2. Servir les fichiers via un serveur HTTP local
3. Ouvrir `http://localhost:PORT` dans le navigateur

## 🏗️ Structure des fichiers
destrimed/
├── index.html # Page principale
├── offline.html # Page hors ligne
├── manifest.json # Configuration PWA
├── sw.js # Service Worker
├── README.md # Documentation
├── styles/
│ └── main.css # Styles CSS
├── scripts/
│ ├── script.js # Logique principale
│ ├── main.js # Gestion PWA
│ ├── xlsx.full.min.js # Export Excel
│ ├── jspdf.umd.min.js # Export PDF
│ └── jspdf.plugin.autotable.min.js
└── assets/
└── icons/ # Icônes PWA
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png

## 🔧 Configuration

### Thèmes
- **Thème jour** : Interface claire
- **Thème nuit** : Interface sombre (active par défaut la nuit)
- Sélection automatique basée sur les préférences système
- Sauvegarde des préférences dans localStorage

### Sécurité
- Code de sécurité : `1234` (modifiable dans `script.js`)
- Requis pour les actions sensibles
- Confirmation modale pour suppression/modification

### Données
- Stockage local dans le navigateur
- Sauvegarde automatique
- Export/import possible
- Pas de serveur requis

## 📊 Exportation

### Formats supportés
1. **TXT** : Format texte avec statistiques
2. **Excel** : Fichier XLSX avec mise en forme
3. **PDF** : Document formaté avec tableaux

### Contenu des exports
- Liste complète des livraisons
- Statistiques par agent
- Totaux et résumés
- Date et heure d'export

## 🔄 Service Worker

L'application utilise un Service Worker pour :
- Mise en cache des ressources
- Fonctionnement hors ligne
- Mises à jour automatiques
- Performances améliorées

### Stratégie de cache
- **Ressources statiques** : Cache First
- **Données dynamiques** : Network First
- **Mise à jour** : Nouveau cache à chaque version

## 📱 Compatibilité

### Navigateurs supportés
- Chrome 54+
- Firefox 51+
- Edge 79+
- Safari 11.1+
- Opera 41+

### Systèmes d'exploitation
- Windows 10+
- macOS 10.11+
- iOS 11.3+
- Android 5.0+

## 🔒 Sécurité des données

- Toutes les données stockées localement
- Pas de transmission vers des serveurs externes
- Code de sécurité pour les modifications
- Protection contre la perte de données

## 🚀 Déploiement

### Serveur web simple
# Avec Python
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server
Configuration serveur
Headers HTTP pour PWA

HTTPS recommandé pour l'installation

MIME types corrects

🐛 Dépannage
L'application ne s'installe pas
Vérifier HTTPS (obligatoire pour l'installation)

Vérifier les permissions du navigateur

S'assurer que le Service Worker est enregistré

Problèmes hors ligne
Vérifier l'enregistrement du Service Worker

Vider le cache et recharger

Vérifier la console du navigateur

Données perdues
Les données sont stockées dans localStorage

Exportez régulièrement vos données

Évitez le mode navigation privée

📝 Notes de version
v1.0.0 (Actuelle)
Version initiale

PWA complète

Export multi-format

Gestion hors ligne

Thèmes jour/nuit

📄 Licence
Application développée pour un usage interne de DestriMed.
Tous droits réservés.

📞 Support
Pour le support technique :

Email : contact@destrimed.com

Consultez la console du navigateur pour les erreurs

Vérifiez la connexion Internet


Exportez vos données régulièrement
