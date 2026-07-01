/**
 * 购物比价模块 v4
 * 一商品多商家报价，自动对比最低价和差价
 */
const CompareModule = (() => {
  const STORE_KEY = 'compares';
  const ROOMS = ['客厅','餐厅','主卧','次卧','儿童房','厨房','主卫','次卫','阳台','书房','玄关','储物间','其他'];

  function getItems() { return App.getStore(STORE_KEY) || []; }
  function saveItems(d) { App.setStore(STORE_KEY, d); }

  function render() {
    let items = getItems();
    const room = document.getElementById('compare-room-filter')?.value || 'all';
    const status = document.getElementById('compare-status-filter')?.value || 'all';
    const search = (document.getElementById('compare-search')?.value || '').toLowerCase().trim();
    if (room !== 'all') items = items.filter(i => i.room === room);
    if (status === 'pending') items = items.filter(i => !i.ordered);
    if (status === 'ordered') items = items.filter(i => i.ordered);
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search));

    const roomSel = document.getElementById('compare-room-filter');
    if (roomSel && roomSel.options.length <= 1) {
      roomSel.innerHTML = '<option value="all">全部房间</option>' + ROOMS.map(r => `<option value="${r}">${r}</option>`).join('');
    }
    renderGrid(items);
  }

  function renderGrid(items) {
    const grid = document.getElementById('compare-grid');
    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">暂无比价记录，点击"粘贴链接比价"开始</div>`;
      return;
    }
    grid.innerHTML = items.map(item => {
      const shops = item.shops || [];
      const prices = shops.map(s => Number(s.price)).filter(p => p > 0);
      const minPrice = prices.length > 1 ? Math.min(...prices) : (prices.length === 1 ? prices[0] : 0);
      const maxPrice = prices.length > 1 ? Math.max(...prices) : 0;
      const saving = maxPrice - minPrice;

      return `
        <div class="compare-card" data-compare-id="${item.id}">
          <div class="compare-card-header">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" class="compare-checkbox" data-id="${item.id}" data-min-price="${minPrice}" style="width:18px;height:18px;accent-color:var(--primary);flex-shrink:0;">
              <h3>${item.name}</h3>
            </label>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <span style="font-size:0.78rem;color:var(--text-secondary);">${item.room||''}</span>
              ${item.ordered ? '<span class="badge badge-ordered">已下单</span>' : '<span class="badge badge-pending">比价中</span>'}
            </div>
          </div>
          <div class="compare-card-body">
            ${shops.length === 0 ? '<div style="padding:8px;color:var(--text-secondary);font-size:0.82rem;">暂无商家报价，点击下方按钮添加</div>' : ''}
            ${shops.map((s, i) => {
              const isBest = Number(s.price) === minPrice && minPrice > 0 && shops.length > 1;
              return `
                <div class="compare-row ${isBest ? 'best-price' : ''}">
                  <span class="shop-name" style="cursor:pointer;" data-action="edit-shop-name" data-compare-id="${item.id}" data-shop-idx="${i}" title="点击编辑商家名">${isBest ? '🏆 ' : ''}${s.name || '商家'+(i+1)}</span>
                  <span class="shop-price" style="cursor:pointer;${isBest?'font-size:1rem;':''}" data-action="edit-shop-price" data-compare-id="${item.id}" data-shop-idx="${i}" title="点击编辑价格">${s.price ? App.formatMoney(s.price) : '<span style="color:#ccc;">点击填价</span>'}</span>
                  ${s.link ? `<a class="shop-link" href="${s.link}" target="_blank" onclick="event.stopPropagation()" title="打开商品链接">🔗</a>` : ''}
                  ${s.note ? `<span style="font-size:0.72rem;color:var(--text-secondary);cursor:pointer;" data-action="edit-shop-note" data-compare-id="${item.id}" data-shop-idx="${i}" title="点击编辑备注">${s.note}</span>` : ''}
                  <button class="btn btn-xs btn-del" data-action="del-shop" data-compare-id="${item.id}" data-shop-idx="${i}" title="删除此商家">×</button>
                </div>
              `;
            }).join('')}
            ${shops.length > 1 && saving > 0 ? `
              <div style="margin-top:10px;padding:8px 12px;background:var(--success-light);border-radius:8px;text-align:center;">
                <span style="font-weight:700;color:var(--success);">💰 比价结果：最高最低差价 ${App.formatMoney(saving)}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);display:block;">最低价 ¥${minPrice}，省了 ${App.formatMoney(saving)}</span>
              </div>
            ` : ''}
          </div>
          <div class="compare-card-footer" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:space-between;">
            <div>
              <button class="btn btn-xs btn-edit" data-action="edit-compare" data-id="${item.id}">编辑名称</button>
              <button class="btn btn-xs" style="background:#fff3e0;color:#e65100;" data-action="add-shop" data-id="${item.id}">+ 加商家报价</button>
            </div>
            <div>
              ${!item.ordered ? `<button class="btn btn-xs btn-success" data-action="order-compare" data-id="${item.id}">标记下单</button>` : ''}
              <button class="btn btn-xs btn-del" data-action="delete-compare" data-id="${item.id}">删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========== 新增比价：粘贴链接（v4.1 自动搜索比价） ==========
  function showPasteCompare() {
    App.showModalLg('📋 粘贴链接比价', `
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">
        <strong>操作：</strong>去电商App复制链接 → 粘贴 → 点「搜索比价」→ 对照搜索结果填价格
      </p>
      <div class="form-group">
        <label>① 粘贴电商链接</label>
        <div style="display:flex;gap:6px;">
          <input type="text" id="cf-link" placeholder="粘贴淘宝/京东/拼多多商品链接..." style="flex:1;">
        </div>
      </div>
      <div class="form-group">
        <label>② 商品名称（粘贴链接后自动提取）</label>
        <div style="display:flex;gap:6px;">
          <input type="text" id="cf-name" placeholder="自动从链接提取或手动输入" style="flex:1;">
          <button class="btn btn-sm btn-primary" id="cf-search-btn" style="white-space:nowrap;">🔍 搜索比价</button>
        </div>
      </div>
      <div style="background:var(--warning-light);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:0.82rem;" id="cf-hint">
        💡 粘贴链接后点「搜索比价」，在新窗口查看各平台价格，回来填入
      </div>
      <div class="form-row">
        <div class="form-group"><label>房间</label><select id="cf-room">${ROOMS.map(r => `<option value="${r}">${r}</option>`).join('')}</select></div>
        <div class="form-group"><label>当前平台</label><input type="text" id="cf-shop" placeholder="京东/淘宝/拼多多（自动识别）"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>价格 (元)</label><input type="number" id="cf-price" step="0.01" min="0" placeholder="对照搜索结果填入"></div>
        <div class="form-group"><label>型号/规格</label><input type="text" id="cf-model" placeholder="如：BCD-500WL、1.5匹"></div>
      </div>
      <div class="form-group"><label>备注</label><input type="text" id="cf-note" placeholder="包邮/免安装/赠品..."></div>
    `, `
      <button class="btn btn-outline" id="cf-cancel">取消</button>
      <button class="btn btn-primary" id="cf-save">保存（之后可再加商家比价）</button>
    `);

    const linkInput = document.getElementById('cf-link');
    const nameInput = document.getElementById('cf-name');
    const shopInput = document.getElementById('cf-shop');
    const priceInput = document.getElementById('cf-price');
    const hint = document.getElementById('cf-hint');

    // 粘贴链接时自动提取关键词并识别平台
    linkInput.addEventListener('input', () => {
      const link = linkInput.value.trim();
      if (!link) return;
      const parsed = parseText(link);

      // 自动填名称
      if (parsed.name && !nameInput.value) nameInput.value = parsed.name;

      // 自动填平台
      if (parsed.shop) shopInput.value = parsed.shop;

      // 从链接中提取更多关键词（型号等）
      const extraKeywords = extractKeywords(link);
      if (extraKeywords && nameInput.value && !nameInput.value.includes(extraKeywords)) {
        nameInput.value = nameInput.value + ' ' + extraKeywords;
      }

      hint.innerHTML = parsed.shop
        ? `✅ 识别平台：<strong>${parsed.shop}</strong> · 商品：<strong>${parsed.name||'点击搜索获取'}</strong> · 点击「搜索比价」查看各平台价格`
        : `📋 链接已粘贴 · 点击「🔍 搜索比价」查看各平台价格`;
    });

    // 搜索比价按钮——核心功能
    document.getElementById('cf-search-btn').addEventListener('click', () => {
      const keyword = nameInput.value.trim();
      if (!keyword) return App.showToast('请先输入商品名称或粘贴链接', 'error');

      const encoded = encodeURIComponent(keyword);
      // 用多平台同时搜索
      const urls = [
        { name:'什么值得买（全网比价）', icon:'💎', url:`https://search.smzdm.com/?c=home&s=${encoded}&v=b` },
        { name:'京东', icon:'🐶', url:`https://search.jd.com/Search?keyword=${encoded}&enc=utf-8` },
        { name:'淘宝', icon:'🛒', url:`https://s.taobao.com/search?q=${encoded}` },
        { name:'拼多多', icon:'📱', url:`https://mobile.yangkeduo.com/search_result.html?search_key=${encoded}` },
      ];

      App.showModal(`🔍 搜索比价：${keyword}`, `
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">
          在新窗口查看价格后，<strong>回来填入价格</strong>即可
        </p>
        ${urls.map(u => `
          <button class="btn btn-outline search-platform-btn" data-url="${u.url}" style="width:100%;margin-bottom:8px;justify-content:flex-start;padding:12px 16px;text-align:left;">
            <span style="font-size:1.3rem;">${u.icon}</span>
            <span style="font-weight:600;margin-left:8px;">${u.name}</span>
            <span style="margin-left:auto;font-size:0.75rem;color:var(--text-secondary);">搜索「${keyword.slice(0,12)}${keyword.length>12?'…':''}」</span>
          </button>
        `).join('')}
        <p style="font-size:0.78rem;color:var(--text-secondary);margin-top:10px;">💡 推荐先点「什么值得买」，它聚合了全网价格</p>
      `, `<button class="btn btn-outline" id="cf-sclose">关闭</button>`);

      document.getElementById('cf-sclose').addEventListener('click', App.hideModal);
      document.querySelectorAll('.search-platform-btn').forEach(btn => {
        btn.addEventListener('click', () => window.open(btn.dataset.url, '_blank', 'noopener'));
      });
    });

    // 打开原始链接
    document.getElementById('cf-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cf-save').addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) return App.showToast('请输入商品名称', 'error');
      const model = document.getElementById('cf-model').value.trim();
      const fullName = model ? `${name} (${model})` : name;
      const items = getItems();
      items.push({
        id: App.uid(),
        name: fullName,
        room: document.getElementById('cf-room').value,
        shops: [{
          name: shopInput.value.trim() || '未指定',
          price: parseFloat(priceInput.value) || null,
          link: linkInput.value.trim(),
          note: document.getElementById('cf-note').value.trim(),
        }],
        ordered: false
      });
      saveItems(items);
      App.hideModalLg();
      App.showToast('已保存！点「+ 加商家报价」继续比价', 'success');
      render();
    });
  }

  // ========== 添加商家报价到已有商品 ==========
  function showAddShop(compareId) {
    const items = getItems();
    const item = items.find(i => i.id === compareId);
    if (!item) return;

    App.showModal(`➕ 添加报价：${item.name}`, `
      <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">
        已有 <strong>${(item.shops||[]).length}</strong> 个商家报价
      </p>
      <div class="form-group">
        <label>粘贴电商链接</label>
        <input type="text" id="as-link" placeholder="粘贴另一个平台的商品链接...">
      </div>
      <div class="form-row">
        <div class="form-group"><label>商家/平台</label><input type="text" id="as-shop" placeholder="京东/淘宝/拼多多"></div>
        <div class="form-group"><label>价格 *</label><div style="display:flex;gap:6px;"><input type="number" id="as-price" step="0.01" min="0" placeholder="0.00" style="flex:1;"><button class="btn btn-xs btn-primary" id="as-search" style="white-space:nowrap;">🔍 搜价</button></div></div>
      </div>
      <div class="form-group"><label>备注</label><input type="text" id="as-note" placeholder="包邮/免安装..."></div>
    `, `
      <button class="btn btn-outline" id="as-cancel">取消</button>
      <button class="btn btn-primary" id="as-save">添加此商家</button>
    `);

    document.getElementById('as-link').addEventListener('input', () => {
      const link = document.getElementById('as-link').value.trim();
      const parsed = parseText(link);
      if (parsed.shop && !document.getElementById('as-shop').value) document.getElementById('as-shop').value = parsed.shop;
    });

    document.getElementById('as-search').addEventListener('click', () => {
      const keyword = item.name || document.getElementById('as-shop').value || '';
      if (!keyword) return App.showToast('请输入商品名称或平台', 'error');
      const encoded = encodeURIComponent(keyword);
      const urls = [
        { name:'什么值得买（全网比价）', icon:'💎', url:`https://search.smzdm.com/?c=home&s=${encoded}&v=b` },
        { name:'京东', icon:'🐶', url:`https://search.jd.com/Search?keyword=${encoded}&enc=utf-8` },
        { name:'淘宝', icon:'🛒', url:`https://s.taobao.com/search?q=${encoded}` },
        { name:'拼多多', icon:'📱', url:`https://mobile.yangkeduo.com/search_result.html?search_key=${encoded}` },
      ];
      App.showModal(`🔍 搜索：${keyword}`, `
        ${urls.map(u => `<button class="btn btn-outline" style="width:100%;margin-bottom:8px;justify-content:flex-start;padding:12px 16px;text-align:left;" onclick="window.open('${u.url}','_blank','noopener')"><span style="font-size:1.3rem;">${u.icon}</span><span style="font-weight:600;margin-left:8px;">${u.name}</span></button>`).join('')}
      `, `<button class="btn btn-outline" id="as-sclose">关闭</button>`);
      document.getElementById('as-sclose').addEventListener('click', App.hideModal);
    });

    document.getElementById('as-cancel').addEventListener('click', App.hideModal);
    document.getElementById('as-save').addEventListener('click', () => {
      const shop = document.getElementById('as-shop').value.trim();
      const price = parseFloat(document.getElementById('as-price').value);
      if (!price || price <= 0) return App.showToast('请输入有效价格', 'error');

      const items = getItems();
      const idx = items.findIndex(i => i.id === compareId);
      if (idx >= 0) {
        if (!items[idx].shops) items[idx].shops = [];
        items[idx].shops.push({
          name: shop || '商家'+(items[idx].shops.length+1),
          price,
          link: document.getElementById('as-link').value.trim(),
          note: document.getElementById('as-note').value.trim(),
        });
        saveItems(items);
      }
      App.hideModal();
      App.showToast(`已添加${shop||''}报价 ¥${price}`, 'success');
      render();
    });
  }

  // ========== 删除单个商家 ==========
  async function deleteShop(compareId, shopIdx) {
    const items = getItems();
    const idx = items.findIndex(i => i.id === compareId);
    if (idx < 0) return;
    const shop = items[idx].shops[shopIdx];
    const ok = await App.showConfirm(`删除「${shop.name||'商家'+(shopIdx+1)}」的报价？`);
    if (!ok) return;
    items[idx].shops.splice(shopIdx, 1);
    saveItems(items);
    App.showToast('已删除', 'success');
    render();
  }

  // ========== 一键全网比价后，快速保存 ==========
  function showPasteCompareWithModel(model) {
    App.showModalLg('💾 保存比价结果', `
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">
        已在浏览器打开各平台搜索「<strong>${model}</strong>」，对照价格填入下方保存
      </p>
      <div class="form-row">
        <div class="form-group"><label>商品名称/型号 *</label><input type="text" id="cfm-name" value="${model}"></div>
        <div class="form-group"><label>房间</label><select id="cfm-room">${ROOMS.map(r => `<option value="${r}">${r}</option>`).join('')}</select></div>
      </div>
      <p style="font-size:0.82rem;font-weight:600;margin:10px 0 6px;">商家① — 什么值得买/京东</p>
      <div class="form-row">
        <div class="form-group"><label>平台</label><input type="text" id="cfm-shop1" placeholder="京东/什么值得买"></div>
        <div class="form-group"><label>价格</label><input type="number" id="cfm-price1" step="0.01" min="0" placeholder="0.00"></div>
      </div>
      <p style="font-size:0.82rem;font-weight:600;margin:10px 0 6px;">商家② — 淘宝</p>
      <div class="form-row">
        <div class="form-group"><label>平台</label><input type="text" id="cfm-shop2" placeholder="淘宝"></div>
        <div class="form-group"><label>价格</label><input type="number" id="cfm-price2" step="0.01" min="0" placeholder="0.00"></div>
      </div>
      <p style="font-size:0.82rem;font-weight:600;margin:10px 0 6px;">商家③ — 其他</p>
      <div class="form-row">
        <div class="form-group"><label>平台</label><input type="text" id="cfm-shop3" placeholder="拼多多/线下店"></div>
        <div class="form-group"><label>价格</label><input type="number" id="cfm-price3" step="0.01" min="0" placeholder="0.00"></div>
      </div>
    `, `
      <button class="btn btn-outline" id="cfm-cancel">取消</button>
      <button class="btn btn-primary" id="cfm-save">保存比价</button>
    `);

    document.getElementById('cfm-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cfm-save').addEventListener('click', () => {
      const name = document.getElementById('cfm-name').value.trim();
      if (!name) return App.showToast('请输入商品名称', 'error');
      const shops = [
        { name: document.getElementById('cfm-shop1').value.trim(), price: parseFloat(document.getElementById('cfm-price1').value) || null, link: '', note: '' },
        { name: document.getElementById('cfm-shop2').value.trim(), price: parseFloat(document.getElementById('cfm-price2').value) || null, link: '', note: '' },
        { name: document.getElementById('cfm-shop3').value.trim(), price: parseFloat(document.getElementById('cfm-price3').value) || null, link: '', note: '' },
      ].filter(s => s.name && s.price);

      const items = getItems();
      items.push({ id: App.uid(), name, room: document.getElementById('cfm-room').value, shops, ordered: false });
      saveItems(items);
      App.hideModalLg();
      App.showToast('比价已保存', 'success');
      render();
    });
  }

  // ========== 行内编辑商家信息 ==========
  function editShopField(compareId, shopIdx, field) {
    const items = getItems();
    const item = items.find(i => i.id === compareId);
    if (!item || !item.shops[shopIdx]) return;
    const shop = item.shops[shopIdx];

    const labels = { name: '商家名称', price: '价格 (元)', note: '备注' };
    const types = { name: 'text', price: 'number', note: 'text' };
    const values = { name: shop.name || '', price: shop.price || '', note: shop.note || '' };

    App.showModal(`编辑 ${labels[field]}`, `
      <div class="form-group">
        <label>${labels[field]}</label>
        <input type="${types[field]}" id="es-value" value="${values[field]}" ${field==='price'?'step=0.01 min=0':''} placeholder="${field==='price'?'0.00':''}" autofocus>
      </div>
      ${field === 'name' ? `<div class="form-group"><label>链接</label><input type="url" id="es-link" value="${shop.link||''}" placeholder="https://..."></div>` : ''}
    `, `
      <button class="btn btn-outline" id="es-cancel">取消</button>
      <button class="btn btn-primary" id="es-save">保存</button>
    `);

    document.getElementById('es-cancel').addEventListener('click', App.hideModal);
    document.getElementById('es-save').addEventListener('click', () => {
      const val = document.getElementById('es-value').value.trim();
      if (field === 'price') {
        shop.price = parseFloat(val) || null;
      } else if (field === 'name') {
        shop.name = val || '商家'+(shopIdx+1);
        const linkEl = document.getElementById('es-link');
        if (linkEl) shop.link = linkEl.value.trim();
      } else {
        shop.note = val;
      }
      saveItems(items);
      App.hideModal();
      App.showToast('已更新', 'success');
      render();
    });
  }

  function showEditName(item) {
    App.showModal('编辑商品信息', `
      <div class="form-group"><label>商品名称</label><input type="text" id="en-name" value="${item.name||''}"></div>
      <div class="form-group"><label>房间</label><select id="en-room">${ROOMS.map(r => `<option value="${r}" ${item.room===r?'selected':''}>${r}</option>`).join('')}</select></div>
    `, `
      <button class="btn btn-outline" id="en-cancel">取消</button>
      <button class="btn btn-primary" id="en-save">保存</button>
    `);
    document.getElementById('en-cancel').addEventListener('click', App.hideModal);
    document.getElementById('en-save').addEventListener('click', () => {
      const name = document.getElementById('en-name').value.trim();
      if (!name) return App.showToast('请输入名称', 'error');
      const items = getItems();
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) { items[idx].name = name; items[idx].room = document.getElementById('en-room').value; }
      saveItems(items);
      App.hideModal();
      App.showToast('已更新', 'success');
      render();
    });
  }

  // ========== 工具函数 ==========
  function parseText(text) {
    const result = { name: '', price: null, shop: '', link: '' };
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) result.link = urlMatch[1];
    const pricePatterns = [/¥\s*(\d+\.?\d{0,2})/, /￥\s*(\d+\.?\d{0,2})/, /(\d+\.?\d{0,2})\s*元/, /RMB\s*(\d+\.?\d{0,2})/i, /价格[：:]\s*(\d+\.?\d{0,2})/];
    for (const p of pricePatterns) { const m = text.match(p); if (m) { result.price = parseFloat(m[1]); break; } }
    if (text.includes('京东')||text.includes('jd.com')||(result.link&&result.link.includes('jd.com'))) result.shop='京东';
    else if (text.includes('淘宝')||text.includes('taobao.com')||(result.link&&result.link.includes('taobao.com'))) result.shop='淘宝';
    else if (text.includes('拼多多')||text.includes('yangkeduo')||(result.link&&result.link.includes('yangkeduo'))) result.shop='拼多多';
    else if (text.includes('天猫')||text.includes('tmall.com')) result.shop='天猫';
    else if (text.includes('苏宁')||text.includes('suning.com')) result.shop='苏宁';
    let clean = text.replace(/https?:\/\/[^\s]+/g,'').replace(/¥\s*\d+\.?\d{0,2}/g,'').replace(/￥\s*\d+\.?\d{0,2}/g,'').replace(/\d+\.?\d{0,2}\s*元/g,'').replace(/RMB\s*\d+\.?\d{0,2}/gi,'').replace(/【.+?】/g,'').replace(/包邮|免运费|顺丰|正品|旗舰店|自营|官方|授权|专卖|品牌/g,'').replace(/\s+/g,' ').trim();
    const fragments = clean.split(/[，,。\n\r]+/).filter(f=>f.length>3);
    if (fragments.length>0) { result.name = fragments.reduce((a,b)=>a.length>=b.length?a:b,''); if(result.name.length>60) result.name=result.name.slice(0,60); }
    else if (clean.length>3) result.name = clean.slice(0,60);
    return result;
  }

  // 从链接中提取型号关键词（如 BCD-500、KFR-35GW 等）
  function extractKeywords(link) {
    // 京东链接：提取 sku 或商品名中的型号
    let keywords = '';
    // 淘宝链接中的 id 后面的标题部分
    const taobaoMatch = link.match(/item\.htm\?.*?(?:id=\d+).*?(?:title=([^&]+))?/);
    if (taobaoMatch && taobaoMatch[1]) {
      keywords = decodeURIComponent(taobaoMatch[1]).replace(/\+/g,' ').slice(0, 40);
    }
    // 通用：提取字母数字型号（如 BCD-500WL、KFR-35GW）
    const modelMatch = link.match(/([A-Z]{2,6}[-_]?\d{2,4}[A-Z]{0,4})/i);
    if (modelMatch && !keywords) keywords = modelMatch[1];
    return keywords;
  }

  function importFromFurniture() {
    const furniture = App.getStore('furniture') || [];
    const compares = getItems();
    const existingNames = new Set(compares.map(c => c.name));
    const candidates = furniture.filter(f => !existingNames.has(f.name) && (f.status === '待购' || !f.status));
    if (candidates.length === 0) return App.showToast('没有可导入的物品', 'error');
    let rows = candidates.map(f => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
        <input type="checkbox" id="cf-import-${f.id}" checked>
        <label for="cf-import-${f.id}" style="flex:1;font-size:0.85rem;">${f.name} <span style="color:var(--text-secondary);">(${f.room})</span></label>
      </div>
    `).join('');
    App.showModalLg('从家电家具导入', rows, `<button class="btn btn-outline" id="cf-icancel">取消</button><button class="btn btn-primary" id="cf-isave">导入选中</button>`);
    document.getElementById('cf-icancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cf-isave').addEventListener('click', () => {
      const items = getItems();
      candidates.forEach(f => { if (document.getElementById(`cf-import-${f.id}`).checked) items.push({ id: App.uid(), name: f.name, room: f.room, shops: [], ordered: false }); });
      saveItems(items); App.hideModalLg(); App.showToast('已导入', 'success'); render();
    });
  }

  async function markOrdered(id) {
    const items = getItems(); const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { items[idx].ordered = true; saveItems(items); App.showToast('已标记为下单', 'success'); render(); }
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除这个比价商品吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success'); render();
  }

  function init() {
    document.getElementById('btn-add-compare').addEventListener('click', showPasteCompare);
    document.getElementById('btn-compare-from-furniture').addEventListener('click', importFromFurniture);
    document.getElementById('compare-room-filter').addEventListener('change', render);
    document.getElementById('compare-status-filter').addEventListener('change', render);
    document.getElementById('compare-search').addEventListener('input', render);

    document.getElementById('compare-grid').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.compareId || btn.dataset.id;
      if (action === 'add-shop') showAddShop(id);
      else if (action === 'del-shop') { e.stopPropagation(); deleteShop(btn.dataset.compareId, parseInt(btn.dataset.shopIdx)); }
      else if (action === 'edit-compare') { const item = getItems().find(i => i.id === id); if (item) showEditName(item); }
      else if (action === 'order-compare') markOrdered(id);
      else if (action === 'delete-compare') deleteItem(id);
      else if (action === 'edit-shop-name') { e.stopPropagation(); editShopField(btn.dataset.compareId, parseInt(btn.dataset.shopIdx), 'name'); }
      else if (action === 'edit-shop-price') { e.stopPropagation(); editShopField(btn.dataset.compareId, parseInt(btn.dataset.shopIdx), 'price'); }
      else if (action === 'edit-shop-note') { e.stopPropagation(); editShopField(btn.dataset.compareId, parseInt(btn.dataset.shopIdx), 'note'); }
    });

    // ========== 一键全网比价（输入型号自动搜索） ==========
    document.getElementById('btn-quick-compare').addEventListener('click', () => {
      const model = document.getElementById('quick-compare-input').value.trim();
      if (!model) return App.showToast('请输入电器型号', 'error');

      const encoded = encodeURIComponent(model);
      // 同时打开什么值得买 + 京东 + 淘宝
      const urls = [
        `https://search.smzdm.com/?c=home&s=${encoded}&v=b`,
        `https://search.jd.com/Search?keyword=${encoded}&enc=utf-8`,
        `https://s.taobao.com/search?q=${encoded}`,
      ];

      // 一次性打开所有搜索页面
      urls.forEach((url, i) => {
        setTimeout(() => window.open(url, '_blank', 'noopener'), i * 300);
      });

      App.showToast('已打开什么值得买 + 京东 + 淘宝，对照价格回来填入', 'success');

      // 自动弹出添加比价窗口，预填型号
      setTimeout(() => {
        showPasteCompareWithModel(model);
      }, 500);
    });

    // 回车也能触发
    document.getElementById('quick-compare-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-quick-compare').click();
    });

    // 复选框变化 → 更新合计
    document.getElementById('compare-grid').addEventListener('change', (e) => {
      if (e.target.classList.contains('compare-checkbox')) {
        updateCheckedTotal();
      }
    });

    render();
  }

  // ========== 勾选合计 ==========
  function updateCheckedTotal() {
    const checkboxes = document.querySelectorAll('.compare-checkbox:checked');
    let totalMin = 0;
    let totalMax = 0;
    const names = [];
    checkboxes.forEach(cb => {
      const minP = parseFloat(cb.dataset.minPrice) || 0;
      totalMin += minP;
      names.push(cb.closest('.compare-card').querySelector('h3').textContent);
    });

    const bar = document.getElementById('compare-total-bar');
    const countEl = document.getElementById('compare-checked-count');
    const totalEl = document.getElementById('compare-checked-total');
    const detailEl = document.getElementById('compare-checked-detail');

    if (checkboxes.length === 0) {
      bar.style.display = 'none';
    } else {
      bar.style.display = 'block';
      countEl.textContent = checkboxes.length;
      totalEl.textContent = App.formatMoney(totalMin);
      detailEl.textContent = names.length <= 3 ? names.join(' + ') : names.slice(0,3).join(' + ') + ` ...共${names.length}件`;
    }
  }

  return { init, render };
})();
