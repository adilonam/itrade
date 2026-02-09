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
- [x] position ouvert droit seller
- [?] switch from pro
- [x] free margion pour chque room
- [?] recherche room trading all market
- [x] symbol name
- [x] appel d marge seulement pour trading
- [x] add invest for seller
- [x] close check

## Bugs & Issues

### Profil
- [ ] Edit profil ne fonctionne pas pour changer le Nom et la Photo du profile
- [ ] Change Password depuis le profil
- [ ] Ajouter des infos : téléphone, date de naissance, adresse, code postale, ville
- [ ] Ajouter la possibilité de Link ou Unlink avec Google

### TRADING APP / DASHBOARD

#### Actualité
- [ ] Erreur 404, n'existe pas

#### Liens Utiles
- [ ] Erreur 404, n'existe pas

#### Account
- [x] Edit profil ne fonctionne pas pour changer le Nom et la Photo du profile
- [x] Change Password depuis le profil
- [x] Ajouter des infos : téléphone, date de naissance, adresse, code postale, ville
- [x] Ajouter la possibilité de Link ou Unlink avec Google

### TRADING APP / ROOM TRADING

#### Actualité
- [ ] Erreur 404, n'existe pas

### TRADING APP / ROOM STOCK

#### Actualité
- [ ] Erreur 404, n'existe pas

### TRADING APP / INVEST

#### Actualité
- [ ] Erreur 404, n'existe pas

### TRADING APP / ADMINISTRATION (SUPER ADMIN)

#### List Users (Admin)
- [ ] Quand Add New User et qu'on active le switch "Mark this user's email as verified", cela ne marque pas le statut comme verified
- [ ] Doit pouvoir Activer ou Désactiver n'importe quels comptes (Switch On/Off)

#### List Users (Seller)
- [ ] Quand on crée un Seller, il n'apparait pas dans la liste (seller)
- [ ] Doit pouvoir Attribuer des Users a des Sellers (actuellement faisable uniquement depuis Prisma BDD)

### TRADING APP / ADMINISTRATION (SELLER)

#### List Users (Seller)
- [ ] Search users & Search by email ne fonctionnent pas
- [ ] Doit pourvoir Edit ses propres Users a lui
- [ ] Doit pouvoir créer ses propres Users a lui
- [ ] Doit pouvoir activer pour chacun de ses Users si POSITIONS / STOCKS / INVEST -> visible ou pas visible
- [ ] Doit pouvoir Activer ou Désactiver un compte de ses propre Users a lui (Switch On/Off)

#### List Positions (Seller)
- [ ] Create Position : Filter by email ne fonctionne pas, seul Select user fonctionne
- [ ] Create Position : Filter by Symbol or Name ne fonctionne pas, seul Select a Market fonctionne

#### Messagerie (Seller)
- [ ] New Message : Search by email ne fonctionne pas, seul Select a linked user fonctionne
- [ ] Pouvoir ouvrir les messages dans des modals et qu'il se marque comme Read automatiquement
- [ ] Dans liste message, colonne Action, le BTN sert a marquer comme Read, il faudrait plutôt un BTN pour REPONDRE
- [ ] Le Seller doit recevoir une Notif quand il reçoit un nouveau message d'un User

#### Liste des Invest (Seller)
- [ ] Il faudrait créer la liste des Invest qui ont été fais par les Users du Seller en question
- [ ] Avec un BTN Create Invest et un formulaire pour créer un invest a un de ses Users

### Messagerie
- [ ] Pouvoir ouvrir les message dans des modals et qu'il se marque comme Read automatiquement
- [ ] Dans liste message Action, le btn sert a marquer comme Read il faudrait plutôt un btn Réponse
- [ ] Le User doit recevoir une notif quand il reçoit un nouveau message, et le seller/admin doit recevoir un notif quand il reçoit un message ou une réponse
- [ ] Seller/ Messagerie (Seller) New message : la barre de recherche ne fonctionne pas

##