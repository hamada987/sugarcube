import {merge, values, forEach} from "lodash/fp";
import exportPlugin from "./plugins/export";
import importPlugin from "./plugins/import";
import diffPlugin from "./plugins/diff";
import diffExportPlugin from "./plugins/diff-export";
import queriesExportPlugin from "./plugins/queries-export";
import exportFailedStatsPlugin from "./plugins/export-failed-stats";
import failedStatsFileInstrument from "./instruments/failed-stats-file";
import {parse, parseMany} from "./parse";

const plugins = {
  csv_export: exportPlugin,
  csv_import: importPlugin,
  csv_diff: diffPlugin,
  csv_diff_stats_export: diffExportPlugin,
  csv_export_queries: queriesExportPlugin,
  csv_export_failed: exportFailedStatsPlugin,
};

const instruments = {
  csv_failures_file: failedStatsFileInstrument,
};

const importPlugins = [importPlugin, diffPlugin];

forEach(p => {
  // eslint-disable-next-line no-param-reassign
  p.argv = merge(
    {
      "csv.delimiter": {
        type: "string",
        nargs: 1,
        default: ",",
        desc: "Use as CSV delimiter",
      },
    },
    p.argv,
  );
}, values(Object.assign({}, plugins, instruments)));

forEach(p => {
  // eslint-disable-next-line no-param-reassign
  p.argv = merge(
    {
      "csv.id_fields": {
        nargs: 1,
        desc: "Specify the id fields separated by a comma.",
      },
    },
    p.argv,
  );
}, importPlugins);

export {plugins, instruments, parse, parseMany};
export default {plugins, instruments, parse, parseMany};
