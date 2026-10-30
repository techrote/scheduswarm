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
  const candidates = document.querySelectorAll('[role="option"],[role="menuitem"],button,[role="menuitemradio"]');
  return [...candidates].find(el => visible(el) && el.textContent.trim() === text);
}

async function chooseAndVerify(menuSelector, label, stage) {
  const menu = one(menuSelector);
  if (!menu.textContent.includes(label)) {
    menu.click();
    await sleep(300);
    const option = exactTextOption(label);
    if (!option) throw new Error(`UI_REFUSED: ${stage} option not found: ${label}`);
    option.click();
    await sleep(300);
  }
  const verify = one(menuSelector);
  if (!verify.textContent.includes(label)) {
    throw new Error(`UI_REFUSED: ${stage} not verified: ${label}`);
  }
}

function setPrompt(el, prompt) {
  el.focus();
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = prompt;
  } else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
    el.textContent = prompt;
  } else {
    throw new Error("UI_REFUSED: composer is not editable");
  }
  el.dispatchEvent(new InputEvent("input", {bubbles:true, inputType:"insertText", data:prompt}));
}

function promptValue(el) {
  return (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) ? el.value : el.textContent;
}

async function dispatchTask(payload) {
  const {task, prompt, ui} = payload;
  if (location.origin !== "https://chatgpt.com") throw new Error("UI_REFUSED: wrong origin");
  if (task.chatgpt.require_new_chat !== true) throw new Error("UI_REFUSED: task did not require new chat");

  await chooseAndVerify(ui.modelMenuSelector, task.chatgpt.model_label, "model");
  await chooseAndVerify(ui.effortMenuSelector, task.chatgpt.effort_label, "effort");

  const composer = one(ui.composerSelector);
  setPrompt(composer, prompt);
  await sleep(150);
  if (promptValue(composer) !== prompt) throw new Error("UI_REFUSED: exact prompt insertion not verified");

  if (task.chatgpt.dispatch_mode === "confirm") {
    return {
      state:"prepared",
      chatUrl:location.href,
      verifiedModel:task.chatgpt.model_label,
      verifiedEffort:task.chatgpt.effort_label
    };
  }

  const send = one(ui.sendSelector);
  const before = location.href;
  send.click();

  const deadline = Date.now() + (ui.submitVerifyTimeoutMs || 12000);
  while (Date.now() < deadline) {
    await sleep(250);
    const changedUrl = location.href !== before && /\/c\//.test(location.pathname);
    const submittedMarker = ui.submittedSelector ? [...document.querySelectorAll(ui.submittedSelector)].some(visible) : false;
    const promptGone = (() => {
      try { return promptValue(one(ui.composerSelector)) !== prompt; } catch { return true; }
    })();
    if (changedUrl || submittedMarker || promptGone) {
      return {
        state:"submitted",
        chatUrl:location.href,
        verifiedModel:task.chatgpt.model_label,
        verifiedEffort:task.chatgpt.effort_label
      };
    }
  }
  return {
    state:"ambiguous",
    chatUrl:location.href,
    verifiedModel:task.chatgpt.model_label,
    verifiedEffort:task.chatgpt.effort_label,
    error:"submit clicked but submission could not be verified"
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "scheduswarm.dispatch") return;
  dispatchTask(message.payload)
    .then(result => sendResponse({ok:true,result}))
    .catch(error => sendResponse({ok:false,error:String(error?.message || error)}));
  return true;
});
