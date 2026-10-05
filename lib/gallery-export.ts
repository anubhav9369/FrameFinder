// Builds ONE self-contained HTML string for the client gallery file:
// inline CSS + JS, zero external requests, no localStorage (file://
// persistence is unreliable) — selection stays in memory only.

import { SELECTION_HEADER } from '@/lib/selection-codec';

export interface GalleryFolder {
  id: string;
  name: string;
}

export interface GalleryPhoto {
  folderId: string;
  folderName: string;
  filename: string;
  dataUrl: string;
}

export interface GalleryOptions {
  eventName: string;
  photographerWhatsapp: string;
  folders: GalleryFolder[];
  photos: GalleryPhoto[];
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escJs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/</g, '\\u003c');
}

export function buildClientGalleryHtml(opts: GalleryOptions): string {
  const folderNames: Record<string, string> = {};
  for (const f of opts.folders) folderNames[f.id] = f.name;

  const data = {
    folders: opts.folders.map((f) => ({ id: f.id, name: f.name })),
    photos: opts.photos.map((p) => ({
      f: p.folderId,
      fn: p.folderName,
      n: p.filename,
      u: p.dataUrl,
    })),
  };
  // JSON is embedded inside a <script type="application/json"> tag; escape
  // '<' so a stray "</script>" in user content can never break the file.
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(opts.eventName)} — Select your photos</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-height:100vh}
header{position:sticky;top:0;z-index:20;background:rgba(9,9,11,.92);backdrop-filter:blur(8px);border-bottom:1px solid #27272a;padding:14px 16px}
.hrow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
h1{font-size:18px;font-weight:700}
.count{background:#fbbf24;color:#09090b;font-weight:700;font-size:13px;padding:4px 12px;border-radius:999px}
.note{font-size:12px;color:#a1a1aa;margin-top:6px}
.tabs{display:flex;gap:8px;overflow-x:auto;padding:12px 16px;position:sticky;top:73px;z-index:10;background:#09090b}
.tab{flex:none;border:1px solid #3f3f46;background:#18181b;color:#e4e4e7;border-radius:999px;padding:8px 16px;font-size:14px;cursor:pointer}
.tab.active{background:#fbbf24;border-color:#fbbf24;color:#09090b;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;padding:4px 16px 120px}
.cell{position:relative;border-radius:10px;overflow:hidden;background:#18181b;cursor:pointer;aspect-ratio:1}
.cell img{width:100%;height:100%;object-fit:cover;display:block}
.cell.starred{outline:3px solid #fbbf24}
.star{position:absolute;top:6px;right:6px;width:34px;height:34px;border-radius:999px;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.cell.starred .star{background:#fbbf24;color:#09090b}
.cap{position:absolute;left:0;right:0;bottom:0;padding:18px 8px 6px;font-size:11px;color:#e4e4e7;background:linear-gradient(transparent,rgba(0,0,0,.8));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.footer{position:fixed;left:0;right:0;bottom:0;z-index:30;background:rgba(9,9,11,.95);border-top:1px solid #27272a;padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center}
.btn{border:none;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer}
.btn.primary{background:#fbbf24;color:#09090b}
.btn.primary:disabled{opacity:.4;cursor:not-allowed}
.btn.ghost{background:#27272a;color:#e4e4e7}
.btn.danger{background:#7f1d1d;color:#fecaca}
#lb{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.94);display:none;flex-direction:column}
#lb.open{display:flex}
#lbimgwrap{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:12px}
#lbimg{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px}
#lbbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;background:#111}
#lbcap{font-size:14px;color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lbbtn{border:none;background:#27272a;color:#fff;border-radius:10px;padding:10px 14px;font-size:16px;cursor:pointer}
.lbbtn.star-on{background:#fbbf24;color:#09090b}
#modal{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;padding:20px}
#modal.open{display:flex}
.mbox{background:#18181b;border:1px solid #3f3f46;border-radius:14px;max-width:440px;width:100%;padding:22px}
.mbox h2{font-size:18px;margin-bottom:10px}
.mbox p{font-size:14px;color:#d4d4d8;margin-bottom:8px}
.mbox .row{display:flex;gap:10px;margin-top:16px}
.sent{background:#052e16;border:1px solid #166534;color:#bbf7d0;border-radius:12px;padding:16px;margin:12px 16px;display:none}
.sent.open{display:block}
.sent h2{font-size:16px;margin-bottom:6px}
.sent p{font-size:13px}
#filein{display:none}
</style>
</head>
<body>
<header>
  <div class="hrow">
    <h1>${escHtml(opts.eventName)}</h1>
    <span class="count" id="count">0 selected</span>
  </div>
  <p class="note">Tap a photo to preview, tap the star to pick it. Picks stay in memory while this gallery is open — save a progress file before closing.</p>
</header>
<div class="sent" id="sentbox">
  <h2>Selection sent ✓</h2>
  <p>Your picks were sent to the photographer on WhatsApp and a backup file was downloaded. You can revise below if you change your mind.</p>
  <div style="margin-top:10px"><button class="btn ghost" onclick="revise()">Revise selection</button></div>
</div>
<div class="tabs" id="tabs"></div>
<div class="grid" id="grid"></div>
<div class="footer" id="footerbar">
  <button class="btn ghost" onclick="saveProgress()">Save progress</button>
  <button class="btn ghost" onclick="document.getElementById('filein').click()">Resume progress</button>
  <button class="btn primary" id="finishbtn" onclick="finishOpen()" disabled>Finish selection</button>
</div>
<input type="file" id="filein" accept="application/json,.json" onchange="resumeProgress(this)">
<div id="lb">
  <div id="lbimgwrap" onclick="lbBackdrop(event)"><img id="lbimg" alt=""></div>
  <div id="lbbar">
    <button class="lbbtn" onclick="lbNav(-1)">‹</button>
    <span id="lbcap"></span>
    <button class="lbbtn" id="lbstar" onclick="lbStar()">☆</button>
    <button class="lbbtn" onclick="lbNav(1)">›</button>
    <button class="lbbtn" onclick="closeLb()">✕</button>
  </div>
</div>
<div id="modal"><div class="mbox">
  <h2>Confirm your selection</h2>
  <div id="summary"></div>
  <p style="color:#a1a1aa;font-size:13px">Confirming opens WhatsApp with your pick list addressed to the photographer, and downloads a backup file.</p>
  <div class="row">
    <button class="btn ghost" onclick="closeModal()">Back</button>
    <button class="btn primary" onclick="finishConfirm()">Send via WhatsApp</button>
  </div>
</div></div>
<script type="application/json" id="ffdata">${dataJson}</script>
<script>
var WA = '${escJs(opts.photographerWhatsapp.replace(/[^0-9]/g, ''))}';
var DATA = JSON.parse(document.getElementById('ffdata').textContent);
var FOLDERNAME = {};
DATA.folders.forEach(function(f){ FOLDERNAME[f.id] = f.name; });
var active = 'all';
var starred = {};
var lbList = [];
var lbPos = 0;

function el(id){ return document.getElementById(id); }
function photoAt(i){ return DATA.photos[i]; }
function isStarred(i){ return !!starred[i]; }

function filtered(){
  var out = [];
  for (var i = 0; i < DATA.photos.length; i++){
    if (active === 'all' || DATA.photos[i].f === active) out.push(i);
  }
  return out;
}

function renderTabs(){
  var t = el('tabs');
  var html = '<button class="tab' + (active === 'all' ? ' active' : '') + '" onclick="setTab(\\'all\\')">All</button>';
  DATA.folders.forEach(function(f){
    html += '<button class="tab' + (active === f.id ? ' active' : '') + '" onclick="setTab(\\'' + f.id + '\\')">' + escName(f.name) + '</button>';
  });
  t.innerHTML = html;
}
function setTab(id){ active = id; renderTabs(); renderGrid(); }

function escName(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderGrid(){
  var g = el('grid');
  var list = filtered();
  var html = '';
  list.forEach(function(i){
    var p = photoAt(i);
    var cap = escName(p.fn) + ' · ' + escName(p.n);
    html += '<div class="cell' + (isStarred(i) ? ' starred' : '') + '" data-i="' + i + '" onclick="openLb(' + i + ')">'
      + '<img src="' + p.u + '" alt="" loading="lazy">'
      + '<button class="star" onclick="toggleStar(' + i + ',event)">' + (isStarred(i) ? '★' : '☆') + '</button>'
      + '<div class="cap">' + cap + '</div></div>';
  });
  g.innerHTML = html || '<p style="color:#a1a1aa;padding:20px">No photos in this folder.</p>';
  updateCount();
}

function updateCount(){
  var n = Object.keys(starred).length;
  el('count').textContent = n + ' selected';
  el('finishbtn').disabled = n === 0;
}

function toggleStar(i, ev){
  if (ev) ev.stopPropagation(); // grid star taps must not open the lightbox
  if (isStarred(i)) delete starred[i]; else starred[i] = true;
  renderGrid();
  if (el('lb').classList.contains('open')) paintLb();
}

function openLb(i){
  lbList = filtered();
  lbPos = lbList.indexOf(i);
  if (lbPos < 0) lbPos = 0;
  el('lb').classList.add('open');
  document.body.style.overflow = 'hidden';
  paintLb();
}
function paintLb(){
  var i = lbList[lbPos];
  var p = photoAt(i);
  el('lbimg').src = p.u;
  el('lbcap').textContent = p.fn + ' · ' + p.n + '  (' + (lbPos + 1) + '/' + lbList.length + ')';
  el('lbstar').textContent = isStarred(i) ? '★' : '☆';
  el('lbstar').className = 'lbbtn' + (isStarred(i) ? ' star-on' : '');
}
function lbNav(d){
  lbPos = (lbPos + d + lbList.length) % lbList.length;
  paintLb();
}
function lbStar(){ toggleStar(lbList[lbPos], null); }
function lbBackdrop(ev){ if (ev.target === ev.currentTarget) closeLb(); }
function closeLb(){ el('lb').classList.remove('open'); document.body.style.overflow = ''; }
document.addEventListener('keydown', function(e){
  if (!el('lb').classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  else if (e.key === 'ArrowRight') lbNav(1);
  else if (e.key === 'ArrowLeft') lbNav(-1);
});

function picks(){
  return Object.keys(starred).map(function(k){ return parseInt(k, 10); }).sort(function(a,b){ return a-b; });
}

function saveProgress(){
  var list = picks().map(function(i){
    var p = photoAt(i);
    return { folder: p.fn, filename: p.n };
  });
  var blob = new Blob([JSON.stringify({ event: '${escJs(opts.eventName)}', picks: list }, null, 2)], { type: 'application/json' });
  dl(URL.createObjectURL(blob), 'framefinder-progress.json');
}

function resumeProgress(input){
  var f = input.files && input.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(){
    try {
      var obj = JSON.parse(r.result);
      var arr = obj.picks || obj;
      var restored = 0;
      starred = {};
      arr.forEach(function(it){
        for (var i = 0; i < DATA.photos.length; i++){
          var p = DATA.photos[i];
          if (p.fn === it.folder && p.n === it.filename){ starred[i] = true; restored++; break; }
        }
      });
      renderGrid();
      alert(restored + ' picks restored from the progress file.');
    } catch(e){ alert('Could not read that file.'); }
  };
  r.readAsText(f);
  input.value = '';
}

function finishOpen(){
  var list = picks();
  if (!list.length) return;
  var per = {};
  list.forEach(function(i){
    var p = photoAt(i);
    per[p.fn] = (per[p.fn] || 0) + 1;
  });
  var html = '';
  Object.keys(per).forEach(function(fn){
    html += '<p><strong>' + escName(fn) + '</strong> — ' + per[fn] + ' photo' + (per[fn] > 1 ? 's' : '') + '</p>';
  });
  html += '<p><strong>Total: ' + list.length + ' photos</strong></p>';
  el('summary').innerHTML = html;
  el('modal').classList.add('open');
}
function closeModal(){ el('modal').classList.remove('open'); }

function finishConfirm(){
  var list = picks();
  var lines = list.map(function(i){
    var p = photoAt(i);
    return p.fn + ' | ' + p.n;
  });
  var encoded = '${escJs(SELECTION_HEADER)}\\n' + lines.join('\\n');
  closeModal();
  dl(URL.createObjectURL(new Blob([encoded], { type: 'text/plain' })), 'framefinder-selection.txt');
  if (WA){
    var intro = 'I\\u0027ve finished selecting photos — ' + list.length + ' photos selected';
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(intro + '\\n\\n' + encoded), '_blank');
  } else {
    alert('Your backup selection file was downloaded. Add the photographer\\u0027s WhatsApp number in Studio settings to send it directly.');
  }
  el('sentbox').classList.add('open');
  el('footerbar').style.display = 'none';
}

function revise(){
  el('sentbox').classList.remove('open');
  el('footerbar').style.display = 'flex';
}

function dl(href, name){
  var a = document.createElement('a');
  a.href = href; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(href); }, 500);
}

renderTabs();
renderGrid();
</script>
</body>
</html>`;
}
