# 🚀 Documentation API REST - Kilogram (Guide Frontend)

**URL de base de l'API :** `http://localhost:3000`  
**Format de données :** `JSON` (sauf pour la création de post avec image qui utilise `formData`)  

---

## 🔑 Authentification & Headers

Pour toutes les requêtes nécessitant d'être connecté (marquées 🔒 ci-dessous), vous devez inclure le jeton JWT reçu lors du `login` ou `register` dans le header HTTP :

```http
Authorization: Bearer <VOTRE_TOKEN_JWT>
Content-Type: application/json
```

---

## 📌 Sommaire Rapide des Endpoints

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | 🌐 Public | Créer un compte utilisateur |
| `POST` | `/auth/login` | 🌐 Public | Se connecter et obtenir un token JWT |
| `GET` | `/posts` | 🌐 Public | Récupérer le fil d'actualité (tous les posts) |
| `POST` | `/posts` | 🔒 Requis | Créer un nouveau post (texte + image optionnelle) |
| `GET` | `/posts/:id` | 🌐 Public | Récupérer un post avec ses commentaires |
| `DELETE` | `/posts/:id` | 🔒 Requis | Supprimer un post |
| `POST` | `/posts/:id/comments` | 🔒 Requis | Ajouter un commentaire sous un post |
| `DELETE` | `/comments/:id` | 🔒 Requis | Supprimer un commentaire |
| `POST` | `/posts/:id/like` | 🔒 Requis | Liker un post |
| `DELETE` | `/posts/:id/like` | 🔒 Requis | Retirer un like d'un post |
| `GET` | `/users/:id` | 🌐 Public | Récupérer les informations d'un profil |
| `GET` | `/users/:id/posts` | 🌐 Public | Récupérer les posts créés par un utilisateur |

---

## 🛠️ Détail des Endpoints

---

### 1. Authentification (`/auth`)

#### 🔹 Inscription (`POST /auth/register`)
Créer un compte utilisateur.

* **Body (`application/json`) :**
  ```json
  {
    "email": "user@example.com",
    "username": "superdev",
    "password": "password123"
  }
  ```
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "cuid_12345",
      "email": "user@example.com",
      "username": "superdev"
    }
  }
  ```

---

#### 🔹 Connexion (`POST /auth/login`)
Se connecter avec ses identifiants.

* **Body (`application/json`) :**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "cuid_12345",
      "email": "user@example.com",
      "username": "superdev"
    }
  }
  ```

---

### 2. Posts (`/posts`)

#### 🔹 Récupérer le Feed (`GET /posts`)
Renvoie tous les posts triés du plus récent au plus ancien.

* **Réponse Succès (`200 OK`) :**
  ```json
  [
    {
      "id": "post_123",
      "content": "Mon premier post sur Kilogram !",
      "imageUrl": "/uploads/1700000000-photo.jpg",
      "created_at": "2026-09-08T10:00:00.000Z",
      "author": {
        "id": "user_456",
        "username": "alice"
      },
      "likeCount": 12,
      "commentCount": 3
    }
  ]
  ```
  *(Note: Pour afficher les images, concaténez l'URL de base : `http://localhost:3000` + `imageUrl`)*

---

#### 🔹 Créer un Post (`POST /posts`) 🔒
Créer une publication. Supporte l'envoi d'une image.

* **Header :** `Authorization: Bearer <token>`
* **Body :** `multipart/form-data`
  * `content` (string, requis)
  * `image` (fichier image, optionnel)
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "id": "post_789",
    "content": "Super journée !",
    "imageUrl": "/uploads/1700000000-photo.jpg",
    "authorId": "user_123",
    "createdAt": "2026-09-08T10:05:00.000Z"
  }
  ```

---

#### 🔹 Obtenir un Post spécifique (`GET /posts/:id`)
Récupère le détail d'un post avec tous ses commentaires et son nombre de likes.

* **Params :** `id` (ex: `GET /posts/post_123`)
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "id": "post_123",
    "content": "Mon premier post",
    "imageUrl": null,
    "createdAt": "2026-09-08T10:00:00.000Z",
    "author": {
      "id": "user_456",
      "username": "alice"
    },
    "likeCount": 5,
    "comments": [
      {
        "id": "comment_01",
        "content": "Trop cool !",
        "createdAt": "2026-09-08T10:02:00.000Z",
        "author": {
          "id": "user_789",
          "username": "bob"
        }
      }
    ]
  }
  ```

---

#### 🔹 Supprimer un Post (`DELETE /posts/:id`) 🔒
Supprime un post existant.

* **Header :** `Authorization: Bearer <token>`
* **Params :** `id` (ID du post)
* **Réponse Succès (`200 OK`) :**
  ```json
  { "success": true }
  ```

---

### 3. Commentaires (`/comments`)

#### 🔹 Ajouter un commentaire (`POST /posts/:id/comments`) 🔒

* **Header :** `Authorization: Bearer <token>`
* **Params :** `id` (ID du post)
* **Body (`application/json`) :**
  ```json
  {
    "content": "Génial comme publication !"
  }
  ```
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "id": "comment_999",
    "content": "Génial comme publication !",
    "postId": "post_123",
    "authorId": "user_456",
    "createdAt": "2026-09-08T10:10:00.000Z",
    "author": {
      "id": "user_456",
      "username": "superdev"
    }
  }
  ```

---

#### 🔹 Supprimer un commentaire (`DELETE /comments/:id`) 🔒

* **Header :** `Authorization: Bearer <token>`
* **Params :** `id` (ID du commentaire)
* **Réponse Succès (`200 OK`) :**
  ```json
  { "success": true }
  ```

---

### 4. Likes (`/like`)

#### 🔹 Liker un post (`POST /posts/:id/like`) 🔒

* **Header :** `Authorization: Bearer <token>`
* **Params :** `id` (ID du post)
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "id": "like_111",
    "postId": "post_123",
    "userId": "user_456"
  }
  ```

---

#### 🔹 Retirer son like (`DELETE /posts/:id/like`) 🔒

* **Header :** `Authorization: Bearer <token>`
* **Params :** `id` (ID du post)
* **Réponse Succès (`200 OK`) :**
  ```json
  { "success": true }
  ```

---

### 5. Profils Utilisateurs (`/users`)

#### 🔹 Obtenir un Profil (`GET /users/:id`)

* **Params :** `id` (ID de l'utilisateur)
* **Réponse Succès (`200 OK`) :**
  ```json
  {
    "id": "user_456",
    "email": "alice@example.com",
    "username": "alice",
    "role": "USER",
    "createdAt": "2026-09-01T08:00:00.000Z"
  }
  ```

---

#### 🔹 Obtenir les posts d'un utilisateur (`GET /users/:id/posts`)

* **Params :** `id` (ID de l'utilisateur)
* **Réponse Succès (`200 OK`) :**
  ```json
  [
    {
      "id": "post_123",
      "content": "Mon premier post",
      "imageUrl": null,
      "authorId": "user_456",
      "createdAt": "2026-09-08T10:00:00.000Z"
    }
  ]
  ```

---

## 💡 Snippets JS (`fetch`) pour le Frontend

### 1. Se connecter et sauvegarder le Token
```javascript
async function login(email, password) {
  const res = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    console.log("Connecté !", data.user);
  }
}
```

---

### 2. Créer un Post avec Image (`FormData`)
```javascript
async function createPost(textContent, imageFile) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("content", textContent);
  if (imageFile) {
    formData.append("image", imageFile); // Fichier issu d'un <input type="file">
  }

  const res = await fetch("http://localhost:3000/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
      // Note: Ne pas mettre Content-Type pour le FormData, le navigateur le gère automatiquement
    },
    body: formData
  });

  return await res.json();
}
```

---

### 3. Liker / Disliker un Post
```javascript
async function toggleLike(postId, isLiked) {
  const token = localStorage.getItem("token");
  const method = isLiked ? "DELETE" : "POST";

  const res = await fetch(`http://localhost:3000/posts/${postId}/like`, {
    method: method,
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  return await res.json();
}
```
