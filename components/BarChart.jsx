import React from 'react'

export default function BarChart({ values, colors, step, total }) {
    // Sécurité : si values n'existe pas encore
    if (!values || values.length === 0) return null

    const maxValue = Math.max(...values)

    // On s'assure que si step == total, on est bien à 100%
    let progressPercentage = 0
    if (total > 0) {
        progressPercentage = Math.round((step / total) * 100)
    }
    
    // On plafonne à 100
    if (progressPercentage > 100) progressPercentage = 100

    const isFinished = progressPercentage === 100

    return (
        <div className="flex flex-col w-full h-full">
            
            {/* Header avec % dynamique */}
            <div className="flex justify-between items-end mb-2">
                <span className={`text-sm font-bold transition-colors duration-500 ${isFinished ? "text-green-600" : "text-gray-500"}`}>
                    {isFinished ? "✅ Tri terminé !" : "Progression du tri"}
                </span>
                <span className={`text-lg font-mono font-bold transition-colors ${isFinished ? "text-green-600" : "text-blue-600"}`}>
                    {progressPercentage}
                </span>
            </div>

            {/* Barre de progression visuelle */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden border border-gray-300 shadow-inner">
                <div 
                    className={`h-full transition-all duration-300 ease-out ${isFinished ? "bg-green-500" : "bg-blue-600"}`} 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            {/* Graphique */}
            <div className="flex items-end justify-between gap-[2px] w-full flex-1 min-h-[250px]">
                {values.map((val, idx) => {
                    const heightPercentage = (val / maxValue) * 100
                    return (
                        <div 
                            key={idx}
                            className="w-full rounded-t-sm transition-all duration-150"
                            style={{ 
                                height: `${heightPercentage}%`, 
                                backgroundColor: colors ? colors[idx] : '#3b82f6'
                            }}
                        ></div>
                    );
                })}
            </div>
            
        </div>
    );
}