import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Grid, Button, Tabs, Tab } from '@mui/material';
import { TimeSlider, TabPanel, CustomChart } from './components'; 
import { FakeDataBank, useDataState, useDataManager, DataState } from './Data';
import { timestampMsToDateString } from './Utils';
import 'chartjs-adapter-moment'
import internal from 'stream';

export default function App() {
  /*
  device and deviceId could really be mashed together to this "signalId" thing, 
  and then I could send out the same "signalId" in the getSensorData. This approach 
  would be cleaner, as only one side of the communication would have to do the weird 
  string to two ints conversion.
  */

  type ChartMetadata = {
    [id: string]: {
      device: number;
      deviceId: number;
      signals: number[];
      labels: string[];
      units: string[];
    };
  };

  function getServerAddress(): string {
    sessionStorage.setItem("serverAddress", "ws://localhost:8888");
    const serverAddressString = sessionStorage.getItem("serverAddress");
    sessionStorage.removeItem("serverAddress");
    return serverAddressString !== null ? serverAddressString : "";
  }

  function getChartMetadata(): ChartMetadata {
    sessionStorage.setItem("chartMetadata", JSON.stringify({
      "0-1": {
        device: 0,
        deviceId: 1,
        signals: [0, 1, 2],
        labels: [
          "Input 1 Voltage - Vab",
          "Input 1 Voltage - Vbc",
          "Input 1 Voltage - Vca",
        ],
        units: ["V", "V", "V"],
      },
      "1-2": {
        device: 1,
        deviceId: 2,
        signals: [0, 1, 2],
        labels: [
          "Input 2 Current - Ia",
          "Input 2 Current - Ib",
          "Input 2 Current - Ic",
        ],
        units: ["A", "A", "A"],
      },
      // "0-2": {
      //   device: 0,
      //   deviceId: 2,
      //   signals: [5],
      //   labels: ["Output Voltage - Vcn"],
      //   units: ["V"],
      // },
    }));
    const chartMetadataString = sessionStorage.getItem("chartMetadata");
    sessionStorage.removeItem("chartMetadata");
    return chartMetadataString !== null
      ? (JSON.parse(chartMetadataString) as ChartMetadata)
      : {};
  }

  const [serverAddress, setServerAddress] = useState<string>(() =>
    getServerAddress()
  );
  const [chartMetadata, setChartMetadata] = useState<ChartMetadata>(() =>
    getChartMetadata()
  );

  const startupData = Object.fromEntries(
    Object.entries(chartMetadata).map(([id, info]) => [
      id,
      { ...info, signals: info.signals.map((x) => x.toString()) },
    ])
  );

  const labels = Object.fromEntries(
    Object.entries(startupData).map(([id, info]) => [
      id,
      Object.fromEntries(
        info.signals.map((signal, index) => [signal, info.labels[index]])
      ),
    ])
  ); 
  const units = Object.fromEntries(
    Object.entries(startupData).map(([id, info]) => [
      id,
      Object.fromEntries(
        info.signals.map((signal, index) => [signal, info.units[index]])
      ),
    ])
  ); 

  // use for web socket data ----------------------------------------------
  const [data, requestTimeframe, period] = useDataManager(serverAddress, startupData);
  // ----------------------------------------------------------------------

  // use for random data --------------------------------------------------
  // const idToSignals = Object.fromEntries(
  //   Object.entries(startupData).map(([id, info]) => [id, info.signals])
  // ); 
  // const [data, setNewData] = useDataState(idToSignals);
  // const dataBank = new FakeDataBank(idToSignals);
  // function randomizeData() {
  //   dataBank.regenerateData();
  //   for (const [id, { time, data }] of Object.entries(dataBank.data))
  //     setNewData(id, time, data);
  // };
  // useEffect(() => {
  //   randomizeData();
  // }, []);
  // ----------------------------------------------------------------------

  const initRef = useRef(false);
  const [dataFirstTimeMs, setDataFirstTimeMs] = useState({ start: 0, end: 0 });
  const [currentDataFirstTimeMs, setCurrentDataFirstTimeMs] = useState({
    start: 0,
    end: 0,
  });

  const [startFromZero, setStarFromZero] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const changeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    function hasData() {
      return Object.values(data).reduce((acc, curr) => {
        return acc ? acc : curr.time.length > 0;
      }, false);
    }
    function getFirstTimeMs() {
      return Object.values(data).reduce((acc, curr) => {
        const firstTime = curr.time[0];
        return firstTime < acc ? firstTime : acc;
      }, Number.MAX_SAFE_INTEGER);
    }
    function getLastTimeMs() {
      return Object.values(data).reduce((acc, curr) => {
        const lastTime = curr.time[curr.time.length - 1];
        return lastTime > acc ? lastTime : acc;
      }, 0);
    }
    
    const start = getFirstTimeMs();
    const end = getLastTimeMs();

    if (!initRef.current && hasData()) {
      setDataFirstTimeMs({ start: start, end:  end});
      initRef.current = true;
    }

    setCurrentDataFirstTimeMs({ start: start, end:  end});
  }, [data]);

  return (
    <Grid container padding={6} height="100vh">
      <Grid container item direction="column" xs={12}>
        <Grid container item>
          <Grid
            container
            item
            xs={2}
            justifyContent="flex-start"
            alignItems="center"
          >
            <Tabs
              value={selectedTab}
              onChange={changeTab}
              aria-label="basic tabs example"
            >
              <Tab label="Chart" />
              <Tab label="Table" />
            </Tabs>
          </Grid>
          <Grid
            container
            item
            xs={8}
            justifyContent="center"
            alignItems="center"
          >
            {`${timestampMsToDateString(
              currentDataFirstTimeMs.start
            )} - ${timestampMsToDateString(
              currentDataFirstTimeMs.end)}`}
          </Grid>
          <Grid
            container
            item
            xs={2}
            justifyContent="flex-end"
            alignItems="center"
          >
            <Button onClick={() => setStarFromZero(!startFromZero)}>
              {startFromZero ? "Autoscale" : "Scale From Zero"}
            </Button>
            {/* <Button onClick={randomizeData}>Randomize data</Button> */}
          </Grid>
        </Grid>
        <Grid container item xs>
          <TabPanel value={selectedTab} index={0}>
            <CustomChart
              startFromZero={startFromZero}
              statefulData={data}
              labels={labels}
              units={units}
              period={period}
            />
          </TabPanel>
          <TabPanel value={selectedTab} index={1}>
            Item Two
          </TabPanel>
        </Grid>
        <Grid item>
          <TimeSlider
            dataStartTimeMs={dataFirstTimeMs.start}
            dataEndTimeMs={dataFirstTimeMs.end}
            maxTimeMs={dataFirstTimeMs.end}
            disabled={!initRef.current}
            onChange={(newTimeMs) => {
              console.log(newTimeMs.start, newTimeMs.end);
              requestTimeframe(newTimeMs.start, newTimeMs.end);
              // randomizeData();
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}