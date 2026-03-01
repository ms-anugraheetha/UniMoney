import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";

/* ─── DESIGN TOKENS ──────────────────────────────────────────────── */
const C = {
  bg:      "#fafaf8",
  surface: "#ffffff",
  border:  "#e8e8e4",
  border2: "#f2f2ef",
  text:    "#18181b",
  sub:     "#71717a",
  muted:   "#a1a1aa",
  green:   "#15803d",
  greenLt: "#f0fdf4",
  greenBd: "#bbf7d0",
  amber:   "#b45309",
  amberLt: "#fffbeb",
  amberBd: "#fde68a",
  red:     "#b91c1c",
  redLt:   "#fef2f2",
  redBd:   "#fecaca",
  blue:    "#1d4ed8",
  blueLt:  "#eff6ff",
  blueBd:  "#bfdbfe",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";

const CATEGORIES = ["Food & Drinks","Transport","Housing","Education","Entertainment","Health","Shopping","Utilities","Other"];
const CAT_COLORS = ["#15803d","#1d4ed8","#7c3aed","#b45309","#db2777","#0891b2","#dc2626","#ea580c","#71717a"];
const CAT_ICONS  = {"Food & Drinks":"🍕","Transport":"🚌","Housing":"🏠","Education":"📚","Entertainment":"🎬","Health":"💊","Shopping":"🛍️","Utilities":"💡","Other":"📦"};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── USER REGISTRY ──────────────────────────────────────────────── */
const REGISTRY = [];

const gid = () => Math.random().toString(36).substr(2,9);

/* ─── VALIDATION ─────────────────────────────────────────────────── */
const V = {
  name:     v => !v.trim() ? "Full name is required" : null,
  email:    v => !v.trim() ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : null,
  username: v => !v.trim() ? "Username is required" : v.length < 3 ? "Min 3 characters" : !/^[a-zA-Z0-9_]+$/.test(v) ? "Letters, numbers, underscores only" : null,
  password: v => !v ? "Password is required" : v.length < 8 ? "Min 8 characters" : !/[A-Z]/.test(v) ? "Must have an uppercase letter" : !/[0-9]/.test(v) ? "Must have a number" : null,
};

const pwStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
};

/* ─── TIME ───────────────────────────────────────────────────────── */
const now = new Date();
const TMK = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

/* ─── NUDGE ENGINE ───────────────────────────────────────────────── */
function getNudges(expenses, budget, splits) {
  const msgs = [];
  const tm = expenses.filter(e => e.date.startsWith(TMK));
  const spent = tm.reduce((s,e)=>s+e.amount,0);
  const pct = budget > 0 ? (spent/budget)*100 : 0;
  const expectedPct = (now.getDate()/28)*100;
  if (budget > 0 && pct > expectedPct + 15) msgs.push({ type:"warning", msg:`You're ahead of pace — ${pct.toFixed(0)}% of budget used by day ${now.getDate()}.` });
  const food = tm.filter(e=>e.category==="Food & Drinks").reduce((s,e)=>s+e.amount,0);
  if (budget > 0 && food > budget * 0.30) msgs.push({ type:"warning", msg:`Food spending is ${((food/budget)*100).toFixed(0)}% of your budget this month.` });
  const unpaid = splits.filter(s=>s.members.find(m=>m.name==="You"&&!m.paid));
  if (unpaid.length) msgs.push({ type:"info", msg:`You have ${unpaid.length} unpaid bill${unpaid.length>1?"s":""} in Rent & Bills.` });
  if (budget > 0 && pct < 50 && now.getDate() > 14 && spent > 0) msgs.push({ type:"success", msg:`Solid — halfway through the month and only at ${pct.toFixed(0)}% of your budget.` });
  return msgs.slice(0,2);
}

/* ─── GLOBAL STYLES ───────────────────────────────────────────────── */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%}
    body{background:${C.bg};color:${C.text};font-family:${FB};font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
    button,input,select{font-family:${FB};outline:none}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:#e4e4e0;border-radius:2px}
    .pg{animation:pgIn .25s ease}
    @keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .toast{animation:toastIn .3s cubic-bezier(.175,.885,.32,1.275)}
    @keyframes toastIn{from{opacity:0;transform:translateX(24px) scale(.95)}to{opacity:1;transform:translateX(0) scale(1)}}
    .modal{animation:modalIn .22s cubic-bezier(.175,.885,.32,1.275)}
    @keyframes modalIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
    .stat-card{transition:transform .18s,box-shadow .18s!important}
    .stat-card:hover{transform:translateY(-3px)!important;box-shadow:0 8px 28px rgba(0,0,0,.08)!important}
    .fade-in{animation:fadeIn .2s ease}
    @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .nav-btn:hover{background:${C.bg}!important;color:${C.text}!important}
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
    input[type=date]::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer}
  `}</style>
);

/* ─── PRIMITIVES ─────────────────────────────────────────────────── */
const Field = ({ label, hint, error, children }) => (
  <div style={{marginBottom:15}}>
    {(label||hint) && (
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        {label && <label style={{fontSize:11,fontWeight:500,color:C.sub,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}
        {hint  && <span style={{fontSize:11,color:C.muted}}>{hint}</span>}
      </div>
    )}
    {children}
    {error && <div style={{fontSize:11,color:C.red,marginTop:3,animation:"fadeIn .15s"}}>{error}</div>}
  </div>
);

const Inp = ({ error, ...p }) => (
  <input {...p} style={{width:"100%",background:C.surface,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,transition:"border .15s,box-shadow .15s",...p.style}}
    onFocus={e=>{e.target.style.borderColor=error?C.red:C.text;e.target.style.boxShadow=`0 0 0 3px ${error?"rgba(185,28,28,.08)":"rgba(24,24,27,.06)"}`}}
    onBlur={e=>{e.target.style.borderColor=error?C.red:C.border;e.target.style.boxShadow="none"}}
  />
);

const Sel = ({ children, ...p }) => (
  <select {...p} style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontSize:14,cursor:"pointer",...p.style}}>
    {children}
  </select>
);

const Btn = ({ children, v="primary", sm, full, ...p }) => {
  const vs = {
    primary:{background:C.text,    color:"#fff",    border:"none"},
    outline:{background:"transparent",color:C.text, border:`1.5px solid ${C.border}`},
    ghost:  {background:"transparent",color:C.sub,  border:"none"},
    danger: {background:C.redLt,   color:C.red,     border:`1.5px solid ${C.redBd}`},
    green:  {background:C.green,   color:"#fff",    border:"none"},
  };
  return (
    <button {...p} style={{...vs[v],padding:sm?"6px 12px":"9px 18px",fontSize:sm?12:14,borderRadius:sm?7:10,fontWeight:500,display:"inline-flex",alignItems:"center",gap:5,width:full?"100%":undefined,justifyContent:full?"center":undefined,transition:"opacity .15s,transform .12s,box-shadow .15s",cursor:"pointer",...p.style}}
      onMouseEnter={e=>{e.currentTarget.style.opacity=".82";if(v==="primary")e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.18)"}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.boxShadow="none"}}
      onMouseDown={e=>e.currentTarget.style.transform="scale(.96)"}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
    >{children}</button>
  );
};

const Card = ({ children, style, className }) => (
  <div className={className} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,...style}}>{children}</div>
);

const Tag = ({ children, color=C.sub }) => (
  <span style={{background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{children}</span>
);

const Alert = ({ msg, type="info" }) => {
  const map = {warning:[C.amberLt,C.amberBd,C.amber,"⚠"],success:[C.greenLt,C.greenBd,C.green,"✓"],info:[C.blueLt,C.blueBd,C.blue,"ℹ"],error:[C.redLt,C.redBd,C.red,"✕"]};
  const [bg,bd,col,icon] = map[type]||map.info;
  return (
    <div style={{background:bg,border:`1px solid ${bd}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:col,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:14,flexShrink:0}}>{icon}</span>{msg}
    </div>
  );
};

const Toast = ({ msg, type="success" }) => {
  const map = {success:[C.greenLt,C.greenBd,C.green,"✓"],warning:[C.amberLt,C.amberBd,C.amber,"⚠"],error:[C.redLt,C.redBd,C.red,"✕"],info:["#f8f8f6",C.border,C.sub,"ℹ"]};
  const [bg,bd,col,icon] = map[type]||map.info;
  return (
    <div className="toast" style={{position:"fixed",top:20,right:20,zIndex:9999,background:bg,border:`1px solid ${bd}`,borderRadius:12,padding:"12px 16px",maxWidth:320,fontSize:13,fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,.10)",display:"flex",alignItems:"center",gap:9}}>
      <span style={{color:col,fontSize:15,flexShrink:0}}>{icon}</span>
      <span>{msg}</span>
    </div>
  );
};

const Modal = ({ open, onClose, title, width=460, children }) => {
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.28)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div className="modal" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:`min(${width}px,100%)`,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.13)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontFamily:FD,fontSize:20,fontWeight:600}}>{title}</h3>
          <button onClick={onClose} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.muted,fontSize:14,cursor:"pointer",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,transition:"background .15s,color .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#fee2e2";e.currentTarget.style.color=C.red}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.muted}}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── PASSWORD STRENGTH BAR ──────────────────────────────────────── */
const StrengthBar = ({ pw }) => {
  const s = pwStrength(pw);
  const labels = ["","Weak","Fair","Good","Strong"];
  const colors = ["","#dc2626","#f59e0b","#3b82f6","#15803d"];
  if (!pw) return null;
  const hints = [
    !pw             && "password",
    pw.length < 8   && "8+ chars",
    !/[A-Z]/.test(pw) && "uppercase",
    !/[0-9]/.test(pw) && "number",
  ].filter(Boolean);
  return (
    <div style={{marginTop:6}}>
      <div style={{display:"flex",gap:3,marginBottom:4}}>
        {[1,2,3,4].map(n=>(
          <div key={n} style={{flex:1,height:3,borderRadius:2,background:n<=s?colors[s]:C.border2,transition:"background .3s"}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
        <span style={{color:colors[s],fontWeight:500}}>{labels[s]}</span>
        {hints.length>0&&<span style={{color:C.muted}}>needs: {hints.join(", ")}</span>}
      </div>
    </div>
  );
};

/* ─── PW INPUT WITH TOGGLE ───────────────────────────────────────── */
const PwInp = ({ value, onChange, show, onToggle, placeholder="••••••••", onKeyDown, error }) => (
  <div style={{position:"relative"}}>
    <Inp
      type={show?"text":"password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      error={error}
      onKeyDown={onKeyDown}
      style={{paddingRight:42}}
    />
    <button
      type="button"
      onClick={onToggle}
      style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:15,padding:0,lineHeight:1,display:"flex",alignItems:"center"}}
      tabIndex={-1}
    >
      {show ? "🙈" : "👁"}
    </button>
  </div>
);

/* ─── AUTH ────────────────────────────────────────────────────────── */
const Auth = ({ onLogin }) => {
  const [mode, setMode]       = useState("login");
  const [f, setF]             = useState({ name:"", email:"", username:"", password:"", confirm:"" });
  const [errs, setErrs]       = useState({});
  const [serverErr, setServerErr] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);

  const set = (k,v) => { setF(p=>({...p,[k]:v})); setErrs(p=>({...p,[k]:undefined})); setServerErr(""); };

  const switchMode = (m) => {
    setMode(m);
    setErrs({});
    setServerErr("");
    setF({ name:"", email:"", username:"", password:"", confirm:"" });
    setShowPw(false);
    setShowCf(false);
  };

  const submit = () => {
    setServerErr("");
    if (mode==="login") {
      const u = REGISTRY.find(u=>(u.username===f.username||u.email===f.username)&&u.password===f.password);
      if (!u) { setServerErr("Incorrect username/email or password."); return; }
      onLogin(u);
    } else {
      const e = {};
      const ne=V.name(f.name);         if(ne) e.name=ne;
      const ee=V.email(f.email);       if(ee) e.email=ee;
      const ue=V.username(f.username); if(ue) e.username=ue;
      const pe=V.password(f.password); if(pe) e.password=pe;
      if (f.password!==f.confirm)      e.confirm="Passwords do not match";
      if (Object.keys(e).length) { setErrs(e); return; }
      if (REGISTRY.find(u=>u.username===f.username)) { setServerErr("Username is already taken."); return; }
      if (REGISTRY.find(u=>u.email===f.email))       { setServerErr("An account with this email already exists."); return; }
      const nu = { username:f.username, email:f.email, password:f.password, name:f.name };
      REGISTRY.push(nu);
      onLogin(nu);
    }
  };

  const pwMatch = mode==="register" && f.confirm && f.password===f.confirm;

  return (
    <div style={{minHeight:"100vh",display:"flex",background:C.bg}}>
      {/* Form side */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div style={{width:"min(400px,100%)"}}>
          <div style={{marginBottom:30}}>
            <div style={{fontFamily:FD,fontSize:34,fontWeight:700,letterSpacing:"-0.5px",marginBottom:4}}>UniMoney</div>
            <div style={{color:C.sub,fontSize:14}}>University finance, simplified</div>
          </div>

          <Card style={{padding:28,boxShadow:"0 4px 24px rgba(0,0,0,.06)"}}>
            {/* Tab switcher */}
            <div style={{display:"flex",background:C.bg,borderRadius:10,padding:3,marginBottom:24}}>
              {[["login","Sign In"],["register","Create Account"]].map(([m,l])=>(
                <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",fontFamily:FB,fontWeight:mode===m?600:400,fontSize:13,color:mode===m?C.text:C.sub,background:mode===m?C.surface:"transparent",boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.09)":"none",cursor:"pointer",transition:"all .18s"}}>
                  {l}
                </button>
              ))}
            </div>

            <div className="fade-in" key={mode}>
              {mode==="register" && (
                <Field label="Full Name" error={errs.name}>
                  <Inp placeholder="Jane Smith" value={f.name} onChange={e=>set("name",e.target.value)} error={errs.name}/>
                </Field>
              )}
              {mode==="register" && (
                <Field label="University Email" error={errs.email}>
                  <Inp type="email" placeholder="jane@university.edu" value={f.email} onChange={e=>set("email",e.target.value)} error={errs.email}/>
                </Field>
              )}

              <Field label={mode==="login"?"Username or Email":"Username"} error={errs.username}>
                <Inp
                  placeholder={mode==="login"?"username or email":"e.g. jane_smith"}
                  value={f.username}
                  onChange={e=>set("username",e.target.value)}
                  error={errs.username}
                />
                {mode==="register"&&!errs.username&&f.username.length>=3&&(
                  <div style={{fontSize:11,color:C.green,marginTop:3}}>✓ Looks good</div>
                )}
                {mode==="register"&&!errs.username&&(
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>Letters, numbers and underscores only</div>
                )}
              </Field>

              <Field label="Password" hint={mode==="register"?"8+ chars · uppercase · number":""} error={errs.password}>
                <PwInp
                  value={f.password}
                  onChange={e=>set("password",e.target.value)}
                  show={showPw}
                  onToggle={()=>setShowPw(p=>!p)}
                  error={errs.password}
                  onKeyDown={e=>e.key==="Enter"&&mode==="login"&&submit()}
                />
                {mode==="register" && <StrengthBar pw={f.password}/>}
              </Field>

              {mode==="register" && (
                <Field label="Confirm Password" error={errs.confirm}>
                  <PwInp
                    value={f.confirm}
                    onChange={e=>set("confirm",e.target.value)}
                    show={showCf}
                    onToggle={()=>setShowCf(p=>!p)}
                    error={errs.confirm}
                    onKeyDown={e=>e.key==="Enter"&&submit()}
                  />
                  {pwMatch && <div style={{fontSize:11,color:C.green,marginTop:3}}>✓ Passwords match</div>}
                </Field>
              )}

              {serverErr && <Alert msg={serverErr} type="error"/>}

              <Btn full onClick={submit} style={{marginTop:6,height:42}}>
                {mode==="login" ? "Sign In →" : "Create Account →"}
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Right panel */}
      <div style={{width:360,background:"#18181b",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:44,backgroundImage:"radial-gradient(ellipse at 70% 0%,#27272a 0%,#18181b 65%)"}}>
        <div style={{marginBottom:28}}>
          <div style={{width:36,height:3,background:"#4ade80",borderRadius:2,marginBottom:20}}/>
          <blockquote style={{color:"#fff",fontFamily:FD,fontSize:22,lineHeight:1.45,marginBottom:12,fontStyle:"italic"}}>
            "Finally stopped guessing where my money went."
          </blockquote>
          <div style={{color:"#52525b",fontSize:13}}>— CS student, 2nd year</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {[["◉","Track any expense in seconds"],["◎","Split rent with roommates"],["◈","Smart nudges when you overspend"]].map(([icon,t])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:12,color:"#a1a1aa",fontSize:13}}>
              <span style={{color:"#4ade80",fontSize:16,flexShrink:0}}>{icon}</span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN APP ───────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget]     = useState(0);
  const [splits, setSplits]     = useState([]);
  const [toast, setToast]       = useState(null);

  // Expense modal
  const [expModal, setExpModal] = useState(false);
  const [editExp, setEditExp]   = useState(null);
  const [ef, setEf]             = useState({ title:"", amount:"", category:"Food & Drinks", date:now.toISOString().split("T")[0] });
  const [efErr, setEfErr]       = useState({});

  // Budget modal
  const [budgetModal, setBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  // Split modal
  const [splitModal, setSplitModal] = useState(false);
  const [editSplit, setEditSplit]   = useState(null);
  const [sf, setSf] = useState({ title:"", totalAmount:"", dueDate:"", mode:"equal", members:[{name:"You",amount:"",paid:false},{name:"",amount:"",paid:false}] });
  const [sfErr, setSfErr] = useState({});

  // Filters
  const [fCat, setFCat]       = useState("All");
  const [fPeriod, setFPeriod] = useState("thisMonth");

  /* derived */
  const tmExp      = useMemo(()=>expenses.filter(e=>e.date.startsWith(TMK)),[expenses]);
  const totalSpent = useMemo(()=>tmExp.reduce((s,e)=>s+e.amount,0),[tmExp]);
  const remaining  = budget - totalSpent;
  const budgetPct  = budget>0 ? Math.min(100,(totalSpent/budget)*100) : 0;

  const filteredExp = useMemo(()=>{
    let list = expenses;
    if (fPeriod==="thisMonth") list=list.filter(e=>e.date.startsWith(TMK));
    else if (fPeriod==="lastMonth") {
      const d=new Date(now.getFullYear(),now.getMonth()-1,1);
      list=list.filter(e=>e.date.startsWith(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`));
    }
    if (fCat!=="All") list=list.filter(e=>e.category===fCat);
    return list.sort((a,b)=>b.date.localeCompare(a.date));
  },[expenses,fPeriod,fCat]);

  const catBreakdown = useMemo(()=>{
    const m={};
    tmExp.forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount});
    return Object.entries(m).map(([name,value])=>({name,value:+value.toFixed(2),color:CAT_COLORS[CATEGORIES.indexOf(name)]})).sort((a,b)=>b.value-a.value);
  },[tmExp]);

  const monthlyTrend = useMemo(()=>Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    return {month:MONTHS[d.getMonth()],total:+expenses.filter(e=>e.date.startsWith(k)).reduce((s,e)=>s+e.amount,0).toFixed(2)};
  }),[expenses]);

  const nudges      = useMemo(()=>getNudges(expenses,budget,splits),[expenses,budget,splits]);
  const unpaidCount = useMemo(()=>splits.reduce((s,sp)=>s+sp.members.filter(m=>m.name==="You"&&!m.paid).length,0),[splits]);

  const notify = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  /* ── Expense actions ── */
  const openAddExp = () => {
    setEditExp(null);
    setEf({title:"",amount:"",category:"Food & Drinks",date:now.toISOString().split("T")[0]});
    setEfErr({}); setExpModal(true);
  };
  const openEditExp = (exp) => {
    setEditExp(exp);
    setEf({title:exp.title,amount:String(exp.amount),category:exp.category,date:exp.date});
    setEfErr({}); setExpModal(true);
  };
  const saveExp = () => {
    const e={};
    if (!ef.title.trim())                              e.title="Required";
    if (!ef.amount||isNaN(+ef.amount)||+ef.amount<=0) e.amount="Enter a valid amount";
    if (!ef.date)                                      e.date="Required";
    setEfErr(e); if (Object.keys(e).length) return;
    if (editExp) {
      setExpenses(p=>p.map(x=>x.id===editExp.id?{...ef,amount:+ef.amount,id:editExp.id}:x));
      notify("Expense updated.");
    } else {
      setExpenses(p=>[...p,{...ef,amount:+ef.amount,id:gid()}]);
      const newTotal=tmExp.reduce((s,x)=>s+x.amount,0)+ +ef.amount;
      if (budget>0 && newTotal>budget) notify(`Over budget by $${(newTotal-budget).toFixed(2)}`,"warning");
      else notify("Expense added.");
    }
    setExpModal(false);
  };
  const deleteExp = (id)=>{ setExpenses(p=>p.filter(e=>e.id!==id)); notify("Deleted.","info"); };

  /* ── Split helpers ── */
  const equalAmounts = (members, total) => {
    const each = members.length&&total ? +(+total/members.length).toFixed(2) : 0;
    return members.map(m=>({...m,amount:String(each)}));
  };
  const setSfVal = (k,v) => setSf(p=>{
    const next={...p,[k]:v};
    if ((k==="totalAmount"||k==="mode")&&next.mode==="equal"&&next.totalAmount)
      next.members=equalAmounts(next.members,next.totalAmount);
    return next;
  });
  const setSfMember = (i,field,val) => setSf(p=>({...p,members:p.members.map((m,x)=>x===i?{...m,[field]:val}:m)}));
  const addMember = () => setSf(p=>{
    const members=[...p.members,{name:"",amount:"",paid:false}];
    return {...p,members:p.mode==="equal"?equalAmounts(members,p.totalAmount):members};
  });
  const removeMember = (i) => setSf(p=>{
    const members=p.members.filter((_,x)=>x!==i);
    return {...p,members:p.mode==="equal"?equalAmounts(members,p.totalAmount):members};
  });

  const openAddSplit = () => {
    setEditSplit(null);
    setSf({title:"",totalAmount:"",dueDate:"",mode:"equal",members:[{name:"You",amount:"",paid:false},{name:"",amount:"",paid:false}]});
    setSfErr({}); setSplitModal(true);
  };
  const openEditSplit = (sp) => {
    setEditSplit(sp);
    setSf({title:sp.title,totalAmount:String(sp.totalAmount),dueDate:sp.dueDate,mode:"custom",members:sp.members.map(m=>({...m,amount:String(m.amount)}))});
    setSfErr({}); setSplitModal(true);
  };
  const saveSplit = () => {
    const e={};
    if (!sf.title.trim())                                            e.title="Required";
    if (!sf.totalAmount||isNaN(+sf.totalAmount)||+sf.totalAmount<=0) e.totalAmount="Enter valid total";
    if (!sf.dueDate)                                                 e.dueDate="Required";
    sf.members.forEach((m,i)=>{ if(!m.name.trim()) e[`m${i}`]="Name required"; });
    setSfErr(e); if (Object.keys(e).length) return;
    const members=sf.members.map(m=>({...m,amount:+m.amount}));
    if (editSplit) {
      setSplits(p=>p.map(s=>s.id===editSplit.id?{...sf,totalAmount:+sf.totalAmount,members,id:editSplit.id}:s));
      notify("Split updated.");
    } else {
      setSplits(p=>[...p,{id:gid(),title:sf.title,totalAmount:+sf.totalAmount,dueDate:sf.dueDate,members}]);
      const mine=members.find(m=>m.name==="You");
      if (mine) {
        setExpenses(p=>[...p,{id:gid(),title:sf.title,amount:mine.amount,category:"Housing",date:sf.dueDate}]);
        notify(`Split created. $${mine.amount} added to expenses.`);
      } else notify("Split created.");
    }
    setSplitModal(false);
  };
  const togglePaid  = (sid,i) => setSplits(p=>p.map(s=>s.id===sid?{...s,members:s.members.map((m,x)=>x===i?{...m,paid:!m.paid}:m)}:s));
  const deleteSplit = (id)=>{ setSplits(p=>p.filter(s=>s.id!==id)); notify("Deleted.","info"); };

  if (!user) return <><GS/><Auth onLogin={u=>{setUser(u);notify(`Welcome, ${u.name.split(" ")[0]}!`)}}/></>;

  const NAV=[
    {id:"dashboard", label:"Dashboard",    icon:"◈"},
    {id:"expenses",  label:"Expenses",     icon:"≡"},
    {id:"rent",      label:"Rent & Bills", icon:"⌂", badge:unpaidCount||null},
    {id:"budget",    label:"Budget",       icon:"◎"},
    {id:"analytics", label:"Analytics",    icon:"⊞"},
  ];
  const h=now.getHours();
  const greet=h<12?"Good morning":h<18?"Good afternoon":"Good evening";

  return (
    <>
      <GS/>
      {toast&&<Toast {...toast}/>}
      <div style={{display:"flex",minHeight:"100vh"}}>

        {/* SIDEBAR */}
        <aside style={{width:210,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
          <div style={{padding:"22px 20px 16px",borderBottom:`1px solid ${C.border2}`}}>
            <div style={{fontFamily:FD,fontSize:21,fontWeight:700,letterSpacing:"-0.3px"}}>UniMoney</div>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>university finance</div>
          </div>

          {/* User avatar */}
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border2}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#27272a,#52525b)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:600,fontSize:14,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.12)"}}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
                <div style={{fontSize:11,color:C.muted}}>@{user.username}</div>
              </div>
            </div>
          </div>

          <nav style={{flex:1,padding:"10px 10px",overflowY:"auto"}}>
            {NAV.map(n=>(
              <button key={n.id} className="nav-btn" onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"9px 11px",borderRadius:9,border:"none",borderLeft:`3px solid ${page===n.id?C.text:"transparent"}`,background:page===n.id?C.bg:"transparent",color:page===n.id?C.text:C.sub,fontSize:13,fontWeight:page===n.id?600:400,marginBottom:2,textAlign:"left",cursor:"pointer",transition:"all .15s"}}>
                <span style={{display:"flex",alignItems:"center",gap:9}}>
                  <span style={{fontSize:15,opacity:page===n.id?1:0.55}}>{n.icon}</span>
                  {n.label}
                </span>
                {n.badge&&<span style={{background:C.red,color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,flexShrink:0}}>{n.badge}</span>}
              </button>
            ))}
          </nav>

          <div style={{padding:"10px 10px",borderTop:`1px solid ${C.border2}`}}>
            <button onClick={()=>setUser(null)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:9,border:"none",background:"transparent",color:C.muted,fontSize:13,width:"100%",textAlign:"left",cursor:"pointer",transition:"color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color=C.red}
              onMouseLeave={e=>e.currentTarget.style.color=C.muted}
            >
              ↩ Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{flex:1,padding:"28px 32px 48px",overflowY:"auto",minWidth:0}} className="pg" key={page}>

          {/* ═══ DASHBOARD ═══ */}
          {page==="dashboard" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div>
                  <h1 style={{fontFamily:FD,fontSize:28,fontWeight:700,marginBottom:3}}>{greet}, {user.name.split(" ")[0]}</h1>
                  <div style={{color:C.sub,fontSize:13}}>{MONTHS[now.getMonth()]} {now.getFullYear()}</div>
                </div>
                <Btn onClick={openAddExp}>+ Add Expense</Btn>
              </div>

              {nudges.map((n,i)=><Alert key={i} {...n}/>)}

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18,marginTop:nudges.length?8:0}}>
                {[
                  {label:"Spent",    value:`$${totalSpent.toFixed(2)}`,          sub:"this month",    col:budget>0&&totalSpent>budget?C.red:C.text, accent:budget>0&&totalSpent>budget?C.red:C.green},
                  {label:"Remaining",value:`$${Math.abs(remaining).toFixed(2)}`, sub:remaining<0?"over budget":"left", col:remaining<0?C.red:C.green, accent:remaining<0?C.red:C.green},
                  {label:"Budget",   value:budget>0?`$${budget}`:"Not set",      sub:"monthly limit", col:C.text, accent:C.blue},
                  {label:"This Month",value:tmExp.length,                         sub:"transactions",  col:C.text, accent:C.text},
                ].map(s=>(
                  <Card key={s.label} className="stat-card" style={{padding:"16px 18px",borderTop:`3px solid ${s.accent}`,cursor:"default"}}>
                    <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{s.label}</div>
                    <div style={{fontFamily:FD,fontSize:26,color:s.col,lineHeight:1.1}}>{s.value}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:4}}>{s.sub}</div>
                  </Card>
                ))}
              </div>

              {/* Budget bar */}
              <Card style={{marginBottom:18,padding:"15px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                  <span style={{fontSize:13,fontWeight:500}}>Monthly Budget</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {budget>0&&<span style={{fontSize:12,color:C.muted}}>${totalSpent.toFixed(2)} / ${budget}</span>}
                    {budget>0&&<span style={{fontSize:13,fontWeight:600,color:budgetPct>90?C.red:budgetPct>70?C.amber:C.green}}>{budgetPct.toFixed(0)}%</span>}
                    <Btn v="ghost" sm onClick={()=>{setBudgetInput(budget?String(budget):"");setBudgetModal(true)}}>{budget>0?"Edit":"Set Budget"}</Btn>
                  </div>
                </div>
                {budget>0
                  ? <div style={{background:C.bg,borderRadius:6,height:8,overflow:"hidden"}}>
                      <div style={{width:`${budgetPct}%`,height:"100%",background:budgetPct>90?C.red:budgetPct>70?C.amber:C.green,borderRadius:6,transition:"width .7s cubic-bezier(.22,1,.36,1)"}}/>
                    </div>
                  : <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Set a budget to track your spending progress</div>
                }
              </Card>

              {/* Charts or empty state */}
              {expenses.length>0 ? (
                <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:18}}>
                  <Card>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>6-Month Trend</div>
                    <ResponsiveContainer width="100%" height={185}>
                      <BarChart data={monthlyTrend} barSize={22}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:C.muted,fontSize:11}}/>
                        <YAxis hide/>
                        <Tooltip formatter={v=>`$${v}`} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text}}/>
                        <Bar dataKey="total" fill={C.text} radius={[4,4,0,0]} opacity={.85}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>By Category</div>
                    {catBreakdown.length===0
                      ? <div style={{color:C.muted,textAlign:"center",paddingTop:55,fontSize:13}}>No data this month</div>
                      : <>
                          <ResponsiveContainer width="100%" height={135}>
                            <PieChart>
                              <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="value">
                                {catBreakdown.map((e,i)=><Cell key={i} fill={e.color}/>)}
                              </Pie>
                              <Tooltip formatter={v=>`$${v}`} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.text}}/>
                            </PieChart>
                          </ResponsiveContainer>
                          {catBreakdown.slice(0,3).map((c,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:5,alignItems:"center"}}>
                              <span style={{color:C.sub}}>{CAT_ICONS[c.name]} {c.name}</span>
                              <span style={{color:c.color,fontWeight:600}}>${c.value}</span>
                            </div>
                          ))}
                        </>
                    }
                  </Card>
                </div>
              ) : (
                <Card style={{marginBottom:18,textAlign:"center",padding:44}}>
                  <div style={{fontSize:40,marginBottom:12}}>💸</div>
                  <div style={{fontFamily:FD,fontSize:18,marginBottom:6}}>No expenses yet</div>
                  <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Add your first expense to start tracking your spending.</div>
                  <Btn onClick={openAddExp}>+ Add your first expense</Btn>
                </Card>
              )}

              {/* Recent */}
              {tmExp.length>0&&(
                <Card>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <span style={{fontSize:13,fontWeight:500}}>Recent Expenses</span>
                    <Btn v="ghost" sm onClick={()=>setPage("expenses")}>View all →</Btn>
                  </div>
                  {tmExp.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map((exp,i,arr)=>(
                    <div key={exp.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${C.border2}`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{CAT_ICONS[exp.category]||"📦"}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:500}}>{exp.title}</div>
                          <div style={{fontSize:11,color:C.muted}}>{exp.date} · {exp.category}</div>
                        </div>
                      </div>
                      <span style={{fontFamily:FD,fontSize:16,color:C.red}}>−${exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ═══ EXPENSES ═══ */}
          {page==="expenses" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <h1 style={{fontFamily:FD,fontSize:28,fontWeight:700,marginBottom:2}}>Expenses</h1>
                  <div style={{color:C.sub,fontSize:13}}>{filteredExp.length} record{filteredExp.length!==1?"s":""}</div>
                </div>
                <Btn onClick={openAddExp}>+ Add</Btn>
              </div>

              {/* Filters */}
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {[["all","All Time"],["thisMonth","This Month"],["lastMonth","Last Month"]].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setFPeriod(val)} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${fPeriod===val?C.text:C.border}`,background:fPeriod===val?C.text:"transparent",color:fPeriod===val?"#fff":C.sub,fontSize:12,fontWeight:500,fontFamily:FB,cursor:"pointer",transition:"all .15s"}}>
                    {lbl}
                  </button>
                ))}
                <select value={fCat} onChange={e=>setFCat(e.target.value)} style={{padding:"7px 11px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,fontSize:12,fontFamily:FB,cursor:"pointer"}}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Summary strip */}
              {filteredExp.length>0&&(
                <div style={{display:"flex",gap:22,padding:"12px 18px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,marginBottom:14}}>
                  {[
                    ["Total",`$${filteredExp.reduce((s,e)=>s+e.amount,0).toFixed(2)}`],
                    ["Count",filteredExp.length],
                    ["Average",`$${(filteredExp.reduce((s,e)=>s+e.amount,0)/filteredExp.length).toFixed(2)}`],
                    ["Largest",`$${Math.max(...filteredExp.map(e=>e.amount)).toFixed(2)}`],
                  ].map(([l,v])=>(
                    <div key={l}>
                      <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</div>
                      <div style={{fontFamily:FD,fontSize:19,marginTop:2}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {filteredExp.length===0 ? (
                <Card style={{textAlign:"center",padding:48}}>
                  <div style={{fontSize:36,marginBottom:12}}>🔍</div>
                  <div style={{fontFamily:FD,fontSize:18,marginBottom:6}}>No expenses found</div>
                  <div style={{color:C.muted,fontSize:13,marginBottom:20}}>{expenses.length===0?"Start by adding your first expense.":"Try adjusting your filters."}</div>
                  {expenses.length===0&&<Btn onClick={openAddExp}>+ Add Expense</Btn>}
                </Card>
              ) : (
                <Card style={{padding:0,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1.3fr 1fr 1fr 76px",padding:"9px 18px",borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                    <span>Description</span><span>Category</span><span>Date</span><span style={{textAlign:"right"}}>Amount</span><span/>
                  </div>
                  {filteredExp.map((exp,i)=>(
                    <div key={exp.id} style={{display:"grid",gridTemplateColumns:"2fr 1.3fr 1fr 1fr 76px",padding:"11px 18px",borderBottom:i<filteredExp.length-1?`1px solid ${C.border2}`:"none",alignItems:"center",transition:"background .12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <span style={{fontSize:16}}>{CAT_ICONS[exp.category]||"📦"}</span>
                        <span style={{fontSize:13,fontWeight:500}}>{exp.title}</span>
                      </div>
                      <Tag color={CAT_COLORS[CATEGORIES.indexOf(exp.category)]}>{exp.category}</Tag>
                      <span style={{fontSize:12,color:C.muted}}>{exp.date}</span>
                      <span style={{textAlign:"right",fontFamily:FD,fontSize:15,color:C.red}}>−${exp.amount.toFixed(2)}</span>
                      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                        <Btn v="ghost" sm onClick={()=>openEditExp(exp)}>✏</Btn>
                        <Btn v="danger" sm onClick={()=>deleteExp(exp.id)}>✕</Btn>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ═══ RENT & BILLS ═══ */}
          {page==="rent" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
                <div>
                  <h1 style={{fontFamily:FD,fontSize:28,fontWeight:700,marginBottom:3}}>Rent & Bills</h1>
                  <div style={{color:C.sub,fontSize:13}}>Split shared costs with roommates</div>
                </div>
                <Btn onClick={openAddSplit}>+ New Split</Btn>
              </div>

              {splits.length===0 ? (
                <Card style={{textAlign:"center",padding:52}}>
                  <div style={{fontSize:44,marginBottom:12}}>🏠</div>
                  <div style={{fontFamily:FD,fontSize:20,marginBottom:8}}>No splits yet</div>
                  <div style={{color:C.muted,fontSize:13,marginBottom:24}}>Track rent, electricity, WiFi — any shared bill.</div>
                  <Btn onClick={openAddSplit}>Create your first split</Btn>
                </Card>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {splits.map(sp=>{
                    const paidN   = sp.members.filter(m=>m.paid).length;
                    const allPaid = paidN===sp.members.length;
                    const mine    = sp.members.find(m=>m.name==="You");
                    const pastDue = sp.dueDate<now.toISOString().split("T")[0];
                    const accent  = allPaid?C.green:pastDue?C.red:C.amber;
                    return (
                      <Card key={sp.id} style={{borderLeft:`4px solid ${accent}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{sp.title}</div>
                            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                              <span style={{fontSize:12,color:C.muted}}>Due {sp.dueDate}</span>
                              {allPaid&&<Tag color={C.green}>All Paid ✓</Tag>}
                              {!allPaid&&pastDue&&<Tag color={C.red}>Past Due</Tag>}
                              {!allPaid&&!pastDue&&<Tag color={C.amber}>{paidN}/{sp.members.length} paid</Tag>}
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontFamily:FD,fontSize:22}}>${sp.totalAmount.toFixed(2)}</span>
                            <Btn v="ghost" sm onClick={()=>openEditSplit(sp)}>✏</Btn>
                            <Btn v="danger" sm onClick={()=>deleteSplit(sp.id)}>✕</Btn>
                          </div>
                        </div>

                        <div style={{background:C.bg,borderRadius:5,height:6,marginBottom:12,overflow:"hidden"}}>
                          <div style={{width:`${(paidN/sp.members.length)*100}%`,height:"100%",background:allPaid?C.green:C.amber,borderRadius:5,transition:"width .5s cubic-bezier(.22,1,.36,1)"}}/>
                        </div>

                        <div style={{display:"flex",flexDirection:"column",gap:7}}>
                          {sp.members.map((m,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:m.paid?C.greenLt:C.bg,borderRadius:9,border:`1px solid ${m.paid?C.greenBd:C.border2}`,transition:"background .2s,border .2s"}}>
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <div style={{width:28,height:28,borderRadius:"50%",background:m.paid?C.green:"#d4d4d8",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:600,transition:"background .2s"}}>
                                  {m.name[0]?.toUpperCase()||"?"}
                                </div>
                                <span style={{fontSize:13,fontWeight:m.name==="You"?500:400}}>{m.name}</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <span style={{fontFamily:FD,fontSize:15}}>${m.amount.toFixed(2)}</span>
                                <button onClick={()=>togglePaid(sp.id,i)} style={{padding:"4px 12px",borderRadius:7,border:`1.5px solid ${m.paid?C.greenBd:C.border}`,background:m.paid?C.green:"transparent",color:m.paid?"#fff":C.sub,fontSize:11,fontWeight:600,fontFamily:FB,cursor:"pointer",transition:"all .2s"}}>
                                  {m.paid?"✓ Paid":"Mark paid"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {mine&&(
                          <div style={{marginTop:11,padding:"9px 13px",background:mine.paid?C.greenLt:C.amberLt,border:`1px solid ${mine.paid?C.greenBd:C.amberBd}`,borderRadius:9,fontSize:12,color:mine.paid?C.green:C.amber,fontWeight:500}}>
                            {mine.paid?`✓ You paid your share of $${mine.amount.toFixed(2)}`:`Your share: $${mine.amount.toFixed(2)} — not yet marked as paid`}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ BUDGET ═══ */}
          {page==="budget" && (
            <div>
              <h1 style={{fontFamily:FD,fontSize:28,fontWeight:700,marginBottom:3}}>Budget</h1>
              <div style={{color:C.sub,fontSize:13,marginBottom:22}}>Monthly spending limit</div>

              <Card style={{marginBottom:18,padding:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Monthly Budget</div>
                    <div style={{fontFamily:FD,fontSize:42,fontWeight:600}}>{budget>0?`$${budget}`:"—"}</div>
                    {budget===0&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>No budget set yet</div>}
                  </div>
                  <Btn v="outline" onClick={()=>{setBudgetInput(budget?String(budget):"");setBudgetModal(true)}}>{budget>0?"Edit":"Set Budget"}</Btn>
                </div>
                {budget>0&&(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,paddingTop:16,borderTop:`1px solid ${C.border2}`}}>
                      {[["Spent",`$${totalSpent.toFixed(2)}`,totalSpent>budget?C.red:C.text],["Remaining",`$${Math.abs(remaining).toFixed(2)}${remaining<0?" over":""}`,remaining<0?C.red:C.green],["Used",`${budgetPct.toFixed(0)}%`,C.text]].map(([l,v,col])=>(
                        <div key={l}>
                          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</div>
                          <div style={{fontFamily:FD,fontSize:22,color:col,marginTop:3}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:16,background:C.bg,borderRadius:7,height:9,overflow:"hidden"}}>
                      <div style={{width:`${budgetPct}%`,height:"100%",background:budgetPct>90?C.red:budgetPct>70?C.amber:C.green,borderRadius:7,transition:"width .7s cubic-bezier(.22,1,.36,1)"}}/>
                    </div>
                  </>
                )}
              </Card>

              {catBreakdown.length>0 ? (
                <Card>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Spending by Category</div>
                  {catBreakdown.map((cat,i)=>(
                    <div key={i} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:13}}>{CAT_ICONS[cat.name]} {cat.name}</span>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          {budget>0&&<span style={{fontSize:11,color:C.muted}}>{((cat.value/budget)*100).toFixed(0)}% of budget</span>}
                          <span style={{fontWeight:600,color:cat.color,fontSize:13}}>${cat.value}</span>
                        </div>
                      </div>
                      <div style={{background:C.bg,borderRadius:4,height:6,overflow:"hidden"}}>
                        <div style={{width:`${budget>0?Math.min(100,(cat.value/budget)*100):Math.min(100,(cat.value/totalSpent)*100)}%`,height:"100%",background:cat.color,borderRadius:4,transition:"width .5s"}}/>
                      </div>
                    </div>
                  ))}
                </Card>
              ) : (
                <Card style={{textAlign:"center",padding:40}}>
                  <div style={{fontSize:36,marginBottom:12}}>◎</div>
                  <div style={{fontFamily:FD,fontSize:18,marginBottom:6}}>No spending data</div>
                  <div style={{color:C.muted,fontSize:13}}>Add expenses to see your budget breakdown.</div>
                </Card>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {page==="analytics" && (
            <div>
              <h1 style={{fontFamily:FD,fontSize:28,fontWeight:700,marginBottom:3}}>Analytics</h1>
              <div style={{color:C.sub,fontSize:13,marginBottom:22}}>Your spending at a glance</div>

              {expenses.length===0 ? (
                <Card style={{textAlign:"center",padding:52}}>
                  <div style={{fontSize:44,marginBottom:12}}>⊞</div>
                  <div style={{fontFamily:FD,fontSize:20,marginBottom:8}}>No data yet</div>
                  <div style={{color:C.muted,fontSize:13,marginBottom:24}}>Add expenses to start seeing your analytics.</div>
                  <Btn onClick={openAddExp}>+ Add Expense</Btn>
                </Card>
              ) : (
                <>
                  <Card style={{marginBottom:18}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Monthly Spending</div>
                    <ResponsiveContainer width="100%" height={210}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:C.muted,fontSize:11}}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill:C.muted,fontSize:11}} tickFormatter={v=>`$${v}`}/>
                        <Tooltip formatter={v=>[`$${v}`,"Spent"]} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}}/>
                        <Line type="monotone" dataKey="total" stroke={C.text} strokeWidth={2} dot={{fill:C.text,r:3}} activeDot={{r:5,fill:C.green}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
                    <Card>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>This Month</div>
                      {catBreakdown.length===0
                        ? <div style={{color:C.muted,textAlign:"center",padding:48,fontSize:13}}>No data this month</div>
                        : <ResponsiveContainer width="100%" height={190}>
                            <PieChart>
                              <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="value">
                                {catBreakdown.map((e,i)=><Cell key={i} fill={e.color}/>)}
                              </Pie>
                              <Tooltip formatter={v=>`$${v}`} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}}/>
                            </PieChart>
                          </ResponsiveContainer>
                      }
                    </Card>
                    <Card>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Category Breakdown</div>
                      {catBreakdown.length===0
                        ? <div style={{color:C.muted,fontSize:13}}>No data this month</div>
                        : catBreakdown.map((cat,i)=>(
                          <div key={i} style={{marginBottom:11}}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                              <span>{CAT_ICONS[cat.name]} {cat.name}</span>
                              <span style={{fontWeight:600,color:cat.color}}>${cat.value}</span>
                            </div>
                            <div style={{background:C.bg,borderRadius:4,height:5,overflow:"hidden"}}>
                              <div style={{width:`${totalSpent>0?(cat.value/totalSpent*100).toFixed(0):0}%`,height:"100%",background:cat.color,borderRadius:4,transition:"width .5s"}}/>
                            </div>
                          </div>
                        ))
                      }
                    </Card>
                  </div>

                  <Card>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:5}}>Export</div>
                    <div style={{color:C.muted,fontSize:12,marginBottom:14}}>Download all expenses as CSV.</div>
                    <Btn v="outline" onClick={()=>{
                      const rows=["Title,Category,Date,Amount",...expenses.map(e=>`${e.title},${e.category},${e.date},${e.amount}`)].join("\n");
                      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([rows],{type:"text/csv"}));a.download="unimoney.csv";a.click();
                      notify("Downloaded.");
                    }}>⬇ Download CSV</Btn>
                  </Card>
                </>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Expense */}
      <Modal open={expModal} onClose={()=>setExpModal(false)} title={editExp?"Edit Expense":"Add Expense"}>
        <Field label="Title" error={efErr.title}>
          <Inp placeholder="e.g. Groceries" value={ef.title} onChange={e=>{setEf(p=>({...p,title:e.target.value}));setEfErr(p=>({...p,title:undefined}))}} error={efErr.title}/>
        </Field>
        <Field label="Amount ($)" error={efErr.amount}>
          <Inp type="number" min="0" step="0.01" placeholder="0.00" value={ef.amount} onChange={e=>{setEf(p=>({...p,amount:e.target.value}));setEfErr(p=>({...p,amount:undefined}))}} error={efErr.amount}/>
        </Field>
        <Field label="Category">
          <Sel value={ef.category} onChange={e=>setEf(p=>({...p,category:e.target.value}))}>
            {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </Sel>
        </Field>
        <Field label="Date" error={efErr.date}>
          <Inp type="date" value={ef.date} onChange={e=>{setEf(p=>({...p,date:e.target.value}));setEfErr(p=>({...p,date:undefined}))}} error={efErr.date}/>
        </Field>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:8}}>
          <Btn v="outline" onClick={()=>setExpModal(false)}>Cancel</Btn>
          <Btn onClick={saveExp}>{editExp?"Save Changes":"Add Expense"}</Btn>
        </div>
      </Modal>

      {/* Budget */}
      <Modal open={budgetModal} onClose={()=>setBudgetModal(false)} title="Set Monthly Budget" width={360}>
        <Field label="Monthly Budget ($)">
          <Inp type="number" min="0" placeholder="e.g. 800" value={budgetInput} onChange={e=>setBudgetInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(+budgetInput>=0)&&(setBudget(+budgetInput),setBudgetModal(false),notify("Budget updated."))}/>
        </Field>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
          <Btn v="outline" onClick={()=>setBudgetModal(false)}>Cancel</Btn>
          <Btn onClick={()=>{ const v=+budgetInput; if(v>=0){setBudget(v);setBudgetModal(false);notify("Budget updated.")} }}>Save</Btn>
        </div>
      </Modal>

      {/* Split */}
      <Modal open={splitModal} onClose={()=>setSplitModal(false)} title={editSplit?"Edit Split":"New Split"} width={500}>
        <Field label="Title" error={sfErr.title}>
          <Inp placeholder="e.g. March Rent" value={sf.title} onChange={e=>setSfVal("title",e.target.value)} error={sfErr.title}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Total Amount ($)" error={sfErr.totalAmount}>
            <Inp type="number" min="0" step="0.01" placeholder="0.00" value={sf.totalAmount} onChange={e=>setSfVal("totalAmount",e.target.value)} error={sfErr.totalAmount}/>
          </Field>
          <Field label="Due Date" error={sfErr.dueDate}>
            <Inp type="date" value={sf.dueDate} onChange={e=>setSfVal("dueDate",e.target.value)} error={sfErr.dueDate}/>
          </Field>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",background:C.bg,borderRadius:8,padding:3,marginBottom:14}}>
          {[["equal","Split Equally"],["custom","Custom Amounts"]].map(([val,lbl])=>(
            <button key={val} onClick={()=>setSfVal("mode",val)} style={{flex:1,padding:"7px",borderRadius:6,border:"none",fontFamily:FB,fontSize:12,fontWeight:sf.mode===val?600:400,color:sf.mode===val?C.text:C.sub,background:sf.mode===val?C.surface:"transparent",boxShadow:sf.mode===val?"0 1px 3px rgba(0,0,0,.07)":"none",cursor:"pointer",transition:"all .15s"}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Members */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:500,color:C.sub,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Members</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {sf.members.map((m,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 95px 34px",gap:7,alignItems:"start"}}>
                <div>
                  <Inp placeholder={i===0?"You":"Roommate name"} value={m.name} onChange={e=>setSfMember(i,"name",e.target.value)} style={{borderRadius:8}} disabled={i===0} error={sfErr[`m${i}`]}/>
                  {sfErr[`m${i}`]&&<div style={{fontSize:11,color:C.red,marginTop:2}}>{sfErr[`m${i}`]}</div>}
                </div>
                <Inp type="number" min="0" step="0.01" placeholder="0.00" value={m.amount}
                  onChange={e=>sf.mode==="custom"?setSfMember(i,"amount",e.target.value):null}
                  style={{borderRadius:8,background:sf.mode==="equal"?C.bg:C.surface,color:sf.mode==="equal"?C.muted:C.text}}
                  readOnly={sf.mode==="equal"}
                />
                {i>1
                  ? <button onClick={()=>removeMember(i)} style={{width:34,height:36,borderRadius:7,border:`1px solid ${C.redBd}`,background:C.redLt,color:C.red,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                  : <div/>
                }
              </div>
            ))}
          </div>
          <button onClick={addMember} style={{marginTop:9,fontSize:12,color:C.blue,background:"none",border:"none",cursor:"pointer",fontFamily:FB,fontWeight:500,padding:"3px 0"}}>
            + Add member
          </button>
        </div>

        {sf.mode==="custom"&&sf.totalAmount&&(()=>{
          const allocated=sf.members.reduce((s,m)=>s+(+m.amount||0),0);
          const diff=Math.abs(allocated - +sf.totalAmount);
          return diff>0.01&&(
            <div style={{fontSize:12,color:C.amber,marginBottom:10,padding:"8px 12px",background:C.amberLt,border:`1px solid ${C.amberBd}`,borderRadius:8}}>
              ⚠ Allocated ${allocated.toFixed(2)} / ${sf.totalAmount} — doesn't add up
            </div>
          );
        })()}

        <div style={{height:1,background:C.border2,margin:"12px 0"}}/>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
          <Btn v="outline" onClick={()=>setSplitModal(false)}>Cancel</Btn>
          <Btn onClick={saveSplit}>{editSplit?"Save Changes":"Create Split"}</Btn>
        </div>
      </Modal>
    </>
  );
}
