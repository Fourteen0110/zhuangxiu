/**
 * 首页概览仪表盘
 * 总进度、预算环形图、最近账单、待购提醒、存储用量
 */
const DashboardModule = (() => {
  function render() {
    try {
      const bills = App.getStore('bills') || [];
      const budget = App.getStore('budget') || 0;
      const furniture = App.getStore('furniture') || [];
      const checklist = App.getStore('checklist') || [];
      const totalSpent = bills.reduce((s, b) => s + Number(b.amount||0), 0);

    // 施工进度
    let totalTasks = 0, doneTasks = 0;
    checklist.forEach(cat => cat.tasks.forEach(t => { totalTasks++; if (t.done) doneTasks++; }));
    const prepPct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

    // 待购
    const toBuy = furniture.filter(f => f.status === '待购' || !f.status);

    // 最近5条账单
    const recentBills = [...bills].sort((a, b) => (b.date||'').localeCompare(a.date||'')).slice(0, 5);

    // 即将到期保修
    const contracts = App.getStore('contracts') || [];
    const today = new Date();
    const soonExpire = contracts.filter(c => {
      if (!c.warrantyEnd) return false;
      const d = new Date(c.warrantyEnd);
      const diff = (d - today) / (1000*60*60*24);
      return diff > 0 && diff <= 30;
    });

    const storageUsed = (App.getStorageUsed() / 1024).toFixed(1);

    document.getElementById('dashboard-content').innerHTML = `
      <div class="module-header"><h2>📊 装修总览</h2></div>
      <div class="dashboard-grid">
        <!-- 核心指标 -->
        <div class="dashboard-card full">
          <div class="dash-summary">
            <div class="dash-item"><div class="dash-num">${App.formatMoney(totalSpent)}</div><div class="dash-label">总支出${budget>0?' / 预算 '+App.formatMoney(budget):''}</div></div>
            <div class="dash-item"><div class="dash-num">${bills.length}</div><div class="dash-label">账单记录</div></div>
            <div class="dash-item"><div class="dash-num">${prepPct}%</div><div class="dash-label">施工准备完成度</div></div>
            <div class="dash-item"><div class="dash-num">${furniture.length}</div><div class="dash-label">家电家具</div></div>
            <div class="dash-item"><div class="dash-num">${toBuy.length}</div><div class="dash-label" style="color:${toBuy.length>0?'var(--warning)':'var(--text-secondary)'}">待购物品</div></div>
          </div>
        </div>

        <!-- 预算进度条 -->
        ${budget > 0 ? `
        <div class="dashboard-card">
          <h3>💸 预算使用情况</h3>
          <div style="margin-bottom:8px;display:flex;justify-content:space-between;">
            <span>${App.formatMoney(totalSpent)}</span><span>${App.formatMoney(budget)}</span>
          </div>
          <div class="progress-bar-wrap" style="height:20px;">
            <div class="progress-bar-fill" style="width:${Math.min(totalSpent/budget*100,100)}%;background:${totalSpent>budget?'linear-gradient(90deg,#e74c3c,#f39c12)':'linear-gradient(90deg,#4f6ef7,#6c8cff)'};"></div>
          </div>
          <div style="margin-top:6px;font-size:0.85rem;color:${totalSpent>budget?'var(--danger)':'var(--text-secondary)'}">
            ${totalSpent>budget?'⚠️ 已超支 '+App.formatMoney(totalSpent-budget):'剩余 '+App.formatMoney(budget-totalSpent)}
          </div>
        </div>
        ` : ''}

        <!-- 施工准备进度 -->
        <div class="dashboard-card">
          <h3>✅ 施工准备进度</h3>
          <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${prepPct}%"></div></div>
          <div style="margin-top:6px;font-size:0.85rem;color:var(--text-secondary)">${doneTasks}/${totalTasks} 项已完成</div>
          ${prepPct === 100 ? '<div style="margin-top:4px;color:var(--success);font-weight:600;">🎉 全部准备就绪！</div>' : ''}
        </div>

        <!-- 最近账单 -->
        <div class="dashboard-card">
          <h3>📋 最近账单</h3>
          ${recentBills.length === 0 ? '<p style="color:var(--text-secondary);font-size:0.85rem;">暂无账单</p>' : `
          <ul class="bill-mini-list">
            ${recentBills.map(b => `<li><span>${b.name||b.note||'-'}</span><span style="font-weight:600;">${App.formatMoney(b.amount)}</span></li>`).join('')}
          </ul>`}
        </div>

        <!-- 待购提醒 -->
        <div class="dashboard-card">
          <h3>🛒 待购物品提醒</h3>
          ${toBuy.length === 0 ? '<p style="color:var(--success);font-size:0.85rem;">✅ 全部已购</p>' : `
          <div style="max-height:200px;overflow-y:auto;">
            ${toBuy.slice(0, 10).map(f => `<div class="todo-mini-item"><span>${f.name} (${f.room})</span><span class="badge badge-pending">待购</span></div>`).join('')}
            ${toBuy.length > 10 ? `<div style="text-align:center;font-size:0.8rem;color:var(--text-secondary);padding:4px;">...还有 ${toBuy.length-10} 件</div>` : ''}
          </div>`}
        </div>

        <!-- 保修到期提醒 -->
        ${soonExpire.length > 0 ? `
        <div class="dashboard-card" style="border:2px solid var(--warning);">
          <h3>⚠️ 保修即将到期</h3>
          ${soonExpire.map(c => `<div class="todo-mini-item"><span>${c.name}</span><span style="color:var(--danger);font-weight:600;">${c.warrantyEnd}</span></div>`).join('')}
        </div>` : ''}

        <!-- 存储用量 -->
        <div class="dashboard-card full">
          <h3>💾 本地存储用量</h3>
          <div class="storage-bar"><div class="storage-bar-fill" style="width:${Math.min(storageUsed/50,100)}%;background:${storageUsed>40?'var(--danger)':storageUsed>25?'var(--warning)':'var(--success)'};"></div></div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">已用 ${storageUsed} KB（浏览器限制约 5-10 MB）</div>
        </div>
      </div>
    `;
    } catch (e) {
      document.getElementById('dashboard-content').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">页面加载中，请稍候...<br><small>如持续空白请刷新页面</small></div>';
      console.error('Dashboard render error:', e);
    }
  }

  function init() {}
  return { init, render };
})();
