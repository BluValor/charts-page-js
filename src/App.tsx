import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Grid, Button, Tabs, Tab } from '@mui/material';
import { TimeSlider, TabPanel, CustomChart } from './components'; 
import { FakeDataBank, useDataState, useDataManager, DataState } from './Data';
import 'chartjs-adapter-moment'
import internal from 'stream';

export default function App() {
  /*
  device and deviceId could really be mashed together to this "signalId" thing, 
  and then I could send out the same "signalId" in the getSensorData. This approach 
  would be cleaner, as only one side of the communication would have to do the weird 
  string to two ints conversion.
  */

  // {"clientIp":"192.168.1.5","device":0,"deviceId":1,"end":"Thu Jan 19 13:27:57 2023","messageType":"getSensorData","signals":[0],"start":"Wed Jan 11 03:51:57 2023"}

  const serverAddress = "ws://localhost:8888";
  const receivedData = {
    "0-1": {
      device: 0,
      deviceId: 1,
      signals: [0],
      labels: ["Input 1 Voltage - Vab"],
      units: ["V"],
    },
    "0-2": {
      device: 0,
      deviceId: 2,
      signals: [0, 4],
      labels: ["Input 2 Voltage - Vab", "Input 1 Current - a"],
      units: ["V", "A"],
    },
  };
  const startupData = Object.fromEntries(
    Object.entries(receivedData).map(([id, info]) => [
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
  const [data, requestTimeframe] = useDataManager(serverAddress, startupData);
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
    
    if (!initRef.current && hasData()) {
      setDataFirstTimeMs({ start: getFirstTimeMs(), end: getLastTimeMs() });
      initRef.current = true;
    }
  }, [data]);

  return (
    <Grid container padding={6} height="100vh">
      <Grid container item direction="column" xs={12}>
        <Grid container item>
          <Grid
            container
            item
            xs={4}
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
            xs={4}
            justifyContent="center"
            alignItems="center"
          >
            ?
          </Grid>
          <Grid
            container
            item
            xs={4}
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
            onChange={newTimeMs => {
              console.log(newTimeMs.start, newTimeMs.end)
              requestTimeframe(newTimeMs.start, newTimeMs.end);
              // randomizeData();
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}