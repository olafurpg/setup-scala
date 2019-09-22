#!/bin/bash
set -eux
git add .
git diff --exit-code
version=$1
current_branch=$(git rev-parse --abbrev-ref HEAD)
test 'master' = $current_branch
git checkout master-node_modules
git reset --hard master
sed -i '' '/node_modules/d' .gitignore
rm -rf node_modules
yarn install --production
yarn run build
git add .
git commit -m "Generate artifacts"
git push origin master-node_modules
git co master
rm -rf node_modules
yarn install
