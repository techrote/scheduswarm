# Chrome Scheduswarm Dispatcher

Status: **v2 MVP / fail-closed commissioning build**.

The extension polls configured GitHub repository queue branches for immutable Scheduswarm task envelopes and opens each admitted task in a **new ChatGPT chat**.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked** and select this directory.
4. Open extension options.
5. Configure repository entries and the current ChatGPT UI selectors.
6. Start with project `automatic_dispatch_allowed: false` and task `dispatch_mode: confirm`.
7. Enable the dispatcher.

## Repository configuration

Example:

```json
[
  {
    "repository": "techrote/radiCADSAC",
    "policyRef": "main",
    "queueBranch": "scheduswarm/queue",
    "dispatcherId": "workstation-main"
  }
]
```

If a policy is still under review, `policyRef` may temporarily name the exact policy branch. Once merged, return it to `main`.

## GitHub token

Public repositories can be read without a token, but queue claims/receipts require write access.

Use a fine-grained token restricted to the repositories the dispatcher should control and only the contents permission required to write the queue branch.

The token is stored in `chrome.storage.local`; it is never written to task files or GitHub by the extension.

## ChatGPT UI selectors

Model/effort controls are intentionally local configuration because the ChatGPT UI can change independently of Scheduswarm.

The extension requires:
- model menu selector;
- effort menu selector;
- composer selector;
- send selector;
- optional submitted-state marker.

It clicks an option whose **visible text exactly equals** the task's requested label, then verifies the menu control contains that label.

If verification fails, dispatch fails closed.

### Why selectors are not hard-coded as authority

A stale selector must not silently:
- choose the wrong model;
- choose the wrong effort;
- paste into another text field;
- submit an incomplete prompt.

Commission/update selectors against the actual current ChatGPT UI before enabling automatic mode.

## Confirm mode

The extension:
1. claims the task;
2. opens a new chat;
3. verifies model and effort;
4. inserts and verifies the prompt;
5. leaves submission to the user.

When the user clicks the verified send button, the content script reports submission back to the service worker, which writes the submitted dispatch receipt.

## Automatic mode

Automatic mode additionally clicks send and verifies submission by at least one configured observable state (URL/chat transition, submitted marker, or composer transition).

If send was clicked but confirmation cannot be established, the attempt is marked ambiguous/failed and **must not automatically redispatch**. Follow the recovery protocol.

## Queue write model

The dispatcher writes only:
- `.scheduswarm/claims/`;
- `.scheduswarm/receipts/`.

Workers write:
- successor `.scheduswarm/tasks/`;
- `.scheduswarm/completions/`.

Recovery is explicit under `.scheduswarm/recoveries/`.

## Known MVP limitations

- No Chrome Web Store packaging yet.
- No graphical queue dashboard yet.
- Recovery records are repository/manual operations rather than an extension UI.
- Model/effort selectors require local commissioning.
- The dispatcher assumes the user is already authenticated to ChatGPT in Chrome.
- GitHub branch protection must allow the configured token to create queue records.
- It does not terminate duplicate/in-flight ChatGPT conversations automatically; repository ownership rules remain necessary.

These limitations are preferable to silent fallback or duplicate execution.
