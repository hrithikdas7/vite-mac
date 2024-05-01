import { desktopCapturer, screen, Notification } from 'electron';



// screenshot logic for win and mac
async function captureScreen() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const options = {
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 },
    fetchWindowIcons: false,
    screen: { id: primaryDisplay.id },
  };
  const sources = await desktopCapturer.getSources(options);
  return sources[0].thumbnail;
}

export default async function takeScreenshot() {
  try {
    const screenShotInfo = await captureScreen();
    const dataURL = screenShotInfo.toDataURL();
    const notification = new Notification({
      title: 'Screenshot Taken',
      body: 'Screenshot has been captured successfully',
    });
    notification.show();
    return dataURL;
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    throw error;
  }
}
