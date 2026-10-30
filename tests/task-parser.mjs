import fs from "node:fs";
import assert from "node:assert/strict";
import {
  parseJsonFrontmatter,
  validateTask,
  parsePolicyMarkdown,
  priorityRank
} from "../dispatcher/chrome-extension/task.js";

const task = fs.readFileSync(new URL("../templates/task.md", import.meta.url), "utf8");
const parsed = parseJsonFrontmatter(task);
validateTask(parsed.metadata, "owner/repository");
assert.match(parsed.prompt, /Current objective/);
assert.equal(priorityRank("critical"),0);
assert.equal(priorityRank("background"),3);

assert.throws(()=>validateTask({...parsed.metadata,queue_branch:"main"},"owner/repository"),/TASK_REFUSED/);
assert.throws(()=>validateTask({...parsed.metadata,repository:"other/repo"},"owner/repository"),/TASK_REFUSED/);
assert.throws(()=>parseJsonFrontmatter("no-frontmatter"),/TASK_REFUSED/);\nconst crlf=parseJsonFrontmatter(task.replace(/\\n/g,"\\r\\n"));\nassert.equal(crlf.metadata.task_id,parsed.metadata.task_id);\nassert.match(crlf.prompt,/Current objective/);

const policy = `# Policy

\`\`\`yaml
scheduswarm_version: 2
status: active
queue_branch: scheduswarm/queue
max_active_lanes: 3
project_concurrency_budget: 2
successors_per_lane: 1
integration_writes_parallel: false
automatic_dispatch_allowed: false
\`\`\`
`;
const p=parsePolicyMarkdown(policy);
assert.equal(p.status,"active");
assert.equal(p.max_active_lanes,3);
assert.equal(p.project_concurrency_budget,2);
assert.equal(p.automatic_dispatch_allowed,false);
assert.throws(()=>parsePolicyMarkdown(policy.replace("project_concurrency_budget: 2","project_concurrency_budget: 4")),/POLICY_REFUSED/);

for (const path of [
  "schemas/task-envelope.schema.json",
  "schemas/claim.schema.json",
  "schemas/receipt.schema.json",
  "schemas/completion.schema.json",
  "schemas/recovery.schema.json",
  "dispatcher/chrome-extension/manifest.json"
]) JSON.parse(fs.readFileSync(new URL("../"+path, import.meta.url),"utf8"));

console.log("Scheduswarm v2 parser/config tests PASS");
