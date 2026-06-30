/**
 * 购物比价模块 v3
 * 粘贴链接自动搜索，对照填入价格
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
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
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
              const isBest = Number(s.price) === minPrice && minPrice > 0 && prices.length > 1;
              return `
                <div class="compare-row ${isBest ? 'best-price' : ''}">
                  <span class="shop-name">${isBest ? '🏆 ' : ''}${s.name || '商家'+(i+1)}</span>
                  <span class="shop-price">${s.price ? App.formatMoney(s.price) : '-'}</span>
                  ${s.link ? `<a class="shop-link" href="${s.link}" target="_blank" onclick="event.stopPropagation()" title="打开链接">🔗</a>` : ''}
                  ${s.note ? `<span style="font-size:0.72rem;color:var(--text-secondary);">${s.note}</span>` : ''}
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

  // ========== 新增：粘贴链接比价（主要入口） ==========
  function showPasteCompare() {
    App.showModalLg('🛒 粘贴链接比价', `
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">
        📋 <strong>操作步骤：</strong><br>
        ① 去淘宝/京东App复制商品链接<br>
        ② 粘贴到下方输入框<br>
        ③ 点击搜索，在新窗口查看价格<br>
        ④ 回来填入价格和名称保存
      </p>
      <div class="form-group">
        <label>粘贴电商链接</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="cf-paste-link" placeholder="粘贴淘宝/京东/拼多多商品链接..." style="flex:1;">
          <button class="btn btn-primary" id="cf-search-link" style="white-space:nowrap;">🔍 搜索</button>
        </div>
      </div>
      <div class="form-group">
        <label>或粘贴商品标题（含价格更佳）</label>
        <textarea id="cf-paste-text" rows="2" placeholder="从电商App复制商品标题粘贴到这里，如：&#10;海尔冰箱BCD-500 500升 变频 ¥3299"></textarea>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:12px;margin:12px 0;font-size:0.82rem;color:var(--text-secondary);" id="cf-paste-preview">
        💡 粘贴后这里会显示识别结果
      </div>
      <h4 style="margin:14px 0 10px;font-size:0.9rem;">填写比价信息</h4>
      <div class="form-row">
        <div class="form-group"><label>商品名称 *</label><input type="text" id="cf-name" placeholder="如：海尔冰箱BCD-500"></div>
        <div class="form-group"><label>房间</label><select id="cf-room">${ROOMS.map(r => `<option value="${r}">${r}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>平台/商家</label><input type="text" id="cf-shop0" placeholder="京东/淘宝/拼多多"></div>
        <div class="form-group"><label>价格 (元)</label><input type="number" id="cf-price0" step="0.01" min="0" placeholder="0.00"></div>
      </div>
      <div class="form-group"><label>备注</label><input type="text" id="cf-note0" placeholder="包邮/免安装/赠品..."></div>
    `, `
      <button class="btn btn-outline" id="cf-cancel">取消</button>
      <button class="btn btn-primary" id="cf-save">保存比价</button>
    `);

    const linkInput = document.getElementById('cf-paste-link');
    const textInput = document.getElementById('cf-paste-text');
    const preview = document.getElementById('cf-paste-preview');

    // 粘贴链接时自动识别
    function tryParse() {
      const link = linkInput.value.trim();
      const text = textInput.value.trim();
      const combined = [text, link].filter(Boolean).join(' ');

      if (!combined) {
        preview.innerHTML = '💡 粘贴后这里会显示识别结果';
        return;
      }

      const parsed = parseText(combined);

      // 自动填充表单
      if (parsed.name && !document.getElementById('cf-name').value) {
        document.getElementById('cf-name').value = parsed.name;
      }
      if (parsed.shop && !document.getElementById('cf-shop0').value) {
        document.getElementById('cf-shop0').value = parsed.shop;
      }
      if (parsed.price && !document.getElementById('cf-price0').value) {
        document.getElementById('cf-price0').value = parsed.price;
      }

      preview.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div>🔗 链接：${parsed.link ? '<span style="color:var(--success);">已识别</span>' : '<span style="color:#ccc;">未识别</span>'}</div>
          <div>📦 名称：${parsed.name ? '<strong>'+parsed.name+'</strong>' : '<span style="color:#ccc;">未识别，请手动输入</span>'}</div>
          <div>💰 价格：${parsed.price ? '<strong style="color:var(--danger);">¥'+parsed.price+'</strong>' : '<span style="color:#ccc;">未识别</span>'}</div>
          <div>🏪 平台：${parsed.shop ? '<strong>'+parsed.shop+'</strong>' : '<span style="color:#ccc;">未识别</span>'}</div>
        </div>
      `;
    }

    linkInput.addEventListener('input', tryParse);
    textInput.addEventListener('input', tryParse);

    // 搜索按钮
    document.getElementById('cf-search-link').addEventListener('click', () => {
      const link = linkInput.value.trim();
      const name = document.getElementById('cf-name').value.trim();
      const keyword = name || (textInput.value.trim().slice(0, 30));

      if (link && link.startsWith('http')) {
        window.open(link, '_blank', 'noopener');
        App.showToast('已在浏览器打开商品链接，查看价格后回来填入', 'success');
      } else if (keyword) {
        const encoded = encodeURIComponent(keyword);
        const urls = [
          { name:'京东', url:`https://search.jd.com/Search?keyword=${encoded}&enc=utf-8` },
          { name:'淘宝', url:`https://s.taobao.com/search?q=${encoded}` },
        ];
        App.showModal('选择搜索平台', `
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">搜索关键词：<strong>${keyword}</strong></p>
          ${urls.map(u => `<button class="btn btn-outline" style="width:100%;margin-bottom:8px;justify-content:flex-start;" onclick="window.open('${u.url}','_blank','noopener')">🔍 ${u.name} 搜索</button>`).join('')}
        `, `<button class="btn btn-outline" id="cf-sclose">关闭</button>`);
        document.getElementById('cf-sclose').addEventListener('click', App.hideModal);
      } else {
        App.showToast('请先粘贴链接或输入商品名称', 'error');
      }
    });

    // 取消
    document.getElementById('cf-cancel').addEventListener('click', App.hideModalLg);

    // 保存
    document.getElementById('cf-save').addEventListener('click', () => {
      const name = document.getElementById('cf-name').value.trim();
      if (!name) return App.showToast('请输入商品名称', 'error');
      const shop = document.getElementById('cf-shop0').value.trim();
      const price = parseFloat(document.getElementById('cf-price0').value) || null;
      const link = linkInput.value.trim();
      const note = document.getElementById('cf-note0').value.trim();

      const items = getItems();
      items.push({
        id: App.uid(),
        name,
        room: document.getElementById('cf-room').value,
        shops: [{ name: shop || '未指定', price, link, note }],
        ordered: false
      });
      saveItems(items);
      App.hideModalLg();
      App.showToast('比价已保存', 'success');
      render();
    });
  }

  // ========== 解析剪切板/粘贴文本 ==========
  function parseText(text) {
    const result = { name: '', price: null, shop: '', link: '' };

    // 提取链接
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) result.link = urlMatch[1];

    // 提取价格
    const pricePatterns = [
      /¥\s*(\d+\.?\d{0,2})/,
      /￥\s*(\d+\.?\d{0,2})/,
      /(\d+\.?\d{0,2})\s*元/,
      /RMB\s*(\d+\.?\d{0,2})/i,
      /到手价[：:]\s*(\d+\.?\d{0,2})/,
      /价格[：:]\s*(\d+\.?\d{0,2})/,
      /(\d{3,5}\.?\d{0,2})/,
    ];
    for (const p of pricePatterns) {
      const m = text.match(p);
      if (m) { result.price = parseFloat(m[1]); break; }
    }

    // 识别平台
    if (text.includes('京东') || text.includes('jd.com') || (result.link && result.link.includes('jd.com'))) result.shop = '京东';
    else if (text.includes('淘宝') || text.includes('taobao.com') || (result.link && result.link.includes('taobao.com'))) result.shop = '淘宝';
    else if (text.includes('拼多多') || text.includes('yangkeduo') || (result.link && result.link.includes('yangkeduo'))) result.shop = '拼多多';
    else if (text.includes('天猫') || text.includes('tmall.com') || (result.link && result.link.includes('tmall.com'))) result.shop = '天猫';
    else if (text.includes('苏宁') || text.includes('suning.com')) result.shop = '苏宁';
    else if (text.includes('小米') || text.includes('mi.com')) result.shop = '小米商城';

    // 提取商品名称
    let clean = text
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/¥\s*\d+\.?\d{0,2}/g, '')
      .replace(/￥\s*\d+\.?\d{0,2}/g, '')
      .replace(/\d+\.?\d{0,2}\s*元/g, '')
      .replace(/RMB\s*\d+\.?\d{0,2}/gi, '')
      .replace(/价格[：:]\s*\d+\.?\d{0,2}/g, '')
      .replace(/到手价[：:]\s*\d+\.?\d{0,2}/g, '')
      .replace(/【.+?】/g, '')
      .replace(/包邮|免运费|顺丰|正品|旗舰店|自营|官方|授权|专卖|品牌/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const fragments = clean.split(/[，,。\n\r【】]+/).filter(f => f.length > 3);
    if (fragments.length > 0) {
      result.name = fragments.reduce((a, b) => a.length >= b.length ? a : b, '');
      if (result.name.length > 60) result.name = result.name.slice(0, 60);
    } else if (clean.length > 3) {
      result.name = clean.slice(0, 60);
    }

    return result;
  }

  // ========== 编辑已有比价 ==========
  function showEditForm(item) {
    const shops = item.shops && item.shops.length > 0 ? item.shops : [{name:'',price:null,link:'',note:''}];

    App.showModalLg('编辑比价', `
      <div class="form-row">
        <div class="form-group"><label>商品名称 *</label><input type="text" id="cf-ename" value="${item.name||''}"></div>
        <div class="form-group"><label>房间</label><select id="cf-eroom">${ROOMS.map(r => `<option value="${r}" ${item.room===r?'selected':''}>${r}</option>`).join('')}</select></div>
      </div>
      ${shops.map((s, i) => `
        <h4 style="margin:12px 0 8px;font-size:0.85rem;">商家 ${i+1}</h4>
        <div class="form-row">
          <div class="form-group"><label>平台/商家</label><input type="text" id="cf-eshop-${i}" value="${s.name||''}"></div>
          <div class="form-group"><label>价格</label><input type="number" id="cf-eprice-${i}" step="0.01" value="${s.price||''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>链接</label><input type="url" id="cf-elink-${i}" value="${s.link||''}"></div>
          <div class="form-group"><label>备注</label><input type="text" id="cf-enote-${i}" value="${s.note||''}"></div>
        </div>
      `).join('')}
    `, `
      <button class="btn btn-outline" id="cf-ecancel">取消</button>
      <button class="btn btn-primary" id="cf-esave">保存修改</button>
    `);

    document.getElementById('cf-ecancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cf-esave').addEventListener('click', () => {
      const name = document.getElementById('cf-ename').value.trim();
      if (!name) return App.showToast('请输入商品名称', 'error');
      const newShops = shops.map((_, i) => ({
        name: document.getElementById(`cf-eshop-${i}`).value.trim(),
        price: parseFloat(document.getElementById(`cf-eprice-${i}`).value) || null,
        link: document.getElementById(`cf-elink-${i}`).value.trim(),
        note: document.getElementById(`cf-enote-${i}`).value.trim(),
      })).filter(s => s.name || s.price);

      const items = getItems();
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], name, room: document.getElementById('cf-eroom').value, shops: newShops };
      }
      saveItems(items);
      App.hideModalLg();
      App.showToast('已更新', 'success');
      render();
    });
  }

  // ========== 从家具导入 ==========
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

    App.showModalLg('从家电家具导入', rows, `
      <button class="btn btn-outline" id="cf-icancel">取消</button>
      <button class="btn btn-primary" id="cf-isave">导入选中</button>
    `);
    document.getElementById('cf-icancel').addEventListener('click', App.hideModalLg);
    document.getElementById('cf-isave').addEventListener('click', () => {
      const items = getItems();
      candidates.forEach(f => {
        if (document.getElementById(`cf-import-${f.id}`).checked) {
          items.push({ id: App.uid(), name: f.name, room: f.room, shops: [{name:'',price:f.price||null,link:f.link||'',note:''}], ordered: false });
        }
      });
      saveItems(items);
      App.hideModalLg();
      App.showToast('已导入', 'success');
      render();
    });
  }

  async function markOrdered(id) {
    const items = getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { items[idx].ordered = true; saveItems(items); App.showToast('已标记为下单', 'success'); render(); }
  }

  async function deleteItem(id) {
    const ok = await App.showConfirm('确定删除这条比价记录吗？');
    if (!ok) return;
    saveItems(getItems().filter(i => i.id !== id));
    App.showToast('已删除', 'success'); render();
  }

  function init() {
    // 主按钮改为粘贴比价
    document.getElementById('btn-add-compare').addEventListener('click', showPasteCompare);
    document.getElementById('btn-compare-from-furniture').addEventListener('click', importFromFurniture);
    document.getElementById('compare-room-filter').addEventListener('change', render);
    document.getElementById('compare-status-filter').addEventListener('change', render);
    document.getElementById('compare-search').addEventListener('input', render);

    // 快速粘贴按钮同样打开粘贴比价
    document.getElementById('btn-quick-paste-compare').addEventListener('click', showPasteCompare);

    document.getElementById('compare-grid').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action, id = btn.dataset.id;
      if (action === 'edit-compare') { const item = getItems().find(i => i.id === id); if (item) showEditForm(item); }
      else if (action === 'order-compare') markOrdered(id);
      else if (action === 'delete-compare') deleteItem(id);
    });

    render();
  }
  return { init, render };
})();
