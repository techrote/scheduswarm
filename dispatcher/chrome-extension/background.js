import {
  DISPATCHER_VERSION,
  parseJsonFrontmatter,
  validateTask,
  parsePolicyMarkdown,
  sha256Hex,
  priorityRank
} from "./task.js";

const API = "https://api.github.com";
const CHAT_URL = "https://chatgpt.com/";
const DEFAULTS = {
  enabled: false,
  githubToken: "",
  globalConcurrency: 2,
  pollMinutes: 1,
  repositories: [],
  ui: {
    modelMenuSelector: "",
    effortMenuSelector: "",
    composerSelector: "#prompt-textarea",
    sendSelector: "button[data-testid='send-button']",
    submittedSelector: "button[data-testid='stop-button']",
    submitVerifyTimeoutMs: 12000
  }
};

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToUtf8(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function config() {
  const stored = await chrome.storage.local.get(["scheduswarmConfig"]);
  const raw = stored.scheduswarmConfig || {};
  return {...DEFAULTS, ...raw, ui:{...DEFAULTS.ui, ...(raw.ui || {})}};
}

async function github(path, options={}) {
  const cfg = await config();
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",\n    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (cfg.githubToken) headers.Authorization = "Bearer " + cfg.githubToken;
  const response = await fetch(API + path, {...options, headers});
  if (!response.ok) {
    const body = await response.text();
    const error = new Error("GitHub " + response.status + ": " + body.slice(0,500));
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

function repoParts(repository) {
  const parts = repository.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("CONFIG_REFUSED: invalid repository " + repository);
  return {owner:parts[0],name:parts[1]};
}

function apiPath(repository, path, ref) {
  const {owner,name} = repoParts(repository);
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const q = new URLSearchParams({ref});
  return "/repos/" + owner + "/" + name + "/contents/" + encoded + "?" + q;
}

async function getContent(repository, path, ref) {
  const data = await github(apiPath(repository,path,ref));
  if (Array.isArray(data)) throw new Error("EXPECTED_FILE: " + path);
  return {text:base64ToUtf8(data.content || ""), sha:data.sha, path:data.path};
}

async function listDir(repository, path, ref) {
  try {
    const data = await github(apiPath(repository,path,ref));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.status === 404) return [];
    throw error;
  }
}

async function createQueueFile(repository, path, object, branch, message) {
  const {owner,name} = repoParts(repository);
  return github("/repos/" + owner + "/" + name + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), {
    method:"PUT",
    body:JSON.stringify({
      message,
      content:utf8ToBase64(JSON.stringify(object,null,2) + "\n"),
      branch
    })
  });
}

function attemptFrom(name, taskId) {
  const prefix = taskId + ".";
  if (!name.startsWith(prefix) || !name.endsWith(".json")) return null;
  const middle = name.slice(prefix.length, -5);
  return /^\d+$/.test(middle) ? Number(middle) : null;
}

async function readJsonFile(repository, path, ref) {
  return JSON.parse((await getContent(repository,path,ref)).text);
}

async function snapshotRepository(rcfg) {
  const policyFile = await getContent(rcfg.repository, "SCHEDUSWARM.md", rcfg.policyRef || "main");
  const policy = parsePolicyMarkdown(policyFile.text);
  const queue = rcfg.queueBranch || policy.queue_branch;
  if (queue !== "scheduswarm/queue") throw new Error("CONFIG_REFUSED: queue branch mismatch");

  const dirs = await Promise.all([
    listDir(rcfg.repository, ".scheduswarm/tasks", queue),
    listDir(rcfg.repository, ".scheduswarm/claims", queue),
    listDir(rcfg.repository, ".scheduswarm/receipts", queue),
    listDir(rcfg.repository, ".scheduswarm/completions", queue),
    listDir(rcfg.repository, ".scheduswarm/recoveries", queue)
  ]);
  const [taskEntries,claimEntries,receiptEntries,completionEntries,recoveryEntries] = dirs;

  const completions = new Set(completionEntries.filter(x=>x.name.endsWith(".json")).map(x=>x.name.replace(/\.json$/,"")));
  const tasks = [];
  for (const entry of taskEntries.filter(x=>x.name.endsWith(".md"))) {
    const file = await getContent(rcfg.repository, entry.path, queue);
    const parsed = parseJsonFrontmatter(file.text);
    validateTask(parsed.metadata, rcfg.repository);
    tasks.push({metadata:parsed.metadata,prompt:parsed.prompt,rawText:file.text,blobSha:file.sha,path:entry.path});
  }

  const superseded = new Set(tasks.map(x=>x.metadata.supersedes_task_id).filter(Boolean));
  const activeTasks = tasks.filter(x=>!completions.has(x.metadata.task_id) && !superseded.has(x.metadata.task_id));
  const activeLanes = new Set(activeTasks.map(x=>x.metadata.lane));

  const states = new Map();
  let executing = 0;
  for (const task of activeTasks) {
    const id = task.metadata.task_id;
    const claims = claimEntries.map(x=>({entry:x,n:attemptFrom(x.name,id)})).filter(x=>x.n!==null).sort((a,b)=>a.n-b.n);
    const receipts = receiptEntries.map(x=>({entry:x,n:attemptFrom(x.name,id)})).filter(x=>x.n!==null).sort((a,b)=>a.n-b.n);
    const recoveries = recoveryEntries.map(x=>({entry:x,n:attemptFrom(x.name,id)})).filter(x=>x.n!==null).sort((a,b)=>a.n-b.n);
    const maxAttempt = claims.length ? claims[claims.length-1].n : 0;
    let latestReceipt = null, latestRecovery = null;
    if (maxAttempt) {
      const receipt = receipts.find(x=>x.n===maxAttempt);
      if (receipt) latestReceipt = await readJsonFile(rcfg.repository,receipt.entry.path,queue);
      const recovery = recoveries.find(x=>x.n===maxAttempt);
      if (recovery) latestRecovery = await readJsonFile(rcfg.repository,recovery.entry.path,queue);
    }
    if (latestReceipt && latestReceipt.state === "submitted") executing++;
    states.set(id,{maxAttempt,latestReceipt,latestRecovery});
  }

  return {rcfg,policy,queue,tasks,activeTasks,activeLanes,states,executing};
}

function eligibleTask(snapshot, task) {
  const m = task.metadata;
  if (snapshot.policy.status !== "active") return {ok:false,why:"project not active"};
  if (snapshot.activeLanes.size > snapshot.policy.max_active_lanes) return {ok:false,why:"active lane limit exceeded"};
  if (m.not_before && Date.now() < Date.parse(m.not_before)) return {ok:false,why:"not_before"};
  if (m.chatgpt.dispatch_mode === "automatic" && snapshot.policy.automatic_dispatch_allowed !== true) {
    return {ok:false,why:"automatic dispatch not allowed"};
  }
  const s = snapshot.states.get(m.task_id);
  if (!s.maxAttempt) return {ok:true,attempt:1};
  if (s.latestReceipt && s.latestReceipt.state === "submitted") return {ok:false,why:"already submitted"};
  if (s.latestRecovery && (s.latestRecovery.action === "abandon" || s.latestRecovery.action === "submission_confirmed")) {
    return {ok:false,why:"recovery blocks redispatch"};
  }
  if (s.latestRecovery && s.latestRecovery.action === "submission_not_observed") return {ok:true,attempt:s.maxAttempt+1};
  return {ok:false,why:"attempt requires explicit recovery"};
}

async function waitTabComplete(tabId, timeoutMs=20000) {
  const current = await chrome.tabs.get(tabId);
  if (current.status === "complete") return;
  await new Promise((resolve,reject)=>{
    const listener=(id,info)=>{
      if(id===tabId && info.status==="complete"){clearTimeout(timer);chrome.tabs.onUpdated.removeListener(listener);resolve();}
    };
    const timer=setTimeout(()=>{chrome.tabs.onUpdated.removeListener(listener);reject(new Error("UI_REFUSED: chat tab load timeout"));},timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function writeReceipt(ctx, state, result={}) {
  const receipt = {
    schema:"scheduswarm/receipt-v2",
    task_id:ctx.task.metadata.task_id,
    attempt:ctx.attempt,
    state,
    dispatcher_id:ctx.dispatcherId,
    dispatcher_version:DISPATCHER_VERSION,
    recorded_at:new Date().toISOString(),
    claim_path:ctx.claimPath,
    prompt_sha256:ctx.promptSha256,
    chat_url:result.chatUrl || null,
    requested_model_label:ctx.task.metadata.chatgpt.model_label,
    verified_model_label:result.verifiedModel || null,
    requested_effort_label:ctx.task.metadata.chatgpt.effort_label,
    verified_effort_label:result.verifiedEffort || null,
    failure_stage:result.failureStage || null,
    error:result.error || null
  };
  const path = ".scheduswarm/receipts/" + ctx.task.metadata.task_id + "." + ctx.attempt + ".json";
  await createQueueFile(ctx.repository,path,receipt,ctx.queue,"scheduswarm: dispatch receipt " + ctx.task.metadata.task_id + " attempt " + ctx.attempt);
}

async function claimAndDispatch(snapshot, task, attempt, cfg) {
  const promptSha256 = await sha256Hex(task.prompt);
  const taskContentSha256 = await sha256Hex(JSON.stringify(task.metadata) + "\n" + task.prompt);
  const dispatcherId = snapshot.rcfg.dispatcherId || cfg.dispatcherId || "chrome-default";
  const claimPath = ".scheduswarm/claims/" + task.metadata.task_id + "." + attempt + ".json";
  const claim = {
    schema:"scheduswarm/claim-v2",
    task_id:task.metadata.task_id,
    attempt,
    dispatcher_id:dispatcherId,
    dispatcher_version:DISPATCHER_VERSION,
    claimed_at:new Date().toISOString(),
    task_blob_sha:task.blobSha,
    task_content_sha256:taskContentSha256
  };
  try {
    await createQueueFile(snapshot.rcfg.repository,claimPath,claim,snapshot.queue,"scheduswarm: claim " + task.metadata.task_id + " attempt " + attempt);
  } catch (error) {
    if (error.status === 409 || error.status === 422) return false;
    throw error;
  }

  const ctx={repository:snapshot.rcfg.repository,queue:snapshot.queue,task,attempt,dispatcherId,claimPath,promptSha256};
  try {
    const tab = await chrome.tabs.create({url:CHAT_URL,active:true});
    await waitTabComplete(tab.id);
    const token = crypto.randomUUID();
    if (task.metadata.chatgpt.dispatch_mode === "confirm") {
      const stored = await chrome.storage.local.get(["pendingConfirmations"]);
      const pending = stored.pendingConfirmations || {};
      pending[token] = {ctx};
      await chrome.storage.local.set({pendingConfirmations:pending});
    }
    const response = await chrome.tabs.sendMessage(tab.id,{
      type:"scheduswarm.dispatch",
      payload:{task:task.metadata,prompt:task.prompt,ui:cfg.ui,dispatchToken:token}
    });
    if (!response || !response.ok) {
      await writeReceipt(ctx,"failed",{chatUrl:tab.url,failureStage:"pre-submit-ui",error:(response && response.error) || "unknown UI failure"});
      return true;
    }
    const result = response.result;
    if (result.state === "submitted") await writeReceipt(ctx,"submitted",result);
    else if (result.state === "ambiguous") await writeReceipt(ctx,"failed",{...result,failureStage:"post-submit-ambiguous"});
    else if (result.state === "prepared") { console.info("Scheduswarm task prepared", task.metadata.task_id); }
    return true;
  } catch (error) {
    await writeReceipt(ctx,"failed",{failureStage:"dispatcher",error:String(error && error.message || error)}).catch(()=>{});
    return true;
  }
}

async function poll() {
  const cfg = await config();
  if (!cfg.enabled) return;
  const snapshots = [];
  for (const rcfg of cfg.repositories || []) {
    try { snapshots.push(await snapshotRepository(rcfg)); }
    catch (error) { console.error("Scheduswarm snapshot failed",rcfg.repository,error); }
  }
  const globalExecuting = snapshots.reduce((n,s)=>n+s.executing,0);
  let slots = Math.max(0,(cfg.globalConcurrency || 1)-globalExecuting);
  if (!slots) return;

  const candidates = [];
  for (const snapshot of snapshots) {
    if (snapshot.executing >= snapshot.policy.project_concurrency_budget) continue;
    for (const task of snapshot.activeTasks) {
      const e = eligibleTask(snapshot,task);
      if (e.ok) candidates.push({snapshot,task,attempt:e.attempt});
    }
  }
  candidates.sort((a,b)=>priorityRank(a.task.metadata.priority)-priorityRank(b.task.metadata.priority) ||
    Date.parse(a.task.metadata.created_at)-Date.parse(b.task.metadata.created_at));

  const usedByRepo = new Map();
  for (const c of candidates) {
    if (!slots) break;
    const repository = c.snapshot.rcfg.repository;
    const used = usedByRepo.get(repository) || 0;
    if (c.snapshot.executing + used >= c.snapshot.policy.project_concurrency_budget) continue;
    const claimed = await claimAndDispatch(c.snapshot,c.task,c.attempt,cfg);
    if (claimed) { slots--; usedByRepo.set(repository,used+1); }
  }
}

async function resetAlarm() {
  const cfg = await config();
  await chrome.alarms.clear("scheduswarm-poll");
  if (cfg.enabled) chrome.alarms.create("scheduswarm-poll",{periodInMinutes:Math.max(1,cfg.pollMinutes || 1)});
}

chrome.runtime.onInstalled.addListener(()=>resetAlarm().catch(console.error));
chrome.runtime.onStartup.addListener(()=>resetAlarm().catch(console.error));
chrome.alarms.onAlarm.addListener(a=>{if(a.name==="scheduswarm-poll") poll().catch(console.error);});
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if (message && message.type === "scheduswarm.pollNow") {
    poll().then(()=>sendResponse({ok:true})).catch(e=>sendResponse({ok:false,error:String(e)}));
    return true;
  }
  if (message && message.type === "scheduswarm.configChanged") {
    resetAlarm().then(()=>sendResponse({ok:true})).catch(e=>sendResponse({ok:false,error:String(e)}));
    return true;
  }
  if (message && message.type === "scheduswarm.confirmedSubmit") {
    (async()=>{
      const stored = await chrome.storage.local.get(["pendingConfirmations"]);
      const pending = stored.pendingConfirmations || {};
      const item = pending[message.dispatchToken];
      if (!item) throw new Error("unknown confirmation token");
      await writeReceipt(item.ctx,"submitted",{
        chatUrl:message.chatUrl,
        verifiedModel:item.ctx.task.metadata.chatgpt.model_label,
        verifiedEffort:item.ctx.task.metadata.chatgpt.effort_label
      });
      delete pending[message.dispatchToken];
      await chrome.storage.local.set({pendingConfirmations:pending});
    })().then(()=>sendResponse({ok:true})).catch(e=>sendResponse({ok:false,error:String(e)}));
    return true;
  }
});
