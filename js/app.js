/* ============================================
   可视化报告修改
   点击照片定位 → 手动选择牙位 → 增删改
   ============================================ */

(function() {
  'use strict';

  const state = {
    photoIdx: 2,
    diseases: {},
    // { toothId: { disease, severity, note, photoIdx, x, y } }
    editingId: null,
    clickX: 0, clickY: 0,
    hasClicked: false,  // 是否已在照片上点了位置
  };

  // 加载初始数据
  Object.keys(INITIAL_DISEASES).forEach(function(tid) {
    var info = INITIAL_DISEASES[tid];
    var x = 50, y = 50, pi = info.photoIdx || 2;
    for (var i = 0; i < PHOTOS.length; i++) {
      var pt = PHOTOS[i].teeth.find(function(t) { return t.id === tid; });
      if (pt) { x = pt.x; y = pt.y; pi = i; break; }
    }
    state.diseases[tid] = {
      disease: info.disease, severity: info.severity,
      note: info.note || '', photoIdx: pi, x: x, y: y,
    };
  });

  const $ = function(s) { return document.querySelector(s); };
  const $$ = function(s) { return document.querySelectorAll(s); };

  const dom = {
    photoBg: $('#photoBg'),
    markerLayer: $('#marker-layer'),
    photoHint: $('#photoHint'),
    thumbStrip: $('#thumbStrip'),
    diseaseBar: $('#diseaseBar'),
    diseaseCards: $('#diseaseCards'),
    diseaseBadge: $('#diseaseBadge'),
    statusText: $('#statusText'),
    selTooth: $('#selTooth'),
    selDisease: $('#selDisease'),
    selSeverity: $('#selSeverity'),
    inpNote: $('#inpNote'),
    btnApply: $('#btnApply'),
    btnDelete: $('#btnDelete'),
    btnGenerate: $('#btnGenerate'),
    infoText: $('#infoText'),
    toast: $('#toast'),
  };

  // ===== 牙位列表 =====
  const ALL_TEETH = [
    '18','17','16','15','14','13','12','11',
    '21','22','23','24','25','26','27','28',
    '31','32','33','34','35','36','37','38',
    '41','42','43','44','45','46','47','48',
  ];

  function initSelectors() {
    dom.selTooth.innerHTML = '<option value="">选择牙位</option>'
      + ALL_TEETH.map(function(t) {
          return '<option value="' + t + '">#' + t + '</option>';
        }).join('');
    dom.selDisease.innerHTML = DISEASE_TYPES.map(function(d) {
      return '<option value="' + d.value + '">' + d.label + '</option>';
    }).join('');
    dom.selSeverity.innerHTML = SEVERITY_LEVELS.map(function(s) {
      return '<option value="' + s.value + '">' + s.label + '</option>';
    }).join('');
    dom.selSeverity.value = 'moderate';
  }

  function updatePhotoBg() {
    var p = PHOTOS[state.photoIdx];
    dom.photoBg.style.backgroundImage = p.photo ? 'url(' + p.photo + ')' : '';
  }

  function getColor(name) {
    var map = {
      '牙列拥挤':'#eb5c58','牙龈炎':'#eb5c58','龋齿':'#ff8c42',
      '牙周炎':'#e04040','牙髓炎':'#ff6b6b','牙隐裂':'#ff7070',
      '牙体缺损':'#c070e0','牙缺失':'#6f90ff','其他':'#888888'
    };
    return map[name] || '#eb5c58';
  }

  // ===== 渲染标记 =====
  function renderMarkers() {
    dom.markerLayer.innerHTML = '';
    Object.entries(state.diseases).forEach(function(entry) {
      var tid = entry[0], info = entry[1];
      if (info.photoIdx !== state.photoIdx) return;
      var color = getColor(info.disease);
      var isEditing = (state.editingId === tid);
      var el = document.createElement('div');
      el.className = 'pin';
      el.style.left = info.x + '%';
      el.style.top = info.y + '%';
      el.style.borderColor = color;
      el.style.background = color;
      if (isEditing) el.classList.add('editing');
      var lb = document.createElement('span');
      lb.className = 'pin-label';
      lb.textContent = '#' + tid + ' ' + info.disease;
      if (isEditing) lb.classList.add('show');
      el.appendChild(lb);
      el.addEventListener('click', function(e) { e.stopPropagation(); selectDisease(tid); });
      dom.markerLayer.appendChild(el);
    });

    // 新点击位置 / 编辑中但尚未保存的临时标记
    var tid = dom.selTooth.value;
    if (state.hasClicked && !state.diseases[tid]) {
      var pin = document.createElement('div');
      pin.className = 'pin new';
      pin.style.left = state.clickX + '%';
      pin.style.top = state.clickY + '%';
      pin.innerHTML = '<span class="pin-label show">' + (tid ? '#' + tid + ' 新标记' : '点击的位置') + '</span>';
      dom.markerLayer.appendChild(pin);
    }
  }

  function selectDisease(tid) {
    state.editingId = tid;
    state.hasClicked = true;
    var info = state.diseases[tid];
    state.clickX = info.x;
    state.clickY = info.y;
    dom.selTooth.value = tid;
    dom.selDisease.value = diseaseToValue(info.disease);
    dom.selSeverity.value = info.severity;
    dom.inpNote.value = info.note || '';
    dom.btnApply.textContent = '✓ 确认修改';
    dom.btnApply.disabled = false;
    dom.btnDelete.style.display = 'inline-block';
    dom.photoHint.textContent = '✎ 修改 #' + tid + ' · 拖拽标记点到精确位置';
    renderMarkers();
  }

  // ===== 点击照片 =====
  dom.photoBg.addEventListener('click', function(e) {
    if (e.target.closest('.pin')) return;

    var rect = dom.photoBg.getBoundingClientRect();
    state.clickX = ((e.clientX - rect.left) / rect.width) * 100;
    state.clickY = ((e.clientY - rect.top) / rect.height) * 100;
    state.hasClicked = true;
    state.editingId = null;

    // 重置表单
    dom.selTooth.value = '';
    dom.selDisease.value = '';
    dom.selSeverity.value = 'moderate';
    dom.inpNote.value = '';
    dom.btnApply.textContent = '✓ 新增疾病';
    dom.btnApply.disabled = true;  // 需要选牙位后才能用
    dom.btnDelete.style.display = 'none';
    dom.photoHint.textContent = '📍 已标记位置 · 请在下方选择牙位';

    renderMarkers();
  });

  // ===== 牙位选择变化 =====
  dom.selTooth.addEventListener('change', function() {
    var tid = dom.selTooth.value;
    if (!tid) {
      dom.btnApply.disabled = true;
      return;
    }
    // 检查是否已有疾病
    if (state.diseases[tid]) {
      // 自动加载已有疾病进入编辑
      var info = state.diseases[tid];
      state.editingId = tid;
      state.clickX = info.x;
      state.clickY = info.y;
      dom.selDisease.value = diseaseToValue(info.disease);
      dom.selSeverity.value = info.severity;
      dom.inpNote.value = info.note || '';
      dom.btnApply.textContent = '✓ 确认修改';
      dom.btnDelete.style.display = 'inline-block';
      dom.photoHint.textContent = '✎ 修改 #' + tid + ' · 已有疾病';
    } else {
      state.editingId = tid;
      dom.selDisease.value = '';
      dom.selSeverity.value = 'moderate';
      dom.inpNote.value = '';
      dom.btnApply.textContent = '✓ 新增疾病';
      dom.btnApply.disabled = true;  // 还需要选疾病
      dom.btnDelete.style.display = 'none';
      dom.photoHint.textContent = '📍 牙位 #' + tid + ' · 请选择疾病类型';
    }
    renderMarkers();
  });

  // 疾病选择变化
  dom.selDisease.addEventListener('change', function() {
    if (state.hasClicked && dom.selTooth.value && dom.selDisease.value) {
      dom.btnApply.disabled = false;
    }
  });

  // ===== 缩略图 =====
  function renderThumbs() {
    dom.thumbStrip.innerHTML = '';
    PHOTOS.forEach(function(p, i) {
      var el = document.createElement('div');
      el.className = 'thumb';
      if (state.photoIdx === i) el.classList.add('active');
      if (p.photo) el.style.backgroundImage = 'url(' + p.photo + ')';
      el.innerHTML = '<div class="t-num">' + (i+1) + '.' + p.name.substring(0,4) + '</div>';
      var has = Object.entries(state.diseases).some(function(e) { return e[1].photoIdx === i; });
      if (has) el.innerHTML += '<div class="t-dot"></div>';
      el.title = p.name;
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        state.photoIdx = i;
        resetState();
        renderAll();
      });
      dom.thumbStrip.appendChild(el);
    });
  }

  // ===== 疾病栏 =====
  function renderDiseaseBar() {
    var entries = Object.entries(state.diseases);
    dom.diseaseBar.innerHTML = '<span class="label">已记录：</span>';
    if (entries.length === 0) {
      dom.diseaseBar.innerHTML += '<span class="disease-tag empty">暂无</span>';
    } else {
      entries.forEach(function(entry) {
        var tid = entry[0], info = entry[1];
        var tag = document.createElement('span');
        tag.className = 'disease-tag';
        if (state.editingId === tid) tag.style.background = 'rgba(213,223,29,0.22)';
        tag.innerHTML = '#' + tid + ' ' + info.disease
          + ' <span class="del" data-tid="' + tid + '">×</span>';
        tag.title = (info.severity==='mild'?'轻度':info.severity==='moderate'?'中度':'重度')
          + (info.note ? ' · ' + info.note : '');
        tag.addEventListener('click', function(e) {
          if (e.target.classList.contains('del')) {
            e.stopPropagation();
            delete state.diseases[tid];
            if (state.editingId === tid) resetState();
            renderAll();
            showToast('已移除 #' + tid, 'success');
          } else {
            state.photoIdx = info.photoIdx;
            selectDisease(tid);
            renderAll();
          }
        });
        dom.diseaseBar.appendChild(tag);
      });
    }
    dom.diseaseBadge.textContent = entries.length + '个';
  }

  // ===== 疾病卡片 =====
  function renderDiseaseCards() {
    var entries = Object.entries(state.diseases);
    dom.diseaseCards.innerHTML = '';
    if (entries.length === 0) {
      dom.diseaseCards.innerHTML =
        '<div style="text-align:center;color:var(--muted);font-size:10px;padding:8px;">暂无 — 点击照片标记位置，选择牙位添加疾病</div>';
      return;
    }
    entries.forEach(function(entry) {
      var tid = entry[0], info = entry[1];
      var card = document.createElement('div');
      card.className = 'disease-card';
      if (state.editingId === tid) card.classList.add('selected');
      var sev = info.severity==='mild'?'轻度':info.severity==='moderate'?'中度':'重度';
      card.innerHTML =
        '<div class="dc-dot" style="background:' + getColor(info.disease) + '"></div>' +
        '<div class="dc-info">' +
          '<span class="dc-tooth">#' + tid + '</span> ' + info.disease +
          '<span class="dc-sev">' + sev + '</span>' +
          (info.note ? '<span class="dc-note">' + info.note + '</span>' : '') +
        '</div>' +
        '<button class="dc-modify">修改</button>' +
        '<button class="dc-delete">✕</button>';
      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('dc-modify')) {
          e.stopPropagation();
          state.photoIdx = info.photoIdx;
          selectDisease(tid);
          renderAll();
        } else if (e.target.classList.contains('dc-delete')) {
          e.stopPropagation();
          delete state.diseases[tid];
          if (state.editingId === tid) resetState();
          renderAll();
          showToast('已移除 #' + tid, 'success');
        }
      });
      dom.diseaseCards.appendChild(card);
    });
  }

  // ===== 操作 =====
  function resetState() {
    state.editingId = null;
    state.hasClicked = false;
    dom.selTooth.value = '';
    dom.selDisease.value = '';
    dom.selSeverity.value = 'moderate';
    dom.inpNote.value = '';
    dom.btnApply.textContent = '请先点击照片标记位置';
    dom.btnApply.disabled = true;
    dom.btnDelete.style.display = 'none';
    dom.photoHint.textContent = '👆 点击照片上的牙齿标记位置';
  }

  function applyChange() {
    var tid = dom.selTooth.value;
    if (!tid) { showToast('请选择牙位'); return; }

    var dname = dom.selDisease.options[dom.selDisease.selectedIndex]?.text;
    if (!dname || dname === '选择疾病') { showToast('请选择疾病类型'); return; }

    var existing = !!state.diseases[tid];

    state.diseases[tid] = {
      disease: dname,
      severity: dom.selSeverity.value,
      note: dom.inpNote.value.trim(),
      photoIdx: state.photoIdx,
      x: state.clickX,
      y: state.clickY,
    };

    var sevLabel = dom.selSeverity.value==='mild'?'轻度':dom.selSeverity.value==='moderate'?'中度':'重度';
    var verb = existing ? '已更新' : '已记录';
    showToast('#' + tid + ' ' + dname + '(' + sevLabel + ') ' + verb, 'success');

    resetState();
    renderAll();
  }

  function deleteCurrent() {
    var tid = dom.selTooth.value;
    if (!tid || !state.diseases[tid]) return;
    if (!confirm('确认移除牙位 #' + tid + ' 的「' + state.diseases[tid].disease + '」？')) return;
    delete state.diseases[tid];
    showToast('已移除 #' + tid, 'success');
    resetState();
    renderAll();
  }

  function generateReport() {
    var entries = Object.entries(state.diseases);
    if (entries.length === 0) { showToast('暂无疾病记录'); return; }
    var lines = entries.map(function(e) {
      var tid=e[0], info=e[1];
      var sev = info.severity==='mild'?'轻度':info.severity==='moderate'?'中度':'重度';
      return '#' + tid + ' ' + info.disease + ' (' + sev + ')' + (info.note?' - '+info.note:'');
    });
    showToast('报告已生成！共 ' + entries.length + ' 项', 'success');
    console.log('=== 生成报告 ===\n患者：张*明 男 34岁\n病历号：YL20240622\n' + lines.join('\n'));
  }

  var toastTimer;
  function showToast(msg, type) {
    dom.toast.textContent = msg;
    dom.toast.className = 'toast ' + (type || '') + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { dom.toast.classList.remove('show'); }, 2000);
  }

  function diseaseToValue(name) {
    var map = {
      '牙龈炎':'gingivitis','牙列拥挤':'crowding','龋齿':'caries',
      '牙周炎':'periodontitis','牙髓炎':'pulpitis','牙隐裂':'cracked',
      '牙体缺损':'erosion','牙缺失':'missing','其他':'other'
    };
    return map[name] || 'other';
  }

  function renderAll() {
    updatePhotoBg();
    renderMarkers();
    renderThumbs();
    renderDiseaseBar();
    renderDiseaseCards();
  }

  // ===== 事件 =====
  dom.btnApply.addEventListener('click', applyChange);
  dom.btnDelete.addEventListener('click', deleteCurrent);
  dom.btnGenerate.addEventListener('click', generateReport);
  $('#btnReset').addEventListener('click', function() {
    if (!confirm('确认清除所有疾病记录？')) return;
    state.diseases = {};
    resetState();
    renderAll();
    showToast('已重置', 'success');
  });
  $('#backBtn').addEventListener('click', function() {
    state.photoIdx = 2;
    resetState();
    renderAll();
  });

  // ===== 拖拽标记点 =====
  let draggingPin = null;
  dom.markerLayer.addEventListener('mousedown', function(e) {
    var pin = e.target.closest('.pin');
    if (!pin || pin.classList.contains('new')) return;
    // 找对应牙位
    for (var tid in state.diseases) {
      var info = state.diseases[tid];
      var label = pin.querySelector('.pin-label');
      if (label && label.textContent.indexOf('#' + tid + ' ') === 0) {
        draggingPin = tid;
        state.editingId = tid;
        dom.selTooth.value = tid;
        dom.selDisease.value = diseaseToValue(info.disease);
        dom.selSeverity.value = info.severity;
        dom.inpNote.value = info.note || '';
        dom.btnApply.textContent = '✓ 确认修改';
        dom.btnApply.disabled = false;
        dom.btnDelete.style.display = 'inline-block';
        break;
      }
    }
    if (draggingPin) e.preventDefault();
  });

  window.addEventListener('mousemove', function(e) {
    if (!draggingPin) return;
    var info = state.diseases[draggingPin];
    if (!info) return;
    var rect = dom.photoBg.getBoundingClientRect();
    info.x = ((e.clientX - rect.left) / rect.width) * 100;
    info.y = ((e.clientY - rect.top) / rect.height) * 100;
    state.clickX = info.x;
    state.clickY = info.y;
    renderMarkers();
  });

  window.addEventListener('mouseup', function() { draggingPin = null; });

  // Touch
  dom.markerLayer.addEventListener('touchstart', function(e) {
    var pin = e.target.closest('.pin');
    if (!pin || pin.classList.contains('new') || e.touches.length !== 1) return;
    for (var tid in state.diseases) {
      var label = pin.querySelector('.pin-label');
      if (label && label.textContent.indexOf('#' + tid + ' ') === 0) {
        draggingPin = tid;
        var info = state.diseases[tid];
        state.editingId = tid;
        dom.selTooth.value = tid;
        dom.selDisease.value = diseaseToValue(info.disease);
        dom.selSeverity.value = info.severity;
        dom.inpNote.value = info.note || '';
        dom.btnApply.textContent = '✓ 确认修改';
        dom.btnApply.disabled = false;
        dom.btnDelete.style.display = 'inline-block';
        break;
      }
    }
    if (draggingPin) e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', function(e) {
    if (!draggingPin || e.touches.length !== 1) return;
    var info = state.diseases[draggingPin];
    if (!info) return;
    var rect = dom.photoBg.getBoundingClientRect();
    info.x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    info.y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    state.clickX = info.x;
    state.clickY = info.y;
    renderMarkers();
  });

  window.addEventListener('touchend', function() { draggingPin = null; });

  // ===== START =====
  initSelectors();
  resetState();
  renderAll();

  console.log('🦷 可视化报告修改');
})();
