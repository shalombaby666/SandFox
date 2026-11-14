async page => {
 await page.reload();await page.getByRole('button',{name:'Пауза',exact:true}).click();
 const locations=[['forest','Лесной дождь'],['brook','Мшистый ручей'],['cove','Янтарная бухта'],['snow','Снежный приют'],['garden','Сад после дождя'],['volcano','Тёплый вулкан'],['hourglass','Песочные часы'],['free','Свободный мир']];
 const images=[],counts=[];
 for(const [id,name]of locations){
   await page.getByRole('button',{name:new RegExp('^'+name)}).click();
   const info=await page.evaluate(()=>{for(let i=0;i<600;i++)quietDebug.world.step();quietDebug.render();const a=quietDebug.world.cells;return{water:a.filter(m=>m===2).length,plants:a.filter(m=>m===13).length,valid:a.every(m=>m<=18)};});
   if(!info.valid)throw new Error('Invalid material in '+id);
   if(id==='garden'&&info.plants<20)throw new Error('Garden seeds did not grow');
   images.push({name,url:await page.locator('#world').evaluate(c=>c.toDataURL())});counts.push({id,...info});
 }
 const board=await page.context().newPage();await board.setViewportSize({width:1064,height:1530});
 await board.setContent('<html><body style="margin:0;background:#20292e;color:#e2e3cd;font:15px monospace;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px">'+images.map(i=>'<section><div style="margin:0 0 8px">'+i.name+'</div><img style="width:100%;image-rendering:pixelated;display:block" src="'+i.url+'"></section>').join('')+'</body></html>');
 await board.screenshot({path:'output/playwright/location-board.png',fullPage:true});await board.close();
 await page.reload();return{result:'PASS',locations:counts};
}
