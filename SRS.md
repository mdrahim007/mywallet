# Software Requirements Specification (SRS)
**Project Name:** MyWallet
**Document Version:** 1.1 (Detailed)
**Date:** July 2026

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) provides a comprehensive description of the MyWallet application. It defines the system architecture, detailed functional requirements across all modules, data models, and non-functional requirements. This document is intended for use by software developers, UI/UX designers, and quality assurance testers as the primary reference for the system's capabilities.

### 1.2 Document Conventions
This document adheres to standard IEEE 830 formatting conventions.
* **Must/Shall:** Indicates a mandatory requirement.
* **Should:** Indicates a highly desirable, but non-mandatory requirement.
* **May:** Indicates an optional requirement.

### 1.3 Intended Audience
* **Development Team:** For implementing new features and maintaining the codebase.
* **Design Team:** To ensure adherence to the defined "Liquid Depth" design system constraints.
* **Stakeholders/Project Managers:** To track feature completeness against initial sprint goals.

### 1.4 Product Scope
MyWallet is a robust, privacy-first, offline personal finance manager built for Android. It handles a vast array of financial tracking capabilities ranging from standard expense logging to complex asset management, AI-driven transaction categorization, and deep data analytics. The core philosophy of the application is "Absolute Data Sovereignty"—no financial data is ever transmitted to a cloud server.

---

## 2. Overall Description

### 2.1 Product Perspective
MyWallet operates entirely as a local Android application. It interfaces directly with the device's file system via the ObjectBox NoSQL database engine. The system operates independently of external web services, barring optional API calls for real-time currency conversion rates (if enabled by the user). 

### 2.2 User Characteristics
The user base ranges from casual budgeters looking for aesthetic expense tracking to financial power users requiring granular control over loan amortizations, net worth calculations, and credit utilization tracking. Users expect instantaneous performance and a highly polished UI.

### 2.3 Operating Environment
* **OS:** Android 8.0 (Oreo - API Level 26) and higher.
* **Hardware:** Modern smartphone architectures (ARM64). Requires camera hardware for receipt scanning and biometric sensors for App Lock.

### 2.4 Design and Implementation Constraints
* **Language:** Strictly Kotlin.
* **UI Framework:** Strictly Jetpack Compose. Old XML-based layouts are prohibited.
* **Architecture:** MVVM (Model-View-ViewModel) paired with clean architecture principles.
* **Database:** ObjectBox. Room/SQLite are not to be used due to performance requirements.

---

## 3. Specific Requirements (System Features)

The application is heavily modularized into distinct feature sets, implemented across 8 sequential development sprints.

### 3.1 Sprint 1 & Core Foundation
**3.1.1 Dashboard Module**
* The system shall present a unified dashboard displaying total liquid balance.
* The system shall display a rolling list of the 5 most recent transactions.
* The system must provide quick-action FABs for instantly adding a transaction.

**3.1.2 Accounts Module**
* The system shall allow users to create Accounts with specific types (Checking, Savings, Cash, Credit Card).
* The system must aggregate the balances of all non-liability accounts to calculate "Total Balance".
* Account deletion must check for orphaned transactions and cascade deletions appropriately.

**3.1.3 Transactions Ledger**
* Users shall be able to log Income, Expense, or Transfer transaction types.
* The system shall support tagging transactions with Categories, Merchants, and Dates.
* The system shall allow users to attach photographic receipts to transactions.

**3.1.4 Categories Module**
* The system must ship with a default set of pre-configured categories and distinct icons.
* Users shall be able to create custom categories with user-selected colors and icons.

### 3.2 Sprint 2 & 3: Advanced Tracking & Analytics
**3.2.1 Budgeting System**
* Users shall be able to define monthly spending limits per category.
* The system must calculate and display real-time budget utilization via progress arcs.

**3.2.2 Net Worth Tracker**
* The system shall automatically calculate Net Worth by aggregating all Asset accounts minus Liability accounts (Loans, Credit balances).
* The system shall record periodic 'Snapshots' of net worth to plot historical trends on a line graph.

**3.2.3 Analytics & Heatmaps**
* The system shall generate a visual Spending Heatmap detailing high-frequency spending days.
* The system shall provide pie charts detailing spending distribution by category.

**3.2.4 Currency Converter**
* The system shall provide a built-in utility for converting currencies.

### 3.3 Sprint 4 & 5: Utilities & Reporting
**3.3.1 Bill Splitter**
* The system shall allow users to create a 'Bill Split' event, add participants, and distribute costs.
* The system shall calculate who owes whom to settle the bill optimally.

**3.3.2 Monthly Recap & Statements**
* At the end of a calendar month, the system shall generate a highly visual "Recap" summarizing top spending categories, total saved, and milestones achieved.
* The system shall generate formal PDF/UI statements for designated accounts.

**3.3.3 Tax Summary**
* The system shall aggregate all transactions flagged as "Tax Deductible" and compile a dedicated tax report.

**3.3.4 Export Module**
* The system shall provide functionality to dump all ObjectBox entities into standard CSV format for external analysis.

### 3.4 Sprint 6 & 7: Forecasting & Automation
**3.4.1 Subscriptions & Recurring Bills**
* The system shall allow manual entry of recurring bills (Netflix, Rent, etc.).
* The system shall provide a Payment Calendar view plotting upcoming due dates.

**3.4.2 Spending Forecast**
* The system shall analyze the spending velocity of the current month and project the end-of-month balance.

**3.4.3 Goal Tracking & Wishlist**
* Users shall be able to set target savings amounts (Goals) and allocate funds from Accounts towards these goals without actually transferring money (virtual allocation).

### 3.5 Sprint 8: Security & AI
**3.5.1 Secure Vault**
* The system shall provide a secure partition within the app to store highly sensitive data (PINs, SSN).
* Vault data must be encrypted at rest using AES-256 before insertion into ObjectBox.

**3.5.2 App Lock & Audit Trail**
* The app shall require OS-level biometric authentication upon cold start or after a timeout period.
* The system shall silently log critical security events (failed logins, vault access, bulk deletions) into a tamper-evident Audit Trail entity.

**3.5.3 AI Assistant & NLP Parser**
* The system shall feature a conversational UI capable of answering questions based on the user's financial data.
* The system shall attempt to parse free-text input (e.g., "Spent $12 on coffee at Starbucks") into structured Transaction objects.

---

## 4. Data Model & Architecture

### 4.1 Primary Entities
The system relies on the following core ObjectBox schemas:
1. `Account`: Tracks ID, Name, Type, Initial Balance, Current Balance, Currency.
2. `Transaction`: Tracks ID, Amount, Type (Enum), Date, AccountId, CategoryId, Merchant, Notes, ReceiptPath.
3. `Category`: Tracks ID, Name, IconCode, HexColor.
4. `Budget`: Tracks ID, CategoryId, MonthlyLimit, CurrentSpent.
5. `Loan`: Tracks ID, Principal, InterestRate, TermMonths, StartDate.

### 4.2 Security Entities
1. `VaultItem`: Tracks ID, EncryptedTitle, EncryptedContent, InitializationVector.
2. `LoginAuditEntry`: Tracks ID, Timestamp, EventType, SuccessFlag.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
* **Response Time:** Navigating between bottom-nav tabs must occur in under 16ms (60 FPS) without jank.
* **Database I/O:** Reading the full transaction history for the dashboard must execute in under 50ms.

### 5.2 Aesthetic Requirements (Liquid Depth)
* All UI components must adhere strictly to the `LocalLiquidDepthColors` palette.
* Transparent components (GlassCards, GlassTopBars) must feature subtle borders and blurred backgrounds to simulate physical glass.
* Deep drop shadows using multiple gradient stops are required to simulate depth and floating elements.

### 5.3 Reliability & Maintainability
* **Crash Rate:** The application must maintain a crash-free session rate of 99.9%.
* **Modularity:** Features must remain strictly segregated into their respective packages within `feature/` to prevent monolithic coupling.
