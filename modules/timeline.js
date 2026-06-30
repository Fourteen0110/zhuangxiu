/**
 * 装修进度时间线模块
 * 甘特图 + 阶段管理、延期提醒
 */
const TimelineModule = (() => {
  const STORE_KEY = 'phases';
  const DEFAULT_PHASES = [
    { id: 'ph-1', name: '🔨 拆除与结构改造', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '' },
    { id: 'ph-2', name: '🔌 水电改造', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '含强弱电、给排水' },
    { id: 'ph-3', name: '🧱 泥瓦工程', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '防水、贴砖、找平' },
    { id: 'ph-4', name: '🪵 木工工程', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '吊顶、柜体、背景墙' },
    { id: 'ph-5', name: '🎨 油漆工程', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '腻子、底漆、面漆' },
    { id: 'ph-6', name: '🪟 安装工程', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '门、地板、橱柜、卫浴、灯具' },
    { id: 'ph-7', name: '🛋️ 软装进场', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '家具、窗帘、家电' },
    { id: 'ph-8', name: '🎉 竣工验收', planStart: '', planEnd: '', actualStart: '', actualEnd: '', person: '', note: '保洁、验收、整改' },
  ];

  function getPhases() {
    let data = App.getStore(STORE_KEY);
    if (!data || !Array.isArray(data) || data.length === 0) {
      data = JSON.parse(JSON.stringify(DEFAULT_PHASES));
      App.setStore(STORE_KEY, data);
    }
    return data;
  }
  function savePhases(d) { App.setStore(STORE_KEY, d); }

  function render() {
    const phases = getPhases();
    renderGantt(phases);
    renderList(phases);
  }

  function getPhaseStatus(p) {
    const today = App.todayStr();
    if (p.actualEnd) return 'done';
    if (p.actualStart && !p.actualEnd) return 'ongoing';
    if (p.planEnd && p.planEnd < today && !p.actualStart) return 'delayed';
    return 'pending';
  }

  function renderGantt(phases) {
    const canvas = document.getElementById('gantt-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 计算日期范围
    const allDates = [];
    phases.forEach(p => {
      if (p.planStart) allDates.push(p.planStart);
      if (p.planEnd) allDates.push(p.planEnd);
      if (p.actualStart) allDates.push(p.actualStart);
      if (p.actualEnd) allDates.push(p.actualEnd);
    });
    if (allDates.length === 0) {
      ctx.fillStyle = '#999'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('请先设置各阶段的计划日期', W/2, H/2);
      return;
    }

    let minDate = new Date(Math.min(...allDates.map(d => new Date(d))));
    let maxDate = new Date(Math.max(...allDates.map(d => new Date(d))));
    minDate.setDate(1); // 月初
    maxDate.setMonth(maxDate.getMonth() + 1); maxDate.setDate(0);
    const days = Math.ceil((maxDate - minDate) / (1000*60*60*24));

    const pad = { top: 10, right: 20, bottom: 20, left: 130 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barH = Math.min(24, (chartH / phases.length) - 6);
    const rowH = chartH / phases.length;

    // 今天线
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
      const tx = pad.left + ((today - minDate) / (1000*60*60*24)) / days * chartW;
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(tx, pad.top); ctx.lineTo(tx, pad.top + chartH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('今天', tx + 4, pad.top + 12);
    }

    phases.forEach((p, i) => {
      const y = pad.top + rowH * i + rowH/2 - barH/2;

      // 计划条
      if (p.planStart && p.planEnd) {
        const x1 = pad.left + ((new Date(p.planStart) - minDate) / (1000*60*60*24)) / days * chartW;
        const x2 = pad.left + ((new Date(p.planEnd) - minDate) / (1000*60*60*24)) / days * chartW;
        ctx.fillStyle = '#d5d8dc';
        ctx.fillRect(x1, y, x2 - x1, barH);
      }

      // 实际条
      if (p.actualStart) {
        const x1 = pad.left + ((new Date(p.actualStart) - minDate) / (1000*60*60*24)) / days * chartW;
        const x2 = p.actualEnd
          ? pad.left + ((new Date(p.actualEnd) - minDate) / (1000*60*60*24)) / days * chartW
          : pad.left + ((today - minDate) / (1000*60*60*24)) / days * chartW;
        const status = getPhaseStatus(p);
        ctx.fillStyle = status === 'done' ? '#27ae60' : status === 'ongoing' ? '#4f6ef7' : '#f39c12';
        ctx.fillRect(x1, y + 3, x2 - x1, barH - 6);
      }

      // 名称
      ctx.fillStyle = '#333'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(p.name, pad.left - 8, y + barH/2 + 4);
    });
  }

  function renderList(phases) {
    const list = document.getElementById('timeline-list');
    list.innerHTML = phases.map(p => {
      const status = getPhaseStatus(p);
      const cls = status === 'delayed' ? 'delayed' : status === 'done' ? 'done' : status === 'ongoing' ? 'ongoing' : '';
      const isLate = status === 'delayed';
      return `
        <div class="timeline-item ${cls}">
          <div>
            <div class="timeline-phase-name">${p.name}</div>
            ${p.person ? `<div style="font-size:0.8rem;color:var(--text-secondary);">👤 ${p.person}</div>` : ''}
          </div>
          <div class="timeline-dates">
            <div>📅 计划：${p.planStart||'?'} → ${p.planEnd||'?'}</div>
            <div class="${isLate?'late':''}">✅ 实际：${p.actualStart||'?'} → ${p.actualEnd||'?'}</div>
            ${p.note ? `<div style="font-size:0.78rem;color:var(--text-secondary);">${p.note}</div>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-xs btn-edit" data-action="edit-phase" data-id="${p.id}">编辑</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function showForm(phase = null) {
    const isEdit = !!phase;
    App.showModalLg(isEdit?'编辑阶段':'添加阶段', `
      <div class="form-group"><label>阶段名称</label><input type="text" id="tp-name" value="${phase?.name||''}" placeholder="如：水电改造"></div>
      <div class="form-row">
        <div class="form-group"><label>计划开始</label><input type="date" id="tp-ps" value="${phase?.planStart||''}"></div>
        <div class="form-group"><label>计划结束</label><input type="date" id="tp-pe" value="${phase?.planEnd||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>实际开始</label><input type="date" id="tp-as" value="${phase?.actualStart||''}"></div>
        <div class="form-group"><label>实际结束</label><input type="date" id="tp-ae" value="${phase?.actualEnd||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>负责人</label><input type="text" id="tp-person" value="${phase?.person||''}" placeholder="工长/师傅"></div>
        <div class="form-group"><label>备注</label><input type="text" id="tp-note" value="${phase?.note||''}"></div>
      </div>
    `, `
      <button class="btn btn-outline" id="tp-cancel">取消</button>
      <button class="btn btn-primary" id="tp-save">${isEdit?'保存修改':'添加阶段'}</button>
    `);
    document.getElementById('tp-cancel').addEventListener('click', App.hideModalLg);
    document.getElementById('tp-save').addEventListener('click', () => {
      const name = document.getElementById('tp-name').value.trim();
      if (!name) return App.showToast('请输入阶段名称', 'error');
      const data = {
        id: phase?.id || App.uid(),
        name,
        planStart: document.getElementById('tp-ps').value,
        planEnd: document.getElementById('tp-pe').value,
        actualStart: document.getElementById('tp-as').value,
        actualEnd: document.getElementById('tp-ae').value,
        person: document.getElementById('tp-person').value.trim(),
        note: document.getElementById('tp-note').value.trim(),
      };
      const phases = getPhases();
      if (isEdit) {
        const idx = phases.findIndex(p => p.id === phase.id);
        if (idx >= 0) phases[idx] = data;
      } else { phases.push(data); }
      savePhases(phases);
      App.hideModalLg();
      App.showToast(isEdit?'阶段已更新':'阶段已添加', 'success');
      render();
    });
  }

  function init() {
    document.getElementById('btn-add-phase').addEventListener('click', () => showForm());
    document.getElementById('timeline-list').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.action === 'edit-phase') {
        const phase = getPhases().find(p => p.id === btn.dataset.id);
        if (phase) showForm(phase);
      }
    });
    render();
  }
  return { init, render };
})();
