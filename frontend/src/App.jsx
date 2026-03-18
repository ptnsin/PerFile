import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Startpage from "./pages/startpage";
import UsersLogin from "./pages/usersLogin";
import HrLogin from "./pages/hrLogin"
import UserRegister from "./pages/UserRegister"
import HrRegister from "./pages/HrRegister";
import Userdata from "./pages/Userdata";
import UsersFeed from "./pages/UsersFeed";

function App() {
  

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Startpage/>}/>
          <Route path="/login" element={<UsersLogin />} />
          <Route path="/hr-login" element={<HrLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/hr-register" element={<HrRegister />} />
          <Route path="/user-data" element={<Userdata />} />
          <Route path="/feed" element={<UsersFeed />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
