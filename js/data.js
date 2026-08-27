// ================= Mock Database (localStorage) — SUPABASE-READY LAYER ==================
// TODO(Supabase): Replace this layer with @supabase/supabase-js calls.
// The API surface (DB.users.*, DB.bookings.*, DB.attendants.*) mirrors typical supabase queries.
// See README-SUPABASE.md for migration guide.
// ========================================================================================

const STORAGE = {
  users: 'cdpb.users',
  bookings: 'cdpb.bookings',
  attendants: 'cdpb.attendants',
  session: 'cdpb.session',
  attendantSession: 'cdpb.attendantSession',
  seeded: 'cdpb.seeded_v1'
};

// ---- Placeholder Supabase config (fill in when integrating) ----
window.SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',   // TODO: substituir
  anonKey: 'YOUR_ANON_KEY'                   // TODO: substituir
};

function uid(){return 'id_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
function now(){return new Date().toISOString()}

function load(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return []}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}

// ---- Seed test users ----
function seed(){
  if(localStorage.getItem(STORAGE.seeded))return;
  const users = [
    {
      id:'usr_test_maria', email:'maria@teste.pt', password:'123456',
      name:'Maria Silva', doc_type:'cartao_cidadao', doc_number:'12345678 9 ZZ1',
      photo:null, phone:'+351 912 345 678',
      accept_lgpd:true, accept_marketing:true, created_at:now()
    },
    {
      id:'usr_test_joao', email:'joao@teste.pt', password:'123456',
      name:'João Ferreira', doc_type:'titulo_residencia', doc_number:'A1234567',
      photo:null, phone:'+351 913 111 222',
      accept_lgpd:true, accept_marketing:false, created_at:now()
    }
  ];
  save(STORAGE.users,users);

  const attendants = [
    {id:'att_ana', email:'ana@buarcos.pt', password:'atendente123', name:'Ana Costa', role:'atendente'},
    {id:'att_pedro', email:'pedro@buarcos.pt', password:'atendente123', name:'Pedro Almeida', role:'atendente'}
  ];
  save(STORAGE.attendants,attendants);

  // Sample bookings for Maria (one today, one future)
  const today = new Date();
  const t1 = new Date(today); t1.setHours(15,0,0,0);
  const t2 = new Date(today); t2.setDate(t2.getDate()+2); t2.setHours(10,0,0,0);
  const bookings = [
    {id:uid(),user_id:'usr_test_maria',sport:'padel',date:t1.toISOString().slice(0,10),time:'15:00',status:'pending',created_at:now()},
    {id:uid(),user_id:'usr_test_maria',sport:'mini_golf',date:t2.toISOString().slice(0,10),time:'10:00',status:'pending',created_at:now()}
  ];
  save(STORAGE.bookings,bookings);

  localStorage.setItem(STORAGE.seeded,'1');
}
seed();

const SPORTS = {
  mini_golf:   {name:'Mini-Golfe',       icon:'⛳', slots:['09:00','10:00','11:00','14:00','15:00','16:00','17:00']},
  golf:        {name:'Campo de Golfe',   icon:'🏌️', slots:['08:00','09:30','11:00','13:00','14:30','16:00']},
  driving_range:{name:'Treino de Tacadas',icon:'🎯', slots:['09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00']},
  padel:       {name:'Padel',            icon:'🎾', slots:['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00']}
};

const DOC_TYPES = {
  passaporte:'Passaporte',
  titulo_residencia:'Título de Residência',
  cartao_cidadao:'Cartão Cidadão Português'
};

// ---- DB API (mirrors supabase style) ----
const DB = {
  users:{
    all(){return load(STORAGE.users)},
    byEmail(email){return this.all().find(u=>u.email.toLowerCase()===email.toLowerCase())},
    byId(id){return this.all().find(u=>u.id===id)},
    insert(user){const arr=this.all();arr.push(user);save(STORAGE.users,arr);return user},
    update(id,patch){const arr=this.all();const i=arr.findIndex(u=>u.id===id);if(i>-1){arr[i]={...arr[i],...patch};save(STORAGE.users,arr);return arr[i]}return null}
  },
  attendants:{
    all(){return load(STORAGE.attendants)},
    byEmail(email){return this.all().find(a=>a.email.toLowerCase()===email.toLowerCase())}
  },
  bookings:{
    all(){return load(STORAGE.bookings)},
    byUser(uid){return this.all().filter(b=>b.user_id===uid).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))},
    byId(id){return this.all().find(b=>b.id===id)},
    insert(b){const arr=this.all();arr.push(b);save(STORAGE.bookings,arr);return b},
    update(id,patch){const arr=this.all();const i=arr.findIndex(b=>b.id===id);if(i>-1){arr[i]={...arr[i],...patch};save(STORAGE.bookings,arr);return arr[i]}return null},
    remove(id){save(STORAGE.bookings,this.all().filter(b=>b.id!==id))},
    activeToday(){
      const today=new Date().toISOString().slice(0,10);
      return this.all().filter(b=>b.date===today && b.status!=='cancelled')
    }
  },
  session:{
    get(){try{return JSON.parse(localStorage.getItem(STORAGE.session))}catch(e){return null}},
    set(u){localStorage.setItem(STORAGE.session,JSON.stringify(u))},
    clear(){localStorage.removeItem(STORAGE.session)}
  },
  attendantSession:{
    get(){try{return JSON.parse(localStorage.getItem(STORAGE.attendantSession))}catch(e){return null}},
    set(a){localStorage.setItem(STORAGE.attendantSession,JSON.stringify(a))},
    clear(){localStorage.removeItem(STORAGE.attendantSession)}
  }
};

// ---- Helpers ----
function fmtDate(iso){
  const d=new Date(iso+'T00:00:00');
  return d.toLocaleDateString('pt-PT',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
}
function fmtDateTime(iso){
  const d=new Date(iso);
  return d.toLocaleString('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function initials(name){return (name||'').split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase()}

function toast(msg,type=''){
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}
  t.className='toast '+type;
  t.textContent=msg;
  requestAnimationFrame(()=>t.classList.add('show'));
  clearTimeout(t._h);
  t._h=setTimeout(()=>t.classList.remove('show'),2800);
}

function requireUser(redirect='login.html'){
  const s=DB.session.get();
  if(!s){location.href=redirect;return null}
  return s;
}
function requireAttendant(redirect='login.html?attendant=1'){
  const s=DB.attendantSession.get();
  if(!s){location.href=redirect;return null}
  return s;
}
