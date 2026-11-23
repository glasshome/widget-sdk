import { expect, test } from "bun:test";
import { loadSdkCatalog } from "./sdk-catalog";

test("a translated language has the SDK's state words", async () => {
  const catalog = await loadSdkCatalog("fr");
  expect(catalog).not.toBeNull();
  expect(catalog).toHaveProperty(["sdk.state.unavailable"]);
});

test("English and an unknown language give null", async () => {
  expect(await loadSdkCatalog("en")).toBeNull();
  expect(await loadSdkCatalog("zz")).toBeNull();
});

test("a key from the object prototype gives null", async () => {
  expect(await loadSdkCatalog("constructor")).toBeNull();
  expect(await loadSdkCatalog("__proto__")).toBeNull();
});
