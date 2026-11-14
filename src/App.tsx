import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Bell, Bike, CalendarDays, ChevronLeft, ChevronRight, FileUp, Gauge, HeartPulse, Menu, Plus, Settings, UserRound, X } from 'lucide-react'
import './App.css'
import './phase2.css'
import './auth.css'
import { backendConfigured, supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

const nav = [['Visão geral', Gauge], ['Calendário', CalendarDays], ['Atividades', Activity], ['Análise', BarChart3], ['Monitorização', HeartPulse], ['Treinos', Bike], ['Perfil', UserRound], ['Definições', Settings]] as const
type Page = typeof nav[number][0]
type Workout = { id: number; name: string; date: string; duration: number; intensity: string }

function Empty({ icon: Icon, title, text, action }: { icon: typeof CalendarDays; title: string; text: string; action?: string }) {
  return <div className="empty"><Icon/><h3>{title}</h3><p>{text}</p>{action && <button className="secondary">{action}</button>}</div>
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!backendConfigured)
  const [active, setActive] = useState<Page>('Visão geral')
  const [menu, setMenu] = useState(false)
  const [modal, setModal] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>(() => JSON.parse(localStorage.getItem('lc-workouts') || '[]'))
  const [month, setMonth] = useState(new Date(2026, 10, 1))

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  function go(page: Page) { setActive(page); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function addWorkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const next = [...workouts, { id: Date.now(), name: String(form.get('name')), date: String(form.get('date')), duration: Number(form.get('duration')), intensity: String(form.get('intensity')) }]
    setWorkouts(next); localStorage.setItem('lc-workouts', JSON.stringify(next)); setModal(false)
  }
  const totalMinutes = useMemo(() => workouts.reduce((sum, w) => sum + w.duration, 0), [workouts])

  function pageContent() {
    if (active === 'Visão geral') return <>
      <section className="hero"><div><span className="eyebrow">CENTRO DE DESEMPENHO</span><h1>Pedala com<br/><em>propósito.</em></h1><p>Planeamento, recuperação e análise de ciclismo numa única aplicação privada.</p><button className="primary" onClick={() => go('Calendário')}>Abrir calendário <ChevronRight/></button></div><div className="rings"><div><span>{workouts.length || '—'}</span><small>TREINOS PLANEADOS</small></div></div></section>
      <section className="metrics"><article><span>VOLUME PLANEADO</span><strong>{totalMinutes ? `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : '—'}</strong><small>Todos os treinos</small></article><article><span>PRÓXIMO TREINO</span><strong>{workouts[0]?.name || '—'}</strong><small>{workouts[0]?.date || 'Ainda não planeado'}</small></article><article><span>ESTADO</span><strong className="ready">ATIVO</strong><small>Interface funcional</small></article></section>
      <section className="lower"><article className="panel"><div className="panel-title"><div><span>PLANO</span><h2>Próximos treinos</h2></div><button onClick={() => go('Calendário')}>Ver calendário</button></div>{workouts.length ? <div className="list">{workouts.slice(0,3).map(w => <div className="list-row" key={w.id}><i/><div><b>{w.name}</b><small>{w.date} · {w.duration} min</small></div><span>{w.intensity}</span></div>)}</div> : <Empty icon={CalendarDays} title="O calendário está livre" text="Cria o primeiro treino para começar o plano."/>}</article><article className="panel progress"><span>FASE 2</span><h2>Interface completa</h2><ul><li className="done">Navegação entre páginas</li><li className="done">Layout responsivo</li><li className="done">Calendário funcional</li><li>Autenticação privada</li><li>Sincronização Supabase</li></ul></article></section>
    </>
    if (active === 'Calendário') return <PageFrame kicker="PLANEAMENTO" title="Calendário" action={<button className="primary compact" onClick={() => setModal(true)}><Plus/> Criar treino</button>}><div className="calendar-head"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()-1))}><ChevronLeft/></button><h2>{month.toLocaleDateString('pt-PT',{month:'long',year:'numeric'})}</h2><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()+1))}><ChevronRight/></button></div><div className="weekdays">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=><b key={d}>{d}</b>)}</div><div className="calendar-grid">{Array.from({length:35},(_,i)=>{const day=i-((new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7)+1; const valid=day>0&&day<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(); const date=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; return <div key={i} className={!valid?'muted-day':''}><span>{valid?day:''}</span>{valid&&workouts.filter(w=>w.date===date).map(w=><button className="workout-chip" key={w.id}>{w.name}<small>{w.duration} min</small></button>)}</div>})}</div></PageFrame>
    if (active === 'Atividades') return <PageFrame kicker="FICHEIROS E HISTÓRICO" title="Atividades"><Empty icon={FileUp} title="Importa a primeira atividade" text="Na Fase 6 serão processados ficheiros FIT, GPX e TCX. A interface está pronta para receber o importador real." action="Selecionar ficheiro"/></PageFrame>
    if (active === 'Análise') return <PageFrame kicker="DESEMPENHO" title="Análise"><div className="cards"><InfoCard label="POTÊNCIA NORMALIZADA" value="—" text="Requer dados de potência"/><InfoCard label="TSS" value="—" text="Requer FTP e atividade"/><InfoCard label="CARGA CRÓNICA" value="—" text="Requer histórico suficiente"/></div><div className="chart-empty"><BarChart3/><h3>Análise sem estimativas fictícias</h3><p>Os gráficos serão apresentados depois da importação de atividades reais.</p></div></PageFrame>
    if (active === 'Monitorização') return <PageFrame kicker="RECUPERAÇÃO" title="Monitorização" action={<button className="primary compact"><Plus/> Novo registo</button>}><div className="cards"><InfoCard label="SONO" value="—" text="Sem registo hoje"/><InfoCard label="HRV" value="—" text="Sem registo hoje"/><InfoCard label="FADIGA" value="—" text="Sem registo hoje"/></div><Empty icon={HeartPulse} title="Ainda não existem registos" text="Os dados serão privados e partilhados apenas por autorização do atleta."/></PageFrame>
    if (active === 'Treinos') return <PageFrame kicker="BIBLIOTECA" title="Treinos" action={<button className="primary compact" onClick={() => setModal(true)}><Plus/> Criar treino</button>}>{workouts.length ? <div className="workout-list">{workouts.map(w=><article key={w.id}><Bike/><div><h3>{w.name}</h3><p>{w.date} · {w.duration} minutos · {w.intensity}</p></div><button onClick={()=>{const next=workouts.filter(x=>x.id!==w.id);setWorkouts(next);localStorage.setItem('lc-workouts',JSON.stringify(next))}}>Eliminar</button></article>)}</div> : <Empty icon={Bike} title="Biblioteca vazia" text="Cria treinos e guarda-os no calendário."/>}</PageFrame>
    if (active === 'Perfil') return <PageFrame kicker="ATLETA" title="Perfil desportivo"><form className="profile-form"><label>Nome<input placeholder="O teu nome"/></label><label>Modalidade<select><option>Ciclismo de estrada</option><option>BTT</option><option>Gravel</option></select></label><label>FTP atual<input type="number" placeholder="Watts"/></label><label>FC máxima<input type="number" placeholder="bpm"/></label><label>Unidades<select><option>Métricas (km, kg)</option><option>Imperiais</option></select></label><button type="button" className="primary compact">Guardar perfil</button></form></PageFrame>
    return <PageFrame kicker="APLICAÇÃO" title="Definições"><div className="settings-list"><label><div><b>Modo escuro</b><small>Identidade visual principal</small></div><input type="checkbox" defaultChecked/></label><label><div><b>Notificações internas</b><small>Treinos, alterações e comentários</small></div><input type="checkbox" defaultChecked/></label><label><div><b>Supabase</b><small>Será ligado na Fase 3</small></div><span className="status">Por configurar</span></label></div></PageFrame>
  }

  if (!authReady) return <div className="auth-loading">A ligar ao Luciozz Cycling…</div>
  if (backendConfigured && !session) return <AuthScreen />
  return <div className="app">{menu&&<button className="scrim" onClick={()=>setMenu(false)}/>}<aside className={menu?'sidebar open':'sidebar'}><div className="brand"><span>LC</span><div><b>LUCIOZZ</b><small>CYCLING</small></div><button onClick={()=>setMenu(false)}><X/></button></div><p className="nav-label">TREINO</p><nav>{nav.map(([label,Icon])=><button key={label} className={active===label?'active':''} onClick={()=>go(label)}><Icon/>{label}</button>)}</nav><div className="sync online"><i/><div><b>{backendConfigured?'Supabase ligado':'Modo local'}</b><small>{backendConfigured?session?.user.email:'Dados neste navegador'}</small></div></div></aside><main><header><button className="hamb" onClick={()=>setMenu(true)}><Menu/></button><div><span>14 NOV 2026</span><b>{active}</b></div><div className="header-actions">{backendConfigured&&<button className="logout" onClick={()=>supabase?.auth.signOut()}>Sair</button>}<button className="bell"><Bell/><i/></button></div></header><div className="content">{pageContent()}</div></main>{modal&&<div className="modal-back"><form className="modal" onSubmit={addWorkout}><div className="modal-title"><div><span>NOVO PLANO</span><h2>Criar treino</h2></div><button type="button" onClick={()=>setModal(false)}><X/></button></div><label>Nome<input name="name" required placeholder="Ex.: Sweet Spot"/></label><div className="form-row"><label>Data<input name="date" required type="date"/></label><label>Duração (min)<input name="duration" required type="number" min="1"/></label></div><label>Intensidade<select name="intensity"><option>Recuperação</option><option>Baixa</option><option>Moderada</option><option>Alta</option><option>Máxima</option></select></label><button className="primary" type="submit">Guardar treino</button></form></div>}</div>
}

function AuthScreen(){
  const [register,setRegister]=useState(false); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); const [email,setEmail]=useState('')
  const redirectTo=`${window.location.origin}${import.meta.env.BASE_URL}`
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage('');const data=new FormData(event.currentTarget);const password=String(data.get('password'));const result=register?await supabase!.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{display_name:String(data.get('name')),role:String(data.get('role'))}}}):await supabase!.auth.signInWithPassword({email,password});setBusy(false);setMessage(result.error?.message|| (register?'Verifica o teu email para confirmar a conta.':'Sessão iniciada.'))}
  async function resend(){if(!email){setMessage('Introduz primeiro o teu email.');return}setBusy(true);const {error}=await supabase!.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectTo}});setBusy(false);setMessage(error?.message||'Novo email de confirmação enviado.')}
  return <main className="auth-page"><section className="auth-brand"><span>LC</span><p>LUCIOZZ CYCLING</p><h1>O teu treino.<br/><em>O teu progresso.</em></h1><small>Uma plataforma privada para atleta e treinador.</small></section><form className="auth-card" onSubmit={submit}><span>ACESSO PRIVADO</span><h2>{register?'Criar conta autorizada':'Bem-vindo'}</h2><p>{register?'Cria primeiro a conta do atleta e depois a do treinador.':'Inicia sessão para aceder ao teu plano.'}</p>{register&&<><label>Nome<input name="name" required/></label><label>Perfil<select name="role"><option value="athlete">Atleta</option><option value="coach">Treinador</option></select></label></>}<label>Email<input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Palavra-passe<input name="password" type="password" minLength={8} required/></label>{message&&<div className="auth-message">{message}</div>}<button className="primary" disabled={busy}>{busy?'A processar…':register?'Criar conta':'Entrar'}</button>{register&&<button type="button" className="auth-switch" onClick={resend}>Reenviar confirmação</button>}<button type="button" className="auth-switch" onClick={()=>{setRegister(!register);setMessage('')}}>{register?'Já tenho conta':'Criar uma conta autorizada'}</button></form></main>
}

function PageFrame({kicker,title,action,children}:{kicker:string;title:string;action?:React.ReactNode;children:React.ReactNode}){return <section className="page"><div className="page-head"><div><span>{kicker}</span><h1>{title}</h1></div>{action}</div>{children}</section>}
function InfoCard({label,value,text}:{label:string;value:string;text:string}){return <article className="info-card"><span>{label}</span><strong>{value}</strong><small>{text}</small></article>}
export default App
