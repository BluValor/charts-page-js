import { useEffect, useState } from 'react';
import Slider from '@mui/material/Slider';

enum ThumbState {
  Between,
  ZoomInLeft,
  ZoomInRight,
  ZoomOutLeft,
  ZoomOutRight,
}

type TimeSliderProps = {
  onChange: (v1: number, v2: number) => void, 
}

export default function TimeSlider({ onChange }: TimeSliderProps) {
  const [value, setValue] = useState<number[]>([25, 75]);
  const [thumbState, setThumbState] = useState(ThumbState.Between);

  useEffect(() => {
    onChange(value[0], value[1]);
  }, [value])

  function recogniseThumbState(activeThumb: number, thumbValue: number) {
    if (activeThumb === 0) {
      if (thumbValue === 0)
        return ThumbState.ZoomOutLeft;
      if (value[1] - thumbValue === minDistance)
        return ThumbState.ZoomInLeft;
    } 
    if (activeThumb === 1) {
      if (thumbValue === 100)
        return ThumbState.ZoomOutRight;
      if (thumbValue - value[0] === minDistance)
        return ThumbState.ZoomInRight;
    }
    return ThumbState.Between;
  }

  function valuetext(value: number) {
    return `${value}`;
  }

  const minDistance = 10;

  function labelText(thumbValue: number) {
    switch (thumbState) {
      case ThumbState.Between:
        return thumbValue;
      case ThumbState.ZoomInLeft:
        return "ZOOM IN (left)";
      case ThumbState.ZoomInRight:
        return "ZOOM IN (right)";
      case ThumbState.ZoomOutLeft:
        return "ZOOM OUT (left)";
      case ThumbState.ZoomOutRight:
        return "ZOOM OUT (right)";
    }
  }

  const handleChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    if (activeThumb === 0) {
      setValue([Math.min(newValue[0], value[1] - minDistance), value[1]]);
    } else {
      setValue([value[0], Math.max(newValue[1], value[0] + minDistance)]);
    }

    setThumbState(recogniseThumbState(activeThumb, value[activeThumb]));
  };

  function recogniseChange() {
    switch (thumbState) {
      case ThumbState.Between:
        return;
      case ThumbState.ZoomInLeft:
        console.log("ZOOM IN (left)");
        return;
      case ThumbState.ZoomInRight:
        console.log("ZOOM IN (right)");
        return;
      case ThumbState.ZoomOutLeft:
        console.log("ZOOM OUT (left)");
        return;
      case ThumbState.ZoomOutRight:
        console.log("ZOOM OUT (right)");
        return;
    }
  }

  return (
    <Slider
      getAriaLabel={() => 'Time range'}
      value={value}
      onChange={handleChange}
      valueLabelDisplay="auto"
      getAriaValueText={valuetext}
      valueLabelFormat={labelText}
      disableSwap
      onChangeCommitted={recogniseChange}
    />
  );
}