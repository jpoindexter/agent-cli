# Provider Approval QA

Packaged native QA on 2026-07-13 exercised the provider approval lifecycle with an isolated local app-server fixture. The fixture emitted the same JSON-RPC approval request shape used by the Codex adapter and did not execute external commands.

## Executed Paths

- **Deny:** the card showed the exact command, working directory, and reason; Deny returned provider feedback and persisted `Decision: Deny · user`.
- **Allow once:** Allow once resumed the requesting run and persisted `Decision: Allow once · user`.
- **Concurrent chat:** a second chat completed `CONCURRENT-SURVIVED` while the approval chat was not selected.
- **Stop and close:** stopping a run with a pending request persisted `Decision: Canceled · run closed`.
- **Relaunch:** the canceled decision restored from the SQLite chat store after the packaged app was killed and relaunched.
- **Timeout:** Rust tests execute the five-minute expiration boundary and verify that expired requests resolve without affecting another run.

SQLite inspection independently confirmed decision, resolution source, run id, and resolution timestamp for allow, deny, and close paths. The original user app-support directory was restored byte-for-byte after QA.

## Evidence

- [Allow once](native-allow-once.jpeg)
- [Deny](native-deny.jpeg)
- [Concurrent completion](native-concurrent-complete.jpeg)
- [Stop resolution](native-stop-resolution.jpeg)
- [Relaunch restoration](native-relaunch.jpeg)

The deterministic fixture lives in `scripts/fixtures/fake-codex-app-server.mjs`; it is test support, not a production provider.
