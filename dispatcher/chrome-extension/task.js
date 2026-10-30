export const DISPATCHER_VERSION = "0.1.0";

export function parseJsonFrontmatter(markdown) {
  if (typeof markdown !== "string" || !markdown.startsWith("---\n")) {
    throw new Error("TASK_REFUSED: missing JSON frontmatter opener");
  }
  const end = markdown.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("TASK_REFUSED: missing JSON frontmatter closer");
  const raw = markdown.slice(4, end).trim();
  let metadata;
  try { metadata = JSON.parse(raw); }
  catch (error) { throw new Error("TASK_REFUSED: invalid JSON frontmatter: " + error.message); }
  const prompt = markdown.slice(end + 5);
  if (!prompt.trim()) throw new Error("TASK_REFUSED: empty prompt body");
  return { metadata, prompt };
}

const TASK_ID = /^[a-z0-9][a-z0-9._-]{2,127}$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const PRIORITIES = new Set(["critical","high","normal","background"]);
const MODES = new Set(["confirm","automatic"]);

export function validateTask(meta, expectedRepository) {
  const fail = (why) => { throw new Error("TASK_REFUSED: " + why); };
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) fail("metadata must be object");
  if (meta.schema !== "scheduswarm/task-v2") fail("wrong schema");
  if (typeof meta.task_id !== "string" || !TASK_ID.test(meta.task_id)) fail("invalid task_id");
  if (typeof meta.project !== "string" || !meta.project) fail("missing project");
  if (typeof meta.repository !== "string" || !REPOSITORY.test(meta.repository)) fail("invalid repository");
  if (expectedRepository && meta.repository !== expectedRepository) fail("repository mismatch");
  if (typeof meta.lane !== "string" || !meta.lane) fail("missing lane");
  if (!Date.parse(meta.created_at)) fail("invalid created_at");
  if (meta.not_before !== null && meta.not_before !== undefined && !Date.parse(meta.not_before)) fail("invalid not_before");
  if (!PRIORITIES.has(meta.priority)) fail("invalid priority");
  if (meta.queue_branch !== "scheduswarm/queue") fail("wrong queue branch");
  if (!meta.chatgpt || typeof meta.chatgpt !== "object") fail("missing chatgpt config");
  if (typeof meta.chatgpt.model_label !== "string" || !meta.chatgpt.model_label) fail("missing model_label");
  if (typeof meta.chatgpt.effort_label !== "string" || !meta.chatgpt.effort_label) fail("missing effort_label");
  if (!MODES.has(meta.chatgpt.dispatch_mode)) fail("invalid dispatch_mode");
  if (meta.chatgpt.require_new_chat !== true) fail("require_new_chat must be true");
  if (!meta.coordination || meta.coordination.policy_path !== "SCHEDUSWARM.md") fail("wrong policy_path");
  if (meta.coordination.max_successors !== 1) fail("max_successors must be 1");
  return meta;
}

export function parsePolicyMarkdown(markdown) {
  const match = markdown.match(/\`\`\`yaml\s*\n([\s\S]*?)\n\`\`\`/i);
  if (!match) throw new Error("POLICY_REFUSED: missing YAML configuration block");
  const out = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i < 1) continue;
    const key = line.slice(0,i).trim();
    let value = line.slice(i+1).trim();
    if (/^(true|false)$/i.test(value)) value = value.toLowerCase() === "true";
    else if (/^-?\d+$/.test(value)) value = Number(value);
    else value = value.replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  if (out.scheduswarm_version !== 2) throw new Error("POLICY_REFUSED: requires scheduswarm_version 2");
  if (!["active","draining","paused","disabled"].includes(out.status)) throw new Error("POLICY_REFUSED: invalid status");
  if (out.queue_branch !== "scheduswarm/queue") throw new Error("POLICY_REFUSED: unexpected queue branch");
  if (!Number.isInteger(out.max_active_lanes) || out.max_active_lanes < 1) throw new Error("POLICY_REFUSED: invalid max_active_lanes");
  if (!Number.isInteger(out.project_concurrency_budget) || out.project_concurrency_budget < 1 || out.project_concurrency_budget > out.max_active_lanes) {
    throw new Error("POLICY_REFUSED: invalid project_concurrency_budget");
  }
  return out;
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

export function priorityRank(p) {
  return ({critical:0,high:1,normal:2,background:3})[p] ?? 99;
}
