# Business Requirements Document (BRD)
**Project Name:** MyWallet
**Document Version:** 1.0
**Date:** July 2026

## 1. Executive Summary
MyWallet is a comprehensive, offline-first personal finance management application designed for Android devices. In a market flooded with subscription-based, cloud-dependent financial trackers that often compromise user privacy, MyWallet aims to deliver a highly premium, visually stunning (Liquid Depth design), and incredibly fast alternative that respects user data ownership. By leveraging local NoSQL storage (ObjectBox) and modern Android UI toolkits (Jetpack Compose), MyWallet provides an unmatched user experience encompassing everything from basic expense tracking to advanced asset management, budgeting, and AI-driven insights.

## 2. Business Objectives
* **BO-1: Data Privacy & Ownership:** Ensure 100% of user financial data remains exclusively on their local device, requiring no mandatory cloud syncing or account creation.
* **BO-2: Comprehensive Financial Overview:** Provide a single pane of glass for users to track all assets (cash, checking, credit, loans, investments, insurance) to accurately calculate real-time Net Worth.
* **BO-3: Premium User Experience:** Deliver an aesthetic and highly responsive user interface that feels premium, engaging, and modern, encouraging daily user interaction.
* **BO-4: Gamification & Behavioral Change:** Implement features like Spending Challenges, Milestones, and Financial Health Scores to actively encourage better financial habits.

## 3. Project Scope

### 3.1 In-Scope
* **Core Ledger:** Double-entry-like tracking of income, expenses, and transfers.
* **Asset & Liability Management:** Support for managing Loans, Credit Cards (with billing cycles), and Savings Instruments.
* **Budgeting & Goals:** Category-specific budgeting, Wishlist tracking, and Sinking Funds.
* **Analytics & Reporting:** Spending Heatmaps, Monthly Recaps, Tax Summaries, and Cash Flow visualizations.
* **Smart Tools:** AI Chat Assistant, Receipt Gallery, Bill Splitter, Currency Converter.
* **Security:** Biometric App Lock, Encrypted Secure Vault.

### 3.2 Out-of-Scope (Future Considerations)
* Automatic bank synchronization via Plaid or similar APIs (violates offline-first objective).
* Cloud backup/sync functionality (unless explicitly managed via user's personal Google Drive/Dropbox in a future release).
* Multi-user shared accounts in real-time (due to local-only database limitations).

## 4. Target Audience & User Personas

### Persona 1: The Casual Tracker (Emma)
* **Demographic:** Young professional, 25-30.
* **Goals:** Wants to know where her money goes each month and stop overspending on dining out.
* **Key Features Used:** Dashboard, Quick Add Transaction, Category Budgets, Spending Challenges.

### Persona 2: The Wealth Builder (David)
* **Demographic:** Established professional, 35-45.
* **Goals:** Actively tracking net worth progression, managing a mortgage, and ensuring various sinking funds are funded.
* **Key Features Used:** Net Worth Tracker, Loan Module, Sinking Funds, Insurance Module, Tax Summaries.

### Persona 3: The Privacy Advocate (Alex)
* **Demographic:** Tech-savvy user, 28-40.
* **Goals:** Refuses to use apps that harvest financial data or require linking bank credentials.
* **Key Features Used:** Secure Vault, Audit Trail, Manual Import/Export, Offline AI Parsing.

## 5. High-Level Business Requirements

| ID | Requirement Description | Priority |
|---|---|---|
| **BR-01** | The system must allow users to record income, expenses, and transfers without an internet connection. | High |
| **BR-02** | The system must support the creation and management of custom categories and accounts. | High |
| **BR-03** | The system must provide visual analytics (charts/graphs) summarizing monthly cash flow. | High |
| **BR-04** | The system must allow users to set monthly spending limits per category and track progress. | High |
| **BR-05** | The system must automatically identify and manage recurring subscriptions and predict future bills. | Medium |
| **BR-06** | The system must evaluate the user's financial standing and output a unified 'Health Score'. | Medium |
| **BR-07** | The system must include a gamified milestone system to reward positive financial actions. | Medium |
| **BR-08** | The system must encrypt highly sensitive text/data within a 'Secure Vault' feature. | High |
| **BR-09** | The system must allow users to export their financial data (CSV/Excel) for external use. | High |
| **BR-10** | The system must lock access to the application via OS-level Biometrics or a PIN. | High |

## 6. Assumptions & Constraints

### 6.1 Assumptions
* Users have access to an Android device running Android 8.0 (API level 26) or higher.
* Users are willing to manually input transactions or use receipt scanning/NLP entry, as auto-sync is explicitly excluded.

### 6.2 Constraints
* **Storage:** Database size is limited by the physical storage capacity of the user's device.
* **Processing:** Advanced features like NLP parsing and image processing (receipts) must be lightweight enough to execute on edge devices without crashing or severely draining the battery.
* **Platform:** The application is strictly built for Android; iOS is not supported in this phase.
