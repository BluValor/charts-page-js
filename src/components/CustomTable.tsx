import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { DataState } from '../Data';
import { timestampMsToDateString } from '../Utils';

type RowData = {
  id: number,
  data: number[],
}

type SignalOrder = { id: string, signal: string }[];

function useRowDataState(statefulData: DataState, signalOrder: SignalOrder) {
  const [rowData, setRowData] = useState<RowData[]>([]);

  useEffect(() => {
    const dataIds = Object.keys(statefulData);

    if (dataIds.length === 0)
      return;

    const dataTimesMatch = dataIds.reduce((acc, key, i, keys) => {
      const firstKey = keys[0];
      const lastIndex = statefulData[key].time.length - 1;
      const firstLastIndex = statefulData[firstKey].time.length - 1;
      return (
        acc &&
        statefulData[key].time.length === statefulData[firstKey].time.length &&
        statefulData[key].time[0] === statefulData[firstKey].time[0] &&
        statefulData[key].time[lastIndex] ===
          statefulData[firstKey].time[firstLastIndex]
      );
    }, true);

    if (!dataTimesMatch) return;

    const result: RowData[] = [];

    setRowData(
      statefulData[signalOrder[0].id].time.reduce((acc, time, i) => {
        const data = signalOrder.map(
          ({ id, signal }) => statefulData[id].data[signal][i]
        );
        acc.push({
          id: time,
          data: data,
        });
        return acc;
      }, result)
    );

  }, [statefulData, signalOrder]);

  return rowData;
}

type IdToSignalsToValues = {[id: string]: {[id: string]: string}}

type CustomTableProps = {
  startFromZero: boolean,
  statefulData: DataState,
  labels: IdToSignalsToValues,
  units: IdToSignalsToValues,
}

export default function CustomTable({
  statefulData,
  labels,
  units,
}: CustomTableProps) {
  const signalOrder: SignalOrder = Object.keys(statefulData)
    .map((id) =>
      Object.keys(statefulData[id].data).map((signal) => ({
        id: id,
        signal: signal,
      }))
    )
    .flatMap((x) => x);

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Time",
      // width: 180,
      flex: 1.5,
      sortable: true,
      valueGetter: (params: GridValueGetterParams) => timestampMsToDateString(params.row.id),
    },
    signalOrder.map(({ id, signal }, i) => ({
      field: `${id}-${signal}`,
      headerName: `${labels[id][signal]} [${units[id][signal]}]`,
      // width: 130,
      flex: 1,
      sortable: false,
      valueGetter: (params: GridValueGetterParams) => (params.row.data[i] as number).toFixed(2),

    })),
  ].flatMap((x) => x);

  const rows = useRowDataState(statefulData, signalOrder);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={100}
        rowsPerPageOptions={[100]}
        isRowSelectable={() => false}
        density={'compact' as const}
      />
    </div>
  );
}