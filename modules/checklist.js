/**
 * 施工前期准备清单模块
 * 预设工种清单、勾选交互、进度条、自定义添加
 */
const ChecklistModule = (() => {
  const STORE_KEY = 'checklist';

  // 预设各工种准备事项
  const DEFAULT_CHECKLIST = [
    {
      id: 'cat-1',
      name: '🔌 水电改造',
      tasks: [
        { id: 't1-1', text: '确认全屋插座点位图（含开关、网口、USB）', done: false },
        { id: 't1-2', text: '确认灯位布局图及双控/多控开关位置', done: false },
        { id: 't1-3', text: '确认热水器类型及安装位置（燃气/电热/即热）', done: false },
        { id: 't1-4', text: '确认厨房水电位（洗碗机、净水器、垃圾处理器等）', done: false },
        { id: 't1-5', text: '确认卫生间水电位（智能马桶、电热毛巾架等）', done: false },
        { id: 't1-6', text: '确认强弱电箱位置及回路规划', done: false },
        { id: 't1-7', text: '购买电线、水管、线管等基础材料', done: false },
        { id: 't1-8', text: '预约水电师傅，沟通施工方案', done: false },
      ]
    },
    {
      id: 'cat-2',
      name: '🧱 泥瓦工',
      tasks: [
        { id: 't2-1', text: '确定全屋瓷砖/地板方案及铺贴方式', done: false },
        { id: 't2-2', text: '购买瓷砖、水泥、沙子、防水材料', done: false },
        { id: 't2-3', text: '卫生间/阳台/厨房防水方案确认', done: false },
        { id: 't2-4', text: '确认门槛石、窗台石、挡水条等石材', done: false },
        { id: 't2-5', text: '确认地漏位置及数量', done: false },
        { id: 't2-6', text: '预约泥瓦工师傅，确认工期', done: false },
      ]
    },
    {
      id: 'cat-3',
      name: '🪵 木工',
      tasks: [
        { id: 't3-1', text: '确定全屋定制柜方案（衣柜/橱柜/鞋柜/书柜）', done: false },
        { id: 't3-2', text: '确认吊顶方案（客厅/卧室/厨卫）', done: false },
        { id: 't3-3', text: '确认门及门套款式、尺寸', done: false },
        { id: 't3-4', text: '确认踢脚线材质及颜色', done: false },
        { id: 't3-5', text: '购买板材、五金件等材料', done: false },
        { id: 't3-6', text: '预约木工师傅，确认施工方案', done: false },
      ]
    },
    {
      id: 'cat-4',
      name: '🎨 油漆工',
      tasks: [
        { id: 't4-1', text: '确定全屋墙面颜色方案', done: false },
        { id: 't4-2', text: '选择涂料类型（乳胶漆/艺术漆/硅藻泥/墙纸）', done: false },
        { id: 't4-3', text: '购买腻子、底漆、面漆等材料', done: false },
        { id: 't4-4', text: '确认阴阳角处理方案', done: false },
        { id: 't4-5', text: '预约油漆工师傅，确认工期', done: false },
      ]
    },
    {
      id: 'cat-5',
      name: '🪟 地板与门窗安装',
      tasks: [
        { id: 't5-1', text: '确认地板类型（实木/复合/强化/SPC）', done: false },
        { id: 't5-2', text: '购买地板及辅料（防潮垫、压条等）', done: false },
        { id: 't5-3', text: '确认窗户是否需要更换', done: false },
        { id: 't5-4', text: '确认防盗门是否需要更换', done: false },
        { id: 't5-5', text: '地板到货后提前48小时适应环境', done: false },
        { id: 't5-6', text: '预约安装师傅，确认地面平整度', done: false },
      ]
    },
    {
      id: 'cat-6',
      name: '🍳 厨卫安装',
      tasks: [
        { id: 't6-1', text: '确认橱柜方案及台面材质', done: false },
        { id: 't6-2', text: '购买/确认烟机灶具型号尺寸', done: false },
        { id: 't6-3', text: '确认水槽及龙头款式', done: false },
        { id: 't6-4', text: '确认卫生间洁具（马桶/花洒/浴室柜/镜柜）', done: false },
        { id: 't6-5', text: '确认热水器/小厨宝安装方案', done: false },
        { id: 't6-6', text: '预约安装师傅，协调各厂家安装时间', done: false },
      ]
    },
    {
      id: 'cat-7',
      name: '🌬️ 空调/新风/暖气',
      tasks: [
        { id: 't7-1', text: '确定空调方案（中央空调/风管机/挂机）', done: false },
        { id: 't7-2', text: '确认是否需要新风系统', done: false },
        { id: 't7-3', text: '确认是否需要地暖/暖气片', done: false },
        { id: 't7-4', text: '确认空调孔位及外机位置', done: false },
        { id: 't7-5', text: '购买设备并预约安装', done: false },
      ]
    },
    {
      id: 'cat-8',
      name: '🏡 智能家居/其他',
      tasks: [
        { id: 't8-1', text: '确认是否需要全屋智能系统', done: false },
        { id: 't8-2', text: '确定智能灯光方案及控制方式', done: false },
        { id: 't8-3', text: '确认电动窗帘预留电源', done: false },
        { id: 't8-4', text: '确认安防监控/门铃/猫眼方案', done: false },
        { id: 't8-5', text: '确认全屋网络方案（AP面板/Mesh组网）', done: false },
        { id: 't8-6', text: '确认晾衣架类型（手动/电动）及安装位置', done: false },
      ]
    },
  ];

  function getData() {
    let data = App.getStore(STORE_KEY);
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = JSON.parse(JSON.stringify(DEFAULT_CHECKLIST));
      App.setStore(STORE_KEY, data);
    }
    return data;
  }

  function saveData(data) {
    App.setStore(STORE_KEY, data);
  }

  // ========== Render ==========
  function render() {
    const data = getData();
    renderProgress(data);
    renderCards(data);
  }

  function renderProgress(data) {
    let totalTasks = 0;
    let doneTasks = 0;
    data.forEach(cat => {
      cat.tasks.forEach(t => {
        totalTasks++;
        if (t.done) doneTasks++;
      });
    });

    const pct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;
    const el = document.getElementById('progress-overview');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:1rem;">📊 整体完成进度</h3>
        <span style="font-weight:700;font-size:1.2rem;color:var(--primary);">${pct}%</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-stats">
        <span>✅ 已完成 <strong>${doneTasks}</strong> 项</span>
        <span>📋 共 <strong>${totalTasks}</strong> 项</span>
        <span>⏳ 待完成 <strong>${totalTasks - doneTasks}</strong> 项</span>
      </div>
    `;
  }

  function renderCards(data) {
    const container = document.getElementById('checklist-container');

    container.innerHTML = data.map(cat => {
      const doneCount = cat.tasks.filter(t => t.done).length;
      const total = cat.tasks.length;
      const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;

      return `
        <div class="checklist-card" data-cat-id="${cat.id}">
          <div class="checklist-card-header">
            <h3>${cat.name}</h3>
            <span class="checklist-card-progress">${doneCount}/${total} (${pct}%)</span>
          </div>
          <ul class="checklist-items">
            ${cat.tasks.map(t => {
              const isOverdue = t.deadline && !t.done && t.deadline < new Date().toISOString().slice(0,10);
              return `
              <li class="checklist-item ${t.done ? 'done' : ''}" data-task-id="${t.id}" data-cat-id="${cat.id}">
                <input type="checkbox" ${t.done ? 'checked' : ''}>
                <span class="task-text">${t.text}</span>
                ${t.deadline ? `<span class="task-deadline ${isOverdue?'overdue':''}">📅 ${t.deadline}</span>` : ''}
                <button class="btn btn-xs btn-del" data-action="delete-task" data-task-id="${t.id}" data-cat-id="${cat.id}">×</button>
              </li>
            `;}).join('')}
          </ul>
          <div class="checklist-card-footer">
            <div class="add-task-inline">
              <input type="text" class="task-input" placeholder="添加新的准备事项..." data-cat-id="${cat.id}">
              <input type="date" class="task-deadline-input" data-cat-id="${cat.id}" style="width:120px;padding:7px 8px;border:2px solid var(--border);border-radius:6px;font-size:0.8rem;">
              <button class="btn btn-sm btn-primary add-task-btn" data-cat-id="${cat.id}">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========== Actions ==========
  function toggleTask(catId, taskId) {
    const data = getData();
    const cat = data.find(c => c.id === catId);
    if (!cat) return;
    const task = cat.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.done = !task.done;
    saveData(data);
    render();
  }

  async function deleteTask(catId, taskId) {
    const ok = await App.showConfirm('确定要删除这个准备事项吗？');
    if (!ok) return;

    const data = getData();
    const cat = data.find(c => c.id === catId);
    if (!cat) return;
    cat.tasks = cat.tasks.filter(t => t.id !== taskId);
    saveData(data);
    App.showToast('事项已删除', 'success');
    render();
  }

  function addTask(catId, text, deadline) {
    if (!text.trim()) return;
    const data = getData();
    const cat = data.find(c => c.id === catId);
    if (!cat) return;
    cat.tasks.push({
      id: 't' + Date.now().toString(36),
      text: text.trim(),
      deadline: deadline || null,
      done: false
    });
    saveData(data);
    App.showToast('事项已添加', 'success');
    render();
  }

  function addCategory(name) {
    if (!name.trim()) return;
    const data = getData();
    data.push({
      id: 'cat-' + Date.now().toString(36),
      name: name.trim(),
      tasks: []
    });
    saveData(data);
    App.showToast('新工种已添加', 'success');
    render();
  }

  function showAddCategory() {
    const bodyHTML = `
      <div class="form-group">
        <label>工种/分类名称</label>
        <input type="text" id="form-cat-name" placeholder="如：软装搭配">
      </div>
    `;
    const footerHTML = `
      <button class="btn btn-outline" id="btn-cat-cancel">取消</button>
      <button class="btn btn-primary" id="btn-cat-save">添加</button>
    `;

    App.showModal('添加工种分类', bodyHTML, footerHTML);
    document.getElementById('btn-cat-cancel').addEventListener('click', App.hideModal);
    document.getElementById('btn-cat-save').addEventListener('click', () => {
      const name = document.getElementById('form-cat-name').value.trim();
      if (!name) return App.showToast('请输入名称', 'error');
      addCategory(name);
      App.hideModal();
    });
  }

  // ========== Init ==========
  function init() {
    document.getElementById('btn-add-task').addEventListener('click', showAddCategory);

    // 事件委托：勾选、删除、添加
    document.getElementById('checklist-container').addEventListener('click', (e) => {
      // 勾选
      const item = e.target.closest('.checklist-item');
      if (item && !e.target.closest('button')) {
        const catId = item.dataset.catId;
        const taskId = item.dataset.taskId;
        toggleTask(catId, taskId);
        return;
      }

      // 删除任务
      const delBtn = e.target.closest('[data-action="delete-task"]');
      if (delBtn) {
        e.stopPropagation();
        deleteTask(delBtn.dataset.catId, delBtn.dataset.taskId);
        return;
      }

      // 添加任务
      const addBtn = e.target.closest('.add-task-btn');
      if (addBtn) {
        const catId = addBtn.dataset.catId;
        const input = document.querySelector(`.task-input[data-cat-id="${catId}"]`);
        const deadlineInput = document.querySelector(`.task-deadline-input[data-cat-id="${catId}"]`);
        if (input) {
          addTask(catId, input.value, deadlineInput ? deadlineInput.value : null);
          input.value = '';
          if (deadlineInput) deadlineInput.value = '';
        }
        return;
      }
    });

    // 回车添加
    document.getElementById('checklist-container').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('task-input')) {
        const catId = e.target.dataset.catId;
        const deadlineInput = document.querySelector(`.task-deadline-input[data-cat-id="${catId}"]`);
        addTask(catId, e.target.value, deadlineInput ? deadlineInput.value : null);
        e.target.value = '';
        if (deadlineInput) deadlineInput.value = '';
      }
    });

    render();
  }

  return { init, render };
})();
