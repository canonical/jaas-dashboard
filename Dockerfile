# syntax=docker/dockerfile:experimental

# Build stage: Install yarn dependencies
# ===
FROM node:20 AS yarn-dependencies

WORKDIR /srv

RUN echo "BUILD_ID: \$BUILD_ID"

COPY .yar[n] ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
RUN if [[ -n $HTTP_PROXY ]]; then \
      yarn config set httpProxy $HTTP_PROXY; \
    fi
RUN if [[ -n $HTTPS_PROXY]]; then \
      yarn config set httpsProxy $HTTPS_PROXY; \
    fi
RUN yarn install

# Build stage: Run "yarn run build-js"
# ===
FROM yarn-dependencies AS build-js
ADD . .
COPY public/config.demo.js public/config.js
RUN yarn run build


FROM ubuntu:jammy

RUN apt update && apt install --yes nginx

WORKDIR /srv

COPY nginx.conf /etc/nginx/sites-available/default
COPY entrypoint entrypoint
COPY --from=build-js /srv/build .

ENTRYPOINT ["./entrypoint"]
