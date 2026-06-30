/**
 * 供应商管理模块
 * 商家信息、评分、关联账单和比价
 */
const VendorModule = (() => {
  const STORE_KEY = 'vendors';
  const CATEGORIES = ['施工队', '建材', '家电', '家具', '灯具', '卫浴', '软装', '五金', '其他'];

  function getVendors() { return App.getStore(STORE_KEY) || []; }
  function saveVendors(d) { App.setStore(STORE_KEY, d); }

  function render() {
    const vendors = getVendors();
    const grid = document.getElementById('vendor-grid');
    if (vendors.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">暂无供应商，点击"添加商家"开始记录</div>`;
      return;
    }
    grid.innerHTML = vendors.map(v => {
      const stars = '⭐'.repeat(v.rating || 0) + (v.rating < 5 ? '☆'.repeat(5-(v.rating||0)) : '');
      return `
        <div class="vendor-card">
          <h3>${v.name}</h3>
          <span style="font-size:0.78rem;background:var(--primary-light);color:var(--primary);padding:2px 10px;border-radius:12px;align-self:flex-start;">${v.category}</span>
          <div class="vendor-info">${v.contact ? '👤 '+v.contact : ''}${v.phone ? ' · 📞 '+v.phone : ''}</div>
          ${v.address ? `<div class="vendor-info">📍 ${v.address}</div>` : ''}
          <div class="vendor-stars">${stars} ${v.rating||0}/5</div>
          ${v.note ? `<div class="vendor-info">📝 ${v.note}</div>` : ''}
          <div class="vendor-card-footer">
            <button class="btn btn-xs btn-edit" data-action="edit-vendor" data-id="${v.id}">编辑</button>
            <button class="btn btn-xs btn-del" data-action="delete-vendor" data-id="${v.id}">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function showForm(vendor = null) {
    const isEdit = !!vendor;
    App.showModalLg(isEdit?'编辑商家':'添加商家', `
      <div class="form-row">
        <div class="form-group"><label>商家名称 *</label><input type="text" id="vp-name" value="${vendor?.name||''}" placeholder="如：XX建材城"></div>
        <div class="form-group"><label>类别</label><select id="vp-cat">${CATEGORIES.map(c => `<option value="${c}" ${vendor?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>联系人</label><input type="text" id="vp-contact" value="${vendor?.contact||''}"></div>
        <div class="form-group"><label>电话</label><input type="text" id="vp-phone" value="${vendor?.phone||''}"></div>
      </div>
      <div class="form-group"><label>地址</label><input type="text" id="vp-addr" value="${vendor?.address||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>评分 (1-5)</label><input type="number" id="vp-rating" min="1" max="5" value="${vendor?.rating||3}"></div>
      </div>
      <div class="form-group"><label>备注</label><textarea id="vp-note">${vendor?.note||''}</textarea></div>
    `, `
      <button class="btn btn-outline" id="vp-cancel">取消</button>
      <button class="btn btn-primary" id="vp-save">${isEdit?'保存修改':'添加商家'}</button>
    `);
    document.getElementById('vp-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('vp-save').addEventListener('click', () => {
      const name = document.getElementById('vp-name').value.trim();
      if (!name) return App.showToast('请输入商家名称', 'error');
      const data = {
        id: vendor?.id || App.uid(),
        name, category: document.getElementById('vp-cat').value,
        contact: document.getElementById('vp-contact').value.trim(),
        phone: document.getElementById('vp-phone').value.trim(),
        address: document.getElementById('vp-addr').value.trim(),
        rating: parseInt(document.getElementById('vp-rating').value) || 3,
        note: document.getElementById('vp-note').value.trim(),
      };
      const vendors = getVendors();
      if (isEdit) { const idx = vendors.findIndex(v => v.id === vendor.id); if (idx >= 0) vendors[idx] = data; }
      else vendors.push(data);
      saveVendors(vendors);
      App.hideModalLg();
      App.showToast(isEdit?'商家已更新':'商家已添加', 'success');
      render();
    });
  }

  async function deleteVendor(id) {
    const ok = await App.showConfirm('确定要删除这个商家吗？');
    if (!ok) return;
    saveVendors(getVendors().filter(v => v.id !== id));
    App.showToast('商家已删除', 'success');
    render();
  }

  function init() {
    document.getElementById('btn-add-vendor').addEventListener('click', () => showForm());
    document.getElementById('vendor-grid').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-vendor') { const v = getVendors().find(x => x.id === id); if (v) showForm(v); }
      else if (action === 'delete-vendor') deleteVendor(id);
    });
    render();
  }
  return { init, render };
})();
