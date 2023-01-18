import React from 'react';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-moment'
import { DataState } from '../Data';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function unique<Type>(value: Type, index: number, self: Type[]) {
  return self.indexOf(value) === index;
}

const colors = [
  "#0072BD", 
  "#D95319", 
  "#EDB120", 
  "#7E2F8E", 
  "#77AC30", 
  "#4DBEEE", 
  "#A2142F"
].map(color => ({
  border: color,
  background: color + "7F",
}));

interface CustomChartProps {
  startTimeMs: number,
  endTimeMs: number,
  startFromZero: boolean,
  statefulData: DataState,
  labels: {[id: string]: {[id: string]: string}},
}

export default function CustomChart({
  startTimeMs,
  endTimeMs,
  startFromZero,
  statefulData,
  labels,
}: CustomChartProps) {
  // const scales = data.map(x => x.unit).filter(unique);
  // const timestampsMs = data.time;

  // function doStuff() {
  //   Object.entries(data).map(([id, { time, data }], index: number) => ({}));
  // }

  const chartsData = {
    labels: [],
    datasets: Object.entries(statefulData)
      .map(([id, { time, data }], index) =>
        Object.entries(data).map(([signal, values]) => ({
          label: labels[id][signal],
          data: values.map((value, index) => ({
            x: time[index],
            y: value,
          })),
          borderColor: "",
          backgroundColor: "",
          // yAxisID: entry.unit,
        }))
      )
      .flatMap(entry => entry)
      .map((entry, index) => {
        entry.borderColor = colors[index].border;
        entry.backgroundColor = colors[index].background;
        return entry;
      }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    elements: {
      point: {
        radius: 0,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        display: true,
        time: {
          // 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
          unit: 'minute' as const,
        },
        ticks: {
          padding: 20,
          min: 10,
          max: 20,
        },
        min: startTimeMs,
        max: endTimeMs,
      },
      // ...Object.fromEntries(scales.map((unit: string) => [`${unit}`, {
      //   title: {
      //     display: true,
      //     text: `[${unit}]`,
      //   },
      //   type: 'linear' as const,
      //   display: true,
      //   position: 'left' as const,
      //   beginAtZero: startFromZero,
      // }]))
    },
  };

  return (
    <Line options={options} data={chartsData} />
  );
}