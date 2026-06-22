(() => {
  const plots = [
    {id:1,code:'MD-001',name:'成都崇州核心试验田',region:'四川省成都市崇州市',area_mu:1260,variety:'川麦104',longitude:103.673,latitude:30.631,risk_level:'高',status:'重点监测',manager:'唐琦翔'},
    {id:2,code:'MD-002',name:'德阳广汉智能农场',region:'四川省德阳市广汉市',area_mu:980,variety:'川麦93',longitude:104.282,latitude:30.977,risk_level:'中',status:'监测中',manager:'陈婉'},
    {id:3,code:'MD-003',name:'绵阳江油PCR联合示范田',region:'四川省绵阳市江油市',area_mu:860,variety:'绵麦902',longitude:104.745,latitude:31.778,risk_level:'低',status:'生长正常',manager:'何佳萍'},
    {id:4,code:'MD-004',name:'南充营山机器人巡检基地',region:'四川省南充市营山县',area_mu:1420,variety:'川育27',longitude:106.690,latitude:30.931,risk_level:'中',status:'任务执行中',manager:'蒙璐'},
    {id:5,code:'MD-005',name:'重庆潼南绿色防控示范田',region:'重庆市潼南区',area_mu:760,variety:'川麦55',longitude:105.840,latitude:30.190,risk_level:'低',status:'防控完成',manager:'彭慧琼'},
    {id:6,code:'MD-006',name:'重庆梁平孢子捕获观测站',region:'重庆市梁平区',area_mu:1150,variety:'蜀麦1868',longitude:107.800,latitude:30.670,risk_level:'高',status:'预警处置中',manager:'唐婉婷'}
  ];
  const trends = ['06-09','06-10','06-11','06-12','06-13','06-14','06-15','06-16','06-17','06-18','06-19','06-20','06-21','06-22']
    .map((day,i) => ({day,total:[2,3,2,4,3,4,2,3,4,3,4,2,3,3][i],positive:[1,2,1,3,2,3,1,2,3,2,3,1,2,2][i]}));
  const diseaseNames = ['小麦条锈病','小麦赤霉病','小麦白粉病','小麦叶锈病'];
  const alerts = [
    {id:1,level:'红色',title:'条锈病孢子浓度快速上升',plot_name:plots[0].name,created_at:'2026-06-22 10:18'},
    {id:2,level:'红色',title:'赤霉病高风险气象窗口',plot_name:plots[5].name,created_at:'2026-06-22 09:42'},
    {id:3,level:'橙色',title:'白粉病扩散趋势',plot_name:plots[3].name,created_at:'2026-06-21 16:07'},
    {id:4,level:'黄色',title:'叶锈病疑似样本',plot_name:plots[1].name,created_at:'2026-06-20 14:20'},
    {id:5,level:'蓝色',title:'防控效果复核提醒',plot_name:plots[4].name,created_at:'2026-06-19 08:10'}
  ];
  const devices = [
    {id:1,device_code:'RB-01',name:'麦盾一号机器人',type:'巡检机器人',plot_name:plots[0].name,status:'在线',battery:84,last_seen:'2026-06-22 12:26',firmware:'R3.6.2'},
    {id:2,device_code:'RB-02',name:'麦盾二号机器人',type:'巡检机器人',plot_name:plots[3].name,status:'作业中',battery:67,last_seen:'2026-06-22 12:28',firmware:'R3.6.2'},
    {id:3,device_code:'RB-03',name:'麦盾三号机器人',type:'采样机器人',plot_name:plots[5].name,status:'充电中',battery:42,last_seen:'2026-06-22 12:21',firmware:'R3.5.8'},
    {id:4,device_code:'SP-01',name:'孢子捕获仪 01',type:'孢子捕获仪',plot_name:plots[0].name,status:'在线',battery:96,last_seen:'2026-06-22 12:29',firmware:'S2.1.0'},
    {id:5,device_code:'SP-02',name:'孢子捕获仪 02',type:'孢子捕获仪',plot_name:plots[1].name,status:'在线',battery:91,last_seen:'2026-06-22 12:29',firmware:'S2.1.0'},
    {id:6,device_code:'PCR-01',name:'便携式 PCR 工作站',type:'DNA-PCR设备',plot_name:plots[2].name,status:'在线',battery:88,last_seen:'2026-06-22 12:24',firmware:'P4.0.1'},
    {id:7,device_code:'MET-01',name:'微气象站 01',type:'环境传感器',plot_name:plots[5].name,status:'在线',battery:100,last_seen:'2026-06-22 12:30',firmware:'M1.9.4'}
  ];
  const tasks = [
    {task_code:'TASK-260622-01',robot_name:'麦盾一号机器人',plot_name:plots[0].name,route_name:'北区S形孢子采集路线',distance_km:8.6,samples_count:24,progress:100,status:'已完成'},
    {task_code:'TASK-260622-02',robot_name:'麦盾二号机器人',plot_name:plots[3].name,route_name:'西区全覆盖巡检路线',distance_km:12.4,samples_count:31,progress:68,status:'执行中'},
    {task_code:'TASK-260621-03',robot_name:'麦盾三号机器人',plot_name:plots[5].name,route_name:'高风险点定向复采',distance_km:5.2,samples_count:18,progress:100,status:'已完成'},
    {task_code:'TASK-260621-04',robot_name:'麦盾一号机器人',plot_name:plots[1].name,route_name:'叶面病斑影像巡检',distance_km:7.8,samples_count:20,progress:100,status:'已完成'}
  ];
  const technicians = ['唐琦翔','陈婉','何佳萍','蒙璐','彭慧琼','唐婉婷'];
  const samples = Array.from({length:18},(_,i) => {
    const plot = plots[i % plots.length];
    const positive = i % 5 !== 4;
    const ct = positive ? 20.4 + (i % 9) * .83 : null;
    return {sample_code:`PCR-2606-${String(i+1).padStart(3,'0')}`,plot_name:plot.name,target_pathogen:diseaseNames[i % 4],ct_value:ct,result:positive?(ct<25?'强阳性':'阳性'):'阴性',confidence:91+(i%8),technician:technicians[i%6],collected_at:`2026-06-${String(22-(i%12)).padStart(2,'0')} ${String(8+i%9).padStart(2,'0')}:20`};
  });
  const detections = samples.slice(0,16).map((sample,i) => ({detection_code:`DET-2606-${String(i+1).padStart(3,'0')}`,plot_name:sample.plot_name,disease:sample.target_pathogen,method:i%3===0?'机器人视觉+DNA-PCR':'DNA-PCR',severity:8+(i*7)%61,confidence:90.2+(i%9),review_status:i%6===0?'待复核':'已确认',detected_at:sample.collected_at}));
  const controls = plots.map((plot,i) => ({action_code:`CTL-260622-${String(i+1).padStart(2,'0')}`,plot_name:plot.name,action_type:['精准施药','应急防控','变量喷施','复检确认','绿色防控','重点复采'][i],owner:technicians[i],status:i<2?'执行中':i<4?'已完成':'待执行',scheduled_at:`2026-06-${String(22-(i%3)).padStart(2,'0')} ${String(10+i).padStart(2,'0')}:00`,effectiveness:i<2?null:88.5+i,plan:'依据孢子指数、气象条件与 PCR 结果执行分区防控，并在 24 小时内复核。'}));
  const videos = [
    {channel_code:'CAM-01',name:'崇州机器人移动视角',plot_name:plots[0].name,status:'在线',resolution:'1080P',last_frame_at:'2026-06-22 12:30'},
    {channel_code:'CAM-02',name:'广汉麦田全景监控',plot_name:plots[1].name,status:'在线',resolution:'4K',last_frame_at:'2026-06-22 12:30'},
    {channel_code:'CAM-03',name:'营山固定监控',plot_name:plots[3].name,status:'在线',resolution:'1080P',last_frame_at:'2026-06-22 12:29'},
    {channel_code:'CAM-04',name:'梁平孢子站监控',plot_name:plots[5].name,status:'维护',resolution:'1080P',last_frame_at:'2026-06-22 09:16'}
  ];
  const environment = Array.from({length:30},(_,i)=>({day:`06-${String(i+1).padStart(2,'0')}`,temperature:20+(i%8),humidity:58+(i*3)%31,spore_index:12+(i*17)%82}));
  const dashboard = {stats:{plots:plots.length,area:6430,devices:devices.length,samples:42,positiveRate:81,activeAlerts:3},trends,disease:diseaseNames.map((name,i)=>({name,value:[10,8,7,5][i]})),plots,alerts};
  const tables = {plots,devices,tasks,samples,detections,controls,videos,environment};

  window.maidunDemoApi = async (url, options={}) => {
    const method = options.method || 'GET';
    if (url === '/api/login' && method === 'POST') {
      const input = JSON.parse(options.body || '{}');
      if (input.username !== 'tqx' || input.password !== '12345678') throw new Error('账号或密码错误');
      sessionStorage.setItem('maidun-demo-session','1');
      return {user:{username:'tqx',display_name:'课题组管理员',role:'admin'}};
    }
    if (url === '/api/logout') { sessionStorage.removeItem('maidun-demo-session'); return {ok:true}; }
    if (url === '/api/session') return {authenticated:sessionStorage.getItem('maidun-demo-session')==='1',user:{username:'tqx',display_name:'课题组管理员',role:'admin'}};
    if (url === '/api/dashboard') return dashboard;
    if (url.startsWith('/api/table/')) return tables[url.split('/').pop()] || [];
    if (url === '/api/analysis') return {env:environment,method:[{name:'机器人视觉+DNA-PCR',value:10,confidence:97.2},{name:'DNA-PCR',value:20,confidence:95.8}],risk:[{name:'高',value:2},{name:'中',value:2},{name:'低',value:2}]};
    throw new Error('数据接口不存在');
  };
})();
