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
- [x] Edit profil ne fonctionne pas pour changer le Nom et la Photo du profile
- [x] Change Password depuis le profil
- [x] Ajouter des infos : téléphone, date de naissance, adresse, code postale, ville
- [x] Ajouter la possibilité de Link ou Unlink avec Google

### TRADING APP / DASHBOARD

#### Actualité
- [x] Erreur 404, n'existe pas

#### Liens Utiles
- [x] Erreur 404, n'existe pas

#### Account
- [x] Edit profil ne fonctionne pas pour changer le Nom et la Photo du profile
- [x] Change Password depuis le profil
- [x] Ajouter des infos : téléphone, date de naissance, adresse, code postale, ville
- [x] Ajouter la possibilité de Link ou Unlink avec Google

### TRADING APP / ROOM TRADING

#### Actualité
- [x] Erreur 404, n'existe pas

### TRADING APP / ROOM STOCK

#### Actualité
- [x] Erreur 404, n'existe pas

### TRADING APP / INVEST

#### Actualité
- [x] Erreur 404, n'existe pas

### TRADING APP / ADMINISTRATION (SUPER ADMIN)

#### List Users (Admin)
- [x] Quand Add New User et qu'on active le switch "Mark this user's email as verified", cela ne marque pas le statut comme verified -> on doit etre admin
- [x] Doit pouvoir Activer ou Désactiver n'importe quels comptes (Switch On/Off) -> on fait ca par changement du mot de passe 

#### List Users (Seller)
- [x] Quand on crée un Seller, il n'apparait pas dans la liste (seller)-> cette partie est pour les utilisteurs du seller le seller est celui qui s occupe des utilisateurs 
- [x] Doit pouvoir Attribuer des Users a des Sellers (actuellement faisable uniquement depuis Prisma BDD)-> sur list user (admin) editer un user seller et vous pouvez l attribuer des users 

### TRADING APP / ADMINISTRATION (SELLER)

#### List Users (Seller)
- [x] Search users & Search by email ne fonctionnent pas
- [x] Doit pourvoir Edit ses propres Users a lui-> deja traite avec Julien c admin qui pe seulement modifier les users
- [x] Doit pouvoir créer ses propres Users a lui-> admin qui pe faire ca
- [x] Doit pouvoir activer pour chacun de ses Users si POSITIONS / STOCKS / INVEST -> visible ou pas visible-> c seulement admin
- [x] Doit pouvoir Activer ou Désactiver un compte de ses propre Users a lui (Switch On/Off)-> c seulement admin

#### List Positions (Seller)
- [x] Create Position : Filter by email ne fonctionne pas, seul Select user fonctionne-> fixed
- [x] Create Position : Filter by Symbol or Name ne fonctionne pas, seul Select a Market fonctionne-> fixed

#### Messagerie (Seller)
- [x] New Message : Search by email ne fonctionne pas, seul Select a linked user fonctionne-> fixed
- [x] Pouvoir ouvrir les messages dans des modals et qu'il se marque comme Read automatiquement
- [x] Dans liste message, colonne Action, le BTN sert a marquer comme Read, il faudrait plutôt un BTN pour REPONDRE-> mnt genere par le model
- [x] Le Seller doit recevoir une Notif quand il reçoit un nouveau message d'un User-> dans dashboard   

#### Liste des Invest (Seller)
- [x] Il faudrait créer la liste des Invest qui ont été fais par les Users du Seller en question-> done
- [x] Avec un BTN Create Invest et un formulaire pour créer un invest a un de ses Users

### Messagerie
- [x] Pouvoir ouvrir les message dans des modals et qu'il se marque comme Read automatiquement
- [x] Dans liste message Action, le btn sert a marquer comme Read il faudrait plutôt un btn Réponse
- [x] Le User doit recevoir une notif quand il reçoit un nouveau message, et le seller/admin doit recevoir un notif quand il reçoit un message ou une réponse-> dand dashboard
- [x] Seller/ Messagerie (Seller) New message : la barre de recherche ne fonctionne pas-> c gerer avec le modal

##



- [no] switch to resend
- [?] admin change leverage and market 
- [x] instituianal for user 
- [x] pay gateway : btc , usdc , usdt
- [?] make two ways for deposit
- [?] challenges : props basic page 
- [x] trading view chart 
- [x] dashboard as match trader 
- [?] change format of plans to feet document 
- [x] account part , respect the format but with match trader color
- [x] kyc part of user 
- [x] make possilbe as i can similar to match trader 
- [x] make this expand btn like match trader 




- [x] dashboard to make balances clickable and then stats for this current bl
- [x] make navbar bigger
- [x] on header show the three blances 




##word doc

- [?] 1. Transfer  
You can transfer funds from a real account to institutional accounts or plans through an internal transfer.

- [?] 2. Closing Price & Time  
Add the closing price and closing time when an operation is completed.

- [x] 3. Client Details  
Add a “Client Details” option. For example, if I have 3 clients, only the 3 clients should appear (not their individual trades). When I click on a client, I should enter their profile and see all their operations.  
Currently, everything is mixed together—I would prefer a more organized structure.

- [x] 4. Closed Trades History  
Add a history of closed operations. Currently, only open trades are visible.  
Also, remove the internal transfer section here, as transfers are handled in another section (deposits, etc.).  
This section should only handle internal transfers from real accounts to institutional accounts or plans.

- [x] 5. Plans Section  
Remove the “country” field from plans.

- [x] 6. Transactions View  
Modify the transactions section. Currently, all types of movements are shown.  
I would like users to see only deposits, withdrawals, and internal transfers.

- [x] 7. User Details – Account Deposit  
In “User Details,” under account balance, add a section for manual deposits labeled ACCOUNT DEPOSIT.  
When an amount is entered, it should appear in the history as a deposit.

This is for cases where clients deposit directly into my personal wallet without using the platform.  
It should function like a normal deposit:

It appears in transactions as a deposit  
It updates the account balance

Example:  
A client makes a manual deposit of $1,000. I confirm it in this section and enter 1000 under account deposit.  
This amount should reflect in:

Account balance  
Account deposit  
Transactions (as a deposit)

- [x] 8. Investment Transactions  
In the investment section, modify transactions so that users only see the profit generated by the plan, not all transaction details.

- [ ] 9. Language Option  
Add language selection (English / Spanish).

- [x] 10. Account Type Selection  
Make account types selectable like in Match Trader:

Trade  
Institutional  
Investment  
Demo

- [x] 11. Account Overview UI  
Update the colors and typography to match the platform’s design style.

- [x] 12. Separate Dashboards  
When clicking:

“Real” → show real account dashboard  
“Institutional” → show institutional data  
“Demo” → show demo data  
Each should be displayed separately.

- [x] 13. Deposit – Manual Wallet Option  
Add a manual wallet option in deposits.  
As a super admin, I should be able to:

Upload a QR code  
Provide a wallet address (copy/paste)  
This should be visible in the deposit section.

- [x] 14. Transfer Functionality  
Allow users to choose the source and destination accounts when transferring funds.  
Example: from Trade → Institutional or Investment.



- [?] transfer migrate to trasnfer user management
- [x] add tp and sl for new position
- [x] remove the contry form plans
- [?] add more one wallet for usdt and usdc and btc 
- [x] resolve kyc upload






- [?] Now the open trades are visible in live… I would like to add a tab for closed trades, where all closed trades can be viewed.

- [x] Add closed trades. Include the “date closed,” which was previously active, so we can display the date and time when the trade was closed.

- [?] This section… apply new number formatting and new colors.

- [x] And basically... add the weekly and monthly return options that currently only have the annual one





- [x] logo
- [x] institutional closed postion
- [x] fianace make as match trader 
- [x] upload files



### extra
- [ ] close on date schedule a close to
- [ ] spanish langaue
- [ ] demo account 
- [ ] props challenge



## monthly cost 

- vercel or aws app == 20 usd per month
- database --- 10 usd per month
- google auth --- 2 usd per month
- twleve data api -- 99 usd per month
- alphavantage --- 15 uds per month
- smtp server ---- 10 usd per month
- file storage --- 10 usd month
- my cost ---- 



bugs :
- [ ] dashboard institutional on close pos
- [ ] pos decrease balance on intitional 



















## meet of 04 18
- [x] change equity to balance display
- [x] institunal dashboard
- [x] remove google
- [x] send link to sign up 
- [x] fix kyc requrests
- [x] number 3 in whatdsapp