const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DB_DIR = path.join(ROOT, 'database');
const DB_FILE = path.join(DB_DIR, 'maidun.db');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 5173);
const sessions = new Map();

if (process.argv.includes('--reset-db') && fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
fs.mkdirSync(DB_DIR, { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec(fs.readFileSync(path.join(DB_DIR, 'schema.sql'), 'utf8'));

function hashPassword(value) {
  return crypto.createHash('sha256').update(`maidun-v1:${value}`).digest('hex');
}

function seed() {
  const exists = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (exists) return;
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)')
      .run('tqx', hashPassword('12345678'), '课题组管理员', 'admin');

    const plots = [
      ['MD-001','西桥镇核心试验田','四川省营山县西桥镇',1260,'川麦104',106.6903,30.9310,'高','重点监测','唐琦翔'],
      ['MD-002','西桥镇智能农场','四川省营山县西桥镇',980,'川麦93',106.6980,30.9340,'中','监测中','陈婉'],
      ['MD-003','西桥镇PCR联合示范田','四川省营山县西桥镇',860,'绵麦902',106.6835,30.9265,'低','生长正常','何佳萍'],
      ['MD-004','西桥镇机器人巡检基地','四川省营山县西桥镇',1420,'川育27',106.6760,30.9380,'中','任务执行中','蒙璐'],
      ['MD-005','西桥镇绿色防控示范田','四川省营山县西桥镇',760,'川麦55',106.7045,30.9220,'低','防控完成','彭慧琼'],
      ['MD-006','西桥镇孢子捕获观测站','四川省营山县西桥镇',1150,'蜀麦1868',106.7110,30.9400,'高','预警处置中','唐婉婷']
    ];
    const insPlot = db.prepare('INSERT INTO plots (code,name,region,area_mu,variety,longitude,latitude,risk_level,status,manager) VALUES (?,?,?,?,?,?,?,?,?,?)');
    plots.forEach(v => insPlot.run(...v));

    const devices = [
      ['RB-01','麦巡一号机器人','巡检机器人',1,'在线',84,'2026-06-22 12:26','R3.6.2'],
      ['RB-02','麦巡二号机器人','巡检机器人',4,'作业中',67,'2026-06-22 12:28','R3.6.2'],
      ['RB-03','麦巡三号机器人','采样机器人',6,'充电中',42,'2026-06-22 12:21','R3.5.8'],
      ['SP-01','孢子捕获仪01','孢子捕获仪',1,'在线',96,'2026-06-22 12:29','S2.1.0'],
      ['SP-02','孢子捕获仪02','孢子捕获仪',2,'在线',91,'2026-06-22 12:29','S2.1.0'],
      ['PCR-01','便携式PCR工作站','DNA-PCR设备',3,'在线',88,'2026-06-22 12:24','P4.0.1'],
      ['MET-01','微气象站01','环境传感器',6,'在线',100,'2026-06-22 12:30','M1.9.4']
    ];
    const insDevice = db.prepare('INSERT INTO devices (device_code,name,type,plot_id,status,battery,last_seen,firmware) VALUES (?,?,?,?,?,?,?,?)');
    devices.forEach(v => insDevice.run(...v));

    const tasks = [
      ['TASK-260622-01',1,1,'北区S形孢子采集路线',8.6,24,100,'已完成','2026-06-22 06:10','2026-06-22 08:02'],
      ['TASK-260622-02',2,4,'西区全覆盖巡检路线',12.4,31,68,'执行中','2026-06-22 09:30',null],
      ['TASK-260621-03',3,6,'高风险点定向复采',5.2,18,100,'已完成','2026-06-21 16:20','2026-06-21 17:35'],
      ['TASK-260621-04',1,2,'叶面病斑影像巡检',7.8,20,100,'已完成','2026-06-21 08:15','2026-06-21 10:04'],
      ['TASK-260623-05',3,5,'绿色防控效果复核',6.1,16,0,'待执行','2026-06-23 07:00',null]
    ];
    const insTask = db.prepare('INSERT INTO robot_tasks (task_code,robot_id,plot_id,route_name,distance_km,samples_count,progress,status,started_at,finished_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    tasks.forEach(v => insTask.run(...v));

    const diseases = ['小麦条锈病','小麦赤霉病','小麦白粉病','小麦叶锈病'];
    const samples = [];
    for (let i = 1; i <= 42; i++) {
      const plot = (i % 6) + 1;
      const disease = diseases[i % diseases.length];
      const positive = i % 5 !== 0;
      const ct = positive ? 20.4 + (i % 11) * 0.83 : null;
      const result = positive ? (ct < 25 ? '强阳性' : '阳性') : '阴性';
      samples.push([
        `PCR-2606-${String(i).padStart(3,'0')}`, plot, (i % 4) + 1,
        `2026-06-${String(22 - (i % 14)).padStart(2,'0')} ${String(7 + i % 10).padStart(2,'0')}:20`,
        disease, ct, result, positive ? 91 + (i % 8) : 97.6, ['唐琦翔','陈婉','何佳萍','蒙璐','彭慧琼','唐婉婷','肖闵月','赵单'][i % 8], `B2606-${Math.ceil(i/8)}`
      ]);
    }
    const insSample = db.prepare('INSERT INTO pcr_samples (sample_code,plot_id,task_id,collected_at,target_pathogen,ct_value,result,confidence,technician,batch_no) VALUES (?,?,?,?,?,?,?,?,?,?)');
    samples.forEach(v => insSample.run(...v));

    const detections = samples.slice(0, 30).map((s, idx) => [
      `DET-2606-${String(idx+1).padStart(3,'0')}`, s[1], idx + 1, s[3], s[4],
      idx % 3 === 0 ? '机器人视觉+DNA-PCR' : 'DNA-PCR',
      8 + (idx * 7) % 61, 90.2 + (idx % 9), `IMG-${String(idx+1).padStart(4,'0')}.jpg`, idx % 6 === 0 ? '待复核' : '已确认'
    ]);
    const insDet = db.prepare('INSERT INTO detections (detection_code,plot_id,sample_id,detected_at,disease,method,severity,confidence,image_ref,review_status) VALUES (?,?,?,?,?,?,?,?,?,?)');
    detections.forEach(v => insDet.run(...v));

    const alerts = [
      ['ALT-260622-01',1,1,'红色','条锈病孢子浓度快速上升','北斗一号试验田连续3小时孢子指数超过阈值，PCR强阳性。','待处置','2026-06-22 10:18',null],
      ['ALT-260622-02',6,6,'红色','赤霉病高风险气象窗口','高湿与弱风条件持续，结合PCR结果判定高风险。','处置中','2026-06-22 09:42',null],
      ['ALT-260621-03',4,10,'橙色','白粉病扩散趋势','机器人视觉识别病斑面积较昨日增加12.6%。','处置中','2026-06-21 16:07',null],
      ['ALT-260620-04',2,14,'黄色','叶锈病疑似样本','样本Ct值处于临界区间，建议24小时内复检。','已关闭','2026-06-20 14:20','2026-06-21 09:30'],
      ['ALT-260619-05',5,18,'蓝色','防控效果复核提醒','施药后第3天，建议安排机器人复巡。','已关闭','2026-06-19 08:10','2026-06-19 10:12']
    ];
    const insAlert = db.prepare('INSERT INTO alerts (alert_code,plot_id,detection_id,level,title,content,status,created_at,handled_at) VALUES (?,?,?,?,?,?,?,?,?)');
    alerts.forEach(v => insAlert.run(...v));

    const actions = [
      ['CTL-260622-01',1,1,'精准施药','使用植保机器人分区喷施三唑类药剂，避开中午高温时段。','唐琦翔','待执行','2026-06-22 17:30',null,null],
      ['CTL-260622-02',6,2,'应急防控','优先处理高密度点位并设置50米缓冲带，次日复采PCR。','唐婉婷','执行中','2026-06-22 13:00',null,null],
      ['CTL-260621-03',4,3,'变量喷施','按病斑严重度热力图生成变量处方图。','蒙璐','执行中','2026-06-21 18:20',null,null],
      ['CTL-260620-04',2,4,'复检确认','机器人采集叶面样本并送PCR工作站复检。','陈婉','已完成','2026-06-20 16:00','2026-06-21 09:20',88.5],
      ['CTL-260619-05',5,5,'绿色防控','采用生物制剂与通风降湿组合措施。','彭慧琼','已完成','2026-06-19 10:30','2026-06-19 16:45',92.1]
    ];
    const insAction = db.prepare('INSERT INTO control_actions (action_code,plot_id,alert_id,action_type,plan,owner,status,scheduled_at,completed_at,effectiveness) VALUES (?,?,?,?,?,?,?,?,?,?)');
    actions.forEach(v => insAction.run(...v));

    const insEnv = db.prepare('INSERT INTO environment_records (plot_id,recorded_at,temperature,humidity,wind_speed,rainfall,spore_index) VALUES (?,?,?,?,?,?,?)');
    for (let day = 1; day <= 30; day++) {
      for (let plot = 1; plot <= 6; plot++) {
        insEnv.run(plot, `2026-06-${String(day).padStart(2,'0')} 10:00`, 19 + ((day + plot) % 10), 58 + ((day * 3 + plot * 5) % 34), 0.8 + ((day + plot) % 7) * .35, day % 8 === 0 ? 8.6 : day % 5 === 0 ? 2.4 : 0, 12 + ((day * plot * 7) % 82));
      }
    }

    const insVideo = db.prepare('INSERT INTO video_channels (channel_code,plot_id,name,status,resolution,last_frame_at) VALUES (?,?,?,?,?,?)');
    [
      ['CAM-01',1,'西桥镇机器人视角','在线','1080P','2026-06-22 12:30'],
      ['CAM-02',4,'西桥镇孢子站全景','在线','4K','2026-06-22 12:30'],
      ['CAM-03',6,'营山县固定监控','在线','1080P','2026-06-22 12:29'],
      ['CAM-04',3,'PCR实验台','维护','1080P','2026-06-22 09:16']
    ].forEach(v => insVideo.run(...v));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
seed();

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => {
    const idx = v.indexOf('='); return [v.slice(0, idx).trim(), decodeURIComponent(v.slice(idx + 1))];
  }));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

function isAuthed(req) {
  const token = parseCookies(req).maidun_session;
  return token && sessions.has(token);
}

function rows(sql, params = []) { return db.prepare(sql).all(...params); }

function dashboard() {
  const stats = {
    plots: db.prepare('SELECT COUNT(*) AS n FROM plots').get().n,
    area: db.prepare('SELECT ROUND(SUM(area_mu),0) AS n FROM plots').get().n,
    devices: db.prepare("SELECT COUNT(*) AS n FROM devices WHERE status <> '离线'").get().n,
    samples: db.prepare('SELECT COUNT(*) AS n FROM pcr_samples').get().n,
    positiveRate: db.prepare("SELECT ROUND(100.0*SUM(CASE WHEN result <> '阴性' THEN 1 ELSE 0 END)/COUNT(*),1) AS n FROM pcr_samples").get().n,
    activeAlerts: db.prepare("SELECT COUNT(*) AS n FROM alerts WHERE status <> '已关闭'").get().n
  };
  const trends = rows("SELECT substr(collected_at,6,5) day, COUNT(*) total, SUM(CASE WHEN result <> '阴性' THEN 1 ELSE 0 END) positive FROM pcr_samples GROUP BY day ORDER BY day");
  const disease = rows('SELECT disease name, COUNT(*) value FROM detections GROUP BY disease ORDER BY value DESC');
  const plots = rows('SELECT * FROM plots ORDER BY id');
  const alerts = rows('SELECT a.*,p.name plot_name FROM alerts a JOIN plots p ON p.id=a.plot_id ORDER BY a.created_at DESC LIMIT 5');
  return { stats, trends, disease, plots, alerts };
}

function tableData(name) {
  const allowed = {
    plots: 'SELECT * FROM plots ORDER BY id',
    devices: 'SELECT d.*,p.name plot_name FROM devices d LEFT JOIN plots p ON p.id=d.plot_id ORDER BY d.id',
    tasks: 'SELECT t.*,d.name robot_name,p.name plot_name FROM robot_tasks t JOIN devices d ON d.id=t.robot_id JOIN plots p ON p.id=t.plot_id ORDER BY t.started_at DESC',
    samples: 'SELECT s.*,p.name plot_name FROM pcr_samples s JOIN plots p ON p.id=s.plot_id ORDER BY s.collected_at DESC',
    detections: 'SELECT d.*,p.name plot_name FROM detections d JOIN plots p ON p.id=d.plot_id ORDER BY d.detected_at DESC',
    alerts: 'SELECT a.*,p.name plot_name FROM alerts a JOIN plots p ON p.id=a.plot_id ORDER BY a.created_at DESC',
    controls: 'SELECT c.*,p.name plot_name FROM control_actions c JOIN plots p ON p.id=c.plot_id ORDER BY c.scheduled_at DESC',
    videos: 'SELECT v.*,p.name plot_name FROM video_channels v JOIN plots p ON p.id=v.plot_id ORDER BY v.id',
    environment: 'SELECT e.*,p.name plot_name FROM environment_records e JOIN plots p ON p.id=e.plot_id ORDER BY e.recorded_at DESC LIMIT 120'
  };
  return allowed[name] ? rows(allowed[name]) : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const payload = await body(req);
    const user = db.prepare('SELECT id,username,display_name,role FROM users WHERE username=? AND password_hash=?').get(payload.username, hashPassword(payload.password || ''));
    if (!user) return json(res, 401, { message: '账号或密码错误' });
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user);
    res.setHeader('Set-Cookie', `maidun_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`);
    return json(res, 200, { user });
  }
  if (url.pathname === '/api/logout' && req.method === 'POST') {
    const token = parseCookies(req).maidun_session;
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'maidun_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return json(res, 200, { ok: true });
  }
  if (url.pathname === '/api/session') {
    const token = parseCookies(req).maidun_session;
    return json(res, 200, { authenticated: Boolean(token && sessions.has(token)), user: sessions.get(token) || null });
  }
  if (url.pathname.startsWith('/api/')) {
    if (!isAuthed(req)) return json(res, 401, { message: '请先登录' });
    if (url.pathname === '/api/dashboard') return json(res, 200, dashboard());
    if (url.pathname.startsWith('/api/table/')) {
      const result = tableData(url.pathname.split('/').pop());
      return result ? json(res, 200, result) : json(res, 404, { message: '数据集不存在' });
    }
    if (url.pathname === '/api/analysis') {
      const env = rows("SELECT substr(recorded_at,6,5) day, ROUND(AVG(temperature),1) temperature, ROUND(AVG(humidity),1) humidity, ROUND(AVG(spore_index),1) spore_index FROM environment_records GROUP BY day ORDER BY day");
      const method = rows('SELECT method name, COUNT(*) value, ROUND(AVG(confidence),1) confidence FROM detections GROUP BY method');
      const risk = rows('SELECT risk_level name, COUNT(*) value FROM plots GROUP BY risk_level');
      return json(res, 200, { env, method, risk });
    }
    return json(res, 404, { message: '接口不存在' });
  }

  let filePath = url.pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(PUBLIC_DIR, 'index.html');
  const ext = path.extname(filePath);
  const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.mp4':'video/mp4' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => console.log(`麦盾平台已启动：http://localhost:${PORT}`));
