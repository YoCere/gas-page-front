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

const BACKEND_URL = "https://gas-page-back-production.up.railway.app";
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
    },
  {
    day: "Lunes (Semana 2)",
    meal: "Desayuno",
    title: "Crema de Arroz con Compota de Manzana",
    image: "images/2lunes1.png",
    recipe:
      "Ingredientes: 40g de arroz blanco, 300ml de agua, 100g de compota/puré de manzana sin azúcar, 1 pizca de canela (opcional).\n1. Lavar el arroz y cocerlo en 300ml de agua a fuego bajo 18-20 minutos (debe quedar muy blando).\n2. Triturar el arroz cocido con parte del líquido hasta lograr una crema (añadir un poco de agua si queda muy espeso).\n3. Servir tibio y colocar la compota de manzana encima.\n4. Opcional: espolvorear una pizca de canela; evitar limón o cítricos.",
    prompt: "Creamy rice porridge topped with applesauce in a simple bowl, soft lighting"
  },
  {
    day: "Lunes (Semana 2)",
    meal: "Almuerzo",
    title: "Tilapia en Papillote con Calabacín y Patata",
    image: "images/2lunes2.png",
    recipe:
      "Ingredientes: 150g de filete de tilapia (u otro pescado blanco), 200g de patata, 120g de calabacín, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir la patata en cubos 10-12 min hasta que esté tierna; escurrir.\n2. Colocar el pescado y el calabacín en láminas sobre papel para horno; añadir 2 cdas de agua y cerrar el papillote.\n3. Hornear a 180°C por 12-15 min (sin dorar en exceso).\n4. Servir tibio con la patata y añadir 1 cdita de aceite al final.",
    prompt: "White fish baked in parchment with zucchini, served with boiled potatoes, minimalistic plate"
  },
  {
    day: "Lunes (Semana 2)",
    meal: "Cena",
    title: "Crema de Calabacín y Patata",
    image: "images/2lunes3.png",
    recipe:
      "Ingredientes: 250g de calabacín pelado, 150g de patata, 450ml de agua o caldo desgrasado, 5ml (1 cdita) de aceite de oliva.\n1. Cortar calabacín y patata en cubos y hervir 18-20 min.\n2. Reservar un poco del líquido de cocción y triturar hasta textura fina.\n3. Ajustar con el líquido reservado si hace falta (debe quedar crema ligera).\n4. Servir tibia y añadir 1 cdita de aceite por encima.",
    prompt: "Smooth zucchini and potato cream soup in a white bowl, soft steam"
  },

  {
    day: "Martes (Semana 2)",
    meal: "Desayuno",
    title: "Sémola de Trigo con Leche Desnatada",
    image: "images/2martes1.png",
    recipe:
      "Ingredientes: 35g de sémola de trigo (o farina), 250ml de leche desnatada (o bebida vegetal), 1 pizca de canela (opcional).\n1. Calentar la leche a fuego bajo hasta que esté caliente (sin hervir fuerte).\n2. Añadir la sémola en lluvia, removiendo para evitar grumos.\n3. Cocinar 3-4 min hasta que espese, removiendo suave.\n4. Servir tibia; opcional añadir canela (sin cacao ni chocolate).",
    prompt: "Warm semolina porridge in a bowl, creamy texture, simple presentation"
  },
  {
    day: "Martes (Semana 2)",
    meal: "Almuerzo",
    title: "Pollo al Horno Jugoso con Puré de Camote",
    image: "images/2martes2.png",
    recipe:
      "Ingredientes: 150g de pechuga de pollo, 250g de camote/batata, 30ml de leche desnatada (opcional), 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir el camote pelado 18-20 min; chafar con 30ml de leche o con un poco de agua de cocción.\n2. Colocar el pollo en una fuente con 1 cda de agua, tapar con papel aluminio.\n3. Hornear a 180°C por 18-20 min (evitar que se dore o se seque).\n4. Reposar 2 min, cortar en tiras y servir con el puré tibio.",
    prompt: "Tender baked chicken breast served with smooth sweet potato mash, neutral tones"
  },
  {
    day: "Martes (Semana 2)",
    meal: "Cena",
    title: "Sopa de Arroz con Zanahoria",
    image: "images/2martes3.png",
    recipe:
      "Ingredientes: 500ml de caldo desgrasado (pollo o verduras), 40g de arroz blanco, 60g de zanahoria, sal mínima.\n1. Llevar el caldo a ebullición suave.\n2. Añadir la zanahoria en cubitos muy pequeños y cocer 8 min.\n3. Agregar el arroz lavado y cocinar 18-20 min hasta que esté muy blando.\n4. Servir tibia; si queda espesa, ajustar con un poco de agua caliente.",
    prompt: "Simple rice and carrot soup, clear broth, comforting bowl"
  },

  {
    day: "Miércoles (Semana 2)",
    meal: "Desayuno",
    title: "Pan Blanco con Requesón y Mermelada de Durazno",
    image: "images/2miercoles1.png",
    recipe:
      "Ingredientes: 2 rebanadas de pan blanco, 60g de requesón/ricotta (bajo en grasa), 20g de mermelada de durazno sin semillas.\n1. Tostar el pan muy ligeramente (solo para entibiar).\n2. Untar el requesón en capa fina.\n3. Añadir la mermelada por encima (cantidad moderada).\n4. Consumir despacio; evitar mermeladas ácidas (cítricos).",
    prompt: "White bread toast with ricotta and peach jam, minimal styling"
  },
  {
    day: "Miércoles (Semana 2)",
    meal: "Almuerzo",
    title: "Bacalao Hervido con Patata",
    image: "images/2miercoles2.png",
    recipe:
      "Ingredientes: 160g de bacalao fresco (o pescado blanco), 200g de patata, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir la patata en cubos 12-15 min; escurrir.\n2. En otra olla, calentar agua hasta casi hervir (fuego suave).\n3. Cocer el bacalao 6-8 min (solo hasta que se desmenuce; no sobrecocer).\n4. Servir tibio con la patata y añadir 1 cdita de aceite al final.",
    prompt: "Poached cod with boiled potatoes, very simple plating, soft tones"
  },
  {
    day: "Miércoles (Semana 2)",
    meal: "Cena",
    title: "Puré de Papa con Huevo Escalfado",
    image: "images/2miercoles3.png",
    recipe:
      "Ingredientes: 250g de patata, 30ml de leche desnatada (opcional), 1 huevo, 5ml (1 cdita) de aceite de oliva.\n1. Hervir la patata 18-20 min; chafar con leche o con un poco de agua de cocción.\n2. Calentar agua en un cazo hasta hervor suave (sin vinagre).\n3. Romper el huevo en una taza y deslizarlo al agua; cocinar 3-4 min.\n4. Colocar el huevo sobre el puré y servir tibio.",
    prompt: "Mashed potatoes topped with a softly poached egg, clean white plate"
  },

  {
    day: "Jueves (Semana 2)",
    meal: "Desayuno",
    title: "Yogur Natural con Melón Maduro",
    image: "images/2jueves1.png",
    recipe:
      "Ingredientes: 125g de yogur natural (bajo en grasa), 150g de melón maduro.\n1. Dejar el yogur 10 min fuera del refri para que no esté muy frío.\n2. Pelar el melón y retirar semillas.\n3. Cortar en cubos pequeños y mezclar con el yogur.\n4. Consumir sin azúcar; si se desea, usar una pizca de canela.",
    prompt: "Natural yogurt with melon cubes, gentle and fresh, bright background"
  },
  {
    day: "Jueves (Semana 2)",
    meal: "Almuerzo",
    title: "Pavo al Vapor con Pasta Blanca",
    image: "images/2jueves2.png",
    recipe:
      "Ingredientes: 140g de pechuga de pavo, 60g de pasta blanca (seca), 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Cocer la pasta en agua sin exceso de sal (según paquete, 8-10 min) y escurrir.\n2. Cocinar el pavo al vapor 10-12 min hasta que esté bien hecho.\n3. Desmechar o cortar el pavo en tiras finas.\n4. Mezclar con la pasta, añadir 1 cdita de aceite y servir tibio.",
    prompt: "Plain pasta with tender steamed turkey strips, simple bowl"
  },
  {
    day: "Jueves (Semana 2)",
    meal: "Cena",
    title: "Puré de Chayote y Zanahoria",
    image: "images/2jueves3.png",
    recipe:
      "Ingredientes: 250g de chayote (pelado), 80g de zanahoria, 400ml de agua, 5ml (1 cdita) de aceite de oliva.\n1. Trocear chayote y zanahoria en cubos.\n2. Hervir 18-20 min hasta que estén muy tiernos.\n3. Triturar con parte del agua de cocción hasta obtener puré fino.\n4. Servir tibio y añadir 1 cdita de aceite al final.",
    prompt: "Smooth chayote and carrot puree in a bowl, soft texture"
  },

  {
    day: "Viernes (Semana 2)",
    meal: "Desayuno",
    title: "Galletas Tipo María con Leche Tibia",
    image: "images/2viernes1.png",
    recipe:
      "Ingredientes: 5-6 galletas tipo María (30g aprox.), 250ml de leche desnatada (o bebida vegetal).\n1. Calentar la leche hasta tibia (no muy caliente).\n2. Servir en taza y acompañar con las galletas.\n3. Comer despacio y masticar bien (evitar atragantarse si se remojan).\n4. Evitar cacao/chocolate y café como acompañamiento.",
    prompt: "Maria cookies with a cup of warm milk, cozy breakfast scene"
  },
  {
    day: "Viernes (Semana 2)",
    meal: "Almuerzo",
    title: "Macarrones Blancos con Jamón Cocido y Calabacín",
    image: "images/2viernes2.png",
    recipe:
      "Ingredientes: 70g de macarrón blanco (seco), 80g de jamón cocido bajo en grasa, 120g de calabacín pelado, 5ml (1 cdita) de aceite de oliva.\n1. Cocer el calabacín en cubitos 8-10 min; escurrir.\n2. Cocer la pasta en agua (8-10 min) y escurrir.\n3. Picar el jamón en cuadros pequeños.\n4. Mezclar pasta + calabacín + jamón; añadir 1 cdita de aceite y servir tibio.",
    prompt: "Plain macaroni with diced ham and zucchini, simple light meal"
  },
  {
    day: "Viernes (Semana 2)",
    meal: "Cena",
    title: "Sopa Clara de Pollo con Sémola",
    image: "images/2viernes3.png",
    recipe:
      "Ingredientes: 500ml de caldo de pollo desgrasado, 35g de sémola de trigo, 60g de pollo cocido desmechado.\n1. Calentar el caldo hasta hervor suave.\n2. Añadir la sémola en lluvia removiendo para que no haga grumos.\n3. Cocinar 3-4 min; agregar el pollo desmechado 1-2 min.\n4. Servir tibia; ajustar con agua caliente si espesa demasiado.",
    prompt: "Clear chicken soup with semolina, comforting simple bowl"
  },

  {
    day: "Sábado (Semana 2)",
    meal: "Desayuno",
    title: "Compota de Pera con Canela",
    image: "images/2sabado1.png",
    recipe:
      "Ingredientes: 1 pera grande madura (200g), 80ml de agua, 1 pizca de canela.\n1. Pelar la pera, retirar el centro y cortar en cubos.\n2. Cocinar con 80ml de agua a fuego bajo 10-12 min.\n3. Aplastar con tenedor o triturar para textura de compota.\n4. Dejar entibiar y espolvorear canela (opcional).",
    prompt: "Homemade pear compote in a small bowl, warm and soft"
  },
  {
    day: "Sábado (Semana 2)",
    meal: "Almuerzo",
    title: "Arroz Meloso de Pollo y Calabacín",
    image: "images/2sabado2.png",
    recipe:
      "Ingredientes: 60g de arroz blanco, 150g de pollo sin piel, 150g de calabacín pelado, 650ml de caldo desgrasado.\n1. Cortar el pollo en cubos pequeños y cocinarlo en 200ml de caldo 8 min.\n2. Añadir el arroz y el resto del caldo; hervir suave 15 min removiendo ocasionalmente.\n3. Agregar el calabacín en cubitos y cocinar 5-7 min más (debe quedar cremoso).\n4. Reposar 2 min y servir tibio.",
    prompt: "Creamy chicken rice with zucchini, soft texture, homestyle bowl"
  },
  {
    day: "Sábado (Semana 2)",
    meal: "Cena",
    title: "Tortilla al Horno de Calabacín",
    image: "images/2sabado3.png",
    recipe:
      "Ingredientes: 2 huevos, 180g de calabacín pelado, 5ml (1 cdita) de aceite de oliva.\n1. Rallar el calabacín y cocinarlo 6-8 min en sartén antiadherente con 1-2 cdas de agua.\n2. Batir los huevos y mezclar con el calabacín ya tibio.\n3. Verter en un molde pequeño apenas engrasado y hornear a 180°C por 12-15 min.\n4. Dejar entibiar y servir (evitar dorar demasiado).",
    prompt: "Baked zucchini omelette in a simple dish, soft and tender"
  },

  {
    day: "Domingo (Semana 2)",
    meal: "Desayuno",
    title: "Tostada Francesa Suave",
    image: "images/2domingo1.png",
    recipe:
      "Ingredientes: 2 rebanadas de pan blanco, 1 huevo, 80ml de leche desnatada, 5ml (1 cdita) de aceite de oliva.\n1. Batir el huevo con la leche.\n2. Remojar el pan 10-15 segundos por lado (sin empaparlo demasiado).\n3. Cocinar en sartén antiadherente a fuego bajo con 1 cdita de aceite, 1-2 min por lado (solo dorado leve).\n4. Servir tibia; evitar miel en exceso o toppings ácidos.",
    prompt: "Soft French toast on a plate, lightly golden, minimalist breakfast"
  },
  {
    day: "Domingo (Semana 2)",
    meal: "Almuerzo",
    title: "Lubina al Horno con Patata",
    image: "images/2domingo2.png",
    recipe:
      "Ingredientes: 180g de filete de lubina (u otro pescado blanco), 220g de patata, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Cortar la patata en láminas finas y hervir 8 min; escurrir.\n2. Colocar patata y pescado en bandeja con papel para horno; añadir 2 cdas de agua.\n3. Hornear a 180°C por 12-15 min (sin gratinar ni tostar).\n4. Servir tibio y agregar 1 cdita de aceite al final.",
    prompt: "Baked sea bass with tender potatoes, simple clean plating"
  },
  {
    day: "Domingo (Semana 2)",
    meal: "Cena",
    title: "Crema de Batata y Zanahoria",
    image: "images/2domingo3.png",
    recipe:
      "Ingredientes: 250g de batata/camote, 100g de zanahoria, 450ml de agua, 5ml (1 cdita) de aceite de oliva.\n1. Pelar y cortar batata y zanahoria en cubos.\n2. Hervir 18-20 min hasta que estén muy blandas.\n3. Triturar con parte del líquido de cocción hasta lograr crema fina.\n4. Servir tibia y añadir 1 cdita de aceite por encima.",
    prompt: "Smooth sweet potato and carrot soup, warm and comforting in a bowl"
  },

  // SEMANA 3
  {
    day: "Lunes (Semana 3)",
    meal: "Desayuno",
    title: "Arroz con Leche Light",
    image: "images/2lunes1.png",
    recipe:
      "Ingredientes: 40g de arroz blanco, 250ml de agua, 200ml de leche desnatada (o sin lactosa), 1 pizca de canela (opcional).\n1. Lavar el arroz y cocerlo en 250ml de agua 15-18 min hasta que esté muy tierno.\n2. Añadir la leche y cocinar 8-10 min a fuego bajo, removiendo.\n3. Apagar y dejar reposar 3 min para que espese.\n4. Servir tibio; evitar azúcar (endulzar solo si el paciente lo tolera y en poca cantidad).",
    prompt: "Light rice pudding in a bowl, creamy, simple and warm"
  },
  {
    day: "Lunes (Semana 3)",
    meal: "Almuerzo",
    title: "Albóndigas de Pavo en Caldo Suave",
    image: "images/2lunes2.png",
    recipe:
      "Ingredientes: 150g de pavo molido, 10g de pan blanco rallado, 1 clara de huevo, 500ml de caldo desgrasado, sal mínima.\n1. Mezclar pavo + pan rallado + clara y formar albóndigas pequeñas (del tamaño de una nuez).\n2. Calentar el caldo a hervor suave.\n3. Añadir las albóndigas y cocinar 10-12 min (hasta que estén bien cocidas por dentro).\n4. Servir tibio; si se desea, acompañar con pan blanco (sin salsas).",
    prompt: "Small turkey meatballs in a clear broth soup, comforting and simple"
  },
  {
    day: "Lunes (Semana 3)",
    meal: "Cena",
    title: "Crema de Calabacín con Arroz",
    image: "images/2lunes3.png",
    recipe:
      "Ingredientes: 220g de calabacín pelado, 30g de arroz blanco, 500ml de agua o caldo desgrasado, 5ml (1 cdita) de aceite de oliva.\n1. Hervir el arroz 15-18 min en el agua/caldo.\n2. Añadir el calabacín en cubos y cocinar 10 min más.\n3. Triturar todo hasta lograr crema homogénea.\n4. Servir tibia y añadir 1 cdita de aceite al final.",
    prompt: "Creamy zucchini and rice soup blended smooth, served warm in bowl"
  },

  {
    day: "Martes (Semana 3)",
    meal: "Desayuno",
    title: "Natilla de Maicena y Vainilla Suave",
    image: "images/3martes1.png",
    recipe:
      "Ingredientes: 250ml de leche desnatada (o bebida vegetal), 15g de maicena, 1/2 cdta de vainilla, 1 cdta de azúcar (opcional).\n1. Disolver la maicena en 50ml de leche fría.\n2. Calentar el resto de la leche a fuego bajo.\n3. Añadir la mezcla de maicena y remover 3-5 min hasta espesar.\n4. Servir tibia (no muy caliente); endulzar solo si es necesario y en poca cantidad.",
    prompt: "Soft vanilla cornstarch custard in a small bowl, smooth texture"
  },
  {
    day: "Martes (Semana 3)",
    meal: "Almuerzo",
    title: "Pescadilla al Vapor con Puré de Calabacín",
    image: "images/3martes2.png",
    recipe:
      "Ingredientes: 160g de pescadilla (o pescado blanco), 250g de calabacín pelado, 120g de patata (opcional para espesar), 5ml (1 cdita) de aceite de oliva.\n1. Hervir calabacín (y patata si se usa) 18-20 min; triturar hasta puré fino.\n2. Cocinar el pescado al vapor 8-10 min.\n3. Servir el puré tibio y colocar el pescado encima desmenuzado.\n4. Añadir 1 cdita de aceite al final; evitar pimienta y salsas.",
    prompt: "Steamed white fish served over smooth zucchini puree, clean presentation"
  },
  {
    day: "Martes (Semana 3)",
    meal: "Cena",
    title: "Caldo Desgrasado con Couscous",
    image: "images/3martes3.png",
    recipe:
      "Ingredientes: 500ml de caldo desgrasado (pollo o verduras), 50g de couscous (refinado), 5ml (1 cdita) de aceite de oliva.\n1. Calentar el caldo hasta que hierva suave.\n2. Apagar el fuego y añadir el couscous.\n3. Tapar 5 min para que se hidrate sin quedar duro.\n4. Remover con tenedor, servir tibio y añadir 1 cdita de aceite al final.",
    prompt: "Warm broth with couscous grains, simple bowl, soothing meal"
  },

  {
    day: "Miércoles (Semana 3)",
    meal: "Desayuno",
    title: "Pudín de Pan Suave",
    image: "images/3miercoles1.png",
    recipe:
      "Ingredientes: 60g de pan blanco, 250ml de leche desnatada, 1 huevo, 1/2 cdta de vainilla (opcional).\n1. Remojar el pan en la leche 5 min.\n2. Batir el huevo e incorporarlo a la mezcla (quedará una crema líquida).\n3. Verter en un molde y hornear a 170°C por 25-30 min (sin dorar demasiado).\n4. Dejar entibiar antes de comer; evitar canela en exceso y evitar cacao.",
    prompt: "Soft bread pudding slice on a plate, light color, gentle texture"
  },
  {
    day: "Miércoles (Semana 3)",
    meal: "Almuerzo",
    title: "Ternera Magra Cocida con Zanahoria",
    image: "images/3miercoles2.png",
    recipe:
      "Ingredientes: 140g de ternera magra, 120g de zanahoria, 200g de patata, 700ml de agua, sal mínima.\n1. Cortar la ternera en trozos pequeños y hervir a fuego suave 25-30 min (retirar espuma).\n2. Añadir la patata en cubos y cocinar 12 min.\n3. Agregar la zanahoria en cubos pequeños y cocinar 8-10 min.\n4. Servir tibio, con poco caldo (evitar exceso de grasa y condimentos).",
    prompt: "Lean beef stew boiled simply with potatoes and carrots, very mild presentation"
  },
  {
    day: "Miércoles (Semana 3)",
    meal: "Cena",
    title: "Arroz Blanco con Huevo Duro Picado",
    image: "images/3miercoles3.png",
    recipe:
      "Ingredientes: 60g de arroz blanco (seco), 1 huevo, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Cocer el arroz 18 min; escurrir y dejar entibiar.\n2. Cocer el huevo 10-11 min; enfriar, pelar y picar fino.\n3. Mezclar el huevo con el arroz.\n4. Añadir 1 cdita de aceite al final y servir tibio.",
    prompt: "Plain white rice mixed with chopped hard-boiled egg, simple bowl"
  },

  {
    day: "Jueves (Semana 3)",
    meal: "Desayuno",
    title: "Cuajada con Miel y Manzana Cocida",
    image: "images/3jueves1.png",
    recipe:
      "Ingredientes: 125g de cuajada natural (o yogur natural), 1 manzana (180g), 80ml de agua, 1 cdta de miel (opcional).\n1. Pelar la manzana y cocinarla en cubos con 80ml de agua 10-12 min.\n2. Aplastar para hacer compota y dejar entibiar.\n3. Servir la cuajada a temperatura ambiente y añadir la manzana cocida.\n4. Opcional: 1 cdta de miel si se tolera; evitar limón/cítricos.",
    prompt: "Curd yogurt topped with warm stewed apple, soft and gentle breakfast"
  },
  {
    day: "Jueves (Semana 3)",
    meal: "Almuerzo",
    title: "Pollo Pochado con Patata y Calabacín",
    image: "images/3jueves2.png",
    recipe:
      "Ingredientes: 150g de pechuga de pollo, 200g de patata, 150g de calabacín pelado, 800ml de agua, sal mínima.\n1. Calentar el agua a hervor suave (que no burbujee fuerte) y añadir el pollo 12-15 min.\n2. Retirar el pollo y desmechar.\n3. En la misma agua, hervir patata 12 min y agregar calabacín 8-10 min.\n4. Servir pollo desmechado con las verduras tibias; añadir 1 cdita de aceite si se desea.",
    prompt: "Poached chicken with boiled potatoes and zucchini, very soft and mild meal"
  },
  {
    day: "Jueves (Semana 3)",
    meal: "Cena",
    title: "Sopa de Acelga con Patata",
    image: "images/3jueves3.png",
    recipe:
      "Ingredientes: 500ml de caldo desgrasado, 200g de patata, 40g de hojas tiernas de acelga (bien picadas).\n1. Hervir la patata en cubos en el caldo 15-18 min.\n2. Añadir la acelga muy picada.\n3. Cocinar 3-4 min (solo hasta que esté tierna).\n4. Servir tibia; si hay gases, reducir la cantidad de hojas y volver a intentar más adelante.",
    prompt: "Mild potato and chard soup, light broth, simple bowl"
  },

  {
    day: "Viernes (Semana 3)",
    meal: "Desayuno",
    title: "Cereal de Arroz Inflado con Leche",
    image: "images/3viernes1.png",
    recipe:
      "Ingredientes: 35g de cereal de arroz inflado (sin chocolate), 250ml de leche desnatada (o sin lactosa).\n1. Servir la leche a temperatura ambiente o tibia (no muy fría).\n2. Añadir el cereal de arroz inflado.\n3. Dejar 1 min para que se ablande.\n4. Consumir sin cacao ni café; masticar bien.",
    prompt: "Rice puff cereal with milk in a bowl, simple breakfast, bright background"
  },
  {
    day: "Viernes (Semana 3)",
    meal: "Almuerzo",
    title: "Corvina al Papillote con Zanahoria",
    image: "images/3viernes2.png",
    recipe:
      "Ingredientes: 170g de corvina (o pescado blanco), 100g de zanahoria, 150g de patata, 5ml (1 cdita) de aceite de oliva.\n1. Hervir la patata en cubos 10-12 min; escurrir.\n2. Cortar la zanahoria en láminas finas y colocarla con el pescado en papel para horno; añadir 2 cdas de agua.\n3. Cerrar papillote y hornear a 180°C por 12-15 min.\n4. Servir tibio con la patata y añadir 1 cdita de aceite al final.",
    prompt: "White fish en papillote with carrot slices, served with boiled potatoes"
  },
  {
    day: "Viernes (Semana 3)",
    meal: "Cena",
    title: "Puré de Patata y Calabacín",
    image: "images/3viernes3.png",
    recipe:
      "Ingredientes: 200g de patata, 200g de calabacín pelado, 400ml de agua, 5ml (1 cdita) de aceite de oliva.\n1. Hervir patata y calabacín en cubos 18-20 min.\n2. Reservar un poco de agua de cocción.\n3. Triturar hasta puré fino, ajustando con el agua reservada.\n4. Servir tibio con 1 cdita de aceite al final.",
    prompt: "Smooth potato and zucchini mash in a bowl, soft texture, warm"
  },

  {
    day: "Sábado (Semana 3)",
    meal: "Desayuno",
    title: "Gelatina de Manzana",
    image: "images/3sabado1.png",
    recipe:
      "Ingredientes: 250ml de jugo de manzana no ácido (o agua + 100ml jugo de manzana), 7g de gelatina sin sabor, 1 manzana cocida en cubitos (opcional).\n1. Hidratar la gelatina en 50ml de agua fría (5 min).\n2. Calentar el jugo/mezcla (sin hervir fuerte) y disolver la gelatina hidratada.\n3. Verter en recipiente y refrigerar 3-4 horas.\n4. Servir sin estar helada (dejar 5-10 min a temperatura ambiente antes de comer).",
    prompt: "Apple gelatin dessert in a glass cup, simple and clean look"
  },
  {
    day: "Sábado (Semana 3)",
    meal: "Almuerzo",
    title: "Arroz con Tiras de Pavo y Calabacín",
    image: "images/3sabado2.png",
    recipe:
      "Ingredientes: 60g de arroz blanco (seco), 140g de pechuga de pavo, 150g de calabacín pelado, 5ml (1 cdita) de aceite de oliva.\n1. Cocer el arroz 18 min; escurrir.\n2. Cocer el calabacín en cubitos 8-10 min; escurrir.\n3. Cocinar el pavo a la plancha suave (sin tostar) 3-4 min por lado y cortar en tiras.\n4. Mezclar arroz + calabacín + pavo; añadir 1 cdita de aceite y servir tibio.",
    prompt: "White rice with turkey strips and zucchini, very mild meal presentation"
  },
  {
    day: "Sábado (Semana 3)",
    meal: "Cena",
    title: "Sopa de Fideos de Arroz con Pollo",
    image: "images/3sabado3.png",
    recipe:
      "Ingredientes: 500ml de caldo de pollo desgrasado, 40g de fideos de arroz, 60g de pollo cocido desmechado.\n1. Calentar el caldo hasta hervor suave.\n2. Añadir los fideos de arroz y cocinar 3-5 min (según grosor).\n3. Agregar el pollo desmechado 1-2 min.\n4. Servir tibia inmediatamente para que no se espese demasiado.",
    prompt: "Rice noodle chicken soup in a bowl, light broth, comforting"
  },

  {
    day: "Domingo (Semana 3)",
    meal: "Desayuno",
    title: "Huevos Revueltos Suaves con Pan Blanco",
    image: "images/3domingo1.png",
    recipe:
      "Ingredientes: 2 huevos, 2 rebanadas de pan blanco, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Batir los huevos suavemente (sin incorporar demasiado aire).\n2. Calentar sartén antiadherente a fuego bajo con 1 cdita de aceite.\n3. Cocinar removiendo despacio 2-3 min hasta cuajar (textura cremosa, sin dorar).\n4. Servir con pan blanco tibio (sin salsas ni picantes).",
    prompt: "Soft scrambled eggs with white bread toast, simple breakfast plate"
  },
  {
    day: "Domingo (Semana 3)",
    meal: "Almuerzo",
    title: "Bacalao al Horno Suave con Arroz y Calabacín",
    image: "images/3domingo2.png",
    recipe:
      "Ingredientes: 170g de bacalao (o pescado blanco), 60g de arroz blanco (seco), 150g de calabacín pelado, 5ml (1 cdita) de aceite.\n1. Cocer el arroz 18 min; escurrir y reservar.\n2. Cocer el calabacín en cubitos 8-10 min; escurrir.\n3. Hornear el pescado a 180°C por 12-14 min con 2 cdas de agua (sin dorar de más).\n4. Servir tibio con arroz + calabacín y añadir 1 cdita de aceite al final.",
    prompt: "Soft baked cod served with white rice and zucchini, minimal healthy plate"
  },
  {
    day: "Domingo (Semana 3)",
    meal: "Cena",
    title: "Congee de Arroz con Pescado Blanco",
    image: "images/3domingo3.png",
    recipe:
      "Ingredientes: 50g de arroz blanco, 800ml de agua, 120g de pescado blanco, sal mínima.\n1. Lavar el arroz y cocinarlo en 800ml de agua 35-45 min a fuego bajo (se deshace y queda tipo papilla).\n2. Desmenuzar el pescado y añadirlo cuando el congee esté espeso.\n3. Cocinar 6-8 min más hasta que el pescado esté bien hecho.\n4. Servir tibio; evitar condimentos fuertes (sin pimienta, sin vinagre).",
    prompt: "Rice congee porridge with flaky white fish, warm and soothing bowl"
  },

  // SEMANA 4
  {
    day: "Lunes (Semana 4)",
    meal: "Desayuno",
    title: "Biscotes con Pechuga de Pavo",
    image: "images/4lunes1.png",
    recipe:
      "Ingredientes: 4 biscotes/tostadas blandas de pan blanco (40-60g), 60g de pechuga de pavo (fiambre magro), 5ml (1 cdita) de aceite de oliva (opcional).\n1. Entibiar los biscotes (sin quemar).\n2. Colocar la pechuga de pavo encima.\n3. Opcional: añadir 1 cdita de aceite de oliva.\n4. Comer despacio y con poca sal; evitar embutidos muy grasos o picantes.",
    prompt: "White bread crisp toast with turkey slices, minimal breakfast plate"
  },
  {
    day: "Lunes (Semana 4)",
    meal: "Almuerzo",
    title: "Tofu al Vapor con Arroz y Zanahoria",
    image: "images/4lunes2.png",
    recipe:
      "Ingredientes: 160g de tofu firme, 60g de arroz blanco (seco), 80g de zanahoria, 5ml (1 cdita) de aceite de oliva.\n1. Cocer el arroz 18 min; escurrir.\n2. Hervir la zanahoria en cubitos 8-10 min; escurrir.\n3. Cocinar el tofu al vapor 8-10 min y cortarlo en cubos.\n4. Servir tibio con arroz + zanahoria y añadir 1 cdita de aceite al final.",
    prompt: "Steamed tofu cubes with white rice and soft carrots, simple healthy plate"
  },
  {
    day: "Lunes (Semana 4)",
    meal: "Cena",
    title: "Congee Salado de Arroz con Pollo",
    image: "images/4lunes3.png",
    recipe:
      "Ingredientes: 50g de arroz blanco, 850ml de agua, 120g de pollo cocido (sin piel) desmechado, sal mínima.\n1. Cocinar el arroz en 850ml de agua 35-45 min a fuego bajo hasta textura tipo papilla.\n2. Añadir el pollo desmechado.\n3. Cocinar 3-5 min más para integrar.\n4. Servir tibio; evitar salsas (sin tomate, sin picante).",
    prompt: "Savory rice congee with shredded chicken in a bowl, warm comforting look"
  },

  {
    day: "Martes (Semana 4)",
    meal: "Desayuno",
    title: "Papilla de Farina con Banano",
    image: "images/4martes1.png",
    recipe:
      "Ingredientes: 35g de farina/cream of wheat, 250ml de leche desnatada (o bebida vegetal), 1/2 banano/plátano maduro.\n1. Calentar la leche a fuego bajo.\n2. Añadir la farina en lluvia, removiendo 3-4 min hasta espesar.\n3. Aplastar el banano y mezclarlo fuera del fuego.\n4. Servir tibia; evitar azúcar y evitar cacao.",
    prompt: "Cream of wheat porridge with mashed banana, soft and gentle breakfast bowl"
  },
  {
    day: "Martes (Semana 4)",
    meal: "Almuerzo",
    title: "Pechuga de Pollo a la Plancha Suave con Puré de Chayote",
    image: "images/4martes2.png",
    recipe:
      "Ingredientes: 150g de pechuga de pollo, 300g de chayote pelado, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir el chayote en cubos 18-20 min y triturar hasta puré.\n2. Calentar sartén antiadherente y cocinar el pollo a fuego medio-bajo 3-4 min por lado (sin dorar fuerte).\n3. Dejar reposar 2 min y cortar en tiras.\n4. Servir tibio con el puré; añadir 1 cdita de aceite al puré.",
    prompt: "Soft grilled chicken breast with smooth chayote puree, minimal plate"
  },
  {
    day: "Martes (Semana 4)",
    meal: "Cena",
    title: "Sopa de Letras en Caldo de Verduras",
    image: "images/4martes3.png",
    recipe:
      "Ingredientes: 500ml de caldo de verduras desgrasado, 35g de pasta de letras, 60g de zanahoria (opcional, muy picada).\n1. Hervir el caldo a fuego suave.\n2. (Opcional) Añadir zanahoria muy picada y cocer 5-6 min.\n3. Agregar la pasta de letras y cocinar 6-8 min hasta que esté muy suave.\n4. Servir tibia; evitar salsas y evitar picantes.",
    prompt: "Alphabet pasta soup in clear vegetable broth, simple comforting bowl"
  },

  {
    day: "Miércoles (Semana 4)",
    meal: "Desayuno",
    title: "Yogur Natural con Compota de Manzana",
    image: "images/4miercoles1.png",
    recipe:
      "Ingredientes: 125g de yogur natural bajo en grasa, 120g de compota/puré de manzana sin azúcar.\n1. Dejar el yogur 10 min a temperatura ambiente.\n2. Servir el yogur en un bowl.\n3. Añadir la compota por encima.\n4. Consumir sin azúcar añadida; canela opcional.",
    prompt: "Natural yogurt topped with applesauce, minimal and gentle breakfast bowl"
  },
  {
    day: "Miércoles (Semana 4)",
    meal: "Almuerzo",
    title: "Conejo al Horno con Patata y Calabacín",
    image: "images/4miercoles2.png",
    recipe:
      "Ingredientes: 160g de conejo (parte magra), 200g de patata, 150g de calabacín pelado, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir la patata en cubos 10-12 min; escurrir.\n2. Colocar conejo y calabacín en bandeja con 3 cdas de agua y tapar con aluminio.\n3. Hornear a 180°C por 25-30 min (mantener jugoso; evitar dorado excesivo).\n4. Servir tibio con la patata y añadir 1 cdita de aceite al final.",
    prompt: "Tender baked rabbit with zucchini and boiled potatoes, very mild presentation"
  },
  {
    day: "Miércoles (Semana 4)",
    meal: "Cena",
    title: "Puré de Calabacín con Queso Fresco",
    image: "images/4miercoles3.png",
    recipe:
      "Ingredientes: 300g de calabacín pelado, 80g de queso fresco tipo Burgos, 400ml de agua, 5ml (1 cdita) de aceite de oliva.\n1. Hervir el calabacín 18-20 min.\n2. Triturar con un poco del agua de cocción hasta puré fino.\n3. Añadir el queso fresco en cubitos y mezclar (se ablanda con el calor).\n4. Servir tibio con 1 cdita de aceite al final.",
    prompt: "Zucchini puree with soft fresh cheese cubes, warm bowl, gentle texture"
  },

  {
    day: "Jueves (Semana 4)",
    meal: "Desayuno",
    title: "Flan Casero Suave al Baño María",
    image: "images/4jueves1.png",
    recipe:
      "Ingredientes: 1 huevo, 200ml de leche desnatada (o sin lactosa), 1 cdta de azúcar (opcional), vainilla suave (opcional).\n1. Batir huevo + leche (y vainilla si se usa) sin espumar.\n2. Verter en un molde pequeño.\n3. Cocinar al baño María en horno a 160°C por 30-35 min (debe cuajar sin dorarse).\n4. Dejar entibiar; evitar caramelo y evitar chocolate.",
    prompt: "Simple homemade custard flan, pale color, smooth texture on a plate"
  },
  {
    day: "Jueves (Semana 4)",
    meal: "Almuerzo",
    title: "Pescado Blanco Hervido con Couscous y Zanahoria",
    image: "images/4jueves2.png",
    recipe:
      "Ingredientes: 160g de pescado blanco, 50g de couscous, 80g de zanahoria, 500ml de agua, 5ml (1 cdita) de aceite de oliva.\n1. Hervir la zanahoria en cubitos 8-10 min; reservar.\n2. Cocer el pescado en agua a hervor suave 6-8 min; retirar.\n3. Hidratar el couscous con agua caliente (o caldo desgrasado) 5 min.\n4. Servir tibio con zanahoria y pescado desmenuzado; añadir 1 cdita de aceite al final.",
    prompt: "Poached white fish with couscous and soft carrots, minimal healthy plate"
  },
  {
    day: "Jueves (Semana 4)",
    meal: "Cena",
    title: "Sopa de Avena con Zanahoria",
    image: "images/4jueves3.png",
    recipe:
      "Ingredientes: 500ml de caldo desgrasado, 30g de avena suave (copos finos), 60g de zanahoria.\n1. Hervir la zanahoria muy picada en el caldo 8 min.\n2. Añadir la avena y cocinar 6-8 min a fuego bajo.\n3. Remover suave hasta que la avena quede bien blanda.\n4. Servir tibia; evitar pimienta y salsas.",
    prompt: "Oat soup with tiny carrot bits, warm and soothing bowl"
  },

  {
    day: "Viernes (Semana 4)",
    meal: "Desayuno",
    title: "Queso Cottage con Melón",
    image: "images/4viernes1.png",
    recipe:
      "Ingredientes: 120g de queso cottage (bajo en grasa), 150g de melón muy maduro.\n1. Dejar el queso 10 min fuera del refri para que no esté helado.\n2. Cortar el melón en cubos pequeños y retirar semillas.\n3. Mezclar con el queso cottage.\n4. Consumir sin azúcar; si cae pesado, cambiar por yogur o reducir porción.",
    prompt: "Cottage cheese with melon cubes in a bowl, simple and gentle breakfast"
  },
  {
    day: "Viernes (Semana 4)",
    meal: "Almuerzo",
    title: "Hamburguesitas de Pavo al Horno con Arroz Blanco",
    image: "images/4viernes2.png",
    recipe:
      "Ingredientes: 160g de pavo molido, 10g de pan blanco rallado, 1 clara de huevo, 60g de arroz blanco (seco), 5ml (1 cdita) de aceite de oliva.\n1. Cocer el arroz 18 min; escurrir.\n2. Mezclar pavo + pan rallado + clara y formar 2 hamburguesitas delgadas.\n3. Hornear a 180°C por 15-18 min (dar vuelta a mitad; evitar dorar demasiado).\n4. Servir tibio con arroz; añadir 1 cdita de aceite al final.",
    prompt: "Baked turkey patties served with plain white rice, clean minimal plate"
  },
  {
    day: "Viernes (Semana 4)",
    meal: "Cena",
    title: "Huevo al Plato con Patata",
    image: "images/4viernes3.png",
    recipe:
      "Ingredientes: 1 huevo, 220g de patata, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir la patata en cubos 12-15 min; escurrir y colocar en un ramekin.\n2. Hacer un hueco y cascar el huevo encima.\n3. Hornear a 170°C por 8-10 min (clara cuajada, yema al gusto).\n4. Servir tibio con 1 cdita de aceite al final.",
    prompt: "Baked egg in a small dish with tender potatoes, minimal presentation"
  },

  {
    day: "Sábado (Semana 4)",
    meal: "Desayuno",
    title: "Atole Suave de Arroz",
    image: "images/4sabado1.png",
    recipe:
      "Ingredientes: 40g de arroz blanco, 400ml de agua, 150ml de leche desnatada (opcional), canela suave (opcional).\n1. Cocer el arroz en 400ml de agua 20 min hasta muy blando.\n2. Triturar hasta bebida espesa (tipo atole).\n3. Añadir la leche y calentar 2-3 min a fuego bajo.\n4. Servir tibio; evitar azúcar y evitar cacao.",
    prompt: "Warm rice atole drink in a mug, cozy and gentle"
  },
  {
    day: "Sábado (Semana 4)",
    meal: "Almuerzo",
    title: "Ternera Magra a la Plancha Suave con Puré de Papa",
    image: "images/4sabado2.png",
    recipe:
      "Ingredientes: 140g de ternera magra, 250g de patata, 30ml de leche desnatada (opcional), 5ml (1 cdita) de aceite de oliva.\n1. Hervir la patata 18-20 min; chafar con leche o agua de cocción.\n2. Calentar sartén antiadherente y cocinar la ternera a fuego medio-bajo 2-3 min por lado (sin costra tostada).\n3. Dejar reposar 2 min y cortar en tiras finas.\n4. Servir tibio junto al puré; añadir 1 cdita de aceite al final.",
    prompt: "Soft grilled lean beef strips with mashed potatoes, simple mild plating"
  },
  {
    day: "Sábado (Semana 4)",
    meal: "Cena",
    title: "Crema de Chayote y Patata",
    image: "images/4sabado3.png",
    recipe:
      "Ingredientes: 250g de chayote pelado, 150g de patata, 450ml de agua o caldo desgrasado, 5ml (1 cdita) de aceite de oliva.\n1. Cortar chayote y patata en cubos.\n2. Hervir 18-20 min hasta muy tiernos.\n3. Triturar hasta crema fina (ajustar con líquido de cocción).\n4. Servir tibia con 1 cdita de aceite por encima.",
    prompt: "Smooth chayote and potato cream soup in a bowl, warm and soothing"
  },

  {
    day: "Domingo (Semana 4)",
    meal: "Desayuno",
    title: "Pan Blanco con Mermelada de Manzana y Queso Fresco",
    image: "images/4domingo1.png",
    recipe:
      "Ingredientes: 2 rebanadas de pan blanco, 60g de queso fresco, 20g de mermelada de manzana sin trozos (o puré de manzana).\n1. Tostar el pan muy ligeramente.\n2. Colocar el queso fresco en láminas.\n3. Añadir una capa fina de mermelada/puré por encima.\n4. Consumir tibio; evitar mermeladas cítricas y evitar exceso de azúcar.",
    prompt: "White toast with fresh cheese and apple jam, soft pastel tones"
  },
  {
    day: "Domingo (Semana 4)",
    meal: "Almuerzo",
    title: "Fideos Blancos con Pollo Desmechado y Calabacín",
    image: "images/4domingo2.png",
    recipe:
      "Ingredientes: 70g de fideos/pasta blanca (seca), 120g de pollo cocido desmechado, 150g de calabacín pelado, 5ml (1 cdita) de aceite de oliva.\n1. Cocer la pasta según paquete y escurrir.\n2. Cocer el calabacín en cubitos 8-10 min; escurrir.\n3. Mezclar pasta + calabacín + pollo desmechado.\n4. Añadir 1 cdita de aceite al final y servir tibio (sin salsa de tomate).",
    prompt: "Plain noodles with shredded chicken and zucchini, simple mild meal bowl"
  },
  {
    day: "Domingo (Semana 4)",
    meal: "Cena",
    title: "Sopa de Sémola con Calabacín",
    image: "images/4domingo3.png",
    recipe:
      "Ingredientes: 500ml de caldo desgrasado, 30g de sémola de trigo, 120g de calabacín pelado.\n1. Hervir el calabacín en cubitos en el caldo 8-10 min.\n2. Añadir la sémola en lluvia, removiendo.\n3. Cocinar 3-4 min hasta que espese levemente.\n4. Servir tibia; evitar condimentos fuertes.",
    prompt: "Semolina soup with zucchini pieces, warm soothing bowl"
  },
    {
      day: "Lunes (Semana 5)",
      meal: "Desayuno",
      title: "Avena Cremosa con Pera Cocida",
      image: "images/5lunes1.png",
      recipe:
        "Ingredientes: 40g de copos de avena, 250ml de agua o leche de almendras, 1 pera madura (170g), 1 pizca de canela (opcional).\n1. Pelar la pera, retirar el centro y cortar en cubos pequeños.\n2. Cocer la pera con 60ml del líquido 6-8 minutos a fuego bajo hasta ablandar.\n3. Añadir el resto del líquido (hasta completar 250ml) y la avena; cocinar 5-7 minutos removiendo suave.\n4. Servir tibia (no muy caliente). Nota: si usas leche, puede ser sin lactosa si se necesita.",
      prompt: "Creamy oatmeal with stewed pear cubes in a simple bowl"
    },
    {
      day: "Lunes (Semana 5)",
      meal: "Almuerzo",
      title: "Sopa de Estrellitas con Merluza",
      image: "images/5lunes2.png",
      recipe:
        "Ingredientes: 35g de pasta tipo estrellitas, 550ml de caldo de verduras desgrasado, 150g de merluza, 60g de zanahoria, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir el caldo y añadir la zanahoria en cubitos; cocinar 6-8 minutos.\n2. Agregar la pasta y cocer 6-8 minutos (hasta muy suave).\n3. Incorporar la merluza en trozos y cocinar 6-7 minutos a hervor suave.\n4. Servir tibia y añadir el aceite al final (sin pimienta ni limón).",
      prompt: "Mild noodle star soup with flaky white fish and carrots"
    },
    {
      day: "Lunes (Semana 5)",
      meal: "Cena",
      title: "Puré de Calabaza y Papa con Huevo",
      image: "images/5lunes3.png",
      recipe:
        "Ingredientes: 250g de calabaza, 150g de patata, 450ml de agua, 1 huevo (60g), 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir calabaza y patata en cubos 18-20 minutos hasta ablandar.\n2. Triturar con parte del agua de cocción hasta lograr un puré fino.\n3. Volver el puré a fuego bajo y añadir el huevo batido en hilo, removiendo 1-2 minutos hasta cuajar (sin hervir fuerte).\n4. Servir tibia y agregar el aceite al final.",
      prompt: "Smooth pumpkin and potato puree with soft egg threads, warm bowl"
    },
  
    {
      day: "Martes (Semana 5)",
      meal: "Desayuno",
      title: "Tostada Tibia con Ricotta y Compota de Pera",
      image: "images/5martes1.png",
      recipe:
        "Ingredientes: 2 rebanadas de pan blanco (60g), 120g de ricotta/requesón bajo en grasa, 1 pera madura (170g), 80ml de agua.\n1. Cocinar la pera en cubos con 80ml de agua 10-12 minutos y aplastar hasta compota.\n2. Tostar el pan muy ligeramente (solo para entibiar, sin dorar fuerte).\n3. Untar la ricotta y colocar encima 3-4 cucharadas de compota.\n4. Consumir tibio/temperatura ambiente. Nota: si hay intolerancia a la lactosa, usar ricotta/requesón sin lactosa.",
      prompt: "Warm white toast with ricotta and pear compote, minimal style"
    },
    {
      day: "Martes (Semana 5)",
      meal: "Almuerzo",
      title: "Pavo Cocido con Patata y Zanahoria",
      image: "images/5martes2.png",
      recipe:
        "Ingredientes: 160g de pechuga de pavo, 220g de patata, 80g de zanahoria, 750ml de agua, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Cortar el pavo en cubos medianos y hervir a fuego suave 10 minutos (retirar espuma si aparece).\n2. Añadir la patata en cubos y cocinar 12 minutos.\n3. Agregar la zanahoria en cubitos y cocinar 8-10 minutos más (todo muy tierno).\n4. Servir tibio con poco caldo y añadir el aceite al final (sin salsas).",
      prompt: "Mild boiled turkey with tender potatoes and carrots, simple plating"
    },
    {
      day: "Martes (Semana 5)",
      meal: "Cena",
      title: "Sopa de Cabellín con Pavo y Calabacín",
      image: "images/5martes3.png",
      recipe:
        "Ingredientes: 30g de fideo cabellín, 500ml de caldo desgrasado, 120g de pavo cocido desmechado, 150g de calabacín pelado, sal mínima.\n1. Hervir el calabacín en cubitos dentro del caldo 8-10 minutos.\n2. Añadir el cabellín y cocinar 3-4 minutos (hasta suave).\n3. Incorporar el pavo desmechado 1-2 minutos para calentar sin resecar.\n4. Servir tibia (evitar pimienta, vinagre y limón).",
      prompt: "Thin noodle soup with zucchini and shredded turkey, comforting bowl"
    },
  
    {
      day: "Miércoles (Semana 5)",
      meal: "Desayuno",
      title: "Yogur con Compota de Durazno",
      image: "images/5miercoles1.png",
      recipe:
        "Ingredientes: 200g de yogur natural (bajo en grasa), 1 durazno/melocotón maduro (180g), 60ml de agua.\n1. Pelar el durazno, retirar hueso y cortar en cubos.\n2. Cocinar con 60ml de agua 6-8 minutos hasta ablandar; aplastar para compota.\n3. Dejar entibiar la compota 5 minutos.\n4. Servir el yogur a temperatura ambiente con la compota encima. Nota: usar yogur sin lactosa si se necesita.",
      prompt: "Natural yogurt topped with warm peach compote in a small bowl"
    },
    {
      day: "Miércoles (Semana 5)",
      meal: "Almuerzo",
      title: "Papillote de Pavo con Calabaza y Patata",
      image: "images/5miercoles2.png",
      recipe:
        "Ingredientes: 170g de pechuga de pavo, 200g de calabaza, 200g de patata, 30ml de agua, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir la patata en cubos 10-12 minutos y escurrir.\n2. Colocar pavo + calabaza en láminas en papel para horno, añadir 30ml de agua y cerrar el papillote.\n3. Hornear a 180°C por 15-18 minutos (sin dorar en exceso).\n4. Servir tibio con la patata y añadir el aceite al final.",
      prompt: "Turkey breast baked in parchment with pumpkin, served with tender potatoes"
    },
    {
      day: "Miércoles (Semana 5)",
      meal: "Cena",
      title: "Sopa de Arroz con Calabaza y Pescado",
      image: "images/5miercoles3.png",
      recipe:
        "Ingredientes: 40g de arroz blanco, 200g de calabaza, 130g de pescado blanco, 650ml de caldo desgrasado, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir la calabaza en cubos dentro del caldo 10 minutos.\n2. Añadir el arroz lavado y cocinar 18-20 minutos a fuego bajo.\n3. Incorporar el pescado en trozos y cocinar 6-8 minutos (sin hervor fuerte).\n4. Servir tibia y añadir el aceite al final (sin tomate ni cítricos).",
      prompt: "Gentle rice and pumpkin soup with flaky white fish, warm bowl"
    },
  
    {
      day: "Jueves (Semana 5)",
      meal: "Desayuno",
      title: "Batido Suave de Papaya y Yogur",
      image: "images/generica.png",
      recipe:
        "Ingredientes: 200g de papaya madura, 200g de yogur natural (bajo en grasa), 100ml de agua, 10g de avena fina (opcional).\n1. Cortar la papaya en cubos y retirar semillas.\n2. Licuar papaya + yogur + agua (y avena si se usa) hasta textura muy lisa.\n3. Dejar reposar 3-5 minutos para quitar espuma.\n4. Tomar a temperatura ambiente (no muy frío). Nota: usar yogur sin lactosa si se necesita.",
      prompt: "Smooth papaya yogurt shake in a glass, soft light, minimal background"
    },
    {
      day: "Jueves (Semana 5)",
      meal: "Almuerzo",
      title: "Pescado Blanco al Vapor con Puré de Camote",
      image: "images/generica.png",
      recipe:
        "Ingredientes: 170g de pescado blanco, 260g de camote/batata, 30ml de leche desnatada (opcional) o 30ml de agua de cocción, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir el camote 18-20 minutos; chafar con leche o agua hasta puré suave.\n2. Cocinar el pescado al vapor 8-10 minutos.\n3. Servir el puré tibio y colocar el pescado encima (desmenuzado si se prefiere).\n4. Añadir el aceite al final y evitar condimentos fuertes.",
      prompt: "Steamed white fish served over smooth sweet potato mash, simple plate"
    },
    {
      day: "Jueves (Semana 5)",
      meal: "Cena",
      title: "Sopa de Conchitas con Pollo y Zanahoria",
      image: "images/generica.png",
      recipe:
        "Ingredientes: 35g de pasta tipo conchitas, 500ml de caldo desgrasado, 120g de pollo cocido desmechado, 70g de zanahoria, sal mínima.\n1. Hervir la zanahoria en cubitos dentro del caldo 6-8 minutos.\n2. Añadir las conchitas y cocinar 8-10 minutos (muy suaves).\n3. Incorporar el pollo desmechado 1-2 minutos.\n4. Servir tibia para mejor tolerancia.",
      prompt: "Small shell pasta soup with shredded chicken and carrots, comforting bowl"
    },
  
    {
      day: "Viernes (Semana 5)",
      meal: "Desayuno",
      title: "Yogur Natural con Banano y Avena",
      image: "images/5viernes1.png",
      recipe:
        "Ingredientes: 200g de yogur natural (bajo en grasa), 1/2 banano/plátano maduro (70g), 30g de copos de avena.\n1. Dejar el yogur 10 minutos a temperatura ambiente.\n2. Cortar el banano en rodajas finas.\n3. Mezclar yogur + avena y dejar 2 minutos para que se ablande.\n4. Añadir el banano y consumir (sin cacao ni cítricos). Nota: usar yogur sin lactosa si se necesita.",
      prompt: "Yogurt bowl with banana slices and oats, soft natural lighting"
    },
    {
      day: "Viernes (Semana 5)",
      meal: "Almuerzo",
      title: "Filete de Pescado a la Plancha Suave con Puré de Chayote",
      image: "images/5viernes2.png",
      recipe:
        "Ingredientes: 170g de pescado blanco, 320g de chayote pelado, 5ml (1 cdita) de aceite de oliva, 450ml de agua, sal mínima.\n1. Hervir el chayote en cubos 18-20 minutos y triturar hasta puré fino.\n2. Calentar sartén antiadherente y cocinar el pescado a fuego medio-bajo 3-4 minutos por lado (sin dorar fuerte).\n3. Servir el puré tibio y colocar el pescado encima.\n4. Añadir el aceite al final (sin ajo/cebolla ni pimienta).",
      prompt: "Soft grilled white fish with smooth chayote puree, minimalist plate"
    },
    {
      day: "Viernes (Semana 5)",
      meal: "Cena",
      title: "Crema Mixta de Calabaza y Calabacín con Pollo",
      image: "images/5viernes3.png",
      recipe:
        "Ingredientes: 200g de calabaza, 200g de calabacín pelado, 100g de patata, 120g de pollo cocido, 550ml de agua o caldo desgrasado, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir calabaza + calabacín + patata 18-20 minutos.\n2. Añadir el pollo cocido en trozos.\n3. Triturar todo hasta crema lisa y ajustar con líquido si hace falta.\n4. Servir tibia y añadir el aceite al final.",
      prompt: "Smooth pumpkin-zucchini cream soup with chicken, warm bowl, gentle steam"
    },
  
    {
      day: "Sábado (Semana 5)",
      meal: "Desayuno",
      title: "Panqueques Suaves de Harina Blanca",
      image: "images/5sabado1.png",
      recipe:
        "Ingredientes: 60g de harina de trigo blanca, 1 huevo (60g), 150ml de leche desnatada (o sin lactosa), 5ml (1 cdita) de aceite de oliva.\n1. Batir harina + huevo + leche hasta mezcla lisa (sin grumos).\n2. Calentar sartén antiadherente a fuego bajo y engrasar con el aceite.\n3. Cocinar panqueques 1-2 minutos por lado (solo dorado leve, sin tostado).\n4. Servir tibios, sin miel en exceso y sin frutas ácidas. Nota: usar leche sin lactosa si se necesita.",
      prompt: "Soft plain pancakes on a plate, lightly golden, minimal styling"
    },
    {
      day: "Sábado (Semana 5)",
      meal: "Almuerzo",
      title: "Pasta Corta con Pollo y Zanahoria",
      image: "images/5sabado2.png",
      recipe:
        "Ingredientes: 70g de pasta blanca corta (seca), 150g de pollo sin piel, 80g de zanahoria, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Cocer la zanahoria en cubitos 8-10 minutos y escurrir.\n2. Cocer la pasta 8-10 minutos (muy suave) y escurrir.\n3. Cocinar el pollo a la plancha suave 3-4 minutos por lado (sin costra) y cortar en tiras.\n4. Mezclar pasta + zanahoria + pollo, añadir el aceite al final y servir tibio (sin salsa de tomate).",
      prompt: "Plain short pasta with tender chicken strips and soft carrots, simple bowl"
    },
    {
      day: "Sábado (Semana 5)",
      meal: "Cena",
      title: "Puré de Camote con Queso Fresco",
      image: "images/5sabado3.png",
      recipe:
        "Ingredientes: 260g de camote/batata, 120g de queso fresco tipo Burgos, 30ml de agua de cocción (si hace falta), 5ml (1 cdita) de aceite de oliva.\n1. Hervir el camote 18-20 minutos y chafar hasta puré (ajustar con 30ml de agua de cocción si se necesita).\n2. Cortar el queso fresco en cubitos.\n3. Mezclar el queso con el puré tibio para que se ablande.\n4. Añadir el aceite al final y servir tibio. Nota: si no toleras lácteos, sustituir el queso por 1 huevo cocido picado (60g).",
      prompt: "Sweet potato mash with soft fresh cheese cubes, warm bowl"
    },
  
    {
      day: "Domingo (Semana 5)",
      meal: "Desayuno",
      title: "Pudín de Tapioca con Leche",
      image: "images/5domingo1.png",
      recipe:
        "Ingredientes: 30g de perlas de tapioca, 250ml de leche desnatada (o sin lactosa), 150ml de agua, 1 huevo (60g), 1 pizca de vainilla (opcional).\n1. Cocer la tapioca en agua 12-15 minutos a fuego bajo hasta que esté translúcida.\n2. Añadir la leche y cocinar 5 minutos removiendo suave.\n3. Batir el huevo aparte y añadirlo en hilo, removiendo 1 minuto hasta espesar (sin hervir fuerte).\n4. Servir tibio/templado. Nota: usar leche sin lactosa si se necesita.",
      prompt: "Warm tapioca pudding in a small bowl, smooth and comforting"
    },
    {
      day: "Domingo (Semana 5)",
      meal: "Almuerzo",
      title: "Arroz Caldoso de Merluza y Calabacín",
      image: "images/5domingo2.png",
      recipe:
        "Ingredientes: 60g de arroz blanco, 160g de merluza, 150g de calabacín pelado, 800ml de caldo desgrasado, 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir el arroz en el caldo 15 minutos a fuego bajo.\n2. Añadir el calabacín en cubitos y cocinar 8 minutos.\n3. Incorporar la merluza en trozos y cocinar 6-7 minutos a hervor suave.\n4. Servir tibio y añadir el aceite al final (sin picantes ni cítricos).",
      prompt: "Soupy rice with zucchini and flaky hake, warm comforting bowl"
    },
    {
      day: "Domingo (Semana 5)",
      meal: "Cena",
      title: "Crema de Chayote y Calabaza con Huevo",
      image: "images/5domingo3.png",
      recipe:
        "Ingredientes: 200g de chayote pelado, 200g de calabaza, 100g de patata, 500ml de agua o caldo desgrasado, 1 huevo (60g), 5ml (1 cdita) de aceite de oliva, sal mínima.\n1. Hervir chayote + calabaza + patata 18-20 minutos hasta muy tiernos.\n2. Triturar hasta crema fina y volver a fuego bajo.\n3. Añadir el huevo batido en hilo, removiendo 1-2 minutos hasta cuajar suave.\n4. Servir tibia y añadir el aceite al final.",
      prompt: "Smooth chayote and pumpkin cream soup with soft egg ribbons, warm bowl"
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