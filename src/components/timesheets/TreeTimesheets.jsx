import React, { useEffect, useRef, useState } from 'react';
import { Data } from "../mock_dataset/Data_admin_treetimesheet";
import { ChevronRight, Calendar, Briefcase, ChevronLeft, ChevronDown } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gettotal(node) {
  if (node.children.length === 0) return node.hours ?? 0;
  return node.children.reduce((sum, child) => sum + gettotal(child), 0);
}

function fmthrs(n) {
  return Number.isFinite(n) ? `${n % 1 === 0 ? n + ".0" : n}hrs` : "-";
}

const AVATAR_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function avatarcolor(name) {
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("");
}

const BADGE_COLORS = {
  Bug:     { text: "#791F1F", bg: "#FCEBEB", border: "#F5CECE" },
  Feature: { text: "#085041", bg: "#E1F5EE", border: "#B6E8D5" },
  Review:  { text: "#3C3489", bg: "#EEEDFE", border: "#C9C7F5" },
};

// ─── Row components ───────────────────────────────────────────────────────────
function weekrow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  return (
    <div
      onClick={Ontoggle}
      className="flex items-center gap-2.5 px-4 py-[11px] bg-[#F8F8FB] border-b border-[#E8E8F0] cursor-pointer select-none hover:bg-slate-100"
    >
      <span
        className="text-[#888] inline-block transition-transform duration-150"
        style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        <ChevronRight size={10} />
      </span>
      <span className="text-sm"><Briefcase size={10} /></span>
      <span className="text-[13px] font-medium text-[#1A1A2E] flex-1">{node.label}</span>
      <span className="text-xs font-semibold text-[#3C3489] bg-[#EEEDFE] px-3 py-[3px] rounded-full">
        {fmthrs(total)}
      </span>
    </div>
  );
}

function projectrow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  return (
    <div
      onClick={Ontoggle}
      className="flex items-center gap-2.5 px-4 py-[11px] bg-[#F8F8FB] border-b border-[#E8E8F0] cursor-pointer select-none hover:bg-slate-100"
    >
      <span
        className="text-[#888] inline-block transition-transform duration-150"
        style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        <ChevronRight size={10} />
      </span>
      <span className="text-[15px]"><Calendar size={10} /></span>
      <span className="text-sm font-semibold text-[#1A1A2E] flex-1">{node.label}</span>
      <span className="text-xs font-semibold text-[#3C3489] bg-[#EEEDFE] px-3 py-[3px] rounded-full">
        {fmthrs(total)}
      </span>
    </div>
  );
}

function personrow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  const color = avatarcolor(node.label);
  return (
    <div
      onClick={Ontoggle}
      className="flex items-center gap-2.5 px-4 py-[11px] bg-[#F8F8FB] border-b border-[#E8E8F0] cursor-pointer select-none hover:bg-slate-100"
    >
      <span
        className="text-[#888] inline-block transition-transform duration-150"
        style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        <ChevronRight size={10} />
      </span>
      <span
        className="w-[26px] h-[26px] rounded-full text-white flex items-center justify-center text-[10px] font-semibold shrink-0"
        style={{ background: color }}
      >
        {initials(node.label)}
      </span>
      <span className="text-[15px]"><Calendar size={10} /></span>
      <span className="text-[13px] text-[#1A1A2E] flex-1">
        {node.label}{" "}
        <span className="text-[11px] text-[#888]">{node.role}</span>
      </span>
      <span className="text-xs text-[#666]">{fmthrs(total)}</span>
    </div>
  );
}

function entryrow({ node }) {
  const badge = BADGE_COLORS[node.entryType] ?? BADGE_COLORS.Feature;
  return (
    <div className="grid gap-1 px-4 py-2 pl-[66px] border-b border-[#EFEFEF] bg-white hover:bg-slate-100"
      style={{ gridTemplateColumns: "1fr 72px 72px 80px" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-[#888] shrink-0">{node.date}</span>
        <span
          className="text-[10px] font-medium px-[7px] py-[1px] rounded-full shrink-0"
          style={{ color: badge.text, background: badge.bg, border: `1px solid ${badge.border}` }}
        >
          {node.entryType}
        </span>
        <span className="text-xs font-medium text-[#3C3489] overflow-hidden text-ellipsis whitespace-nowrap">
          {node.task}
        </span>
      </div>
      <span className="text-xs text-[#666] text-center">{node.start}</span>
      <span className="text-xs text-[#666] text-center">{node.end}</span>
      <span className="text-xs font-semibold text-[#1A1A2E] text-right">{fmthrs(node.hours)}</span>
    </div>
  );
}

// ─── Tree node ────────────────────────────────────────────────────────────────
function Treenode({ node, depth = 0, coloridx = 0, openmap, setopenmap }) {
  const isopen = openmap[node.id] ?? false;
  const haschildren = node.children?.length > 0;
  const toggle = () => setopenmap(prev => ({ ...prev, [node.id]: !isopen }));

  const rowprops = { node, isopen, Ontoggle: toggle, coloridx, depth };
  const Row = { week: weekrow, project: projectrow, person: personrow, entry: entryrow }[node.type];

  return (
    <div>
      <Row {...rowprops} />
      {isopen && haschildren && node.children.map((child, i) => (
        <Treenode
          key={child.id}
          node={child}
          depth={depth + 1}
          coloridx={node.type === "week" ? i : coloridx}
          openmap={openmap}
          setopenmap={setopenmap}
        />
      ))}
    </div>
  );
}

// ─── Collect all node IDs ─────────────────────────────────────────────────────
function collectids(node) {
  const ids = [node.id];
  for (const c of node.children) ids.push(...collectids(c));
  return ids;
}

// ─── Column header ────────────────────────────────────────────────────────────
function Colheader() {
  return (
    <div className="grid gap-1 px-4 py-2 bg-[#F8F8FB] border-b border-[#E0E0EB]"
      style={{ gridTemplateColumns: "1fr 72px 72px 80px" }}
    >
      {[["Date/Name/Task","text-left"],["Start","text-center"],["End","text-center"],["Hours","text-right"]].map(([label, align]) => (
        <span key={label} className={`text-[11px] font-medium text-[#999] uppercase tracking-wider ${align}`}>
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Weeks dropdown ───────────────────────────────────────────────────────────
function WeeksDropdown({ weeks, selectedIds, onToggle, customDate, onCustomDate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 hover:bg-slate-100 py-1.5 bg-white border border-[#E0E0EB] rounded-lg text-[13px] font-medium text-[#1A1A2E] cursor-pointer"
      >
        <Calendar size={13} color="#6366F1" />
        Weeks Displayed ({selectedIds.length})
        <ChevronDown
          size={13}
          color="#888"
          className="transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-white rounded-xl pt-3 min-w-[240px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E0E0EB]">
          <div className="text-[10px] font-bold text-[#888] tracking-widest px-3.5 pb-2">
            SELECT WEEKS TO AUDIT
          </div>
          <div className="max-h-[200px] overflow-y-auto border-b border-[#E8E8F0]">
            {weeks.map(w => (
              <label
                key={w.id}
                className={`flex items-center gap-2.5 px-3.5 py-[9px] cursor-pointer text-[13px] ${selectedIds.includes(w.id) ? "text-[#1A1A2E]" : "text-[#9999BB]"}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(w.id)}
                  onChange={() => onToggle(w.id)}
                  className="w-3.5 h-3.5 accent-indigo-500"
                />
                <span>{w.label}</span>
              </label>
            ))}
          </div>
          <div className="px-3.5 py-2.5">
            <div className="text-[10px] font-bold text-[#888] tracking-wider mb-1.5">PICK CUSTOM DATE:</div>
            <input
              type="date"
              value={customDate}
              onChange={e => onCustomDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-[#E0E0EB] rounded-md text-[#555] text-[13px] box-border"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ weeks, selectedIds, onToggleWeek, customDate, onCustomDate, currentIdx, onPrev, onNext, onExpandAll, onCollapseAll }) {

  const iconBtn = "p-1.5 bg-white border border-[#E0E0EB] rounded-lg cursor-pointer flex items-center justify-center";

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-[#E0E0EB]">
      <button onClick={onPrev} disabled={currentIdx <= 0} className={`${iconBtn} ${currentIdx <= 0 ? "opacity-40" : ""} hover:bg-slate-100`}>
        <ChevronLeft size={14} />
      </button>
      <button onClick={onNext} disabled={currentIdx >= weeks.length - 1} className={`${iconBtn} ${currentIdx >= weeks.length - 1 ? "opacity-40" : ""} hover:bg-slate-100`}>
        <ChevronRight size={14} />
      </button>

      <WeeksDropdown
        weeks={weeks}
        selectedIds={selectedIds}
        onToggle={onToggleWeek}
        customDate={customDate}
        onCustomDate={onCustomDate}
      />

      <div className="flex-1" />

      <button onClick={onExpandAll} className="px-3.5 hover:bg-slate-100 py-1.5 bg-white border border-[#E0E0EB] rounded-lg text-[13px] font-medium text-[#1A1A2E] cursor-pointer">Expand All</button>
      <button onClick={onCollapseAll} className="px-3.5 hover:bg-slate-100 py-1.5 bg-white border border-[#E0E0EB] rounded-lg text-[13px] font-medium text-[#1A1A2E] cursor-pointer">Collapse All</button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function TreeTimesheets({ data = Data }) {
  const weeks = Array.isArray(data) ? data : [data];

  const [selectedids, setselectedids] = useState(weeks.map(w => w.id));
  const [currentidx, setcurrentidx] = useState(0);
  const [openmap, setopenmap] = useState({});
  const [customdate, setcustomdate] = useState("");

  const toggleweek = (id) =>
    setselectedids(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const visibleweeks = weeks.filter(w => selectedids.includes(w.id));
  const allvisibleids = visibleweeks.flatMap(w => collectids(w));

  const expandall = () => {
    const map = {};
    allvisibleids.forEach(id => { map[id] = true; });
    setopenmap(map);
  };

  const collapseall = () => {
    const map = {};
    allvisibleids.forEach(id => { map[id] = false; });
    setopenmap(map);
  };

  const focusedweekref = useRef(null);
  const onprev = () => setcurrentidx(i => Math.max(0, i - 1));
  const onnext = () => setcurrentidx(i => Math.min(weeks.length - 1, i + 1));

  useEffect(() => {
    const targetid = weeks[currentidx]?.id;
    if (!targetid) return;
    if (!selectedids.includes(targetid)) setselectedids(prev => [...prev, targetid]);
    setTimeout(() => {
      if (focusedweekref.current) focusedweekref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [currentidx]);

  return (
    <div className="font-sans border border-[#E0E0EB] rounded-xl text-[13px] bg-white">
      <Toolbar
        weeks={weeks}
        selectedIds={selectedids}
        onToggleWeek={toggleweek}
        customDate={customdate}
        onCustomDate={setcustomdate}
        currentIdx={currentidx}
        onPrev={onprev}
        onNext={onnext}
        onExpandAll={expandall}
        onCollapseAll={collapseall}
      />
      <Colheader />

      {/* Separate overflow wrapper so the toolbar dropdown isn't clipped */}
      <div className="overflow-hidden rounded-b-xl">
        {visibleweeks.length === 0 && (
          <div className="px-4 py-8 text-center text-[#999] text-[13px]">
            No weeks selected. Use the dropdown to pick weeks.
          </div>
        )}
        {visibleweeks.map((week, i) => (
          <div
            key={week.id}
            ref={week.id === weeks[currentidx]?.id ? focusedweekref : null}
          >
            <Treenode
              node={week}
              depth={0}
              coloridx={i}
              openmap={openmap}
              setopenmap={setopenmap}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
