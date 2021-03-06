#!/bin/sh

set -e

cd ./gamersnet
git pull origin master

cd ./gamersnet_frontend
npm ci --quiet
npm run build

sudo systemctl restart gamersnet_backend.service
