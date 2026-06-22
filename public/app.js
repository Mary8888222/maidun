const state = { user: null, route: 'map', dashboard: null, cache: {} };
const app = document.querySelector('#app');
const navItems = [
  ['map','电子地图'],['bigdata','大数据'],['disease','病害档案'],['video','监控视频'],
  ['identify','识别监测'],['analysis','结果分析'],['control','防控管理'],['info','信息管理'],['robot','机器人中心']
];

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type':'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '请求失败');
  return data;
}

function loginView() {
  app.innerHTML = `<main class="login-page">
    <section class="login-art">
      <div class="brand"><div class="brand-mark">麦</div><span>麦盾智能监测平台</span></div>
      <div class="hero-copy">
        <div class="eyebrow">ROBOT · DNA-PCR · AI</div>
        <h1>让每一粒孢子<br>都被精准识别</h1>
        <p>基于自主巡检机器人、孢子智能捕获与 DNA‑PCR 分子检测技术，构建小麦病害“采集—识别—预警—防控—复核”全链路。</p>
        <div class="tech-pills"><span>机器人自主巡检</span><span>DNA-PCR 分子检测</span><span>病害智能识别</span><span>变量精准防控</span></div>
      </div>
      <small style="color:#557782">小麦病害智能监测与决策支持系统</small>
    </section>
    <section class="login-side"><form class="login-card" id="loginForm">
      <h2>平台登录</h2><p>欢迎进入小麦孢子病害智能监测平台</p>
      <label class="field">账号<input name="username" value="tqx" autocomplete="username" required></label>
      <label class="field">密码<input name="password" type="password" value="12345678" autocomplete="current-password" required></label>
      <button class="login-btn">登录系统</button><div class="error" id="loginError"></div>
      <div class="login-tip">技术支持：小麦病害智能监测课题组</div>
    </form></section>
  </main>`;
  document.querySelector('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = '正在登录…';
    const form = new FormData(e.target);
    try {
      const result = await api('/api/login', { method:'POST', body:JSON.stringify(Object.fromEntries(form)) });
      state.user = result.user; await loadApp();
    } catch (err) { document.querySelector('#loginError').textContent = err.message; btn.disabled = false; btn.textContent = '登录系统'; }
  });
}

function shell(content) {
  return `<div class="shell"><header class="topbar">
    <div class="brand"><div class="brand-mark">麦</div><span>麦盾 · 小麦孢子病害智能监测平台<small>机器人与 DNA-PCR 关键技术研究</small></span></div>
    <nav class="nav">${navItems.map(([id,label])=>`<button data-route="${id}" class="${state.route===id?'active':''}">${label}</button>`).join('')}</nav>
    <div class="userbox"><div class="avatar">研</div><span>${state.user?.display_name||'课题组'}</span><button class="logout" id="logout">退出</button></div>
  </header><main class="page">${content}</main></div>`;
}

function pageTitle(title, sub) {
  return `<div class="page-title"><div><h2>${title}</h2><p>${sub}</p></div><div class="live"><i class="pulse"></i>系统实时同步中 · 2026-06-22 12:30</div></div>`;
}

function stat(label, value, unit, trend='实时') { return `<div class="stat"><span class="label">${label}</span><strong>${value}</strong><span class="unit">${trend} · ${unit}</span></div>`; }
function levelTag(value) { const c = value==='高'||value==='红色'||value==='强阳性'?'red':value==='中'||value==='橙色'||value==='阳性'?'orange':value==='低'||value==='在线'||value==='已完成'||value==='阴性'?'green':'blue'; return `<span class="tag ${c}">${value}</span>`; }

function mapMarkup(plots) {
  return `<div class="real-map-wrap"><div id="realMap" class="real-map" aria-label="四川省营山县西桥镇监测地图"></div>
    <div class="map-legend"><b class="cyan"></b>低风险 <b class="orange"></b>中风险 <b class="red"></b>高风险</div></div>`;
}

function initLeafletMap(plots) {
  const target = document.querySelector('#realMap');
  if (!target || !window.L) return;
  const map = L.map(target).setView([30.9310043,106.6902606], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap contributors' }).addTo(map);
  const colors = { 高:'#ff6374', 中:'#ffae52', 低:'#20e0b2' };
  plots.forEach(p => {
    const marker = L.circleMarker([p.latitude,p.longitude], { radius:9, color:'#07161f', weight:2, fillColor:colors[p.risk_level]||'#5da9ff', fillOpacity:.96 }).addTo(map);
    marker.bindTooltip(p.name, { permanent:true, direction:'top', offset:[0,-8], className:'plot-label' });
    marker.bindPopup(`<div class="plot-popup"><b>${p.name}</b><span>${p.region}</span><span>品种：${p.variety}　${p.area_mu}亩</span><span>风险：${p.risk_level}　状态：${p.status}</span><span>负责人：${p.manager}</span></div>`);
  });
}

function trendChart(rows) {
  const max = Math.max(...rows.map(r=>r.total),1);
  return `<div class="chart">${rows.map(r=>`<div class="bar-col" title="${r.day}：检测${r.total}份，阳性${r.positive}份"><i style="height:${r.total/max*100}%"></i><i class="alt" style="height:${r.positive/max*100}%"></i><span>${r.day}</span></div>`).join('')}</div>`;
}

function mapPage(d) {
  const a=d.stats;
  return pageTitle('电子地图','试验田风险、机器人与孢子监测点位一张图')+
    `<section class="stats">${stat('试验田块',a.plots,'个')}${stat('监测面积',a.area,'亩')}${stat('在线设备',a.devices,'台')}${stat('PCR样本',a.samples,'份')}${stat('阳性检出率',a.positiveRate+'%','近30天')}${stat('活动预警',a.activeAlerts,'条')}</section>
    <section class="grid-main"><div class="panel map-panel"><div class="panel-head"><h3>四川省营山县西桥镇综合监测态势</h3><span class="tag green">机器人在线 3/3</span></div>${mapMarkup(d.plots)}</div>
    <div class="side-stack"><div class="panel"><div class="panel-head"><h3>实时预警</h3><span class="tag">${a.activeAlerts} 条待跟进</span></div><div class="panel-body alert-list">${d.alerts.map(x=>`<div class="alert-row"><i class="alert-dot ${x.level==='红色'?'red':x.level==='橙色'?'orange':'cyan'}"></i><div><h4>${x.title}</h4><p>${x.plot_name} · ${x.created_at}</p></div>${levelTag(x.level)}</div>`).join('')}</div></div>
    <div class="panel"><div class="panel-head"><h3>近14日 DNA-PCR 检测趋势</h3><span style="font-size:10px;color:#72939d"><i style="color:#20e0b2">■</i> 样本　<i style="color:#ffae52">■</i> 阳性</span></div><div class="panel-body" style="padding-top:0">${trendChart(d.trends)}</div></div></div></section>`;
}

function bigdataPage(d) {
  const total=d.disease.reduce((s,x)=>s+x.value,0);
  return pageTitle('大数据驾驶舱','汇聚机器人、分子检测、环境与防控全链路数据')+
  `<section class="stats">${stat('累计巡检里程','1,286','km','本季')}${stat('机器人任务','327','次','完成率 94.8%')}${stat('有效样本',d.stats.samples,'份','PCR质控通过')}${stat('识别准确率','96.7%','模型','视觉+分子融合')}${stat('平均响应','18','分钟','较上周 -12%')}${stat('防控有效率','91.4%','复核','闭环任务')}</section>
  <div class="analysis-grid"><div class="panel"><div class="panel-head"><h3>DNA-PCR 样本与阳性趋势</h3><span class="tag green">数据已质控</span></div><div class="panel-body">${trendChart(d.trends)}</div></div>
  <div class="panel"><div class="panel-head"><h3>病害检出构成</h3></div><div class="panel-body donut-wrap"><div class="donut"></div><div class="legend">${d.disease.map((x,i)=>`<div><span><i style="background:${['#20e0b2','#ffae52','#5da9ff','#b875ff'][i]}"></i>${x.name}</span><b>${Math.round(x.value/total*100)}%</b></div>`).join('')}</div></div></div></div>`;
}

const tableConfigs = {
  disease:{title:'病害档案',sub:'小麦孢子传播病害知识与田间检测记录',dataset:'detections',columns:[['detection_code','识别编号'],['plot_name','试验田'],['disease','病害类型'],['method','识别方法'],['severity','严重度(%)'],['confidence','置信度(%)'],['review_status','复核状态'],['detected_at','检测时间']]},
  identify:{title:'识别监测',sub:'机器人采样与 DNA-PCR 分子检测结果协同判读',dataset:'samples',columns:[['sample_code','样本编号'],['plot_name','采集地块'],['target_pathogen','目标病原'],['ct_value','Ct值'],['result','判定结果'],['confidence','置信度(%)'],['technician','检测员'],['collected_at','采样时间']]},
  control:{title:'防控管理',sub:'从风险预警到精准防控及效果复核的闭环管理',dataset:'controls',columns:[['action_code','任务编号'],['plot_name','作业地块'],['action_type','措施类型'],['owner','负责人'],['status','执行状态'],['scheduled_at','计划时间'],['effectiveness','有效率(%)'],['plan','防控方案']]},
  info:{title:'信息管理',sub:'地块、设备、环境与课题基础数据统一管理',dataset:'plots',columns:[['code','地块编码'],['name','试验田'],['region','区域'],['area_mu','面积(亩)'],['variety','品种'],['risk_level','风险等级'],['status','当前状态'],['manager','负责人']]}
};

function formatCell(key,value){ if(['risk_level','result','status','review_status','level'].includes(key))return levelTag(value); if(value===null||value===undefined)return '—'; if(key==='ct_value')return Number(value).toFixed(2); if(['confidence','severity','effectiveness'].includes(key)&&typeof value==='number')return Number(value).toFixed(1); if(key==='plan')return `<span title="${value}">${String(value).slice(0,24)}…</span>`; return value; }
function tablePage(cfg, rows) {
  return pageTitle(cfg.title,cfg.sub)+`<div class="toolbar"><input class="search" id="tableSearch" placeholder="搜索编号、地块、病害或负责人"><select class="select" id="statusFilter"><option value="">全部状态</option><option>在线</option><option>已完成</option><option>执行中</option><option>高</option><option>中</option><option>低</option></select><div class="spacer"></div><button class="ghost" id="exportBtn">导出当前数据</button></div>
  <div class="panel table-wrap"><table class="data-table"><thead><tr>${cfg.columns.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody id="tableBody">${tableRows(cfg,rows)}</tbody></table></div>`;
}
function tableRows(cfg, rows){ return rows.map(r=>`<tr>${cfg.columns.map(c=>`<td>${formatCell(c[0],r[c[0]])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cfg.columns.length}" class="empty">暂无匹配数据</td></tr>`; }

function devicePage(rows,tasks) {
  return pageTitle('机器人中心','自主巡检、孢子采集、路径规划与任务调度')+
  `<div class="toolbar"><button class="primary" id="newTask">＋ 创建巡检任务</button><button class="ghost">路线规划</button><button class="ghost">设备标定</button><div class="spacer"></div><span class="tag green">在线设备 ${rows.filter(x=>x.status!=='离线').length}/${rows.length}</span></div>
  <div class="cards">${rows.map(d=>`<article class="panel device-card"><div class="device-top"><div class="device-icon">${d.type.includes('机器人')?'🤖':d.type.includes('PCR')?'🧬':d.type.includes('孢子')?'◉':'⌁'}</div>${levelTag(d.status)}</div><h3>${d.name}</h3><p>${d.device_code} · ${d.type}</p><div class="meter"><i style="width:${d.battery}%"></i></div><div style="font-size:10px;color:#7697a0">电量 ${d.battery}%</div><div class="meta-grid"><div>所属地块<strong>${d.plot_name}</strong></div><div>固件版本<strong>${d.firmware}</strong></div><div>最后心跳<strong>${d.last_seen.slice(11)}</strong></div><div>连接状态<strong>${d.status}</strong></div></div></article>`).join('')}</div>
  <div class="panel table-wrap" style="margin-top:14px"><div class="panel-head"><h3>近期巡检任务</h3></div><table class="data-table"><thead><tr><th>任务编号</th><th>机器人</th><th>地块</th><th>路线</th><th>里程</th><th>样本</th><th>进度</th><th>状态</th></tr></thead><tbody>${tasks.map(t=>`<tr><td>${t.task_code}</td><td>${t.robot_name}</td><td>${t.plot_name}</td><td>${t.route_name}</td><td>${t.distance_km} km</td><td>${t.samples_count}</td><td><div class="meter" style="width:120px;margin:0"><i style="width:${t.progress}%"></i></div></td><td>${levelTag(t.status)}</td></tr>`).join('')}</tbody></table></div>`;
}

function videoPage(rows){return pageTitle('监控视频','机器人移动视角与试验田固定点位实时监控')+`<div class="video-grid">${rows.slice(0,4).map((v,i)=>`<div class="panel video-card"><video class="video-media" src="/media/wheat-${String(i+1).padStart(2,'0')}.mp4?v=2" autoplay muted loop playsinline controls preload="metadata"></video><div class="scan"></div><div class="crosshair"></div><div class="video-hud"><div class="top"><span>● LIVE　${v.channel_code}</span>${levelTag(v.status)}</div><div class="bottom"><span>${v.name} · ${v.plot_name}</span><span>${v.resolution}　${v.last_frame_at.slice(11)}</span></div></div></div>`).join('')}</div>`}

function analysisPage(data,d) {
  const points=data.env.slice(-18); const max=Math.max(...points.map(x=>x.spore_index),1);
  const path=points.map((x,i)=>`${i?'L':'M'} ${20+i*(860/(points.length-1))} ${250-x.spore_index/max*190}`).join(' ');
  return pageTitle('结果分析','融合环境、机器人视觉与 DNA-PCR 的多源结果研判')+`<div class="kpis">${stat('融合识别准确率','96.7%','本月')}${stat('PCR平均Ct值','25.8','阳性样本')}${stat('风险提前量','36h','平均')}${stat('模型复核一致率','94.3%','专家复核')}</div><div class="analysis-grid" style="margin-top:14px"><div class="panel"><div class="panel-head"><h3>环境孢子指数变化</h3><span class="tag orange">湿度相关性 0.82</span></div><div class="line-chart"><svg viewBox="0 0 900 280" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#20e0b2" stop-opacity=".45"/><stop offset="1" stop-color="#20e0b2" stop-opacity="0"/></linearGradient></defs><path d="${path} L 880 260 L20 260 Z" fill="url(#area)"/><path d="${path}" fill="none" stroke="#20e0b2" stroke-width="3"/><line x1="20" y1="110" x2="880" y2="110" stroke="#ffae52" stroke-dasharray="7 7" opacity=".7"/></svg></div></div><div class="panel"><div class="panel-head"><h3>识别方法对比</h3></div><div class="panel-body method-list">${data.method.map(m=>`<div class="method-row"><div><span>${m.name}</span><b>${m.confidence}%</b></div><div class="meter"><i style="width:${m.confidence}%"></i></div></div>`).join('')}<div class="method-row"><div><span>视觉模型（单一）</span><b>88.4%</b></div><div class="meter"><i style="width:88.4%;background:#ffae52"></i></div></div></div></div></div>`;
}

function bindCommon(){
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>navigate(b.dataset.route));
  document.querySelector('#logout').onclick=async()=>{await api('/api/logout',{method:'POST'});state.user=null;loginView();};
  document.querySelectorAll('[data-plot]').forEach(b=>b.onclick=()=>{const p=state.dashboard.plots.find(x=>x.id==b.dataset.plot);modal(p.name,`区域：${p.region}<br>品种：${p.variety}　面积：${p.area_mu}亩<br>风险等级：${p.risk_level}<br>状态：${p.status}<br>负责人：${p.manager}`)});
}

function bindTable(cfg,rows){
  const search=document.querySelector('#tableSearch'), filter=document.querySelector('#statusFilter');
  const draw=()=>{const q=search.value.trim().toLowerCase(),f=filter.value;const filtered=rows.filter(r=>(!q||Object.values(r).join(' ').toLowerCase().includes(q))&&(!f||Object.values(r).includes(f)));document.querySelector('#tableBody').innerHTML=tableRows(cfg,filtered)};
  search.oninput=draw;filter.onchange=draw;
  document.querySelector('#exportBtn').onclick=()=>exportCsv(cfg,rows);
}

function exportCsv(cfg,rows){const csv=[cfg.columns.map(x=>x[1]),...rows.map(r=>cfg.columns.map(c=>r[c[0]]??''))].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download=`${cfg.title}-${Date.now()}.csv`;a.click();URL.revokeObjectURL(a.href)}
function modal(title,html){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><h3>${title}</h3><p>${html}</p><div class="modal-actions"><button class="primary" id="modalOk">确定</button></div></div></div>`);document.querySelector('#modalOk').onclick=()=>document.querySelector('#modal').remove();document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')e.target.remove()}}

async function navigate(route){
  state.route=route; location.hash=route;
  let content=''; let cfg=tableConfigs[route];
  if(route==='map')content=mapPage(state.dashboard);
  else if(route==='bigdata')content=bigdataPage(state.dashboard);
  else if(cfg){const rows=state.cache[cfg.dataset]??=await api(`/api/table/${cfg.dataset}`);content=tablePage(cfg,rows)}
  else if(route==='robot'){const devices=state.cache.devices??=await api('/api/table/devices');const tasks=state.cache.tasks??=await api('/api/table/tasks');content=devicePage(devices,tasks)}
  else if(route==='video'){const rows=state.cache.videos??=await api('/api/table/videos');content=videoPage(rows)}
  else if(route==='analysis'){const data=state.cache.analysis??=await api('/api/analysis');content=analysisPage(data,state.dashboard)}
  app.innerHTML=shell(content);bindCommon();if(route==='map')requestAnimationFrame(()=>initLeafletMap(state.dashboard.plots));if(cfg)bindTable(cfg,state.cache[cfg.dataset]);if(route==='robot')document.querySelector('#newTask').onclick=()=>modal('创建巡检任务','选择机器人、试验田与巡检路线后，系统将自动计算路径并同步采样计划。');
}

async function loadApp(){state.dashboard=await api('/api/dashboard');const hash=location.hash.replace('#','');state.route=navItems.some(x=>x[0]===hash)?hash:'map';await navigate(state.route)}

(async()=>{const session=await api('/api/session');if(session.authenticated){state.user=session.user;await loadApp()}else loginView()})().catch(()=>loginView());
