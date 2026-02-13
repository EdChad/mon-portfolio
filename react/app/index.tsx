import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

interface TableField {
  id: string;
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
}

const App = () => {

  const [fields, setFields] = useState<TableField[]>([
    { id: '1', name: 'Nom', type: 'STRING' },
    { id: '2', name: 'Age', type: 'NUMBER' },
    { id: '3', name: 'Ville', type: 'STRING' },
  ]);

  const [rowCount, setRowCount] = useState(10);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const addField = () => {
    const newField: TableField = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      type: 'STRING',
    };
    setFields([...fields, newField]);
  };

  // Remove a field
  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(f => f.id !== id));
    }
  };

  // Update field property
  const updateField = (id: string, updates: Partial<TableField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // ✅ communication avec FastAPI
  const handleGenerate = async () => {

    setIsGenerating(true);
    setStatus("Génération Excel...");

    try {

      const response = await fetch("https://mon-portfolio-kjwx.onrender.com/generate-excel", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          topic: topic,
          rowCount: rowCount,
          fields: fields
        })

      });

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = "generated.xlsx";

      a.click();

      setStatus("Téléchargement terminé");

    }
    catch (error) {

      console.error(error);

      setStatus("Erreur");

    }

    setIsGenerating(false);

  };

  return (

     <div className="max-w-4xl mx-auto p-6 md:p-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
          ExcelGen AI
        </h1>
        <p className="text-slate-400 text-lg">
          Créez vos colonnes, décrivez le sujet, laissez l'IA remplir le tableau.
        </p>
      </header>

      <div className="grid gap-8">
        {/* Step 1: Topic and Config */}
        <section className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <i data-lucide="settings" className="w-5 h-5 text-indigo-400"></i>
            </div>
            <h2 className="text-xl font-semibold">Configuration Générale</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Sujet des données</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Liste de produits high-tech avec prix..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Nombre de lignes</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={rowCount}
                onChange={(e) => setRowCount(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Field Builder */}
        <section className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <i data-lucide="layout" className="w-5 h-5 text-purple-400"></i>
              </div>
              <h2 className="text-xl font-semibold">Structure des Colonnes</h2>
            </div>
            <button 
              onClick={addField}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              <i data-lucide="plus" className="w-4 h-4"></i> Ajouter un champ
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="field-row flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-slate-900/30">
                <div className="flex-1 min-w-[200px]">
                  <input 
                    type="text"
                    placeholder="Nom de la colonne (ex: Prix Unitaire)"
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 outline-none text-white placeholder-slate-600"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                    className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="STRING">Texte</option>
                    <option value="NUMBER">Nombre</option>
                    <option value="DATE">Date</option>
                    <option value="BOOLEAN">Oui/Non</option>
                  </select>
                  <button 
                    onClick={() => removeField(field.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                    title="Supprimer"
                  >
                    <i data-lucide="trash-2" className="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-4 py-6">
          <button 
            disabled={isGenerating}
            onClick={handleGenerate}
            className={`
              relative overflow-hidden group px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300
              ${isGenerating 
                ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 text-white'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {isGenerating ? (
                <div className="w-6 h-6 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <i data-lucide="file-spreadsheet" className="w-6 h-6"></i>
              )}
              {isGenerating ? 'Génération...' : 'Générer Excel'}
            </div>
          </button>
          
          {status && (
            <p className="text-indigo-400 font-medium animate-pulse">
              {status}
            </p>
          )}
        </div>
      </div>

      <footer className="mt-20 pb-10 text-center text-slate-500 text-sm">
        Propulsé par Gemini 3 Flash • Export compatible CSV / Excel / Sheets
      </footer>
    </div>
  );

};

const root = createRoot(document.getElementById('root')!);

root.render(<App />);
