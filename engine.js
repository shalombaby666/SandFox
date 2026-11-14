/* Tiny cellular world. Typed arrays, bounded work, fixed-size storage. */
(function(root){
'use strict';
const M={EMPTY:0,SAND:1,WATER:2,FIRE:3,LAVA:4,STONE:5,GAS:6,WOOD:7,STEAM:8,SOIL:9};
const COLORS=[[0,0,0],[218,187,115],[74,151,176],[255,170,69],[237,106,57],[104,118,110],[161,182,143],[124,91,65],[173,204,195],[116,121,75]];
class World{
 constructor(w=384,h=240,seed=12345){this.w=w;this.h=h;this.cells=new Uint8Array(w*h);this.life=new Uint16Array(w*h);this.moved=new Uint32Array(w*h);this.terrain=new Uint8Array(w*h);this.seed=seed>>>0;this.tick=0;this.scene='forest';this.intense=false;this.ambient=true;this.reset('forest');}
 random(){let s=this.seed;s^=s<<13;s^=s>>>17;s^=s<<5;this.seed=s>>>0;return this.seed/4294967296;}
 set(x,y,m,life=0){x=Math.floor(x);y=Math.floor(y);if(x<0||x>=this.w||y<0||y>=this.h)return;const i=x+y*this.w;this.cells[i]=m;this.life[i]=life||(m===M.FIRE?35+Math.floor(this.random()*50):m===M.STEAM?300+Math.floor(this.random()*300):m===M.LAVA?1600:0);this.moved[i]=this.tick;}
 disk(x,y,r,m,replace=false){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r){const xx=Math.floor(x+dx),yy=Math.floor(y+dy);if(xx>=0&&xx<this.w&&yy>=0&&yy<this.h&&(replace||!this.cells[xx+yy*this.w]))this.set(xx,yy,m);}}
 line(x1,y1,x2,y2,m){const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));for(let k=0;k<=n;k++)this.set(x1+(x2-x1)*k/(n||1),y1+(y2-y1)*k/(n||1),m);}
 reset(scene){this.scene=scene;this.cells.fill(0);this.life.fill(0);this.moved.fill(0);this.tick=0;const w=this.w,h=this.h;const sx=w/384,sy=h/240;const line=(x,y,a,b,m)=>this.line(x*sx,y*sy,a*sx,b*sy,m);
 if(scene==='forest'){
  for(let x=0;x<w;x++){const xx=x/sx;const ground=185+Math.sin(xx*.031)*9+Math.sin(xx*.09)*3;for(let y=Math.floor(ground*sy);y<h;y++)this.set(x,y,y<ground*sy+5?M.SOIL:M.STONE);}
  // A basin drains into a hidden spring, closing the water cycle.
  for(let x=Math.floor(100*sx);x<290*sx;x++){const xx=x/sx;const bed=207+Math.sin((xx-100)/190*Math.PI)*16;for(let y=164*sy;y<bed*sy;y++)this.set(x,y,y>199*sy?M.WATER:0);}
  line(10,154,83,154,M.STONE);line(10,155,83,155,M.SOIL);line(292,166,374,166,M.STONE);line(292,165,374,165,M.SOIL);
  for(const [x,y] of [[40,153],[72,153],[319,164],[348,164]]){for(let k=0;k<22;k++)line(x,y-k,x+2,y-k,M.WOOD);}
 }else if(scene==='volcano'){
  for(let x=0;x<w;x++){const xx=x/sx;const g=220-79*Math.exp(-(((xx-204)/69)**2))+Math.sin(xx*.14)*2;for(let y=Math.floor(g*sy);y<h;y++)this.set(x,y,M.STONE);}
  for(let y=139*sy;y<h;y++)for(let x=196*sx;x<211*sx;x++)this.set(x,y,M.LAVA);
  for(let x=0;x<70*sx;x++)for(let y=216*sy;y<h;y++)this.set(x,y,M.WATER);
 }else if(scene==='hourglass'){
  line(85,58,299,58,M.STONE);line(85,58,186,136,M.STONE);line(299,58,198,136,M.STONE);line(186,136,85,218,M.STONE);line(198,136,299,218,M.STONE);line(85,218,299,218,M.STONE);
  for(let y=62*sy;y<122*sy;y++)for(let x=0;x<w;x++)if(x>(90+(y/sy-62)*1.28)*sx&&x<(294-(y/sy-62)*1.28)*sx)this.set(x,y,M.SAND);
 }else{for(let x=0;x<w;x++)for(let y=h-8;y<h;y++)this.set(x,y,M.SOIL);}
 this.terrain.set(this.cells.map(m=>m===M.STONE?1:0));
 }
 swap(i,j){const m=this.cells[j],l=this.life[j];this.cells[j]=this.cells[i];this.life[j]=this.life[i];this.cells[i]=m;this.life[i]=l;this.moved[j]=this.tick;this.moved[i]=this.tick;}
 step(){this.tick++;const w=this.w,h=this.h,a=this.cells;const rain=this.intense?10:3;
 if(this.ambient){
  if(this.scene==='forest'){
   for(let k=0;k<rain;k++){const x=Math.floor(this.random()*w);if(!a[x+7*w])this.set(x,7,M.WATER);}
   // Recycle the basin into mist; remove a few settled drops, never terrain.
   for(let k=0;k<rain*8;k++){const x=Math.floor(this.random()*w),y=Math.floor(h*(.7+this.random()*.28));const i=x+y*w;if(a[i]===M.WATER){a[i]=0;if(this.random()<.12&&y>=4&&!a[i-4*w])this.set(x,y-4,M.STEAM);}}
  }else if(this.scene==='volcano'){
   if(this.tick%(this.intense?2:5)===0)this.disk(w*.531,h*.59,this.intense?3:2,M.LAVA,true);
   if(this.tick%4===0)this.set(w*(.49+this.random()*.08),h*.57,M.GAS);
   if(this.tick%10===0)for(let k=0;k<120;k++){const x=Math.floor(this.random()*w),y=Math.floor(h*(.64+this.random()*.35)),i=x+y*w;if(!this.terrain[i]&&(a[i]===M.LAVA||a[i]===M.STONE))a[i]=0;}
  }else if(this.scene==='hourglass'){
   for(let k=0;k<(this.intense?9:4);k++){const x=Math.floor(w*(.27+this.random()*.46)),y=Math.floor(h*(.65+this.random()*.25));if(a[x+y*w]===M.SAND){for(let n=0;n<12;n++){const sx=Math.floor(w*(.36+this.random()*.28)),sy=Math.floor(h*.27);if(!a[sx+sy*w]){a[x+y*w]=0;this.set(sx,sy,M.SAND);break;}}}}
  }
 }
 // Alternate horizontal order to avoid directional bias. Each cell moves once.
 const reverse=this.tick%2;for(let y=h-1;y>=0;y--)for(let k=0;k<w;k++){
  const x=reverse?w-1-k:k,i=x+y*w,m=a[i];if(!m||this.moved[i]===this.tick||m===M.STONE||m===M.SOIL||m===M.WOOD)continue;
  const dir=this.random()<.5?-1:1,below=i+w;
  if(m===M.FIRE||m===M.LAVA){
   for(const j of [i-1,i+1,i-w,i+w]){if(j<0||j>=a.length||Math.abs(j%w-x)>1)continue;
    if(a[j]===M.WATER){this.set(j%w,Math.floor(j/w),M.STEAM);this.set(x,y,m===M.LAVA?M.STONE:M.EMPTY);break;}
    if((a[j]===M.WOOD||a[j]===M.GAS)&&this.random()<.22)this.set(j%w,Math.floor(j/w),M.FIRE);
   }
   if(a[i]!==m)continue;
  }
  if(m===M.FIRE||m===M.STEAM){if(this.life[i]>0)this.life[i]--;if(!this.life[i]){this.set(x,y,m===M.STEAM&&y<h*.65?M.WATER:0);continue;}}
  if(m===M.LAVA){if(this.life[i]>0)this.life[i]--;if(!this.life[i]){this.set(x,y,M.STONE);continue;}if(this.tick%3)continue;}
  if(m===M.GAS||m===M.STEAM||m===M.FIRE){
   if(y<=2){if(m===M.STEAM)this.set(x,y,M.WATER);else this.set(x,y,0);continue;}
   const up=i-w;if(!a[up]){this.swap(i,up);continue;}
   const nx=x+dir;if(nx>=0&&nx<w&&!a[up+dir]){this.swap(i,up+dir);continue;}if(nx>=0&&nx<w&&!a[i+dir]&&this.random()<.5)this.swap(i,i+dir);continue;
  }
  if(y===h-1)continue;
  const can=j=>a[j]===0||(m===M.SAND&&(a[j]===M.WATER||a[j]===M.LAVA))||((m===M.WATER||m===M.LAVA)&&(a[j]===M.GAS||a[j]===M.STEAM));
  if(can(below)){this.swap(i,below);continue;}
  if(x+dir>=0&&x+dir<w&&can(below+dir)){this.swap(i,below+dir);continue;}
  if(x-dir>=0&&x-dir<w&&can(below-dir)){this.swap(i,below-dir);continue;}
  if(m===M.WATER||m===M.LAVA){for(const d of [dir,-dir]){let target=i;for(let n=1;n<=(m===M.WATER?5:2);n++){if(x+d*n<0||x+d*n>=w||!can(i+d*n))break;target=i+d*n;}if(target!==i){this.swap(i,target);break;}}}
 }
 }
}
root.QuietEngine={World,M,COLORS};if(typeof module!=='undefined')module.exports=root.QuietEngine;
})(typeof window!=='undefined'?window:globalThis);
