import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Startpage from "./pages/Startpage";
// import usersLogin from "./pages/usersLogin"
// import hrLogin from "./pages/hrLogin"

function App() {
  

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Startpage/>}/>
          {/* <Route path="/Login" element={<usersLogin />} />
          <Route path="/hrLogin" element={<hrLogin />}/> */}
        </Routes>
      </Router>
    </>
  )
}

export default App
