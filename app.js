
import { SHEET_WEBHOOK_URL } from './config.js';

const LS_BOOKINGS='cd_bookings_v2'; const LS_JOBS='cd_jobs_v2'; const LS_CHECKLIST='cd_checklist_v2';

const load=(k,f)=>{ try{return JSON.parse(localStorage.getItem(k)) ?? f;}catch{return f;} };
const save=(k,v)=> localStorage.setItem(k, JSON.stringify(v));

function addDays(d,n){const x=new Date(d); x.setDate(x.getDate()+n); return x;}

export function ensureSeedData(){
  const bookings=load(LS_BOOKINGS,[]);
  if(bookings.length===0){
    const now=new Date();
    save(LS_BOOKINGS,[
      {id:101,customer:'John Doe',phone:'0400 000 111',service:'Wash & Polish',date:now.toISOString().slice(0,10),status:'Completed'},
      {id:102,customer:'Jane Smith',phone:'0400 222 333',service:'Interior Detailing',date:addDays(now,1).toISOString().slice(0,10),status:'Pending'}
    ]);
  }
  const jobs=load(LS_JOBS,[]);
  if(jobs.length===0){
    const now=new Date();
    save(LS_JOBS,[
      {id:101,title:'Wash & Polish',address:'12 River St, Brisbane',when:now.toISOString().slice(0,10),assignedTo:'Sam'},
      {id:102,title:'Interior Detailing',address:'88 Queen St, Brisbane',when:addDays(now,1).toISOString().slice(0,10),assignedTo:'Lee'}
    ]);
  }
}

// === Booking workflow ===
export function handleBookingForm(form, onSaved){
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const bookings=load(LS_BOOKINGS,[]);
    const id=Date.now();
    const entry={ id, customer:data.name, phone:data.phone, service:data.service, date:data.date, status:'Pending' };
    bookings.push(entry); save(LS_BOOKINGS, bookings);
    try { await sendToSheet(entry); } catch(e){ console.warn('Sheet logging failed:', e); }
    onSaved?.(id);
    form.reset();
  });
}

async function sendToSheet(entry){
  if(!SHEET_WEBHOOK_URL) return;
  const payload={...entry, source:'website'};
  const res=await fetch(SHEET_WEBHOOK_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}

// === Employee ===
export function renderJobs(tbody){
  const jobs=load(LS_JOBS,[]);
  tbody.innerHTML=jobs.map(j=>`
    <tr><td>${j.id}</td><td>${j.title}</td><td>${j.address}</td><td>${j.when}</td><td>${j.assignedTo}</td></tr>
  `).join('');
}

// === Manager ===
export function renderBookings(tbody){
  const bookings=load(LS_BOOKINGS,[]);
  tbody.innerHTML=bookings.map(b=>`
    <tr>
      <td>${b.id}</td>
      <td>${b.customer}<br><small class="muted">${b.phone||''}</small></td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td><span class="badge">${b.status}</span></td>
      <td class="actions">
        <button data-action="status" data-id="${b.id}" data-status="Pending">Pending</button>
        <button data-action="status" data-id="${b.id}" data-status="In Progress">In Progress</button>
        <button data-action="status" data-id="${b.id}" data-status="Completed">Completed</button>
        <button data-action="delete" data-id="${b.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

export function attachManagerActions(tbody, refresh){
  tbody.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const id=Number(btn.dataset.id), action=btn.dataset.action;
    const bookings=load(LS_BOOKINGS,[]);
    if(action==='status'){
      const t=bookings.find(b=>b.id===id);
      if(t){ t.status=btn.dataset.status; save(LS_BOOKINGS,bookings); refresh(); }
    } else if(action==='delete'){
      save(LS_BOOKINGS, bookings.filter(b=>b.id!==id)); refresh();
    }
  });
}

export function exportBookings(){
  const data=load(LS_BOOKINGS,[]);
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='bookings-export.json'; a.click(); URL.revokeObjectURL(url);
}

export function importBookings(input, onDone){
  const file=input.files?.[0]; if(!file) return;
  const r=new FileReader();
  r.onload=()=>{ try{ save(LS_BOOKINGS, JSON.parse(r.result)); onDone?.(true);}catch{onDone?.(false);} };
  r.readAsText(file);
}

// === Checklist ===
export function renderChecklist(listEl){
  const items=load(LS_CHECKLIST, defaultChecklist());
  listEl.innerHTML=items.map((it,i)=>`
    <li class="inline">
      <input type="checkbox" data-idx="${i}" ${it.done?'checked':''}>
      <span>${it.text}</span>
    </li>
  `).join('');
}
export function attachChecklist(listEl){
  listEl.addEventListener('change',(e)=>{
    const idx=Number(e.target.dataset.idx);
    const items=load(LS_CHECKLIST, defaultChecklist());
    items[idx].done=e.target.checked; save(LS_CHECKLIST, items);
  });
}
function defaultChecklist(){
  return [
    {text:'Header/nav/footer baseline',done:true},
    {text:'Booking -> localStorage',done:true},
    {text:'Booking -> Google Sheet webhook',done:false},
    {text:'Manager status controls',done:true},
    {text:'Export/Import bookings',done:true}
  ];
}

export function clearAllData(){
  localStorage.removeItem(LS_BOOKINGS);
  localStorage.removeItem(LS_JOBS);
  localStorage.removeItem(LS_CHECKLIST);
  alert('Local data cleared.');
}
