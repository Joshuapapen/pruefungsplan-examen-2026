"use strict";
/* Fakt oder Lüge: Joshua gegen Luna. Alles läuft lokal im Browser, nichts wird gesendet. */

const CATS = {
  mix:    { name: "Alles gemischt", desc: "Fragen aus allen Themen", color: "mix" },
  wissen: { name: "Wissen & Natur", desc: "Tiere, Weltall, Körper, Chemie", color: "wissen" },
  geo:    { name: "Geografie & Reisen", desc: "Länder, Städte, Berge, Meere", color: "geo" },
  his:    { name: "Geschichte & Politik", desc: "Ereignisse, Daten, Deutschland", color: "his" },
  allg:   { name: "Kultur, Sport & Technik", desc: "Kunst, Musik, Sport, Mathe, IT", color: "allg" },
  paar:   { name: "Pärchen-Duell", desc: "Ihr stellt euch gegenseitig Aussagen über euch selbst", color: "paar" }
};

const IMPULSES = [
  "Etwas aus deiner Kindheit.", "Ein Ort, an dem du schon einmal warst.", "Etwas, das du noch nie gegessen hast.",
  "Ein Talent, das kaum jemand kennt.", "Etwas, das dir peinlich war.", "Dein erster Gedanke heute Morgen.",
  "Ein Tier, vor dem du dich fürchtest oder das du magst.", "Etwas, das du als Kind werden wolltest.",
  "Ein Lied, das du immer wieder hörst.", "Etwas aus deiner Schulzeit.", "Ein Film, den du mehrfach gesehen hast.",
  "Etwas, das du nie wieder machen würdest.", "Ein Gegenstand, ohne den du nicht aus dem Haus gehst.",
  "Etwas aus eurem ersten gemeinsamen Treffen.", "Ein Traum, den du dir noch erfüllen willst.",
  "Etwas, das du gut kannst, aber ungern machst.", "Dein Lieblingsessen oder dein Hassessen.",
  "Etwas, das du schon einmal verloren hast.", "Ein Urlaub, an den du dich gern erinnerst.",
  "Etwas, das du heimlich tust.", "Ein Fehler, aus dem du gelernt hast.", "Etwas, das dich zum Lachen bringt.",
  "Eine Sportart, die du probiert hast.", "Ein Beruf, den du dir vorstellen könntest.",
  "Etwas, das du mit Luna oder Joshua zum ersten Mal erlebt hast.", "Eine Angewohnheit, die andere nervt.",
  "Etwas, das du im Leben noch nie gemacht hast.", "Ein Wunsch für die nächsten fünf Jahre."
];

const STATS_KEY = "fakt-oder-luege-statistik-v1";
const SEEN_KEY = "fakt-oder-luege-gesehen-v2";
const NAMES_KEY = "fakt-oder-luege-namen-v1";
const SETUP_KEY = "fakt-oder-luege-einstellung-v1";

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

const app = document.getElementById("app");
const setup = store.get(SETUP_KEY, { cat: "mix", rounds: 10 });
const S = {
  names: store.get(NAMES_KEY, ["Joshua", "Luna"]),
  cat: CATS[setup.cat] ? setup.cat : "mix", rounds: [5, 10, 15].includes(setup.rounds) ? setup.rounds : 10,
  scores: [0, 0], streak: [0, 0], correct: [0, 0], round: 0, deck: [], cur: null, picks: [null, null],
  first: 0, setter: 0, log: [], impulse: ""
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nm = i => esc(S.names[i]);
const label = v => v ? "Fakt" : "Lüge";
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const $ = id => document.getElementById(id);
const col = c => `style="--c: var(--c-${CATS[c].color})"`;

/* ---------- Fragenauswahl: Neues zuerst, Gesehenes erst wieder, wenn zu wenig Neues übrig ist ---------- */
const pool = cat => QUESTIONS.filter(q => cat === "mix" || q[0] === cat);
const seenSet = () => new Set(store.get(SEEN_KEY, []));
function buildDeck() {
  let seen = seenSet(), all = pool(S.cat), fresh = all.filter(q => !seen.has(q[1]));
  if (fresh.length < S.rounds) {
    all.forEach(q => seen.delete(q[1])); store.set(SEEN_KEY, [...seen]);
    fresh = all;
  }
  return shuffle(fresh);
}
const markSeen = t => { const s = seenSet(); s.add(t); store.set(SEEN_KEY, [...s]); };
const unseenCount = cat => { const s = seenSet(); return pool(cat).filter(q => !s.has(q[1])).length; };

/* ---------- Gesamtstatistik ---------- */
const stats = () => store.get(STATS_KEY, { w: [0, 0], d: 0, games: 0 });
function recordGame() {
  const st = stats(), [a, b] = S.scores;
  if (a > b) st.w[0]++; else if (b > a) st.w[1]++; else st.d++;
  st.games++; store.set(STATS_KEY, st);
}

/* ---------- Bausteine ---------- */
function scoreBar(active) {
  return `<div class="score">${[0, 1].map(i => `<div class="${active === i ? "on" : ""}"><span>${nm(i)}${S.streak[i] >= 2 ? `<small>Serie ${S.streak[i]}</small>` : ""}</span><b>${S.scores[i]}</b></div>`).join("")}</div>`;
}
const progress = () => `<div class="progress"><i style="width:${Math.min(100, S.round / S.rounds * 100)}%"></i></div>`;
function topbar(text, c) {
  return `<div class="topbar"><span class="label tag" ${c ? col(c) : ""}>${text}</span><button class="link" id="quit">Beenden</button></div>`;
}
function bindQuit() {
  const b = $("quit"); if (!b) return;
  b.onclick = () => {
    if (b.dataset.sure) { home(); return; }
    b.dataset.sure = "1"; b.textContent = "Wirklich beenden?";
    setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = "Beenden"; } }, 3000);
  };
}
const lockIcon = `<span class="lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>`;
function passScreen(toIdx, next) {
  app.innerHTML = `<div class="card pass">${lockIcon}<h2>Gerät an <span>${nm(toIdx)}</span></h2><p class="muted">Die Wahl ist versteckt.</p><button class="b-main" id="go">Ich bin ${nm(toIdx)}, weiter</button></div>`;
  $("go").onclick = next;
  window.scrollTo(0, 0);
}
function award(i, correct) {
  if (correct) {
    S.correct[i]++; S.streak[i]++; S.scores[i]++;
    if (S.streak[i] % 3 === 0) { S.scores[i]++; return true; }
  } else S.streak[i] = 0;
  return false;
}

/* ---------- Start ---------- */
function home() {
  S.scores = [0, 0]; S.streak = [0, 0]; S.correct = [0, 0]; S.round = 0; S.log = [];
  const st = stats();
  const cats = Object.keys(CATS).map(k => {
    const c = CATS[k];
    const sub = k === "paar" ? c.desc : `${c.desc}<br>${unseenCount(k)} von ${pool(k).length} neu`;
    return `<button class="cat ${k === "paar" || k === "mix" ? "wide" : ""}" ${col(k)} data-cat="${k}" aria-pressed="${S.cat === k}"><i></i><strong>${c.name}</strong><small>${sub}</small></button>`;
  }).join("");
  app.innerHTML = `
    <div class="hero">
      <div class="vs"><b>${nm(0)}</b> gegen <b>${nm(1)}</b></div>
      <h1>Fakt oder Lüge</h1>
    </div>
    <div class="record" aria-label="Gesamtstand">
      <div><b>${st.w[0]}</b><span>${nm(0)}</span></div>
      <div><b>${st.d}</b><span>Remis</span></div>
      <div><b>${st.w[1]}</b><span>${nm(1)}</span></div>
    </div>
    <div class="label">Kategorie</div>
    <div class="cats">${cats}</div>
    <div class="label">Runden</div>
    <div class="chips">${[5, 10, 15].map(n => `<button class="chip" data-r="${n}" aria-pressed="${S.rounds === n}">${n}</button>`).join("")}</div>
    <button class="b-main" id="start">Spiel starten</button>
    <p class="muted" id="hint"></p>
    <details><summary>Namen ändern</summary>
      <div class="card">
        <div class="field"><label class="label" for="n0">Spieler 1</label><input id="n0" value="${nm(0)}" maxlength="16"></div>
        <div class="field"><label class="label" for="n1">Spieler 2</label><input id="n1" value="${nm(1)}" maxlength="16"></div>
        <button class="b-ghost" id="savenames">Speichern</button>
      </div>
    </details>
    <details><summary>Spielregeln</summary>
      <div class="card">
        <p><b>Quiz:</b> Eine Aussage erscheint. Beide tippen nacheinander heimlich Fakt oder Lüge. Wer richtig liegt, bekommt einen Punkt. Wer dreimal in Folge richtig liegt, bekommt einen Bonuspunkt.</p>
        <p><b>Pärchen-Duell:</b> Einer sagt etwas über sich selbst, wahr oder erfunden, und legt heimlich fest, was es ist. Der andere rät. Liegt er richtig, bekommt er den Punkt, sonst der Erzähler. Dann wird getauscht.</p>
      </div>
    </details>`;
  const save = () => store.set(SETUP_KEY, { cat: S.cat, rounds: S.rounds });
  document.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { S.cat = b.dataset.cat; save(); home(); });
  document.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { S.rounds = +b.dataset.r; save(); home(); });
  $("savenames").onclick = () => {
    S.names = [$("n0").value.trim() || "Joshua", $("n1").value.trim() || "Luna"]; store.set(NAMES_KEY, S.names); home();
  };
  $("start").onclick = () => {
    S.first = Math.round(Math.random()); S.setter = S.first;
    if (S.cat === "paar") duelSet(); else { S.deck = buildDeck(); quizPick(0); }
  };
  window.scrollTo(0, 0);
}

/* ---------- Quiz ---------- */
function quizPick(step) {
  if (step === 0) { S.cur = S.deck[S.round]; S.picks = [null, null]; markSeen(S.cur[1]); }
  const who = step === 0 ? S.first : 1 - S.first;
  const c = S.cur[0];
  app.innerHTML = `
    ${topbar(`${CATS[c].name} · Runde ${S.round + 1} von ${S.rounds}`, c)}
    ${scoreBar(who)}${progress()}
    <div class="card">
      <div class="label">${nm(who)} ist dran</div>
      <p class="statement">${esc(S.cur[1])}</p>
      <div class="row"><button class="b-fact" id="t">Fakt</button><button class="b-lie" id="f">Lüge</button></div>
      <p class="muted">${step === 0 ? `Tippe so, dass ${nm(1 - who)} nicht mitlesen kann.` : `${nm(1 - who)} hat schon getippt.`}</p>
    </div>`;
  bindQuit();
  const choose = v => { S.picks[who] = v; step === 0 ? passScreen(1 - who, () => quizPick(1)) : quizReveal(); };
  $("t").onclick = () => choose(true);
  $("f").onclick = () => choose(false);
  window.scrollTo(0, 0);
}
function quizReveal() {
  const truth = S.cur[2], c = S.cur[0];
  const ok = [0, 1].map(i => S.picks[i] === truth);
  const bonus = [award(0, ok[0]), award(1, ok[1])];
  S.log.push({ t: S.cur[1], truth, e: S.cur[3], ok });
  const last = S.round + 1 >= S.rounds;
  app.innerHTML = `
    ${topbar(`${CATS[c].name} · Auflösung`, c)}
    ${scoreBar(-1)}${progress()}
    <div class="card">
      <p class="statement">${esc(S.cur[1])}</p>
      <div class="verdict ${truth ? "v-fact" : "v-lie"}">${label(truth)}</div>
      <p class="expl">${esc(S.cur[3])}</p>
      <div class="result">${[0, 1].map(i => `<div class="${ok[i] ? "ok" : "no"}">${nm(i)}: ${label(S.picks[i])}, ${ok[i] ? (bonus[i] ? "richtig, +2 mit Serienbonus" : "richtig, +1") : "falsch"}</div>`).join("")}</div>
      <button class="b-main" id="nx">${last ? "Endstand ansehen" : "Nächste Aussage"}</button>
    </div>`;
  bindQuit();
  $("nx").onclick = () => { S.round++; S.first = 1 - S.first; last ? finish() : quizPick(0); };
  window.scrollTo(0, 0);
}

/* ---------- Pärchen-Duell ---------- */
const newImpulse = () => { let n; do { n = IMPULSES[Math.floor(Math.random() * IMPULSES.length)]; } while (n === S.impulse && IMPULSES.length > 1); S.impulse = n; };
function duelSet() {
  const s = S.setter, g = 1 - s;
  if (!S.impulse) newImpulse();
  app.innerHTML = `
    ${topbar(`Pärchen-Duell · Runde ${S.round + 1} von ${S.rounds}`, "paar")}
    ${scoreBar(s)}${progress()}
    <div class="card">
      <div class="label">${nm(s)} erzählt etwas über sich</div>
      <div class="impulse"><span class="label">Idee</span><p id="imp">${esc(S.impulse)}</p><button class="b-ghost" id="other" style="padding:10px;font-size:.95rem">Andere Idee</button></div>
      <div class="field"><label class="label" for="st">Deine Aussage</label><textarea id="st" placeholder="Schreibe einen Satz über dich."></textarea></div>
      <div class="label">Stimmt sie wirklich?</div>
      <div class="row"><button class="b-fact" id="t">Ja, Fakt</button><button class="b-lie" id="f">Nein, Lüge</button></div>
      <p class="muted">${nm(g)} schaut weg. Danach rät ${nm(g)}.</p>
    </div>`;
  bindQuit();
  $("other").onclick = () => { newImpulse(); $("imp").textContent = S.impulse; };
  const choose = v => {
    const t = $("st").value.trim();
    if (!t) { $("st").focus(); return; }
    S.cur = ["paar", t, v, ""]; passScreen(g, duelGuess);
  };
  $("t").onclick = () => choose(true);
  $("f").onclick = () => choose(false);
  window.scrollTo(0, 0);
}
function duelGuess() {
  const s = S.setter, g = 1 - s;
  app.innerHTML = `
    ${topbar(`Pärchen-Duell · ${nm(g)} rät`, "paar")}
    ${scoreBar(g)}${progress()}
    <div class="card">
      <div class="label">Aussage von ${nm(s)}</div>
      <p class="statement">${esc(S.cur[1])}</p>
      <div class="row"><button class="b-fact" id="t">Fakt</button><button class="b-lie" id="f">Lüge</button></div>
    </div>`;
  bindQuit();
  const choose = v => {
    const right = v === S.cur[2], winner = right ? g : s;
    const bonus = award(winner, true); S.streak[1 - winner] = 0;
    S.round++; const last = S.round >= S.rounds;
    app.innerHTML = `
      ${topbar("Pärchen-Duell · Auflösung", "paar")}
      ${scoreBar(-1)}${progress()}
      <div class="card">
        <p class="statement">${esc(S.cur[1])}</p>
        <div class="verdict ${S.cur[2] ? "v-fact" : "v-lie"}">${label(S.cur[2])}</div>
        <div class="result"><div class="${right ? "ok" : "no"}">${nm(g)} tippte ${label(v)}: ${right ? "richtig" : "falsch"}. Punkt${bonus ? "e (Serienbonus)" : ""} für ${nm(winner)}.</div></div>
        <button class="b-main" id="nx">${last ? "Endstand ansehen" : `Weiter, ${nm(g)} erzählt`}</button>
      </div>`;
    bindQuit();
    $("nx").onclick = () => { if (last) return finish(); S.setter = g; S.impulse = ""; duelSet(); };
    window.scrollTo(0, 0);
  };
  $("t").onclick = () => choose(true);
  $("f").onclick = () => choose(false);
  window.scrollTo(0, 0);
}

/* ---------- Ende ---------- */
function finish() {
  recordGame();
  const [a, b] = S.scores;
  const title = a === b ? "Unentschieden" : `${nm(a > b ? 0 : 1)} gewinnt`;
  const missed = S.log.filter(l => !l.ok[0] && !l.ok[1]);
  const review = missed.length ? `<div class="review"><h3>Das hat keiner gewusst</h3><ul>${missed.map(l => `<li>${esc(l.t)} <b>(${label(l.truth)})</b></li>`).join("")}</ul></div>` : "";
  const st = stats();
  app.innerHTML = `
    <div class="card pass">
      <h1 class="winner">${title}</h1>
      <h2>${nm(0)} ${a} : ${b} ${nm(1)}</h2>
      ${S.cat !== "paar" ? `<p class="muted">Richtig getippt: ${nm(0)} ${S.correct[0]}, ${nm(1)} ${S.correct[1]} von ${S.rounds}</p>` : ""}
      ${review}
      <p class="muted">Gesamtstand: ${nm(0)} ${st.w[0]} Siege, ${nm(1)} ${st.w[1]} Siege, ${st.d} Remis</p>
      <div class="row" style="align-self:stretch"><button class="b-main" id="again">Revanche</button><button class="b-ghost" id="menu">Zum Start</button></div>
    </div>`;
  $("again").onclick = () => {
    S.scores = [0, 0]; S.streak = [0, 0]; S.correct = [0, 0]; S.round = 0; S.log = [];
    S.first = 1 - S.first; S.setter = S.first; S.impulse = "";
    if (S.cat === "paar") duelSet(); else { S.deck = buildDeck(); quizPick(0); }
  };
  $("menu").onclick = home;
  window.scrollTo(0, 0);
}

home();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
