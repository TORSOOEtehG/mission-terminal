/* Interface terminal (xterm) par-dessus MissionShell. */
(function () {
  "use strict";
  var S = window.MissionShell;
  var env = S.makeEnv();

  var GREEN = "\x1b[38;2;80;220;130m", CYAN = "\x1b[38;2;17;224;251m",
      ORANGE = "\x1b[38;2;250;108;13m", GREY = "\x1b[38;2;140;150;165m",
      RESET = "\x1b[0m", BOLD = "\x1b[1m";

  var term = new Terminal({
    fontFamily: "'JetBrains Mono','Consolas',monospace",
    fontSize: 14, cursorBlink: true, convertEol: false,
    theme: { background: "#0B111C", foreground: "#EAF1F8", cursor: "#FA6C0D",
             selectionBackground: "#24324a" }
  });
  var fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("term"));
  fit.fit();
  window.addEventListener("resize", function () { try { fit.fit(); } catch (e) {} });

  function nl(s) { return s.replace(/\n/g, "\r\n"); }
  function prompt() {
    return GREEN + "kali@hackshadow" + RESET + ":" + CYAN + S.promptPath(env) + RESET + "$ ";
  }

  var buf = "", hist = [], hpos = 0, announced = false;

  function banner() {
    term.writeln(ORANGE + BOLD + "  La mission oubliee " + RESET + GREY + "- atelier IRM 1, les bases de Linux" + RESET);
    term.writeln(GREY + "  Un dossier  mission  vous attend. Retrouvez le drapeau cache." + RESET);
    term.writeln(GREY + "  Commandes : pwd, ls (-a -l), cd, cat, chmod, clear, help. Pas de sudo." + RESET);
    term.writeln("");
  }

  function erase() { for (var i = 0; i < buf.length; i++) term.write("\b \b"); }

  function handle(line) {
    var r = S.runCommand(env, line);
    if (r.clear) { term.clear(); return; }
    if (r.out) term.write("\r\n" + nl(r.out));
    if (env.done && !announced) {
      announced = true;
      term.write("\r\n\r\n" + GREEN + BOLD + "  Bravo ! Copiez ce drapeau et soumettez-le sur HACKSHADOW." + RESET);
    }
  }

  function newline() { term.write("\r\n" + prompt()); }

  term.onData(function (data) {
    if (data === "\r") {                      // Entree
      var line = buf; buf = "";
      if (line.trim()) { hist.push(line); hpos = hist.length; }
      handle(line);
      newline();
    } else if (data === "\u007f") {           // Retour arriere
      if (buf.length) { buf = buf.slice(0, -1); term.write("\b \b"); }
    } else if (data === "\u0003") {           // Ctrl+C
      term.write("^C"); buf = ""; newline();
    } else if (data === "\u001b[A") {         // Fleche haut
      if (hist.length && hpos > 0) { hpos--; erase(); buf = hist[hpos]; term.write(buf); }
    } else if (data === "\u001b[B") {         // Fleche bas
      if (hpos < hist.length - 1) { hpos++; erase(); buf = hist[hpos]; term.write(buf); }
      else { hpos = hist.length; erase(); buf = ""; }
    } else if (data >= " " && data.charCodeAt(0) !== 127) {  // imprimable
      buf += data; term.write(data);
    }
  });

  banner();
  term.write(prompt());
  term.focus();

  // --- carte de validation (côté navigateur) ---
  var form = document.getElementById("vform"),
      input = document.getElementById("vinput"),
      msg = document.getElementById("vmsg"),
      card = document.getElementById("vcard");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (input.value || "").trim();
      if (!val) {
        msg.className = "vmsg ko";
        msg.textContent = "Entre d'abord un drapeau.";
        return;
      }
      if (val === S.FLAG) {
        card.classList.add("reussi");
        msg.className = "vmsg ok";
        msg.textContent = "Bravo ! Drapeau validé. Tu as terminé « La mission oubliée » : "
          + "navigation, fichiers cachés, lecture et gestion des droits, tout y est. "
          + "Pense à le soumettre aussi sur HACKSHADOW pour que ça compte.";
      } else {
        msg.className = "vmsg ko";
        msg.textContent = "Ce n'est pas le bon drapeau. Relis ce qu'affiche « cat .flag » "
          + "(format CSA{...}), en respectant les majuscules et minuscules.";
      }
    });
  }
})();
