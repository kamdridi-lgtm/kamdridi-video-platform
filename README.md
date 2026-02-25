# 🚀 KAMDRIDI AI VIDEO PLATFORM

## Ton propre système de génération vidéo AI - 100% Automatique

---

## 🎯 CE QUE C'EST

Une plateforme complète de génération vidéo AI comme Luma/Runway, mais **100% à toi**.

**Client paie → Vidéo générée automatiquement → Client reçoit → Tu gardes le profit 💰**

---

## 📦 CONTENU DU PACKAGE

```
kamdridi-video-platform/
├── server.js              # Backend Node.js complet
├── package.json           # Dependencies
├── .env.example           # Variables d'environnement
├── public/
│   ├── index.html         # Landing page (niveau Luma)
│   └── dashboard.html     # Dashboard client
└── README.md             # Ce fichier
```

---

## 💰 BUSINESS MODEL

**COÛTS :**
- Setup : **$0**
- Par vidéo : **$0.50-2** (Replicate API)

**PRIX DE VENTE :**
- Teaser Pack : **$300** (1 vidéo)
- Video Pack : **$1,500** (5 vidéos)
- Album Pack : **$5,000** (20 vidéos)

**PROFIT PAR VENTE :** $298 - $4,990 💰

---

## 🚀 DÉPLOIEMENT RAPIDE (30 MINUTES)

### ÉTAPE 1 : Clone ce repo

```bash
git clone https://github.com/ton-username/kamdridi-video-platform.git
cd kamdridi-video-platform
```

### ÉTAPE 2 : Crée compte Replicate

1. Va sur https://replicate.com
2. Sign up (gratuit)
3. Settings → API Tokens
4. Crée un token (commence par `r8_...`)
5. Ajoute **$10 de crédit** minimum

### ÉTAPE 3 : Configure Gmail

1. Va sur https://myaccount.google.com/apppasswords
2. Crée un App Password pour "Mail"
3. Copie le password (16 caractères)

### ÉTAPE 4 : Deploy sur Railway

1. Push ton code sur GitHub
2. Va sur https://railway.app
3. "New Project" → "Deploy from GitHub"
4. Sélectionne ton repo
5. Railway auto-détecte Node.js

### ÉTAPE 5 : Ajoute Variables d'Environnement

Dans Railway, Settings → Variables, ajoute :

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REPLICATE_API_TOKEN=r8_...
SMTP_USER=ton_email@gmail.com
SMTP_PASS=ton_app_password_16_chars
FRONTEND_URL=https://ton-site.netlify.app
PORT=3000
```

### ÉTAPE 6 : Configure Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint : `https://ton-backend.up.railway.app/webhook`
3. Events : `checkout.session.completed`
4. Copie le Signing Secret (`whsec_...`)
5. Ajoute-le dans Railway variables

### ÉTAPE 7 : Deploy Frontend

1. Va sur https://netlify.com
2. Drag & drop le dossier `public/`
3. Site published !
4. Copy l'URL

### ÉTAPE 8 : Update Frontend Config

Dans `public/index.html` et `public/dashboard.html`, change :

```javascript
const stripe = Stripe('pk_live_TON_STRIPE_KEY');
const BACKEND_URL = 'https://ton-backend.up.railway.app';
```

---

## 🎬 COMMENT ÇA MARCHE

### Workflow Complet

```
1. CLIENT visite ton site
   ↓
2. CLIENT choisit package et paie (Stripe)
   ↓
3. STRIPE envoie webhook → RAILWAY
   ↓
4. BACKEND crée order + email bienvenue
   ↓
5. CLIENT reçoit email avec lien dashboard
   ↓
6. CLIENT entre prompt + style
   ↓
7. BACKEND appelle REPLICATE API
   ↓
8. REPLICATE génère image (30 sec)
   ↓
9. REPLICATE génère vidéo from image (2-4 min)
   ↓
10. BACKEND sauve URL + email "Ready!"
    ↓
11. CLIENT télécharge MP4
    ↓
12. TU GARDES LE PROFIT 💰
```

### Temps Total

- Génération : **5 minutes max**
- Client reçoit email automatiquement
- Zéro effort de ta part !

---

## 📱 UTILISATION CLIENT

1. Client reçoit email bienvenue
2. Clique "Access Dashboard"
3. Voit ses crédits (1, 5, ou 20)
4. Entre son prompt :
   ```
   "abandoned warehouse at sunset, industrial decay, 
   dramatic lighting, cinematic atmosphere"
   ```
5. Choisit style : Industrial / Apocalyptic / etc.
6. Clique "Generate"
7. Attend 5 min
8. Reçoit email "Video Ready!"
9. Télécharge MP4

---

## 🎨 STYLES DISPONIBLES

Le système inclut 10 styles prédéfinis optimisés pour KAMDRIDI :

- **Industrial Decay** - Usines abandonnées, rouille, metal
- **Apocalyptic Wasteland** - Déserts, destruction, fin du monde
- **Volcanic Eruption** - Lave, feu, explosions
- **Storm Apocalypse** - Orages, éclairs, chaos
- **Urban Decay** - Villes abandonnées, graffiti
- **Forest Fire** - Forêts en feu, smoke
- **Underground Bunker** - Souterrains, béton, darkness
- **Molten Metal** - Metal en fusion, forge, sparks
- **Desert Wasteland** - Déserts, sable, solitude
- **Rust and Chains** - Chaînes, textures metal

Chaque style a des prompts optimisés pour l'aesthetic metal !

---

## 🔧 DÉVELOPPEMENT LOCAL

### Installation

```bash
npm install
```

### Configuration

Copie `.env.example` vers `.env` et remplis :

```bash
cp .env.example .env
nano .env
```

### Lancement

```bash
npm start
```

Backend tourne sur `http://localhost:3000`

### Test Webhook Localement

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks
stripe listen --forward-to localhost:3000/webhook
```

---

## 📊 ENDPOINTS API

### POST /api/create-checkout

Crée une Stripe Checkout Session

```javascript
{
  "packageType": "teaser" | "video" | "album",
  "email": "client@example.com",
  "customerName": "John Doe"
}
```

### POST /webhook

Reçoit Stripe webhooks (configuré automatiquement)

### POST /api/generate-video

Génère une vidéo

```javascript
{
  "orderId": "uuid",
  "prompt": "abandoned warehouse...",
  "style": "industrial_decay"
}
```

### GET /api/video-status/:videoId

Check status d'une vidéo

### GET /api/order/:orderId

Get order details + videos

---

## 💡 CUSTOMIZATION

### Ajouter un Nouveau Style

Dans `server.js`, modifie la fonction `generateVideoAsync` :

```javascript
const styles = {
  industrial_decay: "abandoned factory, rust, metal",
  custom_style: "your custom prompt additions",
};
```

### Changer les Prix

Dans `server.js`, modifie :

```javascript
const packages = {
  teaser: { price: 30000, credits: 1 },  // $300
  video: { price: 150000, credits: 5 },  // $1,500
  album: { price: 500000, credits: 20 }, // $5,000
};
```

### Personnaliser Emails

Dans `server.js`, modifie les fonctions :
- `sendWelcomeEmail(order)`
- `sendCompletionEmail(order, video)`

---

## 🚨 TROUBLESHOOTING

### Webhook ne marche pas

```
1. Check Railway logs
2. Vérif STRIPE_WEBHOOK_SECRET
3. Test avec Stripe CLI local
4. Assure-toi que l'URL est correcte
```

### Replicate erreur

```
1. Check que tu as du crédit
2. Vérif REPLICATE_API_TOKEN
3. Check Replicate dashboard usage
```

### Emails ne partent pas

```
1. Vérif Gmail App Password
2. Ou utilise SendGrid/Resend
```

### Vidéo ne génère pas

```
1. Check Railway logs
2. Vérif que Replicate a du crédit
3. Test le prompt manuellement sur Replicate
```

---

## 📈 SCALING

### Phase 1 (0-50 clients)

- Railway Hobby plan suffit
- Replicate pay-as-you-go
- Gmail SMTP OK

### Phase 2 (50-200 clients)

- Upgrade Railway Pro
- Consider base de données (PostgreSQL)
- Switch vers SendGrid pour emails
- Add file storage (S3/R2)

### Phase 3 (200+ clients)

- Add queue system (BullMQ)
- Multiple Railway services
- Admin dashboard
- Analytics

---

## 🌍 EXPANSION GLOBALE

Le code est prêt pour expansion internationale :

```javascript
// Ajoute dans server.js
const translations = {
  en: { /* English */ },
  fr: { /* Français */ },
  es: { /* Español */ },
  zh: { /* 中文 */ },
};
```

---

## 🔐 SÉCURITÉ

✅ Stripe gère paiements (PCI compliant)  
✅ HTTPS via Railway/Netlify  
✅ Webhook signature verification  
✅ Environment variables sécurisées  
✅ No API keys in frontend  

---

## 📚 RESSOURCES

- [Stripe Docs](https://stripe.com/docs)
- [Replicate Docs](https://replicate.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Netlify Docs](https://docs.netlify.com)

---

## 💰 PROJECTIONS

### Mois 1
- 5 clients
- Revenue : $1,500
- Costs : $10
- **Profit : $1,490**

### Mois 6
- 50 clients
- Revenue : $30,000
- Costs : $150
- **Profit : $29,850**

### Année 1
- Revenue : $200,000-500,000
- Costs : $2,000
- **Profit : $198,000-498,000**

---

## 🎯 TODO AVANT LANCEMENT

```
□ Compte Replicate créé + $10 crédit
□ Gmail App Password généré
□ Code pushed sur GitHub
□ Deployed sur Railway
□ Variables d'environnement ajoutées
□ Stripe webhook configuré
□ Frontend deployed sur Netlify
□ URLs updatées dans frontend
□ Test end-to-end complet
□ Généré 5 vidéos test pour portfolio
□ Post Instagram annonce
□ LANCÉ ! 🚀
```

---

## 🔥 SUPPORT

Questions ? Issues ? Improvements ?

- Check Railway logs d'abord
- Test localement avec Stripe CLI
- Vérif toutes les variables d'environnement

---

## 🎸 HEAVY. CINEMATIC. UNEARTHED. 💀

**Go conquer the world ! 🌍👑**
