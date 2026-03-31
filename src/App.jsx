import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from '../nav/Navbar';
import Accueil from '../page/Accueil'
import Visualisateur from '../page/Visualisateur'  
import Code from '../page/Code'
import Reseaux from '../page/Reseaux'

export default function App() {
  return (
    <div className="mt-[70px] h-full">
      <Navbar />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/code" element={<Code />} />
        <Route path="/visualisateur" element={<Visualisateur />} />
        <Route path="/reseaux" element={<Reseaux />} />
      </Routes>
    </div>
  )
}
