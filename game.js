(() => {
  'use strict';
  const SIZE = 4;
  const SAVE_KEY = 'frogFusion2048.v1';
  const EVOLUTIONS = [
    { name:'Tiny Green Frog', mood:'just happy to be here', color:'#b9f45b', emoji:'🐸', eyes:'normal' },
    { name:'Sleepy Frog', mood:'five more minutes', color:'#b7e9e0', emoji:'😴', eyes:'sleepy' },
    { name:'Chubby Frog', mood:'snack enthusiast', color:'#ffd6a4', emoji:'🍡', cheeks:true },
    { name:'Ninja Frog', mood:'silent but dramatic', color:'#2d3553', emoji:'🥷', ninja:true },
    { name:'Wizard Frog', mood:'licensed toad wizard', color:'#b4a4ff', emoji:'🪄', wizard:true },
    { name:'Disco Frog', mood:'dances without permission', color:'#ffb4d9', emoji:'🪩', disco:true },
    { name:'Cyber Frog', mood:'404 ribbit not found', color:'#7be8ed', emoji:'🤖', cyber:true },
    { name:'Alien Frog', mood:'three eyes, no plans', color:'#c9b4ff', emoji:'👽', alien:true },
    { name:'Dragon Frog', mood:'tiny wings, huge ego', color:'#ff9d80', emoji:'🐲', dragon:true },
    { name:'Cosmic Frog', mood:'contemplates the pond', color:'#30305d', emoji:'🌌', cosmic:true },
    { name:'King Frog', mood:'taxes the mosquitoes', color:'#ffdf76', emoji:'👑', king:true },
    { name:'Ultimate Chaos Frog', mood:'the pond fears it', color:'#f1a6ff', emoji:'🌀', chaos:true }
  ];
  const TIPS = [
    'Keep your highest frog in a corner. Frogs enjoy a consistent address.',
    'Plan two moves ahead. Frogs are terrible at planning, so do it for them.',
    'Try to keep your big frogs together. This is a strictly amphibian family reunion.',
    'Every move spawns a tiny frog. The pond has absolutely no population control.',
    'Don’t panic if the board gets busy. You are the manager of this frog circus.'
  ];
  const $ = (id) => document.getElementById(id);
  let state;
  let soundEnabled = false;
  let audioContext = null;
  let toastTimer = null;
  let lastMoveMerged = false;
  const boardEl = $('board');

  function freshState() {
    const s = { board:Array(SIZE*SIZE).fill(null), score:0, best:state?.best || 0, highest:state?.highest || 0, discovered:state?.discovered ? state.discovered.slice() : [0], merges:0, moves:0, streak:0, won:false, keepPlaying:false, gameOver:false };
    spawnTile(s, true); spawnTile(s, true); return s;
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return freshState();
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.board) || saved.board.length !== 16 || !saved.board.every(v => v === null || (Number.isInteger(v) && v >= 0 && v < EVOLUTIONS.length))) return freshState();
      const s = { ...freshState(), ...saved, board:saved.board.slice(), discovered:Array.isArray(saved.discovered) ? saved.discovered.filter(n => Number.isInteger(n) && n>=0 && n<EVOLUTIONS.length) : [0] };
      s.score = finiteNonnegative(s.score); s.best = Math.max(finiteNonnegative(s.best), s.score); s.highest = Math.max(0, Math.min(EVOLUTIONS.length-1, Number.isInteger(s.highest) ? s.highest : 0));
      s.merges=finiteNonnegative(s.merges); s.moves=finiteNonnegative(s.moves); s.streak=finiteNonnegative(s.streak); s.won=!!s.won; s.keepPlaying=!!s.keepPlaying; s.gameOver=!!s.gameOver;
      s.board.forEach(v => { if (v !== null) { s.highest=Math.max(s.highest,v); if (!s.discovered.includes(v)) s.discovered.push(v); } });
      return s;
    } catch (_) { return freshState(); }
  }
  function finiteNonnegative(v) { return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0; }
  function saveState() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) { /* Private browsing or storage quota: game remains playable. */ } }
  function spawnTile(target=state, forceBasic=false) {
    const empty=[]; target.board.forEach((v,i)=>{if(v===null) empty.push(i);});
    if (!empty.length) return false;
    const index=empty[Math.floor(Math.random()*empty.length)]; target.board[index]=forceBasic ? 0 : (Math.random()<.9 ? 0 : 1); return true;
  }
  function tileSvg(level, compact=false) {
    const e=EVOLUTIONS[level];
    const eye=(x,y,r=4, sleepy=false)=> sleepy
      ? `<path d="M ${x-r} ${y} Q ${x} ${y+2} ${x+r} ${y}" fill="none" stroke="#25352a" stroke-width="2.5" stroke-linecap="round"/>`
      : `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r+1}" fill="#fff"/><circle cx="${x+1}" cy="${y+1}" r="${Math.max(1.7,r*.52)}" fill="#202333"/><circle cx="${x+1.7}" cy="${y+.3}" r="${Math.max(.7,r*.2)}" fill="#fff"/>`;
    let body='#70c84b', accent='#b9f45b', detail='';
    if(level===1){body='#78bdb1';accent='#b7e9e0';}
    if(level===2){body='#edaa62';accent='#ffd6a4';detail='<ellipse cx="50" cy="65" rx="23" ry="16" fill="#fff1d9"/><circle cx="27" cy="54" r="5" fill="#ff8c98"/><circle cx="73" cy="54" r="5" fill="#ff8c98"/>'}
    if(level===3){body='#222b48';accent='#59668e';detail='<path d="M18 29 Q50 7 82 29 L79 37 Q50 20 21 37Z" fill="#ff6d9c"/><path d="M20 30 L80 30" stroke="#ffb1c9" stroke-width="3"/>'}
    if(level===4){body='#7353c9';accent='#b4a4ff';detail='<path d="M25 28 L37 4 L51 22 L66 3 L77 29Z" fill="#ffcf66" stroke="#f9edb0" stroke-width="2"/><path d="M24 29 Q50 22 78 29 L75 36 L27 36Z" fill="#5d3b9d"/>'}
    if(level===5){body='#e65ca7';accent='#ffb4d9';detail='<rect x="22" y="34" width="56" height="15" rx="6" fill="#42265e"/><path d="M27 40 L39 40 M45 40 L57 40 M63 40 L73 40" stroke="#fff36d" stroke-width="4"/><path d="M31 62 Q50 74 69 62" stroke="#fff" stroke-width="3" fill="none"/>'}
    if(level===6){body='#22b8c5';accent='#7be8ed';detail='<path d="M30 45 L36 36 L42 45 L48 36 L54 45 L60 36 L66 45" fill="none" stroke="#f9ff86" stroke-width="3"/><circle cx="34" cy="60" r="3" fill="#e4ff68"/><circle cx="50" cy="65" r="3" fill="#e4ff68"/><circle cx="66" cy="60" r="3" fill="#e4ff68"/><path d="M35 20 L35 29 M50 17 L50 27 M65 20 L65 29" stroke="#f4ff8a" stroke-width="2"/>'}
    if(level===7){body='#8d69d7';accent='#c9b4ff';detail='<circle cx="50" cy="10" r="9" fill="#a4ffef" stroke="#fff" stroke-width="2"/><path d="M50 5V15 M45 10H55" stroke="#2b2459" stroke-width="2"/><path d="M18 47 L25 42 L31 47 M69 47 L75 42 L82 47" fill="none" stroke="#f9a8ff" stroke-width="3"/>'}
    if(level===8){body='#e76a50';accent='#ff9d80';detail='<path d="M28 24 L18 4 L41 19 M72 24 L82 4 L59 19" fill="#ffdb68" stroke="#a43d32" stroke-width="3"/><path d="M31 64 L25 77 L39 70 M69 64 L75 77 L61 70" fill="#ffdc70"/><path d="M37 49 Q50 58 63 49" fill="none" stroke="#6d2727" stroke-width="3"/>'}
    if(level===9){body='#343568';accent='#5558a5';detail='<circle cx="23" cy="21" r="2" fill="#fff4a3"/><circle cx="78" cy="36" r="3" fill="#fff4a3"/><circle cx="30" cy="67" r="2" fill="#fff4a3"/><circle cx="70" cy="69" r="2" fill="#fff4a3"/><path d="M19 47 Q50 25 81 47" fill="none" stroke="#b7a4ff" stroke-width="3"/><path d="M40 54 L44 59 L48 54 L52 59 L56 54 L60 59" fill="none" stroke="#f4dcff" stroke-width="2"/>'}
    if(level===10){body='#c69b25';accent='#ffdf76';detail='<path d="M28 28 L22 8 L40 20 L50 4 L60 20 L78 8 L72 28Z" fill="#ffe36d" stroke="#fff0b0" stroke-width="2.5"/><circle cx="50" cy="14" r="3" fill="#ff6eae"/><path d="M27 60 L18 73 L38 69 L50 80 L62 69 L82 73 L73 60" fill="#d84c72"/>'}
    if(level===11){body='#a83bbd';accent='#f1a6ff';detail='<path d="M26 26 L12 6 L37 19 L50 0 L63 19 L88 6 L74 26Z" fill="#ffcf66" stroke="#fff" stroke-width="2"/><path d="M21 51 Q7 38 13 28 Q30 26 34 44 M79 51 Q93 38 87 28 Q70 26 66 44" fill="#ffcf66" stroke="#ffefff" stroke-width="2"/><path d="M28 67 Q50 84 72 67" stroke="#3c1d54" stroke-width="4" fill="none"/><circle cx="31" cy="47" r="3" fill="#ff6db6"/><circle cx="69" cy="47" r="3" fill="#ff6db6"/>'}
    const eyes = level===1 ? eye(36,39,4,true)+eye(64,39,4,true) : level===7 ? eye(30,36,4)+eye(50,29,4)+eye(70,36,4) : level===11 ? eye(30,37,4)+eye(50,32,4)+eye(70,37,4)+eye(40,47,3)+eye(60,47,3) : eye(36,39,4)+eye(64,39,4);
    const mouth = level===1 ? '<path d="M42 52 Q50 55 58 52" stroke="#25352a" stroke-width="2.5" fill="none" stroke-linecap="round"/>' : level===11 ? '<path d="M36 57 Q50 73 64 57 Q50 63 36 57Z" fill="#4b174f"/><path d="M43 61 L47 65 L51 61 L55 65 L59 61" stroke="#fff" stroke-width="2" fill="none"/>' : '<path d="M40 53 Q50 60 60 53" stroke="#25352a" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    const bg = level===9 ? '#30305d' : e.color;
    const extra = level===11 ? '<path d="M23 72 L12 84 L31 79 M77 72 L88 84 L69 79" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M14 40 L4 34 M86 40 L96 34" stroke="#f8d8ff" stroke-width="3"/>' : level===8 ? '<path d="M29 69 L19 81 L34 76 M71 69 L81 81 L66 76" stroke="#ffd46a" stroke-width="4" stroke-linecap="round"/>' : '';
    return `<svg viewBox="0 0 100 92" role="img" aria-label="${escapeHtml(e.name)}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g${level}" x1="0" y1="0" x2="0.9" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${body}"/></linearGradient></defs>${level===9?'<circle cx="50" cy="49" r="43" fill="#27264c"/>':''}<ellipse cx="50" cy="81" rx="26" ry="5" fill="#000" opacity=".12"/><path d="M18 53 Q12 35 25 28 Q32 15 42 25 Q50 18 58 25 Q70 15 77 28 Q90 35 82 53 Q80 72 50 74 Q20 72 18 53Z" fill="url(#g${level})" stroke="#263a2c" stroke-opacity=".16" stroke-width="2"/>${extra}${detail}<ellipse cx="34" cy="31" rx="13" ry="14" fill="${accent}"/><ellipse cx="66" cy="31" rx="13" ry="14" fill="${accent}"/>${eyes}${mouth}<ellipse cx="50" cy="62" rx="15" ry="7" fill="#fff" opacity=".09"/></svg>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function render() {
    boardEl.innerHTML='';
    state.board.forEach((level,index)=>{
      const cell=document.createElement('div'); cell.className='cell'+(level===null?' empty':''); cell.setAttribute('role','gridcell'); cell.setAttribute('aria-label',level===null?`Empty cell ${index+1}`:EVOLUTIONS[level].name);
      if(level!==null){const tile=document.createElement('div');tile.className=`frog-tile level-${level}`;tile.style.setProperty('--frog-bg',EVOLUTIONS[level].color);tile.innerHTML=tileSvg(level)+`<span class="frog-name">${escapeHtml(EVOLUTIONS[level].name)}</span>`;cell.appendChild(tile);}
      boardEl.appendChild(cell);
    });
    $('score').textContent=state.score.toLocaleString(); $('best').textContent=state.best.toLocaleString();
    $('topFrog').textContent=EVOLUTIONS[state.highest].name; $('topLevel').textContent=`Evolution ${state.highest+1} / ${EVOLUTIONS.length}`;
    $('mergeCount').textContent=state.merges; $('moveCount').textContent=state.moves; $('streakCount').innerHTML=`${state.streak} <small>ribbits</small>`;
    $('guideCount').textContent=`${state.discovered.length} / ${EVOLUTIONS.length}`;
    renderGuide();
    const overlay=$('gameOverlay');
    if(state.won && !state.keepPlaying){showOverlay('win');} else if(state.gameOver){showOverlay('gameover');} else {overlay.classList.add('hidden');}
  }
  function renderGuide(){
    const list=$('evolutionList');list.innerHTML='';
    EVOLUTIONS.forEach((frog,i)=>{
      const unlocked=state.discovered.includes(i), current=state.highest===i;
      const item=document.createElement('div');item.className='evolution-item'+(unlocked?' unlocked':'')+(current?' current':'');
      const thumb=document.createElement('div');thumb.className='evo-thumb';thumb.style.setProperty('--thumb-bg',frog.color);thumb.innerHTML=unlocked?tileSvg(i,true):'<span aria-label="Locked">?</span>';
      const copy=document.createElement('div');copy.className='evo-copy';copy.innerHTML=`<strong>${unlocked?escapeHtml(frog.name):'???'}</strong><small>${unlocked?escapeHtml(frog.mood):`EVOLUTION ${String(i+1).padStart(2,'0')}`}</small>`;
      item.append(thumb,copy);list.appendChild(item);
    });
  }
  function showOverlay(type){
    const o=$('gameOverlay');o.classList.remove('hidden');
    if(type==='win'){$('overlayEmoji').textContent='👑';$('overlayEyebrow').textContent='IMPOSSIBLE SWAMP SCIENCE';$('overlayTitle').textContent='Ultimate chaos achieved!';$('overlayText').textContent='You made the most unreasonably powerful frog. The pond will never recover.';$('continueBtn').classList.remove('hidden');$('overlayRestart').textContent='New pond';}
    else{$('overlayEmoji').textContent='🫠';$('overlayEyebrow').textContent='THE SWAMP HAS SPOKEN';$('overlayTitle').textContent='Pond over!';$('overlayText').textContent='No moves left. The frogs have unionized.';$('continueBtn').classList.add('hidden');$('overlayRestart').textContent='Try again';}
  }
  function compressLine(line){
    const values=line.filter(v=>v!==null),out=[],merged=[];let points=0,mergeCount=0,highest=null;
    for(let i=0;i<values.length;i++){
      if(values[i]===values[i+1] && values[i]<EVOLUTIONS.length-1){const v=values[i]+1;out.push(v);merged.push(out.length-1);points+=Math.pow(2,v+1);mergeCount++;highest=v;i++;}
      else out.push(values[i]);
    }
    while(out.length<SIZE)out.push(null);
    return {line:out,merged,points,mergeCount,highest};
  }
  function move(direction){
    if(state.gameOver || (state.won&&!state.keepPlaying))return;
    const before=state.board.slice(),next=before.slice(),mergedCells=[];let gained=0,merges=0,highestNew=null;
    for(let lineIndex=0;lineIndex<SIZE;lineIndex++){
      const indexes=[];
      for(let offset=0;offset<SIZE;offset++){
        let r,c;
        if(direction==='left'){r=lineIndex;c=offset;}
        if(direction==='right'){r=lineIndex;c=SIZE-1-offset;}
        if(direction==='up'){r=offset;c=lineIndex;}
        if(direction==='down'){r=SIZE-1-offset;c=lineIndex;}
        indexes.push(r*SIZE+c);
      }
      const result=compressLine(indexes.map(i=>before[i]));
      indexes.forEach((cellIndex,j)=>{next[cellIndex]=result.line[j];if(result.merged.includes(j))mergedCells.push(cellIndex);});
      gained+=result.points;merges+=result.mergeCount;if(result.highest!==null)highestNew=Math.max(highestNew??0,result.highest);
    }
    if(next.every((v,i)=>v===before[i]))return;
    state.board=next;state.score+=gained;state.best=Math.max(state.best,state.score);state.moves++;state.merges+=merges;state.streak=merges?state.streak+merges:0;lastMoveMerged=merges>0;
    if(merges){playSound('merge');$('scoreDelta').textContent=`+${gained}`;setTimeout(()=>$('scoreDelta').textContent='',850);}else{playSound('move');}
    if(highestNew!==null){for(let i=0;i<state.board.length;i++){if(state.board[i]!==null)state.highest=Math.max(state.highest,state.board[i]);}const newly=[];for(let i=0;i<state.board.length;i++){const v=state.board[i];if(v!==null&&!state.discovered.includes(v)){state.discovered.push(v);newly.push(v);}}
      if(newly.length){const level=Math.max(...newly);showDiscovery(level);playSound('discover');}
    }
    spawnTile();
    if(state.board.some(v=>v===EVOLUTIONS.length-1)&&!state.won){state.won=true;state.keepPlaying=false;}
    state.gameOver=!canMove(state.board);
    saveState();render();animateMerges(mergedCells);
    if(state.gameOver){playSound('over');}
    if(state.won&&!state.keepPlaying)confetti();
  }
  function canMove(board){if(board.some(v=>v===null))return true;for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const i=r*SIZE+c;if(c<SIZE-1&&board[i]===board[i+1]&&board[i]<EVOLUTIONS.length-1)return true;if(r<SIZE-1&&board[i]===board[i+SIZE]&&board[i]<EVOLUTIONS.length-1)return true;}return false;}
  function animateMerges(indices){indices.forEach(i=>{const cell=boardEl.children[i];const tile=cell?.querySelector('.frog-tile');if(tile){tile.classList.add('merged');const pop=document.createElement('span');pop.className='merge-pop';pop.textContent='✦';tile.appendChild(pop);setTimeout(()=>pop.remove(),500);}});}
  function showDiscovery(level){$('discoveryEmoji').textContent=EVOLUTIONS[level].emoji;$('discoveryName').textContent=EVOLUTIONS[level].name;const toast=$('discoveryToast');toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2700);}
  function confetti(){const wrap=$('.game-board-wrap');for(let i=0;i<22;i++){const bit=document.createElement('span');bit.className='confetti';bit.textContent=['✦','✧','●','🐸'][i%4];bit.style.left=`${8+Math.random()*84}%`;bit.style.top=`${15+Math.random()*55}%`;bit.style.setProperty('--dx',`${(Math.random()-.5)*150}px`);bit.style.setProperty('--dy',`${-35-Math.random()*100}px`);wrap.appendChild(bit);setTimeout(()=>bit.remove(),850);}}
  function restart(confirmIt=true){if(confirmIt&&!window.confirm('Start a fresh pond? Your current board and score will be lost, but your best score stays safe.'))return;const best=state.best;state=freshState();state.best=best;saveState();render();$('scoreDelta').textContent='';}
  function toggleSound(){soundEnabled=!soundEnabled;$('soundBtn').setAttribute('aria-pressed',String(soundEnabled));$('soundBtn').setAttribute('aria-label',soundEnabled?'Turn sound off':'Turn sound on');$('soundBtn').title=soundEnabled?'Sound on':'Sound off';$('soundBtn').innerHTML=`♫ <span>${soundEnabled?'Sound on':'Sound off'}</span>`;if(soundEnabled)playSound('move');}
  function playSound(kind){if(!soundEnabled)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;const notes=kind==='merge'?[440,660]:kind==='discover'?[523,659,784]:kind==='over'?[330,247]:[280];notes.forEach((freq,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=kind==='discover'?'sine':'triangle';osc.frequency.setValueAtTime(freq,now+i*.075);gain.gain.setValueAtTime(.0001,now+i*.075);gain.gain.exponentialRampToValueAtTime(.07,now+i*.075+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.075+.13);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+i*.075);osc.stop(now+i*.075+.15);});}catch(_){/* Audio is optional and browser-dependent. */}}
  function openHelp(){const d=$('helpDialog');if(typeof d.showModal==='function')d.showModal();else alert('Use arrow keys or WASD to move. Merge identical frogs.');}
  function init(){state=loadState();render();$('restartBtn').addEventListener('click',()=>restart(true));$('overlayRestart').addEventListener('click',()=>restart(false));$('continueBtn').addEventListener('click',()=>{state.keepPlaying=true;state.gameOver=false;saveState();render();});$('soundBtn').addEventListener('click',toggleSound);$('helpBtn').addEventListener('click',openHelp);$('helpDone').addEventListener('click',()=>$('helpDialog').close());$('newTipBtn').addEventListener('click',()=>{let idx=Math.floor(Math.random()*TIPS.length);if(TIPS[idx]===$('tipText').textContent)idx=(idx+1)%TIPS.length;$('tipText').textContent=TIPS[idx];});document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.move)));
    window.addEventListener('keydown',e=>{if($('helpDialog').open)return;const target=e.target;if(target instanceof HTMLElement && (target.isContentEditable||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(target.tagName)&&target!==document.body))return;const k=e.key.toLowerCase();const map={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};if(map[k]){e.preventDefault();move(map[k]);}else if(k===' '){e.preventDefault();}else if(k==='r'){e.preventDefault();restart(true);}else if(k==='?'||k==='h'){openHelp();}});
    let touchStart=null;boardEl.addEventListener('touchstart',e=>{if(e.changedTouches.length)touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});boardEl.addEventListener('touchend',e=>{if(!touchStart||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))move(dx>0?'right':'left');else move(dy>0?'down':'up');},{passive:true});
  }
  init();
})();
