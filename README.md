# Chools - Twitter server

---

> A handy Twitter tool built with [TypeScript](https://www.typescriptlang.org/),
> [React](https://reactjs.org/), [Prettier](https://prettier.io/), [eslint](https://eslint.org/), and ❤️

## Motivations

Building a tool to help my wife search product feedbacks on Twitter.

## Features

See the client side package here https://github.com/gairal/chu-tools-client

This package is a serverless backend built on top of Firebase Functions (gCloud Functions). It exposes 3 endpoints:

- GET /tweets => search for tweets
- POST /sheets => save tweets to a google sheet
- GET /translates => translate a string in English

The whole API is behind a google SSO authentication
