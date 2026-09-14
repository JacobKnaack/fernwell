# Code Style & Engineering Guidelines

## General Principles

* Maintain strict component encapsulation—avoid global CSS overrides outside design tokens.
* Expose typed props for all component variants, sizes, and states.
* Ensure 100% WCAG 2.1 AA accessibility compliance (keyboard navigation, ARIA attributes, semantic HTML).

## Typescript

* Enable strict mode in tsconfig.json.
* Never use any; use unknown when types are genuinely dynamic, followed by explicit type narrowing.
* Export all component prop types from the package entry point using type or interface exports.
* Prefer interface for public component props to allow contract extension.
* Use discriminating unions for mutually exclusive component states or props.

## HTMl & Accessibility

* Always use semantic HTML elements (\<button>, \<nav>, \<aside>, \<main>) before falling back to \<div> or \<span>.
* Ensure all interactive elements have accessible names via visible text or aria-label/aria-labelledby.
* Manage focus state explicitly using ref callbacks for modal dialogs, menus, and popovers.

## CSS & Styling

* Reference design tokens via CSS custom properties (var(--ds-color-primary)) rather than hardcoded visual values.
* Prefix all custom properties and CSS classes with the package scope (e.g., --ds-*, .ds-*).
* Do not use inline style attributes except for dynamic runtime values (e.g., custom positioning offsets).
* Ensure focus indicators (:focus-visible) are preserved and high-contrast across all interactive tokens.

## Component Design

* Design components as pure presentations where possible, decoupling business logic from UI elements.
* Accept a className prop on top-level elements to allow light layout integration without breaking internal styles.
* Support controlled and uncontrolled patterns for stateful inputs (value + onChange vs. defaultValue).
