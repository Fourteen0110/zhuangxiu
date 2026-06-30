/**
 * 耗材消耗记录模块
 * 计划用量 vs 实际用量、避免重复购买
 */
const MaterialModule = (() => {
  const STORE_KEY = 'materials';
  const CATEGORIES = ['油漆涂料', '水泥砂浆', '胶粘剂', '防水材料', '管材线缆', '板材', '五金件', '其他'];

  function getItems() { return App.getStore(STORE_KEY) || []; }
  function saveItems(d) { App.setStore(STORE_KEY, d); }

  function render() {
    const items = getItems();
    const tbody = document.getElementById('material-tbody');
    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="10">暂无耗材记录，点击"添加耗材"开始记录</td></tr>`;
    } else {
      tbody.innerHTML = items.map(m => {
        const need = (m.planQty || 0) - (m.boughtQty || 0);
        return `
          <tr>
            <td><strong>${m.name}</strong></td>
            <td>${m.category}</td>
            <td>${m.planQty||'-'} ${m.unit||''}</td>
            <td>${m.actualQty||'-'} ${m.unit||''}</td>
            <td>${m.unit||'-'}</td>
            <td>${m.price ? App.formatMoney(m.price) : '-'}</td>
            <td>${m.boughtQty||0} ${m.unit||''}</td>
            <td style="color:${need>0?'var(--danger)':'var(--success)'};font-weight:600;">${need > 0 ? need + ' ' + (m.unit||'') : '✅ 已够'}</td>
            <td>${m.note||'-'}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-xs btn-edit" data-action="edit-material" data-id="${m.id}">编辑</button>
                <button class="btn btn-xs btn-del" data-action="delete-material" data-id="${m.id}">删除</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 汇总
    const totalPlan = items.reduce((s, m) => s + (Number(m.planQty||0) * Number(m.price||0)), 0);
    const totalBought = items.reduce((s, m) => s + (Number(m.boughtQty||0) * Number(m.price||0)), 0);
    const needBuy = items.filter(m => (m.planQty||0) > (m.boughtQty||0));
    document.getElementById('material-summary').innerHTML = `
      <span>计划总额：<strong>${App.formatMoney(totalPlan)}</strong></span>
      <span>已购总额：<strong>${App.formatMoney(totalBought)}</strong></span>
      <span style="color:${needBuy.length>0?'var(--danger)':'var(--success)'}">还需购买：<strong>${needBuy.length}</strong> 项</span>
    `;
  }

  function showForm(item = null) {
    const isEdit = !!item;
    App.showModalLg(isEdit?'编辑耗材':'添加耗材', `
      <div class="form-row">
        <div class="form-group"><label>材料名称 *</label><input type="text" id="mp-name" value="${item?.name||''}" placeholder="如：乳胶漆"></div>
        <div class="form-group"><label>类别</label><select id="mp-cat">${CATEGORIES.map(c => `<option value="${c}" ${item?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>计划用量</label><input type="number" id="mp-plan" step="0.1" min="0" value="${item?.planQty||''}"></div>
        <div class="form-group"><label>实际用量</label><input type="number" id="mp-actual" step="0.1" min="0" value="${item?.actualQty||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>单位</label><input type="text" id="mp-unit" value="${item?.unit||''}" placeholder="桶/kg/㎡/卷/米"></div>
        <div class="form-group"><label>单价 (元)</label><input type="number" id="mp-price" step="0.01" min="0" value="${item?.price||''}" placeholder="0.00"></div>
      </div>
      <div class="form-group"><label>已购数量</label><input type="number" id="mp-bought" step="0.1" min="0" value="${item?.boughtQty||0}"></div>
      <div class="form-group"><label>备注</label><input type="text" id="mp-note" value="${item?.note||''}"></div>
    `, `
      <button class="btn btn-outline" id="mp-cancel">取消</button>
      <button class="btn btn-primary" id="mp-save">${isEdit?'保存修改':'添加耗材'}</button>
    `);
    document.getElementById('mp-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('mp-save').addEventListener('click', () => {
      const name = document.getElementById('mp-name').value.trim();
      if (!name) return App.showToast('请输入材料名称', 'error');
      const data = {
        id: item?.id || App.uid(),
        name, category: document.getElementById('mp-cat').value,
        planQty: parseFloat(document.getElementById('mp-plan').value) || null,
        actualQty: parseFloat(document.getElementById('mp-actual').value) || null,
        unit: document.getElementById('mp-unit').value.trim(),
        price: parseFloat(document.getElementById('mp-price').value) || null,
        boughtQty: parseFloat(document.getElementById('mp-bought').value) || 0,
        note: document.getElementById('mp-note').value.trim(),
      };
      const items = getItems();
      if (isEdit) { const idx = items.findIndex(i => i.id === item.id); if (idx >= 0) items[idx] = data; }
      else items.push(data);
      saveItems(items);
      App.hideModalLg();
      App.showToast(isEdit?'耗材已更新':'耗材已添加', 'success');
      render();
    });
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除这条耗材记录吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success');
    render();
  }

  function init() {
    document.getElementById('btn-add-material').addEventListener('click', () => showForm());
    document.getElementById('material-tbody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-material') { const item = getItems().find(i => i.id === id); if (item) showForm(item); }
      else if (action === 'delete-material') deleteItem(id);
    });
    render();
  }
  return { init, render };
})();
