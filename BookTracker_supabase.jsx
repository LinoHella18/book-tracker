import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kelnawtkpbczbuqohasm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7EsxMAt2Ab8yZLZHSCZ9Kg_C3ZJRgT0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SAMPLE_BOOKS = [
  { id: 1, title: "The Midnight Library", author: "Matt Haig", status: "finished", added_at: new Date(Date.now() - 86400000 * 10).toISOString(), rating: 4, notes: "Beautiful concept about parallel lives. Cried at the end." },
  { id: 2, title: "Atomic Habits", author: "James Clear", status: "reading", added_at: new Date(Date.now() - 86400000 * 3).toISOString(), rating: 0, notes: "1% better every day. Applying the habit stacking method." },
  { id: 3, title: "Dune", author: "Frank Herbert", status: "planned", added_at: new Date(Date.now() - 86400000).toISOString(), rating: 0, notes: "" },
  { id: 4, title: "Project Hail Mary", author: "Andy Weir", status: "finished", added_at: new Date(Date.now() - 86400000 * 20).toISOString(), rating: 5, notes: "Best sci-fi I've read in years. Rocky 🪨" },
  { id: 5, title: "The Alchemist", author: "Paulo Coelho", status: "planned", added_at: new Date().toISOString(), rating: 0, notes: "" },
  { id: 6, title: "Sapiens", author: "Yuval Noah Harari", status: "finished", added_at: new Date(Date.now() - 86400000 * 40).toISOString(), rating: 5, notes: "Changed how I see everything. Dense but worth it." },
  { id: 7, title: "Deep Work", author: "Cal Newport", status: "finished", added_at: new Date(Date.now() - 86400000 * 55).toISOString(), rating: 4, notes: "Restructured my whole work schedule after this." },
];

const STATUS_CONFIG = {
  reading: { label: "Reading", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" },
  finished: { label: "Finished", color: "#10b981", bg: "rgba(16,185,129,0.12)", dot: "#10b981" },
  planned: { label: "Want to Read", color: "#8b8cf8", bg: "rgba(139,140,248,0.12)", dot: "#8b8cf8" },
};

function getInitials(title) {
  return title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const COVER_COLORS = [
  ["#2d1b69","#f0c040"],["#1a3a2a","#e8c97a"],["#3b1f2b","#f4a261"],
  ["#1c2b4a","#a8dadc"],["#2c2c54","#ff9f43"],["#1b2838","#c9d1d9"],
];

function BookCover({ title, size = 48 }) {
  const idx = title.charCodeAt(0) % COVER_COLORS.length;
  const [bg, fg] = COVER_COLORS[idx];
  return (
    <div style={{
      width: size, height: size * 1.4, borderRadius: 6, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: size * 0.28, fontWeight: 800,
      color: fg, fontFamily: "'Playfair Display', Georgia, serif",
      boxShadow: "2px 4px 12px rgba(0,0,0,0.4)", letterSpacing: "0.02em",
    }}>
      {getInitials(title)}
    </div>
  );
}

function ProgressRing({ value, max, size = 110 }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0c040"
        strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function StarRating({ value = 0, onChange, readonly = false, size = 16 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          onClick={readonly ? undefined : (e) => { e.stopPropagation(); onChange(star === value ? 0 : star); }}
          onMouseEnter={readonly ? undefined : () => setHovered(star)}
          onMouseLeave={readonly ? undefined : () => setHovered(0)}
          style={{
            fontSize: size, cursor: readonly ? "default" : "pointer",
            color: star <= (hovered || value) ? "#f0c040" : "rgba(255,255,255,0.15)",
            transition: "color 0.1s", lineHeight: 1, userSelect: "none",
          }}
        >★</span>
      ))}
    </div>
  );
}

function DuplicateWarning({ duplicate, onAddAnyway, onCancel }) {
  const cfg = STATUS_CONFIG[duplicate.status];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20
    }}>
      <div style={{
        background: "#16192a", border: "1px solid rgba(255,180,0,0.25)", borderRadius: 20,
        padding: 36, width: "100%", maxWidth: 400, textAlign: "center",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#f5f0e8", marginBottom: 12 }}>
          Already on your shelf!
        </h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 20 }}>
          <span style={{ color: "#f5f0e8", fontWeight: 600 }}>"{duplicate.title}"</span> is already in your list as
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: 20, padding: "8px 18px", marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
          <span style={{ color: cfg.color, fontWeight: 700, fontSize: 13 }}>{cfg.label}</span>
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 28 }}>Do you want to add it again anyway?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14,
          }}>Go Back</button>
          <button onClick={onAddAnyway} style={{
            flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(240,192,64,0.15)",
            border: "1px solid rgba(240,192,64,0.3)", color: "#f0c040",
            cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14,
          }}>Add Anyway</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd, books }) {
  const [query, setQuery] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("planned");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [duplicate, setDuplicate] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const searchBooks = (q) => {
    if (!q || q.trim().length < 2) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&printType=books`);
        const data = await res.json();
        const fetched = (data.items || []).map(item => {
          const info = item.volumeInfo || {};
          return { title: info.title || "Unknown Title", author: (info.authors || ["Unknown Author"])[0], year: (info.publishedDate || "").slice(0, 4) };
        });
        setResults(fetched);
        setShowResults(fetched.length > 0);
      } catch { setResults([]); setShowResults(false); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleQueryChange = (e) => { const val = e.target.value; setQuery(val); setSelected(null); setManualAuthor(""); searchBooks(val); };
  const handleSelect = (book) => { setSelected(book); setQuery(book.title); setManualAuthor(book.author); setShowResults(false); setResults([]); };

  const finalTitle = selected?.title || query.trim();
  const finalAuthor = selected?.author || manualAuthor.trim();
  const canAdd = finalTitle.length > 0 && finalAuthor.length > 0;

  const handleSubmit = () => {
    if (!canAdd) return;
    const match = books.find(b => b.title.trim().toLowerCase() === finalTitle.toLowerCase());
    if (match) {
      setDuplicate({ ...match, pendingTitle: finalTitle, pendingAuthor: finalAuthor });
    } else {
      onAdd({ title: finalTitle, author: finalAuthor, status, rating, notes });
      onClose();
    }
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "60px 20px 20px", overflowY: "auto" }} onClick={onClose}>
        <div style={{ background: "#16192a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.7)", animation: "slideUp 0.25s cubic-bezier(.4,0,.2,1)", position: "relative" }} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#f5f0e8", margin: "0 0 6px" }}>Add a Book</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>Search by title, or fill in manually below</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Title</label>
            <div style={{ position: "relative" }}>
              <input autoFocus placeholder="e.g. Atomic Habits, Dune…" value={query} onChange={handleQueryChange}
                onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setShowResults(false); }}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${selected ? "rgba(240,192,64,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "12px 40px 12px 14px", color: "#f5f0e8", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>{searching ? "⏳" : selected ? "✅" : "🔍"}</div>
              {showResults && results.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999, background: "#1e2235", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", overflow: "hidden" }}>
                  {results.map((book, i) => (
                    <div key={i} onMouseDown={e => { e.preventDefault(); handleSelect(book); }}
                      style={{ padding: "12px 16px", cursor: "pointer", borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 12 }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 32, height: 44, borderRadius: 4, flexShrink: 0, background: COVER_COLORS[i % COVER_COLORS.length][0], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: COVER_COLORS[i % COVER_COLORS.length][1], fontFamily: "'Playfair Display', serif" }}>{getInitials(book.title)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f5f0e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{book.author}{book.year ? ` · ${book.year}` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Author</label>
            <input placeholder="e.g. James Clear" value={manualAuthor} onChange={e => { setManualAuthor(e.target.value); setSelected(null); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${manualAuthor && !selected ? "rgba(139,140,248,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "12px 14px", color: "#f5f0e8", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Status</label>
            <div style={{ display: "flex", gap: 10 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setStatus(key)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontFamily: "inherit", border: status === key ? `1.5px solid ${cfg.color}` : "1.5px solid rgba(255,255,255,0.1)", background: status === key ? cfg.bg : "transparent", color: status === key ? cfg.color : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{cfg.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Rating <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StarRating value={rating} onChange={setRating} size={22} />
              {rating > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{rating}/5</span>}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Notes <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thoughts, quotes, why you want to read it…" rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#f5f0e8", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }}
            />
          </div>

          <button disabled={!canAdd} onClick={handleSubmit} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: canAdd ? "#f0c040" : "rgba(255,255,255,0.06)", color: canAdd ? "#1a1610" : "rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 700, cursor: canAdd ? "pointer" : "not-allowed", transition: "all 0.2s", fontFamily: "inherit" }}>
            {canAdd ? `Add "${finalTitle.length > 28 ? finalTitle.slice(0, 28) + "…" : finalTitle}"` : "Enter title and author to add"}
          </button>
        </div>
      </div>
      {duplicate && (
        <DuplicateWarning duplicate={duplicate}
          onAddAnyway={() => { onAdd({ title: duplicate.pendingTitle, author: duplicate.pendingAuthor, status, rating, notes }); onClose(); }}
          onCancel={() => setDuplicate(null)} />
      )}
    </>
  );
}

function EditModal({ book, onClose, onSave }) {
  const [rating, setRating] = useState(book.rating || 0);
  const [notes, setNotes] = useState(book.notes || "");
  const [status, setStatus] = useState(book.status);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#16192a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.7)", animation: "slideUp 0.25s cubic-bezier(.4,0,.2,1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <BookCover title={book.title} size={42} />
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#f5f0e8", margin: 0 }}>{book.title}</h2>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>by {book.author}</div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Status</label>
          <div style={{ display: "flex", gap: 10 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => setStatus(key)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: status === key ? `1.5px solid ${cfg.color}` : "1.5px solid rgba(255,255,255,0.1)", background: status === key ? cfg.bg : "transparent", color: status === key ? cfg.color : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{cfg.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Rating</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StarRating value={rating} onChange={setRating} size={22} />
            {rating > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{rating}/5</span>}
            {rating > 0 && <button onClick={() => setRating(0)} style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>clear</button>}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thoughts, highlights, why it mattered…" rows={4}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#f5f0e8", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancel</button>
          <button onClick={() => { onSave(book.id, { rating, notes, status }); onClose(); }} style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: "#f0c040", border: "none", color: "#1a1610", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15 }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function GoalEditor({ goal, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(goal);
  if (!editing) return <span onClick={() => setEditing(true)} style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", paddingBottom: 1 }}>{goal} books</span>;
  return (
    <span>
      <input type="number" value={val} min={1} max={999} onChange={e => setVal(Number(e.target.value))}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onSave(val); setEditing(false); } }}
        style={{ width: 60, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 8px", color: "#f5f0e8", fontSize: "inherit", textAlign: "center", outline: "none" }}
        autoFocus
      />
      {" books"}
    </span>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color, borderRadius: 4, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function StatsPage({ books }) {
  const finished = books.filter(b => b.status === "finished");
  const reading = books.filter(b => b.status === "reading");
  const planned = books.filter(b => b.status === "planned");
  const rated = finished.filter(b => b.rating > 0);
  const avgRating = rated.length > 0 ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : "—";
  const fiveStars = finished.filter(b => b.rating === 5).length;
  const ratingDist = [5,4,3,2,1].map(r => ({ r, count: finished.filter(b => b.rating === r).length }));
  const maxRatingCount = Math.max(...ratingDist.map(d => d.count), 1);
  const now = Date.now();
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now); d.setMonth(d.getMonth() - (5 - i)); return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() }; });
  const monthCounts = months.map(m => ({ label: m.label, count: books.filter(b => { const d = new Date(b.added_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).length }));
  const maxMonth = Math.max(...monthCounts.map(m => m.count), 1);
  const authorMap = {};
  books.forEach(b => { authorMap[b.author] = (authorMap[b.author] || 0) + 1; });
  const topAuthors = Object.entries(authorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
        {[{ label: "Total Books", value: books.length, icon: "📚", color: "#8b8cf8" }, { label: "Finished", value: finished.length, icon: "✅", color: "#10b981" }, { label: "Avg Rating", value: avgRating, icon: "⭐", color: "#f0c040" }, { label: "5-Star Reads", value: fiveStars, icon: "🏆", color: "#f4a261" }].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 18px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8", marginBottom: 18 }}>Rating Breakdown</div>
          {finished.length === 0 ? <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "20px 0" }}>Finish some books to see ratings</div> : ratingDist.map(({ r, count }) => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#f0c040", fontWeight: 700, width: 14, textAlign: "right", flexShrink: 0 }}>{r}★</span>
              <MiniBar value={count} max={maxRatingCount} color="#f0c040" />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", width: 20, textAlign: "right", flexShrink: 0 }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8", marginBottom: 18 }}>Books Added (6 mo)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {monthCounts.map(({ label, count }) => (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", background: count > 0 ? "rgba(139,140,248,0.7)" : "rgba(255,255,255,0.06)", borderRadius: "4px 4px 0 0", height: `${(count / maxMonth) * 60}px`, minHeight: count > 0 ? 6 : 3, transition: "height 0.5s cubic-bezier(.4,0,.2,1)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8", marginBottom: 16 }}>Shelf Breakdown</div>
        <div style={{ display: "flex", gap: 8, height: 8, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
          {books.length === 0 ? <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 8 }} /> : (<>{finished.length > 0 && <div style={{ flex: finished.length, background: "#10b981" }} />}{reading.length > 0 && <div style={{ flex: reading.length, background: "#f59e0b" }} />}{planned.length > 0 && <div style={{ flex: planned.length, background: "#8b8cf8" }} />}</>)}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[["finished", finished.length, "#10b981", "Finished"], ["reading", reading.length, "#f59e0b", "Reading"], ["planned", planned.length, "#8b8cf8", "Want to Read"]].map(([, count, color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
      {topAuthors.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8", marginBottom: 16 }}>Authors on Your Shelf</div>
          {topAuthors.map(([author, count], i) => (
            <div key={author} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < topAuthors.length - 1 ? 12 : 0 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", width: 16, textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, color: "#f5f0e8", fontWeight: 500 }}>{author}</span>
              <MiniBar value={count} max={topAuthors[0][1]} color="rgba(240,192,64,0.5)" />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", width: 28, textAlign: "right", flexShrink: 0 }}>{count} {count === 1 ? "book" : "books"}</span>
            </div>
          ))}
        </div>
      )}
      {rated.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f0e8", marginBottom: 16 }}>Top Rated</div>
          {[...rated].sort((a, b) => b.rating - a.rating).slice(0, 5).map((book, i) => (
            <div key={book.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < Math.min(rated.length, 5) - 1 ? 12 : 0 }}>
              <BookCover title={book.title} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f5f0e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{book.author}</div>
              </div>
              <StarRating value={book.rating} readonly size={13} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(() => Number(localStorage.getItem("booktracker_goal")) || 24);
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [filter, setFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [view, setView] = useState("shelf");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("added");

  // Load books from Supabase on mount
  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase.from("books").select("*").order("added_at", { ascending: false });
      if (error) {
        console.error("Error fetching books:", error);
        setBooks(SAMPLE_BOOKS); // fallback to sample data
      } else if (data.length === 0) {
        setBooks(SAMPLE_BOOKS); // show sample data if empty
      } else {
        setBooks(data);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  useEffect(() => { localStorage.setItem("booktracker_goal", goal); }, [goal]);

  const addBook = async (form) => {
    const { data, error } = await supabase.from("books").insert([{ title: form.title, author: form.author, status: form.status, rating: form.rating, notes: form.notes }]).select();
    if (error) { console.error("Error adding book:", error); return; }
    setBooks(p => [data[0], ...p]);
  };

  const updateBook = async (id, changes) => {
    const { error } = await supabase.from("books").update(changes).eq("id", id);
    if (error) { console.error("Error updating book:", error); return; }
    setBooks(p => p.map(b => b.id === id ? { ...b, ...changes } : b));
  };

  const toggleStatus = async (id) => {
    const order = ["planned", "reading", "finished"];
    const book = books.find(b => b.id === id);
    const newStatus = order[(order.indexOf(book.status) + 1) % 3];
    const { error } = await supabase.from("books").update({ status: newStatus }).eq("id", id);
    if (error) { console.error("Error toggling status:", error); return; }
    setBooks(p => p.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const deleteBook = async (id) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) { console.error("Error deleting book:", error); return; }
    setBooks(p => p.filter(b => b.id !== id));
    setDeleteId(null);
  };

  const finished = books.filter(b => b.status === "finished").length;
  const reading = books.filter(b => b.status === "reading").length;
  const planned = books.filter(b => b.status === "planned").length;
  const pct = goal > 0 ? Math.round((finished / goal) * 100) : 0;
  const year = new Date().getFullYear();

  let displayed = filter === "all" ? books : books.filter(b => b.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    displayed = displayed.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }
  displayed = [...displayed].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "author") return a.author.localeCompare(b.author);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return new Date(b.added_at) - new Date(a.added_at);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0e1018; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        textarea { color-scheme: dark; }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .book-card:hover { background: rgba(255,255,255,0.06) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0e1018", fontFamily: "'DM Sans', sans-serif", color: "#f5f0e8", padding: "32px 20px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#f0c040", marginBottom: 6 }}>📚 My Reading</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, lineHeight: 1.1, color: "#f5f0e8" }}>Bookshelf {year}</h1>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 4, gap: 4 }}>
                {[["shelf","📚 Shelf"],["stats","📊 Stats"]].map(([v, label]) => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: view === v ? "rgba(255,255,255,0.12)" : "transparent", color: view === v ? "#f5f0e8" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{label}</button>
                ))}
              </div>
              <button onClick={() => setShowModal(true)} style={{ background: "#f0c040", color: "#1a1610", border: "none", borderRadius: 12, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(240,192,64,0.3)", flexShrink: 0 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Book
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 32, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 32px", alignItems: "center" }}>
            <div style={{ position: "relative", width: 110, height: 110 }}>
              <ProgressRing value={finished} max={goal} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 800, color: "#f0c040", lineHeight: 1 }}>{pct}%</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginTop: 2 }}>done</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{year} Goal · <GoalEditor goal={goal} onSave={setGoal} /></div>
              <div style={{ fontSize: "clamp(14px,2.5vw,18px)", fontWeight: 500, color: "#f5f0e8", marginBottom: 20 }}>{finished} of {goal} books read {finished >= goal ? "🎉" : `· ${goal - finished} to go`}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[["reading", reading, "📖"], ["finished", finished, "✅"], ["planned", planned, "🔖"]].map(([status, count, icon]) => (
                  <div key={status} style={{ background: STATUS_CONFIG[status].bg, border: `1px solid ${STATUS_CONFIG[status].color}30`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: STATUS_CONFIG[status].color }}>{count}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{STATUS_CONFIG[status].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)", fontSize: 15 }}>Loading your books...</div>
          ) : view === "stats" ? (
            <StatsPage books={books} />
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 200px" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", color: "rgba(255,255,255,0.3)" }}>🔍</span>
                  <input placeholder="Search title or author…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px 9px 36px", color: "#f5f0e8", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                  />
                  {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14 }}>✕</button>}
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                  <option value="added">Sort: Recently Added</option>
                  <option value="title">Sort: Title A–Z</option>
                  <option value="author">Sort: Author A–Z</option>
                  <option value="rating">Sort: Highest Rated</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[["all", `All (${books.length})`], ["reading", "Reading"], ["finished", "Finished"], ["planned", "Want to Read"]].map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(key)} style={{ padding: "8px 18px", borderRadius: 30, border: filter === key ? `1.5px solid ${key === "all" ? "#f0c040" : STATUS_CONFIG[key]?.color}` : "1.5px solid rgba(255,255,255,0.1)", background: filter === key ? (key === "all" ? "rgba(240,192,64,0.1)" : STATUS_CONFIG[key]?.bg) : "transparent", color: filter === key ? (key === "all" ? "#f0c040" : STATUS_CONFIG[key]?.color) : "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {displayed.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)", fontSize: 15 }}>
                    {search ? `No books match "${search}"` : "No books here yet. Add one! 📚"}
                  </div>
                )}
                {displayed.map(book => {
                  const cfg = STATUS_CONFIG[book.status];
                  return (
                    <div key={book.id} className="book-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, transition: "all 0.15s", position: "relative", animation: "fadeIn 0.2s ease", cursor: "default" }}>
                      <BookCover title={book.title} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#f5f0e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{book.author}</div>
                        {book.rating > 0 && <div style={{ marginTop: 5 }}><StarRating value={book.rating} readonly size={12} /></div>}
                        {book.notes && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%" }}>{book.notes}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => toggleStatus(book.id)} title="Cycle status" style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${cfg.color}40`, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />{cfg.label}
                        </button>
                        <button onClick={() => setEditBook(book)} title="Edit" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 10px", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 13 }}>✏️</button>
                        <button onClick={() => setDeleteId(book.id)} title="Remove" style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.18)", borderRadius: 8, padding: "7px 10px", color: "rgba(255,100,100,0.7)", cursor: "pointer", fontSize: 13 }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {deleteId && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
              <div style={{ background: "#16192a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, maxWidth: 320, width: "100%", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
                <p style={{ fontSize: 15, marginBottom: 24, color: "rgba(255,255,255,0.7)" }}>Remove this book from your shelf?</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancel</button>
                  <button onClick={() => deleteBook(deleteId)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff6464", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Remove</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 48, fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
            Click a status badge to cycle · ✏️ to edit rating & notes · 📊 for your reading stats
          </div>
        </div>
      </div>

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={addBook} books={books} />}
      {editBook && <EditModal book={editBook} onClose={() => setEditBook(null)} onSave={updateBook} />}
    </>
  );
}
