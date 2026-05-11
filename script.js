const STORAGE_KEY = 'etudemande_demandes';
let demandes = [];

// Types de demandes
const typeLabels = {
    aide: "Demande d'aide",
    information: "Demande d'information",
    probleme: "Problème",
    autre: "Autre"
};

// Configuration des statuts
const statutConfig = {
    en_attente: {
        label: "En attente",
        class: "badge-warning",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
    },
    en_cours: {
        label: "En cours",
        class: "badge-info",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    },
    traite: {
        label: "Traité",
        class: "badge-success",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    }
};

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Charger les demandes du localStorage
    loadDemandes();
    
    // Initialiser les événements
    initMenuToggle();
    initSmoothScroll();
    initFormSubmit();
    
    // Afficher les demandes
    renderDemandesListe();
    renderAdminListe();
    updateStats();
});

// ==========================================
// GESTION DU MENU MOBILE
// ==========================================
function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Fermer le menu lors du clic sur un lien
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }
}

// ==========================================
// SMOOTH SCROLL
// ==========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ==========================================
// GESTION DU FORMULAIRE
// ==========================================
function initFormSubmit() {
    const form = document.getElementById('demandeForm');
    const submitBtn = document.getElementById('submitBtn');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Afficher le loader
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            const btnIcon = submitBtn.querySelector('.btn-icon');
            
            btnText.style.display = 'none';
            btnIcon.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            submitBtn.disabled = true;
            
            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Créer la nouvelle demande
            const formData = new FormData(form);
            const nouvelleDemande = {
                id: Date.now().toString(),
                nom: formData.get('nom'),
                email: formData.get('email'),
                type: formData.get('type'),
                sujet: formData.get('sujet'),
                message: formData.get('message'),
                statut: 'en_attente',
                dateCreation: new Date().toISOString(),
                reponse: null,
                dateReponse: null
            };
            
            // Ajouter et sauvegarder
            demandes.unshift(nouvelleDemande);
            saveDemandes();
            
            // Mettre à jour l'affichage
            renderDemandesListe();
            renderAdminListe();
            updateStats();
            
            // Reset le formulaire
            form.reset();
            
            // Cacher le loader
            btnText.style.display = 'inline';
            btnIcon.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
            
            // Afficher le toast
            showToast('Demande envoyée avec succès!', 'Vous recevrez une réponse dans les plus brefs délais.');
            
            // Scroll vers les demandes
            setTimeout(() => {
                document.getElementById('mes-demandes').scrollIntoView({ behavior: 'smooth' });
            }, 500);
        });
    }
}

// ==========================================
// GESTION DU LOCALSTORAGE
// ==========================================
function loadDemandes() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            demandes = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        demandes = [];
    }
}

function saveDemandes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demandes));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des demandes:', error);
    }
}

// ==========================================
// FORMATAGE DE DATE
// ==========================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==========================================
// RENDU DE LA LISTE DES DEMANDES (ÉTUDIANT)
// ==========================================
function renderDemandesListe() {
    const container = document.getElementById('demandesListe');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    if (demandes.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = demandes.map(demande => {
        const statut = statutConfig[demande.statut];
        
        return `
            <div class="demande-card">
                <div class="demande-header">
                    <div class="demande-info">
                        <h4>${escapeHtml(demande.sujet)}</h4>
                        <div class="demande-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${formatDate(demande.dateCreation)}
                        </div>
                    </div>
                    <div class="demande-badges">
                        <span class="badge">${typeLabels[demande.type] || demande.type}</span>
                        <span class="badge ${statut.class}">
                            ${statut.icon}
                            ${statut.label}
                        </span>
                    </div>
                </div>
                <div class="demande-body">
                    <div class="demande-message">${escapeHtml(demande.message)}</div>
                    ${demande.reponse ? `
                        <div class="demande-reponse">
                            <div class="demande-reponse-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                Réponse de l'administration
                            </div>
                            <div class="demande-reponse-text">${escapeHtml(demande.reponse)}</div>
                            ${demande.dateReponse ? `<div class="demande-reponse-date">Répondu le ${formatDate(demande.dateReponse)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// RENDU DE LA LISTE ADMIN
// ==========================================
function renderAdminListe() {
    const container = document.getElementById('adminListe');
    const emptyState = document.getElementById('adminEmptyState');
    
    if (!container) return;
    
    if (demandes.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = demandes.map(demande => {
        const statut = statutConfig[demande.statut];
        
        return `
            <div class="demande-card" id="demande-${demande.id}">
                <div class="demande-header">
                    <div class="demande-info">
                        <h4>${escapeHtml(demande.sujet)}</h4>
                        <div class="demande-admin-info">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                ${escapeHtml(demande.nom)}
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                ${escapeHtml(demande.email)}
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                ${formatDate(demande.dateCreation)}
                            </span>
                        </div>
                    </div>
                    <div class="demande-badges">
                        <span class="badge">${typeLabels[demande.type] || demande.type}</span>
                        <select class="status-select" onchange="updateStatut('${demande.id}', this.value)">
                            <option value="en_attente" ${demande.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
                            <option value="en_cours" ${demande.statut === 'en_cours' ? 'selected' : ''}>En cours</option>
                            <option value="traite" ${demande.statut === 'traite' ? 'selected' : ''}>Traité</option>
                        </select>
                    </div>
                </div>
                <div class="demande-body">
                    <div class="demande-message">${escapeHtml(demande.message)}</div>
                    ${demande.reponse ? `
                        <div class="demande-reponse">
                            <div class="demande-reponse-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                Réponse envoyée
                            </div>
                            <div class="demande-reponse-text">${escapeHtml(demande.reponse)}</div>
                            ${demande.dateReponse ? `<div class="demande-reponse-date">Répondu le ${formatDate(demande.dateReponse)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
                ${!demande.reponse ? `
                    <div class="demande-actions">
                        <button class="btn btn-outline" onclick="toggleReponseForm('${demande.id}')">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            Répondre
                        </button>
                        <div class="reponse-form" id="reponse-form-${demande.id}" style="display: none;">
                            <textarea class="form-textarea" id="reponse-text-${demande.id}" placeholder="Écrivez votre réponse ici..." rows="4"></textarea>
                            <div class="reponse-buttons">
                                <button class="btn btn-primary" onclick="envoyerReponse('${demande.id}')">
                                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="22" y1="2" x2="11" y2="13"/>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                    Envoyer la réponse
                                </button>
                                <button class="btn btn-outline" onclick="toggleReponseForm('${demande.id}')">Annuler</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ==========================================
// MISE À JOUR DES STATISTIQUES
// ==========================================
function updateStats() {
    const total = demandes.length;
    const enAttente = demandes.filter(d => d.statut === 'en_attente').length;
    const enCours = demandes.filter(d => d.statut === 'en_cours').length;
    const traite = demandes.filter(d => d.statut === 'traite').length;
    
    const statTotal = document.getElementById('statTotal');
    const statEnAttente = document.getElementById('statEnAttente');
    const statEnCours = document.getElementById('statEnCours');
    const statTraite = document.getElementById('statTraite');
    
    if (statTotal) statTotal.textContent = total;
    if (statEnAttente) statEnAttente.textContent = enAttente;
    if (statEnCours) statEnCours.textContent = enCours;
    if (statTraite) statTraite.textContent = traite;
}

// ==========================================
// ACTIONS ADMIN
// ==========================================
function toggleReponseForm(id) {
    const form = document.getElementById(`reponse-form-${id}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

function updateStatut(id, newStatut) {
    const demande = demandes.find(d => d.id === id);
    if (demande) {
        demande.statut = newStatut;
        saveDemandes();
        renderDemandesListe();
        updateStats();
    }
}

function envoyerReponse(id) {
    const textarea = document.getElementById(`reponse-text-${id}`);
    const reponse = textarea ? textarea.value.trim() : '';
    
    if (!reponse) {
        showToast('Erreur', 'Veuillez saisir une réponse.', true);
        return;
    }
    
    const demande = demandes.find(d => d.id === id);
    if (demande) {
        demande.reponse = reponse;
        demande.dateReponse = new Date().toISOString();
        demande.statut = 'traite';
        saveDemandes();
        renderDemandesListe();
        renderAdminListe();
        updateStats();
        showToast('Réponse envoyée!', "L'étudiant a été notifié de votre réponse.");
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(title, description, isError = false) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastDescription = document.getElementById('toastDescription');
    const toastIcon = toast.querySelector('.toast-icon');
    
    toastTitle.textContent = title;
    toastDescription.textContent = description;
    
    if (isError) {
        toastIcon.style.color = '#ef4444';
    } else {
        toastIcon.style.color = '#22c55e';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
emailjs.init("TTbKlCwec5kBMR-VB");

  const STORAGE_KEY = 'etudemande_demandes';
let demandes = [];

// Types de demandes
const typeLabels = {
    aide: "Demande d'aide",
    information: "Demande d'information",
    probleme: "Problème",
    autre: "Autre"
};

// Configuration des statuts
const statutConfig = {
    en_attente: {
        label: "En attente",
        class: "badge-warning",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
    },
    en_cours: {
        label: "En cours",
        class: "badge-info",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    },
    traite: {
        label: "Traité",
        class: "badge-success",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    }
};

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Charger les demandes du localStorage
    loadDemandes();
    
    // Initialiser les événements
    initMenuToggle();
    initSmoothScroll();
    initFormSubmit();
    
    // Afficher les demandes
    renderDemandesListe();
    renderAdminListe();
    updateStats();
});

// ==========================================
// GESTION DU MENU MOBILE
// ==========================================
function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Fermer le menu lors du clic sur un lien
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }
}

// ==========================================
// SMOOTH SCROLL
// ==========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ==========================================
// GESTION DU FORMULAIRE
// ==========================================
function initFormSubmit() {
    const form = document.getElementById('demandeForm');
    const submitBtn = document.getElementById('submitBtn');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Afficher le loader
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            const btnIcon = submitBtn.querySelector('.btn-icon');
            
            btnText.style.display = 'none';
            btnIcon.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            submitBtn.disabled = true;
            
            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Créer la nouvelle demande
            const formData = new FormData(form);
            const nouvelleDemande = {
                id: Date.now().toString(),
                nom: formData.get('nom'),
                email: formData.get('email'),
                type: formData.get('type'),
                sujet: formData.get('sujet'),
                message: formData.get('message'),
                statut: 'en_attente',
                dateCreation: new Date().toISOString(),
                reponse: null,
                dateReponse: null
            };
            
            // Ajouter et sauvegarder
            demandes.unshift(nouvelleDemande);
            saveDemandes();
            
            // Mettre à jour l'affichage
            renderDemandesListe();
            renderAdminListe();
            updateStats();
            
            // Reset le formulaire
            form.reset();
            
            // Cacher le loader
            btnText.style.display = 'inline';
            btnIcon.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
            
            // Afficher le toast
            showToast('Demande envoyée avec succès!', 'Vous recevrez une réponse dans les plus brefs délais.');
            
            // Scroll vers les demandes
            setTimeout(() => {
                document.getElementById('mes-demandes').scrollIntoView({ behavior: 'smooth' });
            }, 500);
        });
    }
}

// ==========================================
// GESTION DU LOCALSTORAGE
// ==========================================
function loadDemandes() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            demandes = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        demandes = [];
    }
}

function saveDemandes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demandes));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des demandes:', error);
    }
}

// ==========================================
// FORMATAGE DE DATE
// ==========================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==========================================
// RENDU DE LA LISTE DES DEMANDES (ÉTUDIANT)
// ==========================================
function renderDemandesListe() {
    const container = document.getElementById('demandesListe');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    if (demandes.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = demandes.map(demande => {
        const statut = statutConfig[demande.statut];
        
        return `
            <div class="demande-card">
                <div class="demande-header">
                    <div class="demande-info">
                        <h4>${escapeHtml(demande.sujet)}</h4>
                        <div class="demande-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${formatDate(demande.dateCreation)}
                        </div>
                    </div>
                    <div class="demande-badges">
                        <span class="badge">${typeLabels[demande.type] || demande.type}</span>
                        <span class="badge ${statut.class}">
                            ${statut.icon}
                            ${statut.label}
                        </span>
                    </div>
                </div>
                <div class="demande-body">
                    <div class="demande-message">${escapeHtml(demande.message)}</div>
                    ${demande.reponse ? `
                        <div class="demande-reponse">
                            <div class="demande-reponse-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                Réponse de l'administration
                            </div>
                            <div class="demande-reponse-text">${escapeHtml(demande.reponse)}</div>
                            ${demande.dateReponse ? `<div class="demande-reponse-date">Répondu le ${formatDate(demande.dateReponse)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// RENDU DE LA LISTE ADMIN
// ==========================================
function renderAdminListe() {
    const container = document.getElementById('adminListe');
    const emptyState = document.getElementById('adminEmptyState');
    
    if (!container) return;
    
    if (demandes.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = demandes.map(demande => {
        const statut = statutConfig[demande.statut];
        
        return `
            <div class="demande-card" id="demande-${demande.id}">
                <div class="demande-header">
                    <div class="demande-info">
                        <h4>${escapeHtml(demande.sujet)}</h4>
                        <div class="demande-admin-info">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                ${escapeHtml(demande.nom)}
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                ${escapeHtml(demande.email)}
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                ${formatDate(demande.dateCreation)}
                            </span>
                        </div>
                    </div>
                    <div class="demande-badges">
                        <span class="badge">${typeLabels[demande.type] || demande.type}</span>
                        <select class="status-select" onchange="updateStatut('${demande.id}', this.value)">
                            <option value="en_attente" ${demande.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
                            <option value="en_cours" ${demande.statut === 'en_cours' ? 'selected' : ''}>En cours</option>
                            <option value="traite" ${demande.statut === 'traite' ? 'selected' : ''}>Traité</option>
                        </select>
                    </div>
                </div>
                <div class="demande-body">
                    <div class="demande-message">${escapeHtml(demande.message)}</div>
                    ${demande.reponse ? `
                        <div class="demande-reponse">
                            <div class="demande-reponse-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                Réponse envoyée
                            </div>
                            <div class="demande-reponse-text">${escapeHtml(demande.reponse)}</div>
                            ${demande.dateReponse ? `<div class="demande-reponse-date">Répondu le ${formatDate(demande.dateReponse)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
                ${!demande.reponse ? `
                    <div class="demande-actions">
                        <button class="btn btn-outline" onclick="toggleReponseForm('${demande.id}')">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            Répondre
                        </button>
                        <div class="reponse-form" id="reponse-form-${demande.id}" style="display: none;">
                            <textarea class="form-textarea" id="reponse-text-${demande.id}" placeholder="Écrivez votre réponse ici..." rows="4"></textarea>
                            <div class="reponse-buttons">
                                <button class="btn btn-primary" onclick="envoyerReponse('${demande.id}')">
                                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="22" y1="2" x2="11" y2="13"/>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                    Envoyer la réponse
                                </button>
                                <button class="btn btn-outline" onclick="toggleReponseForm('${demande.id}')">Annuler</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ==========================================
// MISE À JOUR DES STATISTIQUES
// ==========================================
function updateStats() {
    const total = demandes.length;
    const enAttente = demandes.filter(d => d.statut === 'en_attente').length;
    const enCours = demandes.filter(d => d.statut === 'en_cours').length;
    const traite = demandes.filter(d => d.statut === 'traite').length;
    
    const statTotal = document.getElementById('statTotal');
    const statEnAttente = document.getElementById('statEnAttente');
    const statEnCours = document.getElementById('statEnCours');
    const statTraite = document.getElementById('statTraite');
    
    if (statTotal) statTotal.textContent = total;
    if (statEnAttente) statEnAttente.textContent = enAttente;
    if (statEnCours) statEnCours.textContent = enCours;
    if (statTraite) statTraite.textContent = traite;
}

// ==========================================
// ACTIONS ADMIN
// ==========================================
function toggleReponseForm(id) {
    const form = document.getElementById(`reponse-form-${id}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

function updateStatut(id, newStatut) {
    const demande = demandes.find(d => d.id === id);
    if (demande) {
        demande.statut = newStatut;
        saveDemandes();
        renderDemandesListe();
        updateStats();
    }
}

function envoyerReponse(id) {
    const textarea = document.getElementById(`reponse-text-${id}`);
    const reponse = textarea ? textarea.value.trim() : '';
    
    if (!reponse) {
        showToast('Erreur', 'Veuillez saisir une réponse.', true);
        return;
    }
    
    const demande = demandes.find(d => d.id === id);
    if (demande) {
        demande.reponse = reponse;
        demande.dateReponse = new Date().toISOString();
        demande.statut = 'traite';
        saveDemandes();
        renderDemandesListe();
        renderAdminListe();
        updateStats();
        showToast('Réponse envoyée!', "L'étudiant a été notifié de votre réponse.");
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(title, description, isError = false) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastDescription = document.getElementById('toastDescription');
    const toastIcon = toast.querySelector('.toast-icon');
    
    toastTitle.textContent = title;
    toastDescription.textContent = description;
    
    if (isError) {
        toastIcon.style.color = '#ef4444';
    } else {
        toastIcon.style.color = '#22c55e';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
emailjs.init("TTbKlCwec5kBMR-VB");
emailjs.sendForm(
    "service_nvwmfqg",
    "template_4rfx8yw",
    this
)