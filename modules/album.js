/**
 * 装修相册模块
 * 按房间上传照片、前后对比、base64存储、Lightbox查看
 */
const AlbumModule = (() => {
  const STORE_KEY = 'photos';
  const ROOMS = ['客厅','餐厅','主卧','次卧','儿童房','厨房','主卫','次卫','阳台','书房','玄关','储物间','其他'];
  const TYPES = ['before','during','after'];
  const TYPE_LABELS = { before: '施工前', during: '施工中', after: '完工后' };

  function getPhotos() { return App.getStore(STORE_KEY) || []; }
  function savePhotos(d) { App.setStore(STORE_KEY, d); }

  function render() {
    let photos = getPhotos();
    const room = document.getElementById('album-room-filter')?.value || 'all';
    const type = document.getElementById('album-type-filter')?.value || 'all';
    if (room !== 'all') photos = photos.filter(p => p.room === room);
    if (type !== 'all') photos = photos.filter(p => p.type === type);
    photos.sort((a, b) => (b.date||'').localeCompare(a.date||''));

    // 初始化房间下拉
    const roomSel = document.getElementById('album-room-filter');
    if (roomSel && roomSel.options.length <= 1) {
      roomSel.innerHTML = '<option value="all">全部房间</option>' + ROOMS.map(r => `<option value="${r}">${r}</option>`).join('');
    }

    const grid = document.getElementById('album-grid');
    if (photos.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">暂无照片，点击"上传照片"开始记录装修过程</div>`;
      return;
    }

    grid.innerHTML = photos.map(p => `
      <div class="album-card" data-action="view-photo" data-id="${p.id}">
        <img src="${p.data}" alt="${p.room} - ${TYPE_LABELS[p.type]||p.type}" loading="lazy">
        <div class="album-card-info">
          <span>${p.room}</span>
          <span class="album-card-tag ${p.type}">${TYPE_LABELS[p.type]||p.type}</span>
          <span style="font-size:0.75rem;color:var(--text-secondary);">${App.formatDate(p.date)}</span>
        </div>
      </div>
    `).join('');
  }

  async function addPhoto() {
    App.showModalLg('上传照片', `
      <div class="form-row">
        <div class="form-group"><label>房间</label><select id="ap-room">${ROOMS.map(r => `<option value="${r}">${r}</option>`).join('')}</select></div>
        <div class="form-group"><label>照片类型</label><select id="ap-type">${TYPES.map(t => `<option value="${t}">${TYPE_LABELS[t]}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>日期</label><input type="date" id="ap-date" value="${App.todayStr()}"></div>
      <div class="form-group"><label>选择照片 *</label><input type="file" id="ap-file" accept="image/*" multiple></div>
      <div class="form-group"><label>备注</label><input type="text" id="ap-note" placeholder="描述这张照片..."></div>
      <div id="ap-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>
    `, `
      <button class="btn btn-outline" id="ap-cancel">取消</button>
      <button class="btn btn-primary" id="ap-save">上传</button>
    `);

    // 预览
    document.getElementById('ap-file').addEventListener('change', (e) => {
      const preview = document.getElementById('ap-preview');
      preview.innerHTML = '';
      Array.from(e.target.files).forEach(f => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.innerHTML += `<img src="${ev.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;">`;
        };
        reader.readAsDataURL(f);
      });
    });

    document.getElementById('ap-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('ap-save').addEventListener('click', async () => {
      const files = document.getElementById('ap-file').files;
      if (files.length === 0) return App.showToast('请选择照片', 'error');
      const room = document.getElementById('ap-room').value;
      const type = document.getElementById('ap-type').value;
      const date = document.getElementById('ap-date').value;
      const note = document.getElementById('ap-note').value.trim();

      const photos = getPhotos();
      for (const file of files) {
        try {
          const data = await App.compressImage(file, 800, 0.6);
          photos.push({ id: App.uid(), room, type, date, note, data });
        } catch { App.showToast('部分照片处理失败', 'error'); }
      }
      savePhotos(photos);
      App.hideModalLg();
      App.showToast(`已上传 ${files.length} 张照片`, 'success');
      render();
    });
  }

  async function deletePhoto(id) {
    const ok = await App.showConfirm('确定要删除这张照片吗？');
    if (!ok) return;
    savePhotos(getPhotos().filter(p => p.id !== id));
    App.showToast('照片已删除', 'success');
    render();
  }

  function viewPhoto(id) {
    const photo = getPhotos().find(p => p.id === id);
    if (!photo) return;
    document.getElementById('lightbox-img').src = photo.data;
    document.getElementById('lightbox-info').innerHTML = `
      <strong>${photo.room}</strong> · ${TYPE_LABELS[photo.type]||photo.type} · ${App.formatDate(photo.date)}
      ${photo.note ? '<br>'+photo.note : ''}
      <br><button class="btn btn-xs btn-del" style="margin-top:8px;" id="lb-delete" data-id="${photo.id}">删除此照片</button>
    `;
    document.getElementById('lightbox').classList.add('show');
    document.getElementById('lb-delete').addEventListener('click', () => {
      document.getElementById('lightbox').classList.remove('show');
      deletePhoto(id);
    });
  }

  function init() {
    document.getElementById('btn-add-photo').addEventListener('click', addPhoto);
    document.getElementById('album-room-filter').addEventListener('change', render);
    document.getElementById('album-type-filter').addEventListener('change', render);

    document.getElementById('album-grid').addEventListener('click', e => {
      const card = e.target.closest('.album-card');
      if (!card) return;
      viewPhoto(card.dataset.id);
    });

    render();
  }
  return { init, render };
})();
