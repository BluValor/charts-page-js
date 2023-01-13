import internal from "stream";
import { JsxAttributeValue } from "typescript";
import { faker } from '@faker-js/faker';

export type ChartEntry = {
  name: string;
  unit: string;
  values: number[];
};

export type ChartsData = {
  time: number[],
  data: ChartEntry[],
};

const HOUR = 60 * 60 * 1000;
function generateTimestampsMs(period: number, count: number) {
  const currentTimestampeMs = (new Date()).getTime();
  const hourAgoTimestampMs = currentTimestampeMs - HOUR;
  const step = (currentTimestampeMs - hourAgoTimestampMs) / count;
  return Array.from(Array(count).keys()).map(i => hourAgoTimestampMs + i * step);
};

const dataCount = 20;
const timestampsMs = generateTimestampsMs(HOUR, dataCount);

function generateData(count: number, min: number, max: number) {
  return Array.from({ length: count }).map(() => faker.datatype.number({ min: min, max: max }));
}

export const Data: ChartsData = {
  time: timestampsMs,
  data: [
    {
      name: "Current 6 - Ia",
      unit: "A",
      values: generateData(dataCount, 500, 1000),
    },
    {
      name: "Current 6 - Ib",
      unit: "A",
      values: generateData(dataCount, 500, 1000),
    },
    {
      name: "Voltage 3 - Vca",
      unit: "V",
      values: generateData(dataCount, 0, 200),
    },
    // {
    //   name: "Voltage 3 - Vc %THD-F",
    //   unit: "%",
    //   values: generateData(dataCount, 0, 100),
    // },
  ],
};