'use strict';
const VERSION='0.2';
const STORAGE='hiraganada-progress-v02';
const LEGACY_KEYS=['hiraganada-progress-v01','hiragana-darabasasa-v1','hiragana-darabasasa-v01'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app');
const now=()=>Date.now();
const localDay=()=>{const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};

// Curriculum: Stage 1 follows the standard gojuon row order; を and ん are intentionally deferred.
const BASIC_GROUPS=[
  ['あ행',['あ','い','う','え','お'],['아','이','우','에','오']],
  ['か행',['か','き','く','け','こ'],['카','키','쿠','케','코']],
  ['さ행',['さ','し','す','せ','そ'],['사','시','스','세','소']],
  ['た행',['た','ち','つ','て','と'],['타','치','츠','테','토']],
  ['な행',['な','に','ぬ','ね','の'],['나','니','누','네','노']],
  ['は행',['は','ひ','ふ','へ','ほ'],['하','히','후','헤','호']],
  ['ま행',['ま','み','む','め','も'],['마','미','무','메','모']],
  ['や행',['や','ゆ','よ'],['야','유','요']],
  ['ら행',['ら','り','る','れ','ろ'],['라','리','루','레','로']],
  ['わ행',['わ'],['와']]
];
const DAK_GROUPS=[
  ['が행',['が','ぎ','ぐ','げ','ご'],['가','기','구','게','고']],
  ['ざ행',['ざ','じ','ず','ぜ','ぞ'],['자','지','즈','제','조']],
  ['だ행',['だ','ぢ','づ','で','ど'],['다','지','즈','데','도']],
  ['ば행',['ば','び','ぶ','べ','ぼ'],['바','비','부','베','보']],
  ['ぱ행',['ぱ','ぴ','ぷ','ぺ','ぽ'],['파','피','푸','페','포']]
];
const YOON=[
  ['きゃ','캬'],['きゅ','큐'],['きょ','쿄'],['しゃ','샤'],['しゅ','슈'],['しょ','쇼'],['ちゃ','챠'],['ちゅ','츄'],['ちょ','쵸'],
  ['にゃ','냐'],['にゅ','뉴'],['にょ','뇨'],['ひゃ','햐'],['ひゅ','휴'],['ひょ','효'],['みゃ','먀'],['みゅ','뮤'],['みょ','묘'],
  ['りゃ','랴'],['りゅ','류'],['りょ','료'],['ぎゃ','갸'],['ぎゅ','규'],['ぎょ','교'],['じゃ','쟈'],['じゅ','쥬'],['じょ','죠'],
  ['びゃ','뱌'],['びゅ','뷰'],['びょ','뵤'],['ぴゃ','퍄'],['ぴゅ','퓨'],['ぴょ','표']
];
const WORDS=[
  ['あめ','아메','비','🌧️'],['いぬ','이누','개','🐶'],['ねこ','네코','고양이','🐱'],['うみ','우미','바다','🌊'],['やま','야마','산','⛰️'],
  ['そら','소라','하늘','☁️'],['はな','하나','꽃','🌷'],['ほし','호시','별','⭐'],['つき','츠키','달','🌙'],['いえ','이에','집','🏠'],
  ['みず','미즈','물','💧'],['さかな','사카나','물고기','🐟'],['とり','토리','새','🐦'],['くるま','쿠루마','자동차','🚗'],['すし','스시','초밥','🍣'],
  ['かさ','카사','우산','☂️'],['あさ','아사','아침','🌅']
];
// Stage 4 is the first place where small っ and ん words appear.
const SPECIAL=[
  ['きって','킷테','우표','🏷️'],['がっこう','각코우','학교','🏫'],['ざっし','잣시','잡지','📖'],['ほん','혼','책','📚'],['ぱん','팡','빵','🍞'],
  ['みかん','미캉','귤','🍊'],['にほん','니혼','일본','🇯🇵'],['でんしゃ','덴샤','전철','🚃'],['りんご','링고','사과','🍎']
];

const items=[];
BASIC_GROUPS.forEach(([group,jp,ko],gi)=>jp.forEach((x,i)=>items.push({id:`b-${x}`,jp:x,ko:ko[i],stage:1,group,groupIndex:gi,kind:'kana'})));
DAK_GROUPS.forEach(([group,jp,ko],gi)=>jp.forEach((x,i)=>items.push({id:`d-${x}`,jp:x,ko:ko[i],stage:2,group,groupIndex:gi,kind:'kana'})));
YOON.forEach(([jp,ko],i)=>items.push({id:`y-${jp}`,jp,ko,stage:2,group:'조합음',groupIndex:DAK_GROUPS.length+Math.floor(i/9),kind:'combo'}));
WORDS.forEach(([jp,ko,meaning,emoji])=>items.push({id:`w-${jp}`,jp,ko,meaning,emoji,stage:3,group:'단어',groupIndex:0,kind:'word'}));
SPECIAL.forEach(([jp,ko,meaning,emoji])=>items.push({id:`s-${jp}`,jp,ko,meaning,emoji,stage:4,group:'っ · ん',groupIndex:0,kind:'word'}));

const defaultMastery=()=>({seen:0,correct:0,wrong:0,streak:0,level:0,lastSeen:0,nextDue:0,mismatch:0,exposures:0});
const fresh=()=>({version:VERSION,profile:null,mastery:{},sessions:[],today:{date:localDay(),answered:0,correct:0,newLearned:[],mastered:[]},selectedStage:1,unlockedStage:1,sound:true,bgm:true,bgmTrack:0,reminder:{time:'18:30',days:'daily'},lastRoute:'home'});
function normalizeLegacyId(id){if(/^b[^-]/.test(id))return 'b-'+id.slice(1);if(/^d[^-]/.test(id))return 'd-'+id.slice(1);if(/^c[^-]/.test(id))return 'y-'+id.slice(1);if(/^w[^-]/.test(id))return 'w-'+id.slice(1);if(/^s[^-]/.test(id))return 's-'+id.slice(1);return id}
function migrateLegacy(parsed){const d={...fresh(),...parsed,version:VERSION};d.mastery={};Object.entries(parsed.mastery||{}).forEach(([id,m])=>{d.mastery[normalizeLegacyId(id)]={...defaultMastery(),...m,level:Number.isFinite(m.level)?m.level:(m.mastery||0),exposures:m.exposures||m.seen||0}});d.sessions=Array.isArray(parsed.sessions)?parsed.sessions:[];return d}
function load(){try{let raw=localStorage.getItem(STORAGE),parsed;if(raw){parsed=JSON.parse(raw)}else{for(const key of LEGACY_KEYS){const legacy=localStorage.getItem(key);if(legacy){parsed=migrateLegacy(JSON.parse(legacy));break}}}if(!parsed)return fresh();const d=parsed.version===VERSION?{...fresh(),...parsed}:migrateLegacy(parsed);d.mastery=d.mastery&&typeof d.mastery==='object'?d.mastery:{};d.sessions=Array.isArray(d.sessions)?d.sessions:[];if(!d.today||d.today.date!==localDay())d.today=fresh().today;return d}catch(e){console.warn('saved data reset',e);return fresh()}}
let data=load();
function save(){try{data.version=VERSION;localStorage.setItem(STORAGE,JSON.stringify(data))}catch(e){console.warn('save failed',e);toast('저장 공간을 확인해줘')}}
function mFor(id){return {...defaultMastery(),...(data.mastery[id]||{})}}

// ---------- Retro audio engine: 50 original, calm 8/16-bit adventure loops ----------
// No copyrighted melodies or external audio files are used. Everything is synthesized in Web Audio.
let audioCtx=null;
function audioContext(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}}
function tone(freq,dur=0.08,type='square',gain=.030,delay=0){if(!data.sound)return;const c=audioContext();if(!c)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.03)}
const sfx={
 tap(){tone(520,.025,'square',.014)},
 correct(){tone(659,.055,'square',.026);tone(880,.07,'triangle',.030,.055);tone(1175,.12,'sine',.025,.12)},
 wrong(){tone(220,.09,'triangle',.022);tone(174,.11,'sine',.018,.07)},
 catch(){tone(460,.025,'square',.018);tone(720,.045,'square',.020,.025)},
 jump(){tone(330,.035,'triangle',.018);tone(550,.055,'square',.020,.04)},
 complete(){[523,659,784,988,1175].forEach((f,i)=>tone(f,.14,i<3?'square':'triangle',.027,i*.095));tone(1568,.28,'sine',.020,.50)}
};

// The 50 BGM tracks are deterministic original compositions made from five scales,
// ten motif families, changing roots, tempos, rhythm masks and cadences.
const BGM_NAMES=[
 'Quiet Harbor','Paper Compass','Little Trade Wind','Morning Port','Blue Map','Tea on Deck','Cloud Route','Pocket Sextant','Soft Lantern','Sailor’s Nap',
 'Mossy Pier','Ivory Horizon','Tiny Caravan','Old Post Road','Calm Current','Moonlit Market','Pebble Coast','Wooden Wheel','Distant Bell','Green Cape',
 'Mapmaker’s Room','Small Adventure','Amber Sea','Rainy Quay','Feather Flag','Slow Meridian','Homebound Sail','Gentle Bazaar','Secret Inlet','Sunny Logbook',
 'Quiet Archipelago','Windmill Bay','Mint Horizon','Daybreak Dock','Little North Star','Soft Expedition','Canvas Sail','Evening Ferry','Warm Lighthouse','Pocket Ocean',
 'Sleepy Harbor','Sea Glass','Tiny Frontier','Calm Monsoon','Map & Cocoa','Island Letter','Soft Helm','Dawn Anchorage','Old Compass','Home Port'
];
const SCALES=[[0,2,4,7,9],[0,2,3,7,9],[0,2,5,7,9],[0,3,5,7,10],[0,2,4,6,9]];
const MOTIFS=[
 [0,1,2,1,3,2,1,0],[0,2,1,3,2,4,3,1],[0,1,3,2,1,2,4,2],[0,3,2,1,2,3,1,0],[0,2,4,3,2,1,2,0],
 [0,1,2,4,3,2,1,3],[0,3,1,2,4,2,1,0],[0,2,3,1,4,3,2,1],[0,1,4,2,3,1,2,0],[0,3,4,2,1,3,2,0]
];
function mkBgmTrack(i){const root=[45,48,50,52,53,55,57,43,47,49][i%10],scale=SCALES[Math.floor(i/10)%SCALES.length],motif=MOTIFS[i%10],bpm=[76,80,84,88,72,78,82,86,74,90][i%10]+Math.floor(i/10)*2;const shift=Math.floor(i/10)%5;const melody=motif.map((n,j)=>scale[(n+shift+j%3)%scale.length]+(j===6&&i%4===0?12:0));const bass=[0,0,3,0,4,0,3,0].map(n=>scale[n%scale.length]-12);return {name:BGM_NAMES[i],root,bpm,melody,bass,wave:i%3===0?'triangle':'square'}}
const BGM_TRACKS=Array.from({length:50},(_,i)=>mkBgmTrack(i));
const midiHz=n=>440*Math.pow(2,(n-69)/12);
const bgm={timer:null,nextAt:0,step:0,nodes:new Set(),gain:null,
 ensure(){const c=audioContext();if(!c)return null;if(!this.gain){this.gain=c.createGain();this.gain.gain.value=.016;this.gain.connect(c.destination)}return c},
 note(midi,dur,wave='triangle',vol=.018,when=0){const c=this.ensure();if(!c||!data.bgm)return;const o=c.createOscillator(),g=c.createGain(),t=when||c.currentTime;o.type=wave;o.frequency.setValueAtTime(midiHz(midi),t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+dur+.03);this.nodes.add(o);o.onended=()=>this.nodes.delete(o)},
 schedule(){const c=this.ensure();if(!c||!data.bgm)return;const tr=BGM_TRACKS[(data.bgmTrack||0)%50],beat=60/tr.bpm/2;while(this.nextAt<c.currentTime+.45){const s=this.step%16,mi=tr.melody[s%8],bi=tr.bass[Math.floor(s/2)%8];if(s%2===0)this.note(tr.root+bi,beat*1.8,'sine',.012,this.nextAt);if(![3,7,11,15].includes(s)||s===15)this.note(tr.root+mi,beat*.82,tr.wave,.016,this.nextAt);if(s%4===2)this.note(tr.root+12+tr.melody[(s+3)%8],beat*.45,'triangle',.006,this.nextAt);this.nextAt+=beat;this.step++}},
 start(){if(!data.bgm)return;const c=this.ensure();if(!c)return;this.stop(false);this.nextAt=c.currentTime+.06;this.step=0;this.schedule();this.timer=setInterval(()=>this.schedule(),120)},
 stop(kill=true){if(this.timer){clearInterval(this.timer);this.timer=null}if(kill){this.nodes.forEach(n=>{try{n.stop()}catch{}});this.nodes.clear()}},
 toggle(){data.bgm=!data.bgm;save();if(data.bgm){this.start();sfx.tap()}else this.stop()},
 next(){data.bgmTrack=((data.bgmTrack||0)+1)%50;save();if(data.bgm)this.start();sfx.tap();toast(`♪ ${BGM_TRACKS[data.bgmTrack].name} · ${data.bgmTrack+1}/50`)},
 title(){return BGM_TRACKS[(data.bgmTrack||0)%50].name}
};
document.addEventListener('pointerdown',()=>audioContext(),{once:true});

function toast(msg){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),1700)}
function top(title,back='home'){return `<header class="top"><button class="back" data-go="${back}" aria-label="뒤로">‹</button><strong>${esc(title)}<div class="ver">HIRAGANADA ver${VERSION}</div></strong><button class="sound" data-sound aria-label="효과음">${data.sound?'🔊':'🔇'}</button></header>`}
function gameTop(title,back='home'){return `<header class="top gamehead"><button class="back" data-go="${back}" aria-label="뒤로">‹</button><strong>${esc(title)}<div class="ver">HIRAGANADA ver${VERSION}</div><div class="bgmmini"><button data-bgm aria-label="BGM 켜기 또는 끄기">${data.bgm?'● BGM':'○ BGM'}</button><button data-nextbgm aria-label="다른 BGM">↻</button></div></strong><span class="headspacer"></span></header>`}
const credit=()=>`<footer class="devcredit">Developed by Jiho · Made for Sunny, Shiny &amp; Dolphin.</footer>`;
function bindGlobal(){const sb=$('[data-sound]');if(sb)sb.onclick=()=>{data.sound=!data.sound;save();if(data.sound)sfx.correct();renderCurrent()};const bb=$('[data-bgm]');if(bb)bb.onclick=e=>{e.stopPropagation();bgm.toggle();bb.textContent=data.bgm?'● BGM':'○ BGM'};const nb=$('[data-nextbgm]');if(nb)nb.onclick=e=>{e.stopPropagation();bgm.next()}}
function go(screen){if(!['rain','jump'].includes(screen))bgm.stop();sfx.tap();data.lastRoute=screen;save();if(screen==='home')renderHome();else if(screen==='map')renderMap();else if(screen==='rain')startGame('rain');else if(screen==='jump')startGame('jump');else if(screen==='parent')renderParent();else if(screen==='settings')renderSettings();else renderHome()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});
function renderCurrent(){if(!data.profile)return renderWelcome();const route=data.lastRoute||'home';if(['home','map','parent','settings'].includes(route))go(route);else renderHome()}

function renderWelcome(){data.lastRoute='welcome';app.innerHTML=`<main class="page welcome"><div class="logo">HIRAGANADA ver${VERSION}</div><div class="hero">🐸</div><h1>히라가나다라마바사</h1><p>개구리와 놀다 보면<br>히라가나가 머릿속에 쏙!</p><section class="card"><label>내 이름은?</label><input id="name" placeholder="이름을 적어줘" maxlength="10" autocomplete="off"><label>내 친구를 골라줘</label><div class="frogpick">${['🐸','🐢','🐧','🦊'].map((f,i)=>`<button data-frog="${f}" class="${i===0?'on':''}">${f}</button>`).join('')}</div></section><button id="start" class="primary">모험 시작하기 →</button><small>학습 기록은 이 iPhone 안에 저장돼.</small></main>`;let frog='🐸';$$('[data-frog]').forEach(b=>b.onclick=()=>{sfx.tap();frog=b.dataset.frog;$$('[data-frog]').forEach(x=>x.classList.remove('on'));b.classList.add('on')});$('#start').onclick=()=>{sfx.correct();data.profile={name:$('#name').value.trim()||'히라가나 용사',frog,createdAt:now()};data.lastRoute='home';save();renderHome()}}

function stageItems(n){return items.filter(x=>x.stage===n)}
function masteredCount(n){return stageItems(n).filter(x=>mFor(x.id).level>=3).length}
function currentGroupIndex(stage){if(stage===1){for(let gi=0;gi<BASIC_GROUPS.length;gi++){const g=stageItems(1).filter(x=>x.groupIndex===gi);if(g.some(x=>mFor(x.id).level<1))return gi}return BASIC_GROUPS.length-1}
 if(stage===2){const groups=[...new Set(stageItems(2).map(x=>x.groupIndex))].sort((a,b)=>a-b);for(const gi of groups){const g=stageItems(2).filter(x=>x.groupIndex===gi);if(g.some(x=>mFor(x.id).level<1))return gi}return groups.at(-1)||0}return 0}
function activePool(stage){if(stage===1||stage===2){const gi=currentGroupIndex(stage);const prev=Math.max(0,gi-1);return stageItems(stage).filter(x=>x.groupIndex===gi||x.groupIndex===prev)}return stageItems(stage)}
function refreshUnlocks(){const ratio=n=>{const s=stageItems(n);return s.length?s.filter(x=>mFor(x.id).level>=2).length/s.length:0};if(ratio(1)>=.82)data.unlockedStage=Math.max(data.unlockedStage,2);if(ratio(2)>=.72)data.unlockedStage=Math.max(data.unlockedStage,3);if(ratio(3)>=.72)data.unlockedStage=Math.max(data.unlockedStage,4);save()}

function renderHome(){data.lastRoute='home';const p=data.profile||{name:'히라가나 용사',frog:'🐸'},basic=stageItems(1),done=masteredCount(1),allDone=items.filter(x=>mFor(x.id).level>=3).length,pct=Math.round(allDone/items.length*100),rate=data.today.answered?Math.round(data.today.correct/data.today.answered*100):0;const trouble=items.filter(x=>mFor(x.id).wrong||mFor(x.id).mismatch).sort((a,b)=>(mFor(b.id).wrong+mFor(b.id).mismatch*2)-(mFor(a.id).wrong+mFor(a.id).mismatch*2)).slice(0,5);app.innerHTML=`<main class="page home"><div class="head"><div><span class="ver">오늘도 반가워 · ver${VERSION}</span><h1>${esc(p.name)}의 히라가나</h1></div><button data-go="parent" class="avatar">${p.frog}</button></div><section class="travel"><div class="route">🇰🇷<i><b style="width:${pct}%"></b></i>🇯🇵</div><strong>일본 여행까지 한 걸음! ✈️</strong><p>히라가나를 다 외우면 아빠랑 일본에서 직접 읽어보자 😆</p></section><section class="stats"><div><small>오늘 공부</small><b>${data.today.answered}</b><em>문제</em></div><div><small>정답률</small><b>${data.today.answered?rate:'—'}</b><em>${data.today.answered?'%':''}</em></div><div><small>완전 기억</small><b>${done}</b><em>/${basic.length}</em></div></section><button data-go="map" class="primary">▶ 이어서 공부하기</button><div class="games"><button data-go="rain" class="game rain"><em>🌧️</em><b>히라가나비오나</b><small>떨어지는 글자를 낼름!</small></button><button data-go="jump" class="game jump"><em>🌿</em><b>개구리점프</b><small>소리를 보고 글자를 찾아 폴짝!</small></button></div>${trouble.length?`<section class="card revisit"><small><b>🐸 다시 만나고 싶은 글자</b></small><div class="chips">${trouble.map(x=>`<b>${x.jp}</b>`).join('')}</div></section>`:''}<div class="nav"><button data-go="map">🗺️<small>학습지도</small></button><button data-go="parent">📊<small>아빠 화면</small></button><button data-go="settings">⚙️<small>설정</small></button></div></main>`}

function renderMap(){data.lastRoute='map';const stages=[['🌱','기본 히라가나','あいうえお부터 한 줄씩'],['🌿','탁음 · 조합음','が・ぱ・りゃ도 만나기'],['🌸','히라가나 단어','あめ = 아메 = 비'],['🏯','っ · ん 단어','がっこう・ほん 읽기'],['🗾','다음 모험','히라가나다라마바사 - 단어편']];app.innerHTML=`<main class="page map">${top('히라가나 모험지도')}<div class="intro"><b>하나씩 제대로 외우자.</b><p>⭐ 3개 = 시간 간격을 두고 여러 번 맞힌 글자</p></div><div class="road">${stages.map((s,i)=>{const n=i+1,unlocked=n<=data.unlockedStage,si=stageItems(n),done=si.filter(x=>mFor(x.id).level>=3).length,p=si.length?Math.round(done/si.length*100):0;return `<button class="stage ${data.selectedStage===n?'sel':''} ${!unlocked?'lock':''}" data-stage="${n}" ${(!unlocked&&n<5)?'disabled':''}><em>${unlocked||n===5?s[0]:'🔒'}</em><span><small>STAGE ${n}</small><b>${s[1]}</b><p>${s[2]}</p>${n<5?`<div class="bar"><i style="width:${p}%"></i></div>`:''}</span></button>`}).join('')}</div><div class="sticky"><button data-go="rain" class="primary">🌧️ 비오나로 공부</button><button data-go="jump" class="secondary">🌿 점프로 복습</button></div></main>`;bindGlobal();$$('[data-stage]').forEach(b=>b.onclick=()=>{const n=+b.dataset.stage;if(n===5){if(data.unlockedStage>=4&&masteredCount(4)>=Math.ceil(stageItems(4).length*.7))alert('🎉 히라가나 마스터!\n다음에는 「히라가나다라마바사 - 단어편」으로 이어가자.');else toast('STAGE 4까지 마스터하면 열려!');return}if(n<=data.unlockedStage){sfx.tap();data.selectedStage=n;save();renderMap()}})}

function weightFor(item){const m=mFor(item.id),due=m.seen>0&&m.nextDue<=now();let w=2;if(m.seen===0)w+=7;if(due)w+=7;if(item.kind==='word'&&m.seen>0&&m.exposures<6)w+=(6-m.exposures)*2;w+=Math.min(8,m.wrong*2)+Math.min(6,m.mismatch*3);w-=m.level===3?1:0;return Math.max(1,w)}
function choose(stage,exclude=[]){let pool=activePool(stage).filter(x=>!exclude.includes(x.id));if(!pool.length)pool=activePool(stage);const weighted=[];pool.forEach(x=>{for(let i=0;i<weightFor(x);i++)weighted.push(x)});return weighted[Math.floor(Math.random()*weighted.length)]||pool[0]}
function choiceCount(stage){if(stage===1){const gi=currentGroupIndex(1);return gi<2?3:gi<6?4:5}if(stage===2)return 5;return 6}
function choices(q,stage,reverse){const answer=reverse?q.jp:q.ko,need=choiceCount(stage)-1;let candidates=shuffle(stageItems(stage).filter(x=>x.id!==q.id)).map(x=>reverse?x.jp:x.ko).filter((v,i,a)=>v!==answer&&a.indexOf(v)===i);if(stage===1&&candidates.length<need)candidates=shuffle(items.filter(x=>x.kind==='kana'&&x.id!==q.id)).map(x=>reverse?x.jp:x.ko).filter((v,i,a)=>v!==answer&&a.indexOf(v)===i);return shuffle([answer,...candidates.slice(0,need)])}
function sessionSize(stage){if(stage===1){const gi=currentGroupIndex(1);return gi<2?10:gi<6?15:20}if(stage===2)return 20;if(stage===3)return 18;return 20}
function rainSeconds(stage){if(stage===1){const gi=currentGroupIndex(1);return gi<2?11:gi<6?9:8}if(stage===2)return 8;if(stage===3)return 10;return 8}
function record(q,ok,confidence){const m=mFor(q.id),wasNew=m.seen===0,due=m.seen===0||m.nextDue<=now(),streak=ok?m.streak+1:0;let level=m.level;if(ok&&due)level=Math.min(3,level+1);if(!ok)level=Math.max(0,level-1);const intervals=[3*60e3,10*60e3,6*3600e3,24*3600e3];const nextDue=ok?now()+intervals[level]:now()+3*60e3;data.mastery[q.id]={...m,seen:m.seen+1,exposures:m.exposures+1,correct:m.correct+(ok?1:0),wrong:m.wrong+(ok?0:1),streak,level,lastSeen:now(),nextDue,mismatch:m.mismatch+(confidence==='sure'&&!ok?1:0)};data.today.answered++;if(ok)data.today.correct++;if(wasNew&&!data.today.newLearned.includes(q.id))data.today.newLearned.push(q.id);if(m.level<3&&level===3&&!data.today.mastered.includes(q.id))data.today.mastered.push(q.id);refreshUnlocks();save()}

function startGame(mode){data.lastRoute=mode;const stage=Math.min(data.selectedStage||1,data.unlockedStage),total=sessionSize(stage);let idx=0,correct=0,confidence=null,history=[],q=choose(stage),timer=null,answered=false;const reverse=mode==='jump';function draw(){clearInterval(timer);answered=false;confidence=null;const cs=choices(q,stage,reverse),count=cs.length,seconds=rainSeconds(stage);app.innerHTML=`<main class="page gameplay">${gameTop(mode==='rain'?'히라가나비오나':'개구리점프','home')}<div class="progress"><i style="width:${Math.round(idx/total*100)}%"></i></div><div class="confidence"><small>이거 자신 있어?</small><button data-c="sure">😎 알아!</button><button data-c="unsure">🤔 헷갈려</button></div>${mode==='rain'?`<section id="scene" class="scene rainScene"><div class="cloud">☁️　☁️</div><div id="drop" class="drop">${q.jp}</div><div class="tongue"></div><div class="frog">🐸</div></section>`:`<section id="scene" class="scene jumpScene"><div class="bubble">${q.ko}!</div><div class="leaves">🌿　🌿　🌿</div><div class="frog">🐸</div></section>`}<div class="answers ${count===4?'four':count>=6?'six':''}">${cs.map(c=>`<button data-a="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="feedback" class="feedback">${idx+1}/${total} · 정답을 골라줘!</div>${credit()}</main>`;bindGlobal();$$('[data-c]').forEach(b=>b.onclick=()=>{sfx.tap();confidence=b.dataset.c;$$('[data-c]').forEach(x=>x.classList.remove('on'));b.classList.add('on')});$$('[data-a]').forEach(b=>b.onclick=()=>answer(b.dataset.a,b));if(mode==='rain'){let elapsed=0;const drop=$('#drop');timer=setInterval(()=>{elapsed++;drop.style.top=`${11+elapsed*(57/seconds)}%`;if(elapsed>=seconds){clearInterval(timer);answer('__timeout__',null)}},1000)}}
 function answer(value,btn){if(answered)return;answered=true;clearInterval(timer);const right=reverse?q.jp:q.ko,ok=value===right;record(q,ok,confidence);if(ok)correct++;const f=$('#feedback');$$('[data-a]').forEach(b=>{b.disabled=true;if(b.dataset.a===right)b.classList.add('good')});if(btn&&!ok)btn.classList.add('bad');if(ok){if(mode==='rain'){$('#scene').classList.add('catch');sfx.catch();setTimeout(()=>sfx.correct(),180)}else{$('#scene').classList.add('jumpok');sfx.jump();setTimeout(()=>sfx.correct(),180)}f.textContent='낼름! 정답이야 ✨'}else{sfx.wrong();f.textContent=`앗! ${q.jp} = ${q.ko} · 조금 뒤 다시 만나자 🐸`}if(q.kind==='word')setTimeout(()=>showWord(q),ok?450:250);setTimeout(next,q.kind==='word'?2500:1050)}
 function showWord(x){document.body.insertAdjacentHTML('beforeend',`<div class="overlay"><div class="wordcard"><em>${x.emoji}</em><h2>${x.jp}</h2><b>${x.ko}</b><hr><strong>${x.meaning}</strong><small>✨ 이 단어는 다시 불현듯 만나게 될 거야!</small></div></div>`)}
 function next(){document.querySelector('.overlay')?.remove();idx++;if(idx>=total){data.sessions.push({date:localDay(),answered:total,correct,stage,mode,finishedAt:now()});save();bgm.stop();sfx.complete();return renderResult(total,correct)}history.push(q.id);q=choose(stage,history.slice(-4));draw()}
 bgm.start();draw()}

function renderResult(total,correct){data.lastRoute='home';const rate=Math.round(correct/total*100);app.innerHTML=`<main class="page result"><div class="bigfrog">${data.profile?.frog||'🐸'}</div><small>오늘의 모험 완료 · ver${VERSION}</small><h1>${rate>=90?'기억력이 반짝반짝!':rate>=70?'점점 더 잘 기억하고 있어!':'헷갈린 글자는 다시 만나면 돼!'}</h1><section class="resultstats"><div><b>${correct}</b><small>정답</small></div><div><b>${data.today.newLearned.length}</b><small>새로 만남</small></div><div><b>${data.today.mastered.length}</b><small>완전 기억</small></div></section><section class="card meta"><b>🧠 오늘 내 기억 점검</b><p>“알아!”라고 생각했는데 틀린 글자는 <strong>더 빨리 다시 만나도록</strong> 앱이 기억해.</p></section><button data-go="home" class="primary">오늘은 여기까지! ✓</button><button data-go="map" class="textbtn">조금 더 할래</button></main>`}

function renderParent(){data.lastRoute='parent';const seen=items.filter(x=>mFor(x.id).seen>0),master=seen.filter(x=>mFor(x.id).level>=3),trouble=[...seen].sort((a,b)=>(mFor(b.id).wrong+mFor(b.id).mismatch*2)-(mFor(a.id).wrong+mFor(a.id).mismatch*2)).slice(0,8),total=data.sessions.reduce((s,x)=>s+(x.answered||0),0);app.innerHTML=`<main class="page settings">${top('아빠 학습 리포트')}<section class="parenthero">📊 <span><small>${esc(data.profile?.name||'아이')}의 히라가나</small><b>꾸준히, 하나씩 제대로.</b></span></section><div class="parentgrid"><div><small>학습한 항목</small><b>${seen.length}</b></div><div><small>완전 기억</small><b>${master.length}</b></div><div><small>누적 문제</small><b>${total}</b></div><div><small>현재 Stage</small><b>${data.unlockedStage}</b></div></div><section class="card"><h3>메타인지 체크</h3><p>“알아!”라고 했지만 틀린 항목은 오답보다 더 높은 복습 가중치를 받아.</p><div class="trouble">${trouble.length?trouble.map(x=>{const m=mFor(x.id);return `<div><b>${x.jp}</b><span>${x.ko}</span><em>${['처음','연습 중','거의 알아','완전 알아'][m.level]}</em></div>`}).join(''):'아직 학습 데이터가 없어.'}</div></section><section class="card"><h3>현재 학습 알고리즘</h3><ul><li>새 항목 + 복습 예정 + 오답 항목을 섞어서 출제</li><li>바로 직전 4문제는 재출제하지 않아 단순 암기를 방지</li><li>숙련도는 시간 간격을 둔 정답에서만 상승</li><li>Stage 1·2는 한 행/그룹씩 순차적으로 확장</li></ul></section></main>`;bindGlobal()}

function renderSettings(){data.lastRoute='settings';app.innerHTML=`<main class="page settings">${top('부모 설정')}<section class="card"><div class="soundrow"><div><h3>🎮 게임 사운드</h3><p>정답·오답·점프 효과음과 50곡의 오리지널 잔잔한 레트로 BGM을 앱에서 직접 합성해.</p></div><button id="soundToggle" class="toggle">${data.sound?'🔊 켜짐':'🔇 꺼짐'}</button></div><button id="testSound" class="secondary">뿅뿅 소리 테스트</button><p style="font-size:11px">BGM은 게임 화면 상단의 작은 <b>● BGM</b> / <b>↻</b> 버튼으로 조절해. 현재 곡: ${esc(bgm.title())} (${(data.bgmTrack||0)+1}/50)</p></section><section class="card"><h3>🐸 공부 알림</h3><p><b>ver0.1에서는 알림 시간만 저장해.</b> iPhone에서 앱을 닫아도 정해진 시각에 실제 푸시가 오는 기능은 Cloudflare Web Push 서버가 필요해서 다음 버전에서 연결할 거야.</p><label>희망 시간<input id="time" type="time" value="${esc(data.reminder.time)}"></label><label>요일<select id="days"><option value="daily">매일</option><option value="weekdays">평일만</option><option value="weekends">주말만</option></select></label><div class="preview"><b>🌧️ 히라가나 비가 내리기 시작했어!</b><small>5분만 놀고 갈래?</small></div></section><section class="card"><h3>✈️ 장기 목표</h3><div class="preview"><b>일본 여행까지 한 걸음!</b><small>히라가나를 다 외우면 아빠랑 일본에서 직접 읽어보자 🇯🇵</small></div></section><section class="card danger"><h3>데이터</h3><p>현재 기록은 이 iPhone의 브라우저 저장소에만 있어.</p><button id="reset">학습 기록 초기화</button></section></main>`;bindGlobal();$('#days').value=data.reminder.days;$('#time').onchange=e=>{data.reminder.time=e.target.value;save()};$('#days').onchange=e=>{data.reminder.days=e.target.value;save()};$('#soundToggle').onclick=()=>{data.sound=!data.sound;save();if(data.sound)sfx.correct();renderSettings()};$('#testSound').onclick=()=>{data.sound=true;save();sfx.tap();setTimeout(()=>sfx.correct(),120)};$('#reset').onclick=()=>{if(confirm('학습 기록을 전부 지울까?')){localStorage.removeItem(STORAGE);location.reload()}}}

window.addEventListener('error',e=>{console.error(e.error||e.message);const f=$('#feedback');if(f)f.textContent='앱 오류가 생겼어. 홈으로 돌아가 다시 시작해줘.'});
refreshUnlocks();
data.profile?renderHome():renderWelcome();
