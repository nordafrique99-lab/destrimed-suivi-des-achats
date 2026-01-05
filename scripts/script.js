// scripts/script.js

// Initialiser jsPDF en global
const { jsPDF } = window.jspdf;

// Gestion du thème jour/nuit
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Vérifier si un thème est déjà enregistré
const savedTheme = localStorage.getItem('destrimed-theme');
if (savedTheme === 'night') {
    body.classList.add('night-theme');
    themeToggle.checked = true;
}

themeToggle.addEventListener('change', function() {
    if (this.checked) {
        body.classList.add('night-theme');
        localStorage.setItem('destrimed-theme', 'night');
    } else {
        body.classList.remove('night-theme');
        localStorage.setItem('destrimed-theme', 'day');
    }
});

// Mise à jour de la date
function updateDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('fr-FR', options);
}

updateDate();

// Données des livraisons (stockage en mémoire)
let deliveries = [];
let deliveryId = 1;

// Liste des agents disponibles (stockée dans localStorage)
let agents = JSON.parse(localStorage.getItem('destrimed-agents')) || ["Zied H.", "Mourad C.", "Salah D."];

// Références aux éléments du formulaire
const deliveryForm = document.getElementById('deliveryForm');
const deliveryNumberInput = document.getElementById('deliveryNumber');
const clientCodeInput = document.getElementById('clientCode');
const totalAmountInput = document.getElementById('totalAmount');
const agentNameSelect = document.getElementById('agentName');
const resetBtn = document.getElementById('resetBtn');
const tableBody = document.getElementById('tableBody');
const entriesCount = document.getElementById('entriesCount');
const agentsCount = document.getElementById('agentsCount');

// Variables pour la modification
let isEditing = false;
let editingId = null;

// Références pour les boutons d'exportation
const exportTxtBtn = document.getElementById('exportTxtBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// Références pour la modal de sécurité
const securityModal = document.getElementById('securityModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const securityCodeInput = document.getElementById('securityCode');
const modalError = document.getElementById('modalError');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

// Références pour la modal de gestion des agents
const agentsModal = document.getElementById('agentsModal');
const agentsList = document.getElementById('agentsList');
const newAgentNameInput = document.getElementById('newAgentNameInput');
const addNewAgentBtn = document.getElementById('addNewAgentBtn');
const agentsModalCancel = document.getElementById('agentsModalCancel');
const manageAgentsBtn = document.getElementById('manageAgentsBtn');

// Variables pour suivre l'action en cours
let currentAction = null;
let currentDeliveryId = null;
let currentAgentToDelete = null;

// Code de sécurité
const SECURITY_CODE = "1234";

// Fonction pour sauvegarder les agents dans localStorage
function saveAgentsToStorage() {
    localStorage.setItem('destrimed-agents', JSON.stringify(agents));
}

// Fonction pour mettre à jour le compteur d'agents
function updateAgentsCount() {
    agentsCount.textContent = agents.length;
}

// Fonction pour exporter en format texte (AMÉLIORÉE)
function exportToTxt() {
    if (deliveries.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }
    
    let txtContent = "=".repeat(60) + "\n";
    txtContent += "DESTRIMED - HISTORIQUE COMPLET DES LIVRAISONS\n";
    txtContent += "=".repeat(60) + "\n\n";
    txtContent += `Date d'export: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n`;
    txtContent += `Nombre total de livraisons: ${deliveries.length}\n`;
    txtContent += `Montant total des livraisons: ${calculateTotalAmount()} DT\n\n`;
    txtContent += "-".repeat(60) + "\n";
    txtContent += "DÉTAIL DES LIVRAISONS\n";
    txtContent += "-".repeat(60) + "\n\n";
    
    deliveries.forEach((delivery, index) => {
        txtContent += `LIVRAISON N° ${index + 1}\n`;
        txtContent += `  • Numéro de livraison: ${delivery.deliveryNumber}\n`;
        txtContent += `  • Code client: ${delivery.clientCode}\n`;
        txtContent += `  • Montant total: ${delivery.totalAmount} DT\n`;
        txtContent += `  • Agent responsable: ${delivery.agentName}\n`;
        txtContent += `  • ID enregistrement: ${delivery.id}\n`;
        txtContent += "-".repeat(40) + "\n\n";
    });
    
    // Statistiques
    txtContent += "-".repeat(60) + "\n";
    txtContent += "STATISTIQUES\n";
    txtContent += "-".repeat(60) + "\n\n";
    
    // Calculer les statistiques par agent
    const agentStats = {};
    deliveries.forEach(delivery => {
        if (!agentStats[delivery.agentName]) {
            agentStats[delivery.agentName] = {
                count: 0,
                totalAmount: 0
            };
        }
        agentStats[delivery.agentName].count++;
        agentStats[delivery.agentName].totalAmount += parseFloat(delivery.totalAmount);
    });
    
    txtContent += "Répartition par agent:\n";
    Object.keys(agentStats).forEach(agent => {
        txtContent += `  • ${agent}: ${agentStats[agent].count} livraison(s) - ${agentStats[agent].totalAmount.toFixed(2)} DT\n`;
    });
    
    txtContent += "\n" + "=".repeat(60) + "\n";
    txtContent += "FIN DU RAPPORT\n";
    txtContent += "=".repeat(60) + "\n";
    txtContent += `© DestriMed ${new Date().getFullYear()} - Tous droits réservés\n`;
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `destrimed_historique_complet_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("Export texte terminé ! Le fichier a été téléchargé.");
}

// Fonction pour exporter en format Excel (AVEC XLSX)
function exportToExcel() {
    if (deliveries.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }
    
    try {
        // Préparer les données
        const worksheetData = [
            ["N°", "N° Livraison", "Code Client", "Montant Total (DT)", "Agent Responsable", "ID"],
            ...deliveries.map((d, index) => [
                index + 1,
                d.deliveryNumber,
                d.clientCode,
                parseFloat(d.totalAmount),
                d.agentName,
                d.id
            ])
        ];
        
        // Ajouter les totaux
        worksheetData.push([]);
        worksheetData.push(["TOTAL", "", "", calculateTotalAmount(), "", `Nb: ${deliveries.length}`]);
        
        // Créer un nouveau classeur
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Ajouter des styles (largeur des colonnes)
        const colWidths = [
            {wch: 5},   // N°
            {wch: 12},  // N° Livraison
            {wch: 12},  // Code Client
            {wch: 15},  // Montant
            {wch: 20},  // Agent
            {wch: 8}    // ID
        ];
        ws['!cols'] = colWidths;
        
        // Ajouter la feuille au classeur
        XLSX.utils.book_append_sheet(wb, ws, "Livraisons DestriMed");
        
        // Créer une feuille de statistiques
        const statsData = [
            ["STATISTIQUES DES LIVRAISONS - DESTRIMED"],
            ["Date d'export", new Date().toLocaleDateString('fr-FR')],
            ["Heure d'export", new Date().toLocaleTimeString('fr-FR')],
            [],
            ["RÉSUMÉ"],
            ["Nombre total de livraisons", deliveries.length],
            ["Montant total des livraisons", calculateTotalAmount() + " DT"],
            [],
            ["RÉPARTITION PAR AGENT"]
        ];
        
        // Calculer les statistiques par agent
        const agentStats = {};
        deliveries.forEach(delivery => {
            if (!agentStats[delivery.agentName]) {
                agentStats[delivery.agentName] = {
                    count: 0,
                    totalAmount: 0
                };
            }
            agentStats[delivery.agentName].count++;
            agentStats[delivery.agentName].totalAmount += parseFloat(delivery.totalAmount);
        });
        
        Object.keys(agentStats).forEach(agent => {
            statsData.push([agent, `${agentStats[agent].count} livraisons`, `${agentStats[agent].totalAmount.toFixed(2)} DT`]);
        });
        
        const wsStats = XLSX.utils.aoa_to_sheet(statsData);
        wsStats['!cols'] = [{wch: 25}, {wch: 15}, {wch: 15}];
        XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");
        
        // Générer et télécharger le fichier
        XLSX.writeFile(wb, `destrimed_historique_${new Date().toISOString().split('T')[0]}.xlsx`);
        alert("Export Excel terminé avec succès !");
    } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        alert("Erreur lors de l'export Excel. Veuillez réessayer.");
    }
}

// Fonction pour exporter en format PDF (AVEC JSPDF)
function exportToPdf() {
    if (deliveries.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }
    
    try {
        // Créer un nouveau document PDF
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // Variables pour le positionnement
        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        
        // EN-TÊTE
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(74, 144, 226); // Bleu DestriMed
        doc.text("DESTRIMED - HISTORIQUE DES LIVRAISONS", pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(`Export du: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 15;
        
        // RÉSUMÉ
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("RÉSUMÉ", margin, yPosition);
        
        yPosition += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Nombre total de livraisons: ${deliveries.length}`, margin + 5, yPosition);
        yPosition += 6;
        doc.text(`Montant total: ${calculateTotalAmount()} DT`, margin + 5, yPosition);
        
        yPosition += 15;
        
        // TABLEAU DES LIVRAISONS
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("DÉTAIL DES LIVRAISONS", margin, yPosition);
        
        yPosition += 10;
        
        // Préparer les données du tableau
        const tableData = deliveries.map((delivery, index) => [
            index + 1,
            delivery.deliveryNumber,
            delivery.clientCode,
            delivery.totalAmount + " DT",
            delivery.agentName
        ]);
        
        // Créer le tableau
        doc.autoTable({
            startY: yPosition,
            head: [['N°', 'N° Livraison', 'Code Client', 'Montant Total', 'Agent Responsable']],
            body: tableData,
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [74, 144, 226],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 247, 255]
            },
            styles: {
                fontSize: 10,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 15 }, // N°
                1: { cellWidth: 30 }, // N° Livraison
                2: { cellWidth: 30 }, // Code Client
                3: { cellWidth: 30 }, // Montant
                4: { cellWidth: 40 }  // Agent
            }
        });
        
        // Récupérer la position Y après le tableau
        yPosition = doc.lastAutoTable.finalY + 15;
        
        // Vérifier si on a besoin d'une nouvelle page pour les statistiques
        if (yPosition > doc.internal.pageSize.height - 50) {
            doc.addPage();
            yPosition = 20;
        }
        
        // STATISTIQUES PAR AGENT
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("STATISTIQUES PAR AGENT", margin, yPosition);
        
        yPosition += 10;
        
        // Calculer les statistiques
        const agentStats = {};
        deliveries.forEach(delivery => {
            if (!agentStats[delivery.agentName]) {
                agentStats[delivery.agentName] = {
                    count: 0,
                    totalAmount: 0
                };
            }
            agentStats[delivery.agentName].count++;
            agentStats[delivery.agentName].totalAmount += parseFloat(delivery.totalAmount);
        });
        
        // Tableau des statistiques
        const statsData = [];
        Object.keys(agentStats).forEach(agent => {
            statsData.push([
                agent,
                agentStats[agent].count,
                agentStats[agent].totalAmount.toFixed(2) + " DT"
            ]);
        });
        
        doc.autoTable({
            startY: yPosition,
            head: [['Agent', 'Nombre de livraisons', 'Montant total']],
            body: statsData,
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [58, 80, 107],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 40 },
                2: { cellWidth: 40 }
            }
        });
        
        // PIED DE PAGE
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${i}/${pageCount} | © DestriMed ${new Date().getFullYear()} | Export généré automatiquement`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }
        
        // Télécharger le PDF
        doc.save(`destrimed_historique_${new Date().toISOString().split('T')[0]}.pdf`);
        alert("Export PDF terminé avec succès !");
    } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        alert("Erreur lors de l'export PDF. Veuillez réessayer.");
    }
}

// Fonction pour calculer le montant total
function calculateTotalAmount() {
    return deliveries.reduce((total, delivery) => {
        return total + parseFloat(delivery.totalAmount);
    }, 0).toFixed(2);
}

// Événements pour les boutons d'exportation
exportTxtBtn.addEventListener('click', exportToTxt);
exportExcelBtn.addEventListener('click', exportToExcel);
exportPdfBtn.addEventListener('click', exportToPdf);

// Initialiser le menu déroulant des agents
function initializeAgentSelect() {
    // Vider les options existantes
    while (agentNameSelect.children.length > 1) {
        agentNameSelect.removeChild(agentNameSelect.children[1]);
    }
    
    // Ajouter les agents disponibles
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent;
        option.textContent = agent;
        agentNameSelect.appendChild(option);
    });
    
    // Mettre à jour le compteur d'agents
    updateAgentsCount();
}

// Fonction pour afficher la modal de gestion des agents
function showAgentsModal() {
    updateAgentsList();
    agentsModal.style.display = 'flex';
    newAgentNameInput.focus();
}

// Fonction pour fermer la modal de gestion des agents
function closeAgentsModal() {
    agentsModal.style.display = 'none';
    newAgentNameInput.value = '';
}

// Fonction pour mettre à jour la liste des agents dans la modal
function updateAgentsList() {
    agentsList.innerHTML = '';
    
    if (agents.length === 0) {
        agentsList.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Aucun agent disponible</p>';
        return;
    }
    
    agents.forEach((agent, index) => {
        const agentItem = document.createElement('div');
        agentItem.className = 'agent-item';
        
        agentItem.innerHTML = `
            <div class="agent-name">${agent}</div>
            <div class="agent-actions">
                <button class="delete-agent-btn" data-agent-index="${index}">
                    Supprimer
                </button>
            </div>
        `;
        
        agentsList.appendChild(agentItem);
    });
    
    // Ajouter des écouteurs d'événements pour les boutons de suppression
    document.querySelectorAll('.delete-agent-btn').forEach(button => {
        button.addEventListener('click', function() {
            const agentIndex = parseInt(this.getAttribute('data-agent-index'));
            const agentName = agents[agentIndex];
            
            // Vérifier si l'agent est utilisé dans des livraisons
            const isAgentUsed = deliveries.some(delivery => delivery.agentName === agentName);
            
            if (isAgentUsed) {
                alert(`Impossible de supprimer "${agentName}" car cet agent est associé à une ou plusieurs livraisons. Veuillez d'abord modifier ou supprimer ces livraisons.`);
                return;
            }
            
            // Demander confirmation
            if (confirm(`Voulez-vous vraiment supprimer l'agent "${agentName}" ?`)) {
                showSecurityModal('deleteAgent', agentIndex);
            }
        });
    });
}

// Fonction pour ajouter un nouvel agent
function addNewAgent(agentName) {
    const trimmedName = agentName.trim();
    
    if (!trimmedName) {
        alert("Veuillez saisir un nom valide.");
        return false;
    }
    
    // Vérifier si l'agent existe déjà
    if (agents.includes(trimmedName)) {
        alert("Cet agent existe déjà dans la liste.");
        return false;
    }
    
    // Ajouter le nouvel agent à la liste
    agents.push(trimmedName);
    
    // Sauvegarder dans localStorage
    saveAgentsToStorage();
    
    // Mettre à jour le menu déroulant
    initializeAgentSelect();
    
    // Mettre à jour la liste dans la modal
    updateAgentsList();
    
    // Réinitialiser le champ d'ajout
    newAgentNameInput.value = '';
    
    // Remettre le focus
    newAgentNameInput.focus();
    
    return true;
}

// Fonction pour supprimer un agent
function deleteAgent(agentIndex) {
    if (agentIndex >= 0 && agentIndex < agents.length) {
        const agentName = agents[agentIndex];
        
        // Vérifier si l'agent est utilisé dans des livraisons
        const isAgentUsed = deliveries.some(delivery => delivery.agentName === agentName);
        
        if (isAgentUsed) {
            alert(`Impossible de supprimer "${agentName}" car cet agent est associé à une ou plusieurs livraisons. Veuillez d'abord modifier ou supprimer ces livraisons.`);
            return false;
        }
        
        // Supprimer l'agent
        agents.splice(agentIndex, 1);
        
        // Sauvegarder dans localStorage
        saveAgentsToStorage();
        
        // Mettre à jour le menu déroulant
        initializeAgentSelect();
        
        // Mettre à jour la liste dans la modal
        updateAgentsList();
        
        // Si l'agent sélectionné dans le formulaire a été supprimé, réinitialiser la sélection
        if (agentNameSelect.value === agentName) {
            agentNameSelect.value = '';
        }
        
        return true;
    }
    return false;
}

// Fonction pour afficher la modal de sécurité
function showSecurityModal(action, targetId, extraData = null) {
    currentAction = action;
    
    if (action === 'deleteAgent') {
        currentAgentToDelete = targetId;
        modalTitle.textContent = "Supprimer un agent";
        modalMessage.textContent = `Veuillez entrer le code de sécurité (1234) pour supprimer l'agent "${agents[targetId]}".`;
    } else if (action === 'delete') {
        currentDeliveryId = targetId;
        modalTitle.textContent = "Supprimer la livraison";
        modalMessage.textContent = "Veuillez entrer le code de sécurité (1234) pour supprimer cette livraison.";
    } else if (action === 'reinstall') {
        currentDeliveryId = targetId;
        modalTitle.textContent = "Réinstaller la livraison";
        modalMessage.textContent = "Veuillez entrer le code de sécurité (1234) pour réinstaller cette livraison.";
    } else if (action === 'addAgent') {
        // Store the agent name for later use
        window.tempAgentName = extraData;
        modalTitle.textContent = "Ajouter un nouvel agent";
        modalMessage.textContent = `Veuillez entrer le code de sécurité (1234) pour ajouter l'agent "${extraData}".`;
    } else if (action === 'modify') {
        currentDeliveryId = targetId;
        modalTitle.textContent = "Modifier la livraison";
        modalMessage.textContent = "Veuillez entrer le code de sécurité (1234) pour modifier cette livraison.";
    }
    
    // Réinitialiser le champ de code
    securityCodeInput.value = '';
    modalError.textContent = '';
    
    // Afficher la modal
    securityModal.style.display = 'flex';
    securityCodeInput.focus();
}

// Fonction pour fermer la modal de sécurité
function closeSecurityModal() {
    securityModal.style.display = 'none';
    currentAction = null;
    currentDeliveryId = null;
    currentAgentToDelete = null;
    window.tempAgentName = null; // Clear temp data
}

// Gestion de la validation du code
function validateSecurityCode() {
    const enteredCode = securityCodeInput.value;
    
    if (enteredCode === SECURITY_CODE) {
        // Code correct, exécuter l'action
        if (currentAction === 'deleteAgent') {
            if (deleteAgent(currentAgentToDelete)) {
                alert("Agent supprimé avec succès !");
            }
        } else if (currentAction === 'delete') {
            deleteDelivery(currentDeliveryId);
        } else if (currentAction === 'reinstall') {
            reinstallDelivery(currentDeliveryId);
        } else if (currentAction === 'addAgent') {
            // Use the stored agent name
            const newAgentName = window.tempAgentName;
            if (newAgentName && addNewAgent(newAgentName)) {
                alert("Nouvel agent ajouté avec succès !");
            }
            // Clear the temporary storage
            window.tempAgentName = null;
        } else if (currentAction === 'modify') {
            // Start modifying the delivery
            startModifyDelivery(currentDeliveryId);
        }
        closeSecurityModal();
    } else {
        // Code incorrect
        modalError.textContent = "Code incorrect. Veuillez réessayer.";
        securityCodeInput.value = '';
        securityCodeInput.focus();
    }
}

// Événements pour la modal de sécurité
modalCancel.addEventListener('click', closeSecurityModal);
modalConfirm.addEventListener('click', validateSecurityCode);

// Permettre la validation avec la touche Entrée
securityCodeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        validateSecurityCode();
    }
});

// Fermer la modal en cliquant à l'extérieur
securityModal.addEventListener('click', function(e) {
    if (e.target === securityModal) {
        closeSecurityModal();
    }
});

// Événements pour la modal de gestion des agents
manageAgentsBtn.addEventListener('click', showAgentsModal);
agentsModalCancel.addEventListener('click', closeAgentsModal);

// Ajouter un agent depuis la modal
addNewAgentBtn.addEventListener('click', function() {
    const newAgentName = newAgentNameInput.value.trim();
    if (newAgentName) {
        // Vérifier si l'agent existe déjà
        if (agents.includes(newAgentName)) {
            alert("Cet agent existe déjà dans la liste.");
            return;
        }
        
        // FIRST: Close the agents modal
        closeAgentsModal();
        
        // THEN: Show security modal with the agent name as data
        showSecurityModal('addAgent', null, newAgentName);
    } else {
        alert("Veuillez saisir un nom d'agent.");
    }
});

// Permettre l'ajout d'agent avec la touche Entrée
newAgentNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addNewAgentBtn.click();
    }
});

// Fermer la modal en cliquant à l'extérieur
agentsModal.addEventListener('click', function(e) {
    if (e.target === agentsModal) {
        closeAgentsModal();
    }
});

// Fonction pour réinitialiser le formulaire
function resetForm() {
    deliveryForm.reset();
    initializeAgentSelect();
    deliveryNumberInput.focus();
    isEditing = false;
    editingId = null;
    document.querySelector('.submit-btn').textContent = 'Ajouter à la liste';
}

// Gestion de la soumission du formulaire
deliveryForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Validation des données
    const deliveryNumber = parseInt(deliveryNumberInput.value);
    const clientCode = parseInt(clientCodeInput.value);
    const totalAmount = parseFloat(totalAmountInput.value);
    const agentName = agentNameSelect.value;
    
    if (deliveryNumber < 0) {
        alert("Le numéro de bon de livraison doit être 0 ou positif.");
        return;
    }
    
    if (totalAmount < 0) {
        alert("Le montant total doit être positif.");
        return;
    }
    
    if (!agentName) {
        alert("Veuillez sélectionner un agent responsable.");
        return;
    }
    
    if (isEditing && editingId) {
        // Mettre à jour la livraison existante
        const deliveryIndex = deliveries.findIndex(d => d.id === editingId);
        if (deliveryIndex !== -1) {
            // Sauvegarder les valeurs initiales si c'est la première modification
            if (!deliveries[deliveryIndex].initialValues) {
                deliveries[deliveryIndex].initialValues = {
                    deliveryNumber: deliveries[deliveryIndex].deliveryNumber,
                    clientCode: deliveries[deliveryIndex].clientCode,
                    totalAmount: deliveries[deliveryIndex].totalAmount,
                    agentName: deliveries[deliveryIndex].agentName
                };
            }
            
            deliveries[deliveryIndex].deliveryNumber = deliveryNumber;
            deliveries[deliveryIndex].clientCode = clientCode;
            deliveries[deliveryIndex].totalAmount = totalAmount.toFixed(2);
            deliveries[deliveryIndex].agentName = agentName;
        }
    } else {
        // Ajouter une nouvelle livraison
        const delivery = {
            id: deliveryId++,
            deliveryNumber: deliveryNumber,
            clientCode: clientCode,
            totalAmount: totalAmount.toFixed(2),
            agentName: agentName,
            initialValues: {
                deliveryNumber: deliveryNumber,
                clientCode: clientCode,
                totalAmount: totalAmount.toFixed(2),
                agentName: agentName
            }
        };
        
        deliveries.push(delivery);
    }
    
    // Mettre à jour l'affichage
    updateTable();
    
    // Réinitialiser le formulaire
    resetForm();
});

// Réinitialisation du formulaire
resetBtn.addEventListener('click', resetForm);

// Mettre à jour le tableau des livraisons
function updateTable() {
    // Mettre à jour le compteur
    entriesCount.textContent = deliveries.length;
    
    // Si aucune livraison, afficher le message vide
    if (deliveries.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">Aucune donnée enregistrée. Ajoutez votre première livraison ci-dessus.</td>
            </tr>
        `;
        return;
    }
    
    // Générer les lignes du tableau
    let tableHTML = '';
    
    deliveries.forEach(delivery => {
        tableHTML += `
            <tr>
                <td>${delivery.deliveryNumber}</td>
                <td>${delivery.clientCode}</td>
                <td>${delivery.totalAmount} DT</td>
                <td>${delivery.agentName}</td>
                <td>
                    <div class="action-buttons">
                        <button class="modify-btn" onclick="startModifySecurity(${delivery.id})">
                            Modifier
                        </button>
                        <button class="reinstall-btn" onclick="showSecurityModal('reinstall', ${delivery.id})">
                            Réinstaller
                        </button>
                        <button class="delete-btn" onclick="showSecurityModal('delete', ${delivery.id})">
                            Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHTML;
}

// Fonction pour lancer la modification avec sécurité
function startModifySecurity(id) {
    showSecurityModal('modify', id);
}

// Fonction pour démarrer la modification
function startModifyDelivery(id) {
    const delivery = deliveries.find(d => d.id === id);
    
    if (delivery) {
        // Remplir le formulaire avec les valeurs actuelles
        deliveryNumberInput.value = delivery.deliveryNumber;
        clientCodeInput.value = delivery.clientCode;
        totalAmountInput.value = delivery.totalAmount;
        agentNameSelect.value = delivery.agentName;
        
        // Passer en mode édition
        isEditing = true;
        editingId = id;
        document.querySelector('.submit-btn').textContent = 'Mettre à jour';
        deliveryNumberInput.focus();
    }
}

// Fonction pour réinstaller une livraison (retour aux valeurs initiales)
function reinstallDelivery(id) {
    const deliveryIndex = deliveries.findIndex(d => d.id === id);
    
    if (deliveryIndex !== -1 && deliveries[deliveryIndex].initialValues) {
        // Restaurer les valeurs initiales
        deliveries[deliveryIndex].deliveryNumber = deliveries[deliveryIndex].initialValues.deliveryNumber;
        deliveries[deliveryIndex].clientCode = deliveries[deliveryIndex].initialValues.clientCode;
        deliveries[deliveryIndex].totalAmount = deliveries[deliveryIndex].initialValues.totalAmount;
        deliveries[deliveryIndex].agentName = deliveries[deliveryIndex].initialValues.agentName;
        
        updateTable();
        alert("Livraison réinstallée avec succès ! Valeurs initiales restaurées.");
    } else {
        alert("Impossible de réinstaller : valeurs initiales non disponibles.");
    }
}

// Fonction pour supprimer une livraison
function deleteDelivery(id) {
    deliveries = deliveries.filter(delivery => delivery.id !== id);
    updateTable();
}

// Fonctions globales pour les boutons
window.showSecurityModal = showSecurityModal;
window.startModifySecurity = startModifySecurity;

// Initialiser le menu déroulant des agents
initializeAgentSelect();

// Ajouter quelques exemples de données au chargement
window.addEventListener('DOMContentLoaded', function() {
    // Exemples de données initiales
    const sampleData = [
        {
            id: deliveryId++,
            deliveryNumber: 1001,
            clientCode: 4521,
            totalAmount: "1250.50",
            agentName: "Zied H.",
            initialValues: {
                deliveryNumber: 1001,
                clientCode: 4521,
                totalAmount: "1250.50",
                agentName: "Zied H."
            }
        },
        {
            id: deliveryId++,
            deliveryNumber: 1002,
            clientCode: 3678,
            totalAmount: "845.00",
            agentName: "Mourad C.",
            initialValues: {
                deliveryNumber: 1002,
                clientCode: 3678,
                totalAmount: "845.00",
                agentName: "Mourad C."
            }
        },
        {
            id: deliveryId++,
            deliveryNumber: 1003,
            clientCode: 5214,
            totalAmount: "2310.75",
            agentName: "Salah D.",
            initialValues: {
                deliveryNumber: 1003,
                clientCode: 5214,
                totalAmount: "2310.75",
                agentName: "Salah D."
            }
        }
    ];
    
    deliveries.push(...sampleData);
    updateTable();
});