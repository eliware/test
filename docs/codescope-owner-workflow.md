# Codescope remediation routine

Use this procedure when reviewing a repository with Codescope. It is designed
for AI-assisted maintenance: one scan per iteration keeps the context bounded
and makes each remediation decision auditable.

## One iteration

1. Run exactly one scan:

   ```text
   codescope all --usage --effort=none
   ```

   Substitute `low`, `medium`, or another agreed effort when appropriate.

2. Record the scan result from the current conversation context. Capture the
   verdict, every finding by category and severity, every suggestion, total
   tokens, and estimated cost. Do not run a second Codescope command in this
   iteration.

3. Review every finding:

   - implement a proper fix when it is in scope and practical;
   - add a precise inline `codescope ignore` only when the issue is genuinely
     unfixable, prohibitively high effort, or an intentional implementation
     exception that cannot be expressed as a specification rule;
   - explain the boundary in the ignore comment;
   - if the behavior is required by the specification, update or cite the
     specification instead of adding a code ignore;
   - never add a blanket ignore just to obtain a pass.

4. Review every suggestion:

   - implement suggestions that are low- or medium-effort and align with the
     project contract;
   - reject suggestions that are invalid because the specification explicitly
     requires the current behavior; record that disposition in the report and
     keep the requirement in the specification;
   - use a scoped ignore only for the narrow high-effort, unfixable, or
     implementation-exception cases allowed above. There is no deferred state.

5. Run repository validation after remediation:

   ```text
   npm test
   npm run lint
   git diff --check
   ```

   Confirm that tests pass, coverage is restored to 100×4 where that is the
   project contract, and lint has zero warnings.

6. Report the complete iteration without rerunning Codescope. Include:

   - the exact command and verdict;
   - all findings and suggestions;
   - fixes implemented;
   - ignores and their reasons, plus specification-based rejections;
   - validation results;
   - cumulative Codescope runs, token usage, cost, issues/suggestions
     implemented, ignored, and rejected by specification.

## Starting the next iteration

Start another iteration only when the owner requests it or the workflow calls
for it. The next iteration gets one fresh Codescope call against the current
working tree, followed by the same remediation and validation sequence.

If the scan passes, still run the repository validation and report the pass. If
it blocks, do not claim completion; remediate its findings and wait for the
next iteration before scanning again.

## Pause behavior

If the owner says `pause`, stop the current scan or validation process safely.
Report which stages completed, which process was interrupted, and whether its
result counts as a completed scan. Never infer a verdict from an interrupted
process.

## Recommended report template

```text
Codescope command: codescope all --usage --effort=none
Verdict: pass|block

Findings:
- category/severity — location — summary

Implemented:
- change and verification

Ignored:
- precise exception and reason

Rejected by specification:
- finding or suggestion — specification rule that requires the current behavior

Validation:
- npm test: pass/fail; coverage: 100×4 or details
- npm run lint: pass/fail; warnings: count
- git diff --check: pass/fail

Cumulative totals:
- Codescope runs: N
- Usage: N tokens
- Cost: $N
- Issues/suggestions implemented: N
- Issues/suggestions ignored: N
- Issues/suggestions rejected by specification: N
```

## Owner procedure (complete iteration)

The routine is completed in this exact order:

1. Run exactly one review command: `codescope all --usage --effort=none`, or
   the owner-selected effort. Wait for that same process if it is still
   running. One command that returns a verdict is one completed scan,
   including `block`; never launch a second Codescope call in the iteration.
2. Capture the exact command, effort, verdict, every finding and suggestion
   with category, severity, location, token usage, and estimated USD cost.
   Treat that result as authoritative for the rest of the iteration.
3. Review every category and disposition every item. Implement all in-scope,
   technically sound fixes, including low- and medium-effort suggestions. Add
   regression tests for behavior and edge cases. If the specification requires
   the reported behavior, reject the report as specification-based and ensure
   the rule is documented there. Otherwise, add a precise inline
   `codescope ignore: ...` only when the item is genuinely unfixable,
   prohibitively high effort, or an intentional implementation exception.
   There is no deferred status, and unexplained or blanket ignores are never
   acceptable.
4. Restore the repository contract by running `npm test` without
   `--ignore-100x4`. Add tests and repeat that command until statements,
   branches, functions, and lines are all 100%. A focused run’s mirrored
   coverage is not evidence for the full-suite 100×4 requirement.
5. Run `npm run lint` and `git diff --check`; record exit codes, lint warning
   count, coverage, failures, and unresolved risks.
6. Stop without another Codescope call and write the detailed final report.
   Include the exact scan and verdict; every finding and suggestion with its
   disposition; files, fixes, and tests; every ignore and specification-based
   rejection with its reason; all validation results; and any missing or
   interrupted evidence.

The final report must end with cumulative totals across all iterations, never
just the current scan:

```text
Cumulative totals:
- Codescope runs: N
- Total usage: N tokens
- Total estimated cost: $N
- Cumulative issues/suggestions implemented: N
- Cumulative issues/suggestions ignored: N
- Cumulative issues/suggestions rejected by specification: N
```

Count each finding or suggestion once per disposition and keep the counting
rule consistent when one fix addresses multiple items. Do not silently reset
or relabel totals. A `pass` verdict plus the required validation is needed to
finish the objective. A `block` verdict leaves it active; begin the next
iteration with one fresh scan against the updated working tree.
