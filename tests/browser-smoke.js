async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 await page.setViewportSize({width:1440,height:1100});await page.reload();
 await page.waitForFunction(()=>quietDebug.world.tick>4);
 await page.getByRole('button',{name:'Пауза',exact:true}).click();
 const tick=await page.evaluate(()=>quietDebug.world.tick);await page.waitForTimeout(200);
 assert(await page.evaluate(t=>quietDebug.world.tick===t,tick),'Pause advances simulation');
 await page.getByRole('button',{name:'Свободный мир Начни с одного пикселя',exact:true}).click();
 await page.getByRole('button',{name:'Вода',exact:true}).click();
 const c=page.locator('#world'),box=await c.boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.3);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.3,{steps:10});await page.mouse.up();
 const water=await page.evaluate(()=>quietDebug.world.cells.filter(m=>m===2).length);assert(water>200,'Brush stroke did not create water');
 await page.mouse.down({button:'right'});await page.mouse.up({button:'right'});
 assert(await page.evaluate(()=>quietDebug.world.cells.filter(m=>m===2).length)<water,'Right button does not erase');
 await page.getByRole('button',{name:'Продолжить',exact:true}).click();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.3);await page.mouse.down();
 const heldStart=await page.evaluate(()=>quietDebug.world.cells.filter(m=>m===2).length);await page.waitForTimeout(300);await page.mouse.up();
 assert(await page.evaluate(()=>quietDebug.world.cells.filter(m=>m===2).length)>heldStart,'Holding brush should keep emitting');
 await page.getByRole('button',{name:'Пауза',exact:true}).click();
 await page.keyboard.press('Digit3');assert(await page.getByRole('button',{name:'Огонь',exact:true}).getAttribute('aria-pressed')==='true','Material shortcut failed');
 await page.keyboard.press('BracketRight');assert(await page.locator('#brush').inputValue()==='6','Brush shortcut failed');
 await page.getByRole('button',{name:'Режим фона',exact:true}).click();assert(await page.locator('body').getAttribute('class')==='focus','Focus failed');
 await page.keyboard.press('Escape');assert(!(await page.locator('body').getAttribute('class')),'Escape failed');
 await page.getByRole('button',{name:'Открыть управление'}).click();assert(await page.locator('dialog').isVisible(),'Help failed');await page.keyboard.press('Escape');
 await page.getByRole('combobox',{name:'Плавность'}).selectOption('eco');assert(await page.evaluate(()=>quietDebug.quality)==='eco','Eco failed');
 await page.getByRole('combobox',{name:'Темп',exact:true}).selectOption('1.5');assert(await page.evaluate(()=>quietDebug.tempo)===1.5,'Tempo failed');
 await page.getByRole('combobox',{name:'Темп',exact:true}).selectOption('1');
 assert(await page.locator('.material').count()===18,'Expected 17 materials and eraser');
 for(const name of ['Снег','Лёд','Масло','Растение','Семена','Дым','Пепел','Стекло']){await page.getByRole('button',{name,exact:true}).click();assert(await page.locator('#material-title').textContent()===name,'Material card did not update');}
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить снимок'}).click();const download=await downloadEvent;await download.saveAs('output/playwright/export.png');
 for(const name of ['Мшистый ручей','Янтарная бухта','Снежный приют','Сад после дождя','Тёплый вулкан','Песочные часы','Лесной дождь']){await page.getByRole('button',{name:new RegExp('^'+name)}).click();assert(await page.evaluate(()=>quietDebug.world.cells.some(Boolean)),'Scene empty');}
 await page.getByRole('button',{name:'Продолжить',exact:true}).click();await page.waitForFunction(()=>quietDebug.world.tick>40);
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{value:true,configurable:true}));
 const hiddenTick=await page.evaluate(()=>quietDebug.world.tick);await page.waitForTimeout(200);
 assert(await page.evaluate(t=>quietDebug.world.tick===t,hiddenTick),'Hidden document still simulates');await page.evaluate(()=>delete document.hidden);
 await page.screenshot({path:'output/playwright/desktop-full.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');await page.screenshot({path:'output/playwright/mobile.png',fullPage:true});
 await page.setViewportSize({width:320,height:740});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'320px overflow');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();assert(await page.evaluate(()=>quietDebug.paused),'Reduced motion should start paused');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:1100});await page.reload();
 assert(errors.length===0,errors.join('\n'));
 return {result:'PASS',checks:['live simulation','pause','brush interpolation','held brush','eraser','shortcuts','focus and Escape','help','eco','tempo','18 tools and reaction cards','PNG export','eight locations','hidden tab suspension','390px and 320px responsive','reduced motion'],pageErrors:errors};
}
