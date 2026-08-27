---
title: "What Should You Automate at Work? A Practical Framework for Deciding What AI Should and Shouldn't Do"
description: "A practical framework for deciding which work tasks to automate with AI, which need human review, and which should remain human-led."

openingContext:
  - "The useful question is no longer whether AI can perform part of a job. In many roles, it can already draft, summarize, classify, search, transform, compare, and organize information. The harder question is which tasks should be delegated, under what controls, and with what level of human responsibility."
  - "Task-level analysis is more useful than job-level prediction. The International Labour Organization's 2025 update on generative AI exposure emphasizes that occupations contain different mixes of tasks and that continued human input means transformation is more likely than complete redundancy for most exposed jobs."

answerSummary: "Automate tasks that are repetitive, easy to verify, reversible, low in human impact, and safe to process with the available data. Use AI with human review when errors are detectable but consequential. Keep ambiguous, high-impact, sensitive, or accountability-heavy decisions human-led."
publishedAt: 2026-08-27
updatedAt: 2026-08-27

contentType: guide
vertical: work
category: workplace-technology
topic: task-automation-decisions

tags:
  - "work-automation"
  - "ai-at-work"
  - "decision-frameworks"
  - "human-oversight"
  - "digital-decisions"

primaryIntent: "Help readers decide which work tasks are suitable for AI automation and what level of human oversight each task needs"

audience:
  - "Professionals and small teams deciding where AI can reduce repetitive work without creating avoidable risk"
  - "Managers and independent workers who want a practical task-level automation framework rather than broad predictions about jobs"

authorId: claire-bennett

draft: false
featured: false

seoTitle: "What Should You Automate at Work? AI Decision Framework"
socialTitle: "What Should AI Do at Work, and What Should Stay Human?"
socialDescription: "Use a six-factor framework to decide what to automate, what to review, and what should remain human-led."

keyTakeaways:
  - "Evaluate automation at the task level, because a single job can contain tasks with very different levels of risk, ambiguity, and verifiability."
  - "The strongest automation candidates are repetitive, reversible, rule-based, easy to verify, and low in sensitivity or human impact."
  - "Human review adds value only when the reviewer has enough context, time, and authority to detect and correct meaningful errors."
  - "High-impact decisions, sensitive data, unclear success criteria, and difficult-to-detect errors should push a task toward human control."
  - "A small monitored trial is safer than automating an entire workflow before you know how the system fails."

faq:
  - question: "What is the easiest type of work to automate with AI?"
    answer: "Tasks with repeated inputs, clear output criteria, low sensitivity, and an inexpensive way to verify the result are usually the easiest place to start. Formatting, first-pass classification, routine summaries, and transformation of already-approved text can fit this pattern."
  - question: "Should AI-generated work always be reviewed by a person?"
    answer: "Not every low-risk transformation needs the same review burden, but consequential outputs should have a verification step. The key question is whether an error can matter and whether a reviewer can realistically detect it."
  - question: "What work should not be fully automated?"
    answer: "Tasks involving major decisions about people, legal or financial consequences, confidential information, safety, unclear objectives, or accountability that cannot be delegated should generally remain human-led or use AI only as an assistive tool."
  - question: "How do I know if human review is actually working?"
    answer: "Define what the reviewer is checking, what evidence they need, what kinds of errors require escalation, and how often errors are found. A nominal approval step is not meaningful oversight if people routinely click through without verification."
  - question: "Can an automation be useful even if it cannot finish the task?"
    answer: "Yes. Partial automation can remove mechanical work while preserving human judgment. Drafting options, extracting facts, sorting inputs, or preparing a checklist can create value even when the final decision remains human."

sources:
  - title: "Generative AI and jobs: A 2025 update"
    url: "https://www.ilo.org/publications/generative-ai-and-jobs-2025-update"
    publisher: "International Labour Organization"
    publishedAt: 2025-05-20
    accessedAt: 2026-08-27
  - title: "AI Risk Management Framework"
    url: "https://www.nist.gov/itl/ai-risk-management-framework"
    publisher: "National Institute of Standards and Technology"
    accessedAt: 2026-08-27
  - title: "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile"
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence"
    publisher: "National Institute of Standards and Technology"
    publishedAt: 2024-07-26
    accessedAt: 2026-08-27
  - title: "AI RMF Core"
    url: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/"
    publisher: "National Institute of Standards and Technology"
    accessedAt: 2026-08-27

contentRisk: low

review:
  status: not-required
  lastFactChecked: 2026-08-27
  evidenceLevel: supported
  medicalDisclaimer: false
  claimsReviewed: true

commercial:
  relatedProductIds: []
  campaignIds: []
  allowGlobalCampaigns: false
  placements:
    - article-masthead
    - article-inline-text
    - article-visual-card
    - article-final-banner
---

## Start with the task, not the tool

AI products are sold as capabilities: write, summarize, analyze, research, code, answer, automate. Work, however, is organized around tasks with consequences.

That difference matters. "Use AI for customer service" is too broad to be a safe operating rule. Customer service may include finding an order number, rewriting a response in a clearer tone, deciding whether a refund policy applies, handling a threat, processing health information, or resolving an unusual complaint from a long-term customer. Those tasks do not deserve the same level of automation.

A better approach is to break a workflow into units small enough to evaluate. Then ask how much authority the system should receive over each unit.

The International Labour Organization's 2025 task-level analysis is useful here. It found that generative AI exposure varies substantially across tasks and occupations. It also cautions against treating exposure as a direct forecast of job elimination. For practical workplace decisions, that supports a simple principle: **do not automate a job description; evaluate the work inside it.**

## The four useful outcomes

A task does not have to end in either "automated" or "manual." Most real workflows need at least four possible outcomes.

| Decision | What AI does | What the person does | Best fit |
| --- | --- | --- | --- |
| **Automate** | Performs the task and passes the result onward | Monitors performance and exceptions | Low-risk, repeatable, easily verified work |
| **Automate with review** | Produces a near-final result | Checks defined criteria before release | Repeatable work where errors matter but are detectable |
| **Assist only** | Generates options, extracts information, or prepares material | Makes the decision and owns the output | Ambiguous work that benefits from speed but requires judgment |
| **Keep human** | May not be used, or is limited to administrative support | Performs and owns the core task | High-impact, sensitive, novel, or accountability-heavy work |

The middle two categories are where many teams find the most sustainable value. Full automation attracts attention because it sounds efficient. In practice, **partial delegation often captures much of the time saving while retaining the part of the process that requires context.**

## A six-factor test for any task

Score a task informally across six dimensions before you automate it.

### 1. How repetitive is it?

Repetition makes a task easier to observe and improve. If the same type of input appears every day and the acceptable output is stable, you can learn how an automation behaves across many examples.

Examples include:

- converting notes into a standard format;
- extracting fields from routine documents;
- categorizing inbound requests;
- generating a first draft from a fixed brief;
- preparing a recurring report from approved data.

Novel work is different. If every case changes the goal, the rules, and the evidence required, the cost of defining the automation may approach the cost of doing the work.

### 2. Can you define what "correct" means?

Automation is easier when success can be checked.

"Copy these five values into the correct columns" has a relatively clear verification path. "Decide which client relationship matters most this quarter" does not.

This is one reason fluent AI output can be deceptive. A response can sound complete without satisfying the real business requirement. Before automating, write down the acceptance criteria that a competent reviewer would use. If you cannot explain how to test the output, you probably cannot manage the automation reliably.

### 3. Is the result reversible?

Reversibility changes the economics of error.

A poor internal draft can be deleted. A mislabeled file can be renamed. A public message sent to thousands of customers, a payment released to the wrong party, or an employment decision may be difficult or impossible to undo.

The less reversible the action, the more valuable a deliberate human checkpoint becomes.

### 4. What happens when the system is wrong?

Do not ask only how often an error might occur. Ask what one error can do.

A typo in an internal summary and a fabricated figure in a board report are both "errors," but they carry different consequences. NIST's AI Risk Management Framework emphasizes context, likelihood, magnitude of impact, and appropriate human oversight rather than one universal threshold for acceptable AI use.

A practical test is to imagine the worst *plausible* failure, not the most dramatic imaginable one. Would it create a small correction, a lost client, a privacy incident, a discriminatory decision, a safety problem, or a regulatory obligation?

### 5. What data does the task expose?

A workflow can be easy to automate and still be a poor candidate for a particular AI service because of the data involved.

Check whether the task contains:

- confidential client material;
- personal identifiers;
- financial records;
- health information;
- unreleased business plans;
- credentials or security information;
- third-party content with contractual restrictions.

The correct question is not simply "Is this AI secure?" It is whether the specific tool, account, contract, retention policy, access model, and workflow are appropriate for the data you are sending.

### 6. How much human judgment and accountability does it require?

Some tasks are difficult because the information is incomplete, values conflict, exceptions matter, or responsibility must be visible.

AI can still help. It can summarize the file, identify questions, compare options, or draft an explanation. But assistance is different from delegated authority.

If a person must be able to explain why a consequential decision was made, that person needs more than a final answer from a system. They need evidence, context, and control over the decision.

## The hidden problem: verification debt

"Human in the loop" sounds safe, but it can become a ritual.

If AI creates 200 outputs where a person previously created 40, the organization may gain production capacity while losing verification capacity. Reviewers begin scanning instead of checking. Familiar formatting creates overconfidence. Small errors pass through because the volume is too high.

That is **verification debt**: automation increases the amount of material that requires judgment faster than the organization increases its ability to judge it.

A useful automation should reduce total work, not merely relocate work from creation to hurried checking.

Before deploying, answer three questions:

1. What exactly must the reviewer verify?
2. How long does a meaningful review take?
3. What happens when the reviewer is uncertain?

If those questions do not have operational answers, "human review" is not yet a control.

## Three examples of proportional automation

### Routine meeting notes

AI can be useful for converting an approved transcript into a summary, action list, and draft follow-up. The output is easy for attendees to compare with what actually happened.

A reasonable design is **automate with review**: generate the structured notes, then have the meeting owner check decisions, names, numbers, and commitments before distribution.

The privacy question still matters. Recording and transcription rules should be appropriate for the participants and the information discussed.

### A first draft of a client proposal

A proposal contains repeated elements but also commercial judgment.

AI might assemble approved service descriptions, transform discovery notes into a structure, and propose wording. Pricing, promises, scope boundaries, and final positioning should remain under human control.

That makes **assist only** a better default than autonomous sending.

### Routing incoming requests

If requests arrive through a consistent channel, AI or conventional rules can classify them and assign a queue. The output is reversible, and errors can be sampled.

This may become a strong **automation** candidate after a monitored trial, especially if uncertain classifications are sent to a human rather than forced into a category.

## Run a monitored trial before changing the whole workflow

A good automation project begins with a sample, not a company-wide promise.

Choose one task and document:

- the current manual process;
- typical inputs;
- acceptance criteria;
- known exceptions;
- data restrictions;
- the person responsible for the result;
- the failure that would make you stop the test.

Then test the automation on real but appropriately handled cases. Measure more than speed.

Useful measures include:

- correction rate;
- serious error rate;
- review time;
- exception rate;
- rework after release;
- user or client complaints;
- time saved after review, not before it.

The goal is not to prove that AI works. It is to determine **where it works well enough for this workflow.**

## Keep a non-AI path

NIST's AI RMF Core explicitly includes consideration of viable non-AI alternatives and mechanisms to disengage or deactivate systems that perform inconsistently with intended use.

That idea is useful even for small teams.

An automated workflow should not make ordinary work impossible when the AI service is unavailable, changes its behavior, raises its price, or fails on an unusual case. Keep the original procedure documented. Preserve enough expertise to perform critical work without the automation.

This is related to the broader [cost of digital convenience](/explainers/real-cost-of-digital-convenience/): every layer that removes effort can also add dependency.

## A practical decision rule

You do not need a perfect risk model for every task. Use a conservative rule:

**The more a task is repetitive, testable, reversible, and low-impact, the more authority automation can receive. The more it is ambiguous, sensitive, consequential, or difficult to verify, the more authority should remain with a person.**

That rule also prevents a common mistake: automating something merely because AI can produce an output.

Capability is the beginning of the decision, not the end.
