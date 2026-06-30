/**
 * 配色与材质方案模块
 * 按房间记录颜色、色号、地面材质
 */
const ColorplanModule = (() => {
  const STORE_KEY = 'colorplans';
  const ROOMS = ['客厅','餐厅','主卧','次卧','儿童房','厨房','主卫','次卫','阳台','书房','玄关','其他'];

  function getItems() { return App.getStore(STORE_KEY) || []; }
  function saveItems(d) { App.setStore(STORE_KEY, d); }

  function render() {
    const items = getItems();
    const grid = document.getElementById('color-grid');
    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">暂无配色方案，点击"添加方案"开始记录</div>`;
      return;
    }
    grid.innerHTML = items.map(item => {
      const bgColor = item.wallColor || '#f0f0f0';
      const textColor = isLight(bgColor) ? '#333' : '#fff';
      return `
        <div class="color-card">
          <div class="color-card-preview" style="background:${bgColor};">
            <span style="color:${textColor}">${item.room} · 墙面</span>
          </div>
          <div class="color-card-body">
            <div class="color-info">
              <div><span class="color-swatch" style="background:${item.wallColor||'#ccc'};"></span><strong>墙面</strong> ${item.wallColor||'-'} ${item.wallBrand||''} ${item.wallCode||''}</div>
              <div>🏗️ <strong>地面</strong> ${item.floorType||'-'} ${item.floorBrand||''} ${item.floorModel||''}</div>
              <div>📏 <strong>踢脚线</strong> ${item.baseboard||'-'}</div>
              ${item.note ? `<div style="grid-column:1/-1;font-size:0.8rem;color:var(--text-secondary);">📝 ${item.note}</div>` : ''}
            </div>
            <div style="margin-top:10px;display:flex;gap:4px;">
              <button class="btn btn-xs btn-edit" data-action="edit-color" data-id="${item.id}">编辑</button>
              <button class="btn btn-xs btn-del" data-action="delete-color" data-id="${item.id}">删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function isLight(hex) {
    if (!hex || hex.length < 7) return true;
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return (r*299 + g*587 + b*114) / 1000 > 128;
  }

  function showForm(item = null) {
    const isEdit = !!item;
    App.showModalLg(isEdit?'编辑配色方案':'添加配色方案', `
      <div class="form-group"><label>房间</label><select id="cl-room">${ROOMS.map(r => `<option value="${r}" ${item?.room===r?'selected':''}>${r}</option>`).join('')}</select></div>
      <div class="form-row">
        <div class="form-group"><label>墙面颜色</label><input type="color" id="cl-wallcolor" value="${item?.wallColor||'#ffffff'}"></div>
        <div class="form-group"><label>涂料品牌</label><input type="text" id="cl-wallbrand" value="${item?.wallBrand||''}" placeholder="如：多乐士/立邦"></div>
      </div>
      <div class="form-group"><label>色号</label><input type="text" id="cl-wallcode" value="${item?.wallCode||''}" placeholder="如：NN0010-4"></div>
      <div class="form-row">
        <div class="form-group"><label>地面材质</label><input type="text" id="cl-floor-type" value="${item?.floorType||''}" placeholder="实木地板/瓷砖/SPC..."></div>
        <div class="form-group"><label>地板品牌</label><input type="text" id="cl-floor-brand" value="${item?.floorBrand||''}"></div>
      </div>
      <div class="form-group"><label>地板型号/色号</label><input type="text" id="cl-floor-model" value="${item?.floorModel||''}"></div>
      <div class="form-group"><label>踢脚线</label><input type="text" id="cl-baseboard" value="${item?.baseboard||''}" placeholder="铝合金/实木 + 颜色"></div>
      <div class="form-group"><label>备注</label><input type="text" id="cl-note" value="${item?.note||''}"></div>
    `, `
      <button class="btn btn-outline" id="cl-cancel">取消</button>
      <button class="btn btn-primary" id="cl-save">${isEdit?'保存修改':'添加方案'}</button>
    `);
    document.getElementById('cl-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cl-save').addEventListener('click', () => {
      const data = {
        id: item?.id || App.uid(),
        room: document.getElementById('cl-room').value,
        wallColor: document.getElementById('cl-wallcolor').value,
        wallBrand: document.getElementById('cl-wallbrand').value.trim(),
        wallCode: document.getElementById('cl-wallcode').value.trim(),
        floorType: document.getElementById('cl-floor-type').value.trim(),
        floorBrand: document.getElementById('cl-floor-brand').value.trim(),
        floorModel: document.getElementById('cl-floor-model').value.trim(),
        baseboard: document.getElementById('cl-baseboard').value.trim(),
        note: document.getElementById('cl-note').value.trim(),
      };
      const items = getItems();
      if (isEdit) { const idx = items.findIndex(i => i.id === item.id); if (idx >= 0) items[idx] = data; }
      else items.push(data);
      saveItems(items);
      App.hideModalLg();
      App.showToast(isEdit?'方案已更新':'方案已添加', 'success');
      render();
    });
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除这个配色方案吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success');
    render();
  }

  function init() {
    document.getElementById('btn-add-color').addEventListener('click', () => showForm());
    document.getElementById('color-grid').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-color') { const item = getItems().find(i => i.id === id); if (item) showForm(item); }
      else if (action === 'delete-color') deleteItem(id);
    });
    render();
  }
  return { init, render };
})();
