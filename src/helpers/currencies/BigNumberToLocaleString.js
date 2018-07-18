// @flow

// Implement a subset of Number#toLocaleString for BigNumber.js

// https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number/toLocaleString

import { BigNumber } from "bignumber.js";
import { getSeparators } from "./localeUtility";

export type SupportedOptions = {
  minimumFractionDigits: number,
  maximumFractionDigits: number,
  useGrouping: boolean
};

// FIXME later, might want to expose this format!
const getFormatForLocale = (locale: string) => {
  const { decimal, thousands } = getSeparators(locale);
  const opts = {
    decimalSeparator: ".",
    groupSeparator: ",",
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: "\xA0", // non-breaking space
    fractionGroupSize: 0
  };
  if (typeof decimal === "string") opts.decimalSeparator = decimal;
  if (typeof thousands === "string") opts.groupSeparator = thousands;
  return opts;
};

export const toLocaleString = (
  n: BigNumber,
  locale?: string,
  options: $Shape<SupportedOptions> = {}
): string => {
  if (!locale) locale = "en";
  const minimumFractionDigits =
    "minimumFractionDigits" in options ? options.minimumFractionDigits : 0;
  const maximumFractionDigits =
    "maximumFractionDigits" in options
      ? options.maximumFractionDigits
      : Math.max(minimumFractionDigits, 3);
  const useGrouping = "useGrouping" in options ? options.useGrouping : true;
  const format = getFormatForLocale(locale);
  if (!useGrouping) {
    format.groupSeparator = "";
  }
  const BN = BigNumber.clone({
    FORMAT: format
  });
  const bn = BN(n);
  const maxDecimals = bn.toFormat(maximumFractionDigits);
  if (maximumFractionDigits !== minimumFractionDigits) {
    const minDecimals = bn.toFormat(minimumFractionDigits);
    let i = maxDecimals.length - 1;
    // cleanup useless '0's from the right until the minimumFractionDigits
    while (i > minDecimals.length) {
      if (maxDecimals[i] === "0") {
        i--;
      } else if (maxDecimals[i] === format.decimalSeparator) {
        i--;
        break; // we reach decimal. stop now.
      } else {
        i++; // we eat one character that we shouldn't. we stop there and roll it back (nb slice won't overflow)
        break;
      }
    }
    return maxDecimals.slice(0, i);
  } else {
    return maxDecimals;
  }
};