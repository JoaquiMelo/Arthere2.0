# Repository Agent Instructions

## Design and experience work

For any task involving UI, UX, screens, components, navigation, forms, visual styling, interaction, animation, accessibility, or user-facing feedback, read and follow:

`.agents/skills/arthere-design/SKILL.md`

Consult the relevant references under `.agents/skills/arthere-design/references/` and use the templates when performing a screen audit or substantial redesign.

Treat the Arthere Design skill as the project's design and experience quality standard. Preserve existing product behavior, API contracts, authentication, role permissions, and Expo architecture. Do not claim validation that was not performed.

## General repository safety

- Inspect the relevant files and local conventions before editing.
- Keep changes scoped to the requested task.
- Do not replace real API data with mocks.
- Do not expose secrets, tokens, or private user data.
- Report files changed, checks run, and remaining risks.

<!-- mobile-app-ux-auditor:start -->
# Mobile App UX Auditor

Use the mobile-app-ux-auditor Agent Skill for mobile app UI/UX reviews, redesigns, navigation audits, onboarding, forms, accessibility, platform-native fit, retention, and flow improvements.

Canonical skill path in this project: .agents/skills/mobile-app-ux-auditor/SKILL.md

Follow the skill workflow before recommending changes:
- inspect code, screens, routes, navigation, forms, states, accessibility props, and runtime behavior;
- run the bundled static scanner when code is available;
- rank findings by user impact;
- verify with simulator/device, screen reader, screenshots, tests, or static evidence.
<!-- mobile-app-ux-auditor:end -->
