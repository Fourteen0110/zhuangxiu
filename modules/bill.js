/**
 * 账单记录模块 v2 - 深度改造
 * 支付方式/付款状态/关联商家/图片/标签/多维统计/月度趋势图/CSV导出/搜索
 */
const BillModule = (() => {
  const STORE_BILLS = 'bills';
  const STORE_BUDGET = 'budget';
  const CATEGORIES = ['材料费', '人工费', '设计费', '家电家具', '软装配饰', '其他'];
  const PAY_METHODS = ['微信', '支付宝', '银行卡', '现金', '信用卡', '转账', '其他'];
  const PAY_STATUS = ['已付', '未付', '定金', '尾款'];
  const COLORS = ['#4f6ef7', '#f39c12', '#27ae60', '#e74c3c', '#8e44ad', '#3498db'];

  function getBills() { return App.getStore(STORE_BILLS) || []; }
  function saveBills(b) { App.setStore(STORE_BILLS, b); }
  function getBudget() { return App.getStore(STORE_BUDGET) || 0; }
  function saveBudget(a) { App.setStore(STORE_BUDGET, a); }

  // ========== Render ==========
  function render() {
    let bills = getBills();
    const cat = document.getElementById('bill-category-filter')?.value || 'all';
    const status = document.getElementById('bill-status-filter')?.value || 'all';
    const month = document.getElementById('bill-month-filter')?.value;
    const search = (document.getElementById('bill-search')?.value || '').toLowerCase().trim();

    if (cat !== 'all') bills = bills.filter(b => b.category === cat);
    if (status !== 'all') bills = bills.filter(b => b.payStatus === status);
    if (month) bills = bills.filter(b => b.date && b.date.startsWith(month));
    if (search) bills = bills.filter(b => (b.name||'').toLowerCase().includes(search) || (b.note||'').toLowerCase().includes(search));

    bills.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    renderStatCards(bills);
    renderTrendChart(bills);
    renderPieChart(bills);
    renderTable(bills);
    renderSummary(bills);
    renderBudget();
  }

  // ========== 统计卡片 ==========
  function renderStatCards(bills) {
    const total = bills.reduce((s, b) => s + Number(b.amount), 0);
    const allBills = getBills();
    const allTotal = allBills.reduce((s, b) => s + Number(b.amount), 0);
    const budget = getBudget();

    // 本月
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthBills = allBills.filter(b => b.date && b.date.startsWith(thisMonth));
    const monthTotal = monthBills.reduce((s, b) => s + Number(b.amount), 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const dayAvg = monthBills.length > 0 ? monthTotal / Math.min(now.getDate(), daysInMonth) : 0;

    // 最大单笔
    const maxBill = allBills.reduce((max, b) => Number(b.amount) > Number(max.amount||0) ? b : max, {amount:0});

    // 未付
    const unpaid = allBills.filter(b => b.payStatus === '未付' || b.payStatus === '尾款');
    const unpaidTotal = unpaid.reduce((s, b) => s + Number(b.amount), 0);

    const container = document.getElementById('bill-stat-cards');
    container.innerHTML = `
      <div class="stat-card ${budget>0 && allTotal>budget ? 'danger' : ''}">
        <span class="stat-label">总支出</span>
        <span class="stat-value">${App.formatMoney(allTotal)}</span>
        <span class="stat-sub">${budget>0 ? '预算 '+App.formatMoney(budget)+' / '+(allTotal>budget?'超支':'剩余')+' '+App.formatMoney(Math.abs(budget-allTotal)) : '未设定预算'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">本月支出</span>
        <span class="stat-value">${App.formatMoney(monthTotal)}</span>
        <span class="stat-sub">日均 ${App.formatMoney(dayAvg)}</span>
      </div>
      <div class="stat-card ${unpaidTotal>0?'warn':''}">
        <span class="stat-label">待付款</span>
        <span class="stat-value">${App.formatMoney(unpaidTotal)}</span>
        <span class="stat-sub">${unpaid.length} 笔未结清</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">最大单笔</span>
        <span class="stat-value">${App.formatMoney(maxBill.amount)}</span>
        <span class="stat-sub">${maxBill.name || maxBill.note || '-'}</span>
      </div>
    `;
  }

  // ========== 月度趋势柱状图 ==========
  function renderTrendChart(bills) {
    const canvas = document.getElementById('bill-trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 统计最近12个月
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }

    const data = months.map(m => {
      return bills.filter(b => b.date && b.date.startsWith(m)).reduce((s, b) => s + Number(b.amount), 0);
    });

    const maxVal = Math.max(...data, 1);
    const pad = { top: 20, right: 20, bottom: 40, left: 55 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barW = Math.min(chartW / months.length * 0.65, 40);
    const gap = chartW / months.length;

    // 网格线
    ctx.strokeStyle = '#e8eaed';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + chartH * i / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(App.formatMoney(maxVal * (4-i) / 4), pad.left - 8, y + 4);
    }

    // 柱状图
    data.forEach((val, i) => {
      const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
      const x = pad.left + gap * i + (gap - barW) / 2;
      const y = pad.top + chartH - barH;

      const gradient = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      gradient.addColorStop(0, '#4f6ef7');
      gradient.addColorStop(1, '#a0b4ff');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // 金额标注
      if (val > 0) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('¥' + (val/10000 >= 0.1 ? (val/10000).toFixed(1)+'万' : val.toFixed(0)), x + barW/2, y - 5);
      }

      // 月份标注
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(months[i].slice(2).replace('-','/'), x + barW/2, H - pad.bottom + 18);
    });
  }

  // ========== 饼图 ==========
  function renderPieChart(bills) {
    const canvas = document.getElementById('bill-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    const catMap = {};
    bills.forEach(b => { catMap[b.category] = (catMap[b.category] || 0) + Number(b.amount); });
    const entries = Object.entries(catMap);
    const total = entries.reduce((s, [,v]) => s + v, 0);

    if (total === 0) {
      ctx.fillStyle = '#ddd';
      ctx.beginPath(); ctx.arc(size/2, size/2, 80, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#999'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('暂无数据', size/2, size/2+5);
      document.getElementById('chart-legend').innerHTML = '';
      return;
    }

    let startAngle = -Math.PI / 2;
    entries.forEach(([cat, val]) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      const color = getColor(cat);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(size/2, size/2);
      ctx.arc(size/2, size/2, 90, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      const midAngle = startAngle + sliceAngle / 2;
      const pct = Math.round(val / total * 100);
      if (pct >= 5) {
        const lx = size/2 + Math.cos(midAngle) * 60;
        const ly = size/2 + Math.sin(midAngle) * 60;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(pct + '%', lx, ly + 4);
      }
      startAngle += sliceAngle;
    });

    document.getElementById('chart-legend').innerHTML = entries.map(([cat, val]) => `
      <div class="legend-item"><span class="legend-dot" style="background:${getColor(cat)}"></span><span>${cat} ${App.formatMoney(val)}</span></div>
    `).join('');
  }

  function getColor(cat) {
    const idx = CATEGORIES.indexOf(cat);
    return idx >= 0 ? COLORS[idx] : '#95a5a6';
  }

  // ========== 表格 ==========
  function renderTable(bills) {
    const tbody = document.getElementById('bill-tbody');
    if (bills.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="10">暂无账单记录，点击"添加账单"开始记录</td></tr>`;
      return;
    }

    tbody.innerHTML = bills.map(b => {
      const statusClass = { '已付': 'badge-paid', '未付': 'badge-unpaid', '定金': 'badge-deposit', '尾款': 'badge-balance' }[b.payStatus] || '';
      const tags = (b.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      return `
        <tr>
          <td>${App.formatDate(b.date)}</td>
          <td><span style="background:${getColor(b.category)}20;color:${getColor(b.category)};padding:2px 10px;border-radius:12px;font-size:0.78rem;font-weight:600;">${b.category}</span></td>
          <td><strong>${b.name || '-'}</strong></td>
          <td class="amount-cell">${App.formatMoney(b.amount)}</td>
          <td>${b.payMethod || '-'}</td>
          <td><span class="badge ${statusClass}">${b.payStatus || '-'}</span></td>
          <td>${b.vendor || '-'}</td>
          <td>${tags || '-'}</td>
          <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${b.note||''}">${b.note || '-'}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-xs btn-edit" data-action="edit-bill" data-id="${b.id}">编辑</button>
              <button class="btn btn-xs btn-del" data-action="delete-bill" data-id="${b.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderSummary(bills) {
    const total = bills.reduce((s, b) => s + Number(b.amount), 0);
    const budget = getBudget();
    const remain = budget - total;
    let html = `<span>筛选结果：<strong>${bills.length}</strong> 条</span>`;
    html += `<span>合计：<strong>${App.formatMoney(total)}</strong></span>`;
    if (budget > 0) {
      html += `<span style="color:${remain>=0?'var(--success)':'var(--danger)'}">${remain>=0?'剩余':'超支'}：<strong>${App.formatMoney(Math.abs(remain))}</strong></span>`;
    }
    document.getElementById('bill-summary').innerHTML = html;
  }

  function renderBudget() {
    const budget = getBudget();
    const el = document.getElementById('budget-display');
    const allBills = getBills();
    const total = allBills.reduce((s, b) => s + Number(b.amount), 0);
    if (budget > 0) {
      const pct = Math.round(total / budget * 100);
      el.className = 'budget-display' + (total > budget ? ' over-budget' : '');
      el.innerHTML = `预算 ${App.formatMoney(budget)} / 已用 ${App.formatMoney(total)} (${pct}%)`;
    } else {
      el.className = 'budget-display';
      el.innerHTML = `总支出 ${App.formatMoney(total)}`;
    }
  }

  // ========== 表单 ==========
  function showForm(bill = null) {
    const isEdit = !!bill;
    const vendors = App.getStore('vendors') || [];
    const vendorOpts = vendors.map(v => `<option value="${v.name}" ${bill?.vendor===v.name?'selected':''}>${v.name}</option>`).join('');

    const bodyHTML = `
      <div class="form-row">
        <div class="form-group"><label>日期 *</label><input type="date" id="bf-date" value="${bill?.date || App.todayStr()}"></div>
        <div class="form-group"><label>类别</label><select id="bf-cat">${CATEGORIES.map(c => `<option value="${c}" ${bill?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>项目名称</label><input type="text" id="bf-name" value="${bill?.name||''}" placeholder="如：水电改造人工费"></div>
      <div class="form-row">
        <div class="form-group"><label>金额 (元) *</label><input type="number" id="bf-amount" step="0.01" min="0" value="${bill?.amount||''}" placeholder="0.00"></div>
        <div class="form-group"><label>支付方式</label><select id="bf-method">${PAY_METHODS.map(m => `<option value="${m}" ${bill?.payMethod===m?'selected':''}>${m}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>付款状态</label><select id="bf-status">${PAY_STATUS.map(s => `<option value="${s}" ${bill?.payStatus===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label>关联商家</label><select id="bf-vendor"><option value="">无</option>${vendorOpts}</select></div>
      </div>
      <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="bf-tags" value="${(bill?.tags||[]).join(', ')}" placeholder="如：超预算, 急需"></div>
      <div class="form-group"><label>备注</label><textarea id="bf-note" placeholder="购买明细、商家信息等...">${bill?.note||''}</textarea></div>
      <div class="form-group"><label>收据/发票照片</label><input type="file" id="bf-image" accept="image/*"><br><small style="color:var(--text-secondary)">可选，图片压缩存储</small>
      ${bill?.image ? `<div style="margin-top:8px;"><img src="${bill.image}" style="max-width:200px;max-height:150px;border-radius:6px;" alt="收据"></div>` : ''}
      </div>
    `;

    const footerHTML = `
      <button class="btn btn-outline" id="bf-cancel">取消</button>
      <button class="btn btn-primary" id="bf-save">${isEdit?'保存修改':'添加记录'}</button>
    `;

    App.showModalLg(isEdit?'编辑账单':'添加账单', bodyHTML, footerHTML);
    document.getElementById('bf-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('bf-save').addEventListener('click', async () => {
      const date = document.getElementById('bf-date').value;
      const category = document.getElementById('bf-cat').value;
      const name = document.getElementById('bf-name').value.trim();
      const amount = parseFloat(document.getElementById('bf-amount').value);
      const payMethod = document.getElementById('bf-method').value;
      const payStatus = document.getElementById('bf-status').value;
      const vendor = document.getElementById('bf-vendor').value;
      const note = document.getElementById('bf-note').value.trim();
      const tagsStr = document.getElementById('bf-tags').value.trim();
      const tags = tagsStr ? tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

      if (!date) return App.showToast('请选择日期', 'error');
      if (!amount || amount <= 0) return App.showToast('请输入有效金额', 'error');

      // 处理图片
      let image = bill?.image || null;
      const fileInput = document.getElementById('bf-image');
      if (fileInput.files[0]) {
        try { image = await App.compressImage(fileInput.files[0], 600, 0.6); }
        catch { App.showToast('图片处理失败', 'error'); return; }
      }

      const bills = getBills();
      const entry = { id: bill?.id || App.uid(), date, category, name, amount, payMethod, payStatus, vendor, tags, note, image };
      if (isEdit) {
        const idx = bills.findIndex(b => b.id === bill.id);
        if (idx >= 0) bills[idx] = entry;
      } else {
        bills.push(entry);
      }
      saveBills(bills);
      App.hideModalLg();
      App.showToast(isEdit?'账单已更新':'账单已添加', 'success');
      render();
    });
  }

  async function deleteBill(id) {
    const ok = await App.showConfirm('确定要删除这条账单记录吗？');
    if (!ok) return;
    saveBills(getBills().filter(b => b.id !== id));
    App.showToast('账单已删除', 'success');
    render();
  }

  function setBudget() {
    const current = getBudget();
    App.showModal('设定预算', `
      <div class="form-group"><label>装修总预算 (元)</label><input type="number" id="bf-budget" step="0.01" min="0" value="${current||''}" placeholder="请输入预算金额"></div>
    `, `
      <button class="btn btn-outline" id="bf-bcancel">取消</button>
      <button class="btn btn-primary" id="bf-bsave">保存预算</button>
    `);
    document.getElementById('bf-bcancel').addEventListener('click', App.hideModal);
    document.getElementById('bf-bsave').addEventListener('click', () => {
      const a = parseFloat(document.getElementById('bf-budget').value);
      if (!a || a <= 0) return App.showToast('请输入有效预算', 'error');
      saveBudget(a); App.hideModal(); App.showToast('预算已设定', 'success'); render();
    });
  }

  function exportCSV() {
    const bills = getBills();
    if (bills.length === 0) return App.showToast('没有账单可导出', 'error');
    const headers = ['日期', '类别', '项目名称', '金额', '支付方式', '付款状态', '商家', '标签', '备注'];
    const rows = bills.map(b => [b.date, b.category, b.name||'', b.amount, b.payMethod||'', b.payStatus||'', b.vendor||'', (b.tags||[]).join('/'), b.note||'']);
    App.exportCSV('装修账单_' + App.todayStr() + '.csv', headers, rows);
    App.showToast('CSV已导出', 'success');
  }

  // ========== Init ==========
  function init() {
    document.getElementById('btn-add-bill').addEventListener('click', () => showForm());
    document.getElementById('btn-set-budget').addEventListener('click', setBudget);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('bill-category-filter').addEventListener('change', render);
    document.getElementById('bill-status-filter').addEventListener('change', render);
    document.getElementById('bill-month-filter').addEventListener('change', render);
    document.getElementById('bill-search').addEventListener('input', render);

    document.getElementById('bill-tbody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-bill') { const bill = getBills().find(b => b.id === id); if (bill) showForm(bill); }
      else if (action === 'delete-bill') deleteBill(id);
    });

    render();
  }

  return { init, render };
})();
