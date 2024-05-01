import { dialog } from "electron";

export function calculateIdleTime(arr, currenttimestamp) {
  const idleThresholdInMin = 1;
  const arrElement = arr[arr.length - 1];

  const differenceInMs = currenttimestamp - arrElement.time;
  const differenceInMin = differenceInMs / (1000 * 60);
  console.log(differenceInMin, "difference between timestamps in minutes");
  if (differenceInMin >= idleThresholdInMin) {
    return differenceInMin;
  }
  return 0; 
}

export function calculateActivityPercentage(data, val) {
  const uniqueData = [...new Set(data.map(item => Math.floor(item.time / 1000)))].map(time => {
    return data.find(item => Math.floor(item.time / 1000) === time);
  });

  const arrLength = uniqueData.length;
  const percentage = (arrLength / val) * 100;
  console.log("Activity percentage:", percentage);
  return percentage;
}

