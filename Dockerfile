# syntax=docker/dockerfile:1
### build
FROM public.ecr.aws/docker/library/node:20-alpine as build
WORKDIR /app

COPY . .
RUN yarn install --frozen-lockfile --ignore-optional && \
    yarn build && \
    yarn install --frozen-lockfile --ignore-optional --production --offline

### app
FROM public.ecr.aws/docker/library/node:20-alpine as app
WORKDIR /app

COPY --from=build /app .

CMD ["node", "dist/bin/app.js"]
