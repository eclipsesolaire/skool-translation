import React, { useState, useEffect, useCallback } from 'react';
import BarChart from '../components/BarChart';
// import Accueil from '../page/Accueil'
import { Link } from "react-router-dom";



// Constante pour les données initiales
const INITIAL_DATA = [55, 140, 95, 180, 75, 210, 45, 160, 120, 85, 200, 60, 130, 170, 35,
    150, 100, 190, 70, 220, 90, 145, 50, 175, 110, 205, 65, 155, 125]

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// fonction qui genere toutes les étapes du tri pour un tableau donné
const genererEtapesTriBulles = (tableauInitial) => {
    let etapes = []
    let arr = [...tableauInitial]
    let indicesTries = []

    // Étape initiale du graphique 
    etapes.push({ array: [...arr], comparing: [], swapping: [], sorted: [] })

    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            // Étape de comparaison (jaune)
            etapes.push({
                array: [...arr],
                comparing: [j, j + 1],
                swapping: [],
                sorted: [...indicesTries]
            });

            if (arr[j] > arr[j + 1]) {
                // Étape d'échange (rouge)
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;

                etapes.push({
                    array: [...arr],
                    comparing: [],
                    swapping: [j, j + 1],
                    sorted: [...indicesTries]
                });
            }
        }
        // À la fin de chaque boucle tri le dernier element 
        indicesTries.push(arr.length - i - 1)
        etapes.push({
            array: [...arr],
            comparing: [],
            swapping: [],
            sorted: [...indicesTries]
        })
    }
    // Le premier élément est aussi trié à la fin
    indicesTries.push(0);
    etapes.push({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: [...indicesTries]
    });

    return etapes
}

export default function Visualisateur() {
    // --- état d'origine des element 
    const [LoginOpen, setIsLoginOpen] = useState(false)
    const [SignupOpen, setSignupOpen] = useState(false)
    const [vitesse, setVitesse] = useState(1)
    const [optionVisualisation, setOptionVisualisation] = useState(true)
    const [randomGraph, setRandomGraph] = useState(false)

    // --- ÉTATS POUR L'ANIMATION ET LES COULEURS 
    const [currentData, setCurrentData] = useState({
        array: [...INITIAL_DATA],
        comparing: [],
        swapping: [],
        sorted: []
    })
    const [allSteps, setAllSteps] = useState([])
    const [etape, setEtape] = useState(0)
    const [play, setPlay] = useState(false)

    // --- GÉNÉRATION DES ÉTAPES POUR LE GRAPHIQUE CLASSIQUE AU MONTAGE 
    useEffect(() => {
        const etapes = genererEtapesTriBulles(INITIAL_DATA)
        setAllSteps(etapes)
        setCurrentData(etapes[0])
        setEtape(0)
        setPlay(false)
    }, [])

    // --- MOTEUR D'ANIMATION ---
    useEffect(() => {
        if (play && etape < allSteps.length - 1) {
            const delai = Math.max(10, 500 - (vitesse * 6.5))
            const timer = setTimeout(() => {
                setEtape(prev => prev + 1)
                setCurrentData(allSteps[etape + 1])
            }, delai)
            return () => clearTimeout(timer)
        } else if (etape >= allSteps.length - 1) {
            setPlay(false)
        }
    }, [play, etape, allSteps, vitesse])

    // --- FONCTION POUR OBTENIR LES COULEURS DES BARRES ---
    const getColors = () => {
        return currentData.array.map((_, index) => {
            if (currentData.swapping.includes(index)) return '#ef4444'
            if (currentData.comparing.includes(index)) return '#eab308'
            if (currentData.sorted.includes(index)) return '#22c55e'
            return '#3b82f6'
        })
    }

    // --- CONTROLES DU GRAPHIQUE ---
    const handleReset = () => {
        setPlay(false)
        setEtape(0)
        setCurrentData(allSteps[0] || {
            array: [...INITIAL_DATA],
            comparing: [],
            swapping: [],
            sorted: []
        })
    }

    const handleEnd = () => {
        setPlay(false)
        const dernierIndice = allSteps.length > 0 ? allSteps.length - 1 : 0
        setEtape(dernierIndice)
        setCurrentData(allSteps[dernierIndice])
    }

    const handlePlayPause = () => {
        if (etape >= allSteps.length - 1) {
            setEtape(0)
            setCurrentData(allSteps[0])
            setPlay(true)
        } else {
            setPlay(!play)
        }
    }

    // --- FONCTIONS POUR CHANGER LE MODE DE VISUALISATION ---
    const graphiqueChoise = () => {
        // Charger les données classiques
        const etapes = genererEtapesTriBulles(INITIAL_DATA)
        setAllSteps(etapes)
        setCurrentData(etapes[0])
        setEtape(0)
        setPlay(false)
        setOptionVisualisation(true)
        setRandomGraph(false)
    }

    // Génère pour la partie aleatoire 
    const genererGraphiqueRandom = () => {
        const tableauAleatoire = Array.from({ length: 29 }, () => randomInt(0, 200))
        const etapes = genererEtapesTriBulles(tableauAleatoire)
        setAllSteps(etapes)
        setCurrentData(etapes[0])
        setEtape(0)
        setPlay(false)
    }

    const graphiqueRandom = () => {
        // Premier graph aleatoire
        genererGraphiqueRandom()
        setOptionVisualisation(false)
        setRandomGraph(true)
    }

    const openLogin = () => setIsLoginOpen(true)
    const closeLogin = () => setIsLoginOpen(false)

    const openSignup = () => setSignupOpen(true)
    const closeSignup = () => setSignupOpen(false)

    const openLoginCloseSignup = () => {
        closeSignup()
        setTimeout(() => {
            openLogin()
        }, 500)
    }

    const openSignupCloseLogin = () => {
        closeLogin()
        setTimeout(() => {
            openSignup()
        }, 500)
    }

    return (
        <>
            <div className="relative w-full">
                <div className="border-[1px] p-6 bg-white/30 text-gray-600/80 w-[85%] ml-[6%] shadow-lg rounded-lg h-[800px] mt-[20px]">
                    <ul className="flex gap-2 text-[0.8rem] md:text-[1rem] font-semibold">
                        <h4 className="hover:text-indigo-500 cursor-pointer">
  <Link to="/" onClick={() => setMobileMenu(false)}>Accueil</Link>
</h4>

                        <span className="font-bold">→</span>
                        <h4 className="hover:text-indigo-500 cursor-pointer">Graphique</h4>
                        <span className="font-bold">→</span>
                        <h4 className="text-red-400 hover:opacity-70 cursor-pointer" onClick={openSignup}>
                            Sign up
                        </h4>
                        <span className="font-bold">→</span>
                        <h4 className="hover:text-indigo-500 cursor-pointer" onClick={openLogin}>
                            Login
                        </h4>
                        <span className="">→</span>
                        <h4 className="ml-4">Visulisateur d'algorithme</h4>
                    </ul>

                    <h1 className="text-[1.3rem] md:text-[2rem] lg:text-[2.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 font-bold mt-4 mb-6 text-center ">
                        Algorithme visualisation
                    </h1>
                    <h4 className="ml-[20%] mt-3">
                        Projet interactif de visualisation d’algorithmes qui permet d’afficher
                        étape par étape le fonctionnement de méthodes de tri, de
                        recherche ou de parcours de graphes à l’aide d’animations et de barres colorées.
                    </h4>

                    <div>
                        <div className="flex p-2 mt-8 px-4 gap-[2%] mt-4 max-w-[95%] mx-auto ">
                            <div className="flex flex-col w-[25%]">
                                <div className="flex flex-col gap-2 w-[100%] border-2 rounded-lg bg-blue-100/90 p-2 h-[140px]">
                                    <p className="pl-2 pt-2 px-4 text-blue-800/60 font-medium text-[0.8rem]">
                                        Version visualisation
                                    </p>
                                    <button
                                        onClick={graphiqueChoise}
                                        className={`text-center text-[0.9rem] font-bold rounded-lg py-2 ${
                                            optionVisualisation ? 'bg-blue-600 text-white' : ''
                                        }`}
                                    >
                                        Graphique visualisation
                                    </button>
                                    <button
                                        onClick={graphiqueRandom}
                                        className={`text-center text-[0.9rem] font-bold rounded-lg py-2 ${
                                            randomGraph ? 'bg-blue-600 text-white' : ''
                                        }`}
                                    >
                                        🎲 Random Graphique
                                    </button>
                                </div>

                                {optionVisualisation && (
                                    <div className="border-2 mt-[30px] pt-[15px] h-[180px] rounded-lg">
                                        <ul className="flex gap-4 text-white font-bold px-2 ">
                                            <button
                                                onClick={handleReset}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]"
                                            >
                                                <i className="fi fi-ss-rewind mt-[2px]"></i>Reset
                                            </button>

                                            <button
                                                onClick={handlePlayPause}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]"
                                            >
                                                <i
                                                    className={`fi ${
                                                        play ? 'fi-sr-pause' : 'fi-sr-play-circle'
                                                    } mt-[2px]`}
                                                ></i>
                                                {play ? 'Pause' : 'Play'}
                                            </button>

                                            <button
                                                onClick={handleEnd}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]"
                                            >
                                                End<i className="fi fi-ss-forward mt-[2px]"></i>
                                            </button>
                                        </ul>

                                        <p className="mt-4 text-[0.8rem] ml-3">Gérer la vittesse du graphique</p>
                                        <p className="text-[0.8rem] ml-3">Speed : {vitesse}</p>
                                        <input
                                            onChange={(e) => setVitesse(Number(e.target.value))}
                                            className="ml-4 mt-2"
                                            value={vitesse}
                                            type="range"
                                            min="1"
                                            max="100"
                                        />
                                    </div>
                                )}

                                {randomGraph && (
                                    <div className="border-2 mt-[30px] pt-[15px] h-[180px] rounded-lg">
                                        <ul className="flex gap-4 text-white font-bold px-2 ">
                                            <button
                                                onClick={handleReset}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]"
                                            >
                                                <i className="fi fi-ss-rewind mt-[2px]"></i>Reset
                                            </button>

                                            <button
                                                onClick={handlePlayPause}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]"
                                            >
                                                <i
                                                    className={`fi ${
                                                        play ? 'fi-sr-pause' : 'fi-sr-play-circle'
                                                    } mt-[2px]`}
                                                ></i>
                                                {play ? 'Pause' : 'Play'}
                                            </button>

                                            <button
                                                onClick={handleEnd}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]"
                                            >
                                                End<i className="fi fi-ss-forward mt-[2px]"></i>
                                            </button>
                                        </ul>

                                        <p className="mt-4 text-[0.8rem] ml-3">Gérer la vittesse du graphique</p>
                                        <p className="text-[0.8rem] ml-3">Speed : {vitesse}</p>
                                        <div className="flex flex-col w-full flex item-center">
                                            <input
                                                onChange={(e) => setVitesse(Number(e.target.value))}
                                                className="ml-5 mr-6 mt-2"
                                                value={vitesse}
                                                type="range"
                                                min="1"
                                                max="100"
                                            />
                                            <button
                                                onClick={genererGraphiqueRandom}
                                                className="border-2 rounded-lg px-2 mt-2 w-[70%] ml-[10%] hover:opacity-60"
                                            >
                                                Random
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col flex-auto border-2 rounded-lg p-2 h-[400px]">
                                {/* Légende commune aux deux modes */}
                                <div className="flex justify-center gap-6 mt-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                        <span className="text-sm">Non trié</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-sm">Comparaison</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm">Échange</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm">Trié</span>
                                    </div>
                                </div>

                                {/* Graphique selon le mode */}
                                <div className="p-2 flex-1 flex justify-center items-end">
                                    <BarChart
                                        values={currentData.array}
                                        colors={getColors()}
                                        step={etape}
                                        total={allSteps.length > 0 ? allSteps.length - 1 : 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background noir semi-transparent pour Login */}
            <div
                className={`fixed top-0 left-0 w-full h-full z-40 transition-opacity duration-500 bg-black ${
                    LoginOpen
                        ? 'opacity-50 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeLogin}
            ></div>

            {/* Card de login */}
            <div
                className={`fixed z-50 rounded-[1rem] w-[30%] h-[35rem] border-[1px] border-white/30 text-white 
                top-[1rem] transition-all duration-500 ease-in-out flex flex-col backdrop-blur-md ${
                    LoginOpen
                        ? 'right-[1rem] opacity-100 pointer-events-auto'
                        : 'right-[-40%] opacity-0 pointer-events-none'
                }`}
                style={{ background: 'rgba(38, 48, 127, 0.9)' }}
            >
                <div className="flex justify-between mx-5 mt-3">
                    <h3 className="font-bold text-[1.5rem]">Login</h3>
                    <h3 className="text-[2rem] opacity-80 cursor-pointer -mt-2" onClick={closeLogin}>
                        ×
                    </h3>
                </div>

                <h6 className="text-[0.8rem] opacity-80 mt-8 mx-5">
                    Pour vous enregistrer mettez votre identifiant et mot de passe. En cas de perte du mot de passe
                    cliquer mot de passe oublié.
                </h6>

                <div className="mt-8 flex-1 px-5 space-y-4">
                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem] ">* Identifiant</h4>
                        <input
                            placeholder="Mettez votre identifiant"
                            style={{ background: '#514c4c80' }}
                            type="text"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem]">* Mot de passe</h4>
                        <input
                            placeholder="Mettez votre mot de passe"
                            style={{ background: '#514c4c80' }}
                            type="password"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                    </div>
                </div>

                <div
                    style={{ background: '#6372ff' }}
                    className="rounded-b-[1rem] p-6 flex flex-col items-center space-y-4"
                >
                    <hr className="border-white/20 w-full" />
                    <div className="flex gap-6">
                        <button
                            className="border border-white font-bold hover:bg-white hover:text-black transition-colors rounded-lg w-[5rem] py-1"
                        >
                            Login
                        </button>
                        <button
                            onClick={openSignupCloseLogin}
                            className="font-bold hover:opacity-70 px-6 py-1 bg-white/10 rounded-lg border border-white/30"
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </div>

            {/* Background pour Sign up */}
            <div
                className={`fixed top-0 left-0 w-full h-full z-40 transition-opacity duration-500 bg-black ${
                    SignupOpen
                        ? 'opacity-50 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeSignup}
            ></div>

            {/* Card de Sign up */}
            <div
                className={`fixed z-50 rounded-[1rem] w-[30%] h-[35rem] border-[1px] border-white/30 text-white 
                top-[1rem] transition-all duration-500 ease-in-out flex flex-col backdrop-blur-md ${
                    SignupOpen
                        ? 'right-[1rem] opacity-100 pointer-events-auto'
                        : 'right-[-40%] opacity-0 pointer-events-none'
                }`}
                style={{ background: 'rgba(38, 48, 127, 0.9)' }}
            >
                <div className="flex justify-between mx-5 mt-3">
                    <h3 className="font-bold text-[1.5rem]">Sign up</h3>
                    <h3 className="text-[2rem] opacity-80 cursor-pointer -mt-2" onClick={closeSignup}>
                        ×
                    </h3>
                </div>

                <h6 className="text-[0.8rem] opacity-80 mt-8 mx-5">
                    Crée votre identifiant et votre mot de passe
                </h6>

                <div className="mt-8 flex-1 px-5 space-y-4">
                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem] ">* Identifiant</h4>
                        <input
                            placeholder="Cree votre identifiant"
                            style={{ background: '#514c4c80' }}
                            type="text"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem]">* Crée de passe</h4>
                        <input
                            placeholder="Cree votre mot de passe"
                            style={{ background: '#514c4c80' }}
                            type="password"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                        <h4 className="opacity-80 text-[0.9rem]">* Remettre de passe</h4>
                        <input
                            placeholder="Résseyer votre mot de passe"
                            style={{ background: '#514c4c80' }}
                            type="password"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                    </div>
                </div>

                <div
                    style={{ background: '#6372ff' }}
                    className="rounded-b-[1rem] p-6 flex flex-col items-center space-y-4"
                >
                    <hr className="border-white/20 w-full" />
                    <div className="flex gap-6">
                        <button
                            onClick={openLoginCloseSignup}
                            className="border border-white font-bold hover:bg-white hover:text-black transition-colors rounded-lg w-[5rem] py-1"
                        >
                            Login
                        </button>
                        <button className="font-bold hover:opacity-70 px-6 py-1 bg-white/10 rounded-lg border border-white/30">
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}