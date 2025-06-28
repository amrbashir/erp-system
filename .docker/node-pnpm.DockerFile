FROM node:24-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json ./

RUN export PKG_MGR=$(jq -r '.packageManager' package.json)

ENV CI=true
RUN corepack enable && corepack prepare $PKG_MGR --activate
