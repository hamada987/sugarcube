import {
  curry,
  flow,
  map,
  concat,
  flatten,
  merge,
  join,
  property,
  chunk,
} from "lodash/fp";
import Promise from "bluebird";
import request from "request";
import {parse, format} from "url";
import {utils} from "@sugarcube/core";

import {video, playlistVideo} from "./entities";

Promise.promisifyAll(request);

const {mapP} = utils.combinators;

const urlify = curry((resource, params) => {
  const endpoint = "https://www.googleapis.com/youtube/v3";
  const u = parse(`${endpoint}/${resource}`);
  u.query = params;
  return format(u);
});

const getJson = url => request.getAsync(url).then(r => JSON.parse(r.body));

const page = (action, params, results = []) =>
  action(params).then(r => {
    const items = concat(results, r.items);
    if (r.nextPageToken) {
      return page(action, merge(params, {pageToken: r.nextPageToken}), items);
    }
    return items;
  });

const search = flow([urlify("search"), getJson]);
const videos = flow([urlify("videos"), getJson]);
const channels = flow([urlify("channels"), getJson]);
const playlistItems = flow([urlify("playlistItems"), getJson]);

const getplaylistid = (action, params) =>
  action(params).then(r => r.items[0].contentDetails.relatedPlaylists.uploads);

export const channelSearch = curry((key, range, channelId) => {
  const parts = ["id", "snippet"];
  const params = {
    type: "video",
    part: join(",", parts),
    maxResults: 50,
    channelId,
    key,
  };
  return page(search, merge(params, range));
});

const channelToPlaylist = curry((key, id) => {
  const params = {
    part: "contentDetails",
    id,
    key,
  };
  return getplaylistid(channels, params);
});

const playlistVideos = curry((key, playlistId) => {
  const parts = ["id", "snippet", "status", "contentDetails"];
  const ps = {
    part: join(",", parts),
    playlistId,
    maxResults: 50,
    key,
  };
  return page(playlistItems, ps).then(map(playlistVideo));
});

export const videosList = curry((key, ids) => {
  const parts = [
    "id",
    "snippet",
    "contentDetails",
    "statistics",
    "status",
    "recordingDetails",
    "topicDetails",
  ];
  const params = {
    part: join(",", parts),
    id: join(",", ids),
    maxResults: 50,
    key,
  };

  return page(videos, params).then(map(video));
});

export const videoChannel = (key, range, id) =>
  channelSearch(key, range, id)
    .then(rs => {
      const ids = map(property("id.videoId"), rs);
      // There is a limit on how many video ids can be queried at once.
      return mapP(videosList(key), chunk(50, ids));
    })
    .then(flatten);

export const videoChannelPlaylist = (key, id) =>
  channelToPlaylist(key, id)
    .then(playlistVideos(key))
    .then(flatten);

export default {
  channelSearch,
  videosList,
  videoChannel,
  videoChannelPlaylist,
};