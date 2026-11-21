import assert from "node:assert/strict";
import { test } from "node:test";
import { isAuthorized } from "./guard";

const headersWith = (token?: string) => {
  const headers = new Headers();
  if (token !== undefined) headers.set("x-service-token", token);
  return headers;
};

test("the configured service token authorizes the request", () => {
  const env = { AI_SERVICE_TOKEN: "s3cret" };

  assert.equal(isAuthorized(headersWith("s3cret"), env), true);
});

test("a wrong or missing service token is rejected", () => {
  const env = { AI_SERVICE_TOKEN: "s3cret" };

  assert.equal(isAuthorized(headersWith("nope"), env), false);
  assert.equal(isAuthorized(headersWith(), env), false);
});

test("an explicit local opt in authorizes development only", () => {
  const dev = { NODE_ENV: "development", AI_ALLOW_LOCAL: "1" };

  assert.equal(isAuthorized(headersWith(), dev), true);
});

test("production never falls through without a token", () => {
  const production = { NODE_ENV: "production", AI_ALLOW_LOCAL: "1" };

  assert.equal(isAuthorized(headersWith(), production), false);
});

test("development without the opt in is still rejected", () => {
  const dev = { NODE_ENV: "development" };

  assert.equal(isAuthorized(headersWith(), dev), false);
});
