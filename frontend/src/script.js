let selectedEmpId = null;
const BASE_URL = API;
// ══════════════════════════════════════════════
// CONSTANTS & STATE
// ══════════════════════════════════════════════
const API = "http://127.0.0.1:8000";
let token=null,CU=null,empCache=[],sortState={col:'',dir:1};

let currentPage = 0;
const pageSize = 20;
let userRole = "";

const MOCK_USERS={
  admin1:{password:'adminpass',role:'Admin',dept:'IT'},
  manager1:{password:'managerpass',role:'Manager',dept:'Sales'},
  hr1:{password:'hrpass',role:'HR',dept:'HR'},
  emp1:{password:'emppass',role:'Employee',dept:'Sales'},
  Alice:{password:'emppass',role:'Employee',dept:'Sales'},
  auditor1:{password:'auditpass',role:'Auditor',dept:'Audit'}
};

const PERMS={
  Admin:{update:true,approve:true,audit:true,allEmp:true},
  HR:{update:true,approve:true,audit:false,allEmp:false},
  Manager:{update:true,approve:true,audit:false,allEmp:false},
  Employee:{update:false,approve:false,audit:false,allEmp:false},
  Auditor:{update:false,approve:false,audit:true,allEmp:false}
};
const RBADGE={Admin:'b-adm',HR:'b-hr',Manager:'b-mgr',Employee:'b-emp',Auditor:'b-aud'};
const RNAME={Admin:'Admin',HR:'HR',Manager:'Manager',Employee:'Employee',Auditor:'Auditor'};

// ── SETTINGS ──
let S={darkMode:false,notifications:true,autoRefresh:false,displayName:''};

function loadS(){
  const s = JSON.parse(localStorage.getItem(`cs-settings_${CU.username}`) || '{}');
  Object.assign(S,s);
}

function saveS(){
  localStorage.setItem(`cs-settings_${CU.username}`, JSON.stringify(S));
}
// ── LEAVES ──
function getLeaves(){return JSON.parse(localStorage.getItem('cs-leaves')||'[]');}
function setLeaves(l){localStorage.setItem('cs-leaves',JSON.stringify(l));}
function getMyLeaves(){return getLeaves().filter(l=>l.user===CU?.username);}
function getLB(){const lb=JSON.parse(localStorage.getItem('cs-lb')||'{}');return lb[CU?.username]??20;}
function setLB(v){const lb=JSON.parse(localStorage.getItem('cs-lb')||'{}');lb[CU.username]=v;localStorage.setItem('cs-lb',JSON.stringify(lb));}

// ── NOTIFS ──
let notifs=[];
function addNotif(msg,type='info'){
  notifs.unshift({msg,type,time:new Date().toLocaleTimeString()});
  renderNotifs();
  document.getElementById('ndot').style.display='block';
}
function renderNotifs(){
  const el=document.getElementById('notif-list');if(!el)return;
  if(!notifs.length){el.innerHTML='<div class="notif-empty">No notifications</div>';return;}
  el.innerHTML=notifs.slice(0,8).map(n=>`<div class="notif-item"><strong>${n.msg}</strong>${n.time}</div>`).join('');
}
function clearNotifs(){notifs=[];document.getElementById('ndot').style.display='none';renderNotifs();}
function toggleNotifPanel(){
  const p=document.getElementById('notif-panel');
  p.style.display=p.style.display==='block'?'none':'block';
}
document.addEventListener('click',e=>{
  const np=document.getElementById('notif-panel');
  if(np&&!np.contains(e.target)&&!e.target.closest('.notif-btn'))np.style.display='none';
});

// ── TOAST ──
function toast(msg,type='ok',dur=3000){
  const rack=document.getElementById('toast-rack');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${type==='ok'?'✓':type==='err'?'✗':'!'}</span><span>${msg}</span>`;
  rack.appendChild(t);
  setTimeout(()=>{t.style.animation='toastOut 0.3s ease forwards';setTimeout(()=>t.remove(),300);},dur);
}

// ── CLOCK ──
function startClock(){
  const el=document.getElementById('clock');
  function tick(){if(el)el.textContent=new Date().toLocaleTimeString('en-IN',{hour12:false});}
  tick();setInterval(tick,1000);
}

// ── DARK MODE ──
function applyDark(){
  document.body.classList.toggle('dark',S.darkMode);
  const btn=document.getElementById('dm-btn');
  if(btn)btn.textContent=S.darkMode?'☾':'☀';
}
function toggleDark(){S.darkMode=!S.darkMode;saveS();applyDark();}

// ── COUNTER ANIMATION ──
function animateCount(el,target,dur=700){
  const start=performance.now();
  function step(now){
    const t=Math.min((now-start)/dur,1);
    const ease=1-Math.pow(1-t,3);
    el.textContent=Math.round(ease*target).toLocaleString();
    if(t<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════
function ql(u,p){document.getElementById('l-u').value=u;document.getElementById('l-p').value=p;doLogin();}

async function doLogin(){
  const u = document.getElementById('l-u').value.trim();
  const p = document.getElementById('l-p').value.trim();
  const err = document.getElementById('l-err');

  err.style.display = 'none';

  try{
    const r = await fetch(`${API}/login`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:u,password:p})
    });

    if(!r.ok) throw new Error("Login failed");

    const d = await r.json();
    token = d.access_token;

    const payload = JSON.parse(atob(token.split('.')[1]));
    userRole = payload.role;

    // decode JWT safely
    CU = JSON.parse(atob(token.split('.')[1]));

  }catch(e){
    // fallback (keep your quick demo mode working)
    const mu = MOCK_USERS[u];
    if(mu && mu.password === p){
      token = 'mock';
      CU = {
        username:u,
        role:mu.role,
        department:mu.dept,
        db_user:'app_'+mu.role.toLowerCase()
      };
      toast('Demo mode (backend issue)','warn');
    }else{
      err.style.display = 'block';
      return;
    }
  }

  // UI transitions (UNCHANGED)
  loadS(); applyDark(); startClock();

  document.getElementById('view-login').style.display = 'none';
  document.getElementById('view-app').style.display = 'flex';

  const dn = S.displayName || CU.username;

  document.getElementById('t-av').textContent = dn[0].toUpperCase();
  document.getElementById('t-name').textContent = dn;
  document.getElementById('t-role').textContent = CU.role;

  nav('home');
}

function doLogout(){
  token=null;CU=null;empCache=[];notifs=[];
  document.getElementById('view-app').style.display='none';
  document.getElementById('view-login').style.display='flex';
  const btn=document.getElementById('l-btn');
  btn.textContent='Sign in →';btn.disabled=false;
  document.getElementById('l-p').value='';
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function nav(page){
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('act'));
  const ni=document.getElementById('ni-'+page);if(ni)ni.classList.add('act');
  const m=document.getElementById('main-area');m.scrollTop=0;
  ({home:renderHome,dash:renderDash,emp:renderEmp,profile:renderProfile,leave:renderLeave,approval:renderApproval,reports:renderReports,settings:renderSettings,api:renderAPI})[page]?.();
}

// ══════════════════════════════════════════════
// EMPLOYEES (API + fallback)
// ══════════════════════════════════════════════
const MOCK_EMPS=[
  {emp_id:1,emp_name:'Alice',age:28,gender:'Female',department:'Sales',job_title:'Executive',experience_years:5,education_level:'Bachelor',location:'New York',salary:70000},
  {emp_id:2,emp_name:'Bob',age:34,gender:'Male',department:'Sales',job_title:'Manager',experience_years:10,education_level:'Master',location:'Austin',salary:95000},
  {emp_id:3,emp_name:'Charlie',age:26,gender:'Male',department:'Engineering',job_title:'Engineer',experience_years:3,education_level:'Master',location:'Seattle',salary:90000},
  {emp_id:4,emp_name:'David',age:40,gender:'Male',department:'HR',job_title:'HR Lead',experience_years:15,education_level:'Bachelor',location:'Chicago',salary:80000},
  {emp_id:5,emp_name:'Eve',age:31,gender:'Female',department:'Finance',job_title:'Analyst',experience_years:7,education_level:'Bachelor',location:'New York',salary:75000},
  {emp_id:6,emp_name:'Frank',age:45,gender:'Male',department:'Engineering',job_title:'Architect',experience_years:20,education_level:'PhD',location:'Austin',salary:140000},
  {emp_id:7,emp_name:'Grace',age:29,gender:'Female',department:'Sales',job_title:'Associate',experience_years:4,education_level:'Bachelor',location:'Seattle',salary:65000},
  {emp_id:8,emp_name:'Henry',age:38,gender:'Male',department:'Finance',job_title:'CFO',experience_years:14,education_level:'Master',location:'Chicago',salary:180000},
];

async function loadEmps(){
  try{
    const res = await fetch(`${BASE_URL}/employees?limit=${pageSize}&offset=${currentPage * pageSize}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if(!res.ok){
      throw new Error("Failed to fetch employees");
    }

    const data = await res.json();

    console.log("EMP DATA:", data); // debug

    empCache = data;

  }catch(err){
    console.error(err);
    toast("Failed to load employees");
    empCache = [];
  }
}

// ===============================
// SEARCH EMPLOYEE BY ID (FIXED UI)
// ===============================
async function searchEmployeeById(empId){
  if(!empId){
    toast("Enter Employee ID","err");
    return;
  }

  try{
    let emp;

    if(token === 'mock'){
      emp = MOCK_EMPS.find(e => e.emp_id == empId);
      if(!emp){
        toast("Not found","err");
        return;
      }
    } else {
      const res = await fetch(`${API}/employees/${empId}`,{
        headers:{ Authorization:`Bearer ${token}` }
      });

      if(res.status === 404){
        toast("Employee not found or no access","err");
        return;
      }

      emp = await res.json();
    }

    // 🔥 SHOW RESULT IN TABLE
    const table = document.getElementById("employeeTable");
    table.innerHTML = `
      <tr>
        <td>${emp.emp_id}</td>
        <td>${emp.emp_name}</td>
        <td>${emp.department}</td>
        <td>${emp.role || "-"}</td>
        <td>${emp.salary}</td>
      </tr>
    `;

  }catch(e){
    toast("Search failed","err");
  }
}

function openUpdate(empId){
  selectedEmpId = empId;

  const emp = empCache.find(e => e.emp_id === empId);
  if(!emp) return;

  document.getElementById("modalSalary").value = emp.salary || "";
  document.getElementById("updateModal").style.display = "flex";
}

function closeModal(){
  document.getElementById("updateModal").style.display = "none";
}

async function submitUpdate(){

  const salary = document.getElementById("modalSalary").value;

  if(!salary){
    toast("Enter salary");
    return;
  }

  try{
    const res = await fetch(`${BASE_URL}/employees/${selectedEmpId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        salary: Number(salary)
      })
    });

    if(!res.ok){
      throw new Error();
    }

    toast("Salary updated");

    closeModal();
    renderEmp();

  }catch(e){
    toast("Update failed");
  }
}

// ══════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════
function renderHome(){
  const slides=[
    {cls:'cs1',h:'Secure HR Management',p:'PostgreSQL RLS enforces row-level data isolation at the database layer'},
    {cls:'cs2',h:'Role-Based Access Control',p:'HR · Manager · Employee · Auditor — each role sees only permitted data'},
    {cls:'cs3',h:'Complete Audit Trail',p:'Every INSERT, UPDATE and DELETE is automatically logged via triggers'}
  ];

  let ci=0;
  const perms=PERMS[CU.role]||{};

  document.getElementById('main-area').innerHTML=`
  <div class="pw fade-up">
    <div class="ph">
      <div class="pt">Welcome, ${S.displayName||CU.username}</div>
      <div class="ps">
        Logged in as 
        <span class="badge ${RBADGE[CU.role]}">${CU.role}</span>
        ${CU.department?' · '+CU.department:''} · 
        ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
      </div>
    </div>

    <div class="car" id="car">
      <div class="car-inner" id="car-inner">
        ${slides.map(s=>`<div class="cs ${s.cls}"><h3>${s.h}</h3><p>${s.p}</p></div>`).join('')}
      </div>
      <button class="car-arr prev" onclick="carGo(-1)">‹</button>
      <button class="car-arr next" onclick="carGo(1)">›</button>
      <div class="car-nav">
        ${slides.map((_,i)=>`<div class="cdot${i===0?' act':''}" id="cd${i}" onclick="carSet(${i})"></div>`).join('')}
      </div>
    </div>

    <div class="hg">
      <div class="hc" onclick="nav('dash')"><div class="hc-ic">◈</div><h4>Dashboard</h4></div>
      <div class="hc" onclick="nav('emp')"><div class="hc-ic">⊞</div><h4>Employees</h4></div>
      <div class="hc" onclick="nav('leave')"><div class="hc-ic">◷</div><h4>Apply Leave</h4></div>
      ${perms.approve?`<div class="hc" onclick="nav('approval')"><div class="hc-ic">✓</div><h4>Approval</h4></div>`:''}
      <div class="hc" onclick="nav('reports')"><div class="hc-ic">≡</div><h4>Reports</h4></div>
      <div class="hc" onclick="nav('settings')"><div class="hc-ic">⚙</div><h4>Settings</h4></div>
    </div>

    <div class="panel">
      <div class="ph2">
        <span class="pt2">Quick stats</span>
      </div>
      <div class="pb" id="qs-area">
        <div class="spin"></div>
      </div>
    </div>
  </div>`;

  // carousel
  window.carSet=function(i){
    ci=i;
    const inner=document.getElementById('car-inner');
    if(inner) inner.style.transform=`translateX(-${i*100}%)`;
  };

  window.carGo=function(d){carSet((ci+d+slides.length)%slides.length);};

  setInterval(()=>{
    ci=(ci+1)%slides.length;
    window.carSet(ci);
  },4500);

  // SIMPLE STATS (SAFE)
  setTimeout(async()=>{
    await loadEmps();

    const qs=document.getElementById('qs-area');
    if(!qs) return;

    const depts=[...new Set(empCache.map(e=>e.department).filter(Boolean))];

    const totalSal=empCache.reduce((a,e)=>a+(e.salary||0),0);

    qs.innerHTML=[
      {l:'Employees',v:empCache.length},
      {l:'Departments',v:depts.length},
      {l:'Avg Salary',v:empCache.length?Math.round(totalSal/empCache.length):0},
      {l:'Pending Leaves',v:getLeaves().filter(l=>l.status==='Pending').length},
    ].map(c=>`
      <div class="sc">
        <div class="sc-lbl">${c.l}</div>
        <div class="sc-val">${c.v}</div>
      </div>
    `).join('');

  },100);
}// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
async function renderDash(){
  const ma=document.getElementById('main-area');
  const perms=PERMS[CU.role]||{};
  ma.innerHTML=`<div class="pw fade-up">
    <div class="ph"><div class="pt">Dashboard</div><div class="ps">RLS-filtered data · ${new Date().toLocaleTimeString()}</div></div>
    <div class="sg" id="d-stats"><div style="grid-column:1/-1" class="loading-center"><span class="spin"></span></div></div>
    <div class="rls-bar">🔒 ${getRLSDesc()}</div>
    <div class="panel">
      <div class="ph2">
        <span class="pt2">Employee records <span class="pt2-sub" id="d-count"></span></span>
        <div class="pa"><button class="btn" onclick="exportCSV()">↓ Export CSV</button><button class="btn p" onclick="renderDash()">↺ Refresh</button></div>
      </div>
      <div class="fr">
        <input class="fi fi-s" id="d-q" placeholder="Search name, job, department..." oninput="filterDash()"/>
        <select class="fi fi-d" id="d-dept" onchange="filterDash()"><option value="">All departments</option></select>
        <select class="fi" id="d-loc" onchange="filterDash()"><option value="">All locations</option></select>
      </div>
      <div class="tw" id="d-table"><div class="loading-center"><span class="spin"></span><span style="font-size:11px;color:var(--text3)">Fetching from backend…</span></div></div>
    </div>
    ${perms.update?`
    <div class="panel">
      <div class="ph2"><span class="pt2">Salary management</span></div>
      <div class="pb">
        <div class="al ok" id="sal-ok"></div><div class="al err" id="sal-err"></div>
        <p style="font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.6">Adds <strong>$500</strong> to all employees in <strong>${CU.department}</strong>. Enforced by RLS — only rows where <code style="font-family:var(--mono);font-size:11px;background:var(--bg2);padding:1px 4px;border-radius:3px">department = '${CU.department}'</code> are updated.</p>
        <button class="btn p" id="sal-btn" onclick="doSalary()">Apply +$500 to ${CU.department}</button>
      </div>
    </div>`:''}
  </div>`;
  await loadEmps();
    }
// ✅ FETCH TOTAL EMPLOYEES
const depts=[...new Set(empCache.map(e=>e.department).filter(Boolean))].sort();
const locs=[...new Set(empCache.map(e=>e.location).filter(Boolean))].sort();

const ds=document.getElementById('d-dept');
const ls=document.getElementById('d-loc');

if(ds) depts.forEach(d=>{
  const o=new Option(d,d);
  ds.appendChild(o);
});

if(ls) locs.forEach(l=>{
  const o=new Option(l,l);
  ls.appendChild(o);
});

// ✅ PASS TOTAL EMPLOYEES TO STATS (if needed)
renderDashStats(totalEmployees);

renderDashTable(empCache);

function renderDashStats(totalEmployees = 0){
  const el=document.getElementById('d-stats');if(!el)return;
  const depts=[...new Set(empCache.map(e=>e.department).filter(Boolean))];
  const avg=empCache.length?Math.round(empCache.reduce((a,e)=>a+(e.salary||0),0)/empCache.length):0;
  const pend=getLeaves().filter(l=>l.status==='Pending').length;
  const items=[
    {l:'Visible employees',v:empCache.length,s:'via RLS'},
    {l:'Departments',v:depts.length,s:'unique'},
    {l:'Avg salary',v:avg,s:'USD'},
    {l:'Pending leaves',v:pend,s:'requests'},
  ];
  el.innerHTML=items.map(c=>`<div class="sc"><div class="sc-lbl">${c.l}</div><div class="sc-val" data-target="${c.v}">0</div><div class="sc-sub">${c.s}</div></div>`).join('');
  el.querySelectorAll('[data-target]').forEach(el=>animateCount(el,+el.dataset.target));
}

let dashFiltered=[];
function filterDash(){
  const q=(document.getElementById('d-q')||{}).value?.toLowerCase()||'';
  const d=(document.getElementById('d-dept')||{}).value||'';
  const l=(document.getElementById('d-loc')||{}).value||'';
  dashFiltered=empCache.filter(e=>{
    const s=(e.emp_name||'').toLowerCase().includes(q)||(e.job_title||'').toLowerCase().includes(q)||(e.department||'').toLowerCase().includes(q);
    return s&&(!d||e.department===d)&&(!l||e.location===l);
  });
  const ct=document.getElementById('d-count');if(ct)ct.textContent=`${dashFiltered.length} of ${empCache.length}`;
  renderDashTable(dashFiltered,q);
}

function hl(text,q){
  if(!q)return text||'—';
  const re=new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return (text||'—').replace(re,'<mark>$1</mark>');
}

function renderDashTable(data,q=''){
  const el=document.getElementById('d-table');if(!el)return;
  const ct=document.getElementById('d-count');if(ct)ct.textContent=`${data.length}`;
  if(!data.length){el.innerHTML='<div class="empty">No records match your filters.</div>';return;}
  el.innerHTML=`<table><thead><tr>
    <th onclick="sortTable('emp_id')">ID<span class="sort-ic"></span></th>
    <th onclick="sortTable('emp_name')">Name<span class="sort-ic"></span></th>
    <th onclick="sortTable('department')">Department<span class="sort-ic"></span></th>
    <th onclick="sortTable('job_title')">Job Title<span class="sort-ic"></span></th>
    <th onclick="sortTable('location')">Location<span class="sort-ic"></span></th>
    <th onclick="sortTable('salary')">Salary<span class="sort-ic"></span></th>
    <th>Action</th>
  </tr></thead><tbody>
  ${data.map(r=>`<tr>
    <td class="td-num">#${r.emp_id}</td>
    <td style="font-weight:500">${hl(r.emp_name,q)}</td>
    <td><span class="badge b-neutral">${hl(r.department,q)}</span></td>
    <td style="color:var(--text2)">${hl(r.job_title,q)}</td>
    <td style="color:var(--text2)">${r.location||'—'}</td>
    <td class="td-num">$${Number(r.salary||0).toLocaleString()}</td>
    <td>${(PERMS[CU.role]||{}).update?`<button class="btn sm p" onclick="doSalaryRow(${r.emp_id})">+$500</button>`:'-'}</td>
  </tr>`).join('')}
  </tbody></table>`;
}

function sortTable(col){
  if(sortState.col===col)sortState.dir*=-1;else{sortState.col=col;sortState.dir=1;}
  const src=dashFiltered.length?dashFiltered:[...empCache];
  src.sort((a,b)=>{
    const av=a[col]??'',bv=b[col]??'';
    return typeof av==='number'?(av-bv)*sortState.dir:String(av).localeCompare(String(bv))*sortState.dir;
  });
  renderDashTable(src,(document.getElementById('d-q')||{}).value||'');
}

async function doSalary(){
  const btn=document.getElementById('sal-btn');
  const ok=document.getElementById('sal-ok');const er=document.getElementById('sal-err');
  ok.style.display='none';er.style.display='none';
  btn.innerHTML='<span class="spin"></span>';btn.disabled=true;
  try{
    if(token!=='mock'){
      const r=await fetch(`${API}/employees/update-salary`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok)throw await r.json();
      const d=await r.json();toast(d.message);
    }else{
      empCache.filter(e=>e.department===CU.department).forEach(e=>e.salary+=500);
      toast(`${empCache.filter(e=>e.department===CU.department).length} salaries updated (demo mode)`);
    }
    addNotif(`Salary update applied to ${CU.department}`);
    empCache=[];await loadEmps();filterDash();renderDashStats();
  }catch(e){toast((e&&e.detail)||'Update failed or blocked by RLS.','err');}
  btn.textContent=`Apply +$500 to ${CU.department}`;btn.disabled=false;
}

async function doSalaryRow(empId){
  if(token!=='mock'){await doSalary();return;}
  const emp=empCache.find(e=>e.emp_id===empId);
  if(emp){emp.salary+=500;toast(`Updated ${emp.emp_name} → $${emp.salary.toLocaleString()}`);filterDash();}
}

function exportCSV(){
  const src = (typeof dashFiltered !== 'undefined' && dashFiltered.length)
    ? dashFiltered
    : empCache;

  if(!src || !src.length){
    toast('No data to export');
    return;
  }

  const headers = [
    'emp_id',
    'emp_name',
    'department',
    'job_title',
    'experience_years',
    'education_level',
    'location',
    'gender',
    'salary'
  ];

  const rows = [
    headers.join(','),
    ...src.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g,'""')}"`).join(','))
  ];

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'employees_export.csv';
  a.click();

  URL.revokeObjectURL(url);

  toast('CSV exported');
}

function getRLSDesc(){
  const r=CU?.role,d=CU?.department;
  if(r==='HR')return`hr_policy active: SELECT/UPDATE WHERE department='${d}' AND app.location='Internal'`;
  if(r==='Manager')return`manager_policy active: SELECT/UPDATE WHERE department='${d}' AND app.location='Internal'`;
  if(r==='Employee')return`employee_policy active: SELECT WHERE emp_name='${CU?.username}' (own record only)`;
  if(r==='Auditor')return`No employee policy — read access to audit_logs table only`;
  if(r==='Admin')return`admin_policy active: Full SELECT/DELETE access to all records`;
  return'';
}

// ══════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════
async function renderEmp(){
  const ma=document.getElementById('main-area');
  ma.innerHTML=`<div class="pw fade-up">
    <div class="ph">
      <div class="pt">Employee Directory</div>
      <div class="ps">Filtered by your access level via RLS</div>
    </div>

    <div class="panel">
      <div class="ph2">
        <span class="pt2">
          All visible employees <span class="pt2-sub" id="ec"></span>
        </span>
        <div class="pa">
          <button class="btn" onclick="exportCSV()">↓ Export</button> 
          ${userRole === 'HR' ? `<button class="btn p" onclick="openCreateModal()">+ Add</button>` : ''}
          <button class="btn p" onclick="renderEmp()">↺</button>
        </div>
      </div>

      <div class="fr">
        <input class="fi fi-s" id="e-q" placeholder="Search name, title, department, location..." oninput="filterEmpPage()"/>
        <input class="fi" id="e-id" placeholder="Search by ID" oninput="filterEmpPage()"/>

        <select class="fi fi-d" id="e-dept" onchange="filterEmpPage()">
          <option value="">All departments</option>
        </select>

        <select class="fi" id="e-gen" onchange="filterEmpPage()">
          <option value="">All genders</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <select class="fi" id="e-edu" onchange="filterEmpPage()">
          <option value="">All education</option>
        </select>
      </div>

      <div class="tw" id="e-table">
        <div class="loading-center">
          <span class="spin"></span>
        </div>
      </div>

      <!-- PAGINATION -->
      <div style="display:flex;justify-content:center;gap:10px;margin-top:10px;">
        <button class="btn" onclick="prevPage()" ${currentPage===0?'disabled':''}>◀ Prev</button>
        <span>Page ${currentPage + 1}</span>
        <button class="btn" onclick="nextPage()" ${empCache.length < pageSize?'disabled':''}>Next ▶</button>
      </div>

    </div>
  </div>

  <!-- UPDATE MODAL -->
  <div id="updateModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);align-items:center;justify-content:center;z-index:1000;">
    <div style="background:white;padding:20px;border-radius:10px;width:300px;">
      <h3>Update Salary</h3>
      <input id="modalSalary" type="number" placeholder="Enter salary" style="width:100%;margin-bottom:10px;padding:8px;">
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn p" onclick="submitUpdate()">Save</button>
      </div>
    </div>
  </div>

  <!-- CREATE MODAL -->
  <div id="createModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);align-items:center;justify-content:center;z-index:1000;">
    <div style="background:white;padding:20px;border-radius:10px;width:350px;">
      <h3>Create Employee</h3>

      <input id="c-id" class="fi" placeholder="Employee ID"/>
      <input id="c-name" class="fi" placeholder="Name"/>
      <input id="c-dept" class="fi" placeholder="Department"/>
      <input id="c-job" class="fi" placeholder="Job Title"/>
      <input id="c-loc" class="fi" placeholder="Location"/>
      <input id="c-sal" type="number" class="fi" placeholder="Salary"/>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;">
        <button class="btn" onclick="closeCreateModal()">Cancel</button>
        <button class="btn p" onclick="submitCreate()">Create</button>
      </div>
    </div>
  </div>`;

  // ✅ SHOW LOADING STATE
  document.getElementById('e-table').innerHTML =
    '<div class="loading-center"><span class="spin"></span></div>';

  await loadEmps();

  const depts=[...new Set(empCache.map(e=>e.department).filter(Boolean))].sort();
  const edus=[...new Set(empCache.map(e=>e.education_level).filter(Boolean))].sort();

  const ds=document.getElementById('e-dept');
  const es=document.getElementById('e-edu');

  depts.forEach(d=>{
    const o=new Option(d,d);
    ds?.appendChild(o);
  });

  edus.forEach(d=>{
    const o=new Option(d,d);
    es?.appendChild(o);
  });

  filterEmpPage();
}
// ══════════════════════════════════════════════
// FILTER EMPLOYEES (UPDATED WITH ID SEARCH)
// ══════════════════════════════════════════════
function filterEmpPage(){
  const q=(document.getElementById('e-q')||{}).value?.toLowerCase()||'';
  const id=(document.getElementById('e-id')||{}).value||'';
  const d=(document.getElementById('e-dept')||{}).value||'';
  const g=(document.getElementById('e-gen')||{}).value||'';
  const edu=(document.getElementById('e-edu')||{}).value||'';

  const filtered=empCache.filter(e=>{
  if(e.is_active === false) return false;

  const matchText =
    (e.emp_name||'').toLowerCase().includes(q) ||
    (e.job_title||'').toLowerCase().includes(q) ||
    (e.department||'').toLowerCase().includes(q) ||
    (e.location||'').toLowerCase().includes(q);

  const matchId = !id || String(e.emp_id).includes(id);

  return matchText &&
         matchId &&
         (!d || e.department===d) &&
         (!g || e.gender===g) &&
         (!edu || e.education_level===edu);
});

  const ct=document.getElementById('ec');
  if(ct) ct.textContent=`${filtered.length} records`;

  const el=document.getElementById('e-table');
  if(!el) return;

  if(!filtered.length){
    el.innerHTML='<div class="empty">No matching records.</div>';
    return;
  }

  el.innerHTML=`<table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Dept</th>
        <th>Job Title</th>
        <th>Exp</th>
        <th>Education</th>
        <th>Location</th>
        <th>Gender</th>
        <th>Salary</th><th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map(r=>`<tr>
        <td class="td-num">#${r.emp_id}</td>
        <td style="font-weight:500">${hl(r.emp_name,q)}</td>
        <td><span class="badge b-neutral">${hl(r.department,q)}</span></td>
        <td style="color:var(--text2)">${hl(r.job_title,q)}</td>
        <td class="td-num">${r.experience_years??'—'}y</td>
        <td style="color:var(--text2)">${r.education_level||'—'}</td>
        <td style="color:var(--text2)">${r.location||'—'}</td>
        <td><span class="badge ${r.gender==='Female'?'b-info':'b-neutral'}">${r.gender||'—'}</span></td>
        <td class="td-num">$${Number(r.salary||0).toLocaleString()}</td>
<td>
  <button class="btn sm" onclick="openUpdate(${r.emp_id})">Edit</button>
<button class="btn sm danger" onclick="deactivateEmployee(${r.emp_id}, this)">Deactivate</button></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

// ══════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════
function renderProfile(){
  const dn=S.displayName||CU.username;
  const myL=getMyLeaves();
  document.getElementById('main-area').innerHTML=`<div class="pw fade-up">
    <div class="ph"><div class="pt">My Profile</div><div class="ps">Account details and activity</div></div>
    <div class="pro-grid">
      <div class="pro-card">
        <div class="big-av">${dn[0].toUpperCase()}</div>
        <div class="pro-name">${dn}</div>
        <div class="pro-email">${CU.username}@corpsecure.com</div>
        <span class="badge ${RBADGE[CU.role]||'b-emp'}">${CU.role}</span>
        <div class="pro-details">
          <div class="pd"><div class="pd-l">Username</div><div class="pd-v">${CU.username}</div></div>
          <div class="pd"><div class="pd-l">Department</div><div class="pd-v">${CU.department||'—'}</div></div>
          <div class="pd"><div class="pd-l">DB User</div><div class="pd-v" style="font-family:var(--mono);font-size:11px">${CU.db_user||'—'}</div></div>
          <div class="pd"><div class="pd-l">Leave balance</div><div class="pd-v">${getLB()} days</div></div>
        </div>
        <button class="btn p" style="margin-top:14px;width:100%" onclick="nav('settings')">Edit preferences</button>
      </div>
      <div>
        <div class="panel" style="margin-bottom:1rem">
          <div class="ph2"><span class="pt2">Leave summary</span></div>
          <div class="pb">
            <div class="leave-stats">
              <div class="ls-card"><div class="ls-val" data-target="${getLB()}">${getLB()}</div><div class="ls-lbl">Available</div></div>
              <div class="ls-card"><div class="ls-val">${myL.length}</div><div class="ls-lbl">Total requests</div></div>
              <div class="ls-card"><div class="ls-val">${myL.filter(l=>l.status==='Approved').length}</div><div class="ls-lbl">Approved</div></div>
              <div class="ls-card"><div class="ls-val">${myL.filter(l=>l.status==='Pending').length}</div><div class="ls-lbl">Pending</div></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="ph2"><span class="pt2">Role permissions</span></div>
          <div class="pb">
            ${[['View employees','always'],['Update salaries',(PERMS[CU.role]||{}).update],['Approve leaves',(PERMS[CU.role]||{}).approve],['View audit logs',(PERMS[CU.role]||{}).audit],['Admin panel',CU.role==='Admin']].map(([l,v])=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:12px">
              <span style="color:var(--text2)">${l}</span>
              <span class="badge ${v===true||v==='always'?'b-ok':'b-fail'}">${v===true||v==='always'?'Granted':'Denied'}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// LEAVE
// ══════════════════════════════════════════════
function updateApprovalBadge(){
  const pend=getLeaves().filter(l=>l.status==='Pending').length;
  const b=document.getElementById('approval-badge');
  if(b){b.textContent=pend;b.style.display=pend>0?'inline':'none';}
}

function renderLeave(){
  const bal=getLB();const myL=getMyLeaves();
  document.getElementById('main-area').innerHTML=`<div class="pw fade-up">
    <div class="ph"><div class="pt">Apply for Leave</div><div class="ps">Submit and manage your leave requests</div></div>
    <div class="sg">
      <div class="sc"><div class="sc-lbl">Available days</div><div class="sc-val" style="color:var(--brand)">${bal}</div></div>
      <div class="sc"><div class="sc-lbl">Total requests</div><div class="sc-val">${myL.length}</div></div>
      <div class="sc"><div class="sc-lbl">Approved</div><div class="sc-val" style="color:var(--success)">${myL.filter(l=>l.status==='Approved').length}</div></div>
      <div class="sc"><div class="sc-lbl">Pending</div><div class="sc-val" style="color:var(--warn)">${myL.filter(l=>l.status==='Pending').length}</div></div>
      <div class="sc"><div class="sc-lbl">Rejected</div><div class="sc-val" style="color:var(--danger)">${myL.filter(l=>l.status==='Rejected').length}</div></div>
    </div>
    <div class="panel">
      <div class="ph2"><span class="pt2">New leave request</span></div>
      <div class="pb">
        <div class="fgrid">
          <div class="fg"><label>From date</label><input class="fi" style="width:100%" type="date" id="lv-f"/></div>
          <div class="fg"><label>To date</label><input class="fi" style="width:100%" type="date" id="lv-t"/></div>
          <div class="fg fg-full"><label>Type</label>
            <select class="fi" id="lv-type" style="width:100%"><option>Annual Leave</option><option>Sick Leave</option><option>Emergency Leave</option><option>Unpaid Leave</option></select>
          </div>
          <div class="fg fg-full"><label>Reason</label><textarea class="fi" id="lv-r" placeholder="Describe your reason..." style="width:100%;min-height:80px;resize:vertical"></textarea></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn p" onclick="applyLeave()">Submit request</button>
          <span style="font-size:11px;color:var(--text3)" id="lv-days"></span>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="ph2"><span class="pt2">My leave history</span></div>
      <div class="tw" id="lv-table">${leaveHistoryHTML(myL)}</div>
    </div>
  </div>`;
  ['lv-f','lv-t'].forEach(id=>document.getElementById(id)?.addEventListener('change',calcDays));
}

function calcDays(){
  const f=document.getElementById('lv-f')?.value,t=document.getElementById('lv-t')?.value;
  if(f&&t){const d=Math.ceil((new Date(t)-new Date(f))/(864e5))+1;document.getElementById('lv-days').textContent=d>0?`${d} day(s)`:'';}
}

function leaveHistoryHTML(leaves){
  if(!leaves.length)return'<div class="empty">No leave requests yet. Submit one above.</div>';
  return`<table><thead><tr><th>From</th><th>To</th><th>Days</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead><tbody>
  ${leaves.map(l=>`<tr>
    <td>${l.from}</td><td>${l.to}</td><td class="td-num">${l.days||'—'}</td>
    <td><span class="badge b-info">${l.type||'Annual'}</span></td>
    <td style="color:var(--text2);max-width:160px;overflow:hidden;text-overflow:ellipsis">${l.reason}</td>
    <td><span class="badge ${l.status==='Approved'?'b-ok':l.status==='Rejected'?'b-fail':'b-pend'}">${l.status}</span></td>
  </tr>`).join('')}
  </tbody></table>`;
}

function applyLeave(){
  const f=document.getElementById('lv-f')?.value;
  const t=document.getElementById('lv-t')?.value;
  const r=document.getElementById('lv-r')?.value.trim();
  const type=document.getElementById('lv-type')?.value;
  if(!f||!t||!r){toast('Please fill all fields','err');return;}
  if(new Date(t)<new Date(f)){toast('End date must be after start date','err');return;}
  const days=Math.ceil((new Date(t)-new Date(f))/(864e5))+1;
  const bal=getLB();
  if(type!=='Unpaid Leave'&&bal<days){toast(`Only ${bal} days available. Apply for Unpaid Leave or adjust dates.`,'warn');return;}
  const leaves=getLeaves();
  leaves.push({user:CU.username,from:f,to:t,reason:r,type,status:'Pending',days,applied:new Date().toISOString().split('T')[0]});
  setLeaves(leaves);
  if(type!=='Unpaid Leave')setLB(Math.max(0,bal-days));
  toast(`Leave applied for ${days} day(s). Awaiting approval.`);
  addNotif(`You applied for ${days} days of ${type}`);
  updateApprovalBadge();
  renderLeave();
}

// ══════════════════════════════════════════════
// LEAVE APPROVAL
// ══════════════════════════════════════════════
function renderApproval(){
  const perms=PERMS[CU.role]||{};
  const ma=document.getElementById('main-area');
  if(!perms.approve){
    ma.innerHTML=`<div class="pw fade-up"><div class="panel"><div class="locked"><div class="lock-ic">🔒</div><p>Only HR and Manager roles can approve leave requests.</p></div></div></div>`;
    return;
  }
  const leaves=getLeaves();
  ma.innerHTML=`<div class="pw fade-up">
    <div class="ph"><div class="pt">Leave Approval Panel</div><div class="ps">Review and action all pending requests</div></div>
    <div class="sg">
      <div class="sc"><div class="sc-lbl">Total requests</div><div class="sc-val">${leaves.length}</div></div>
      <div class="sc"><div class="sc-lbl">Pending</div><div class="sc-val" style="color:var(--warn)">${leaves.filter(l=>l.status==='Pending').length}</div></div>
      <div class="sc"><div class="sc-lbl">Approved</div><div class="sc-val" style="color:var(--success)">${leaves.filter(l=>l.status==='Approved').length}</div></div>
      <div class="sc"><div class="sc-lbl">Rejected</div><div class="sc-val" style="color:var(--danger)">${leaves.filter(l=>l.status==='Rejected').length}</div></div>
    </div>
    <div class="panel">
      <div class="ph2"><span class="pt2">All leave requests</span><div class="pa">
        <select class="fi" id="ap-filter" onchange="renderApproval()" style="font-size:11px;padding:4px 8px">
          <option value="">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option>
        </select>
      </div></div>
      <div class="tw">${approvalTableHTML(leaves)}</div>
    </div>
  </div>`;
}

function approvalTableHTML(leaves){
  const f=(document.getElementById('ap-filter')||{}).value||'';
  const filtered=f?leaves.filter(l=>l.status===f):leaves;

  if(!filtered.length) return '<div class="empty">No leave requests found.</div>';

  return `<table><thead><tr>
    <th>Employee</th><th>From</th><th>To</th><th>Days</th>
    <th>Type</th><th>Reason</th><th>Applied</th>
    <th>Status</th><th>Actions</th>
  </tr></thead><tbody>

  ${filtered.map((l,i)=>`<tr>
    <td style="font-weight:500">${l.user}</td>
    <td>${l.from}</td>
    <td>${l.to}</td>
    <td class="td-num">${l.days||'—'}</td>
    <td><span class="badge b-info">${l.type||'Annual'}</span></td>
    <td style="color:var(--text2);max-width:120px;overflow:hidden;text-overflow:ellipsis">${l.reason}</td>
    <td style="color:var(--text3);font-size:11px">${l.applied||'—'}</td>
    <td><span class="badge ${l.status==='Approved'?'b-ok':l.status==='Rejected'?'b-fail':'b-pend'}">${l.status}</span></td>

    <td style="display:flex;gap:5px;padding:8px 12px">
      <button class="btn sm p"
        onclick="actLeave(${i}, 'Approved')"
        ${l.status!=='Pending'?'disabled':''}>✓</button>

      <button class="btn sm d"
        onclick="actLeave(${i}, 'Rejected')"
        ${l.status!=='Pending'?'disabled':''}>✗</button>
    </td>

  </tr>`).join('')}

  </tbody></table>`;
}

function actLeave(i,status){

  console.log("Clicked leave:", i, status);   // DEBUG

  const leaves=getLeaves();

  console.log("Leaves data:", leaves);        // DEBUG

  if(!leaves[i]){
    console.log("Invalid index or no leave found"); // DEBUG
    return;
  }

  const old=leaves[i].status;

  leaves[i].status=status;

  setLeaves(leaves);

  if(status==='Rejected'&&old==='Approved'){
    const lb=JSON.parse(localStorage.getItem('cs-lb')||'{}');
    lb[leaves[i].user]=(lb[leaves[i].user]??20)+(leaves[i].days||0);
    localStorage.setItem('cs-lb',JSON.stringify(lb));
  }

  console.log("Updated leave:", leaves[i]);   // DEBUG

  toast(`Leave ${status.toLowerCase()} for ${leaves[i].user}`);

  addNotif(`${leaves[i].user}'s leave request ${status.toLowerCase()}`);

  updateApprovalBadge();

  renderApproval();
}

// ══════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════
async function renderReports(){
  const canAudit=(PERMS[CU.role]||{}).audit;

  document.getElementById('main-area').innerHTML=`<div class="pw fade-up">
    <div class="ph">
      <div class="pt">Reports</div>
      <div class="ps">Issue tracker and audit logs</div>
    </div>

    <div class="panel">
      <div class="ph2"><span class="pt2">Submit an issue</span></div>
      <div class="pb">
        <div class="al ok" id="rp-ok"></div>

        <div class="fg">
          <label>Subject</label>
          <input class="fi" id="rp-s" placeholder="Brief subject line" style="width:100%"/>
        </div>

        <div class="fg" style="margin-top:10px">
          <label>Description</label>
          <textarea class="fi" id="rp-d" placeholder="Describe your issue in detail…" style="width:100%;min-height:90px;resize:vertical"></textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:10px">
          <select class="fi" id="rp-pri">
            <option>Low Priority</option>
            <option>Medium Priority</option>
            <option>High Priority</option>
          </select>
          <button class="btn p" onclick="submitReport()">Submit issue</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="ph2">
        <span class="pt2">
          Recent Activity (Last 10 Logs)
          ${!canAudit?'<span class="pt2-sub">— Auditor role only</span>':''}
        </span>
        ${canAudit?`<button class="btn p" onclick="loadAuditLogs()">↺ Refresh</button>`:''}
      </div>

      <div class="tw" id="audit-table">
        ${canAudit
          ? '<div class="loading-center"><span class="spin"></span></div>'
          : '<div class="locked"><div class="lock-ic">🔒</div><p>Only the Auditor role can view audit logs.</p></div>'
        }
      </div>
    </div>
  </div>`;

  if(canAudit) loadAuditLogs();
}


function submitReport(){
  const s=document.getElementById('rp-s')?.value.trim();
  const d=document.getElementById('rp-d')?.value.trim();
  const p=document.getElementById('rp-pri')?.value;

  if(!s||!d){
    toast('Please fill all fields','err');
    return;
  }

  const ref='#'+Math.floor(Math.random()*9000+1000);

  const ok=document.getElementById('rp-ok');
  ok.style.display='flex';
  ok.textContent=`Issue submitted — Reference ${ref} (${p})`;

  toast(`Report submitted ${ref}`);
  addNotif(`Issue report submitted: ${s}`);

  document.getElementById('rp-s').value='';
  document.getElementById('rp-d').value='';

  setTimeout(()=>{ if(ok) ok.style.display='none'; },4000);
}


async function loadAuditLogs(){
  const el=document.getElementById('audit-table');
  if(!el) return;

  el.innerHTML='<div class="loading-center"><span class="spin"></span></div>';

  try{
    if(token==='mock') throw 0;

    const r=await fetch(`${API}/audit-logs`,{
      headers:{ Authorization:`Bearer ${token}` }
    });

    if(!r.ok) throw await r.json();

    let data=await r.json();

    // SHOW ONLY LAST 10 (NEWEST FIRST)
    data = data.slice(-10).reverse();

    if(!data.length){
      el.innerHTML='<div class="empty">No recent audit activity.</div>';
      return;
    }

    el.innerHTML=`<table>
      <thead>
        <tr>
          <th>ID</th>
          <th>User</th>
          <th>Action</th>
          <th>Table</th>
          <th>Result</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>

      ${data.map(r=>`<tr>
        <td class="td-num">#${r.audit_id}</td>
        <td class="td-num">${r.user_id||'—'}</td>

        <td>
          <span class="badge b-neutral" style="font-family:var(--mono);font-size:10px">
            ${r.action}
          </span>
        </td>

        <td class="td-num">${r.table_name}</td>

        <td>
          <span class="badge ${r.result==='SUCCESS'?'b-ok':'b-fail'}">
            ${r.result}
          </span>
        </td>

        <td style="color:var(--text3);font-size:11px">
          ${r.access_time
            ? new Date(r.access_time).toLocaleString('en-IN')
            : '—'}
        </td>
      </tr>`).join('')}

      </tbody>
    </table>`;

  }catch(e){

    // MOCK DATA (ALSO LIMITED TO 10)
    const mock=[
      {audit_id:1,user_id:3,action:'SELECT',table_name:'employees',result:'SUCCESS',access_time:new Date().toISOString()},
      {audit_id:2,user_id:2,action:'UPDATE',table_name:'employees',result:'SUCCESS',access_time:new Date(Date.now()-3e5).toISOString()},
      {audit_id:3,user_id:1,action:'DELETE',table_name:'employees',result:'SUCCESS',access_time:new Date(Date.now()-6e5).toISOString()},
    ].slice(-10).reverse();

    el.innerHTML=`<div style="padding:6px 12px;font-size:10px;color:var(--warn-t);background:var(--warn-l);border-bottom:0.5px solid var(--border)">
      Demo mode — showing recent audit activity
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th><th>User</th><th>Action</th><th>Table</th><th>Result</th><th>Time</th>
        </tr>
      </thead>
      <tbody>

      ${mock.map(r=>`<tr>
        <td class="td-num">#${r.audit_id}</td>
        <td class="td-num">${r.user_id}</td>

        <td>
          <span class="badge b-neutral" style="font-family:var(--mono);font-size:10px">
            ${r.action}
          </span>
        </td>

        <td class="td-num">${r.table_name}</td>

        <td><span class="badge b-ok">${r.result}</span></td>

        <td style="color:var(--text3);font-size:11px">
          ${new Date(r.access_time).toLocaleString('en-IN')}
        </td>
      </tr>`).join('')}

      </tbody>
    </table>`;
  }
}

// ══════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════
function renderSettings(){
  document.getElementById('main-area').innerHTML=`<div class="pw fade-up">
    <div class="ph"><div class="pt">Settings</div><div class="ps">Customise your CorpSecure experience</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div class="panel">
        <div class="ph2"><span class="pt2">Appearance</span></div>
        <div class="pb">
          <div class="trow">
            <div><div class="tl">Dark mode</div><div class="ts">Use dark colour scheme</div></div>
            <label class="tog"><input type="checkbox" id="s-dark" ${S.darkMode?'checked':''}><div class="tog-track"></div><div class="tog-thumb"></div></label>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="ph2"><span class="pt2">Notifications</span></div>
        <div class="pb">
          <div class="trow">
            <div><div class="tl">System notifications</div><div class="ts">Leave status alerts</div></div>
            <label class="tog"><input type="checkbox" id="s-notif" ${S.notifications?'checked':''}><div class="tog-track"></div><div class="tog-thumb"></div></label>
          </div>
          <div class="trow">
            <div><div class="tl">Auto-refresh dashboard</div><div class="ts">Refresh every 60 seconds</div></div>
            <label class="tog"><input type="checkbox" id="s-refresh" ${S.autoRefresh?'checked':''}><div class="tog-track"></div><div class="tog-thumb"></div></label>
          </div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="ph2"><span class="pt2">User preferences</span></div>
      <div class="pb">
        <div class="fg"><label>Display name</label><input class="fi" id="s-dn" value="${S.displayName}" placeholder="Enter your display name" style="width:100%;max-width:320px"/><div class="form-hint">Shown in the topbar and dashboard. Leave blank to use username.</div></div>
      </div>
    </div>
    <div class="panel">
      <div class="ph2"><span class="pt2">Session info</span></div>
      <div class="pb" style="font-size:12px;color:var(--text2)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[['Username',CU.username],['Role',CU.role],['Department',CU.department||'—'],['DB User',CU.db_user||'—'],['Token',token==='mock'?'Mock (offline)':'JWT (live)'],['Session','Active']].map(([l,v])=>`
          <div class="pd"><div class="pd-l">${l}</div><div class="pd-v" style="font-size:11px${l==='DB User'?';font-family:var(--mono)':''}">${v}</div></div>`).join('')}
        </div>
      </div>
    </div>
    <button class="btn p" onclick="saveSettings()">Save settings</button>
  </div>`;
}

function saveSettings(){
  S.darkMode=document.getElementById('s-dark')?.checked||false;
  S.notifications=document.getElementById('s-notif')?.checked||true;
  S.autoRefresh=document.getElementById('s-refresh')?.checked||false;
  S.displayName=document.getElementById('s-dn')?.value.trim()||'';
  saveS();applyDark();
  const dn=S.displayName||CU.username;
  document.getElementById('t-av').textContent=dn[0].toUpperCase();
  document.getElementById('t-name').textContent=dn;
  toast('Settings saved');
}

// ══════════════════════════════════════════════
// API REFERENCE
// ══════════════════════════════════════════════
function renderAPI(){
  const eps=[
    {m:'POST',p:'/login',d:'Authenticate user, returns JWT token',r:'All'},
    {m:'GET',p:'/employees',d:'Fetch visible employees (RLS filtered)',r:'All'},
    {m:'PUT',p:'/employees/update-salary',d:'Add $500 to own department salaries',r:'HR, Manager'},
    {m:'GET',p:'/audit-logs',d:'Retrieve audit log entries',r:'Auditor'}
  ];
  const mc={POST:'b-info',GET:'b-ok',PUT:'b-pend',DELETE:'b-fail'};
  document.getElementById('main-area').innerHTML=`<div class="pw fade-up">
    <div class="ph"><div class="pt">API Reference</div><div class="ps">FastAPI backend · localhost:8000</div></div>
    <div class="panel">
      <div class="ph2"><span class="pt2">Endpoints</span></div>
      ${eps.map(e=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 1.1rem;border-bottom:0.5px solid var(--border);font-size:12px">
        <span class="badge ${mc[e.m]||'b-neutral'}" style="font-family:var(--mono);min-width:40px;text-align:center">${e.m}</span>
        <span style="font-family:var(--mono);font-size:11px;flex:1">${e.p}</span>
        <span style="color:var(--text2);flex:2">${e.d}</span>
        <span class="badge b-neutral">${e.r}</span>
      </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div class="panel">
        <div class="ph2"><span class="pt2">JWT payload (current session)</span></div>
        <div style="padding:1rem;background:var(--bg2);font-family:var(--mono);font-size:11px;color:var(--text2);line-height:1.9;white-space:pre-wrap;border-radius:0 0 var(--rl) var(--rl)">${JSON.stringify({username:CU.username,role:CU.role,department:CU.department,db_user:CU.db_user},null,2)}</div>
      </div>
      <div class="panel">
        <div class="ph2"><span class="pt2">Active RLS policy</span></div>
        <div style="padding:1rem;background:var(--bg2);font-size:11px;color:var(--text2);line-height:1.8;border-radius:0 0 var(--rl) var(--rl);font-family:var(--mono)">${getRLSDesc()}</div>
      </div>
    </div>
    <div class="panel">
      <div class="ph2"><span class="pt2">Security architecture</span></div>
      <div class="pb" style="font-size:12px;color:var(--text2);line-height:1.8">
        <strong style="color:var(--text)">Auth flow:</strong> Login → FastAPI validates credentials → JWT issued with {username, role, department, db_user}<br>
        <strong style="color:var(--text)">DB connection:</strong> Each role uses a dedicated PostgreSQL user (app_hr, app_manager, etc.) with limited table grants<br>
        <strong style="color:var(--text)">RLS:</strong> PostgreSQL reads <span style="font-family:var(--mono);font-size:11px;background:var(--bg2);padding:1px 5px;border-radius:3px">app.role</span>, <span style="font-family:var(--mono);font-size:11px;background:var(--bg2);padding:1px 5px;border-radius:3px">app.department</span>, <span style="font-family:var(--mono);font-size:11px;background:var(--bg2);padding:1px 5px;border-radius:3px">app.username</span> session variables to filter rows automatically<br>
        <strong style="color:var(--text)">Audit:</strong> PostgreSQL triggers on INSERT/UPDATE/DELETE log every change to audit_logs with user and timestamp
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
(function init(){
  loadS();applyDark();
  document.getElementById('l-p')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
})();

function searchEmployee(){
  const id = document.getElementById("searchId")?.value;
  searchEmployeeById(id);
}

async function deactivateEmployee(empId, btn){

  if(!confirm("Deactivate this employee?")) return;

  if(btn) btn.disabled = true;

  try{
    const res = await fetch(`${BASE_URL}/employees/${empId}/inactive`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if(!res.ok){
      throw new Error();
    }

    toast("Employee deactivated");

    // FORCE CLEAN RELOAD
    await renderEmp();

  }catch(e){
    toast("Operation failed");
    if(btn) btn.disabled = false;
  }
}

function openCreateModal(){
  const modal = document.getElementById("createModal");
  if(modal){
    modal.style.display = "flex";
  }else{
    console.error("createModal not found");
  }
}

function closeCreateModal(){
  const modal = document.getElementById("createModal");
  if(modal){
    modal.style.display = "none";
  }
}

async function submitCreate(){

  const data = {
    emp_id: Number(document.getElementById("c-id").value),
    emp_name: document.getElementById("c-name").value,
    department: document.getElementById("c-dept").value,
    job_title: document.getElementById("c-job").value,
    location: document.getElementById("c-loc").value,
    salary: Number(document.getElementById("c-sal").value),

    age: 30,
    gender: "Male",
    experience_years: 2,
    education_level: "Graduate",
    username: "emp" + Date.now()
  };

  console.log("CREATE DATA:", data); // DEBUG

  try{
    const res = await fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log("RESPONSE:", result); // DEBUG

    if(!res.ok){
      throw new Error(result.detail || "Create failed");
    }

    toast("Employee created");

    closeCreateModal();
    renderEmp();

  }catch(e){
    console.error(e);
    toast("Create failed");
  }
}

function nextPage(){
  if(empCache.length < pageSize){
    toast("No more records");
    return;
  }

  currentPage++;
  renderEmp();
}

function prevPage(){
  if(currentPage > 0){
    currentPage--;
    renderEmp();
  }
}

// async function approveLeave(leaveId, btn){

//   if(!confirm("Approve this leave?")) return;

//   if(btn) btn.disabled = true;

//   try{
//     const res = await fetch(`${BASE_URL}/leave/${leaveId}/approve`, {
//       method: "PATCH",
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     });

//     if(!res.ok){
//       throw new Error();
//     }

//     toast("Leave approved");

//     renderApproval(); // reload page

//   }catch(e){
//     console.error(e);
//     toast("Approval failed");
//     if(btn) btn.disabled = false;
//   }
// }

// 🔧 SAFETY FIX — ensure script ends cleanly
try{
  // no-op to safely terminate script
}catch(e){
  console.error("Script termination fix", e);
}