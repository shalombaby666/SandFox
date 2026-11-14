async page=>{
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 await page.reload();await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:'Режим фона',exact:true}).click();
 assert(await page.locator('.palette').isVisible(),'Fullscreen must keep the palette');
 await page.getByRole('button',{name:'Вода',exact:true}).click();
 assert(await page.getByRole('button',{name:'Вода',exact:true}).getAttribute('aria-pressed')==='true','Fullscreen material selection failed');
 await page.getByRole('button',{name:'Настройки в полном экране'}).click();await page.getByRole('combobox',{name:'Темп',exact:true}).selectOption('0.65');
 await page.getByRole('button',{name:'Локации в полном экране'}).click();await page.getByRole('button',{name:/^Сад после дождя/}).click();
 assert(await page.evaluate(()=>quietDebug.world.scene)==='garden','Fullscreen scene selection failed');
 assert(!await page.locator('body').evaluate(b=>b.classList.contains('show-places')),'Gallery should close after selection');
 await page.getByRole('button',{name:'Скрыть или показать палитру'}).click();assert(!await page.locator('aside').isVisible(),'Palette did not hide');
 await page.keyboard.press('KeyH');assert(await page.locator('aside').isVisible(),'H did not restore palette');
 await page.screenshot({path:'output/playwright/fullscreen.png'});await page.keyboard.press('Escape');
 assert(!await page.locator('body').evaluate(b=>b.classList.contains('focus')),'Escape did not leave fullscreen');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Режим фона',exact:true}).click();
 assert(await page.locator('.materials').isVisible(),'Mobile fullscreen palette missing');
 await page.getByRole('button',{name:'Компост',exact:true}).click();await page.screenshot({path:'output/playwright/fullscreen-mobile.png'});
 await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>document.fonts.ready);
 const font=await page.evaluate(()=>document.fonts.check('16px Tiny5','Песок вода куртка'));
 assert(font,'Local Cyrillic pixel font did not load');return{result:'PASS',checks:['palette','materials','brush controls','tempo','locations','hide/restore','Escape','mobile','local Cyrillic font']};
}
