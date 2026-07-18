# Decision Gates

## Purpose

The agent should continue working by default, but must ask the user at important product, cost, account, or irreversible decision points.

## Ask The User Before

### Product Direction

- Adding a feature outside MVP scope.
- Changing the primary user persona.
- Changing the core loop.
- Changing a superpower.
- Reframing the service positioning.

### Design Direction

- Changing the main tone defined in `docs/design-tone-and-manner.md`.
- Adding pressure, guilt, or a tone that conflicts with the product concept.
- Making a different interaction model primary without product approval.

### Technical Direction

- Switching the main stack.
- Adding a major paid third-party service.
- Introducing a complex state management library before the core loop works.
- Replacing mock-first development with full backend-first development.
- Adding a multi-agent worker system, external orchestrator, or new CLI runtime dependency.
- Running code generation or scripts that modify broad parts of the repo.

### Cost and Accounts

- Creating paid cloud resources.
- Requiring API keys.
- Installing paid services.
- Running external deployment.
- Calling external services that may consume quota or money.

### Data and Privacy

- Collecting sensitive data beyond MVP need.
- Logging sensitive user input to analytics.
- Changing retention or storage assumptions.

### Destructive Or Broad Actions

- Deleting files or directories not created in the current task.
- Resetting, rebasing, force-pushing, or rewriting git history.
- Changing generated starter files across many projects.
- Applying automated fixes across unrelated modules.

## Do Not Ask Before

- Implementing the next todo in `docs/mvp-todo.md`.
- Refactoring code to comply with `docs/frontend-engineering-standards.md`.
- Adding tests for existing behavior.
- Updating docs to record a decision already made in conversation.
- Fixing obvious bugs.

## Branch Format

When asking the user, present:

- The decision.
- Recommended option.
- Tradeoff.
- What happens next.
