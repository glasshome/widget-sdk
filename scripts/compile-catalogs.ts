#!/usr/bin/env bun
import { fileURLToPath } from "node:url";
import { writeCatalogModules } from "@glasshome/widget-contract/catalog-build";

const LOCALES = fileURLToPath(new URL("../src/locales", import.meta.url));

const files = writeCatalogModules(LOCALES, "SdkKey");
const fmt = Bun.spawnSync(["oxfmt", ...files], { stdio: ["inherit", "inherit", "inherit"] });
if (fmt.exitCode !== 0) process.exit(fmt.exitCode ?? 1);
console.log(`catalogs: ${files.length} modules in ${LOCALES}/compiled`);
