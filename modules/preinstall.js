/**
 * 设备水电预留确认模块
 * 提前确认各设备上下水、电源、尺寸要求
 */
const PreinstallModule = (() => {
  const STORE_KEY = 'preinstall';
  const ROOMS = ['厨房','主卫','次卫','阳台','客厅','餐厅','主卧','次卧','书房','其他'];
  const OUTLET_TYPES = ['10A五孔','16A三孔','USB插座','网口','专用插座','不需要'];
  const STATUSES = ['待确认','已确认'];

  // 预设需要水电预留的设备清单
  const DEFAULTS = [
    // 厨房
    { name:'冰箱', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:83, width:65, height:190, position:'靠墙预留，左右留5cm散热', stage:'木工', status:'待确认' },
    { name:'洗碗机', room:'厨房', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:60, width:60, height:85, position:'橱柜内，邻近水槽', stage:'水电', status:'待确认' },
    { name:'烟机', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:90, width:52, height:null, position:'烟道口附近，吊顶内预留插座', stage:'木工', status:'待确认' },
    { name:'灶具', room:'厨房', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:78, width:45, height:null, position:'台面开孔，下方留燃气管', stage:'木工', status:'待确认' },
    { name:'蒸烤箱', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'16A三孔', length:60, width:55, height:45, position:'高柜嵌入，16A独立回路', stage:'水电', status:'待确认' },
    { name:'净水器', room:'厨房', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:40, width:15, height:40, position:'水槽下方，预留3孔插座', stage:'水电', status:'待确认' },
    { name:'垃圾处理器', room:'厨房', waterIn:false, waterOut:true, power:true, outlet:'10A五孔', length:null, width:null, height:35, position:'水槽下方，台面预留空气开关孔', stage:'水电', status:'待确认' },
    { name:'燃气热水器', room:'厨房', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:38, width:18, height:60, position:'靠窗/外墙，排烟孔提前开好', stage:'水电', status:'待确认' },
    { name:'小厨宝', room:'厨房', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:25, width:25, height:30, position:'水槽下方', stage:'水电', status:'待确认' },
    { name:'微波炉', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:49, width:39, height:30, position:'台面或吊柜嵌入', stage:'木工', status:'待确认' },

    // 主卫
    { name:'智能马桶（主卫）', room:'主卫', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:70, width:40, height:48, position:'马桶侧后方，距地30cm，防溅盒', stage:'水电', status:'待确认' },
    { name:'浴室柜/台盆（主卫）', room:'主卫', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:80, width:50, height:85, position:'冷热双管，墙排/地排确认', stage:'水电', status:'待确认' },
    { name:'恒温花洒（主卫）', room:'主卫', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:null, width:null, height:null, position:'冷热双管，混水阀距地90-110cm', stage:'水电', status:'待确认' },
    { name:'浴霸（主卫）', room:'主卫', waterIn:false, waterOut:false, power:true, outlet:'专用插座', length:30, width:30, height:null, position:'集成吊顶内，需预留多路线', stage:'水电', status:'待确认' },
    { name:'电热毛巾架（主卫）', room:'主卫', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:50, width:10, height:70, position:'马桶上方或侧面，防溅盒', stage:'木工', status:'待确认' },
    { name:'镜柜（主卫）', room:'主卫', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:70, width:15, height:70, position:'镜柜背后预留电源线，供除雾+LED', stage:'木工', status:'待确认' },

    // 次卫
    { name:'智能马桶（次卫）', room:'次卫', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:70, width:40, height:48, position:'马桶侧后方，防溅盒', stage:'水电', status:'待确认' },
    { name:'浴室柜/台盆（次卫）', room:'次卫', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:60, width:50, height:85, position:'冷热双管', stage:'水电', status:'待确认' },
    { name:'花洒（次卫）', room:'次卫', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:null, width:null, height:null, position:'冷热双管', stage:'水电', status:'待确认' },
    { name:'洗衣机', room:'次卫', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:60, width:60, height:85, position:'进水龙头+专用地漏，插座侧方', stage:'水电', status:'待确认' },
    { name:'烘干机', room:'次卫', waterIn:false, waterOut:true, power:true, outlet:'10A五孔', length:60, width:60, height:85, position:'与洗衣机叠放或并排，独立插座', stage:'水电', status:'待确认' },
    { name:'浴霸（次卫）', room:'次卫', waterIn:false, waterOut:false, power:true, outlet:'专用插座', length:30, width:30, height:null, position:'集成吊顶内', stage:'水电', status:'待确认' },

    // 阳台
    { name:'电动晾衣架', room:'阳台', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:120, width:40, height:null, position:'阳台天花板预留电源线', stage:'水电', status:'待确认' },
    { name:'拖把池/洗衣池', room:'阳台', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:50, width:45, height:85, position:'冷热水+地漏', stage:'水电', status:'待确认' },
    { name:'壁挂洗衣机', room:'阳台', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:60, width:35, height:60, position:'承重墙安装，预埋进排水管', stage:'水电', status:'待确认' },

    // 客厅
    { name:'电视', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:null, width:null, height:null, position:'电视墙预埋50管穿线，插座居中', stage:'水电', status:'待确认' },
    { name:'空调（客厅）', room:'客厅', waterIn:false, waterOut:true, power:true, outlet:'16A三孔', length:null, width:null, height:null, position:'空调孔+插座（16A独立回路）', stage:'水电', status:'待确认' },
    { name:'扫地机器人', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:35, width:35, height:10, position:'沙发/柜底留空，充电桩插座', stage:'水电', status:'待确认' },
    { name:'电动窗帘', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:null, width:null, height:null, position:'窗帘盒内预留电源线', stage:'水电', status:'待确认' },
    { name:'路由器/AP', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:null, width:null, height:null, position:'弱电箱或电视柜，预留网口+电源', stage:'水电', status:'待确认' },

    // 主卧
    { name:'空调（主卧）', room:'主卧', waterIn:false, waterOut:true, power:true, outlet:'16A三孔', length:null, width:null, height:null, position:'空调孔+16A插座', stage:'水电', status:'待确认' },
    { name:'电动窗帘（主卧）', room:'主卧', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:null, width:null, height:null, position:'窗帘盒内预留电源线', stage:'木工', status:'待确认' },

    // ===== 木工阶段必须确定尺寸的设备 =====
    // 橱柜嵌入电器
    { name:'嵌入式洗碗机', room:'厨房', waterIn:true, waterOut:true, power:true, outlet:'10A五孔', length:60, width:58, height:82, position:'橱柜预留600mm宽柜体，确认门板方案', stage:'水电', status:'待确认', note:'木工：柜体开孔尺寸严格按型号' },
    { name:'嵌入式蒸烤箱', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'16A三孔', length:60, width:57, height:45, position:'高柜嵌入，柜体预留600mm宽', stage:'水电', status:'待确认', note:'木工：确认散热间隙，背板开孔' },
    { name:'嵌入式微波炉', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:60, width:45, height:38, position:'吊柜嵌入或台面放置', stage:'木工', status:'待确认', note:'木工：吊柜底板承重需加固' },
    { name:'嵌入式冰箱', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:91, width:73, height:178, position:'橱柜预留位，确认开门方向', stage:'木工', status:'待确认', note:'木工：柜体深度≥73cm，顶部留散热' },
    { name:'台下盆水槽', room:'厨房', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:75, width:45, height:22, position:'台面开孔，台下安装', stage:'水电', status:'待确认', note:'木工/石材：开孔尺寸提前给厂家' },
    { name:'烟机（确认型号）', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:90, width:52, height:65, position:'确认吊柜高度和烟机罩尺寸', stage:'木工', status:'待确认', note:'木工：吊柜与烟机间隙3-5cm' },

    // 柜体嵌入
    { name:'电视（确认型号）', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:167, width:8, height:96, position:'电视背景墙，预埋50管穿线', stage:'木工', status:'待确认', note:'木工：背景墙造型与电视尺寸匹配' },
    { name:'壁挂空调内机', room:'主卧', waterIn:false, waterOut:true, power:true, outlet:'16A三孔', length:88, width:30, height:30, position:'确认吊顶高度不遮挡出风口', stage:'水电', status:'待确认', note:'木工：吊顶高度需避开空调' },
    { name:'壁挂空调内机（次卧）', room:'次卧', waterIn:false, waterOut:true, power:true, outlet:'16A三孔', length:80, width:28, height:28, position:'确认吊顶不遮挡', stage:'水电', status:'待确认', note:'木工：吊顶高度需避开空调' },
    { name:'风管机/中央空调出风口', room:'客厅', waterIn:false, waterOut:true, power:true, outlet:'专用插座', length:120, width:15, height:null, position:'吊顶内安装，出风口位置确认', stage:'水电', status:'待确认', note:'木工：吊顶需预留检修口和出风口' },
    { name:'新风系统主机', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:60, width:40, height:25, position:'吊顶内/设备间', stage:'木工', status:'待确认', note:'木工：吊顶需预留检修口' },
    { name:'新风出风口', room:'客厅', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:12, width:12, height:null, position:'吊顶内走管，风口位置确认', stage:'木工', status:'待确认', note:'木工：吊顶内预留风管通道' },

    // 定制柜体内嵌
    { name:'衣柜（确认方案）', room:'主卧', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:200, width:60, height:240, position:'确认是否到顶、开门方式', stage:'木工', status:'待确认', note:'木工：通顶柜需确认天花平整度' },
    { name:'衣柜（次卧）', room:'次卧', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:150, width:60, height:240, position:'确认开门空间', stage:'木工', status:'待确认', note:'木工：注意开关/插座位置不冲突' },
    { name:'鞋柜', room:'玄关', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:100, width:35, height:100, position:'底部留空15cm，中间镂空', stage:'木工', status:'待确认', note:'木工：确认层板高度可调节' },
    { name:'书柜/展示柜', room:'书房', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:120, width:35, height:200, position:'确认承重和层板跨度', stage:'木工', status:'待确认', note:'木工：层板跨度>80cm需加厚或支撑' },
    { name:'餐边柜', room:'餐厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:120, width:40, height:90, position:'台面高度90-100cm，预留插座', stage:'木工', status:'待确认', note:'木工：台面可嵌入咖啡机等小电器' },

    // 门与门套
    { name:'入户门', room:'玄关', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:96, width:null, height:205, position:'确认门洞尺寸和开启方向', stage:'木工', status:'待确认', note:'木工：门洞尺寸需标准，确认门套宽度' },
    { name:'卧室门（主卧）', room:'主卧', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:86, width:null, height:205, position:'确认门洞尺寸', stage:'木工', status:'待确认', note:'木工：确认静音门锁开孔尺寸' },
    { name:'卧室门（次卧）', room:'次卧', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:86, width:null, height:205, position:'确认门洞尺寸', stage:'木工', status:'待确认', note:'木工：确认门套与踢脚线收口' },
    { name:'厨房推拉门', room:'厨房', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:150, width:null, height:210, position:'确认吊轨/地轨，门洞宽度', stage:'木工', status:'待确认', note:'木工：吊轨需确认天花承重' },
    { name:'卫生间门', room:'主卫', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:76, width:null, height:205, position:'确认是否带玻璃，防潮处理', stage:'木工', status:'待确认', note:'木工：门套底部做防潮处理' },

    // 背景墙与造型
    { name:'电视背景墙', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:300, width:10, height:240, position:'确认造型方案和电视安装方式', stage:'木工', status:'待确认', note:'木工：确认基层板材和完成面厚度' },
    { name:'沙发背景墙', room:'客厅', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:350, width:5, height:240, position:'确认护墙板/硬包方案', stage:'木工', status:'待确认', note:'木工：确认基层和完成面' },
    { name:'床头背景墙（主卧）', room:'主卧', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:300, width:5, height:120, position:'确认床头灯位置和造型', stage:'木工', status:'待确认', note:'木工：床头插座/开关位置精确定位' },

    // 吊顶相关
    { name:'厨卫集成吊顶', room:'厨房', waterIn:false, waterOut:false, power:true, outlet:'专用插座', length:null, width:null, height:null, position:'确认吊顶高度和浴霸/凉霸开孔', stage:'水电', status:'待确认', note:'木工：吊顶高度需避让烟道/下水管' },
    { name:'窗帘盒', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:300, width:20, height:15, position:'确认单层/双层窗帘，电动/手动', stage:'木工', status:'待确认', note:'木工：电动窗帘需留20cm宽窗帘盒' },
    { name:'窗帘盒（主卧）', room:'主卧', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:280, width:20, height:15, position:'确认电动/手动', stage:'木工', status:'待确认', note:'木工：宽度≥20cm可装电动轨道' },

    // 踢脚线与收口
    { name:'全屋踢脚线', room:'其他', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:null, width:null, height:6, position:'确认材质/高度/颜色', stage:'木工', status:'待确认', note:'木工：确认与门套、柜体收口方案' },

    // 其他需确定尺寸
    { name:'暖气片（如有）', room:'客厅', waterIn:true, waterOut:true, power:false, outlet:'不需要', length:120, width:10, height:60, position:'确认安装位置不挡家具', stage:'水电', status:'待确认', note:'木工：暖气片位置需避开柜体' },
    { name:'投影幕布', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:250, width:null, height:null, position:'吊顶内隐藏安装，确认幕布尺寸', stage:'木工', status:'待确认', note:'木工：吊顶预留幕布槽' },
    { name:'投影仪', room:'客厅', waterIn:false, waterOut:false, power:true, outlet:'10A五孔', length:20, width:20, height:10, position:'吊装，确认投射距离和电源', stage:'木工', status:'待确认', note:'木工：吊顶预留安装加固板' },
    { name:'全屋定制柜（综合）', room:'其他', waterIn:false, waterOut:false, power:false, outlet:'不需要', length:null, width:null, height:null, position:'所有柜体方案在木工前进场复尺', stage:'木工', status:'待确认', note:'木工：定制柜与现场木作接口确认' },
  ];

  function getItems() {
    let data = App.getStore(STORE_KEY);
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = JSON.parse(JSON.stringify(DEFAULTS));
      App.setStore(STORE_KEY, data);
    }
    return data;
  }
  function saveItems(d) { App.setStore(STORE_KEY, d); }

  function render() {
    let items = getItems();
    const room = document.getElementById('preinstall-room-filter')?.value || 'all';
    const stage = document.getElementById('preinstall-stage-filter')?.value || 'all';
    const status = document.getElementById('preinstall-status-filter')?.value || 'all';
    if (room !== 'all') items = items.filter(i => i.room === room);
    if (stage === '水电') items = items.filter(i => i.stage === '水电');
    if (stage === '木工') items = items.filter(i => i.stage === '木工');
    if (status === 'confirmed') items = items.filter(i => i.status === '已确认');
    if (status === 'pending') items = items.filter(i => i.status !== '已确认');

    // 初始化房间下拉
    const roomSel = document.getElementById('preinstall-room-filter');
    if (roomSel && roomSel.options.length <= 1) {
      roomSel.innerHTML = '<option value="all">全部房间</option>' + ROOMS.map(r => `<option value="${r}">${r}</option>`).join('');
    }

    renderSummary(items);
    renderTable(items);
  }

  function renderSummary(items) {
    const total = items.length;
    const confirmed = items.filter(i => i.status === '已确认').length;
    const needWaterIn = items.filter(i => i.waterIn && i.status !== '已确认').length;
    const needPower = items.filter(i => i.power && i.status !== '已确认').length;
    const pct = total > 0 ? Math.round(confirmed / total * 100) : 0;

    document.getElementById('preinstall-summary').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-weight:700;">✅ 已确认 <strong style="font-size:1.2rem;color:var(--success);">${confirmed}</strong> / ${total}</span>
        <div class="progress-bar-wrap" style="flex:1;min-width:120px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <span style="color:${needWaterIn>0?'var(--warning)':'var(--text-secondary)'};">🚰 待确认上水: ${needWaterIn}</span>
        <span style="color:${needPower>0?'var(--warning)':'var(--text-secondary)'};">⚡ 待确认电源: ${needPower}</span>
      </div>
    `;
  }

  function renderTable(items) {
    const tbody = document.getElementById('preinstall-tbody');
    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="11">暂无设备，点击"添加设备"开始</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const dims = [item.length, item.width, item.height].filter(Boolean);
      const dimStr = dims.length > 0 ? dims.join('×') : '-';
      const isConfirmed = item.status === '已确认';
      const stageIcon = item.stage === '水电' ? '🔌' : item.stage === '木工' ? '🪵' : '';
      const stageName = item.stage || '';
      return `
        <tr style="${isConfirmed ? 'opacity:0.6;' : ''}">
          <td><strong>${item.name}</strong></td>
          <td>${item.room}</td>
          <td style="text-align:center;font-size:0.78rem;">${stageIcon} ${stageName}</td>
          <td style="text-align:center;">${item.waterIn ? '<span style="color:#1565c0;font-weight:700;">🔵 需要</span>' : '<span style="color:#ccc;">—</span>'}</td>
          <td style="text-align:center;">${item.waterOut ? '<span style="color:#1565c0;font-weight:700;">🔵 需要</span>' : '<span style="color:#ccc;">—</span>'}</td>
          <td style="text-align:center;">${item.power ? '<span style="color:#e65100;font-weight:700;">⚡ 需要</span>' : '<span style="color:#ccc;">—</span>'}</td>
          <td>${item.outlet || '-'}</td>
          <td style="font-size:0.82rem;">${dimStr}${dimStr !== '-' ? ' cm' : ''}</td>
          <td style="font-size:0.82rem;max-width:150px;">${item.position || '-'}</td>
          <td><span class="badge ${isConfirmed?'badge-installed':'badge-pending'}">${item.status}</span></td>
          <td>
            <div class="actions-cell">
              ${!isConfirmed ? `<button class="btn btn-xs btn-success" data-action="confirm-preinstall" data-id="${item.id}">确认</button>` : `<button class="btn btn-xs btn-edit" data-action="unconfirm-preinstall" data-id="${item.id}">撤销</button>`}
              <button class="btn btn-xs btn-edit" data-action="edit-preinstall" data-id="${item.id}">编辑</button>
              <button class="btn btn-xs btn-del" data-action="delete-preinstall" data-id="${item.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function showForm(item = null) {
    const isEdit = !!item;
    App.showModalLg(isEdit?'编辑设备':'添加设备', `
      <div class="form-row">
        <div class="form-group"><label>设备名称 *</label><input type="text" id="pi-name" value="${item?.name||''}" placeholder="如：洗碗机"></div>
        <div class="form-group"><label>房间</label><select id="pi-room">${ROOMS.map(r => `<option value="${r}" ${item?.room===r?'selected':''}>${r}</option>`).join('')}</select></div>
      </div>
      <div class="form-row-3" style="margin-bottom:14px;">
        <div class="form-group"><label>需要上水</label><select id="pi-waterIn"><option value="1" ${item?.waterIn!==false?'selected':''}>是</option><option value="0" ${item?.waterIn===false?'selected':''}>否</option></select></div>
        <div class="form-group"><label>需要下水</label><select id="pi-waterOut"><option value="1" ${item?.waterOut!==false?'selected':''}>是</option><option value="0" ${item?.waterOut===false?'selected':''}>否</option></select></div>
        <div class="form-group"><label>需要电源</label><select id="pi-power"><option value="1" ${item?.power!==false?'selected':''}>是</option><option value="0" ${item?.power===false?'selected':''}>否</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>插座类型</label><select id="pi-outlet">${OUTLET_TYPES.map(t => `<option value="${t}" ${item?.outlet===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="form-group"><label>安装位置</label><input type="text" id="pi-position" value="${item?.position||''}" placeholder="如：水槽下方，预留3孔插座"></div>
      </div>
      <div class="form-group"><label>设备尺寸 (长×宽×高 cm)</label>
        <div class="form-row-3">
          <input type="number" id="pi-length" step="0.1" value="${item?.length||''}" placeholder="长">
          <input type="number" id="pi-width" step="0.1" value="${item?.width||''}" placeholder="宽">
          <input type="number" id="pi-height" step="0.1" value="${item?.height||''}" placeholder="高">
        </div>
      </div>
      <div class="form-group"><label>状态</label><select id="pi-status">${STATUSES.map(s => `<option value="${s}" ${item?.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    `, `
      <button class="btn btn-outline" id="pi-cancel">取消</button>
      <button class="btn btn-primary" id="pi-save">${isEdit?'保存修改':'添加设备'}</button>
    `);
    document.getElementById('pi-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('pi-save').addEventListener('click', () => {
      const name = document.getElementById('pi-name').value.trim();
      if (!name) return App.showToast('请输入设备名称', 'error');
      const data = {
        id: item?.id || App.uid(),
        name, room: document.getElementById('pi-room').value,
        waterIn: document.getElementById('pi-waterIn').value === '1',
        waterOut: document.getElementById('pi-waterOut').value === '1',
        power: document.getElementById('pi-power').value === '1',
        outlet: document.getElementById('pi-outlet').value,
        length: parseFloat(document.getElementById('pi-length').value) || null,
        width: parseFloat(document.getElementById('pi-width').value) || null,
        height: parseFloat(document.getElementById('pi-height').value) || null,
        position: document.getElementById('pi-position').value.trim(),
        status: document.getElementById('pi-status').value,
      };
      const items = getItems();
      if (isEdit) { const idx = items.findIndex(i => i.id === item.id); if (idx >= 0) items[idx] = data; }
      else items.push(data);
      saveItems(items);
      App.hideModalLg();
      App.showToast(isEdit?'已更新':'已添加', 'success');
      render();
    });
  }

  function toggleConfirm(id) {
    const items = getItems();
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.status = item.status === '已确认' ? '待确认' : '已确认';
    saveItems(items);
    App.showToast(item.status === '已确认' ? '已确认 ✓' : '已撤销', 'success');
    render();
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除此设备吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success');
    render();
  }

  function init() {
    document.getElementById('btn-add-preinstall').addEventListener('click', () => showForm());
    document.getElementById('preinstall-room-filter').addEventListener('change', render);
    document.getElementById('preinstall-stage-filter').addEventListener('change', render);
    document.getElementById('preinstall-status-filter').addEventListener('change', render);
    document.getElementById('preinstall-tbody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-preinstall') { const item = getItems().find(i => i.id === id); if (item) showForm(item); }
      else if (action === 'confirm-preinstall' || action === 'unconfirm-preinstall') toggleConfirm(id);
      else if (action === 'delete-preinstall') deleteItem(id);
    });
    render();
  }
  return { init, render };
})();
