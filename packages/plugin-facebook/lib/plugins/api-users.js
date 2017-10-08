import {size, get} from "lodash/fp";
import {mapP, flowP, flatmapP} from "combinators-p";
import {envelope as e, plugin as p} from "@sugarcube/core";

import {fetchByAppToken, user} from "../api";
import {assertAppCredentials} from "../assertions";

const querySource = "facebook_user";

const apiUsers = (envelope, {log, cfg}) => {
  const appId = get("facebook.app_id", cfg);
  const appSecret = get("facebook.app_secret", cfg);
  const queries = e.queriesByType(querySource, envelope);
  const fetcher = fetchByAppToken(appId, appSecret);

  log.debug(`Found ${size(queries)} queries.`);

  return flowP(
    [flatmapP(user(fetcher)), mapP(rs => e.concatData(rs, envelope))],
    queries
  );
};

const plugin = p.liftManyA2([assertAppCredentials, apiUsers]);

plugin.desc = "Fetch user.";
plugin.argv = {};

export default plugin;