import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Grid, Button, Tabs, Tab } from '@mui/material';
import { TimeSlider, TabPanel, CustomChart } from './components'; 
import { FakeDataBank, useDataState, useDataManager } from './Data';
import 'chartjs-adapter-moment'

export default function App() {
  /*
  device and deviceId could really be mashed together to this "signalId" thing, 
  and then I could send out the same "signalId" in the getSensorData. This approach 
  would be cleaner, as only one side of the communication would have to do the weird 
  string to two ints conversion.
  */
  const serverAddress = "idk, localhost:8888";
  const startupData = {
    "0-1": {
      device: 0,
      deviceId: 1,
      signals: ["0"],
      labels: ["Input 1 Voltage - Vab"],
    },
    "1-2": {
      device: 1,
      deviceId: 2,
      signals: ["183"],
      labels: ["Input 2 Current - KWa"],
    },
    "0-2": {
      device: 0,
      deviceId: 2,
      signals: ["3", "7"],
      labels: ["Output Voltage - Van", "Output Voltage - Va %THD-F"],
    },
  };
  const labels = Object.fromEntries(
    Object.entries(startupData).map(([id, info]) => [
      id,
      Object.fromEntries(
        info.signals.map((signal, index) => [signal, info.labels[index]])
      ),
    ])
  ); 

  // use for web socket data ----------------------------------------------
  // const data = useDataManager(serverAddress, startupData);
  // ----------------------------------------------------------------------

  // use for random data --------------------------------------------------
  const idToSignals = Object.fromEntries(
    Object.entries(startupData).map(([id, info]) => [id, info.signals])
  ); 
  const [data, setNewData] = useDataState(idToSignals);
  const dataBank = new FakeDataBank(idToSignals);
  function randomizeData() {
    dataBank.regenerateData();
    for (const [id, { time, data }] of Object.entries(dataBank.data))
      setNewData(id, time, data);
  };
  useEffect(() => {
    randomizeData();
  }, []);
  // ----------------------------------------------------------------------

  const [firstTimeMs, setFirstTimeMs] = useState(0);
  const [lastTimeMs, setLastTimeMs] = useState(0); 
  const [startTimeMs, setStartTimeMs] = useState(firstTimeMs);
  const [endTimeMs, setEndTimeMs] = useState(lastTimeMs);
  const [startFromZero, setStarFromZero] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const changeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
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
    setFirstTimeMs(getFirstTimeMs());
    setLastTimeMs(getLastTimeMs());
  }, [data]);

  function onButtonClick() {
    // chartWebSocket.onmessage = (event) => {
    //   console.log(event.data);
    // }
    // console.log("State: " + chartWebSocket.readyState);
    // console.log("Button clicked");
    // const x = {
    //   "averagePeriod": 7,
    //   "clientIp": "192.168.1.4",
    //   "device": 0,
    //   "deviceId": 1,
    //   "end": "Sat Jan 14 13:19:59 2023",
    //   "messageType": "getSensorData",
    //   "signals": [0, 1],
    //   "start": "Fri Jan 6 03:43:59 2023"
    // }
    // chartWebSocket.send(JSON.stringify(x));
  }

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
            <Button onClick={onButtonClick}>Send data request</Button>
            <Button onClick={randomizeData}>Randomize data</Button>
          </Grid>
        </Grid>
        <Grid container item xs>
          <TabPanel value={selectedTab} index={0}>
            <CustomChart
              startTimeMs={startTimeMs}
              endTimeMs={endTimeMs}
              startFromZero={startFromZero}
              statefulData={data}
              labels={labels}
            />
          </TabPanel>
          <TabPanel value={selectedTab} index={1}>
            Item Two
          </TabPanel>
        </Grid>
        <Grid item>
          <TimeSlider
            onChange={(start, end) => {
              const timeDiff = lastTimeMs - firstTimeMs;
              setStartTimeMs(firstTimeMs + timeDiff * (start / 100));
              setEndTimeMs(firstTimeMs + timeDiff * (end / 100));
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}