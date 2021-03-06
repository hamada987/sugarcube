import {get} from "lodash/fp";
import fs from "fs";
import path from "path";
import stringify from "csv-stringify";

const exportFailedStatsPlugin = (envelope, {log, cfg, stats}) => {
  const dataDir = get("csv.data_dir", cfg);
  const delimiter = get("csv.delimiter", cfg);
  const label = get("csv.label", cfg);
  // The filename construction is shared with the mail_failed_stats plugin and
  // the csv_failures_file instrument. If updated here, update there as well.
  const filename = path.join(
    dataDir,
    `failed-stats-${label == null ? "" : `${label}-`}${cfg.marker}.csv`,
  );
  const failedStats = stats.get("failed");

  if (!Array.isArray(failedStats) || failedStats.length === 0) {
    log.info("No failure stats to export.");
    return envelope;
  }

  log.info(`Export ${failedStats.length} failure stats to ${filename}.`);

  // Pipe the csv stream into the file.
  const csv = stringify({header: true, delimiter});
  csv.pipe(fs.createWriteStream(filename));

  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    csv.on("error", reject);
    csv.on("finish", () => {
      resolve(envelope);
    });

    failedStats.forEach(r => csv.write(r));
    csv.end();
  });
};

exportFailedStatsPlugin.desc = "Export failed stats to a file in CSV format.";
exportFailedStatsPlugin.argv = {
  "csv.data_dir": {
    type: "string",
    default: "./data",
    nargs: 1,
    desc: "The file name to write the CSV to.",
  },
  "csv.label": {
    type: "string",
    nargs: 1,
    desc: "Add a label to the export file name.",
  },
};

export default exportFailedStatsPlugin;
