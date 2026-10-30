const $=id=>document.getElementById(id);
const defaults={enabled:false,githubToken:"",globalConcurrency:2,pollMinutes:1,repositories:[],ui:{
  modelMenuSelector:"",effortMenuSelector:"",composerSelector:"#prompt-textarea",
  sendSelector:"button[data-testid='send-button']",submittedSelector:"button[data-testid='stop-button']",submitVerifyTimeoutMs:12000
}};
async function load(){
 const s=await chrome.storage.local.get(["scheduswarmConfig"]);
 const raw=s.scheduswarmConfig||{};
 const c={...defaults,...raw,ui:{...defaults.ui,...(raw.ui||{})}};
 $("enabled").checked=c.enabled;$("token").value=c.githubToken||"";$("global").value=c.globalConcurrency;$("poll").value=c.pollMinutes;
 $("repos").value=JSON.stringify(c.repositories||[],null,2);$("modelSel").value=c.ui.modelMenuSelector||"";$("effortSel").value=c.ui.effortMenuSelector||"";
 $("composerSel").value=c.ui.composerSelector;$("sendSel").value=c.ui.sendSelector;$("submittedSel").value=c.ui.submittedSelector||"";
}
$("save").onclick=async()=>{
 try{
  const repositories=JSON.parse($("repos").value);
  if(!Array.isArray(repositories)) throw new Error("Repositories must be a JSON array");
  const c={enabled:$("enabled").checked,githubToken:$("token").value.trim(),globalConcurrency:Number($("global").value),pollMinutes:Number($("poll").value),repositories,
   ui:{modelMenuSelector:$("modelSel").value.trim(),effortMenuSelector:$("effortSel").value.trim(),composerSelector:$("composerSel").value.trim(),
       sendSelector:$("sendSel").value.trim(),submittedSelector:$("submittedSel").value.trim(),submitVerifyTimeoutMs:12000}};
  await chrome.storage.local.set({scheduswarmConfig:c});
  await chrome.runtime.sendMessage({type:"scheduswarm.configChanged"});
  $("status").textContent="Saved.";
 }catch(e){$("status").textContent="ERROR: "+e.message;}
};
$("pollNow").onclick=async()=>{
 $("status").textContent="Polling...";
 const r=await chrome.runtime.sendMessage({type:"scheduswarm.pollNow"});
 $("status").textContent=r&&r.ok?"Poll completed.":"ERROR: "+((r&&r.error)||"unknown");
};
load();
