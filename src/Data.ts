import React, { useState, useEffect, useRef } from 'react';
import internal from "stream";
import { JsxAttributeValue } from "typescript";
import { faker } from '@faker-js/faker';
import { sign } from "crypto";

type Signals = string[];

type IdToSignals = {
  [id: string]: Signals;
}

type SignalsToValues = {[signal: string]: number[]};

export type DataState = {
  [id: string]: {
    time: number[],
    data: SignalsToValues,
  }
}

export function useDataState(idToSignals: IdToSignals): [
  DataState,
  (id: string, time: number[], data: SignalsToValues) => void,
] {
  function createDataStateObject() {
    const result: DataState = {};
    for (const [id, signals] of Object.entries(idToSignals)) {
      result[id] = {
        time: [],
        data: signals.reduce((acc: SignalsToValues, curr: string) => {
          acc[curr] = [];
          return acc;
        }, {}),
      }
    }
    return result;
  }

  const [data, setData] = useState(createDataStateObject());
  
  function setNewData(id: string, time: number[], data: SignalsToValues) {
    setData(prevState => ({
      ...prevState,
      [id]: {
        time: time,
        data: data,
      }
    }))
  }

  return [data, setNewData];
}

export class FakeDataBank {
  dataCount = 20;
  hour = 60 * 60 * 1000;
  timestampsMs = this.generateTimestampsMs(this.hour, this.dataCount);
  data: DataState;

  constructor(idToSignals: IdToSignals) {
    this.data = {};
    for (const [id, signals] of Object.entries(idToSignals)) {
      const signalsData: SignalsToValues = {};
      for (const signal of signals)
        signalsData[signal] = this.generateData(this.dataCount, 500, 1000);
      this.data[id] = {
        time: this.timestampsMs,
        data: signalsData,
      };
    }
  }

  generateTimestampsMs(period: number, count: number) {
    const currentTimestampeMs = new Date().getTime();
    const startTimestampMs = currentTimestampeMs - period;
    const step = (currentTimestampeMs - startTimestampMs) / count;
    return Array.from(Array(count).keys()).map(
      (i) => startTimestampMs + i * step
    );
  }

  generateData(count: number, min: number, max: number) {
    return Array.from({ length: count }).map(() =>
      faker.datatype.number({ min: min, max: max })
    );
  }

  regenerateData() {
    for (const [id, { time, data }] of Object.entries(this.data)) {
      const signalsData: SignalsToValues = {};
      for (const signal of Object.keys(data))
        signalsData[signal] = this.generateData(this.dataCount, 500, 1000);
      this.data[id] = {
        time: time,
        data: signalsData,
      };
    }
  }
}

enum TimePeriod {
  HOUR = 60 * 60 * 1000,
  DAY = TimePeriod.HOUR * 24,
  WEEK = TimePeriod.DAY * 7,
  MONTH = TimePeriod.DAY * 30,
}

export type SignalConnectionInfo = {
  device: number,
  deviceId: number,
  signals: string[],
  labels: string[],
}

export type SignalDataMessage = {
  messageType: "setSensorData",
  signalId: string,
  time: number[],
  data: SignalsToValues,
  period: number,
}

export function isSignalDataMessage(toCheck: any): toCheck is SignalDataMessage {
  return "messageType" in toCheck && toCheck["messageType"] === "setSensorData";
}

export function useDataManager(
  serverAddress: string,
  signalsInfo: { [id: string]: SignalConnectionInfo }
) {
  const idToSignals = Object.fromEntries(
    Object.entries(signalsInfo).map(([id, info]) => [id, info.signals])
  ); 
  const [data, setNewData] = useDataState(idToSignals);

  function openWebSocket() {
    const webSocket = new WebSocket(serverAddress);

    webSocket.onopen = () => {
      const endTimeMs = (new Date()).getTime();
      const startTimeMs = endTimeMs - TimePeriod.WEEK;
  
      for (const signalInfo of Object.values(signalsInfo)) {
        const message = {
          "messageType": "getSensorData",
          "device": signalInfo.device,
          "deviceId": signalInfo.deviceId,
          "signals": signalInfo.signals,
          "start": startTimeMs,
          "end": endTimeMs,
          "clientIp": "192.168.1.4" // is it really required?
          // "averagePeriod": 7, // this is resolution, 7 means "30 minutes"
        }
        
        console.log(JSON.stringify(message))

        webSocket.send(JSON.stringify(message));
      }
    };
  
    webSocket.onmessage = (event: MessageEvent) => {
      const jsonData = JSON.parse(event.data);
      if (!isSignalDataMessage(jsonData))
        return;
      // const currTime = (new Date()).getTime();
      // const expectedTime = currTime - TimePeriod.WEEK;
      // const minTime = jsonData.time.reduce(
      //   (acc, curr) => (curr < acc ? curr : acc), Number.MAX_SAFE_INTEGER);
      // const m = Number.MAX_SAFE_INTEGER;
      // const timeLen = jsonData.time.length;
      // // console.log({currTime, expectedTime, minTime, m, timeLen});
      // console.log(event.data, jsonData);
      setNewData(jsonData.signalId, jsonData.time, jsonData.data);
    };
  
    webSocket.onerror = () => { };

    webSocket.onclose = () => { };

    return webSocket;
  };

  useEffect(() => {
    console.log("here")
    openWebSocket();
  }, []);

  return data;
}

const exampleResponse = {
  "messageType": "setSensorData",
  "signalId": "0-1",
  "time": [1672944239,1672946039,1672947839,1672949639,1672951439,1672953239,1672955039,1672956839,1672958639,1672960439,1672962239,1672964039,1672965839,1672967639,1672969439,1672971239,1672973039,1672974839,1672976639,1672978439,1672980239,1672982039,1672983839,1672985639,1672987439,1672989239,1672991039,1672992839,1672994639,1672996439,1672998239,1673000039,1673001839,1673003639,1673005439,1673007239,1673009039,1673010839,1673012639,1673014439,1673016239,1673018039,1673019839,1673021639,1673023439,1673025239,1673027039,1673028839,1673030639,1673032439,1673034239,1673036039,1673037839,1673039639,1673041439,1673043239,1673045039,1673046839,1673048639,1673050439,1673052239,1673054039,1673055839,1673057639,1673059439,1673061239,1673063039,1673064839,1673066639,1673068439,1673070239,1673072039,1673073839,1673075639,1673077439,1673079239,1673081039,1673082839,1673084639,1673086439,1673088239,1673090039,1673091839,1673093639,1673095439,1673097239,1673099039,1673100839,1673102639,1673104439,1673106239,1673108039,1673109839,1673111639,1673113439,1673115239,1673117039,1673118839,1673120639,1673122439,1673124239,1673126039,1673127839,1673129639,1673131439,1673133239,1673135039,1673136839,1673138639,1673140439,1673142239,1673144039,1673145839,1673147639,1673149439,1673151239,1673153039,1673154839,1673156639,1673158439,1673160239,1673162039,1673163839,1673165639,1673167439,1673169239,1673171039,1673172839,1673174639,1673176439,1673178239,1673180039,1673181839,1673183639,1673185439,1673187239,1673189039,1673190839,1673192639,1673194439,1673196239,1673198039,1673199839,1673201639,1673203439,1673205239,1673207039,1673208839,1673210639,1673212439,1673214239,1673216039,1673217839,1673219639,1673221439,1673223239,1673225039,1673226839,1673228639,1673230439,1673232239,1673234039,1673235839,1673237639,1673239439,1673241239,1673243039,1673244839,1673246639,1673248439,1673250239,1673252039,1673253839,1673255639,1673257439,1673259239,1673261039,1673262839,1673264639,1673266439,1673268239,1673270039,1673271839,1673273639,1673275439,1673277239,1673279039,1673280839,1673282639,1673284439,1673286239,1673288039,1673289839,1673291639,1673293439,1673295239,1673297039,1673298839,1673300639,1673302439,1673304239,1673306039,1673307839,1673309639,1673311439,1673313239,1673315039,1673316839,1673318639,1673320439,1673322239,1673324039,1673325839,1673327639,1673329439,1673331239,1673333039,1673334839,1673336639,1673338439,1673340239,1673342039,1673343839,1673345639,1673347439,1673349239,1673351039,1673352839,1673354639,1673356439,1673358239,1673360039,1673361839,1673363639,1673365439,1673367239,1673369039,1673370839,1673372639,1673374439,1673376239,1673378039,1673379839,1673381639,1673383439,1673385239,1673387039,1673388839,1673390639,1673392439,1673394239,1673396039,1673397839,1673399639,1673401439,1673403239,1673405039,1673406839,1673408639,1673410439,1673412239,1673414039,1673415839,1673417639,1673419439,1673421239,1673423039,1673424839,1673426639,1673428439,1673430239,1673432039,1673433839,1673435639,1673437439,1673439239,1673441039,1673442839,1673444639,1673446439,1673448239,1673450039,1673451839,1673453639,1673455439,1673457239,1673459039,1673460839,1673462639,1673464439,1673466239,1673468039,1673469839,1673471639,1673473439,1673475239,1673477039,1673478839,1673480639,1673482439,1673484239,1673486039,1673487839,1673489639,1673491439,1673493239,1673495039,1673496839,1673498639,1673500439,1673502239,1673504039,1673505839,1673507639,1673509439,1673511239,1673513039,1673514839,1673516639,1673518439,1673520239,1673522039,1673523839,1673525639,1673527439,1673529239,1673531039,1673532839,1673534639,1673536439,1673538239,1673540039,1673541839,1673543639,1673545439,1673547239,1673549039,1673550839,1673552639,1673554439,1673556239,1673558039,1673559839,1673561639,1673563439,1673565239,1673567039,1673568839,1673570639,1673572439,1673574239,1673576039,1673577839,1673579639,1673581439,1673583239,1673585039,1673586839,1673588639,1673590439,1673592239,1673594039,1673595839,1673597639,1673599439,1673601239,1673603039,1673604839,1673606639,1673608439,1673610239,1673612039,1673613839,1673615639,1673617439,1673619239,1673621039,1673622839,1673624639,1673626439,1673628239,1673630039,1673631839,1673633639,1673635439,1673637239,1673639039,1673640839,1673642639,1673644439,1673646239,1673648039,1673649839,1673651639,1673653439,1673655239,1673657039,1673658839,1673660639,1673662439,1673664239,1673666039,1673667839,1673669639],
  "data": {
    "0": [515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,504.94952392578125,515.0485229492188,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,509.9990234375,520.1990356445312,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,509.8459777832031,520.0429077148438,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,499.8489990234375,509.8459777832031,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094,514.9444580078125,504.8475036621094],
    "1": [520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,509.9490051269531,520.14794921875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,515.0485229492188,525.3494873046875,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,520.14794921875,530.5509643554688,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,514.8939208984375,525.1917724609375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,504.7979736328125,514.8939208984375,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625,520.0428466796875,509.845947265625]
  },
}