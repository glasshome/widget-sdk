/**
 * SDK version constant for runtime version compatibility checking.
 * The host can compare this against widget manifest sdkVersion fields.
 * Read from package.json, which declares the major the package stands for.
 */
import { buildSdkVersion } from "@glasshome/widget-contract/sdk-version";
import pkg from "../package.json" with { type: "json" };

export const SDK_VERSION: string = buildSdkVersion(pkg) ?? pkg.version;
