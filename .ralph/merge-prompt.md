# TASK

First checkout `{{BASE_BRANCH}}`, then rebase the following branches onto it:

{{BRANCHES}}

For each branch:

1. Run `git rebase <branch>` (this replays the branch's commits onto HEAD, preserving individual commits without merge commits)
2. If there are merge conflicts, resolve them intelligently by reading both sides and choosing the correct resolution, then `git add` the resolved files and `git rebase --continue`
3. After rebasing, run `pnpm run typecheck` and `pnpm run test` to verify everything works
4. If tests fail, fix the issues and commit the fix before proceeding to the next branch

# CLOSE ISSUES

For each branch that was merged, close its issue. If there are any parent issues (such as PRD's) which closing the issue would complete, close those too.

Here are all the issues:

{{ISSUES}}

NEVER run `git push` - all branches are local only.

Once you've merged everything you can, output <promise>COMPLETE</promise>.
