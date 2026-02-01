import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Utensils,
  BookOpen,
  Sparkles,
  MessageSquare,
  X
} from "lucide-react";

const BACKEND_URL = "http://gas-page-back-production.up.railway.app:3000"; 
// luego cambia por Railway

const App = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [query, setQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const scrollRef = useRef(null);

  // =====================
  // DATOS
  // =====================
  const menu = [
    {
      type: "cover",
      title: "Plan Gastritis Pro",
      subtitle: "Recetas Detalladas con IA",
      description:
        "Menú con cantidades exactas y pasos numerados para una recuperación segura."
    },
    {
      type: "warning",
      title: "ADVERTENCIA",
      content:
        "Esta guía no sustituye el consejo médico. Ante dolores agudos o sangrado, acuda a urgencias inmediatamente."
    },
    {
      day: "Lunes",
      meal: "Desayuno",
      title: "Avena con Plátano",
      recipe:
        "Ingredientes: 40g de copos de avena, 200ml de agua o leche de almendras, 1 plátano maduro.\n1. Calentar el líquido.\n2. Añadir la avena y cocinar 5-7 minutos.\n3. Añadir el plátano en rodajas.\n4. Espolvorear canela."
      ,image: "images/avena.png"
    },
    {
      day: "Lunes",
      meal: "Almuerzo",
      title: "Merluza al Vapor",
      image: "images/lunes2.png",
      recipe:
        "Ingredientes: 150g de merluza, zanahoria y patata.\n1. Cocer verduras al vapor.\n2. Añadir el pescado.\n3. Cocinar 8 minutos.\n4. Aliñar suavemente."
    },
    { 
      day: 'Lunes', 
      meal: 'Cena', 
      title: 'Crema de Calabaza', 
      image: "images/lunes3.png",
      recipe: 'Ingredientes: 300g de calabaza pelada, 1 patata pequeña, 1 chorrito de aceite.\n1. Trocear la calabaza y la patata en cubos.\n2. Hervir en agua con sal mínima durante 20 minutos hasta que ablanden.\n3. Escurrir parte del agua y triturar hasta obtener una textura fina.\n4. Servir tibia con un hilo de aceite de oliva por encima.', 
      prompt: 'Smooth pumpkin cream soup in a ceramic bowl' 
    },
    // MARTES
    { 
      day: "Martes",
      meal: "Desayuno",
      title: "Tostada con Queso Fresco",
      image: "images/martes1.png",
      recipe:
        "Ingredientes: 2 rebanadas de pan blanco (sin semillas), 60g de queso fresco tipo Burgos.\n1. Tostar ligeramente el pan sin que se queme ni endurezca demasiado.\n2. Cortar el queso en láminas de medio centímetro.\n3. Colocar el queso sobre el pan y añadir un toque mínimo de aceite de oliva.",
      prompt: "White toast with fresh white cheese slices"
    },
    { 
      day: "Martes",
      meal: "Almuerzo",
      title: "Pollo con Arroz Blanco",
      image: "images/martes2.png",
      recipe:
        "Ingredientes: 120g de pechuga de pollo, 50g de arroz seco (long grain), 1 taza de agua.\n1. Lavar el arroz bajo el grifo. Cocer en agua hirviendo con sal 18 minutos.\n2. Limpiar la pechuga de grasas. Cocinar a la plancha con apenas aceite.\n3. No dejar que el pollo se tueste demasiado (la costra quemada irrita).\n4. Servir el pollo troceado junto al arroz bien escurrido.",
      prompt: "Grilled chicken breast strips with plain white rice"
    },
    { 
      day: "Martes",
      meal: "Cena",
      title: "Sopa de Fideos y Pollo",
      image: "images/martes3.png",
      recipe:
        "Ingredientes: 30g de fideos cabellín, 400ml de caldo de pollo desgrasado, 1 zanahoria picada.\n1. Calentar el caldo hasta que hierva.\n2. Añadir la zanahoria picada muy pequeña y cocer 5 minutos.\n3. Incorporar los fideos y cocinar 3-4 minutos hasta que estén suaves.\n4. Servir inmediatamente para evitar que la pasta absorba todo el caldo.",
      prompt: "Chicken noodle soup with tiny carrot bits"
    },
    
    // MIÉRCOLES
    { 
      day: "Miércoles",
      meal: "Desayuno",
      title: "Yogur con Pera",
      image: "images/miercoles1.png",
      recipe:
        "Ingredientes: 125g de yogur natural desnatado, 1 pera grande madura.\n1. Pelar la pera, quitar el corazón y cortarla en dados.\n2. Opcional: Cocinar la pera 2 min al microondas con un poco de agua.\n3. Mezclar la pera con el yogur a temperatura ambiente.\n4. Evitar el azúcar; usar canela si se desea endulzar.",
      prompt: "Natural yogurt with pear pieces"
    },
    { 
      day: "Miércoles",
      meal: "Almuerzo",
      title: "Solomillo de Pavo y Puré",
      image: "images/miercoles2.png",
      recipe:
        "Ingredientes: 150g de solomillo de pavo, 2 patatas medianas, 20ml de leche desnatada.\n1. Hervir las patatas 20 minutos.\n2. Chafar con leche.\n3. Cocinar el pavo a la plancha.\n4. Servir tibio.",
      prompt: "Turkey tenderloin with mashed potatoes"
    },
    { 
      day: "Miércoles",
      meal: "Cena",
      title: "Tortilla de Claras",
      image: "images/miercoles3.png",
      recipe:
        "Ingredientes: 2 claras de huevo, 1 yema, 1 gota de aceite.\n1. Batir suavemente.\n2. Calentar sartén.\n3. Cocinar plegando.\n4. Interior bien cuajado.",
      prompt: "French omelette on a white plate"
    },
    
    // JUEVES
    { 
      day: "Jueves",
      meal: "Desayuno",
      title: "Papaya y Maíz",
      image: "images/jueves1.png",
      recipe:
        "Ingredientes: 200g de papaya madura, 30g de copos de maíz.\n1. Pelar la papaya.\n2. Cortar en cubos.\n3. Mezclar.\n4. Consumir al momento.",
      prompt: "Fresh papaya chunks with corn flakes"
    },
    { 
      day: "Jueves",
      meal: "Almuerzo",
      title: "Lenguado al Horno",
      image: "images/jueves2.png",
      recipe:
        "Ingredientes: 180g de lenguado, 1 calabacín.\n1. Precalentar horno.\n2. Cortar calabacín.\n3. Hornear 10-12 minutos.\n4. Servir jugoso.",
      prompt: "Baked fish fillets with zucchini"
    },
    { 
      day: "Jueves",
      meal: "Cena",
      title: "Caldo de Verduras y Arroz",
      image: "images/jueves3.png",
      recipe:
        "Ingredientes: 500ml de caldo, 40g de arroz.\n1. Hervir caldo.\n2. Añadir arroz.\n3. Cocinar blando.\n4. Ideal digestivo.",
      prompt: "Vegetable broth with rice grains"
    },
    
    // VIERNES
    { 
      day: "Viernes",
      meal: "Desayuno",
      title: "Tortitas de Arroz y Aguacate",
      image: "images/viernes1.png",
      recipe:
        "Ingredientes: 2 tortitas de arroz, 30g de aguacate.\n1. Chafar aguacate.\n2. Untar.\n3. Sin limón.\n4. Masticar bien.",
      prompt: "Rice cakes with spread avocado"
    },
    { 
      day: "Viernes",
      meal: "Almuerzo",
      title: "Pollo Hervido con Judías",
      image: "images/viernes2.png",
      recipe:
        "Ingredientes: pollo, judías, patata.\n1. Hervir verduras.\n2. Añadir pollo.\n3. Cocer.\n4. Servir sin caldo.",
      prompt: "Boiled chicken with green beans and potatoes"
    },
    { 
      day: "Viernes",
      meal: "Cena",
      title: "Crema de Zanahoria",
      image: "images/viernes3.png",
      recipe:
        "Ingredientes: zanahoria, patata, calabacín.\n1. Cocer.\n2. Triturar.\n3. Ajustar textura.\n4. Servir tibio.",
      prompt: "Bright orange carrot cream soup"
    },
    
    // SÁBADO
    { 
      day: "Sábado",
      meal: "Desayuno",
      title: "Manzana Asada",
      image: "images/sabado1.png",
      recipe:
        "Ingredientes: manzanas, canela.\n1. Lavar.\n2. Hornear.\n3. Enfriar.\n4. Comer templada.",
      prompt: "Two baked apples with a cinnamon stick"
    },
    { 
      day: "Sábado",
      meal: "Almuerzo",
      title: "Arroz con Calabaza y Pavo",
      image: "images/sabado2.png",
      recipe:
        "Ingredientes: arroz, calabaza, pavo.\n1. Rehogar.\n2. Añadir agua.\n3. Cocinar lento.\n4. Meloso.",
      prompt: "Creamy pumpkin rice with turkey bits"
    },
    { 
      day: "Sábado",
      meal: "Cena",
      title: "Sopa de Pescado Suave",
      image: "images/sabado3.png",
      recipe:
        "Ingredientes: caldo de pescado, merluza, pan.\n1. Hervir.\n2. Añadir pescado.\n3. Servir con pan.\n4. Muy suave.",
      prompt: "Clear fish soup with bread bits"
    },
    
    // DOMINGO
    { 
      day: "Domingo",
      meal: "Desayuno",
      title: "Huevo Pasado por Agua",
      image: "images/domingo1.png",
      recipe:
        "Ingredientes: huevo, pan.\n1. Hervir.\n2. Cocer 4-5 min.\n3. Enfriar.\n4. Comer con pan.",
      prompt: "Soft boiled egg in a cup with toast soldiers"
    },
    { 
      day: "Domingo",
      meal: "Almuerzo",
      title: "Lenguado y Puré de Zanahoria",
      image: "images/domingo2.png",
      recipe:
        "Ingredientes: lenguado, zanahoria.\n1. Hacer puré.\n2. Plancha pescado.\n3. Servir junto.\n4. Ligero.",
      prompt: "Grilled fish on carrot puree bed"
    },
    { 
      day: "Domingo",
      meal: "Cena",
      title: "Puré Mixto Final",
      image: "images/domingo3.png",
      recipe:
        "Ingredientes: patata, zanahoria, calabacín, clara.\n1. Cocer.\n2. Añadir clara.\n3. Triturar.\n4. Servir.",
      prompt: "Healthy vegetable mash in a bowl"
    }
    
  ];

  const pageData = menu[currentPage];

  // =====================
  // IA (BACKEND)
  // =====================
  const callGemini = async (prompt, systemPrompt) => {
    const response = await fetch(`${BACKEND_URL}/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemPrompt })
    });

    if (!response.ok) {
      throw new Error("Error backend");
    }

    const data = await response.json();
    return data.text;
  };

  const analyzeRecipe = async () => {
    setLoadingAi(true);
    try {
      const result = await callGemini(
        `Plato: ${pageData.title}`,
        "Explica en 2 frases breves por qué este plato es bueno para la gastritis."
      );
      setAiAnalysis(result);
    } catch {
      setAiAnalysis("Error al analizar.");
    } finally {
      setLoadingAi(false);
    }
  };

  const askGemini = async () => {
    if (!query) return;
    setLoadingAi(true);
    try {
      const result = await callGemini(
        query,
        "Responde si el alimento es seguro para la gastritis. Máximo 2 frases."
      );
      setChatResponse(result);
    } catch {
      setChatResponse("Error en la consulta.");
    } finally {
      setLoadingAi(false);
      setQuery("");
    }
  };

  useEffect(() => {
    setAiAnalysis("");
    setChatResponse("");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentPage]);

  // =====================
  // RENDER
  // =====================
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
      <header className="bg-emerald-600 px-4 py-3 text-white flex justify-between items-center shadow-md">
  <div className="flex items-center gap-2">
    <BookOpen size={18} />
    <span className="text-xs font-bold uppercase">
      Pág {currentPage + 1}/{menu.length}
    </span>
  </div>
  {/* Mostrar el día actual si existe en pageData */}
  {pageData.day && (
    <span className="text-sm font-bold capitalize">
      {pageData.day}
    </span>
  )}
  <button
    onClick={() => setIsAssistantOpen(true)}
    className="bg-white/20 p-1.5 rounded-lg"
  >
    <MessageSquare size={18} />
  </button>
</header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto bg-white">
        {pageData.type === "cover" ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <Utensils size={64} className="text-emerald-500" />
            <h1 className="text-4xl font-black">{pageData.title}</h1>
            <p className="text-emerald-600 font-bold">{pageData.subtitle}</p>
            <p className="text-slate-400">{pageData.description}</p>
            <button
              onClick={() => setCurrentPage(1)}
              className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold"
            >
              Comenzar
            </button>
          </div>
        ) : pageData.type === "warning" ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <AlertTriangle size={64} className="text-rose-500" />
            <h2 className="text-2xl font-black">{pageData.title}</h2>
            <p className="bg-rose-50 p-6 rounded-xl text-sm">
              {pageData.content}
            </p>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="underline"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
          {/* TÍTULO */}
          <div>
            <span className="text-emerald-500 text-xs font-black uppercase">
              {pageData.meal}
            </span>
            <h2 className="text-2xl font-black">{pageData.title}</h2>
          </div>
{/* IMAGEN ESTÁTICA */}
{pageData.image && (
            <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-100">
              <img
                src={pageData.image}
                alt={pageData.title}
                className="w-full h-[220px] object-cover"
              />
            </div>
          )}
            <pre className="bg-slate-50 p-5 rounded-xl whitespace-pre-line">
              {pageData.recipe}
            </pre>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={analyzeRecipe}
                className="bg-emerald-50 text-emerald-700 p-3 rounded-xl font-bold"
              >
                <Sparkles size={16} /> Beneficios IA
              </button>
              <button
                onClick={() => setIsAssistantOpen(true)}
                className="bg-slate-900 text-white p-3 rounded-xl font-bold"
              >
                Consultor IA
              </button>
            </div>

            {aiAnalysis && (
              <div className="bg-emerald-600 text-white p-5 rounded-xl">
                {aiAnalysis}
              </div>
            )}
          </div>
        )}
      </main>

      {isAssistantOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-black">Consultor IA</h3>
              <button onClick={() => setIsAssistantOpen(false)}>
                <X />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border rounded-xl p-3"
                placeholder="¿Puedo comer…?"
              />
              <button
                onClick={askGemini}
                className="bg-emerald-600 text-white p-3 rounded-xl"
              >
                →
              </button>
            </div>

            {chatResponse && (
              <div className="bg-emerald-50 p-4 rounded-xl">
                {chatResponse}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-white border-t p-4 flex justify-between">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === menu.length - 1}
        >
          <ChevronRight />
        </button>
      </footer>
    </div>
  );
};

export default App;