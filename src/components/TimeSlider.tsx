import { useEffect, useState } from 'react';
import Slider from '@mui/material/Slider';
import { timestampMsToDateString } from '../Utils';

enum ThumbState {
  Between,
  ZoomInLeft,
  ZoomInRight,
  ZoomOutLeft,
  ZoomOutRight,
  MoveLeft,
  MoveRight,
}

type TimeRange = { start: number, end: number };

interface TimeSliderProps {
  dataStartTimeMs: number,
  dataEndTimeMs: number,
  onChange: (newTimeMs: { start: number, end: number }) => void, 
  disabled: boolean,
}

export default function TimeSlider({
  dataStartTimeMs,
  dataEndTimeMs,
  onChange,
  disabled,
}: TimeSliderProps) {
  const MIN_THUMB_VALUE = 0;
  const MAX_THUMB_VALUE = 100;
  const THUMB_VALUE_SPAN = MAX_THUMB_VALUE - MIN_THUMB_VALUE;
  const MOVE_PERCENTAGE = 0.4;
  const ZOOM_OUT_FACTOR = 1;
  const ZOOM_IN_FACTOR = 0.5;

  const [dataTimeSpan, setDataTimeSpan] = useState(0.25);

  function getBoundaryTimeMs() {
    return {
      start:
        dataStartTimeMs +
        ((1 - dataTimeSpan) / dataTimeSpan) * (dataStartTimeMs - dataEndTimeMs),
      end: dataEndTimeMs,
    };
  }
  const [boundaryTimeMs, setBoundaryTimeMs] = useState<TimeRange>(getBoundaryTimeMs());
  useEffect(() => setBoundaryTimeMs(getBoundaryTimeMs()), [dataStartTimeMs, dataEndTimeMs]);

  type ThumbValues = [number, number, number];
  const [value, setValue] = useState<ThumbValues>([
    MAX_THUMB_VALUE * (1 - dataTimeSpan),
    MAX_THUMB_VALUE * (1 - dataTimeSpan / 2),
    MAX_THUMB_VALUE,
  ]);

  const [thumbState, setThumbState] = useState(ThumbState.Between);

  useEffect(() => {
    setDataTimeSpan((value[2] - value[0]) / THUMB_VALUE_SPAN);
  }, [value]);

  function recogniseThumbState(activeThumb: number, thumbValue: number) {
    if (activeThumb === 0) {
      if (thumbValue === MIN_THUMB_VALUE) return ThumbState.ZoomOutLeft;
      if (value[2] - thumbValue === minDistance) return ThumbState.ZoomInLeft;
    }
    if (activeThumb === 1) {
      if (value[0] === MIN_THUMB_VALUE) return ThumbState.MoveLeft;
      if (value[2] === MAX_THUMB_VALUE) return ThumbState.MoveRight;
    }
    if (activeThumb === 2) {
      if (thumbValue === MAX_THUMB_VALUE) return ThumbState.ZoomOutRight;
      if (thumbValue - value[0] === minDistance) return ThumbState.ZoomInRight;
    }
    return ThumbState.Between;
  }

  function valuetext(value: number) {
    return `${value}`;
  }

  const minDistance = 10;

  const handleChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    if (activeThumb === 0) {
      setValue([
        Math.min(newValue[0], value[2] - minDistance),
        (value[0] + value[2]) / 2,
        value[2],
      ]);
    } else if (activeThumb === 1) {
      let diff = newValue[1] - value[1];
      if (diff < 0 && value[0] + diff < MIN_THUMB_VALUE)
        diff = MIN_THUMB_VALUE - value[0];
      else if (diff > 0 && value[2] + diff > MAX_THUMB_VALUE)
        diff = MAX_THUMB_VALUE - value[2];
      setValue([value[0] + diff, value[1] + diff, value[2] + diff]);
    } else if (activeThumb === 2) {
      setValue([
        value[0],
        (value[0] + value[2]) / 2,
        Math.max(newValue[2], value[0] + minDistance),
      ]);
    }

    setThumbState(recogniseThumbState(activeThumb, value[activeThumb]));
  };

  function getTimeForThumbValue(thumbValue: number) {
    const percentage = (thumbValue - MIN_THUMB_VALUE) / THUMB_VALUE_SPAN;
    return (
      boundaryTimeMs.start +
      percentage * (boundaryTimeMs.end - boundaryTimeMs.start)
    );
  }

  function getBoundedThumbValue(target: number, start: number, end: number) {
    const percentage = (target - start) / (end - start);
    return MIN_THUMB_VALUE + percentage * THUMB_VALUE_SPAN;
  }

  function recogniseChange() {
    const currStartTimeMs = getTimeForThumbValue(value[0]);
    const currEndTimeMs = getTimeForThumbValue(value[2]);

    let newTimeMs: TimeRange;
    let newBoundaryTimeMs: TimeRange;
    let diff: number;

    switch (thumbState) {
      case ThumbState.Between:
        newTimeMs = { start: currStartTimeMs, end: currEndTimeMs };
        newBoundaryTimeMs = boundaryTimeMs;
        break;
      case ThumbState.ZoomInLeft:
      case ThumbState.ZoomInRight:
        diff = ZOOM_IN_FACTOR * (boundaryTimeMs.end - boundaryTimeMs.start);
        newBoundaryTimeMs = {
          start: Math.min(boundaryTimeMs.start + diff, currStartTimeMs),
          end: Math.max(boundaryTimeMs.end - diff, currEndTimeMs),
        };
        newTimeMs = {
          start: currStartTimeMs,
          end:  currEndTimeMs,
        };
        console.log("ZOOM IN");
        break;
      case ThumbState.ZoomOutLeft:
        diff = ZOOM_OUT_FACTOR * (boundaryTimeMs.end - boundaryTimeMs.start);
        newBoundaryTimeMs = {
          start: boundaryTimeMs.start - diff,
          end: boundaryTimeMs.end,
        };
        newTimeMs = {
          start: currStartTimeMs,
          end: currEndTimeMs,
        };
        console.log("ZOOM OUT (left)");
        break;
      case ThumbState.ZoomOutRight:
        diff = ZOOM_OUT_FACTOR * (boundaryTimeMs.end - boundaryTimeMs.start);
        newBoundaryTimeMs = {
          start: boundaryTimeMs.start,
          end: boundaryTimeMs.end + diff,
        };
        newTimeMs = {
          start: currStartTimeMs,
          end: currEndTimeMs,
        };
        console.log("ZOOM OUT (right)");
        break;
      case ThumbState.MoveLeft:
        diff = MOVE_PERCENTAGE * (boundaryTimeMs.end - boundaryTimeMs.start);
        newBoundaryTimeMs = {
          start: boundaryTimeMs.start - diff,
          end: boundaryTimeMs.end - diff,
        };
        newTimeMs = {
          start: currStartTimeMs,
          end: Math.min(currEndTimeMs, newBoundaryTimeMs.end),
        };
        console.log(newTimeMs, newBoundaryTimeMs)
        console.log("MOVE LEFT");
        break;
      case ThumbState.MoveRight:
        diff = MOVE_PERCENTAGE * (boundaryTimeMs.end - boundaryTimeMs.start);
        newBoundaryTimeMs = {
          start: boundaryTimeMs.start + diff,
          end: boundaryTimeMs.end + diff,
        };
        newTimeMs = {
          start: Math.max(currStartTimeMs, newBoundaryTimeMs.start),
          end: currEndTimeMs,
        };
        console.log("MOVE RIGHT");
        break;
    }

    const currentTimeMs = new Date().getTime();
    newBoundaryTimeMs = {
      start: newBoundaryTimeMs.start,
      end: newBoundaryTimeMs.end > currentTimeMs ? currentTimeMs : newBoundaryTimeMs.end,
    }
    newTimeMs = {
      start: newTimeMs.start,
      end: newTimeMs.end > currentTimeMs ? currentTimeMs : newTimeMs.end,
    }

    setBoundaryTimeMs(newBoundaryTimeMs);
    setValue([
      getBoundedThumbValue(
        newTimeMs.start,
        newBoundaryTimeMs.start,
        newBoundaryTimeMs.end
      ),
      getBoundedThumbValue(
        newTimeMs.start + (newTimeMs.end - newTimeMs.start) / 2,
        newBoundaryTimeMs.start,
        newBoundaryTimeMs.end
      ),
      getBoundedThumbValue(
        newTimeMs.end,
        newBoundaryTimeMs.start,
        newBoundaryTimeMs.end
      ),
    ]);
    onChange(newTimeMs);
  }

  function labelText(thumbValue: number) {
    switch (thumbState) {
      case ThumbState.Between:
        return timestampMsToDateString(getTimeForThumbValue(thumbValue));
      case ThumbState.ZoomInLeft:
        return "ZOOM IN (left)";
      case ThumbState.ZoomInRight:
        return "ZOOM IN (right)";
      case ThumbState.ZoomOutLeft:
        return "ZOOM OUT (left)";
      case ThumbState.ZoomOutRight:
        return "ZOOM OUT (right)";
      case ThumbState.MoveLeft:
        return "MOVE LEFT";
      case ThumbState.MoveRight:
        return "MOVE RIGHT";
    }
  }

  return (
    <Slider
      getAriaLabel={() => "Time range"}
      value={value}
      onChange={handleChange}
      valueLabelDisplay="auto"
      getAriaValueText={valuetext}
      valueLabelFormat={labelText}
      disableSwap
      onChangeCommitted={recogniseChange}
      disabled={disabled}
    />
  );
}