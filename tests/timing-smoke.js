async page => {
 const assert=(value,message)=>{if(!value)throw new Error(message);};
 await page.clock.install();await page.reload();await page.clock.runFor(100);
 await page.getByRole('button',{name:/^Свободный мир/}).click();
 const sample=async()=>{const before=await page.evaluate(()=>quietDebug.world.tick);await page.clock.runFor(2000);return await page.evaluate(t=>quietDebug.world.tick-t,before);};
 const normal=await sample();assert(normal>=118&&normal<=122,'Expected 60 Hz physics at 1x: '+normal);
 await page.getByRole('combobox',{name:'Плавность'}).selectOption('eco');
 const eco=await sample();assert(eco>=118&&eco<=122,'Eco should preserve physics speed: '+eco);
 await page.getByRole('combobox',{name:'Темп',exact:true}).selectOption('2');
 const fast=await sample();assert(fast>=237&&fast<=243,'Expected 120 ticks/s at 2x: '+fast);
 await page.getByRole('button',{name:/^Лесной дождь/}).click();
 await page.getByRole('checkbox',{name:'Менять место каждые 2 минуты'}).check();
 // A faster tempo does not make the two-minute scene timer run twice as fast.
 await page.clock.runFor(61000);assert(await page.evaluate(()=>quietDebug.world.scene)==='forest','Scene changed before two minutes');
 await page.clock.runFor(60000);assert(await page.evaluate(()=>quietDebug.world.scene)==='brook','Scene should advance after two minutes');
 await page.clock.resume();await page.reload();
 return {result:'PASS',ticksInTwoSeconds:{normal,eco,fast},autocycle:'120 active real seconds, independent of tempo'};
}
