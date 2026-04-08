import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [mobileMenu, setMobileMenu] = useState(false)

  const openSearch = () => { setOpen(true)}
  const closeSearch = () => {
    setOpen(false) 
    setValue("")
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeSearch()
      }
    }

    if (open) {
      window.addEventListener("keydown", handleEscape)
    }

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <>
      <header className="fixed left-0 top-0 w-full shadow-lg h-14 flex items-center px-3 bg-white z-50">
        <h1 className="text-shadow-lg font-black  text-indigo-400 text-lg sm:text-xl w-[200px] sm:w-[250px] ml-[1%] truncate">
          Sorting Visualizer
        </h1>


        <button 
          onClick={() => setMobileMenu(!mobileMenu)}
          className="md:hidden ml-4 p-2 hover:bg-purple-100 rounded-lg"
        >
          <span className="fas fa-bars text-xl text-indigo-600 ml-[10rem]"></span>
        </button>

        {/* Nav desktop */}
        <nav className={`md:flex ${mobileMenu ? 'flex -ml-[1rem] hover:bg-transparent' : 'hidden'} md:gap-[12%] md:w-[50%] flex-col md:flex-row absolute md:static top-14  md:left-auto w-full md:w-auto bg-white  p-4 md:p-0 shadow-lg md:shadow-none gap-2 md:gap-[5%] ml-[3%]`}>
          <Link 
            to="/" 
            className="hover:bg-purple-100/60 px-3 py-2 rounded-lg hover:text-indigo-600 w-full md:w-auto text-center"
            onClick={() => setMobileMenu(false)}
          >
            Accueil
          </Link>
          <Link 
            to="/visualisateur" 
            className="hover:bg-purple-100/60 px-3 py-2 rounded-lg hover:text-indigo-600 w-full md:w-auto text-center"
            onClick={() => setMobileMenu(false)}
          >
            Graphique
          </Link>
          <Link 
            to="/reseaux" 
            className="hover:bg-purple-100/60 px-3 py-2 rounded-lg hover:text-indigo-600 w-full md:w-auto text-center"
            onClick={() => setMobileMenu(false)}
          >
            Réseaux
          </Link>
          <Link 
            to="/code" 
            className="hover:bg-purple-100/60 px-3 py-2 rounded-lg hover:text-indigo-600 w-full md:w-auto text-center"
            onClick={() => setMobileMenu(false)}
          >
            Code
          </Link>
        </nav>
        
        <div 
          onClick={openSearch}
          className="flex gap-3 items-center px-3 py-3 hover:bg-purple-100 rounded-lg hover:text-indigo-600  ml-auto mr-[50px]">
          <span className="fas fa-magnifying-glass text-gray-600 text-xl"></span>
          <span className="hidden sm:inline">Recherche</span>
        </div>
      </header>

      {mobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {open && (
        <div
          onClick={closeSearch}
          className="flex items-center justify-center fixed inset-0 bg-gray-400/70 z-40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] md:w-[40%] bg-white rounded-xl shadow-xl p-6"
          >
            <span className="fas fa-magnifying-glass text-gray-600 text-xl absolute left-9 top-[34px]"></span>
            <input  
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Rechercher un algorithme..."
              autoFocus
              className="w-full border rounded-md pl-12 pr-4 h-11 font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
              type="text"
            />
            <p className="text-gray-500 text-sm mt-4">Fonction de recherche indisponible pour le moment</p>
          </div>
        </div>
      )}
    </>
  )
}