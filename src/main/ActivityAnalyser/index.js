import { dialog } from "electron";

export function calculateIdleTime(arr, currenttimestamp,mainWindow) {
   const idleThresholdInMin = 1;
   const arrElement = arr[arr.length - 1];
 
   const differenceInMs = currenttimestamp - arrElement.time;
   const differenceInMin = differenceInMs / (1000 * 60);
   console.log(differenceInMin, "difference between timestamps in minutes");
   if (differenceInMin >= idleThresholdInMin) {
     mainWindow.restore();
 
   //   userIsIdle = true;
     console.log(`You are idle for ${differenceInMin} minutes`);
     dialog.showErrorBox("Error" , differenceInMin)
     mainWindow.webContents.send("idletime", differenceInMin);
   }
 }
 
 export function calculateActivityPercentage(arr, val, mainWindow) {
   const arrLength = arr.length;
   const percentage = (arrLength / val) * 100;
   console.log("Activity percentage:", percentage);
   mainWindow.webContents.send("activitypersent", percentage);
 }