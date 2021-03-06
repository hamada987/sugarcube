import {flowP, flatmapP, tapP, caughtP} from "dashp";
import {
  envelope as env,
  plugin as p,
  createFeatureDecisions,
} from "@sugarcube/core";
import {counter} from "@sugarcube/utils";

import {feed, parseApiErrors} from "./twitter";
import {parseTwitterUser} from "./utils";
import {assertCredentials} from "./assertions";

const querySource = "twitter_user";

const feedPlugin = async (envelope, {log, cfg, stats}) => {
  const decisions = createFeatureDecisions();

  const users = env
    .queriesByType(querySource, envelope)
    .map(term => parseTwitterUser(term));

  const logCounter = counter(
    envelope.data.length,
    ({cnt, total, percent}) =>
      log.debug(`Progress: ${cnt}/${total} units (${percent}%).`),
    {threshold: 50, steps: 25},
  );

  log.debug(`Fetching the tweets for ${users.join(", ")}`);

  const fetchTimeline = user =>
    flowP(
      [
        tapP(() => stats.count("total")),
        feed(cfg),
        tapP(rs => {
          const fetched = rs.length;
          stats.count("success");
          stats.count("fetched", fetched);
          log.info(`Fetched ${fetched} tweets for ${user}.`);
          logCounter();
        }),
        // Merge the query into the data unit.
        results =>
          results.map(r => {
            const q = envelope.queries.find(({type, term}) => {
              const {user: u} = decisions.canNcube() ? r._sc_data : r;
              return (
                type === querySource &&
                (parseTwitterUser(term) === u.screen_name ||
                  parseTwitterUser(term) === u.user_id)
              );
            });

            if (q == null) return r;

            const {tags, ...query} = q;

            return Object.assign(
              r,
              {
                _sc_queries: Array.isArray(r._sc_queries)
                  ? r._sc_queries.concat(query)
                  : [query],
              },
              Array.isArray(tags) && tags.length > 0
                ? {
                    _sc_tags: Array.isArray(r._sc_tags)
                      ? r._sc_tags.concat(tags)
                      : tags,
                  }
                : undefined,
            );
          }),

        caughtP(e => {
          const reason = parseApiErrors(e);
          stats.fail({type: querySource, term: user, reason});

          return [];
        }),
      ],
      user,
    );
  const results = await flatmapP(fetchTimeline, users);

  log.info(`Fetched ${results.length} tweets for ${users.length} users.`);

  return env.concatData(results, envelope);
};

const plugin = p.liftManyA2([assertCredentials, feedPlugin]);

plugin.desc = "Fetch the tweets of an user.";
plugin.source = {
  name: querySource,
  desc: "A twitter user name",
};

plugin.argv = {
  "twitter.tweet_count": {
    default: 200,
    nargs: 1,
    desc: "Number of tweets retrived",
  },
  "twitter.retweets": {
    default: 1,
    nargs: 1,
    desc: "Include retweets",
  },
};

export default plugin;
