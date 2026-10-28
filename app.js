/* ------------------------------------------------------------------
   La mission oubliée — terminal d'entraînement (IRM 1)
   Shell simulé 100% navigateur. Aucune exécution réelle, aucun serveur.
   Commandes : pwd, ls (-a -l), cd, cat, chmod, clear, help.
   ------------------------------------------------------------------ */
(function (root) {
  "use strict";

  // Le drapeau est encodé (base64) pour ne pas se lire d'un coup dans la source.
  var FLAG = atobSafe("Q1NBe2wxbnV4X2M0Y2hlX3Nlc19zZWNyM3RzfQ==");

  function atobSafe(s) {
    try { return (typeof atob === "function") ? atob(s) : Buffer.from(s, "base64").toString("utf8"); }
    catch (e) { return ""; }
  }

  // --- permissions : {r,w,x} par classe u/g/o -----------------------
  function P(spec) {
    // spec : "rwxr-xr-x" (9 car) OU numérique "755"
    var u, g, o;
    if (/^[0-7]{3}$/.test(spec)) {
      u = fromDigit(+spec[0]); g = fromDigit(+spec[1]); o = fromDigit(+spec[2]);
    } else {
      u = fromTriplet(spec.slice(0, 3)); g = fromTriplet(spec.slice(3, 6)); o = fromTriplet(spec.slice(6, 9));
    }
    return { u: u, g: g, o: o };
  }
  function fromDigit(d) { return { r: !!(d & 4), w: !!(d & 2), x: !!(d & 1) }; }
  function fromTriplet(t) { return { r: t[0] === "r", w: t[1] === "w", x: t[2] === "x" }; }
  function triplet(c) { return (c.r ? "r" : "-") + (c.w ? "w" : "-") + (c.x ? "x" : "-"); }
  function modeStr(node) {
    return (node.type === "dir" ? "d" : "-") + triplet(node.perms.u) + triplet(node.perms.g) + triplet(node.perms.o);
  }

  // --- arborescence -------------------------------------------------
  function dir(perms, children) { return { type: "dir", perms: P(perms), children: children || {} }; }
  function file(perms, content) { return { type: "file", perms: P(perms), content: content }; }

  var BRIEF =
    "=== BRIEF DE MISSION - Equipe Hackshadow ===\n\n" +
    "Un ancien analyste a laisse une mission inachevee dans ce dossier.\n" +
    "A toi de la terminer, avec les commandes de l'atelier. Pas de sudo ici.\n\n" +
    "Premiere etape : la reconnaissance. Entre dans le dossier  recon/";
  var TRACE =
    "Bien vu, tu sais afficher les fichiers caches.\n\n" +
    "Les resultats de scan sont dans  scans/ , mais ils sont proteges.\n" +
    "Va les voir, et surtout : regarde leurs DROITS avant de rouspeter.";
  var RESULTATS =
    "Tu as reussi a me lire : il a fallu t'ajouter le droit de lecture. Bravo.\n\n" +
    "Derniere etape : le RAPPORT final est dans  rapport/ . Il est verrouille.\n" +
    "Pour ENTRER dans un dossier, il ne suffit pas de le lire : il faut le droit x.";
  var FELI =
    "Mission accomplie. Tu as navigue, liste les fichiers caches, lu des contenus\n" +
    "et corrige des droits, exactement comme dans l'atelier.\n\n" +
    "Le drapeau est dans le fichier cache de ce dossier. Lis-le avec cat.";

  function buildFS() {
    return dir("755", {
      home: dir("755", {
        kali: dir("755", {
          mission: dir("755", {
            ".brief": file("644", BRIEF),
            recon: dir("755", {
              "cibles.txt": file("644", "# Cibles reperees\n192.168.1.10\n192.168.1.20\n"),
              ".trace": file("644", TRACE)
            }),
            scans: dir("755", {
              "notes.txt": file("644", "Rien d'exploitable ici. Le vrai resultat est a cote.\n"),
              "resultats.txt": file("000", RESULTATS)
            }),
            rapport: dir("000", {
              "felicitations.txt": file("644", FELI),
              ".flag": file("644", FLAG + "\n")
            })
          })
        })
      })
    });
  }

  function makeEnv() { return { fs: buildFS(), cwd: ["home", "kali"], home: ["home", "kali"], done: false }; }

  // --- résolution de chemins ---------------------------------------
  function nodeAt(fs, parts) {
    var n = fs;
    for (var i = 0; i < parts.length; i++) {
      if (!n || n.type !== "dir" || !n.children[parts[i]]) return null;
      n = n.children[parts[i]];
    }
    return n;
  }
  function resolve(env, arg) {
    var parts;
    if (!arg || arg === "~") return env.home.slice();
    if (arg[0] === "/") parts = arg.split("/").filter(Boolean);
    else if (arg[0] === "~") parts = env.home.concat(arg.slice(2).split("/").filter(Boolean));
    else parts = env.cwd.concat(arg.split("/").filter(Boolean));
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === ".") continue;
      if (parts[i] === "..") { out.pop(); continue; }
      out.push(parts[i]);
    }
    return out;
  }
  function baseName(parts) { return parts.length ? parts[parts.length - 1] : "/"; }
  function promptPath(env) {
    var h = env.home, c = env.cwd, i;
    for (i = 0; i < h.length; i++) { if (c[i] !== h[i]) break; }
    if (i === h.length) { var rest = c.slice(h.length); return "~" + (rest.length ? "/" + rest.join("/") : ""); }
    return "/" + c.join("/");
  }

  // --- commandes ----------------------------------------------------
  function cmd_pwd(env) { return "/" + env.cwd.join("/"); }

  function cmd_cd(env, args) {
    var target = args[0];
    if (!target || target === "~") { env.cwd = env.home.slice(); return ""; }
    var parts = resolve(env, target);
    var n = nodeAt(env.fs, parts);
    if (!n) return "cd: " + target + ": Aucun fichier ou dossier de ce type";
    if (n.type !== "dir") return "cd: " + target + ": N'est pas un dossier";
    if (!n.perms.u.x) return "cd: " + target + ": Permission non accordee";
    env.cwd = parts; return "";
  }

  function cmd_ls(env, args) {
    var showAll = false, longF = false, paths = [];
    args.forEach(function (a) {
      if (a[0] === "-" && a.length > 1) {
        a.slice(1).split("").forEach(function (f) { if (f === "a") showAll = true; else if (f === "l") longF = true; });
      } else paths.push(a);
    });
    var targetParts = paths.length ? resolve(env, paths[0]) : env.cwd.slice();
    var n = nodeAt(env.fs, targetParts);
    if (!n) return "ls: impossible d'acceder a '" + paths[0] + "': Aucun fichier ou dossier de ce type";
    if (n.type === "file") return longF ? (modeStr(n) + "  " + baseName(targetParts)) : baseName(targetParts);
    if (!n.perms.u.r) return "ls: impossible d'ouvrir le repertoire '" + (paths[0] || ".") + "': Permission non accordee";
    var names = Object.keys(n.children);
    if (showAll) names = [".", ".."].concat(names);
    names = names.filter(function (nm) { return showAll || nm[0] !== "."; }).sort();
    if (!longF) return names.join("  ");
    return names.map(function (nm) {
      if (nm === "." || nm === "..") return "drwxr-xr-x  " + nm;
      return modeStr(n.children[nm]) + "  " + nm;
    }).join("\n");
  }

  function cmd_cat(env, args) {
    if (!args.length) return "cat: operande manquant";
    var out = [];
    for (var i = 0; i < args.length; i++) {
      var parts = resolve(env, args[i]);
      var n = nodeAt(env.fs, parts);
      if (!n) { out.push("cat: " + args[i] + ": Aucun fichier ou dossier de ce type"); continue; }
      if (n.type === "dir") { out.push("cat: " + args[i] + ": Est un dossier"); continue; }
      if (!n.perms.u.r) { out.push("cat: " + args[i] + ": Permission non accordee"); continue; }
      out.push(n.content.replace(/\n$/, ""));
      if (n.content.indexOf(FLAG) !== -1) env.done = true;
    }
    return out.join("\n");
  }

  function applySym(perms, spec) {
    // ex : u+rx, u-w, +x, a+r, go-rwx
    var m = /^([ugoa]*)([+-])([rwx]+)$/.exec(spec);
    if (!m) return false;
    var who = m[1] || "a", op = m[2], bits = m[3].split("");
    var classes = who === "a" ? ["u", "g", "o"] : who.split("");
    classes.forEach(function (c) { bits.forEach(function (b) { perms[c][b] = (op === "+"); }); });
    return true;
  }
  function cmd_chmod(env, args) {
    if (args.length < 2) return "chmod: operande manquant";
    var mode = args[0], parts = resolve(env, args[1]);
    var n = nodeAt(env.fs, parts);
    if (!n) return "chmod: impossible d'acceder a '" + args[1] + "': Aucun fichier ou dossier de ce type";
    if (/^[0-7]{3}$/.test(mode)) { n.perms = P(mode); return ""; }
    if (applySym(n.perms, mode)) return "";
    return "chmod: mode invalide : '" + mode + "'";
  }

  var HELP =
    "Commandes disponibles :\n" +
    "  pwd              afficher le dossier courant\n" +
    "  ls [-a] [-l]     lister (afficher les caches avec -a, les droits avec -l)\n" +
    "  cd <dossier>     entrer dans un dossier ( cd .. pour remonter )\n" +
    "  cat <fichier>    afficher le contenu d'un fichier\n" +
    "  chmod <mode> <f> changer les droits ( ex : chmod u+r f , chmod u+rx dossier , chmod 755 f )\n" +
    "  clear            effacer l'ecran\n" +
    "  help             afficher cette aide\n\n" +
    "Objectif : retrouver le drapeau cache dans la mission. Pas de sudo.";

  function runCommand(env, line) {
    line = (line || "").trim();
    if (!line) return { out: "" };
    var toks = line.split(/\s+/), c = toks[0], args = toks.slice(1);
    switch (c) {
      case "pwd": return { out: cmd_pwd(env) };
      case "ls": return { out: cmd_ls(env, args) };
      case "cd": return { out: cmd_cd(env, args) };
      case "cat": return { out: cmd_cat(env, args) };
      case "chmod": return { out: cmd_chmod(env, args) };
      case "help": case "--help": return { out: HELP };
      case "clear": return { out: "", clear: true };
      case "sudo": return { out: "sudo : desactive pour cet exercice. Reste utilisateur normal." };
      case "find": return { out: "find : non disponible ici. Utilise les commandes de l'atelier (ls, cd, cat, chmod)." };
      default: return { out: c + " : commande introuvable. Tape  help  pour la liste." };
    }
  }

  var API = { makeEnv: makeEnv, runCommand: runCommand, promptPath: promptPath, FLAG: FLAG };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.MissionShell = API;
})(typeof window !== "undefined" ? window : globalThis);
