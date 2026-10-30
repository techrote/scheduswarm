const sleep = ms => new Promise(r => setTimeout(r, ms));

function visible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
}
function one(selector) {
  if (!selector) throw new Error("UI_REFUSED: required selector is not configured");
  const el = [...document.querySelectorAll(selector)].find(visible);
  if (!el) throw new Error("UI_REFUSED: selector not visible: " + selector);
  return el;
}
function exactTextOption(text) {
  return [...document.querySelectorAll('[role="option"],[role="menuitem"],button,[role="menuitemradio"]')]
    .find(el => visible(el) && el.textContent.trim() === text);
}
async function chooseAndVerify(menuSelector, label, stage) {
  const menu=one(menuSelector);
  if (!menu.textContent.includes(label)) {
    menu.click(); await sleep(300);
    const option=exactTextOption(label);
    if (!option) throw new Error("UI_REFUSED: " + stage + " option not found: " + label);
    option.click(); await sleep(300);
  }
  if (!one(menuSelector).textContent.includes(label)) throw new Error("UI_REFUSED: " + stage + " not verified: " + label);
}
function setPrompt(el,prompt) {
  el.focus();
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) el.value=prompt;
  else if (el.isContentEditable || el.getAttribute("contenteditable")==="true") el.textContent=prompt;
  else throw new Error("UI_REFUSED: composer is not editable");
  el.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:prompt}));
}
function promptValue(el){return (el instanceof HTMLTextAreaElement||el instanceof HTMLInputElement)?el.value:el.textContent;}

async function verifySubmission(beforeUrl,prompt,ui) {
  const deadline=Date.now()+(ui.submitVerifyTimeoutMs||12000);
  while(Date.now()<deadline){
    await sleep(250);
    const changedUrl=location.href!==beforeUrl && /\/c\//.test(location.pathname);
    const marker=ui.submittedSelector?[...document.querySelectorAll(ui.submittedSelector)].some(visible):false;
    let promptGone=false;
    try{promptGone=promptValue(one(ui.composerSelector))!==prompt;}catch{promptGone=true;}
    if(changedUrl||marker||promptGone) return true;
  }
  return false;
}

async function dispatchTask(payload) {
  const {task,prompt,ui,dispatchToken}=payload;
  if (location.origin!=="https://chatgpt.com") throw new Error("UI_REFUSED: wrong origin");
  if (/\/c\//.test(location.pathname)) throw new Error("UI_REFUSED: existing chat detected; new chat required");

  await chooseAndVerify(ui.modelMenuSelector,task.chatgpt.model_label,"model");
  await chooseAndVerify(ui.effortMenuSelector,task.chatgpt.effort_label,"effort");
  const composer=one(ui.composerSelector); setPrompt(composer,prompt); await sleep(150);
  if (promptValue(composer)!==prompt) throw new Error("UI_REFUSED: exact prompt insertion not verified");
  const send=one(ui.sendSelector);

  if (task.chatgpt.dispatch_mode==="confirm") {
    send.addEventListener("click",()=>{
      const before=location.href;
      verifySubmission(before,prompt,ui).then(ok=>{
        chrome.runtime.sendMessage({
          type: ok ? "scheduswarm.confirmedSubmit" : "scheduswarm.confirmAmbiguous",
          dispatchToken,
          chatUrl:location.href
        });
      });
    },{once:true});
    return {state:"prepared",chatUrl:location.href,verifiedModel:task.chatgpt.model_label,verifiedEffort:task.chatgpt.effort_label};
  }

  const before=location.href; send.click();
  if (await verifySubmission(before,prompt,ui)) {
    return {state:"submitted",chatUrl:location.href,verifiedModel:task.chatgpt.model_label,verifiedEffort:task.chatgpt.effort_label};
  }
  return {state:"ambiguous",chatUrl:location.href,verifiedModel:task.chatgpt.model_label,verifiedEffort:task.chatgpt.effort_label,error:"submit clicked but submission could not be verified"};
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(!message || message.type!=="scheduswarm.dispatch") return;
  dispatchTask(message.payload).then(result=>sendResponse({ok:true,result})).catch(error=>sendResponse({ok:false,error:String((error&&error.message)||error)}));
  return true;
});
