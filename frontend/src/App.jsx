import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Startpage from "./pages/startpage";
import UsersLogin from "./pages/usersLogin";
import HrLogin from "./pages/hrLogin"

function App() {
  

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Startpage/>}/>
          <Route path="/login" element={<UsersLogin />} />
          <Route path="/hr-login" element={<HrLogin />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
