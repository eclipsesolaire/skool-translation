import React from 'react'
import { Link } from 'react-router-dom'

export default function Accueil() {
  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="relative z-10 border-[1px] border-indigo-100/60 p-6 md:p-10 bg-white/80 backdrop-blur-sm text-gray-700 w-[90%] md:w-[85%] mx-auto shadow-2xl rounded-2xl min-h-[calc(100vh-8rem)] mt-[20px] mb-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <h4 className="text-indigo-600 hover:text-indigo-700 ">Accueil</h4>
        </div>

        <div className="space-y-10">
          {/* Hero Section */}
          <div className="text-center md:text-left">
            <h1 className="text-[2rem] md:text-[3rem] lg:text-[3.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 font-bold mb-4">
              Bienvenue
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto md:mx-0 mb-6"></div>
          </div>

          <p className="text-[1rem] md:text-[1.15rem] leading-relaxed max-w-4xl mx-auto md:mx-0 text-gray-600">
            Ce site regroupe quelques-uns de mes projets personnels en{' '}
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">développement</strong>,
            en{' '}
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">IA</strong>{' '}
            et en{' '}
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">réseaux de neurones</strong>.
            <br />
            Juste des expérimentations et des outils que je construis pour apprendre.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <section 
              className="group border-2 border-indigo-100/80 rounded-2xl p-6 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform">
                  💻
                </div>
                <h2 className="text-indigo-700 font-bold text-[1.2rem] md:text-[1.3rem]">Projets de code</h2>
              </div>
              <p className="text-[0.95rem] md:text-[1rem] leading-relaxed text-gray-600">
                Des visualiseurs d'algorithmes, des scripts et petits outils que j'utilise pour comprendre
                le fonctionnement des tris, des parcours de graphes, et bien plus encore. Chaque projet est
                une opportunité d'apprendre et d'expérimenter.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {["Algorithmes", "Visualisation", "Python", "JavaScript"].map((nom, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                    {nom}
                  </span>
                ))}
              </div>
            </section>

            <section 
              className="group border-2 border-indigo-100/80 rounded-2xl p-6 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform">
                  🧠
                </div>
                <h2 className="text-indigo-700 font-bold text-[1.2rem] md:text-[1.3rem]">IA & réseaux de neurones</h2>
              </div>
              <p className="text-[0.95rem] md:text-[1rem] text-gray-600">
                Expérimentations avec des modèles de deep learning : classification, régression,
                ou simplement comprendre comment un réseau apprend. C'est un model fait pour la visualisation,
                le model n'a aucun butte particulier à pars pour la démonstration de projet.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {["Deep Learning", "Numpy", "PyTorch", "Reseaux de neurones"].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Featured Projects Section */}
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-indigo-600 mb-6 flex items-center gap-2">
              Projets en vedette
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <h2>
                Ce site est une démonstration réalisée avec React JS, une bibliothèque JavaScript,
                et Tailwind CSS, un framework de styles.
              </h2>
              <h2>
                Projets de réseaux de neurones RNN, modèle de traduction français–anglais
                avec l'optimiseur Adam, architecture encodeur–décodeur et plusieurs fonctionnalités
                comme le gradient clipping, l'attention, etc.
              </h2>
            </div>
          </div>

          {/* CTA Section */}
          <div 
            className="mt-8 pt-6 border-t-2 grid md:grid-cols-2 gap-4"
          >
            <Link
              to="/visualisateur"
              className="group gap-2  px-6 py-3 w-[55%] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg  duration-300 hover:scale-105 text-[1rem]"
            >
              Voir le visualiseur d'algo
              <span className="group-hover:translate-x-1 transition-transform pl-2  ">→</span>
            </Link>
            <Link to="/code" 
            className="group  px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 w-[60%] text-white rounded-xl font-semibold hover:shadow-lg  duration-300 hover:scale-105 text-[1rem]"
>
              <span className="group-hover:translate-x-1 transition-transform pr-4">←</span>
              Code réseaux de neurone
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}