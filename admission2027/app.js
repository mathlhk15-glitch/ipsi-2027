const slides = window.SLIDES;
const sections = window.SECTIONS;
const byPage = new Map(slides.map(s => [s.page, s]));
const STORE = {
  favorites: 'ipsi2027_favorites',
  recent: 'ipsi2027_recent',
  checklist: 'ipsi2027_checklist',
  view: 'ipsi2027_view'
};

function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode etc. */ }
}
let favorites = new Set(readStore(STORE.favorites, []));
let recent = readStore(STORE.recent, []);
let collectionMode = 'all';
let viewMode = readStore(STORE.view, window.matchMedia('(max-width:640px)').matches ? 'large' : 'compact');

/* ---------- 전형별 카드 ---------- */
const sectionCards = document.getElementById('sectionCards');
sections.forEach(s => {
  const el = document.createElement('article');
  el.className = 'section-card';
  el.innerHTML = `<div class="range">${s.start}-${s.end}쪽 · ${s.end - s.start + 1}장</div><h3>${s.title}</h3><p>${s.desc}</p><button type="button">이 영역 전체 보기 →</button>`;
  el.querySelector('button').onclick = () => jumpSection(s.title);
  sectionCards.appendChild(el);
});

/* ---------- 입시 초보 추천 10쪽 ---------- */
const starterPages = [3, 4, 5, 13, 27, 28, 33, 59, 124, 188];
const starterLabels = {
  3: '대입 전형의 뜻', 4: '합격과 충원의 구조', 5: '충원율 읽는 법', 13: '정시 점수의 기본',
  27: '모의고사 성적표 읽기', 28: '영어 등급 감점', 33: '사탐 선택 점검', 59: '교과전형 기본',
  124: '종합전형 기본', 188: '논술전형 기본'
};
const starterGrid = document.getElementById('starterGrid');
starterPages.forEach((page, i) => {
  const s = byPage.get(page);
  const b = document.createElement('button');
  b.className = 'starter-card';
  b.type = 'button';
  b.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><div><b>${starterLabels[page]}</b><small>${page}쪽 · ${s.section}</small></div><em>열기 →</em>`;
  b.onclick = () => openViewer(s);
  starterGrid.appendChild(b);
});

/* ---------- 입시 용어 사전 ---------- */
const glossary = [
  ['70%컷', '최종 등록자 가운데 상위 70% 지점의 성적입니다. 최저 합격선과는 다릅니다.', 68],
  ['50%컷', '최종 등록자의 가운데 지점에 가까운 성적입니다. 전형별 공개 기준을 함께 확인하세요.', 56],
  ['충원율', '최초 모집인원 대비 추가합격 인원이 어느 정도였는지를 보여주는 비율입니다.', 5],
  ['실질경쟁률', '수능최저 미충족자나 결시자 등을 제외한 실제 경쟁 수준입니다.', 70],
  ['환산점수', '대학이 과목·비율·가산점을 적용해 다시 계산한 지원자 점수입니다.', 72],
  ['변환표준점수', '탐구 과목 간 유불리를 조정하기 위해 대학이 백분위 등을 점수로 바꾸는 방식입니다.', 38],
  ['수능최저', '수시 지원자가 최종 합격을 위해 충족해야 하는 수능 등급 조건입니다.', 63],
  ['모집군', '정시에서 가·나·다군으로 나누어 지원 기회를 운영하는 구분입니다.', 19],
  ['최초합격', '첫 합격자 발표에서 선발된 경우입니다. 이후 등록 포기로 추가합격이 발생할 수 있습니다.', 4],
  ['추가합격', '최초합격자의 미등록으로 생긴 자리를 예비순위에 따라 채우는 합격입니다.', 5]
];
const glossaryGrid = document.getElementById('glossaryGrid');
glossary.forEach(([term, desc, page]) => {
  const el = document.createElement('details');
  el.className = 'glossary-item';
  el.innerHTML = `<summary>${term}<span>＋</span></summary><p>${desc}</p><button type="button">관련 원문 ${page}쪽 보기 →</button>`;
  el.querySelector('button').onclick = () => openViewer(byPage.get(page));
  glossaryGrid.appendChild(el);
});

/* ---------- 3분 입시 길찾기 ---------- */
const navigatorResult = document.getElementById('navigatorResult');
document.getElementById('runNavigator').onclick = () => {
  const grade = document.getElementById('navGrade').value;
  const strength = document.getElementById('navStrength').value;
  const minimum = document.getElementById('navMinimum').value;
  const record = document.getElementById('navRecord').value;
  const recs = [];
  const reasons = [];

  if (grade === '1') {
    recs.push(['학생부종합전형', 124], ['시작과 전체 흐름', 3]);
    reasons.push('고1은 대학 이름보다 선택과목·수업 참여·교과 성취의 방향을 먼저 잡는 시기입니다.');
  } else if (grade === '2') {
    recs.push(['학생부교과전형', 59], ['정시전형', 27]);
    reasons.push('고2는 내신과 모의고사를 함께 보며 수능최저 가능성과 주력 전형을 점검할 시기입니다.');
  } else {
    reasons.push('고3은 대학별 환산 방식, 수능최저, 충원율과 3개년 입결을 함께 확인해야 합니다.');
  }

  if (strength === 'school') {
    recs.unshift(['학생부교과전형', 59]);
    reasons.push('내신이 강하면 교과전형을 우선 검토하되 수능최저 충족 여부가 핵심입니다.');
  } else if (strength === 'mock') {
    recs.unshift(['정시전형', 13]);
    reasons.push('모의고사가 강하면 정시의 대학별 반영 방식과 영어·탐구 유불리를 먼저 확인하세요.');
  } else if (strength === 'both') {
    recs.unshift(['시작과 전체 흐름', 12]);
    reasons.push('내신과 모의고사가 비슷하면 수시와 정시를 한쪽에만 걸지 않는 균형 전략이 필요합니다.');
  }

  if (record === 'strong') {
    recs.push(['학생부종합전형', 124]);
    reasons.push('수업 탐구와 기록이 좋다면 종합전형의 평가 구조와 선택과목 맥락을 확인할 가치가 있습니다.');
  } else if (record === 'weak') {
    recs.push(['논술전형', 188]);
    reasons.push('학생부 기록보다 시험 역량이 강하다면 정시와 함께 논술의 수능최저·실질경쟁률을 검토할 수 있습니다.');
  }

  if (minimum === 'possible') {
    recs.push(['학생부교과전형', 63]);
    reasons.push('수능최저 충족 가능성이 있다면 교과·논술전형의 실질 경쟁에서 유리해질 수 있습니다.');
  } else if (minimum === 'difficult') {
    recs.push(['학생부종합전형', 124]);
    reasons.push('수능최저가 어려우면 최저가 없는 전형과 대학을 구분해서 살펴야 합니다.');
  }

  if (grade === '3' && strength === 'unknown') recs.push(['정시전형', 27], ['학생부교과전형', 59]);
  const unique = [...new Map(recs.map(x => [x[1], x])).values()].slice(0, 4);
  navigatorResult.innerHTML = `<b>먼저 볼 자료 ${unique.length}개</b><p>${reasons.slice(0, 3).join(' ')}</p><div class="navigator-links">${unique.map(([name, page]) => `<button type="button" data-page="${page}">${name} · ${page}쪽</button>`).join('')}</div><small>이 결과는 합격 가능성을 판단하지 않습니다. 실제 지원은 대학별 최종 모집요강과 상담을 통해 결정하세요.</small>`;
  navigatorResult.querySelectorAll('[data-page]').forEach(b => b.onclick = () => openViewer(byPage.get(+b.dataset.page)));
};

/* ---------- 필터 ---------- */
const filters = ['전체', ...sections.map(s => s.title)];
let active = '전체', limit = 24, query = '';
const filterBar = document.getElementById('filterBar');
filters.forEach(f => {
  const b = document.createElement('button');
  b.textContent = f;
  b.className = f === '전체' ? 'active' : '';
  b.onclick = () => {
    active = f; collectionMode = 'all'; limit = 24;
    [...filterBar.children].forEach(x => x.classList.toggle('active', x === b));
    syncCollectionButtons(); render();
  };
  filterBar.appendChild(b);
});

/* ---------- 검색 추천어 ---------- */
const searchInput = document.getElementById('searchInput');
const searchWords = ['충원율', '수능최저', '사탐런', '확통런', '영어 감점', '논술', '학생부종합', '선택과목'];
const chips = document.getElementById('searchChips');
searchWords.forEach(word => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = word;
  b.onclick = () => { searchInput.value = word; query = word; limit = 24; collectionMode = 'all'; syncCollectionButtons(); render(); document.getElementById('slideGrid').scrollIntoView({behavior:'smooth', block:'start'}); };
  chips.appendChild(b);
});

/* ---------- 검색/렌더 ---------- */
const grid = document.getElementById('slideGrid');
const count = document.getElementById('resultCount');
const more = document.getElementById('loadMore');
const favCount = document.getElementById('favoriteCount');

function filtered() {
  let base = slides;
  if (collectionMode === 'favorites') base = slides.filter(s => favorites.has(s.page));
  if (collectionMode === 'recent') base = recent.map(p => byPage.get(p)).filter(Boolean);
  return base.filter(s =>
    (collectionMode !== 'all' || active === '전체' || s.section === active) &&
    (!query || (s.title + ' ' + s.text).toLowerCase().includes(query.toLowerCase()))
  );
}
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function highlight(str) {
  if (!query) return escapeHtml(str);
  const lower = str.toLowerCase(), q = query.toLowerCase();
  let out = '', pos = 0, idx;
  while ((idx = lower.indexOf(q, pos)) !== -1) {
    out += escapeHtml(str.slice(pos, idx)) + '<mark>' + escapeHtml(str.slice(idx, idx + query.length)) + '</mark>';
    pos = idx + query.length;
  }
  return out + escapeHtml(str.slice(pos));
}
function snippet(s) {
  if (!query) return '';
  const t = s.text || '';
  const idx = t.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return '<p class="snippet muted">본문 텍스트에는 검색어가 없습니다. 이미지 안에 있을 수 있습니다.</p>';
  const start = Math.max(0, idx - 22), end = Math.min(t.length, idx + query.length + 38);
  const snip = (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
  return `<p class="snippet">${highlight(snip)}</p>`;
}
function render() {
  const arr = filtered();
  favCount.textContent = favorites.size;
  count.textContent = `${arr.length}개 페이지${collectionMode === 'favorites' ? ' · 저장함' : collectionMode === 'recent' ? ' · 최근 본 순서' : ''}`;
  grid.className = `slide-grid ${viewMode === 'large' ? 'large-view' : 'compact-view'}`;
  grid.innerHTML = '';
  arr.slice(0, limit).forEach(s => {
    const c = document.createElement('article');
    c.className = 'slide-card';
    c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0');
    const badge = s.dense ? '<span class="badge">원문 이미지 확인</span>' : '';
    const saved = favorites.has(s.page);
    c.innerHTML = `<div class="thumb-wrap"><img loading="lazy" src="${s.image}" alt="${s.page}쪽 ${escapeHtml(s.title || '슬라이드')}">${badge}<button class="card-favorite ${saved ? 'saved' : ''}" type="button" aria-label="${saved ? '저장 해제' : '페이지 저장'}">${saved ? '★' : '☆'}</button></div><div class="cap"><div class="meta">${s.page}쪽 · ${s.section}</div><h3>${highlight(s.title || '제목 없음')}</h3>${snippet(s)}</div>`;
    c.onclick = () => openViewer(s);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(s); } });
    c.querySelector('.card-favorite').onclick = e => { e.stopPropagation(); toggleFavorite(s.page); };
    grid.appendChild(c);
  });
  if (!arr.length) grid.innerHTML = '<div class="empty-state"><b>조건에 맞는 페이지가 없습니다.</b><p>검색어를 줄이거나 전체 보기를 눌러보세요.</p></div>';
  more.style.display = arr.length > limit ? 'block' : 'none';
}
more.onclick = () => { limit += 24; render(); };
searchInput.oninput = e => { query = e.target.value.trim(); limit = 24; render(); };

function jumpSection(name) {
  active = name; collectionMode = 'all'; query = ''; searchInput.value = ''; limit = 24;
  [...filterBar.children].forEach(x => x.classList.toggle('active', x.textContent === name));
  syncCollectionButtons(); document.getElementById('library').scrollIntoView(); render();
}
document.querySelectorAll('.persona, .ghost').forEach(b => b.onclick = () => jumpSection(b.dataset.jump));

/* ---------- 저장/최근/보기 방식 ---------- */
const favBtn = document.getElementById('showFavorites');
const recentBtn = document.getElementById('showRecent');
const clearBtn = document.getElementById('clearView');
const largeBtn = document.getElementById('viewLarge');
const compactBtn = document.getElementById('viewCompact');
function syncCollectionButtons() {
  favBtn.classList.toggle('active', collectionMode === 'favorites');
  recentBtn.classList.toggle('active', collectionMode === 'recent');
  clearBtn.classList.toggle('active', collectionMode === 'all');
}
function setCollection(mode) {
  collectionMode = mode; active = '전체'; limit = 24;
  [...filterBar.children].forEach(x => x.classList.toggle('active', x.textContent === '전체'));
  syncCollectionButtons(); render();
}
favBtn.onclick = () => setCollection('favorites');
recentBtn.onclick = () => setCollection('recent');
clearBtn.onclick = () => { query = ''; searchInput.value = ''; setCollection('all'); };
function setView(mode) {
  viewMode = mode; writeStore(STORE.view, mode);
  largeBtn.classList.toggle('active', mode === 'large'); compactBtn.classList.toggle('active', mode === 'compact'); render();
}
largeBtn.onclick = () => setView('large'); compactBtn.onclick = () => setView('compact');
largeBtn.classList.toggle('active', viewMode === 'large'); compactBtn.classList.toggle('active', viewMode === 'compact');
function toggleFavorite(page) {
  if (favorites.has(page)) favorites.delete(page); else favorites.add(page);
  writeStore(STORE.favorites, [...favorites]);
  updateViewerFavorite(); render();
}
function addRecent(page) {
  recent = [page, ...recent.filter(p => p !== page)].slice(0, 12);
  writeStore(STORE.recent, recent);
}

/* ---------- 원문 확대 보기 ---------- */
const dlg = document.getElementById('viewer');
const viewerImage = document.getElementById('viewerImage');
const prevBtn = document.getElementById('prevPage'), nextBtn = document.getElementById('nextPage');
const copyBtn = document.getElementById('copyLink'), copyState = document.getElementById('copyState');
const favoritePageBtn = document.getElementById('favoritePage');
const loading = document.getElementById('imageLoading');
let currentPage = null, zoom = 1;

function applyZoom() {
  viewerImage.style.transform = `scale(${zoom})`;
  viewerImage.style.transformOrigin = 'center center';
  viewerImage.style.cursor = zoom > 1 ? 'zoom-out' : 'zoom-in';
}
function resetZoom() { zoom = 1; applyZoom(); }
document.getElementById('zoomIn').onclick = () => { zoom = Math.min(3, +(zoom + .25).toFixed(2)); applyZoom(); };
document.getElementById('zoomOut').onclick = () => { zoom = Math.max(.75, +(zoom - .25).toFixed(2)); applyZoom(); };
document.getElementById('zoomReset').onclick = resetZoom;
viewerImage.addEventListener('click', () => { zoom = zoom > 1 ? 1 : 1.75; applyZoom(); });

function updateViewerFavorite() {
  if (!currentPage) return;
  const saved = favorites.has(currentPage);
  favoritePageBtn.textContent = saved ? '★ 저장 해제' : '☆ 이 페이지 저장';
  favoritePageBtn.classList.toggle('saved', saved);
}
function openViewer(s, historyMode = 'push') {
  currentPage = s.page; addRecent(s.page); resetZoom();
  viewerImage.src = s.image;
  loading.classList.add('show'); loading.textContent = '고화질 원문을 불러오는 중…';
  const hi = new Image();
  hi.onload = () => {
    if (currentPage === s.page) {
      viewerImage.src = s.hd; loading.textContent = '고화질 원문';
      setTimeout(() => loading.classList.remove('show'), 1100);
    }
  };
  hi.onerror = () => { if (currentPage === s.page) { loading.textContent = '고화질 이미지를 불러오지 못했습니다'; } };
  hi.src = s.hd;

  document.getElementById('viewerMeta').textContent = `${s.page}쪽 · ${s.section}${s.dense ? ' · 원문 이미지 확인 권장' : ''}`;
  document.getElementById('viewerTitle').textContent = s.title || '제목 없음';
  document.getElementById('viewerBody').textContent = s.text || '이 페이지는 도표·이미지 중심 자료입니다. 원문 이미지를 확인하세요.';
  document.getElementById('openPdf').href = `assets/2027-admission-source.pdf#page=${s.page}`;
  document.getElementById('openHd').href = s.hd;
  document.getElementById('viewerDense').style.display = s.dense ? 'block' : 'none';
  copyState.textContent = ''; prevBtn.disabled = s.page <= 1; nextBtn.disabled = s.page >= slides.length;
  updateViewerFavorite();
  if (!dlg.open) dlg.showModal();
  if (historyMode === 'push') history.pushState(null, '', `#page-${s.page}`);
  else if (historyMode === 'replace') history.replaceState(null, '', `#page-${s.page}`);
}
function closeViewer() {
  dlg.close(); currentPage = null; resetZoom();
  if (location.hash.startsWith('#page-')) history.replaceState(null, '', location.pathname + location.search);
}
dlg.querySelector('.close').onclick = closeViewer;
dlg.addEventListener('click', e => { if (e.target === dlg) closeViewer(); });
document.addEventListener('keydown', e => {
  if (!dlg.open) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === '+' || e.key === '=') document.getElementById('zoomIn').click();
  if (e.key === '-') document.getElementById('zoomOut').click();
});
prevBtn.onclick = () => { const s = byPage.get(currentPage - 1); if (s) openViewer(s, 'replace'); };
nextBtn.onclick = () => { const s = byPage.get(currentPage + 1); if (s) openViewer(s, 'replace'); };
favoritePageBtn.onclick = () => toggleFavorite(currentPage);
copyBtn.onclick = async () => {
  const url = location.origin + location.pathname + `#page-${currentPage}`;
  try { await navigator.clipboard.writeText(url); copyState.textContent = '링크가 복사되었습니다'; }
  catch { copyState.textContent = url; }
};
function openFromHash() {
  const m = location.hash.match(/^#page-(\d+)$/);
  if (m) { const s = byPage.get(+m[1]); if (s && currentPage !== s.page) openViewer(s, 'none'); }
}
window.addEventListener('hashchange', openFromHash);

/* ---------- 교육용 계산기 ---------- */
function calcFill() {
  const q = +document.getElementById('quota').value || 0, r = +document.getElementById('fillRate').value || 0;
  const n = q * r / 100;
  const range = Number.isInteger(n) ? `${n.toFixed(0)}명` : `${Math.floor(n)}~${Math.ceil(n)}명`;
  document.getElementById('fillResult').innerHTML = `단순 환산 시 추가합격 약 <strong>${range}</strong><br><small>계산값 ${n.toFixed(1)}명 · 최초 모집 ${q}명 기준 · 대학별 공시 기준과 충원 방식에 따라 실제 인원은 달라질 수 있습니다.</small>`;
}
function calcBonus() {
  const s = +document.getElementById('scienceScore').value || 0, r = +document.getElementById('bonusRate').value || 0;
  document.getElementById('bonusResult').innerHTML = `단순 가산 예시값 <strong>${(s * (1 + r / 100)).toFixed(1)}</strong><br><small>실제 대학 환산점수가 아니라 원자료의 계산 방식을 이해하기 위한 참고 수치입니다.</small>`;
}
['quota', 'fillRate'].forEach(id => document.getElementById(id).oninput = calcFill);
['scienceScore', 'bonusRate'].forEach(id => document.getElementById(id).oninput = calcBonus);

/* ---------- 체크리스트 저장 ---------- */
const checks = [...document.querySelectorAll('.checklist input[type=checkbox]')];
const savedChecks = readStore(STORE.checklist, []);
checks.forEach((box, i) => {
  box.checked = !!savedChecks[i];
  box.onchange = () => writeStore(STORE.checklist, checks.map(x => x.checked));
});

/* ---------- 맨 위로 ---------- */
const topBtn = document.getElementById('toTop');
window.addEventListener('scroll', () => { topBtn.classList.toggle('show', window.scrollY > 700); }, { passive: true });
topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

document.getElementById('denseCount').textContent = slides.filter(s => s.dense).length;
syncCollectionButtons(); calcFill(); calcBonus(); render(); openFromHash();
