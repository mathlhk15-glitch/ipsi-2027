const slides = window.SLIDES, sections = window.SECTIONS;
const byPage = new Map(slides.map(s => [s.page, s]));

/* ---------- 전형별 카드 ---------- */
const sectionCards = document.getElementById('sectionCards');
sections.forEach(s => {
  const el = document.createElement('article');
  el.className = 'section-card';
  el.innerHTML = `<div class="range">${s.start}-${s.end}쪽 · ${s.end - s.start + 1}장</div><h3>${s.title}</h3><p>${s.desc}</p><button>이 영역 전체 보기 →</button>`;
  el.querySelector('button').onclick = () => jumpSection(s.title);
  sectionCards.appendChild(el);
});

/* ---------- 필터 ---------- */
const filters = ['전체', ...sections.map(s => s.title)];
let active = '전체', limit = 24, query = '';
const filterBar = document.getElementById('filterBar');
filters.forEach(f => {
  const b = document.createElement('button');
  b.textContent = f;
  b.className = f === '전체' ? 'active' : '';
  b.onclick = () => { active = f; limit = 24; [...filterBar.children].forEach(x => x.classList.toggle('active', x === b)); render(); };
  filterBar.appendChild(b);
});

/* ---------- 검색/렌더 ---------- */
const grid = document.getElementById('slideGrid'), count = document.getElementById('resultCount'), more = document.getElementById('loadMore');

function filtered() {
  return slides.filter(s =>
    (active === '전체' || s.section === active) &&
    (!query || (s.title + ' ' + s.text).toLowerCase().includes(query.toLowerCase()))
  );
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function highlight(str) {
  if (!query) return escapeHtml(str);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(str);
  return escapeHtml(str.slice(0, idx)) + '<mark>' + escapeHtml(str.slice(idx, idx + query.length)) + '</mark>' + escapeHtml(str.slice(idx + query.length));
}

function snippet(s) {
  if (!query) return '';
  const t = s.text || '';
  const idx = t.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return '<p class="snippet muted">본문 텍스트에는 검색어가 없습니다. (이미지 안에 있을 수 있어요)</p>';
  const start = Math.max(0, idx - 18), end = Math.min(t.length, idx + query.length + 24);
  const snip = (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
  return `<p class="snippet">${highlight(snip)}</p>`;
}

function render() {
  const arr = filtered();
  count.textContent = `${arr.length}개 페이지`;
  grid.innerHTML = '';
  arr.slice(0, limit).forEach(s => {
    const c = document.createElement('article');
    c.className = 'slide-card';
    c.setAttribute('role', 'button');
    c.setAttribute('tabindex', '0');
    const badge = s.dense ? '<span class="badge">텍스트만으로 해석 어려움</span>' : '';
    c.innerHTML = `<div class="thumb-wrap"><img loading="lazy" src="${s.image}" alt="${s.page}쪽 ${s.title || '슬라이드'}">${badge}</div><div class="cap"><div class="meta">${s.page}쪽 · ${s.section}</div><h3>${highlight(s.title || '제목 없음')}</h3>${snippet(s)}</div>`;
    c.onclick = () => openViewer(s);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(s); } });
    grid.appendChild(c);
  });
  more.style.display = arr.length > limit ? 'block' : 'none';
}
more.onclick = () => { limit += 24; render(); };
document.getElementById('searchInput').oninput = e => { query = e.target.value.trim(); limit = 24; render(); };

function jumpSection(name) {
  active = name; limit = 24;
  [...filterBar.children].forEach(x => x.classList.toggle('active', x.textContent === name));
  document.getElementById('library').scrollIntoView();
  render();
}
document.querySelectorAll('.persona, .ghost').forEach(b => b.onclick = () => jumpSection(b.dataset.jump));

/* ---------- 원문 확대 보기(뷰어) ---------- */
const dlg = document.getElementById('viewer');
const viewerImage = document.getElementById('viewerImage');
const prevBtn = document.getElementById('prevPage'), nextBtn = document.getElementById('nextPage');
const copyBtn = document.getElementById('copyLink'), copyState = document.getElementById('copyState');
let currentPage = null;

function openViewer(s, historyMode = 'push') {
  currentPage = s.page;
  viewerImage.src = s.image;      // 먼저 저해상도로 즉시 표시
  viewerImage.classList.remove('zoomed');
  const hi = new Image();          // 고화질 이미지를 백그라운드로 로드 후 교체
  hi.onload = () => { if (currentPage === s.page) viewerImage.src = s.hd; };
  hi.src = s.hd;

  document.getElementById('viewerMeta').textContent = `${s.page}쪽 · ${s.section}${s.dense ? ' · 원문 이미지 확인 권장' : ''}`;
  document.getElementById('viewerTitle').textContent = s.title || '제목 없음';
  document.getElementById('viewerBody').textContent = s.text || '이 페이지는 도표·이미지 중심 자료입니다. 아래 원문 이미지를 확인하세요.';
  document.getElementById('openPdf').href = `assets/2027-admission-source.pdf#page=${s.page}`;
  document.getElementById('openHd').href = s.hd;
  document.getElementById('viewerDense').style.display = s.dense ? 'block' : 'none';
  copyState.textContent = '';
  prevBtn.disabled = s.page <= 1;
  nextBtn.disabled = s.page >= slides.length;
  if (!dlg.open) dlg.showModal();
  if (historyMode === 'push') history.pushState(null, '', `#page-${s.page}`);
  else if (historyMode === 'replace') history.replaceState(null, '', `#page-${s.page}`);
}
function closeViewer() {
  dlg.close();
  currentPage = null;
  if (location.hash.startsWith('#page-')) history.replaceState(null, '', location.pathname + location.search);
}
dlg.querySelector('.close').onclick = closeViewer;
dlg.addEventListener('click', e => { if (e.target === dlg) closeViewer(); });
document.addEventListener('keydown', e => {
  if (!dlg.open) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
});
prevBtn.onclick = () => { const s = byPage.get(currentPage - 1); if (s) openViewer(s, 'replace'); };
nextBtn.onclick = () => { const s = byPage.get(currentPage + 1); if (s) openViewer(s, 'replace'); };
// 모바일: 이미지를 탭하면 확대/축소 토글 (핀치가 익숙하지 않은 학부모 배려)
viewerImage.addEventListener('click', () => viewerImage.classList.toggle('zoomed'));
copyBtn.onclick = async () => {
  const url = location.origin + location.pathname + `#page-${currentPage}`;
  try {
    await navigator.clipboard.writeText(url);
    copyState.textContent = '링크가 복사되었습니다';
  } catch {
    copyState.textContent = url; // 클립보드 API 미지원 시 주소를 직접 표시
  }
};

// 페이지 딥링크: #page-128 로 접속하면 해당 페이지 자동으로 엶
function openFromHash() {
  const m = location.hash.match(/^#page-(\d+)$/);
  if (m) {
    const s = byPage.get(+m[1]);
    if (s) openViewer(s, 'none');
  }
}
window.addEventListener('hashchange', openFromHash);
window.addEventListener('DOMContentLoaded', openFromHash);

/* ---------- 교육용 계산기 ---------- */
function calcFill() {
  const q = +document.getElementById('quota').value || 0, r = +document.getElementById('fillRate').value || 0;
  const n = q * r / 100;
  document.getElementById('fillResult').innerHTML = `단순 환산 시 추가합격 약 <strong>${Math.round(n)}명</strong><br><small>계산값 ${n.toFixed(1)}명 · 최초 모집 ${q}명 기준 · 대학별 공시 기준과 충원 방식에 따라 실제 인원은 달라질 수 있습니다.</small>`;
}
function calcBonus() {
  const s = +document.getElementById('scienceScore').value || 0, r = +document.getElementById('bonusRate').value || 0;
  document.getElementById('bonusResult').innerHTML = `단순 가산 예시값 <strong>${(s * (1 + r / 100)).toFixed(1)}</strong><br><small>실제 대학 환산점수가 아니라, 원자료의 계산 방식을 체험해보는 참고용 수치입니다.</small>`;
}
['quota', 'fillRate'].forEach(id => document.getElementById(id).oninput = calcFill);
['scienceScore', 'bonusRate'].forEach(id => document.getElementById(id).oninput = calcBonus);

/* ---------- 맨 위로 버튼 ---------- */
const topBtn = document.getElementById('toTop');
window.addEventListener('scroll', () => { topBtn.classList.toggle('show', window.scrollY > 700); }, { passive: true });
topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

document.getElementById('denseCount').textContent = slides.filter(s => s.dense).length;
calcFill();
calcBonus();
render();
openFromHash();
