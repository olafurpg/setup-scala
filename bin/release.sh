#!/bin/bash
set -eux
version=$1
git add .
git diff --exit-code
current_branch=$(git rev-parse --abbrev-ref HEAD)
test 'master' = $current_branch
git checkout master-node_modules
git reset --hard master
rm -rf node_modules
yarn install
yarn run build
yarn install --prod
sed -i '' '/node_modules/d' .gitignore
sed -i '' '/lib/d' .gitignore
git add .
git commit -m "Generate artifacts"
git push -f origin master-node_modules
git tag -d "v$version" || true
git tag -a "v$version" -m "v$version"
git push -f origin "v$version"
git co master
rm -rf node_modules
yarn install
