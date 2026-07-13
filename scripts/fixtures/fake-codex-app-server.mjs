#!/usr/bin/env node

import readline from "node:readline";

const input = readline.createInterface({ input: process.stdin });
const threadId = `fake-thread-${process.pid}`;
let activeTurnId = null;
let pendingApproval = false;
let waitTimer = null;

const send = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);

const completeTurn = (text, status = "completed") => {
  if (text) {
    send({ jsonrpc: "2.0", method: "item/agentMessage/delta", params: { itemId: "fake-agent-message", delta: text } });
    send({
      jsonrpc: "2.0",
      method: "item/completed",
      params: { item: { id: "fake-agent-message", type: "agentMessage", text } },
    });
  }
  send({ jsonrpc: "2.0", method: "turn/completed", params: { turn: { id: activeTurnId, status } } });
};

const promptText = (params) => (Array.isArray(params?.input) ? params.input : [])
  .map((item) => typeof item?.text === "string" ? item.text : "")
  .join("\n");

input.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  if (message.id === 1 && message.method === "initialize") {
    send({ jsonrpc: "2.0", id: 1, result: { capabilities: {} } });
    return;
  }
  if (message.id === 2 && (message.method === "thread/start" || message.method === "thread/resume")) {
    send({ jsonrpc: "2.0", id: 2, result: { thread: { id: message.params?.threadId || threadId } } });
    return;
  }
  if (message.id === 3 && message.method === "turn/start") {
    activeTurnId = `fake-turn-${process.pid}`;
    send({ jsonrpc: "2.0", id: 3, result: { turn: { id: activeTurnId } } });
    const prompt = promptText(message.params);
    if (prompt.includes("CONCURRENT-WAIT")) {
      waitTimer = setTimeout(() => completeTurn("CONCURRENT-SURVIVED"), 15_000);
      return;
    }
    pendingApproval = true;
    send({
      jsonrpc: "2.0",
      id: 41,
      method: "item/commandExecution/requestApproval",
      params: {
        command: "printf approval-fixture",
        cwd: "/tmp/keelhouse-approval-fixture",
        reason: `Local approval fixture for ${prompt || "untitled prompt"}`,
      },
    });
    return;
  }
  if (message.id === 41 && pendingApproval) {
    pendingApproval = false;
    const decision = message.result?.decision;
    const allowed = decision === "accept" || decision === "acceptForSession";
    send({
      jsonrpc: "2.0",
      method: "item/completed",
      params: {
        item: {
          id: "fake-command",
          type: "commandExecution",
          command: "printf approval-fixture",
          aggregatedOutput: allowed ? "fixture allowed" : "fixture denied; no command executed",
          status: allowed ? "completed" : "failed",
        },
      },
    });
    completeTurn(allowed ? "APPROVAL-ALLOWED" : "APPROVAL-DENIED");
    return;
  }
  if (message.method === "turn/interrupt") {
    if (waitTimer) clearTimeout(waitTimer);
    send({ jsonrpc: "2.0", id: message.id, result: {} });
    completeTurn("", "interrupted");
  }
});
