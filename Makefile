SHELL := /bin/bash
BRANCH := $(shell git branch | sed -n -e 's/^\* \(.*\)/\1/p')
VERSION := $(shell git describe --abbrev=0 --tags)

.PHONY: install
install:
	npm i

.PHONY: test
test:
	npm run lint
	npm run test

.PHONY: build
build:
	make install
	npm run build

.PHONY: deploy
deploy:
	make install
	npm run deploy

.PHONY: start
start:
	npm run start

.PHONY: serve
serve:
	npm run serve

.PHONY: debug
debug:
	npm run debug
