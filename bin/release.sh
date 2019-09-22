#!/bin/bash
set -eux
git add .
git diff --exit-code
version=$1
git checkout -b releases/$version
sed -i '' '/node_modules/d' .gitignore
yarn install
yarn run build
git add .
git commit -m "Generate artifacts"
git push origin releases/$version
git co master
rm -rf node_modules
yarn install
