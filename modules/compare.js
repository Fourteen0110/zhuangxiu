/**
 * 购物比价模块
 * 多家商家比价、最低价标注、下单标记、差价计算
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

    // 初始化房间下拉
    const roomSel = document.getElementById('compare-room-filter');
    if (roomSel && roomSel.options.length <= 1) {
      roomSel.innerHTML = '<option value="all">全部房间</option>' + ROOMS.map(r => `<option value="${r}">${r}</option>`).join('');
    }

    renderGrid(items);
  }

  function renderGrid(items) {
    const grid = document.getElementById('compare-grid');
    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">暂无比价记录，点击"添加比价"或"从家电家具导入"开始</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      // 找最低价
      const shops = item.shops || [];
      const prices = shops.map(s => Number(s.price)).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const saving = maxPrice > minPrice ? maxPrice - minPrice : 0;

      return `
        <div class="compare-card">
          <div class="compare-card-header">
            <h3>${item.name}</h3>
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:0.78rem;color:var(--text-secondary);">${item.room||''}</span>
              ${item.ordered ? '<span class="badge badge-ordered">已下单</span>' : '<span class="badge badge-pending">比价中</span>'}
            </div>
          </div>
          <div class="compare-card-body">
            ${shops.map((s, i) => {
              const isBest = Number(s.price) === minPrice && minPrice > 0;
              return `
                <div class="compare-row ${isBest ? 'best-price' : ''}">
                  <span class="shop-name">${isBest ? '🏆 ' : ''}${s.name || '商家'+(i+1)}</span>
                  <span class="shop-price">${s.price ? App.formatMoney(s.price) : '-'}</span>
                  ${s.link ? `<a class="shop-link" href="${s.link}" target="_blank" onclick="event.stopPropagation()" title="打开链接">🔗</a>` : ''}
                  ${s.note ? `<span style="font-size:0.72rem;color:var(--text-secondary);">${s.note}</span>` : ''}
                  <button class="btn btn-xs" style="background:#fff3e0;color:#e65100;padding:2px 8px;font-size:0.7rem;" data-action="search-price" data-name="${item.name}" data-shop-idx="${i}" data-shop-name="${(s.name||'').replace(/"/g,'&quot;')}" title="搜索此商品价格">🔍</button>
                </div>
              `;
            }).join('')}
            ${saving > 0 ? `<div style="margin-top:8px;font-size:0.8rem;text-align:center;"><span class="saving-badge">💰 最高最低差价 ${App.formatMoney(saving)}</span></div>` : ''}
          </div>
          <div class="compare-card-footer">
            <button class="btn btn-xs btn-edit" data-action="edit-compare" data-id="${item.id}">编辑</button>
            ${!item.ordered ? `<button class="btn btn-xs btn-success" data-action="order-compare" data-id="${item.id}">标记已下单</button>` : ''}
            <button class="btn btn-xs btn-del" data-action="delete-compare" data-id="${item.id}">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function showForm(item = null, prefill = null) {
    const isEdit = !!item;
    const shops = item?.shops || [{name:'',price:'',link:'',note:''},{name:'',price:'',link:'',note:''},{name:'',price:'',link:'',note:''}];

    // 预填数据（来自粘贴识别）
    if (prefill && !isEdit) {
      if (prefill.name) shops[0].name = prefill.name;
      if (prefill.price) shops[0].price = prefill.price;
      if (prefill.link) shops[0].link = prefill.link;
      if (prefill.shop) shops[0].name = prefill.shop;
    }

    let shopsHTML = shops.map((s, i) => `
      <div class="form-row" style="margin-bottom:10px;">
        <div class="form-group"><label>商家${i+1}名称</label><div style="display:flex;gap:6px;"><input type="text" id="cf-shop-name-${i}" value="${s.name||''}" placeholder="淘宝/京东/线下店" style="flex:1;"><button type="button" class="btn btn-xs" style="background:#fff3e0;color:#e65100;white-space:nowrap;" data-action="search-from-form" data-idx="${i}">🔍 搜价</button><button type="button" class="btn btn-xs" style="background:#e8f5e9;color:#2e7d32;white-space:nowrap;" data-action="paste-to-shop" data-idx="${i}">📋 粘贴</button></div></div>
        <div class="form-group"><label>价格</label><input type="number" id="cf-shop-price-${i}" step="0.01" min="0" value="${s.price||''}" placeholder="0.00"></div>
      </div>
      <div class="form-row" style="margin-bottom:10px;">
        <div class="form-group"><label>链接</label><input type="url" id="cf-shop-link-${i}" value="${s.link||''}" placeholder="https://..."></div>
        <div class="form-group"><label>备注</label><input type="text" id="cf-shop-note-${i}" value="${s.note||''}" placeholder="包安装/免运费..."></div>
      </div>
    `).join('');

    App.showModalLg(isEdit?'编辑比价':'添加比价', `
      <div class="paste-banner" id="paste-banner" style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;cursor:pointer;" title="点击粘贴从电商复制的商品信息">
        <span style="font-size:1.3rem;">📋</span>
        <span style="flex:1;font-size:0.85rem;font-weight:600;color:#2e7d32;">从电商App复制商品后，点击此处自动识别填充</span>
        <span style="font-size:0.75rem;color:#666;">点击粘贴 →</span>
      </div>
      <div class="form-row">
        <div class="form-group"><label>物品名称 *</label><input type="text" id="cf-name" value="${prefill?.name || item?.name || ''}" placeholder="如：双人沙发"></div>
        <div class="form-group"><label>房间</label><select id="cf-room">${ROOMS.map(r => `<option value="${r}" ${item?.room===r?'selected':''}>${r}</option>`).join('')}</select></div>
      </div>
      <h4 style="margin:14px 0 10px;font-size:0.9rem;">商家比价</h4>
      ${shopsHTML}
    `, `
      <button class="btn btn-outline" id="cf-cancel">取消</button>
      <button class="btn btn-primary" id="cf-save">${isEdit?'保存修改':'添加比价'}</button>
    `);

    document.getElementById('cf-cancel').addEventListener('click', App.hideModalLg);

    // ========== 智能粘贴：识别整条商品信息 ==========
    document.getElementById('paste-banner').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text || text.length < 3) return App.showToast('剪切板内容太短，请先从电商App复制商品信息', 'error');
        const parsed = parseClipboard(text);
        if (!parsed.name && !parsed.price) return App.showToast('未识别到商品信息，请复制包含名称和价格的文本', 'error');

        // 填充名称
        if (parsed.name && !document.getElementById('cf-name').value) {
          document.getElementById('cf-name').value = parsed.name;
        }
        // 填充到第一个空商家位
        for (let i = 0; i < 3; i++) {
          const nameEl = document.getElementById(`cf-shop-name-${i}`);
          const priceEl = document.getElementById(`cf-shop-price-${i}`);
          const linkEl = document.getElementById(`cf-shop-link-${i}`);
          if (!nameEl || !priceEl) continue;
          // 找空位或已有同名商家
          if (!nameEl.value || nameEl.value === parsed.shop) {
            if (!nameEl.value && parsed.shop) nameEl.value = parsed.shop;
            if (!priceEl.value && parsed.price) priceEl.value = parsed.price;
            if (!linkEl.value && parsed.link) linkEl.value = parsed.link;
            break;
          }
        }

        const parts = [];
        if (parsed.name) parts.push(`名称: ${parsed.name}`);
        if (parsed.price) parts.push(`价格: ¥${parsed.price}`);
        if (parsed.shop) parts.push(`平台: ${parsed.shop}`);
        if (parsed.link) parts.push(`链接: ✓`);
        App.showToast(`已识别: ${parts.join(' | ')}`, 'success');
      } catch (err) {
        App.showToast('无法读取剪切板，请手动粘贴或检查浏览器权限', 'error');
      }
    });

    // 单个商家粘贴按钮
    document.getElementById('modal-lg-body').addEventListener('click', async (e) => {
      const pasteBtn = e.target.closest('[data-action="paste-to-shop"]');
      if (pasteBtn) {
        e.preventDefault();
        const idx = parseInt(pasteBtn.dataset.idx);
        try {
          const text = await navigator.clipboard.readText();
          if (!text || text.length < 3) return App.showToast('剪切板内容太短', 'error');
          const parsed = parseClipboard(text);
          if (!parsed.price && !parsed.name) return App.showToast('未识别到价格或名称', 'error');
          if (parsed.name) document.getElementById(`cf-shop-name-${idx}`).value = parsed.name;
          if (parsed.price) document.getElementById(`cf-shop-price-${idx}`).value = parsed.price;
          if (parsed.link) document.getElementById(`cf-shop-link-${idx}`).value = parsed.link;
          if (parsed.shop && !document.getElementById(`cf-shop-name-${idx}`).value) {
            document.getElementById(`cf-shop-name-${idx}`).value = parsed.shop;
          }
          App.showToast(`已粘贴: ${parsed.price ? '¥'+parsed.price : ''} ${parsed.name||''}`, 'success');
        } catch (err) {
          App.showToast('无法读取剪切板，请检查浏览器权限', 'error');
        }
      }
    });

    // 表单中搜价按钮
    document.getElementById('modal-lg-body').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="search-from-form"]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx);
      const itemName = document.getElementById('cf-name').value.trim();
      const shopName = document.getElementById(`cf-shop-name-${idx}`).value.trim();
      if (!itemName) return App.showToast('请先输入物品名称', 'error');
      searchPriceOnline(itemName, shopName);
    });

    document.getElementById('cf-save').addEventListener('click', () => {
      const name = document.getElementById('cf-name').value.trim();
      if (!name) return App.showToast('请输入物品名称', 'error');
      const room = document.getElementById('cf-room').value;
      const newShops = [0,1,2].map(i => ({
        name: document.getElementById(`cf-shop-name-${i}`).value.trim(),
        price: parseFloat(document.getElementById(`cf-shop-price-${i}`).value) || null,
        link: document.getElementById(`cf-shop-link-${i}`).value.trim(),
        note: document.getElementById(`cf-shop-note-${i}`).value.trim(),
      })).filter(s => s.name || s.price);

      const items = getItems();
      const entry = { id: item?.id || App.uid(), name, room, shops: newShops, ordered: item?.ordered || false };
      if (isEdit) {
        const idx = items.findIndex(i => i.id === item.id);
        if (idx >= 0) items[idx] = entry;
      } else { items.push(entry); }
      saveItems(items);
      App.hideModalLg();
      App.showToast(isEdit?'比价已更新':'比价已添加', 'success');
      render();
    });
  }

  function importFromFurniture() {
    const furniture = App.getStore('furniture') || [];
    const compares = getItems();
    const existingNames = new Set(compares.map(c => c.name));
    const candidates = furniture.filter(f => !existingNames.has(f.name) && (f.status === '待购' || !f.status));
    if (candidates.length === 0) return App.showToast('没有可导入的物品，所有物品已存在比价或已购买', 'error');

    let rows = candidates.map(f => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
        <input type="checkbox" id="cf-import-${f.id}" checked>
        <label for="cf-import-${f.id}" style="flex:1;font-size:0.85rem;">${f.name} <span style="color:var(--text-secondary);">(${f.room})</span></label>
      </div>
    `).join('');

    App.showModalLg('从家电家具导入', rows, `
      <button class="btn btn-outline" id="cf-icancel">取消</button>
      <button class="btn btn-primary" id="cf-isave">导入选中</button>
    `);
    document.getElementById('cf-icancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cf-isave').addEventListener('click', () => {
      const items = getItems();
      candidates.forEach(f => {
        if (document.getElementById(`cf-import-${f.id}`).checked) {
          items.push({ id: App.uid(), name: f.name, room: f.room, shops: [{name:'',price:f.price,link:f.link||'',note:''}], ordered: false });
        }
      });
      saveItems(items);
      App.hideModalLg();
      App.showToast(`已导入`, 'success');
      render();
    });
  }

  async function markOrdered(id) {
    const items = getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { items[idx].ordered = true; saveItems(items); App.showToast('已标记为下单', 'success'); render(); }
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定要删除这条比价记录吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success'); render();
  }

  // ========== 剪切板智能解析 ==========
  function parseClipboard(text) {
    const result = { name: '', price: null, shop: '', link: '' };

    // 1. 提取价格：¥2999 / 2999元 / 2999.00 / RMB2999
    const pricePatterns = [
      /¥\s*(\d+\.?\d{0,2})/,
      /￥\s*(\d+\.?\d{0,2})/,
      /(\d+\.?\d{0,2})\s*元/,
      /RMB\s*(\d+\.?\d{0,2})/i,
      /价格[：:]\s*(\d+\.?\d{0,2})/,
    ];
    for (const p of pricePatterns) {
      const m = text.match(p);
      if (m) { result.price = parseFloat(m[1]); break; }
    }

    // 2. 提取链接
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) result.link = urlMatch[1];

    // 3. 识别平台
    if (text.includes('京东') || text.includes('jd.com') || (result.link && result.link.includes('jd.com'))) result.shop = '京东';
    else if (text.includes('淘宝') || text.includes('taobao.com') || (result.link && result.link.includes('taobao.com'))) result.shop = '淘宝';
    else if (text.includes('拼多多') || text.includes('pinduoduo') || (result.link && result.link.includes('yangkeduo'))) result.shop = '拼多多';
    else if (text.includes('天猫') || text.includes('tmall.com') || (result.link && result.link.includes('tmall.com'))) result.shop = '天猫';
    else if (text.includes('苏宁') || text.includes('suning.com')) result.shop = '苏宁';
    else if (text.includes('小米') || text.includes('mi.com')) result.shop = '小米商城';

    // 4. 提取商品名称：去掉价格、链接、常见噪音后的最长的有意义文本
    let nameText = text
      .replace(/https?:\/\/[^\s]+/g, '')  // 去链接
      .replace(/¥\s*\d+\.?\d{0,2}/g, '')  // 去价格
      .replace(/￥\s*\d+\.?\d{0,2}/g, '')
      .replace(/\d+\.?\d{0,2}\s*元/g, '')
      .replace(/RMB\s*\d+\.?\d{0,2}/gi, '')
      .replace(/价格[：:]\s*\d+\.?\d{0,2}/g, '')
      .replace(/【.+?】/g, '')  // 去【】
      .replace(/包邮|免运费|顺丰|正品|旗舰店|自营|官方|授权|专卖/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 取最长的片段作为名称（去掉明显不是名称的短片段）
    const fragments = nameText.split(/[，,。\n\r]+/).filter(f => f.length > 3);
    if (fragments.length > 0) {
      result.name = fragments.reduce((a, b) => a.length >= b.length ? a : b, '');
      // 截断过长的名称
      if (result.name.length > 60) result.name = result.name.slice(0, 60);
    } else if (nameText.length > 3) {
      result.name = nameText.slice(0, 60);
    }

    return result;
  }

  // ========== 联网搜索比价 ==========
  function searchPriceOnline(itemName, shopName) {
    const keyword = encodeURIComponent(itemName);
    const platforms = [
      { name: '京东', icon: '🐶', color: '#e74c3c', url: `https://search.jd.com/Search?keyword=${keyword}&enc=utf-8` },
      { name: '淘宝', icon: '🛒', color: '#f39c12', url: `https://s.taobao.com/search?q=${keyword}` },
      { name: '拼多多', icon: '📱', color: '#e74c3c', url: `https://mobile.yangkeduo.com/search_result.html?search_key=${keyword}` },
      { name: '什么值得买', icon: '💎', color: '#e74c3c', url: `https://search.smzdm.com/?c=home&s=${keyword}` },
    ];

    App.showModal(`🔍 搜索比价：${itemName}`, `
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:14px;">选择一个平台，将在新窗口打开搜索结果。复制价格后回到此页面手动填入。</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${platforms.map(p => `
          <button class="btn btn-outline search-platform-btn" data-url="${p.url}" style="justify-content:flex-start;padding:12px 16px;">
            <span style="font-size:1.2rem;">${p.icon}</span>
            <span>${p.name}</span>
            <span style="margin-left:auto;font-size:0.7rem;color:var(--text-secondary);">搜索「${itemName.slice(0,8)}${itemName.length>8?'…':''}」</span>
          </button>
        `).join('')}
      </div>
      ${shopName ? `<p style="margin-top:12px;font-size:0.8rem;color:var(--text-secondary);">💡 当前商家：<strong>${shopName}</strong> — 可在对应平台搜索后比对价格</p>` : ''}
    `, `
      <button class="btn btn-outline" id="search-cancel">关闭</button>
    `);

    document.getElementById('search-cancel').addEventListener('click', App.hideModal);
    document.querySelectorAll('.search-platform-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.open(btn.dataset.url, '_blank', 'noopener');
      });
    });
  }

  function init() {
    document.getElementById('btn-add-compare').addEventListener('click', () => showForm());
    document.getElementById('btn-compare-from-furniture').addEventListener('click', importFromFurniture);
    document.getElementById('compare-room-filter').addEventListener('change', render);
    document.getElementById('compare-status-filter').addEventListener('change', render);
    document.getElementById('compare-search').addEventListener('input', render);

    // 快速粘贴识别按钮
    document.getElementById('btn-quick-paste-compare').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text || text.length < 3) return App.showToast('剪切板内容太短，请先从电商App复制商品信息', 'error');
        const parsed = parseClipboard(text);
        if (!parsed.name && !parsed.price) return App.showToast('未识别到商品信息，请复制包含名称和价格的文本', 'error');
        // 打开添加表单并预填
        showForm(null, parsed);
      } catch (err) {
        App.showToast('无法读取剪切板，请检查浏览器权限后重试', 'error');
      }
    });

    document.getElementById('compare-grid').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-compare') { const item = getItems().find(i => i.id === id); if (item) showForm(item); }
      else if (action === 'order-compare') markOrdered(id);
      else if (action === 'delete-compare') deleteItem(id);
      else if (action === 'search-price') {
        searchPriceOnline(btn.dataset.name, btn.dataset.shopName);
      }
    });

    render();
  }
  return { init, render };
})();
