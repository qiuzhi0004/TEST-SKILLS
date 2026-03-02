# Step 2 Routing Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all routes from low-fidelity page spec as accessible Next.js App Router pages with reusable skeleton templates.

**Architecture:** Add a reusable layout primitive layer (`PageShell`, `SectionCard`, `Placeholder`) and page templates (`List/Detail/Form`) to avoid per-page duplication. Build every route in `app/` as a thin composition of template + placeholders + minimal mock rendering from `lib/api` where needed. Respect `/docs/DECISIONS.md` by intentionally skipping auth guards in this phase.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, existing local mock API layer.

### Task 1: Shared Layout Primitives

**Files:**
- Create: `components/layout/PageShell.tsx`
- Create: `components/layout/SectionCard.tsx`
- Create: `components/layout/Placeholder.tsx`
- Create: `components/layout/Breadcrumbs.tsx`
- Create: `components/layout/SideNav.tsx`
- Create: `components/layout/TabNav.tsx`

### Task 2: Page Templates

**Files:**
- Create: `components/page-templates/ListPageTemplate.tsx`
- Create: `components/page-templates/DetailPageTemplate.tsx`
- Create: `components/page-templates/FormPageTemplate.tsx`

### Task 3: Full Route Tree Pages

**Files:**
- Modify/Create route files in `app/` for home/resources/tutorial/ranks/login/me/admin paths from low-fidelity spec.
- Add NOTE comments on pages that are guard-required in spec but intentionally open in Step 2.

### Task 4: Route Documentation

**Files:**
- Create: `docs/ROUTES.md`

### Task 5: Validation

**Steps:**
- Run type-check.
- Run lint (allow pre-existing warnings outside this feature scope).
- Run dev server and verify route availability on representative pages.
