/* Publish only browser files. Development docs, tests and local output stay private. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
const files=['index.html','style.css','physics.js','engine.js','scenery.js','app.js','LICENSE',
  'assets/landscape.svg','assets/fox.svg','assets/fonts/Tiny5.ttf','assets/fonts/Tiny5-OFL.txt','assets/avatar/denis.png','assets/avatar/NOTICE.txt'];
for(const file of files){const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
const index=path.join(out,'index.html');
fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace(/(src|href)="((?:app|physics|engine|scenery)\.js|style\.css)"/g,(_,attribute,file)=>attribute+'="'+file+'?v='+crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex').slice(0,12)+'"'));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.writeFileSync(path.join(out,'README.md'),'# SandFox\n\n[Play SandFox](https://shalombaby666.github.io/SandFox/).\n\nNo installation is needed. The personal avatar belongs to its owner. Tiny5 is distributed under the included SIL Open Font License. Code is MIT licensed.\n');
console.log('Built SandFox browser files in dist/');
