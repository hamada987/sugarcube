import {
  flow,
  curry,
  map,
  merge,
  concat,
  pick,
  flatten,
  toLower,
  getOr,
} from "lodash/fp";
import {createFeatureDecisions} from "@sugarcube/core";

import {twitterDate} from "./utils";

const tweetFields = [
  "retweet_count",
  "favorite_count",
  "lang",
  "favorited",
  "retweeted",
  "tweet_id",
  "tweet",
  "tweet_time",
  "geo",
  "coordinates",
  "place",
  "href",
];

const userFields = [
  "name",
  "screen_name",
  "location",
  "description",
  "url",
  "followers_count",
  "friends_count",
  "list_count",
  "favourites_count",
  "utc_offset",
  "timezone",
  "geo_enabled",
  "verified",
  "statuses_count",
  "lang",
  "profile_image_url_https",
  "user_id",
  "user_created_at",
];

const mediaEntities = map(media =>
  merge(
    {},
    {
      id: media.id_str,
      type: media.type === "photo" ? "image" : media.type,
      term: media.type === "photo" ? media.media_url_https : media.expanded_url,
    },
  ),
);

const urlEntities = curry((type, es) =>
  map(url => merge({}, {type, term: url.expanded_url}), es),
);

const hashtagEntities = map(tag =>
  merge({}, {tag: `#${toLower(tag.text)}`, original_tag: tag.text}),
);

const mentionEntities = map(mention =>
  merge(
    {},
    {
      mention: mention.screen_name,
      name: mention.name,
      id: mention.id_str,
    },
  ),
);

const coordinatesEntities = ({coordinates}) => {
  if (coordinates == null) return [];
  return [
    {
      location: {lon: coordinates[0], lat: coordinates[1]},
      type: "tweet_location",
      term: coordinates,
    },
  ];
};

const pubDates = unit => {
  const createdAt = twitterDate(unit.created_at);
  return createdAt.isValid() ? {source: createdAt.toDate()} : {};
};

const userEntity = flow([
  u => {
    const createdAt = twitterDate(u.created_at);
    return merge(u, {
      user_id: u.id_str,
      user_created_at: createdAt.isValid() ? createdAt.toDate() : null,
    });
  },
  pick(userFields),
]);

const tweetEntity = flow([
  t => {
    const createdAt = twitterDate(t.created_at);
    return merge(t, {
      tweet_id: t.id_str,
      tweet: t.text,
      tweet_time: createdAt.isValid() ? createdAt.toDate() : null,
      href: `https://twitter.com/statuses/${t.id_str}`,
    });
  },
  pick(tweetFields),
]);

const mentionsToRelations = map(m =>
  merge({}, {type: "twitter_mention", term: m.mention}),
);

const hashtagsToRelations = map(h => merge({}, {type: "hashtag", term: h.tag}));

const linksToRelations = map(l => merge({}, {type: "url", term: l.term}));

export const tweetLegacy = t => {
  const lfUrls = flow([getOr([], "entities.urls"), urlEntities("url")])(t);
  const lfMedia = flow([getOr([], "extended_entities.media"), mediaEntities])(
    t,
  );
  const lfHashtags = flow([getOr([], "entities.hashtags"), hashtagEntities])(t);

  const lfMentions = flow([
    getOr([], "entities.user_mentions"),
    mentionEntities,
  ])(t);
  const lfLocations = coordinatesEntities(t.coordinates || {});
  const language = t.lang != null ? t.lang : null;

  return merge(
    {
      _sc_id_fields: ["tweet_id"],
      _sc_content_fields: ["tweet"],
      _sc_pubdates: pubDates(t),
      _sc_relations: flatten([
        mentionsToRelations(lfMentions),
        hashtagsToRelations(lfHashtags),
        lfUrls,
        lfMedia,
      ]),
      _sc_locations: lfLocations,
      _sc_media: flatten([lfMedia, lfUrls]),
      _sc_language: language,
      user: userEntity(t.user),
      urls: getOr([], "entities.url", t),
      medias: getOr([], "extended_entities.media", t),
      hashtags: lfHashtags,
      mentions: lfMentions,
    },
    tweetEntity(t),
  );
};

export const tweetNcube = t => {
  const lfUrls = flow([getOr([], "entities.urls"), urlEntities("url")])(t);
  const lfMedia = flow([getOr([], "extended_entities.media"), mediaEntities])(
    t,
  );
  const authorUrl = `https://twitter.com/${t.user.screen_name}`;
  const lfLocations = coordinatesEntities(t.coordinates || {});
  const language = t.lang != null ? t.lang : null;

  return {
    _sc_id_fields: ["_sc_id"],
    _sc_content_fields: ["tweet"],
    _sc_id: t.id_str,
    _sc_href: `${authorUrl}/status/${t.id_str}`,
    _sc_title: t.text,
    _sc_author: t.user.screen_name,
    _sc_author_id: t.user.id_str,
    _sc_author_url: authorUrl,
    _sc_pubdates: pubDates(t),
    _sc_locations: lfLocations,
    _sc_media: flatten([lfMedia, lfUrls]),
    _sc_language: language,
    _sc_data: t,
    _sc_queries: [],
    _sc_tags: [],
  };
};

const tweet = t => {
  const decisions = createFeatureDecisions();

  if (decisions.canNcube()) return tweetNcube(t);
  return tweetLegacy(t);
};

const user = curry((source, u) => {
  const urls = flatten([
    getOr([], "entities.url.urls", u),
    getOr([], "entities.description.urls", u),
    getOr([], "status.entities.urls", u),
  ]);
  const lfUrls = map(l => ({type: "url", term: l.expanded_url}), urls);
  const lfImages = flow([
    getOr([], "extended_entities.media"),
    mediaEntities,
    concat([{type: "image", term: u.profile_image_url_https}]),
  ])(u);
  const lfHashtags = flow([
    getOr([], "status.entities.hashtags"),
    hashtagEntities,
  ])(u);
  const lfMentions = flow([
    getOr([], "status.entities.user_mentions"),
    mentionEntities,
  ])(u);

  return merge(
    {
      _sc_id_fields: ["user_id"],
      _sc_pubdates: pubDates(u),
      _sc_relations: flatten([
        hashtagsToRelations(lfHashtags),
        mentionsToRelations(lfMentions),
        linksToRelations(lfUrls),
        linksToRelations(lfImages),
      ]),
      _sc_media: flatten([lfImages, lfUrls]),
      // TODO: This is broken, where does _sc_graph* from from?
      // _sc_graph: {from: u._sc_graph_from, depth: u._sc_graph_depth},
      urls,
      medias: lfImages,
      hashtags: lfHashtags,
      mentions: lfMentions,
    },
    userEntity(u),
  );
});

const searchResult = t => merge(tweet(t), {_sc_source: "twitter_search"});

export const searchTransform = map(searchResult);
export const followersTransform = map(user("followers"));
export const friendsTransform = map(user("friends"));
