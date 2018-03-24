import {merge, size, get} from "lodash/fp";
import {envelope as env} from "@sugarcube/core";

import {Elastic} from "../elastic";

const querySource = "elastic_query";

const plugin = async (envelope, {cfg, log}) => {
  const host = get("elastic.host", cfg);
  const port = get("elastic.port", cfg);
  const index = get("elastic.index", cfg);
  const amount = get("elastic.amount", cfg);
  const includeFields = get("elastic.include_fields", cfg);

  const queries = env.queriesByType(querySource, envelope);

  return Elastic.Do(
    function* queryData({query}) {
      let results = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const q of queries) {
        let body = JSON.parse(q);
        if (includeFields)
          body = merge(body, {
            _source: includeFields
              .concat(["_sc_*_hash"])
              .map(f => f.replace(/^_sc/, "$sc")),
          });
        const units = yield query(index, body, amount);
        log.info(`Fetched ${size(units)}/${amount} units for ${q}.`);
        results = results.concat(units);
      }
      return results;
    },
    host,
    port
  ).then(([rs, history]) => {
    history.forEach(([k, meta]) => log.debug(`${k}: ${JSON.stringify(meta)}.`));
    return env.concatData(rs, envelope);
  });
};

plugin.argv = {
  "elastic.amount": {
    type: "number",
    nargs: 1,
    default: 1000,
    desc: "The amount of units to fetch.",
  },
  "elastic.include_fields": {
    type: "array",
    desc: "Only include those fields when importing data.",
  },
};

plugin.desc = "Fetch units from Elasticsearch by queries.";

export default plugin;
