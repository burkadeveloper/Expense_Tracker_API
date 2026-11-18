import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gregorianToEthiopian,
  ethiopianToGregorian,
  isEthiopianLeapYear,
  ethiopianMonthRange,
} from "./ethiopianCalendar.js";

test("Meskerem 1 2017 = Sep 11 2024", () => {
  const g = new Date(Date.UTC(2024, 8, 11));
  const e = gregorianToEthiopian(g);
  assert.deepEqual(e, { year: 2017, month: 1, day: 1 });
});

test("round-trip a leap-year Pagume 6 (2015 = 2023)", () => {
  assert.ok(isEthiopianLeapYear(2015));
  const g = ethiopianToGregorian(2015, 13, 6);
  const e = gregorianToEthiopian(g);
  assert.deepEqual(e, { year: 2015, month: 13, day: 6 });
});

test("2019 is leap (Pagume 6)", () => {
  assert.ok(isEthiopianLeapYear(2019));
  const g = ethiopianToGregorian(2019, 13, 6);
  const e = gregorianToEthiopian(g);
  assert.deepEqual(e, { year: 2019, month: 13, day: 6 });
});

test("month range: Meskerem 2017", () => {
  const { start, end } = ethiopianMonthRange(2017, 1);
  assert.equal(start.toISOString().slice(0, 10), "2024-09-11");
  assert.equal(end.toISOString().slice(0, 10), "2024-10-10");
});
