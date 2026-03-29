import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ResumeProvider } from "./pages/ResumeContext";

import Startpage from "./pages/startpage";
import UsersLogin from "./pages/usersLogin";
import HrLogin from "./pages/hrLogin"
import UserRegister from "./pages/UserRegister"
import HrRegister from "./pages/HrRegister";
import Userdata from "./pages/Userdata";
import UsersFeed from "./pages/UsersFeed";
import Resume from "./pages/Resume";
import ViewResume from "./pages/ViewResume";
import UserProfile from "./pages/Userprofile";
import SavedPage from "./pages/SavedPage";
import HRDashboard from "./pages/HRDashboard";
import PrivateFeed from "./pages/Private Profile";
function App() {
  

  return (
    <ResumeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Startpage/>}/>
          <Route path="/login" element={<UsersLogin />} />
          <Route path="/hr-login" element={<HrLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/hr-register" element={<HrRegister />} />
          <Route path="/user-data" element={<Userdata />} />
          <Route path="/feed" element={<UsersFeed />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/view-resume/:id" element={<ViewResume />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/hr-dashboard" element={<HRDashboard />} />
          <Route path="/private-feed" element={<PrivateFeed />} />
        </Routes>
      </Router>
    </ResumeProvider>
  )
}

export default App
