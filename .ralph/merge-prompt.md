# TASK

First checkout `{{BASE_BRANCH}}`, then merge the following branches into it:

{{BRANCHES}}

For each branch:

1. Run `git merge --squash <branch>`
2. If there are merge conflicts, resolve them intelligently by reading both sides and choosing the correct resolution
3. After resolving conflicts, run `pnpm run typecheck` and `pnpm run test` to verify everything works
4. If tests fail, fix the issues before proceeding to the next branch
5. Commit the squashed changes with a message summarizing the branch's work

Here are all the issues:

{{ISSUES}}

Once you've merged everything you can, output <promise>COMPLETE</promise>.
