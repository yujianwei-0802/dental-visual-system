/* ============================================
   可视化报告修改 - 核心应用
   ============================================ */

(function() {
  'use strict';

  const state = {
    photoIdx: 2,
    selTooth: null,
    action: 'add',
    diseases: {},
  };
  Object.assign(state.diseases, INITIAL_DISEASES);

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const dom = {
    teeth: $('#teeth-layer'),
    markers: $('#marker-layer'),
    hint: $('#photoHint'),
    photoWrap: $('#photoWrap'),
    thumbStrip: $('#thumbStrip'),
    diseaseBar: $('#diseaseBar'),
    diseaseCards: $('#diseaseCards'),
    diseaseBadge: $('#diseaseBadge'),
    statusText: $('#statusText'),
    btnApply: $('#btnApply'),
    btnGenerate: $('#btnGenerate'),
    infoText: $('#infoText'),
    diseaseRow: $('#diseaseRow'),
    selDisease: $('#selDisease'),
    selSeverity: $('#selSeverity'),
    inpNote: $('#inpNote'),
    toast: $('#toast'),
  };

  function initSelectors() {
    dom.selDisease.innerHTML = DISEASE_TYPES.map(function(d) {
      return '<option value="'+d.value+'">'+d.label+'</option>';
    }).join('');
    dom.selSeverity.innerHTML = SEVERITY_LEVELS.map(function(s) {
      return '<option value="'+s.value+'">'+s.label+'</option>';
    }).join('');
    dom.selSeverity.value = 'moderate';
  }

  function renderTeeth() {
    var photo = PHOTOS[state.photoIdx];
    dom.teeth.innerHTML = '';
    photo.teeth.forEach(function(t) {
      var el = document.createElement('div');
      el.className = 'tooth-dot';
      if (state.diseases[t.id]) el.classList.add('diseased');
      if (state.selTooth === t.id) el.classList.add('selected');
      el.style.left = t.x + '%';
      el.style.top = t.y + '%';
      el.title = '牙位 #' + t.id + (state.diseases[t.id] ? ' · ' + state.diseases[t.id].disease : '');
      el.addEventListener('click', function(e) { e.stopPropagation(); onToothClick(t.id); });
      dom.teeth.appendChild(el);
    });
  }

  function renderMarkers() {
    var photo = PHOTOS[state.photoIdx];
    dom.markers.innerHTML = '';
    Object.entries(state.diseases).forEach(function(entry) {
      var tid = entry[0], info = entry[1];
      var found = photo.teeth.find(function(t) { return t.id === tid; });
      if (!found) return;
      var m = document.createElement('div');
      m.className = 'marker';
      m.style.left = found.x + '%';
      m.style.top = found.y + '%';
      m.innerHTML = '<span class="tag">' + info.disease + '</span>';
      dom.markers.appendChild(m);
    });
  }

  function renderThumbs() {
    dom.thumbStrip.innerHTML = '';
    PHOTOS.forEach(function(p, i) {
      var t = document.createElement('div');
      t.className = 'thumb';
      if (state.photoIdx === i) t.classList.add('active');
      t.innerHTML = '<div class="t-bg"></div><div class="t-num">' + (i+1) + '.' + p.name.substring(0,4) + '</div>';
      var hasDisease = Object.entries(state.diseases).some(function(entry) {
        return p.teeth.some(function(pt) { return pt.id === entry[0]; });
      });
      if (hasDisease) t.innerHTML += '<div class="t-dot"></div>';
      t.title = p.name;
      t.addEventListener('click', function() {
        state.photoIdx = i; state.selTooth = null; renderAll(); updateUI();
      });
      dom.thumbStrip.appendChild(t);
    });
  }

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
        tag.innerHTML = '#' + tid + ' ' + info.disease + ' <span class="del" data-tid="' + tid + '">×</span>';
        tag.title = (info.severity==='mild'?'轻度':info.severity==='moderate'?'中度':'重度') + (info.note?' · '+info.note:'');
        tag.addEventListener('click', function(e) {
          if (e.target.classList.contains('del')) {
            e.stopPropagation();
            delete state.diseases[tid];
            if (state.selTooth === tid) state.selTooth = null;
            renderAll(); updateUI();
            showToast('已移除 #' + tid + ' ' + info.disease, 'success');
          } else {
            state.selTooth = tid;
            for (var i = 0; i < PHOTOS.length; i++) {
              if (PHOTOS[i].teeth.find(function(t) { return t.id === tid; })) {
                state.photoIdx = i; break;
              }
            }
            state.action = 'mod';
            setChipActive('mod');
            dom.diseaseRow.classList.remove('disabled');
            dom.infoText.textContent = '';
            dom.selDisease.value = diseaseToValue(info.disease);
            dom.selSeverity.value = info.severity;
            dom.inpNote.value = info.note || '';
            renderAll(); updateUI();
          }
        });
        dom.diseaseBar.appendChild(tag);
      });
    }
    dom.diseaseBadge.textContent = entries.length + '个';
  }

  function renderDiseaseCards() {
    var entries = Object.entries(state.diseases);
    dom.diseaseCards.innerHTML = '';
    if (entries.length === 0) {
      dom.diseaseCards.innerHTML = '<div style="text-align:center;color:var(--text-secondary);font-size:10px;padding:8px;">暂无疾病记录</div>';
      return;
    }
    entries.forEach(function(entry) {
      var tid = entry[0], info = entry[1];
      var card = document.createElement('div');
      card.className = 'disease-card';
      if (state.selTooth === tid) card.classList.add('selected');
      card.innerHTML =
        '<div class="dc-dot"></div>' +
        '<div class="dc-info">' +
          '<span class="dc-tooth">#' + tid + '</span> ' + info.disease +
          '<span class="dc-sev">' + (info.severity==='mild'?'轻度':info.severity==='moderate'?'中度':'重度') + '</span>' +
          (info.note ? '<span class="dc-note">' + info.note + '</span>' : '') +
        '</div>' +
        '<button class="dc-modify">修改</button>';
      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('dc-modify')) {
          e.stopPropagation();
          state.selTooth = tid;
          for (var i = 0; i < PHOTOS.length; i++) {
            if (PHOTOS[i].teeth.find(function(t) { return t.id === tid; })) {
              state.photoIdx = i; break;
            }
          }
          state.action = 'mod';
          setChipActive('mod');
          dom.diseaseRow.classList.remove('disabled');
          dom.infoText.textContent = '';
          dom.selDisease.value = diseaseToValue(info.disease);
          dom.selSeverity.value = info.severity;
          dom.inpNote.value = info.note || '';
          renderAll(); updateUI();
        }
      });
      dom.diseaseCards.appendChild(card);
    });
  }

  function renderHint() {
    if (state.selTooth) {
      var ts = state.diseases[state.selTooth];
      dom.hint.textContent = state.action === 'del' ? '点击「确认移除」' :
        state.action === 'mod' && ts ? '修改后点击确认' :
        ts ? '此牙已有疾病' : '选疾病类型 → 点击应用';
    } else {
      dom.hint.textContent = '点击牙齿进行操作';
    }
    dom.photoWrap.classList.toggle('has-selection', !!state.selTooth);
  }

  function renderAll() {
    renderTeeth(); renderMarkers(); renderThumbs();
    renderDiseaseBar(); renderDiseaseCards(); renderHint();
  }

  function onToothClick(toothId) {
    state.selTooth = toothId;
    var existing = state.diseases[toothId];
    if (state.action === 'del') {
      if (existing) {
        if (confirm('确认移除牙位 #' + toothId + ' 的「' + existing.disease + '」？')) {
          delete state.diseases[toothId];
          state.selTooth = null;
          showToast('已移除 #' + toothId + ' ' + existing.disease, 'success');
        }
      } else {
        showToast('牙位 #' + toothId + ' 无疾病记录');
        state.selTooth = null;
      }
    } else if (state.action === 'mod') {
      if (existing) {
        dom.selDisease.value = diseaseToValue(existing.disease);
        dom.selSeverity.value = existing.severity;
        dom.inpNote.value = existing.note || '';
      } else {
        showToast('牙位 #' + toothId + ' 无疾病，已切换新增');
        setAction('add');
        state.selTooth = toothId;
      }
    }
    renderAll(); updateUI();
  }

  function setAction(act) {
    state.action = act; state.selTooth = null;
    setChipActive(act);
    if (act === 'del') {
      dom.diseaseRow.classList.add('disabled');
      dom.infoText.textContent = '移出模式：点击已有疾病的牙齿';
    } else {
      dom.diseaseRow.classList.remove('disabled');
      dom.infoText.textContent = act === 'mod' ? '修改模式：点击已有疾病的牙齿' : '新增模式：点击牙齿添加疾病';
    }
    renderAll(); updateUI();
  }

  function setChipActive(act) {
    $$('.chip').forEach(function(c) { c.classList.remove('active'); });
    var target = $('.chip[data-act="' + act + '"]');
    if (target) target.classList.add('active');
  }

  function applyChange() {
    if (!state.selTooth) { showToast('请先点击牙齿'); return; }
    if (state.action === 'del') {
      var ex = state.diseases[state.selTooth];
      if (ex) { delete state.diseases[state.selTooth]; showToast('已移除 #' + state.selTooth, 'success'); }
      state.selTooth = null;
    } else {
      var dname = dom.selDisease.options[dom.selDisease.selectedIndex]?.text;
      if (!dname || dname === '选择疾病') { showToast('请选择疾病类型'); return; }
      var sev = dom.selSeverity.value;
      var note = dom.inpNote.value.trim();
      state.diseases[state.selTooth] = { disease:dname, severity:sev, note:note, photoIdx:state.photoIdx };
      var sevLabel = sev==='mild'?'轻度':sev==='moderate'?'中度':'重度';
      var verb = state.action==='mod'?'已更新':'已记录';
      showToast('# ' + state.selTooth + ' ' + dname + '(' + sevLabel + ') ' + verb, 'success');
      state.selTooth = null;
    }
    renderAll(); updateUI();
  }

  function generateReport() {
    var entries = Object.entries(state.diseases);
    if (entries.length === 0) { showToast('暂无疾病记录'); return; }
    var lines = entries.map(function(entry) {
      var tid=entry[0], info=entry[1];
      var sev = info.severity==='mild'?'轻度':info.severity==='moderate'?'中度':'重度';
      return '#' + tid + ' ' + info.disease + ' (' + sev + ')' + (info.note?' - '+info.note:'');
    });
    showToast('报告已生成！共 ' + entries.length + ' 项', 'success');
    console.log('=== 生成报告 ===\n患者：张*明 男 34岁\n病历号：YL20240622\n' + lines.join('\n'));
  }

  function updateUI() {
    var btn = dom.btnApply;
    var exists = state.selTooth ? state.diseases[state.selTooth] : null;
    if (state.selTooth) {
      dom.statusText.innerHTML = exists
        ? '✅ <b>#' + state.selTooth + '</b> · ' + exists.disease + ' · ' + (exists.severity==='mild'?'轻度':exists.severity==='moderate'?'中度':'重度') + (exists.note?' · '+exists.note:'')
        : '📍 已选 <b>#' + state.selTooth + '</b> · 无疾病记录';
    } else {
      dom.statusText.innerHTML = '💡 点击牙齿选择牙位';
    }
    if (state.action === 'del') {
      btn.disabled = !exists; btn.textContent = exists ? '确认移除' : '无疾病可移除';
    } else if (state.action === 'mod') {
      btn.disabled = !exists; btn.textContent = exists ? '确认修改' : '无疾病可修改';
    } else {
      btn.disabled = !!exists; btn.textContent = exists ? '已有疾病' : '新增疾病';
    }
  }

  var toastTimer;
  function showToast(msg, type) {
    dom.toast.textContent = msg;
    dom.toast.className = 'toast ' + (type||'') + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { dom.toast.classList.remove('show'); }, 2000);
  }

  function resetAll() {
    state.selTooth = null; state.action = 'add';
    setChipActive('add');
    dom.selDisease.value = ''; dom.selSeverity.value = 'moderate'; dom.inpNote.value = '';
    dom.diseaseRow.classList.remove('disabled'); dom.infoText.textContent = '';
    renderAll(); updateUI();
  }

  function diseaseToValue(name) {
    var map = {
      '牙龈炎':'gingivitis','牙列拥挤':'crowding','龋齿':'caries',
      '牙周炎':'periodontitis','牙髓炎':'pulpitis','牙隐裂':'cracked',
      '牙体缺损':'erosion','牙缺失':'missing','其他':'other'
    };
    return map[name] || 'other';
  }

  $('#photoBg').addEventListener('click', function(e) {
    if (e.target === this) { state.selTooth = null; renderAll(); updateUI(); }
  });
  $$('.chip').forEach(function(chip) {
    chip.addEventListener('click', function() { setAction(this.dataset.act); });
  });
  $('#btnReset').addEventListener('click', resetAll);
  dom.btnApply.addEventListener('click', applyChange);
  dom.btnGenerate.addEventListener('click', generateReport);
  $('#backBtn').addEventListener('click', resetAll);
  dom.selDisease.addEventListener('change', updateUI);

  initSelectors();
  renderAll();
  updateUI();

  window.DentalApp = {
    state:state, renderAll:renderAll, updateUI:updateUI,
    resetAll:resetAll, generateReport:generateReport,
  };
  console.log('🦷 可视化报告修改 · 白里挑一');
})();
