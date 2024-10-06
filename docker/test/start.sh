#!/bin/bash

TEST_DIR=$(dirname $(realpath $0))
cd $TEST_DIR

# install deps and build
cd ../../
yarn
yarn build

cd $TEST_DIR

# cleanup storage
rm -rf .storage1
mkdir .storage1

rm -rf .storage2
mkdir .storage2

rm -rf .storage3
mkdir .storage3

# copy files
cp -r ../../dist dist
cp -r ../../node_modules node_modules
cp -r ../../package.json package.json
cp -r ../../yarn.lock yarn.lock

# start dockers
pwd
docker compose up -d
