const {chromium}=require('playwright');
const fs=require('fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 fs.mkdirSync('output/ui-qa',{recursive:true});
 for(const [width,height] of [[320,568],[390,844],[844,390],[768,1024],[1280,800]]){
  const mobile=width<=960;
  const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/127.0.0.1:8766/',async route=>{
   let html=fs.readFileSync('index.html','utf8');
   html=html.replace(/\}\)\(\);\s*<\/script>/,'window.__uiTest={state:()=>state,render,showCard};})();</script>');
   await route.fulfill({body:html,contentType:'text/html'});
  });
  await page.addInitScript(()=>{localStorage.setItem('bkPlayerName','UI QA');window.WebSocket=class{constructor(){this.readyState=0}close(){}send(){}}});
  await page.goto('http://127.0.0.1:8766/');
  // Initial name prompt is deliberately separate from choosing a local mode.
  await page.evaluate(()=>{document.querySelector('#nameDialog').hidden=true;document.querySelector('#modePicker').inert=false;document.querySelector('#game').inert=false});
  await page.locator('#localMode').click();
  const checkBounds=async selector=>{
   const b=await page.locator(selector).boundingBox();assert(b,selector+' missing');
   assert(b.x>=-1&&b.y>=-1&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${width}x${height} ${selector} out of viewport ${JSON.stringify(b)}`);
  };
  await checkBounds('#board');await checkBounds('#gameHelp');
  const centering=await page.locator('#brandLogo').evaluate(e=>{const image=e.getBoundingClientRect(),bar=e.closest('.topbar').getBoundingClientRect();return {gapTop:image.top-bar.top,gapBottom:bar.bottom-image.bottom}});
  assert(centering.gapTop>=3&&centering.gapBottom>=3&&Math.abs(centering.gapTop-centering.gapBottom)<=1,'Toolbar logo is not vertically centered: '+JSON.stringify(centering));
  if(mobile){
   for(const selector of ['.mobile-seat[data-player="0"]','.mobile-seat[data-player="1"]'])await checkBounds(selector);
   await page.locator('.mobile-seat[data-player="0"] [data-action="wall"]').click();
   const board=await page.locator('#board').boundingBox();
   await page.touchscreen.tap(board.x+board.width*.45,board.y+board.height*.45);
   assert.equal(await page.locator('#wallConfirmBar').evaluate(e=>e.parentElement.dataset.player),'0');
   await checkBounds('#wallConfirmBar');
   await page.screenshot({path:`output/ui-qa/${width}-blue-wall.png`});
   await page.locator('#confirmWall').click();
   assert.equal(JSON.parse(await page.evaluate(()=>render_game_to_text())).walls.length,1);
  }
  await page.evaluate(()=>{const s=__uiTest.state();s.turn=0;s.deck=['walls'];s.pendingBreak=false;s.armedWall=null;__uiTest.render()});
  await page.locator(mobile?'.mobile-seat[data-player="0"] [data-action="card"]':'.desktop-panel [data-action="card"]').click();
  assert.equal(await page.locator('#cardResult').evaluate(e=>e.style.getPropertyValue('--card-rotation')),'180deg');
  assert.equal(JSON.parse(await page.evaluate(()=>render_game_to_text())).turn,'Gold Knight');
  await page.waitForTimeout(420);await checkBounds('#cardResult');
  await page.screenshot({path:`output/ui-qa/${width}-blue-card.png`});
  await page.evaluate(()=>{const s=__uiTest.state();s.deck=['break'];__uiTest.render()});
  await page.locator(mobile?'.mobile-seat[data-player="1"] [data-action="card"]':'.desktop-panel [data-action="card"]').click();
  assert.equal(await page.locator('#cardResult').evaluate(e=>e.style.getPropertyValue('--card-rotation')),'0deg');
  if(mobile){await checkBounds('#mobileSkip');assert.equal(await page.locator('#mobileSkip').evaluate(e=>e.parentElement.dataset.player),'1');await page.screenshot({path:`output/ui-qa/${width}-gold-break.png`});await page.locator('#mobileSkip').click();assert.equal(await page.locator('#message').textContent(),'Gold Knight skipped Break the Wall.');assert(await page.locator('#cardResult').isHidden());await page.screenshot({path:`output/ui-qa/${width}-after-break.png`})}
  await page.locator('#gameHelp').click();assert(await page.locator('#guideModal').evaluate(e=>e.classList.contains('show')));await page.locator('#guideClose').click();
  let prompts=0;page.on('dialog',async d=>{prompts++;await d.dismiss()});
  await page.locator(mobile?'#mobileNewGame':'#backHome').click();assert.equal(prompts,1);assert(await page.locator('#modePicker').isHidden());
  assert.deepEqual(errors,[]);await context.close();console.log(`Passed ${width}x${height}`);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
