# syntax=docker/dockerfile:experimental

# Build stage: Install yarn dependencies
# ===
FROM node:20 AS yarn-dependencies

WORKDIR /srv

COPY .yar[n] ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn config set httpProxy $HTTP_PROXY
RUN yarn config set httpsProxy $HTTPS_PROXY
RUN yarn install

# Build stage: Run "yarn run build-js"
# ===
FROM yarn-dependencies AS build-js
ADD . .
COPY public/config.demo.js public/config.local.js
RUN yarn run build


FROM ubuntu:jammy

RUN apt update && apt install --yes nginx

WORKDIR /srv

COPY nginx.conf /etc/nginx/sites-available/default
COPY entrypoint entrypoint
COPY --from=build-js /srv/build .

ENTRYPOINT ["./entrypoint"]
