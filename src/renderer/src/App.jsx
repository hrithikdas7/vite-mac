import Stopwatch from "./components/Stopwatch"

function App() {
  const startdetection = () => window.electron.ipcRenderer.send('startdetection')
  const stopDetection = () => window.electron.ipcRenderer.send('stopdetection')
  let modalOpen = false


  return (
    <>
    <Stopwatch startDetection={startdetection} stopDetection={stopDetection} modalOpen = {modalOpen}/>
    </>
  )
}

export default App

