import { useEffect, useMemo, useState } from "react";
import "./App.css";

const LEVELS = {
  easy: { name: "Easy", rows: 8, cols: 8, mines: 10 },
  medium: { name: "Medium", rows: 12, cols: 12, mines: 25 },
  hard: { name: "Hard", rows: 16, cols: 16, mines: 45 },
  insane: { name: "Insane", rows: 18, cols: 18, mines: 70 },
};

const CITIES = ["Almaty", "Astana", "Shymkent", "Aktau", "Karaganda"];

const RANKS = [
  { name: "Beginner", xp: 0 },
  { name: "Mine Hunter", xp: 150 },
  { name: "Logic Analyst", xp: 400 },
  { name: "Probability Master", xp: 800 },
  { name: "MineMind Legend", xp: 1400 },
];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seedFromText(text) {
  return text.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function cryptoRandom() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967295;
}

function createEmptyBoard(level) {
  return Array.from({ length: level.rows }, (_, r) =>
    Array.from({ length: level.cols }, (_, c) => ({
      r,
      c,
      mine: false,
      open: false,
      flag: false,
      count: 0,
    }))
  );
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function getNeighbors(board, r, c) {
  const result = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const cell = board[r + dr]?.[c + dc];
      if (cell) result.push(cell);
    }
  }

  return result;
}

function generateBoard(level, firstR, firstC, mode, difficulty) {
  const board = createEmptyBoard(level);
  const safe = new Set();

  safe.add(`${firstR}-${firstC}`);

  getNeighbors(board, firstR, firstC).forEach((cell) => {
    safe.add(`${cell.r}-${cell.c}`);
  });

  const random =
    mode === "daily"
      ? seededRandom(seedFromText(todayKey() + difficulty))
      : cryptoRandom;

  let placed = 0;

  while (placed < level.mines) {
    const r = Math.floor(random() * level.rows);
    const c = Math.floor(random() * level.cols);

    if (!board[r][c].mine && !safe.has(`${r}-${c}`)) {
      board[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (!board[r][c].mine) {
        board[r][c].count = getNeighbors(board, r, c).filter((x) => x.mine).length;
      }
    }
  }

  return board;
}

function openArea(board, r, c) {
  const cell = board[r]?.[c];

  if (!cell || cell.open || cell.flag) return;

  cell.open = true;

  if (cell.count !== 0) return;

  for (const n of getNeighbors(board, r, c)) {
    openArea(board, n.r, n.c);
  }
}

function calculateRisks(board, level) {
  const risks = {};

  for (const row of board) {
    for (const cell of row) {
      if (!cell.open || cell.count === 0) continue;

      const neighbors = getNeighbors(board, cell.r, cell.c);
      const flags = neighbors.filter((x) => x.flag).length;
      const hidden = neighbors.filter((x) => !x.open && !x.flag);

      if (hidden.length === 0) continue;

      const neededMines = Math.max(0, cell.count - flags);
      const probability = Math.max(0, Math.min(1, neededMines / hidden.length));

      hidden.forEach((h) => {
        const key = `${h.r}-${h.c}`;
        if (!risks[key]) risks[key] = [];
        risks[key].push(probability);
      });
    }
  }

  const result = {};
  const closedCells = board.flat().filter((x) => !x.open && !x.flag).length;
  const flaggedCells = board.flat().filter((x) => x.flag).length;

  const baselineRisk =
    closedCells > 0
      ? Math.max(0.05, Math.min(0.85, (level.mines - flaggedCells) / closedCells))
      : 0;

  for (const row of board) {
    for (const cell of row) {
      if (!cell.open && !cell.flag) {
        result[`${cell.r}-${cell.c}`] = baselineRisk;
      }
    }
  }

  Object.entries(risks).forEach(([key, values]) => {
    result[key] = values.reduce((a, b) => a + b, 0) / values.length;
  });

  return result;
}

function getRank(xp) {
  let current = RANKS[0];

  for (const rank of RANKS) {
    if (xp >= rank.xp) current = rank;
  }

  const next = RANKS.find((r) => r.xp > xp);

  return {
    current,
    next,
    progress: next ? Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100) : 100,
  };
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [difficulty, setDifficulty] = useState("easy");
  const [mode, setMode] = useState("classic");
  const [theme, setTheme] = useState(() => load("theme", "dark"));
  const [tapMode, setTapMode] = useState("open");
  const [showPro, setShowPro] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [proDemo, setProDemo] = useState(() => load("proDemo", false));
  const [heatmap, setHeatmap] = useState(false);

  const [profile, setProfile] = useState(() =>
    load("profile", { name: "Player", city: "Almaty" })
  );

  const [stats, setStats] = useState(() =>
    load("stats", {
      wins: 0,
      losses: 0,
      games: 0,
      streak: 0,
      xp: 0,
      best: {},
      history: [],
      mistakes: [],
    })
  );

  const [board, setBoard] = useState(() => createEmptyBoard(LEVELS.easy));
  const [generated, setGenerated] = useState(false);
  const [status, setStatus] = useState("ready");
  const [seconds, setSeconds] = useState(0);
  const [lastMistake, setLastMistake] = useState(null);

  const level = LEVELS[difficulty];

  useEffect(() => {
    document.body.className = theme;
    save("theme", theme);
  }, [theme]);

  useEffect(() => save("profile", profile), [profile]);
  useEffect(() => save("stats", stats), [stats]);
  useEffect(() => save("proDemo", proDemo), [proDemo]);

  useEffect(() => {
  if (status !== "playing") return;

  const timer = setInterval(() => {
    setSeconds((s) => {
      if (mode === "speed") {
        const next = s - 1;

        if (next <= 0) {
          setStatus("lost");
          return 0;
        }

        return next;
      }

      return s + 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [status, mode]);

  const risks = useMemo(() => calculateRisks(board, level), [board, level]);

  const riskList = Object.entries(risks).map(([key, probability]) => {
    const [r, c] = key.split("-").map(Number);
    return { r, c, probability };
  });

  const riskStats = useMemo(() => {
    const values = riskList.map((x) => x.probability);

    if (values.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [riskList]);

  const safest = riskList.length
    ? [...riskList].sort((a, b) => a.probability - b.probability)[0]
    : null;

  const danger = riskList.length
    ? [...riskList].sort((a, b) => b.probability - a.probability)[0]
    : null;

  const opened = board.flat().filter((x) => x.open).length;
  const flags = board.flat().filter((x) => x.flag).length;
  const safeCells = level.rows * level.cols - level.mines;
  const progress = Math.min(100, Math.round((opened / safeCells) * 100)) || 0;
  const rank = getRank(stats.xp);

  const coachText = useMemo(() => {
    if (status === "won") return "You won. Great risk control and board reading.";

    if (status === "lost") {
      if (lastMistake) {
        return `Mistake review: you clicked row ${lastMistake.r + 1}, column ${
          lastMistake.c + 1
        }. Estimated risk was ${Math.round(lastMistake.probability * 100)}%.`;
      }
      return "You lost. Review nearby numbers before opening hidden cells.";
    }

    if (!generated) return "Make the first move. First click is always safe.";

    if (!safest) return "Open more cells to let AI Coach calculate useful probabilities.";

    return `Best move: row ${safest.r + 1}, column ${safest.c + 1}. Estimated risk: ${Math.round(
      safest.probability * 100
    )}%. Highest risk: ${danger ? Math.round(danger.probability * 100) : 0}%.`;
  }, [status, safest, danger, lastMistake, generated]);

  const achievements = [
    { title: "First Win", desc: "Win your first game", done: stats.wins >= 1 },
    { title: "Daily Player", desc: "Try Daily Challenge", done: stats.history.some((g) => g.mode === "daily") },
    { title: "3 Win Streak", desc: "Win 3 games in a row", done: stats.streak >= 3 },
    { title: "Insane Explorer", desc: "Try Insane difficulty", done: stats.history.some((g) => g.difficulty === "insane") },
    { title: "Logic Analyst", desc: "Reach 400 XP", done: stats.xp >= 400 },
  ];

  const leaderboard = [
    { name: profile.name, city: profile.city, time: stats.best[difficulty] || 999, you: true },
    { name: "Aruzhan", city: "Astana", time: 39 },
    { name: "Miras", city: "Almaty", time: 48 },
    { name: "Dastan", city: "Shymkent", time: 61 },
    { name: "Amina", city: "Aktau", time: 72 },
  ].sort((a, b) => a.time - b.time);

  function restart(newDifficulty = difficulty, newMode = mode) {
    setDifficulty(newDifficulty);
    setMode(newMode);
    setBoard(createEmptyBoard(LEVELS[newDifficulty]));
    setGenerated(false);
    setStatus("ready");
    setSeconds(newMode === "speed" ? 120 : 0);
    setLastMistake(null);
  }

  function startGame(newMode = mode) {
    setMode(newMode);
    setScreen("game");
    restart(difficulty, newMode);
  }

  function finish(result, mistake = null) {
    setStatus(result);

    setStats((prev) => {
      const next = { ...prev };
      next.games += 1;

      let gainedXp = 10;

      if (result === "won") {
        gainedXp += 60;
        if (mode === "daily") gainedXp += 30;
        if (difficulty === "hard") gainedXp += 40;
        if (difficulty === "insane") gainedXp += 80;

        next.wins += 1;
        next.streak += 1;

        const key = mode === "daily" ? `${difficulty}_daily` : difficulty;

        if (!next.best[key] || seconds < next.best[key]) next.best[key] = seconds;
        if (!next.best[difficulty] || seconds < next.best[difficulty]) next.best[difficulty] = seconds;
      } else {
        next.losses += 1;
        next.streak = 0;
        if (mistake) next.mistakes = [mistake, ...next.mistakes.slice(0, 4)];
      }

      next.xp += gainedXp;

      next.history = [
        {
          result,
          difficulty,
          mode,
          time: seconds,
          xp: gainedXp,
          date: new Date().toLocaleString(),
        },
        ...next.history.slice(0, 9),
      ];

      return next;
    });
  }

  function openCell(r, c) {
    if (status === "won" || status === "lost") return;

    let activeBoard = board;

    if (!generated) {
      activeBoard = generateBoard(level, r, c, mode, difficulty);
      setGenerated(true);
    } else {
      activeBoard = cloneBoard(board);
    }

    const cell = activeBoard[r][c];

    if (cell.open) return;

    if (tapMode === "flag") {
      cell.flag = !cell.flag;
      setBoard(activeBoard);
      if (status === "ready") setStatus("playing");
      return;
    }

    if (cell.flag) return;

    setStatus("playing");

    if (cell.mine) {
      const probability = risks[`${r}-${c}`] ?? 1;
      const mistake = { r, c, probability, time: seconds };

      setLastMistake(mistake);

      cell.open = true;
      activeBoard.flat().forEach((x) => {
        if (x.mine) x.open = true;
      });

      setBoard(activeBoard);
      finish("lost", mistake);
      return;
    }

    openArea(activeBoard, r, c);

    const won = activeBoard.flat().every((x) => x.mine || x.open);

    setBoard(activeBoard);

    if (won) finish("won");
  }

  function toggleFlag(e, r, c) {
    e.preventDefault();

    if (status === "won" || status === "lost") return;

    const copy = cloneBoard(board);

    if (!copy[r][c].open) {
      copy[r][c].flag = !copy[r][c].flag;
      setBoard(copy);
      if (status === "ready") setStatus("playing");
    }
  }

  function riskClass(cell) {
    if (!heatmap) return "";
    if (!generated) return "";
    if (cell.open || cell.flag) return "";

    const value = risks[`${cell.r}-${cell.c}`];

    if (value === undefined) return "";

    const { min, max } = riskStats;

    if (max === min) return "riskNeutral";

    const normalized = (value - min) / (max - min);

    if (value === min) return "riskSafest";
    if (value === max) return "riskDangerest";

    if (normalized <= 0.2) return "riskLow";
    if (normalized <= 0.4) return "riskMidLow";
    if (normalized <= 0.6) return "riskMid";
    if (normalized <= 0.8) return "riskHigh";

    return "riskExtreme";
  }

  function riskLabel(value) {
    if (value === undefined || !generated) return "";
    return `${Math.round(value * 100)}%`;
  }

  function shareResult() {
    const text = `I played MineMind ${mode} challenge in ${seconds}s with ${progress}% progress.`;
    navigator.clipboard?.writeText(text);
    alert("Result copied. You can paste it to Telegram, Instagram or LinkedIn.");
  }

  function resetStats() {
    setStats({
      wins: 0,
      losses: 0,
      games: 0,
      streak: 0,
      xp: 0,
      best: {},
      history: [],
      mistakes: [],
    });
  }

  if (screen === "landing") {
    return (
      <div className="app">
        <header className="landingHero">
          <nav className="nav">
            <div className="logo">💣 MineMind</div>

            <div className="navActions">
              <button onClick={() => startGame("daily")}>Daily</button>
              <button onClick={() => setShowPro(true)}>Pro</button>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </nav>

          <div className="landingGrid">
            <div>
              <p className="badge">Smarter Minesweeper</p>
              <h1>Play Minesweeper smarter.</h1>
              <p className="heroSub">
                Train your logic, compete in daily challenges, and learn safer moves with AI-powered hints.
              </p>

              <div className="heroActions">
                <button className="primary" onClick={() => startGame("classic")}>
                  Play Now
                </button>
                <button onClick={() => startGame("daily")}>Daily Challenge</button>
                <button className="gold" onClick={() => setShowPro(true)}>Go Pro</button>
              </div>
            </div>

            <div className="challengeCard">
              <p className="badge darkBadge">Today’s Challenge</p>
              <h3>Can you beat Almaty?</h3>

              <div className="challengeRow">
                <span>Best time today</span>
                <b>39s</b>
              </div>

              <div className="challengeRow">
                <span>Players today</span>
                <b>128</b>
              </div>

              <div className="challengeRow">
                <span>Your city</span>
                <b>{profile.city}</b>
              </div>

              <button className="gold full" onClick={() => startGame("daily")}>
                Start Daily Challenge
              </button>
            </div>
          </div>
        </header>

        <section className="features">
          <div className="featureCard">
            <span>01</span>
            <h3>Daily Challenge</h3>
            <p>One board per day for everyone. Compete fairly by time and accuracy.</p>
          </div>

          <div className="featureCard">
            <span>02</span>
            <h3>AI Coach</h3>
            <p>Get safer move suggestions and understand risky cells before clicking.</p>
          </div>

          <div className="featureCard">
            <span>03</span>
            <h3>Go Pro</h3>
            <p>Remove ads, unlock heatmap, mistake review, premium skins and tournaments.</p>
          </div>
        </section>

        {showPro && (
          <ProModal
            onClose={() => setShowPro(false)}
            onCheckout={() => setShowCheckout(true)}
            setProDemo={setProDemo}
          />
        )}

        {showCheckout && (
          <CheckoutModal
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              setProDemo(true);
              setShowCheckout(false);
              setShowPro(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topHero">
        <div>
          <button className="backBtn" onClick={() => setScreen("landing")}>← Landing</button>
          <p className="badge">MineMind · AI Minesweeper Platform</p>
          <h1>Play, learn, compete.</h1>
          <p>
            Classic mode is random. Daily Challenge gives the same board to all players today.
          </p>
        </div>

        <div className="rankCard">
          <span>Rank</span>
          <strong>{rank.current.name}</strong>
          <small>{stats.xp} XP</small>
          <div className="rankProgress">
            <i style={{ width: `${rank.progress}%` }} />
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel gamePanel">
          <div className="controls">
            <select value={difficulty} onChange={(e) => restart(e.target.value, mode)}>
              {Object.entries(LEVELS).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>

            <select value={mode} onChange={(e) => restart(difficulty, e.target.value)}>
              <option value="classic">Classic Random</option>
              <option value="daily">Daily Challenge</option>
              <option value="training">Training Mode</option>
              <option value="speed">Speed Run 2 min</option>
            </select>

            <button onClick={() => setTapMode(tapMode === "open" ? "flag" : "open")}>
              iPhone: {tapMode === "open" ? "Open Mode" : "Flag Mode"}
            </button>

            <button className={heatmap ? "heatmapActive" : ""} onClick={() => setHeatmap((prev) => !prev)}>
              {heatmap ? "Heatmap ON" : "Heatmap OFF"}
            </button>

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <button onClick={() => restart()}>Restart</button>
          </div>

          <div className="modeBox">
            {mode === "daily" && (
              <p><b>Daily Challenge:</b> today all users get the same board. This makes leaderboard competition fair.</p>
            )}
            {mode === "classic" && (
              <p><b>Classic Random:</b> every restart creates a fresh random board for training.</p>
            )}
            {mode === "training" && (
              <p><b>Training Mode:</b> use AI Coach, heatmap and explanations to learn probability logic.</p>
            )}
            {mode === "speed" && (
              <p><b>Speed Run 2 min:</b> open as many safe cells as possible before the 120-second timer ends.</p>
            )}
          </div>

          {heatmap && (
            <div className="heatmapInfo">
              {!generated
                ? "Heatmap will appear after your first move."
                : "Heatmap colors: green = safest, yellow/orange = medium risk, red = highest risk."}
            </div>
          )}

          <div className="dashboard">
            <div><span>Time</span><b>⏱ {seconds}s</b></div>
            <div><span>Flags</span><b>🚩 {flags}/{level.mines}</b></div>
            <div><span>Progress</span><b>📈 {progress}%</b></div>
            <div><span>Status</span><b>
              {status === "ready" && "🟡 Ready"}
              {status === "playing" && "🎮 Playing"}
              {status === "won" && "🏆 Won"}
              {status === "lost" && "💥 Lost"}
            </b></div>
          </div>

          <div className="progress"><span style={{ width: `${progress}%` }} /></div>

          <div className="boardWrap">
            <div className="board" style={{ gridTemplateColumns: `repeat(${level.cols}, 34px)` }}>
              {board.map((row) =>
                row.map((cell) => {
                  const riskValue = risks[`${cell.r}-${cell.c}`];
                  const isSafe = generated && safest && safest.r === cell.r && safest.c === cell.c;
                  const isDanger = generated && danger && danger.r === cell.r && danger.c === cell.c;

                  return (
                    <button
                      key={`${cell.r}-${cell.c}`}
                      className={[
                        "cell",
                        cell.open ? "open" : "",
                        cell.open && !cell.mine ? `n${cell.count}` : "",
                        !heatmap && isSafe && !cell.open && !cell.flag ? "safeHint" : "",
                        !heatmap && isDanger && !cell.open && !cell.flag ? "dangerHint" : "",
                        riskClass(cell),
                      ].join(" ")}
                      onClick={() => openCell(cell.r, cell.c)}
                      onContextMenu={(e) => toggleFlag(e, cell.r, cell.c)}
                      title={generated && riskValue !== undefined ? `Risk: ${riskLabel(riskValue)}` : ""}
                    >
                      {cell.open ? (
                        cell.mine ? "💣" : cell.count || ""
                      ) : cell.flag ? (
                        "🚩"
                      ) : (
                        ""
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <p className="tip">
            Desktop: left click opens, right click flags. iPhone: use Open/Flag mode button.
          </p>

          <div className="adBelow premiumAd">
            <div>
              <p className="adLabel">Sponsored · Free Plan</p>
              <h3>Здесь может стоять реклама для Free users</h3>
              <p>
                Например: coding bootcamps, образовательные курсы, puzzle apps или sponsors.
                В Pro версии эта реклама полностью исчезает.
              </p>
            </div>

            <button className="gold" onClick={() => setShowPro(true)}>
              Remove Ads — Go Pro
            </button>
          </div>
        </section>

        <aside className="side">
          <section className="panel profile">
            <h2>Player</h2>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
            />

            <select
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            >
              {CITIES.map((city) => <option key={city}>{city}</option>)}
            </select>
          </section>

          <section className="panel coach">
            <h2>AI Coach</h2>
            <p>{coachText}</p>
            <div className="legend">
              <span><i className="greenDot" /> safest move</span>
              <span><i className="redDot" /> highest risk</span>
              <span><i className="heatDot" /> heatmap risk</span>
            </div>
          </section>

          <section className="panel proBox">
            <div className="proHead">
              <h2>MineMind Pro</h2>
              <strong>990 ₸/month</strong>
            </div>
            <ul>
              <li>No ads</li>
              <li>Full probability heatmap</li>
              <li>Advanced AI Coach</li>
              <li>Mistake review after game</li>
              <li>Replay analysis</li>
              <li>Premium board skins</li>
              <li>Daily ranking</li>
              <li>City tournaments</li>
            </ul>
            <button className="gold full" onClick={() => setShowPro(true)}>
              Upgrade to Pro
            </button>
          </section>

          <section className="panel">
            <h2>Statistics</h2>
            <div className="stats">
              <div><b>{stats.wins}</b><span>Wins</span></div>
              <div><b>{stats.losses}</b><span>Losses</span></div>
              <div><b>{stats.streak}</b><span>Streak</span></div>
              <div><b>{stats.best[difficulty] || "-"}</b><span>Best</span></div>
            </div>
            <button className="dangerBtn" onClick={resetStats}>Reset Stats</button>
          </section>

          <section className="panel">
            <h2>Achievements</h2>
            {achievements.map((a) => (
              <div className={a.done ? "ach done" : "ach"} key={a.title}>
                <span>{a.done ? "✅" : "🔒"}</span>
                <div>
                  <b>{a.title}</b>
                  <small>{a.desc}</small>
                </div>
              </div>
            ))}
          </section>

          <section className="panel">
            <h2>City Leaderboard</h2>
            {leaderboard.map((p, i) => (
              <div className={p.you ? "leader you" : "leader"} key={i}>
                <span>#{i + 1} {p.name}</span>
                <span>{p.city} · {p.time === 999 ? "-" : `${p.time}s`}</span>
              </div>
            ))}
          </section>

          <div className="adBelow premiumAd sideAd">
            <div>
              <p className="adLabel">Sponsored · Free Plan</p>
              <h3>Ad space</h3>
              <p>Pro users get clean interface without ads.</p>
            </div>
          </div>
        </aside>
      </main>

      {(status === "won" || status === "lost") && (
        <div className="modalBackdrop">
          <div className="modal">
            <h2>{status === "won" ? "🏆 You Won!" : "💥 Game Over"}</h2>
            <p>Time: <b>{seconds}s</b> · Progress: <b>{progress}%</b> · Mode: <b>{mode}</b></p>

            <div className="modalOffer">
              <h3>AI Mistake Review</h3>
              <p>{coachText}</p>
            </div>

            <div className="modalActions">
              <button onClick={() => restart()}>Play Again</button>
              <button onClick={shareResult}>Share Result</button>
              <button className="gold" onClick={() => setShowPro(true)}>View Pro</button>
            </div>
          </div>
        </div>
      )}

      {showPro && (
        <ProModal
          onClose={() => setShowPro(false)}
          onCheckout={() => setShowCheckout(true)}
          setProDemo={setProDemo}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setProDemo(true);
            setShowCheckout(false);
            setShowPro(false);
          }}
        />
      )}
    </div>
  );
}

function ProModal({ onClose, onCheckout, setProDemo }) {
  return (
    <div className="modalBackdrop">
      <div className="modal proModal">
        <button className="close" onClick={onClose}>×</button>
        <p className="badge darkBadge">MineMind Pro</p>
        <h2>990 ₸ / month</h2>
        <p>
          Built for players who want to train logic seriously, remove ads and get advanced analysis.
        </p>

        <div className="proGrid">
          <div>✅ No ads</div>
          <div>✅ Probability heatmap</div>
          <div>✅ Advanced AI Coach</div>
          <div>✅ Mistake review</div>
          <div>✅ Replay analysis</div>
          <div>✅ Premium skins</div>
          <div>✅ Daily ranking</div>
          <div>✅ City tournaments</div>
        </div>

        <button className="gold full" onClick={onCheckout}>
          Demo checkout — 990 ₸/month
        </button>

        <button className="full" onClick={() => setProDemo(true)}>
          Enable Pro Demo
        </button>

        <small>
          Real payment can be integrated later with Stripe, Kaspi or Apple Pay.
        </small>
      </div>
    </div>
  );
}

function CheckoutModal({ onClose, onSuccess }) {
  return (
    <div className="modalBackdrop">
      <div className="modal checkout">
        <button className="close" onClick={onClose}>×</button>
        <h2>Checkout Demo</h2>
        <p>Choose payment method. This is a demo screen for product presentation.</p>

        <div className="payMethods">
          <button>Kaspi Pay</button>
          <button>Apple Pay</button>
          <button>Visa / Mastercard</button>
        </div>

        <button className="gold full" onClick={onSuccess}>
          Confirm Demo Payment
        </button>
      </div>
    </div>
  );
}