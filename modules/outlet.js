/**
 * 插座点位管理模块
 * 按房间记录插座/开关、类型、高度、位置
 */
const OutletModule = (() => {
  const STORE_KEY = 'outlets';
  const ROOMS = ['客厅','餐厅','主卧','次卧','儿童房','厨房','主卫','次卫','阳台','书房','玄关','储物间','其他'];
  const TYPES = ['五孔插座','USB插座','网口','16A插座','开关','双控开关','其他'];

  function getItems() { return App.getStore(STORE_KEY) || []; }
  function saveItems(d) { App.setStore(STORE_KEY, d); }

  function render() {
    let items = getItems();
    const room = document.getElementById('outlet-room-filter')?.value || 'all';
    const type = document.getElementById('outlet-type-filter')?.value || 'all';
    if (room !== 'all') items = items.filter(i => i.room === room);
    if (type !== 'all') items = items.filter(i => i.type === type);
    items.sort((a, b) => a.room.localeCompare(b.room) || a.type.localeCompare(b.type));

    // 初始化房间下拉
    const roomSel = document.getElementById('outlet-room-filter');
    if (roomSel && roomSel.options.length <= 1) {
      roomSel.innerHTML = '<option value="all">全部房间</option>' + ROOMS.map(r => `<option value="${r}">${r}</option>`).join('');
    }

    // 统计
    const stats = {};
    items.forEach(i => { stats[i.type] = (stats[i.type] || 0) + 1; });
    document.getElementById('outlet-stats').innerHTML = `<span>共 <strong>${items.length}</strong> 个点位</span>` +
      Object.entries(stats).map(([t, c]) => `<span>${t}: <strong>${c}</strong></span>`).join('');

    const tbody = document.getElementById('outlet-tbody');
    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">暂无插座点位，点击"添加点位"开始记录</td></tr>`;
    } else {
      tbody.innerHTML = items.map(o => `
        <tr>
          <td>${o.room}</td>
          <td>${o.type}</td>
          <td>${o.position || '-'}</td>
          <td>${o.height || '-'}</td>
          <td>${o.purpose || '-'}</td>
          <td>${o.note || '-'}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-xs btn-edit" data-action="edit-outlet" data-id="${o.id}">编辑</button>
              <button class="btn btn-xs btn-del" data-action="delete-outlet" data-id="${o.id}">删除</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  function showForm(item = null) {
    const isEdit = !!item;
    App.showModal(isEdit?'编辑点位':'添加插座/开关点位', `
      <div class="form-row">
        <div class="form-group"><label>房间</label><select id="op-room">${ROOMS.map(r => `<option value="${r}" ${item?.room===r?'selected':''}>${r}</option>`).join('')}</select></div>
        <div class="form-group"><label>类型</label><select id="op-type">${TYPES.map(t => `<option value="${t}" ${item?.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>位置描述</label><input type="text" id="op-pos" value="${item?.position||''}" placeholder="如：床头左侧、电视墙中间"></div>
      <div class="form-row">
        <div class="form-group"><label>离地高度 (cm)</label><input type="number" id="op-height" value="${item?.height||''}" placeholder="如：30（常规低位）"></div>
        <div class="form-group"><label>用途</label><input type="text" id="op-purpose" value="${item?.purpose||''}" placeholder="如：床头台灯、电视"></div>
      </div>
      <div class="form-group"><label>备注</label><input type="text" id="op-note" value="${item?.note||''}"></div>
    `, `
      <button class="btn btn-outline" id="op-cancel">取消</button>
      <button class="btn btn-primary" id="op-save">${isEdit?'保存修改':'添加点位'}</button>
    `);
    document.getElementById('op-cancel').addEventListener('click', App.hideModal);
    document.getElementById('op-save').addEventListener('click', () => {
      const room = document.getElementById('op-room').value;
      const type = document.getElementById('op-type').value;
      const data = {
        id: item?.id || App.uid(), room, type,
        position: document.getElementById('op-pos').value.trim(),
        height: parseFloat(document.getElementById('op-height').value) || null,
        purpose: document.getElementById('op-purpose').value.trim(),
        note: document.getElementById('op-note').value.trim(),
      };
      const items = getItems();
      if (isEdit) { const idx = items.findIndex(i => i.id === item.id); if (idx >= 0) items[idx] = data; }
      else items.push(data);
      saveItems(items);
      App.hideModal();
      App.showToast(isEdit?'点位已更新':'点位已添加', 'success');
      render();
    });
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除这个点位吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success');
    render();
  }

  function init() {
    document.getElementById('btn-add-outlet').addEventListener('click', () => showForm());
    document.getElementById('outlet-room-filter').addEventListener('change', render);
    document.getElementById('outlet-type-filter').addEventListener('change', render);
    document.getElementById('outlet-tbody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-outlet') { const item = getItems().find(i => i.id === id); if (item) showForm(item); }
      else if (action === 'delete-outlet') deleteItem(id);
    });
    render();
  }
  return { init, render };
})();
