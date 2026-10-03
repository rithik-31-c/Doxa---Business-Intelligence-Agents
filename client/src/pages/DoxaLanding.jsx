import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AGENTS = [
  {
    id: "intent", color: "#6366f1", kind: "Understanding agent", name: "Intent Agent", short: "Reads the question",
    body: "Works out what the person is really asking: which metric, which period, which comparison. It turns loose business language into a clear, structured request.",
    out: "Structured question",
    lines: ["metric: revenue", "period: last quarter", "region: South", "goal: explain the drop"],
  },
  {
    id: "context", color: "#0ea5e9", kind: "Understanding agent", name: "Context Agent", short: "Knows your data",
    body: "Maps the request onto your tables, columns and business definitions, so revenue means the same thing it means in your company.",
    out: "Grounded data map",
    lines: ["revenue = orders.net_amount", "South = regions S1, S2", "quarter = fiscal calendar"],
  },
  {
    id: "planner", color: "#10b981", kind: "Planning agent", name: "Planning Agent", short: "Decides the steps",
    body: "Breaks the question into an ordered analysis plan: what to fetch, filter, join and compute, and in what order.",
    out: "Step-by-step plan",
    lines: ["1. Pull South orders by month", "2. Compare with previous quarter", "3. Break the change down by product"],
  },
  {
    id: "engine", color: "#f59e0b", kind: "Deterministic engine", name: "Analysis Engine", short: "Does the maths",
    body: "Executes the plan with plain code, not a language model. The same question on the same data always returns the same numbers, and every figure can be traced.",
    out: "Verified results",
    lines: ["revenue change: -12.4%", "largest drop: Product B", "rows checked: 48,210"],
  },
  {
    id: "explainer", color: "#ec4899", kind: "Explanation LLM", name: "Explanation LLM", short: "Tells the story",
    body: "Turns the engine's results into a clear answer in plain language. It explains the numbers; it never calculates them.",
    out: "Answer you can read",
    lines: ["South revenue fell 12.4% last quarter, mostly because Product B orders declined."],
  },
];

const REASONS = [
  ["Numbers you can trust", "Calculations run in a deterministic engine, so results don't change between runs and never come from a model's guess."],
  ["Each agent has one job", "Understanding, planning, computing and explaining are separate steps, which makes problems easy to find and fix."],
  ["Answers with a trail", "Every answer links back to the plan and the data behind it, so people can check the work."],
];

const EASE = [0.22, 1, 0.36, 1];

/* ---------- animation variants ---------- */
const stagger = (gap = 0.12, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};
const letterRise = {
  hidden: { y: "105%" },
  show: { y: 0, transition: { duration: 1, ease: EASE } },
};

/* ---------- dot field (drag to move) ---------- */
function DotField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GAP = 30;
    let dots = [], w = 0, h = 0, raf, t = 0;
    const ptr = { x: -999, y: -999, vx: 0, vy: 0, down: false };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h + GAP; y += GAP)
        for (let x = GAP / 2; x < w + GAP; x += GAP)
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, hue: (x / w) * 200 + (y / h) * 90 + 190 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.25;
      ptr.vx *= 0.85; ptr.vy *= 0.85;
      for (const d of dots) {
        const dx = d.x - ptr.x, dy = d.y - ptr.y;
        const dist = Math.hypot(dx, dy);
        if (ptr.down && dist < 190) {
          const f = (1 - dist / 190) ** 2;
          d.vx += ptr.vx * f * 0.5; d.vy += ptr.vy * f * 0.5;
        } else if (dist < 90) {
          const f = (1 - dist / 90) * 0.6;
          d.vx += (dx / (dist || 1)) * f; d.vy += (dy / (dist || 1)) * f;
        }
        d.vx += (d.ox - d.x) * 0.035; d.vy += (d.oy - d.y) * 0.035;
        d.vx *= 0.88; d.vy *= 0.88;
        d.x += d.vx; d.y += d.vy;
        const off = Math.min(Math.hypot(d.x - d.ox, d.y - d.oy) / 40, 1);
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.7 + off * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(d.hue + t) % 360},85%,${off > 0.05 ? 52 : 58}%,${0.4 + off * 0.6})`;
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const isUI = (t) => t.closest && t.closest("a,button,input,textarea,[data-nodrag]");
    const down = (e) => {
      if (isUI(e.target)) return;
      ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY;
      document.body.classList.add("dx-grabbing");
    };
    const move = (e) => {
      if (ptr.down) { ptr.vx += (e.clientX - ptr.x) * 0.6; ptr.vy += (e.clientY - ptr.y) * 0.6; }
      ptr.x = e.clientX; ptr.y = e.clientY;
    };
    const up = () => { ptr.down = false; document.body.classList.remove("dx-grabbing"); };
    const leave = () => { ptr.x = ptr.y = -999; };

    build(); draw();
    window.addEventListener("resize", build);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <motion.canvas
      ref={ref}
      className="dx-canvas"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    />
  );
}

const ICONS = {
  intent: <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
  context: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
  planner: <path d="M5 6h14M5 12h10M5 18h6" />,
  engine: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  explainer: <path d="M4 5h16v11H9l-5 4V5z" />,
};
function Icon({ id }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[id]}
    </svg>
  );
}

/* scroll to a section without adding #hash to the URL */
const go = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ---------- page ---------- */
export default function DoxaLanding() {
  const [titleDone, setTitleDone] = useState(false); // Doxa title finished animating
  const [ready, setReady] = useState(false); // second line shown, everything else can appear
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const a = AGENTS[active];
  const pick = (i) => { setAuto(false); setActive(i); };

  useEffect(() => {
    if (!auto || !ready) return;
    const id = setInterval(() => setActive((i) => (i + 1) % AGENTS.length), 4500);
    return () => clearInterval(id);
  }, [auto, ready]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setTitleDone(true); setReady(true); }, 4600); // safety fallback
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = ready ? "" : "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [ready]);

  const state = ready ? "show" : "hidden";
  const inView = { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.25 } };

  return (
    <div className="dx">
      <style>{CSS}</style>

      <DotField />

      <motion.header
        className="dx-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <span className="dx-logo">Doxa</span>
        <nav>
          <a href="/" onClick={go("agents")}>Agents</a>
          <a href="/" onClick={go("why")}>Why Doxa</a>
          <a href="/dashboard" className="dx-btn dx-btn-sm">Try for Free</a>
        </nav>
      </motion.header>

      <main>
        {/* hero */}
        <section className="dx-hero">
          <motion.div layout transition={{ duration: 0.9, ease: EASE }} className="dx-intro">
          <motion.div
            className="dx-h1wrap"
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: EASE }}
          >
          <h1 aria-label="Doxa">
            {"Doxa".split("").map((c, i) => (
              <span className="dx-mask" key={i} aria-hidden="true">
                <motion.span
                  initial={{ y: "110%", rotate: 8 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ delay: 0.25 + i * 0.16, duration: 1, ease: EASE }}
                  onAnimationComplete={() => i === 3 && setTitleDone(true)}
                >
                  {c}
                </motion.span>
              </span>
            ))}
          </h1>
          </motion.div>
          <motion.p
            className="dx-kicker"
            initial={{ opacity: 0, y: 22 }}
            animate={titleDone ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
            onAnimationComplete={() => titleDone && setReady(true)}
          >
            Your business intelligence agents
          </motion.p>
          </motion.div>
          {ready && (
            <motion.div className="dx-rest" variants={stagger(0.14, 0.1)} initial="hidden" animate="show">
          <motion.p className="dx-tag" variants={rise}>
            Ask your business a question. Get an answer you can check.
          </motion.p>
          <motion.p className="dx-sub" variants={rise}>
            Doxa is a business intelligence system built from five specialised agents. Four of them understand, plan and calculate. One explains.
          </motion.p>
          <motion.div className="dx-cta" variants={rise}>
            <motion.a href="/" onClick={go("start")} className="dx-btn" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              Request access
            </motion.a>
            <motion.a href="/" onClick={go("agents")} className="dx-btn dx-btn-ghost" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              Meet the agents
            </motion.a>
          </motion.div>
          <motion.p className="dx-hint" variants={rise}>
            <motion.b
              animate={{ scale: [1, 1.7, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            Drag anywhere on the page to move the dots.
          </motion.p>
            </motion.div>
          )}
        </section>

        {/* agents */}
        <section id="agents" className="dx-band" data-nodrag>
          <div className="dx-bandin">
          <motion.div variants={stagger(0.1)} {...inView}>
            <motion.h2 variants={rise}>Five agents, one answer</motion.h2>
            <motion.p className="dx-lead" variants={rise}>
              Your question passes through each agent in turn. Select one to see what it does.
            </motion.p>
          </motion.div>

          <motion.div className="dx-stage" variants={rise} {...inView}>
            <p className="dx-ask">Say someone asks: "Why did revenue drop in the South last quarter?"</p>

            <div className="dx-pipe">
              <div className="dx-track">
                <motion.i
                  className="dx-fill"
                  animate={{ width: `${(active / (AGENTS.length - 1)) * 100}%` }}
                  style={{ background: `linear-gradient(90deg, ${AGENTS[0].color}, ${a.color})` }}
                  transition={{ duration: 0.6, ease: EASE }}
                />
                <motion.b
                  className="dx-pulse"
                  animate={{ left: ["0%", "100%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                />
              </div>
              {AGENTS.map((ag, i) => (
                <button
                  key={ag.id}
                  className={"dx-node" + (i === active ? " on" : "") + (i < active ? " done" : "")}
                  style={{ "--c": ag.color }}
                  onClick={() => pick(i)}
                  aria-pressed={i === active}
                >
                  <span className="dx-ring"><Icon id={ag.id} /></span>
                  <strong>{ag.name}</strong>
                  <em>{ag.short}</em>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={a.id}
                className="dx-panel"
                style={{ "--c": a.color }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="dx-pl">
                  <span className="dx-chip">{a.kind}</span>
                  <h3>{a.name}</h3>
                  <p>{a.body}</p>
                  <div className="dx-out">Hands over<b>{a.out}</b></div>
                </div>
                <div className="dx-pr">
                  <p className="dx-q">What it produces for this question</p>
                  {a.lines.map((l, i) => (
                    <motion.div
                      className="dx-line"
                      key={l}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
                    >
                      {l}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
          </div>
        </section>

        {/* why */}
        <section id="why" className="dx-section">
          <motion.div variants={stagger(0.1)} {...inView}>
            <motion.h2 variants={rise}>Why split the work</motion.h2>
          </motion.div>
          <motion.div className="dx-why" variants={stagger(0.15)} {...inView}>
            {REASONS.map(([t, d]) => (
              <motion.div key={t} variants={rise} whileHover={{ y: -4 }} className="dx-why-item">
                <h3>{t}</h3>
                <p>{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* final */}
        <section id="start" className="dx-section dx-final">
          <motion.div variants={stagger(0.12)} {...inView}>
            <motion.h2 variants={rise}>See Doxa on your data</motion.h2>
            <motion.p className="dx-lead" variants={rise}>
              Tell us what you want to understand, and we'll set up a walkthrough.
            </motion.p>
            <motion.div variants={rise}>
              <motion.a href="mailto:hello@doxa.ai" className="dx-btn" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                Request access
              </motion.a>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="dx-foot">Doxa &copy; {new Date().getFullYear()}</footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Sans:wght@400;500&display=swap');
.dx{--bg:#ffffff;--ink:#0f172a;--mute:#5b6678;--line:#e5e8ee;--panel:#f7f8fb;--gold:#f09600;--goldtxt:#a35f00;
  --serif:'Fraunces',Georgia,serif;--sans:'IBM Plex Sans',system-ui,sans-serif;
  background:var(--bg);color:var(--ink);font-family:var(--sans);min-height:100vh;position:relative;line-height:1.6;overflow-x:hidden}
.dx *{box-sizing:border-box}
.dx-canvas{position:fixed;inset:0;pointer-events:none;z-index:0}
body.dx-grabbing{cursor:grabbing;user-select:none}
.dx-nav,.dx main,.dx-foot{position:relative;z-index:1}

.dx-mask{display:inline-block;overflow:hidden;padding:.06em .01em .14em}
.dx-mask>span{display:inline-block;will-change:transform}

/* nav */
.dx-nav{display:flex;justify-content:space-between;align-items:center;padding:18px clamp(20px,5vw,56px);position:sticky;top:0;z-index:5;background:rgba(255,255,255,.82);backdrop-filter:blur(10px);border-bottom:1px solid transparent}
.dx-logo{font-family:var(--serif);font-size:24px;font-weight:600}
.dx-nav nav{display:flex;gap:24px;align-items:center}
.dx-nav a{color:var(--mute);text-decoration:none;font-size:15px}
.dx-nav a:hover{color:var(--ink)}

/* buttons */
.dx-btn{display:inline-block;background:var(--ink);color:#fff!important;padding:13px 26px;border-radius:999px;font-weight:500;text-decoration:none;font-size:16px}
.dx-btn-sm{padding:8px 18px;font-size:14px}
.dx-btn-ghost{background:#fff;color:var(--ink)!important;border:1px solid var(--line)}
.dx a:focus-visible,.dx-list button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}

/* hero */
.dx-hero{min-height:100vh;margin-top:-70px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:70px 20px 40px;user-select:none}
.dx-intro{display:flex;flex-direction:column;align-items:center}
.dx-rest{display:flex;flex-direction:column;align-items:center}
.dx-hero h1{font-family:var(--serif);font-weight:600;font-size:clamp(88px,22vw,260px);line-height:.95;margin:0;letter-spacing:-.03em;display:flex}
.dx-hero h1 .dx-mask{padding:.04em .02em .16em}
.dx-h1wrap{display:flex;justify-content:center}
.dx-kicker{font-family:var(--serif);font-size:clamp(20px,2.8vw,32px);margin:4px 0 0;color:var(--ink);font-weight:600}
.dx-tag{font-family:var(--serif);font-size:clamp(22px,3.2vw,36px);margin:20px 0 12px;max-width:20em;line-height:1.25}
.dx-sub{color:var(--mute);max-width:36em;margin:0 0 34px;font-size:17px}
.dx-cta{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.dx-hint{color:var(--mute);font-size:14px;margin-top:44px;display:flex;align-items:center;gap:10px}
.dx-hint b{width:8px;height:8px;border-radius:50%;background:var(--gold);display:inline-block}

/* sections */
.dx-section{max-width:1040px;margin:0 auto;padding:90px clamp(20px,5vw,40px)}
.dx-section h2{font-family:var(--serif);font-weight:600;font-size:clamp(30px,4.5vw,46px);margin:0 0 12px;line-height:1.15}
.dx-lead{color:var(--mute);max-width:34em;margin:0 0 40px;font-size:17px}

/* agents */
.dx-band{position:relative;overflow:hidden;background:#0b1226;color:#e8edf8;padding:110px 0}
.dx-band:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(900px 380px at 12% -10%,rgba(99,102,241,.38),transparent),radial-gradient(800px 380px at 95% 110%,rgba(236,72,153,.28),transparent)}
.dx-bandin{position:relative;width:100%;padding:0 clamp(24px,6vw,96px)}
.dx-band h2{font-family:var(--serif);font-weight:600;font-size:clamp(30px,4.5vw,46px);margin:0 0 12px;line-height:1.15;color:#fff}
.dx-band .dx-lead{color:#aab6d0}
.dx-stage{position:relative}
.dx-stage>*{position:relative}
.dx-ask{font-family:var(--serif);font-size:clamp(18px,2.4vw,24px);margin:0 0 48px;color:#c9d3e8;line-height:1.35}
.dx-pipe{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.dx-track{position:absolute;left:10%;right:10%;top:29px;height:3px;background:rgba(255,255,255,.12);border-radius:2px}
.dx-fill{position:absolute;left:0;top:0;bottom:0;border-radius:2px}
.dx-pulse{position:absolute;top:-3px;width:9px;height:9px;margin-left:-4px;border-radius:50%;background:#fff;box-shadow:0 0 14px 4px rgba(255,255,255,.6)}
.dx-node{all:unset;box-sizing:border-box;cursor:pointer;position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;padding-bottom:6px}
.dx-ring{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#0b1226;border:2px solid rgba(255,255,255,.18);color:#9fb0cf;transition:all .35s}
.dx-ring svg{width:24px;height:24px}
.dx-node.done .dx-ring{border-color:var(--c);color:var(--c)}
.dx-node.on .dx-ring{background:var(--c);border-color:var(--c);color:#fff;transform:scale(1.1);box-shadow:0 0 0 7px color-mix(in srgb,var(--c) 28%,transparent),0 0 30px color-mix(in srgb,var(--c) 70%,transparent)}
.dx-node strong{font-weight:500;font-size:15px;margin-top:10px;color:#e8edf8}
.dx-node em{font-style:normal;font-size:13px;color:#8d9bb8}
.dx-node:focus-visible .dx-ring{outline:2px solid #fff;outline-offset:3px}
.dx-panel{margin-top:56px;display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,6vw,96px);align-items:start}
.dx-chip{display:inline-block;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:500;background:color-mix(in srgb,var(--c) 24%,transparent);color:color-mix(in srgb,var(--c) 50%,#fff)}
.dx-pl h3{font-family:var(--serif);font-weight:600;font-size:30px;margin:14px 0 10px;color:#fff}
.dx-pl p{margin:0;color:#aab6d0;font-size:17px}
.dx-out{margin-top:22px;color:#8d9bb8;font-size:14px}
.dx-out b{color:#fff;font-weight:500;margin-left:8px}
.dx-pr{border-left:3px solid var(--c);padding:2px 0 2px clamp(20px,3vw,36px)}
.dx-q{margin:0 0 14px;font-size:14px;color:#8d9bb8}
.dx-line{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:15px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.12);color:#e8edf8}
.dx-line:last-child{border-bottom:0}

/* why */
.dx-why{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:36px}
.dx-why-item{background:rgba(255,255,255,.9);border:1px solid var(--line);border-radius:18px;padding:26px}
.dx-why h3{font-family:var(--serif);font-weight:600;font-size:22px;margin:0 0 8px}
.dx-why p{margin:0;color:var(--mute)}

.dx-final{text-align:center;padding-bottom:120px}
.dx-final .dx-lead{margin-left:auto;margin-right:auto}
.dx-foot{text-align:center;color:var(--mute);font-size:14px;padding:30px}

@media (max-width:760px){.dx-panel{grid-template-columns:1fr}.dx-node em{display:none}.dx-node strong{font-size:12px}.dx-ring{width:46px;height:46px}.dx-track{top:23px}.dx-nav nav a:not(.dx-btn){display:none}}
`;