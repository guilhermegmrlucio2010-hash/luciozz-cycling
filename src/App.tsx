import { useState } from 'react'
import { Activity, BarChart3, Bell, Bike, CalendarDays, ChevronRight, Gauge, HeartPulse, Menu, Settings, UserRound, X } from 'lucide-react'
import './App.css'

const nav = [['Visão geral', Gauge], ['Calendário', CalendarDays], ['Atividades', Activity], ['Análise', BarChart3], ['Monitorização', HeartPulse], ['Treinos', Bike], ['Perfil', UserRound], ['Definições', Settings]] as const

function App() {
  const [active, setActive] = useState('Visão geral')
  const [menu, setMenu] = useState(false)
  return <div className="app">
    {menu && <button className="scrim" aria-label="Fechar menu" onClick={() => setMenu(false)} />}
    <aside className={menu ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><span>LC</span><div><b>LUCIOZZ</b><small>CYCLING</small></div><button onClick={() => setMenu(false)}><X /></button></div>
      <p className="nav-label">TREINO</p>
      <nav>{nav.map(([label, Icon]) => <button key={label} className={active === label ? 'active' : ''} onClick={() => { setActive(label); setMenu(false) }}><Icon />{label}</button>)}</nav>
      <div className="sync"><i/><div><b>Modo local</b><small>Supabase por configurar</small></div></div>
    </aside>
    <main>
      <header><button className="hamb" onClick={() => setMenu(true)}><Menu /></button><div><span>14 NOV 2026</span><b>{active}</b></div><button className="bell"><Bell/><i/></button></header>
      <div className="content">
        <section className="hero"><div><span className="eyebrow">CENTRO DE DESEMPENHO</span><h1>Pedala com<br/><em>propósito.</em></h1><p>Planeamento, recuperação e análise de ciclismo numa única aplicação privada.</p><button className="primary" onClick={() => setActive('Calendário')}>Abrir calendário <ChevronRight/></button></div><div className="rings"><div><span>—</span><small>CARGA ATUAL</small></div></div></section>
        <section className="metrics"><article><span>ESTA SEMANA</span><strong>—</strong><small>Sem atividades importadas</small></article><article><span>PRÓXIMO TREINO</span><strong>—</strong><small>Ainda não planeado</small></article><article><span>ESTADO</span><strong className="ready">BASE</strong><small>Projeto novo preparado</small></article></section>
        <section className="lower"><article className="panel"><div className="panel-title"><div><span>PLANO</span><h2>Próximos treinos</h2></div><button>Ver calendário</button></div><div className="empty"><CalendarDays/><h3>O calendário está livre</h3><p>Os treinos reais aparecerão aqui depois da configuração segura dos perfis.</p></div></article><article className="panel progress"><span>FUNDAÇÃO</span><h2>Construção por fases</h2><ul><li className="done">Interface React + TypeScript</li><li className="done">Design responsivo</li><li>Autenticação privada</li><li>Calendário e treinos</li><li>Importação FIT</li></ul></article></section>
      </div>
    </main>
  </div>
}

export default App
