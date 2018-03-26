/* eslint-disable no-use-before-define */
import {omit, merge, isPlainObject, isArray} from "lodash/fp";
import {utils} from "@sugarcube/core";

const {curry2} = utils;

const mapUnitKeys = curry2("mapUnitKeys", (fn, unit) => {
  const stripArrays = ary =>
    ary.map(value => {
      if (isPlainObject(value)) return stripUnderscores(value);
      if (isArray(value)) return stripArrays(value);
      return value;
    });

  return Object.keys(unit).reduce((memo, key) => {
    const newKey = fn(key);

    if (isPlainObject(unit[key]))
      return merge(memo, {[newKey]: stripUnderscores(unit[key])});
    if (isArray(unit[key]))
      return merge(memo, {[newKey]: stripArrays(unit[key])});
    return merge(memo, {[newKey]: unit[key]});
  }, {});
});

export const stripUnderscores = mapUnitKeys(key => key.replace(/^[_]+/, "$"));
export const unstripify = mapUnitKeys(key => key.replace(/^[$$]/, "_"));

export const omitFromData = (fields, data) => {
  if (fields) return data.map(omit(fields.split(",")));
  return data;
};