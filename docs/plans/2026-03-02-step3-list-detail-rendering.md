# Step 3 List & Detail Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade resource list/detail pages from placeholders to mock-data-driven rendering with unified card and reusable code/copy components.

**Architecture:** Build shared `common` and `resource` components first, then wire four list pages to `listContents` and four detail pages to `get*` APIs. Keep unimplemented behavior in `Placeholder` while ensuring core data blocks are visible and copyable.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, existing local mock API/adapters.

### Task 1: Shared common/resource components
- Create copy/code UI primitives and unified resource card/list/filter bar.

### Task 2: Upgrade list pages
- Update prompts/mcps/skills/tutorials list pages to render `FilterBar + ResourceList` from `listContents`.

### Task 3: Upgrade detail pages
- Update four detail pages to render required core sections with copyable code blocks and friendly empty state.

### Task 4: Decision notes and adapters
- Keep or strengthen NOTE/TODO comments around DECISIONS conflicts in adapter/rendering areas.

### Task 5: Verify
- Run tsc/lint/dev route checks.
