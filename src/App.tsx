import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Grid, Button, Tabs, Tab } from '@mui/material';
import { TimeSlider, TabPanel, CustomChart } from './components'; 
import { Data } from './Data';
import 'chartjs-adapter-moment'

export default function App() {
  const timestampsMs = Data.time;
  const firstTimeMs = timestampsMs[0];
  const lastTimeMs = timestampsMs[timestampsMs.length - 1];
  const [startTimeMs, setStartTimeMs] = useState(firstTimeMs);
  const [endTimeMs, setEndTimeMs] = useState(lastTimeMs);
  const [startFromZero, setStarFromZero] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const changeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const chartWebSocket = new WebSocket("ws://192.168.1.4:8888")

  function onButtonClick() {

    chartWebSocket.onmessage = (event) => {
      console.log(event.data);
    }

    console.log("State: " + chartWebSocket.readyState);

    console.log("Button clicked");
    const x = {
      "averagePeriod": 7,
      "clientIp": "192.168.1.4",
      "device": 0,
      "deviceId": 1,
      "end": "Sat Jan 14 13:19:59 2023",
      "messageType": "getSensorData",
      "signals": [0, 1],
      "start": "Fri Jan 6 03:43:59 2023"
    }
    
    chartWebSocket.send(JSON.stringify(x));
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
            <Button onClick={onButtonClick}>
               Send data request
            </Button>
          </Grid>
        </Grid>
        <Grid container item xs>
          <TabPanel value={selectedTab} index={0}>
            <CustomChart
              startTimeMs={startTimeMs}
              endTimeMs={endTimeMs}
              startFromZero={startFromZero}
              data={Data}
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