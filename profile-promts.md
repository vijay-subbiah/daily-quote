# Angular Performance Profiling: Copilot/VS Code Prompts

## Bundle Analysis and Code Splitting

**Prompt:**  
Generate a webpack-bundle-analyzer integration for an Angular app. Add Angular build budgets and new npm scripts to analyze bundle size and output a stats file after build.

---

## Angular Performance Monitoring Service

**Prompt:**  
Write an Angular singleton service named PerformanceMonitorService. It should log navigation timing and monitor Core Web Vitals (LCP, FID, CLS) using the PerformanceObserver API, and print results on navigation end events.

---

## Change Detection Profiling

**Prompt:**  
Create an Angular service that uses NgZone to track and log the number of change detection cycles and total time elapsed during stability events across the application.

---

## VS Code Launch Configuration for Performance Debugging

**Prompt:**  
Draft a .vscode/launch.json file for Angular apps that adds a configuration to launch Chrome with performance flags for precise memory info and GPU benchmarking, mapping to a development server on port 4200.

---

## VS Code Tasks for Performance Analysis

**Prompt:**  
Generate a .vscode/tasks.json for Angular that includes tasks to build with source maps, run bundle analysis (calling build:analyze), and execute test:performance scripts.

---

## OnPush Change Detection and Immutable Data Handling

**Prompt:**  
Scaffold an Angular component using ChangeDetectionStrategy.OnPush and demonstrate handling immutable @Input() data, plus a trackBy function for lists.

---

## Lazy Loading and Preloading Strategy

**Prompt:**  
Write a routing module that implements Angular lazy loading with PreloadAllModules, shows a single route using loadChildren, and uses the data.preload flag.

---

## Angular Unit Test for Performance (Initialization Time & Memory)

**Prompt:**  
Draft Jasmine unit tests for an Angular component to measure initialization time in milliseconds and JavaScript heap memory usage, asserting each is under a budget.

---

## Cypress E2E Performance Test Scripts

**Prompt:**  
Create Cypress E2E tests that verify the main page loads within 3 seconds, and that user interface actions maintain at least 60 frames per second.

---

## GitHub Actions Workflow for Performance Monitoring

**Prompt:**  
Construct a .github/workflows/performance.yml pipeline to checkout, install, build:analyze, and run performance checks, including bundlesize and Lighthouse CI with budget enforcement.

---

## Real-Time Angular Performance Dashboard Component

**Prompt:**  
Code an Angular component named PerformanceDashboardComponent displaying memory usage and FPS in a responsive grid, with values updated every five seconds and a warning style if thresholds are exceeded.

