import { sendCurrentDigest } from "../lib/digest-runner";

sendCurrentDigest("cli", { force: true })
  .then((result) => {
    const summary = result.log.summary;
    console.log(
      JSON.stringify(
        {
          status: result.log.status,
          message: result.log.message,
          demo: "digest" in result ? Boolean(result.digest?.demo) : false,
          summary,
        },
        null,
        2,
      ),
    );
    process.exit(result.ok ? 0 : 1);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
