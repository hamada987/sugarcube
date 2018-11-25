import {size, get, merge} from "lodash/fp";
import {envelope as env} from "@sugarcube/core";

import {Elastic} from "../elastic";

const plugin = async (envelope, {cfg, log, stats}) => {
  const host = get("elastic.host", cfg);
  const port = get("elastic.port", cfg);
  const index = get("elastic.index", cfg);

  return Elastic.Do(
    function* complementLeft({queryByIds}) {
      const ids = envelope.data.map(u => u._sc_id_hash);
      const existing = yield queryByIds(index, ids);

      stats.update(
        "pipeline",
        merge({
          created: ids.length - existing.length,
          complemented: existing.length,
        }),
      );

      log.info(`Left complementing ${size(existing)} existing units.`);
      return existing;
    },
    {host, port},
  ).then(([rs, history]) => {
    history.forEach(([k, meta]) => log.debug(`${k}: ${JSON.stringify(meta)}.`));
    return env.concatDataLeft(rs, envelope);
  });
};

plugin.argv = {};

plugin.desc = "Left complement with data stored in Elasticsearch.";

export default plugin;
