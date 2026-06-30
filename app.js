/**
 * 家庭装修记录 - 主应用逻辑 v2
 * Tab切换、更多菜单、localStorage封装、图片工具、弹窗/Toast
 */
const App = (() => {
  const STORAGE_KEY = 'reno_';

  // ========== Storage ==========
  function getStore(key) {
    try { const raw = localStorage.getItem(STORAGE_KEY + key); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  function setStore(key, data) {
    try { localStorage.setItem(STORAGE_KEY + key, JSON.stringify(data)); } catch(e) {
      showToast('存储空间不足，请清理旧照片或数据', 'error');
    }
  }
  function getStorageUsed() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_KEY)) total += localStorage.getItem(key).length;
    }
    return total;
  }

  // ========== Tab 切换 ==========
  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn:not(.more-item)').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.more-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // 高亮对应按钮
    const mainBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]:not(.more-item)`);
    const moreBtn = document.querySelector(`.more-item[data-tab="${tabName}"]`);
    if (mainBtn) mainBtn.classList.add('active');
    if (moreBtn) moreBtn.classList.add('active');
    // 如果在更多菜单里，也高亮更多触发按钮
    if (moreBtn && !mainBtn) {
      document.getElementById('more-trigger').classList.add('active');
    }

    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');

    // 关闭更多菜单
    document.getElementById('more-dropdown').classList.remove('show');

    // 刷新对应模块
    const renderMap = {
      dashboard: () => DashboardModule.render(),
      bill: () => BillModule.render(),
      compare: () => CompareModule.render(),
      furniture: () => FurnitureModule.render(),
      checklist: () => ChecklistModule.render(),
      album: () => AlbumModule.render(),
      timeline: () => TimelineModule.render(),
      vendor: () => VendorModule.render(),
      contract: () => ContractModule.render(),
      outlet: () => OutletModule.render(),
      colorplan: () => ColorplanModule.render(),
      material: () => MaterialModule.render(),
      preinstall: () => PreinstallModule.render(),
    };
    if (renderMap[tabName]) renderMap[tabName]();
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn:not(.more-item)').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll('.more-item').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 更多菜单
    const trigger = document.getElementById('more-trigger');
    const dropdown = document.getElementById('more-dropdown');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }

  // ========== Modal ==========
  function showModal(title, bodyHTML, footerHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-footer').innerHTML = footerHTML;
    document.getElementById('modal-overlay').classList.add('show');
  }
  function hideModal() { document.getElementById('modal-overlay').classList.remove('show'); }

  // 大弹窗
  function showModalLg(title, bodyHTML, footerHTML) {
    document.getElementById('modal-lg-title').textContent = title;
    document.getElementById('modal-lg-body').innerHTML = bodyHTML;
    document.getElementById('modal-lg-footer').innerHTML = footerHTML;
    document.getElementById('modal-lg-overlay').classList.add('show');
  }
  function hideModalLg() { document.getElementById('modal-lg-overlay').classList.remove('show'); }

  // Confirm
  function showConfirm(message) {
    return new Promise((resolve) => {
      document.getElementById('confirm-message').textContent = message;
      document.getElementById('confirm-overlay').classList.add('show');
      const cleanup = () => {
        document.getElementById('confirm-overlay').classList.remove('show');
        document.getElementById('confirm-ok').removeEventListener('click', onOk);
        document.getElementById('confirm-cancel').removeEventListener('click', onCancel);
      };
      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      document.getElementById('confirm-ok').addEventListener('click', onOk);
      document.getElementById('confirm-cancel').addEventListener('click', onCancel);
    });
  }

  // ========== Toast ==========
  let toastTimer;
  function showToast(message, type = '') {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = 'toast ' + type + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }

  // ========== Format ==========
  function formatMoney(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return '¥' + Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ========== 图片压缩 ==========
  function compressImage(file, maxW = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxW) { h = h * maxW / w; w = maxW; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ========== CSV 导出 ==========
  function exportCSV(filename, headers, rows) {
    const BOM = '\uFEFF';
    const csv = BOM + headers.join(',') + '\n' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ========== Init ==========
  function init() {
    initTabs();
    document.getElementById('modal-close').addEventListener('click', hideModal);
    document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) hideModal(); });
    document.getElementById('modal-lg-close').addEventListener('click', hideModalLg);
    document.getElementById('modal-lg-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) hideModalLg(); });
    document.getElementById('confirm-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) document.getElementById('confirm-overlay').classList.remove('show');
    });
    // Lightbox
    document.getElementById('lightbox-close').addEventListener('click', () => document.getElementById('lightbox').classList.remove('show'));
    document.getElementById('lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('show'); });

    // 初始化所有模块（延迟到下一帧，确保 DOM 稳定）
    const modules = [DashboardModule, BillModule, CompareModule, FurnitureModule, ChecklistModule, AlbumModule, TimelineModule, VendorModule, ContractModule, OutletModule, ColorplanModule, MaterialModule, PreinstallModule];
    modules.forEach(m => m && m.init && m.init());

    // 延迟渲染首页，确保所有模块 init 完成
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        DashboardModule.render();
      });
    });
  }

  return {
    getStore, setStore, getStorageUsed,
    switchTab, showModal, hideModal, showModalLg, hideModalLg,
    showConfirm, showToast,
    formatMoney, formatDate, todayStr, uid,
    compressImage, exportCSV,
    init
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
