import "./styles.css";
import { installDenyFetch } from "@glasshome/ui/testing";
import { configure } from "@solidjs/testing-library";

installDenyFetch();

// test-change-ok hang guard for findBy* and waitFor, matching the expect.poll guard in vitest.config.ts
configure({ asyncUtilTimeout: 4_000 });
