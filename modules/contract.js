/**
 * 合同票据管理模块
 * 上传合同/发票/收据/保修卡、保修到期提醒
 */
const ContractModule = (() => {
  const STORE_KEY = 'contracts';
  const TYPES = ['合同', '发票', '收据', '保修卡'];

  function getItems() { return App.getStore(STORE_KEY) || []; }
  function saveItems(d) { App.setStore(STORE_KEY, d); }

  function render() {
    let items = getItems();
    const type = document.getElementById('contract-type-filter')?.value || 'all';
    if (type !== 'all') items = items.filter(i => i.type === type);
    items.sort((a, b) => (b.date||'').localeCompare(a.date||''));

    const tbody = document.getElementById('contract-tbody');
    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">暂无合同票据，点击"添加记录"开始</td></tr>`;
    } else {
      tbody.innerHTML = items.map(c => {
        const expireWarn = checkExpire(c);
        return `
          <tr>
            <td><span style="font-weight:600;">${c.type}</span></td>
            <td>${c.name}</td>
            <td>${c.vendor || '-'}</td>
            <td>${App.formatDate(c.date)}</td>
            <td>${c.warrantyEnd ? App.formatDate(c.warrantyEnd) + (expireWarn ? ` <span style="color:var(--danger);font-weight:600;">⚠️</span>` : '') : '-'}</td>
            <td>${c.note||'-'}</td>
            <td>
              <div class="actions-cell">
                ${c.image ? `<button class="btn btn-xs btn-edit" data-action="view-contract" data-id="${c.id}">查看</button>` : ''}
                <button class="btn btn-xs btn-edit" data-action="edit-contract" data-id="${c.id}">编辑</button>
                <button class="btn btn-xs btn-del" data-action="delete-contract" data-id="${c.id}">删除</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 到期提醒
    const warnEl = document.getElementById('contract-expire-warning');
    const soonExpire = items.filter(c => {
      if (!c.warrantyEnd) return false;
      const d = new Date(c.warrantyEnd);
      const diff = (d - new Date()) / (1000*60*60*24);
      return diff > 0 && diff <= 30;
    });
    if (soonExpire.length > 0) {
      warnEl.innerHTML = `<div style="background:var(--warning-light);border:1px solid var(--warning);border-radius:var(--radius-sm);padding:12px 16px;color:#c2780a;font-weight:600;">⚠️ 以下保修即将到期：${soonExpire.map(c => c.name+' ('+c.warrantyEnd+')').join('、')}</div>`;
    } else { warnEl.innerHTML = ''; }
  }

  function checkExpire(c) {
    if (!c.warrantyEnd) return false;
    const d = new Date(c.warrantyEnd);
    const diff = (d - new Date()) / (1000*60*60*24);
    return diff > 0 && diff <= 30;
  }

  function showForm(item = null) {
    const isEdit = !!item;
    const vendors = App.getStore('vendors') || [];
    const vendorOpts = vendors.map(v => `<option value="${v.name}" ${item?.vendor===v.name?'selected':''}>${v.name}</option>`).join('');

    App.showModalLg(isEdit?'编辑记录':'添加合同/票据', `
      <div class="form-row">
        <div class="form-group"><label>类型</label><select id="cp-type">${TYPES.map(t => `<option value="${t}" ${item?.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="form-group"><label>名称 *</label><input type="text" id="cp-name" value="${item?.name||''}" placeholder="如：空调购买合同"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>关联商家</label><select id="cp-vendor"><option value="">无</option>${vendorOpts}</select></div>
        <div class="form-group"><label>日期</label><input type="date" id="cp-date" value="${item?.date||App.todayStr()}"></div>
      </div>
      ${item?.type==='保修卡' || isEdit ? `
      <div class="form-row">
        <div class="form-group"><label>保修到期</label><input type="date" id="cp-warranty" value="${item?.warrantyEnd||''}"></div>
      </div>` : ''}
      <div class="form-group"><label>备注</label><input type="text" id="cp-note" value="${item?.note||''}"></div>
      <div class="form-group"><label>照片</label><input type="file" id="cp-image" accept="image/*">
      ${item?.image ? `<div style="margin-top:8px;"><img src="${item.image}" style="max-width:200px;max-height:150px;border-radius:6px;"></div>` : ''}
      </div>
    `, `
      <button class="btn btn-outline" id="cp-cancel">取消</button>
      <button class="btn btn-primary" id="cp-save">${isEdit?'保存修改':'添加记录'}</button>
    `);
    document.getElementById('cp-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cp-save').addEventListener('click', async () => {
      const name = document.getElementById('cp-name').value.trim();
      if (!name) return App.showToast('请输入名称', 'error');
      let image = item?.image || null;
      const fileInput = document.getElementById('cp-image');
      if (fileInput.files[0]) {
        try { image = await App.compressImage(fileInput.files[0], 600, 0.5); }
        catch { App.showToast('图片处理失败', 'error'); return; }
      }
      const data = {
        id: item?.id || App.uid(),
        type: document.getElementById('cp-type').value,
        name,
        vendor: document.getElementById('cp-vendor').value,
        date: document.getElementById('cp-date').value,
        warrantyEnd: document.getElementById('cp-warranty')?.value || null,
        note: document.getElementById('cp-note').value.trim(),
        image,
      };
      const items = getItems();
      if (isEdit) { const idx = items.findIndex(i => i.id === item.id); if (idx >= 0) items[idx] = data; }
      else items.push(data);
      saveItems(items);
      App.hideModalLg();
      App.showToast(isEdit?'记录已更新':'记录已添加', 'success');
      render();
    });
  }

  function viewContract(id) {
    const item = getItems().find(i => i.id === id);
    if (!item?.image) return;
    document.getElementById('lightbox-img').src = item.image;
    document.getElementById('lightbox-info').innerHTML = `<strong>${item.type}</strong> - ${item.name}<br>${App.formatDate(item.date)}`;
    document.getElementById('lightbox').classList.add('show');
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除这条记录吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success');
    render();
  }

  function init() {
    document.getElementById('btn-add-contract').addEventListener('click', () => showForm());
    document.getElementById('contract-type-filter').addEventListener('change', render);
    document.getElementById('contract-tbody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-contract') { const item = getItems().find(i => i.id === id); if (item) showForm(item); }
      else if (action === 'view-contract') viewContract(id);
      else if (action === 'delete-contract') deleteItem(id);
    });
    render();
  }
  return { init, render };
})();
