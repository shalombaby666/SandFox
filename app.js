/* UI, procedural pixel scenery and a fixed-step, visibility-aware scheduler. */
(()=>{'use strict';
const {World,M,COLORS}=QuietEngine;
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false}),cursor=$('cursor'),cc=cursor.getContext('2d');
const w=384,h=240,world=new World(w,h,918271),back=document.createElement('canvas');back.width=w;back.height=h;const bg=back.getContext('2d');
const image=ctx.createImageData(w,h),data=image.data;
const scenes=[['forest','Лесной дождь','Прохлада и шелест листвы','мягкий дождь, запах хвои'],['volcano','Тёплый вулкан','Искры в вечернем небе','где-то внутри горы тепло'],['hourglass','Песочные часы','Медленное течение времени','каждая песчинка найдёт свой путь'],['free','Свободный мир','Начни с одного пикселя','здесь начинается твоя история']];
const materials=[['Песок',M.SAND,'песка'],['Вода',M.WATER,'воды'],['Огонь',M.FIRE,'огня'],['Лава',M.LAVA,'лавы'],['Камень',M.STONE,'камня'],['Газ',M.GAS,'газа'],['Дерево',M.WOOD,'дерева'],['Пар',M.STEAM,'пара'],['Земля',M.SOIL,'земли'],['Ластик',0,'пустоты']];
let material=1,brush=5,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,quality='auto',focus=false,pointer=null,previous=null,paintPoint=null,erase=false,sceneTime=0,toastTimer,basePixels;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2300);}
materials.forEach(([name,id,gen],index)=>{const b=document.createElement('button');b.className='material'+(id===material?' selected':'');b.innerHTML=`<span class="swatch" style="background:${id?`rgb(${COLORS[id].join(',')})`:'#35464b'}">${id?'':'×'}</span><span>${name}</span>`;b.title=`${name} (${(index+1)%10})`;b.setAttribute('aria-pressed',String(id===material));b.onclick=()=>{material=id;$('selected-name').textContent=gen;document.querySelectorAll('.material').forEach((el,i)=>{el.classList.toggle('selected',i===index);el.setAttribute('aria-pressed',String(i===index));});};$('materials').append(b);});
function scenery(scene,target=bg){
 const forest=scene==='forest',volcano=scene==='volcano',hour=scene==='hourglass';const r=mulberry(48219);const rect=(x,y,a,b,c)=>{target.fillStyle=c;target.fillRect(Math.floor(x),Math.floor(y),Math.ceil(a),Math.ceil(b));};
 const sky=forest?['#233c48','#2b4752','#34555b','#476761']:volcano?['#342c44','#4c3548','#68434a','#8a5550']:hour?['#273344','#344152','#455367','#556575']:['#293b48','#334a54','#3e5a5d','#4f6964'];
 for(let i=0;i<4;i++)rect(0,i*60,w,60,sky[i]);
 // Handful of square stars and a stepped moon.
 for(let i=0;i<60;i++){const x=r()*w,y=r()*130;rect(x,y,1,1,i%4===0?'#c5cdae':'#718a87');}
 rect(288,28,15,22,'#d9d7b0');rect(285,32,21,14,'#d9d7b0');rect(286,29,10,15,sky[0]);
 for(let layer=0;layer<3;layer++){
  const color=forest?['#37555a','#29484c','#203e43'][layer]:volcano?['#624452','#493945','#34323e'][layer]:['#4b5e69','#3b515b','#2e454d'][layer];
  for(let x=0;x<w;x+=3){let y=113+layer*25+Math.sin(x*.019+layer*2)*16+Math.sin(x*.043+layer)*8;if(volcano)y-=Math.max(0,42-Math.abs(x-205)*.43);rect(x,y,3,h-y,color);}
 }
 function tree(x,y,size,color){rect(x-1,y-size*.6,3,size*.7,color);for(let j=0;j<4;j++){const yy=y-size+j*size*.18,half=size*(.13+j*.065);for(let k=0;k<size*.33;k+=2){const wid=half*(k/(size*.33));rect(x-wid,yy+k,wid*2+1,2,color);}}}
 if(forest){for(let i=0;i<23;i++)tree(i*19+r()*12,155+r()*10,34+r()*26,'#234449');for(const [x,y,s] of [[40,151,70],[72,151,45],[319,163,58],[348,163,82],[17,186,65],[367,185,53]])tree(x,y,s,'#17373a');
  // Soft fern-coloured foliage, all right-angle silhouettes.
  for(const [x,y,s] of [[40,151,70],[72,151,45],[319,163,58],[348,163,82]]){tree(x-2,y-2,s,'#42614d');tree(x+2,y-2,s*.89,'#527256');}
  // A tiny cabin on the left bank.
  rect(17,166,24,21,'#6c6550');rect(15,164,28,3,'#343f39');for(let j=0;j<9;j++)rect(14+j,163-j,30-j*2,2,'#795c4e');rect(31,173,5,7,'#dec285');rect(22,175,5,12,'#39433a');rect(19,188,23,2,'#263a38');
  // Little mushrooms, moss and stone faces inhabit the banks.
  for(let i=0;i<24;i++){const x=r()*w;if(x>95&&x<295)continue;const y=185+Math.sin(x*.031)*9+Math.sin(x*.09)*3;rect(x,y-3,2,4,'#a5bb78');}
 }else if(hour){rect(76,52,232,5,'#a0a28b');rect(76,220,232,6,'#a0a28b');rect(80,57,4,163,'#667d79');rect(300,57,4,163,'#667d79');rect(69,226,246,4,'#36494c');}
 basePixels=target.getImageData(0,0,w,h).data;
}
function mulberry(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
scenes.forEach(([id,name,desc])=>{const b=document.createElement('button');b.className='scene';b.dataset.scene=id;b.innerHTML=`<canvas width="384" height="240" aria-hidden="true"></canvas><span><b>${name}</b><small>${desc}</small></span><span class="mark"></span>`;const mini=b.querySelector('canvas').getContext('2d');scenery(id,mini);const preview=new World(w,h,42);preview.reset(id);for(let i=0;i<preview.cells.length;i++){const m=preview.cells[i];if(m){mini.fillStyle=`rgb(${COLORS[m].join(',')})`;mini.fillRect(i%w,Math.floor(i/w),1,1);}}b.onclick=()=>loadScene(id);$('scenes').append(b);});
function loadScene(id){world.reset(id);sceneTime=0;scenery(id);const s=scenes.find(s=>s[0]===id);$('scene-name').textContent=s[1];$('weather-label').textContent=s[3];document.querySelectorAll('.scene').forEach(b=>{const selected=b.dataset.scene===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.querySelector('.mark').textContent=selected?'•':'';});render();}
function render(){data.set(basePixels);const a=world.cells,t=world.tick;
 for(let i=0;i<a.length;i++){const m=a[i];if(!m)continue;const p=i*4,x=i%w,y=(i/w)|0;const hash=((x*73+y*37)%17)-8;let c=COLORS[m],v=hash;
  if(m===M.FIRE){v=((i*13+t*11)%65)-22;c=[255,174,62];}if(m===M.LAVA)v=((x+y+t/6)%13)*3;if(m===M.WATER)v=hash*.6+Math.sin(x*.12+t*.06)*7;
  const alpha=m===M.GAS?.43:m===M.STEAM?.58:m===M.WATER?.85:1;
  data[p]=data[p]*(1-alpha)+(c[0]+v)*alpha;data[p+1]=data[p+1]*(1-alpha)+(c[1]+v)*alpha;data[p+2]=data[p+2]*(1-alpha)+(c[2]+v)*alpha;data[p+3]=255;
  if(m===M.SOIL&&y>0&&!a[i-w]){data[p]=132+hash;data[p+1]=153+hash;data[p+2]=91+hash;}
 }
 // Fireflies are decorative, independent of physical material cells.
 if(world.scene==='forest')for(let n=0;n<16;n++){const x=Math.floor(30+n*21+Math.sin(t*.009+n)*9),y=Math.floor(145+Math.sin(t*.013+n*4)*24);const i=(x+y*w)*4;if(!a[x+y*w]){data[i]=187;data[i+1]=202;data[i+2]=114;}}
 ctx.putImageData(image,0,0);
}
function position(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*w,y:(e.clientY-r.top)/r.height*h};}
function drawAt(p){const m=erase?0:material;world.disk(p.x,p.y,brush,m,m===0);}
function drawStroke(p){if(previous){const dx=p.x-previous.x,dy=p.y-previous.y,n=Math.ceil(Math.hypot(dx,dy)/Math.max(1,brush*.5));for(let i=0;i<=n;i++)drawAt({x:previous.x+dx*i/(n||1),y:previous.y+dy*i/(n||1)});}else drawAt(p);previous=p;paintPoint=p;}
function drawCursor(p){cc.clearRect(0,0,w,h);if(!p)return;cc.strokeStyle='#e1e6be';cc.lineWidth=1;cc.strokeRect(Math.floor(p.x-brush)-.5,Math.floor(p.y-brush)-.5,brush*2+1,brush*2+1);}
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();canvas.focus();pointer=e.pointerId;erase=e.button===2;previous=null;canvas.setPointerCapture(e.pointerId);drawStroke(position(e));render();});
canvas.addEventListener('pointermove',e=>{const p=position(e);drawCursor(p);if(pointer===e.pointerId){drawStroke(p);if(paused)render();}});
function release(e){if(pointer===e.pointerId){pointer=null;previous=null;paintPoint=null;}}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>drawCursor(null));
$('brush').oninput=e=>{brush=Number(e.target.value);$('brush-value').value=brush+' px';};
function setPause(value){paused=value;$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Продолжить':'Пауза');$('pause').title=paused?'Продолжить (Пробел)':'Пауза (Пробел)';}
$('pause').onclick=()=>setPause(!paused);$('reset').onclick=()=>{loadScene(world.scene);toast('Мир начинается заново');};$('ambient').onclick=()=>{world.ambient=!world.ambient;$('ambient').classList.toggle('active',world.ambient);$('ambient').setAttribute('aria-pressed',String(world.ambient));toast(world.ambient?'Дождь и источники включены':'Дождь и источники выключены');};
$('intensity').onchange=e=>world.intense=e.target.value==='wild';$('quality').onchange=e=>{quality=e.target.value;};
function setFocus(value){focus=value;document.body.classList.toggle('focus',focus);$('focus').setAttribute('aria-label',focus?'Вернуть интерфейс':'Режим фона');if(focus)toast('Только мир · F или Esc — вернуться');}
$('focus').onclick=()=>setFocus(!focus);$('snapshot').onclick=()=>{canvas.toBlob(blob=>{if(!blob){toast('Не удалось сохранить снимок');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sandfox-'+world.scene+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Маленький мир сохранён');});};
$('help').onclick=()=>$('help-dialog').showModal();$('close-help').onclick=()=>$('help-dialog').close();
document.addEventListener('keydown',e=>{if($('help-dialog').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.isContentEditable||(e.target.tagName==='BUTTON'&&e.code==='Space'))return;if(e.code==='Space'){e.preventDefault();setPause(!paused);}else if(e.code==='KeyF')setFocus(!focus);else if(e.code==='Escape')setFocus(false);else if(e.code==='KeyR')loadScene(world.scene);else if(/^Digit[0-9]$/.test(e.code)){const n=Number(e.code.slice(-1));document.querySelectorAll('.material')[(n+9)%10].click();}else if(e.code==='BracketLeft'||e.code==='BracketRight'){$('brush').value=Math.max(1,Math.min(18,brush+(e.code==='BracketLeft'?-1:1)));$('brush').dispatchEvent(new Event('input'));}});
let last=0,accumulator=0,lastPaint=0,frames=0,statTime=0,adaptive=30,slow=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden){last=now;accumulator=0;return;}const elapsed=Math.min(now-last,100);last=now;const fps=quality==='eco'?20:quality==='smooth'?60:adaptive;if(now-lastPaint<1000/fps-1)return;lastPaint=now;
 const start=performance.now();if(!paused){accumulator+=elapsed; // Add actual paint interval, independent of display refresh.
  accumulator=Math.min(accumulator+Math.max(0,(now-(frame.previousPaint||now))-elapsed),100);let steps=0;while(accumulator>=1000/30&&steps<3){if(pointer!==null&&paintPoint)drawAt(paintPoint);world.step();accumulator-=1000/30;sceneTime+=1/30;steps++;}
  if($('autocycle').checked&&sceneTime>=120)loadScene(scenes[(scenes.findIndex(s=>s[0]===world.scene)+1)%scenes.length][0]);
 }else accumulator=0;
 frame.previousPaint=now;render();const cost=performance.now()-start;if(quality==='auto'){slow=cost>22?Math.min(60,slow+1):Math.max(0,slow-1);adaptive=slow>15?20:30;}
 frames++;if(now-statTime>=1000){$('stats').textContent=paused?'пауза':frames+' fps'+(quality==='eco'||adaptive===20?' · эко':'');frames=0;statTime=now;const phase=Math.floor(world.tick/1800)%3;$('cycle-label').textContent=' · '+['тихий вечер','время замедляется','маленькие перемены'][phase];}
}
loadScene('forest');setPause(paused);requestAnimationFrame(frame);
// Read-only diagnostics for smoke checks, not used by the UI.
window.quietDebug={world,get paused(){return paused;},get quality(){return quality;},render};
})();
