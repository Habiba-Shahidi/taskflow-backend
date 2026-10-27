Step 3: Release to production
When staging looks good, open a PR with base main and compare dev, then merge it.
Use Create a merge commit for this PR, not “Squash and merge”. Squashing dev into main rewrites history, so the two branches look different to Git and you get strange conflicts the next time you release. Squash is fine for feature branches into dev.