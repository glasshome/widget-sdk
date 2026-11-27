import "./styles.css";
import { installDenyFetch } from "@glasshome/ui/testing";
import { installSolidDiagnosticGuard } from "./solid-diagnostics";
import { configure } from "@solidjs/testing-library";

installDenyFetch();
installSolidDiagnosticGuard();

// test-change-ok hang guard for findBy* and waitFor, matching the expect.poll guard in vitest.config.ts
configure({ asyncUtilTimeout: 4_000 });
