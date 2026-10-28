# La mission oubliée — terminal d'entraînement (web)

Un terminal Linux **simulé**, qui tourne entièrement dans le navigateur. L'étudiant
rejoue la mission (naviguer, afficher les fichiers cachés, lire, corriger les droits)
et retrouve le drapeau, sans rien installer. Aucun serveur, aucun backend : c'est un
site statique, hébergeable gratuitement sur **GitHub Pages**.

## Contenu

```
web/
├── index.html        la page (énoncé + terminal)
├── style.css         le thème
├── app.js            le système de fichiers + l'interpréteur de commandes
├── terminal.js       l'interface terminal (xterm)
└── vendor/           xterm embarqué (xterm.js, xterm.css, addon-fit)
```

Tout est autonome : xterm est embarqué dans `vendor/`, il n'y a aucune dépendance à
charger depuis Internet à l'exécution.

## Publier sur GitHub Pages

1. Créer un dépôt GitHub (public), par exemple `mission-terminal`.
2. Y mettre le **contenu** de ce dossier `web/` (les fichiers à la racine du dépôt,
   pas le dossier `web` lui-même).
3. Dans le dépôt : **Settings → Pages**.
4. Sous « Build and deployment », choisir **Deploy from a branch**, brancher
   `main` et le dossier `/ (root)`, puis **Save**.
5. Au bout d'une minute, le site est en ligne à l'adresse indiquée, du type
   `https://VOTRE-COMPTE.github.io/mission-terminal/`.

En ligne de commande :

```
cd web
git init
git add .
git commit -m "Terminal d'entrainement - La mission oubliee"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/mission-terminal.git
git push -u origin main
```

Puis activer Pages dans Settings → Pages comme ci-dessus.

## Le drapeau

```
CSA{l1nux_c4che_ses_secr3ts}
```

Le drapeau est encodé (base64) dans `app.js` pour ne pas se lire d'un simple coup
d'œil dans la source. Ce n'est pas un vrai secret : un étudiant déterminé peut le
décoder. Pour l'entraînement c'est voulu ; la validation « sérieuse » (scoring,
anti-triche) se fait sur la plateforme HACKSHADOW.

## Comment on s'en sert

- L'étudiant ouvre l'URL, lit l'énoncé à gauche, et travaille dans le terminal à
  droite avec les commandes de l'atelier (`pwd`, `ls -a`, `ls -l`, `cd`, `cat`,
  `chmod`). `sudo` et `find` sont volontairement désactivés.
- Quand il obtient le drapeau, il le **copie et le soumet sur HACKSHADOW**
  (le lab « La mission oubliée », catégorie Fondamentaux).

Ce terminal web est donc l'environnement d'entraînement ; la plateforme reste
l'endroit où l'on valide et où l'on suit la progression.
