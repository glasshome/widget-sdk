import { createIntrospectSession } from "../introspect-session";

const session = createIntrospectSession();

await session.introspect(process.argv[2] ?? "");
process.stdout.write(`${session.childPid}\n`);
// Hold the process open; the test SIGKILLs it.
setInterval(() => {}, 1_000);
