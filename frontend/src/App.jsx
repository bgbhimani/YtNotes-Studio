import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Studio from "./pages/Studio";
import  MainScreen from "./pages/MainScreen"

function App() {
  return (

 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/studio/:videoId" element={<Studio />} /> */}
            <Route path="/studio/:videoId" element={<MainScreen />} />
          </Routes>
        </BrowserRouter>
  );
}

export default App;