# garaku-frontend – Copilot Instructions

英語で考えて、日本語で出力してください。  
Think in English, respond in Japanese.

## Commands

```bash
npm start                    # dev server (Vite)
npm run build                # production build
npm run lint                 # ESLint
npm run typecheck            # tsc --noEmit (runs automatically on git push)

# Unit tests
npm run test:unit            # all unit tests
npx jest src/path/to/file.test.tsx   # single file

# E2E tests (requires playwright/.auth/ — run setup first)
npm run test:e2e:setup
npm run test:e2e -- smoke-test --project=chromium-staff
npm run test:e2e -- smoke-test --project=chromium-admin
```

## Architecture — Feature-Sliced Design (FSD)

Dependency direction is strictly **downward only**: `pages` → `processes` → `features` → `entities` → `shared`

| Layer | Path | Role |
|---|---|---|
| `pages` | `src/pages/` | Route-level page components (lazy-loaded via `createLazyRoute`) |
| `processes` | `src/processes/` | Cross-page business flows (e.g., `office-access`) |
| `features` | `src/features/` | Single-screen feature units; each has `ui/`, `model/`, `lib/` |
| `entities` | `src/entities/` | Domain types, API clients, business logic (`attendance`, `shift`, `staff`, `workflow`, etc.) |
| `shared` | `src/shared/` | Project-wide UI components, hooks, utilities — imported via `@shared/*` |
| `widgets` | `src/widgets/` | Large UI blocks used across pages (header, footer, snackbar) |

### Path aliases (tsconfig.json)

```
@/*         → src/*
@app/*      → src/app/*
@pages/*    → src/pages/*
@features/* → src/features/*
@entities/* → src/entities/*
@shared/*   → src/shared/*
@processes/* → src/processes/*
```

Always use aliases instead of relative `../` paths.

### Routing

All routes are **lazy-loaded** via `createLazyRoute()` in `src/router.tsx`.  
Route loaders live in `src/router/loaders/`. Pages that need MUI X date pickers are wrapped with `wrapWithMuiXDateProvider`.

### Backend

AWS Amplify (AppSync / GraphQL + Cognito). Real-time updates use GraphQL Subscriptions — do not add polling.

## Key Conventions

### Auto-generated files — DO NOT manually edit

- `src/shared/api/graphql/**` — regenerate with `amplify codegen`
- `src/ui-components/**` — regenerate with `amplify pull`
- `src/aws-exports.js`

To change GraphQL schema, edit `amplify/backend/api/garakufrontend/schema.graphql`, then run `amplify codegen`.

### UI component rules

- **Never** import MUI components directly (`import { Button } from '@mui/material'`). Use the wrappers in `src/shared/ui/` (e.g., `AppButton`, `AppIconButton`, `AppDialog`, `ConfirmDialog`).
- Styling: MUI `sx` prop is primary; Tailwind CSS is supplementary for layout utilities.
- Do **not** create new `.scss` files (SCSS is being phased out).
- Page layout: wrap content in `Page` / `PageContent` / `PageSection` from `src/shared/ui/layout/`.
- Design tokens: use `designTokenVar()` from `src/shared/designSystem/` — do not hardcode colors or spacing.

### State management

- **Global UI state** (e.g., snackbar/notifications): Redux Toolkit via `@reduxjs/toolkit` + `react-redux`
- **Auth / config**: Context API — `AuthContext`, `AppConfigContext`, `ThemeContext` in `src/context/`
- **Forms**: React Hook Form + Zod (`zodResolver`)

### TypeScript conventions

- `no-explicit-any` is enforced — use proper types or generics
- No `I` prefix on interfaces
- Use `interface` for object types, `type` for unions/tuples
- Use `readonly` where possible
- `async/await` over Promise chains

### Testing conventions (see `.github/instructions/testing-guide.md` for full details)

Unit/integration tests live in `__tests__/` next to the file under test.

```typescript
// Use renderWithProviders (not bare render) — wraps Router + Redux + Context
import { renderWithProviders } from "@shared/test-utils";

// Factory helpers
import { createMockAppConfig, createMockUser, createMockAttendance } from "@shared/test-utils";
```

E2E tests go in `playwright/tests/<feature>/flow.spec.ts`.  
Auth state is pre-loaded from `playwright/.auth/` — no login steps needed in tests.  
Use `test.step()` to group operations and `data-testid` for stable locators.

### Shift collaborative editing

Managed by GraphQL Subscription in `src/pages/shift/collaborative/` and `src/features/shift/collaborative/`.  
Self-emitted events must be filtered by `updatedBy === currentUserId` to prevent double-apply.  
See `.github/instructions/shiftCollaborative.instructions.md` for guardrails.

## Feature-specific instruction files

| File | Topic |
|---|---|
| `.github/instructions/attendanceEdit.instructions.md` | 勤怠編集 |
| `.github/instructions/attendanceList.instructions.md` | 勤怠一覧 |
| `.github/instructions/register.instructions.md` | 打刻ページ |
| `.github/instructions/registerDashboard.instructions.md` | ダッシュボード |
| `.github/instructions/shift.instructions.md` | シフト全般 |
| `.github/instructions/shiftCollaborative.instructions.md` | シフト共同編集 |
| `.github/instructions/dailyReport.instructions.md` | 日報 |
| `.github/instructions/testing-guide.md` | テスト規約 |
| `.github/instructions/amplifyGraphqlGenerated.instructions.md` | 自動生成ファイル |

## Commit and issue conventions

- Commit messages: **English** (e.g., `Add Playwright coverage for attendance editor`)
- GitHub Issues (title, body, comments): **日本語**
- No work-in-progress comments in code (e.g., "// 修正", "// 削除")

## Domain terms

| Term | Meaning |
|---|---|
| 勤怠 (Attendance) | Record of staff work hours: clock-in/out, breaks |
| 打刻 (Dakoku) | The act of recording a time stamp (clock-in/out/break) |
| 打刻エラー | Error when a stamp is missed; resolved by staff submitting a correction request, approved by admin |
| ワークフロー (Workflow) | Approval flow for attendance correction requests |
