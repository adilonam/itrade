- [x] search for lot size
- [x] close position when negative bal

## new for 18 oct

- [x] check schedule api src/app/api/schedule inverstment
- [x] responsive on phone
- [x] graph on portfolio stock
- [x] remove unused btn
- [x] manage postion on admin on change pnl ( transaction desc equilibre admin -8 , balance -8)
- [x] market check for twelve data
- [x] sell specific amount (stock)
- [x] help to invest or trade for amount usd

## urgent

- [?] pos stock trading fixed after comma for float (BTC) mekaoui
- [x] availabel bal on investement -> free margin mekaoui
- [x] remove auto reinvest mekaoui

- [x] add room field and other field to position admin and filter pos admin with all critere mekaoui
- [?] show investors users for investement mekaoui
- [?] keep profile btn1, add deposit and withdraw process btn2, transaction btn3 adil

## meet

- [x] update balance to free margin on pos stock --free margin adil
- [x] show all symbol of twevle data mekaoui done
- [x] add logo for market base64 mekaoui
- [x] change logo live data en gris - socket adil
- [x] organisation portefeuil adil
- [x] bars of charts

## bud

- [x] achat stock position
- [x] change name of postion stock pour portfolio
- [x] fix design pos trading : mobile mekaoui
- [x] design desktop : mekaoui
- [x] value of positions just tradfing , add requiredmargin with label value on datatable psotion : mekaoui
- [ ] icoon switch lot et amount : adil
- [x] logic seller : adil
- [x] depot / withdraw virtuell : mekaoui
- [x] dashboard
- [ ] position ouvert droit seller
- [?] switch from pro
- [x] free margion pour chque room
- [?] recherche room trading all market
- [x] symbol name
- [x] appel d marge seulement pour trading
- [ ] add invest for seller
- [x] close check

# 📌 TRADING APP – 05/11/2025

- [ ] Breadcrumb : changer tous les noms
- [x] Barre de Recherche : améliorer, ne fait pas de recherche
- [ ] Menu Gauche :
  - [x] Quand menu fermé : problème affichage logo app + logo account + accès sous-menu
  - [x] Vérifier utilité du bouton "Login" dans le menu
  - [x] Différencier les icônes pour : Rooms / My Position / My Portfolio
- [ ] Position Room Trading :
  - [?] Améliorer affichage tableau mobile (afficher infos essentielles)
- [ ] Positions Room Stock :
  - [ ] Corriger affichage mobile (comme Position Room Trading)
- [ ] Création Invest : permettre upload fichier ORDI + URL (pas seulement URL)
- [ ] En mobile : menu doit se fermer automatiquement quand on clique sur un champ
- [ ] Ajouter des boutons retour partout (navigation mobile)
- [x] Séparer marges et comptes de trading avec portefeuille & invest
- [ ] Robot trading configurable (copy trading avec % de capital)
- [ ] Quand modification du PL en Admin : afficher LIVE (pas seulement sur close)
- [ ] Gestion des marges + alertes marge sur positions (scheduler nécessaire)
- [ ] Historique de toutes les transactions (deposit, withdraw, etc.)

---

# 🛠️ A AJUSTER POUR SUPERADMIN

- [x] Installation rapide
- [ ] Sauvegarde rapide BDD (automatique ?)
- [ ] Sauvegarde rapide fichiers (automatique ?)
- [ ] Liste des API à acheter
- [ ] Documentation : installation & déploiement complet + erreurs fréquentes
- [ ] Modification Design / Logo / Infos Société
- [ ] Mode Debug rapide (symfony = `app_dev`)
- [x] Configuration rapide email (2FA)
- [ ] Recherche symbol stock via TwelveData (superadmin only)  
       OU extraction liste complète interne (admin ne voit pas TwelveData)
- [ ] Toggle activation/désactivation compte admin/seller/client  
       (par défaut désactiver nouveaux comptes Google/inscription)
- [ ] Export/Import CSV : produits (invest)
- [ ] Export/Import CSV : stocks & logos
- [ ] Export/Import CSV : design (logo, couleurs, infos société)

---

# 🧑‍💼 A AJUSTER POUR ADMIN / SELLER

- [ ] Créer une Fiche Client (depuis liste user) regroupant :
  - [ ] Infos User
  - [ ] Markets
  - [ ] Invest
  - [ ] Positions
  - [ ] Actions rapides : ouvrir position, investir, market
- [ ] Système de notification :
  - [ ] Log journal
  - [ ] Création de rappels (RDV, mail, documents…)
  - [ ] Notifs : qui a fait quoi / quand / où
  - [ ] Liste derniers clients connectés + IP + appareil
- [ ] Toggle activer/désactiver client / seller (si admin)
- [ ] Pour admin : graphiques + analyses des sellers
- [ ] Simplifier edit position : user id / market id trop complexe
- [ ] Recherche dans liste positions : valider avec "Entrée"
- [ ] Ajouter filtres + recherches dans Market
- [ ] Ajouter filtres + recherches dans Invest
- [ ] Ajouter images / backgrounds pour habiller le site (Vuexy style)
- [ ] Messagerie intégrée (fichiers joints : pdf, png, jpg…)
- [ ] (Admin) Actualités + catégories + visibilité clients
- [ ] (Admin) Liens utiles + affichage infos société
- [ ] (Admin) Changement disposition du menu
- [ ] (Admin) Mentions légales / CGV / CGU : editor + toggle affichage footer
- [ ] Dashboard : widgets modulables (afficher / cacher)
- [ ] Toggle affichage catégories par client : trade / stock / invest

---

# 🔄 AUTRES

- [ ] Ajouter système Prospect :
  - [ ] Ajout prospect en masse
  - [ ] Gestion des statuts
  - [ ] CRM
  - [ ] Calendrier
  - [ ] Conversion Prospect -> Client
