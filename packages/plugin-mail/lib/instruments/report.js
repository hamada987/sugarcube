import fs from "fs";
import path from "path";
import {get, getOr} from "lodash/fp";
import dot from "dot";
import {existsP} from "@sugarcube/plugin-fs";

import {createTransporter, encrypt, encryptFile, humanDuration} from "../utils";

dot.log = false;

const dots = dot.process({
  path: `${__dirname}/../../views`,
  templateSettings: {strip: false},
});

const instrument = cfg => {
  const noEncrypt = getOr(false, "mail.no_encrypt", cfg);

  return {
    stats: ({stats}) => {
      setImmediate(async () => {
        const {
          name,
          mail: {recipients, from},
        } = cfg;
        const {
          pipeline: {marker, plugins, project},
        } = stats;

        const failures = getOr([], "failed", stats);
        const pluginStats = getOr({}, "plugins", stats);

        // Create the body of the report.
        const report = [];

        if (plugins != null)
          plugins.forEach(p => {
            const plugin = pluginStats[p];
            const took = getOr(0, "durations.took", plugin);
            const counts = getOr({}, "counts", plugin);
            const durations = getOr({}, "durations", plugin);

            // Skip the plugin in the report if no counts can be reported.
            if (Object.keys(counts).length === 0) return;

            report.push({
              name: p,
              took: humanDuration(took),
              counts: Object.keys(counts)
                .map(c => `${c}=${counts[c]}`)
                .join(", "),
              durations: Object.keys(durations)
                .filter(d => d !== "took")
                .map(d => `${d}=${humanDuration(durations[d])}`)
                .join(", "),
              failures: failures.filter(({plugin: p2}) => p2 === p),
            });
          });

        // Skip the report if no counts can be reported.
        if (report.length === 0) return;

        // Find the CSV file of failures to attach.
        const dataDir = get("csv.data_dir", cfg);
        const label = get("csv.label", cfg);
        const csvFilename = path.resolve(
          process.cwd(),
          path.join(
            dataDir == null ? "" : dataDir,
            `failed-stats-${label == null ? "" : `${label}-`}${marker}.csv`,
          ),
        );

        // Generate and mail the report
        const subject = `[${cfg.project}]: Report for ${name} (${marker}).`;
        const body = dots.report({
          project,
          name,
          report,
          failures,
          took: humanDuration(getOr(0, "pipeline.took", stats)),
        });
        let text;

        const transporter = createTransporter(cfg.mail);

        let content;
        let attachments = [];
        let statsFile;

        await recipients.reduce(
          (memo, to) =>
            memo.then(async () => {
              try {
                text = noEncrypt ? body : await encrypt(to, body);
              } catch (e) {
                console.log(`Failed to encrypt message to ${to}.`);
                console.log(e);
                return;
              }

              // eslint-disable-next-line promise/always-return
              if (await existsP(csvFilename)) {
                try {
                  statsFile = fs.createReadStream(csvFilename);
                } catch (e) {} // eslint-disable-line no-empty

                if (statsFile != null) {
                  try {
                    content = noEncrypt
                      ? statsFile
                      : await encryptFile(to, statsFile);
                  } catch (e) {
                    console.log(`Failed to encrypt attachment to ${to}.`);
                    console.log(e);
                    return;
                  }
                  const filename = path.basename(
                    `${csvFilename}${!noEncrypt ? ".gpg" : ""}`,
                  );
                  attachments = [{filename, content}];
                }
              }

              await transporter.sendMail({
                from,
                subject,
                to,
                text,
                attachments,
              });
            }),
          Promise.resolve(),
        );
      });
    },
  };
};

instrument.desc = "Mail a report about the pipeline run [stats].";
instrument.argv = {};

export default instrument;
