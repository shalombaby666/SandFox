const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../engine.js');
function empty(){const w=new World(40,30,42);w.cells.fill(0);w.life.fill(0);w.ambient=false;return w;}
test('sand falls exactly one cell per step',()=>{const w=empty();w.set(10,5,M.SAND);w.step();assert.equal(w.cells[10+6*40],M.SAND);assert.equal(w.cells[10+5*40],0);});
test('sand sinks through water and preserves both particles',()=>{const w=empty();w.set(10,5,M.SAND);w.set(10,6,M.WATER);w.moved[10+6*40]=1;w.step();assert.equal(w.cells[10+6*40],M.SAND);assert.equal(w.cells[10+5*40],M.WATER);});
test('water cools lava to stone and evaporates',()=>{const w=empty();w.set(10,10,M.LAVA);w.set(11,10,M.WATER);w.moved[11+10*40]=1;w.step();assert.equal(w.cells[10+10*40],M.STONE);assert.equal(w.cells[11+10*40],M.STEAM);});
test('steam rises and eventually condenses',()=>{const w=empty();w.set(20,12,M.STEAM,100);w.step();assert.equal(w.cells[20+11*40],M.STEAM);for(let i=0;i<12;i++)w.step();assert.ok(w.cells.includes(M.WATER));});
test('fire ignites adjacent wood',()=>{const w=empty();w.random=()=>0;w.set(10,10,M.FIRE,80);w.set(11,10,M.WOOD);w.step();assert.equal(w.cells[11+10*40],M.FIRE);});
test('closed sandbox conserves sand and water across 500 steps',()=>{const w=empty();for(let x=0;x<40;x++)w.set(x,29,M.STONE);for(let i=0;i<100;i++)w.set(5+i%25,3+Math.floor(i/25),i%2?M.SAND:M.WATER);const count=m=>w.cells.filter(x=>x===m).length;const before=[count(M.SAND),count(M.WATER)];for(let i=0;i<500;i++)w.step();assert.deepEqual([count(M.SAND),count(M.WATER)],before);});
test('all ambient presets survive 600 ticks with bounded memory and valid cells',()=>{for(const scene of ['forest','volcano','hourglass','free']){const w=new World(96,60,7);w.reset(scene);for(let i=0;i<600;i++)w.step();assert.equal(w.cells.length,5760);assert.ok(w.cells.every(x=>x>=0&&x<=9));}});
test('brush clips to boundaries and eraser replaces occupied cells',()=>{const w=empty();w.disk(0,0,3,M.STONE);assert.equal(w.cells[0],M.STONE);w.disk(0,0,3,0,true);assert.equal(w.cells[0],0);assert.equal(w.cells.filter(Boolean).length,0);});
test('hourglass recycling conserves all sand over 3000 ticks',()=>{const w=new World(96,60,7);w.reset('hourglass');const before=w.cells.filter(m=>m===M.SAND).length;for(let i=0;i<3000;i++)w.step();assert.equal(w.cells.filter(m=>m===M.SAND).length,before);});
test('forest mist never overwrites a solid cell above recycled water',()=>{const w=empty();w.scene='forest';w.ambient=true;w.random=()=>0;w.set(0,21,M.WATER);w.set(0,17,M.STONE);w.step();assert.equal(w.cells[0+17*40],M.STONE);});
