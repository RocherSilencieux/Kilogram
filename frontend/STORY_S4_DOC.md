# 📜 Documentation Story S4 — Créer un post avec image

**Branche :** `post-create` (créée depuis `dev`)  
**Composant impacté :** `frontend/src/pages/PostsPages.tsx`  
**Backend :** Intact (aucun fichier backend modifié)

---

## 🎯 Rappel des Critères d'Acceptation & Solutions Implémentées

### 1. Contenu texte non vide et longueur maximale validée
* **Validation non vide :** Vérification avant envoi via `content.trim().length > 0`. Si le champ est vide, un message explicatif s'affiche.
* **Longueur maximale :** Définition d'une constante `MAX_CONTENT_LENGTH = 280` caractères.
* **Compteur dynamique :** Affichage d'un compteur en temps réel en haut du formulaire (`0 / 280`). Le compteur devient ambre à 80% puis rouge vif en cas de dépassement.
* **Blocage du bouton :** Le bouton **Publier** est désactivé si le texte est vide ou dépasse 280 caractères.

---

### 2. Image optionnelle avec prévisualisation avant envoi
* **Prévisualisation en temps réel :** Lors de la sélection d'un fichier image, une URL temporaire réactive est générée via `URL.createObjectURL(file)`.
* **Miniature (Thumbnail) :** Affichage d'une vignette propre dans le formulaire avec le poids de l'image (ex: `1.45 Mo`).
* **Bouton de suppression (Retirer l'image) :** Possibilité de supprimer l'image sélectionnée à tout moment avant l'envoi via un bouton ✕, ce qui réinitialise l'input sans impacter le texte saisi.
* **Gestion de mémoire :** Nettoyage automatique des URLs objet (`URL.revokeObjectURL`) à la désélection ou après envoi pour éviter les fuites de mémoire.

---

### 3. Taille et format contrôlés côté front
* **Formats autorisés :** Seules les images de type `image/jpeg`, `image/png`, `image/webp` et `image/gif` sont acceptées.
* **Taille maximale :** Validation stricte fixée à **5 Mo** (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
* **Gestion d'erreur d'upload :** Si l'utilisateur choisit un fichier non conforme (ex: PDF ou image de 10 Mo), la sélection est immédiatement rejetée et un bandeau d'erreur s'affiche sans déclencher de requête réseau.

---

### 4. État d'envoi visible & bouton non spammable
* **Désactivation globale pendant la soumission :** Lorsque `submitting === true`, le `textarea`, le sélecteur de fichier et le bouton d'envoi sont tous désactivés (`disabled`).
* **Indicateur visuel :** Le bouton affiche un icône de chargement animé `⏳` et le texte `"Publication en cours..."`.
* **Protection anti-double-clic :** Les clics répétés sont bloqués pendant que la requête `POST /posts` est en cours.

---

### 5. Feed à jour immédiatement sans rechargement de page
* **Mise à jour réactive du state :** Dès réception de la réponse HTTP 200 contenant le nouvel objet `Post` créé par l'API, il est injecté immédiatement au sommet du tableau `allPosts` et `displayedPosts`.
* **Tri garanti :** Les posts conservent un tri chronologique décroissant (le plus récent en premier) sans aucun rafraîchissement de page.

---

### 6. Erreurs API gérées & formulaire non perdu en cas d'échec
* **Bandeau d'erreur intégré :** En cas de problème réseau ou d'erreur API (ex: 500, jeton expiré), une alerte rouge explicative apparaît en haut du formulaire.
* **Conservation des saisies :** Le texte tapé et l'image prévisualisée **sont conservés** dans le formulaire en cas d'erreur. L'utilisateur peut ainsi corriger ou réessayer sans perdre son brouillon.

---

## 🎨 Cohérence Design

Le composant conserve l'esthétique générale de Kilogram :
* Utilisation des classes utilitaires **Tailwind CSS** (bords arrondis `rounded-2xl`, ombres douces `shadow-sm`, dégradés violet/indigo `bg-gradient-to-r from-purple-600 to-indigo-600`).
* Layout responsive s'adaptant parfaitement aux mobiles et aux écrans larges.
