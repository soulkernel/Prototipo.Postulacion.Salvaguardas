import os
import json

# Read base64 logos
with open('scratch_logos.json', 'r') as f:
    logos = json.load(f)

logo_src = logos['logo']
logo_white_src = logos['logo_white']

artifact_dir = r"C:\Users\SCHUBERT\.gemini\antigravity\brain\450526dd-a940-4282-8b59-28085ff29b2d"
target_html_path = os.path.join(artifact_dir, "glf_portal_prototype.html")

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Galapagos Life Fund - Portal Bilingüe de Convocatorias, Nota Conceptual y Salvaguardas</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {{
      --glf-navy: #0A2540;
      --glf-teal: #009688;
      --glf-teal-dark: #00796B;
      --glf-sand: #F8FAFC;
    }}
    body {{
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: var(--background, #F8FAFC);
      color: var(--foreground, #0F172A);
    }}
    .badge-bajo {{ background-color: #DEF7EC; color: #03543F; border: 1px solid #84E1BC; }}
    .badge-medio {{ background-color: #FEF08A; color: #713F12; border: 1px solid #FDE047; }}
    .badge-alto {{ background-color: #FDE8E8; color: #9B1C1C; border: 1px solid #F8B4B4; }}
    .badge-muy-alto {{ background-color: #771D1D; color: #FFFFFF; border: 1px solid #9B1C1C; }}
    .tab-active {{
      border-bottom: 3px solid #009688;
      color: #009688;
      font-weight: 600;
    }}
    @media print {{
      .no-print {{ display: none !important; }}
      .print-only {{ display: block !important; }}
    }}
    .custom-scrollbar::-webkit-scrollbar {{
      width: 6px;
      height: 6px;
    }}
    .custom-scrollbar::-webkit-scrollbar-thumb {{
      background: #CBD5E1;
      border-radius: 4px;
    }}
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

  <!-- ================= TOP ROLE & LANGUAGE TEST BAR ================= -->
  <header class="no-print bg-slate-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between border-b border-slate-700 shadow-md sticky top-0 z-50">
    <div class="flex items-center space-x-3">
      <span class="inline-flex items-center px-2 py-0.5 rounded bg-emerald-800 text-emerald-100 font-medium">
        <i class="fa-solid fa-flask mr-1.5"></i><span data-i18n="demo_tag">PROTOTIPO VISUAL INTERACTIVO GLF</span>
      </span>
      <span class="hidden md:inline text-slate-400">|</span>
      <div class="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
        <button id="btn-mod-applicant" onclick="switchModule('applicant')" class="px-3 py-1 rounded-md text-xs font-semibold transition bg-teal-600 text-white flex items-center">
          <i class="fa-solid fa-user mr-1.5"></i>
          <span data-i18n="mod_applicant">Módulo 1: Portal Postulantes</span>
        </button>
        <button id="btn-mod-admin" onclick="switchModule('admin')" class="px-3 py-1 rounded-md text-xs font-semibold transition text-slate-300 hover:text-white flex items-center">
          <i class="fa-solid fa-shield-halved mr-1.5"></i>
          <span data-i18n="mod_admin">Módulo 2: Panel Personal GLF</span>
        </button>
      </div>
    </div>

    <div class="flex items-center space-x-3 mt-2 sm:mt-0">
      <!-- Quick View Navigation inside current module -->
      <select id="quick-view-select" onchange="navigateToView(this.value)" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-teal-500">
      </select>

      <!-- Language Selector -->
      <div class="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
        <button onclick="setLanguage('es')" id="btn-lang-es" class="px-2 py-0.5 rounded text-xs font-medium bg-teal-600 text-white">ES</button>
        <button onclick="setLanguage('en')" id="btn-lang-en" class="px-2 py-0.5 rounded text-xs font-medium text-slate-400 hover:text-white">EN</button>
      </div>

      <button onclick="resetDemoData()" title="Restablecer datos de prueba" class="text-slate-400 hover:text-slate-200 px-2 py-1">
        <i class="fa-solid fa-rotate-right"></i>
      </button>
    </div>
  </header>

  <!-- ================= GLF BRANDING HEADER ================= -->
  <div class="no-print bg-white border-b border-slate-200 py-3 px-6 shadow-sm flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <img src="{logo_src}" alt="Galapagos Life Fund Logo" class="h-12 w-auto object-contain">
      <div class="border-l border-slate-300 pl-4 hidden sm:block">
        <h1 class="text-slate-900 font-bold text-base leading-tight">Galapagos Life Fund (GLF)</h1>
        <p class="text-slate-500 text-xs" id="subbrand-text" data-i18n="header_subtitle">Sistema de Convocatorias, Notas Conceptuales y Salvaguardas Ambientales y Sociales</p>
      </div>
    </div>

    <div id="user-header-info" class="flex items-center space-x-3 text-xs text-slate-600">
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
      <span id="active-user-label" class="font-medium">Aplicante: Fundación Conservación Galápagos (RUC: 2090012345001)</span>
      <a href="javascript:void(0)" onclick="navigateToView('applicant-account')" class="text-teal-700 hover:underline"><i class="fa-solid fa-gear ml-1"></i></a>
    </div>
  </div>

  <!-- ================= MAIN CONTENT CONTAINER ================= -->
  <main id="main-content" class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

    <!-- NOTIFICATION ALERT BANNER (Dynamic) -->
    <div id="alert-banner" class="hidden rounded-xl p-4 border text-sm flex items-start justify-between shadow-sm">
      <div class="flex items-start space-x-3">
        <i id="alert-icon" class="fa-solid fa-circle-info mt-0.5 text-lg"></i>
        <div>
          <h4 id="alert-title" class="font-semibold text-base"></h4>
          <p id="alert-message" class="mt-0.5"></p>
        </div>
      </div>
      <button onclick="hideAlert()" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
    </div>

    <!-- =================================================================== -->
    <!-- MODULE 1 VIEWS (PORTAL APPLICANTE)                                 -->
    <!-- =================================================================== -->

    <!-- VIEW 1: PUBLIC CALL LANDING -->
    <div id="view-applicant-public-call" class="view-panel space-y-6">
      <div class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
        <div class="absolute right-0 top-0 opacity-10 pointer-events-none p-6">
          <i class="fa-solid fa-water-lower text-9xl"></i>
        </div>
        <div class="max-w-3xl space-y-4">
          <div class="inline-flex items-center px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-semibold">
            <i class="fa-solid fa-bullhorn mr-2"></i> <span data-i18n="call_status_open">CONVOCATORIA ABIERTA 2026-I</span>
          </div>
          <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight" data-i18n="call_title">Conservación Marina, Resiliencia Costera y Adaptación al Cambio Climático en Galápagos</h2>
          <p class="text-slate-300 text-sm md:text-base leading-relaxed" data-i18n="call_desc">
            El Galapagos Life Fund convoca a personas naturales, organizaciones sin fines de lucro, instituciones académicas y comunitarias a presentar Notas Conceptuales para financiar proyectos enfocados en la preservación de la biodiversidad marina y el desarrollo sostenible del archipiélago.
          </p>
          <div class="flex flex-wrap gap-4 pt-2 text-xs md:text-sm">
            <div class="bg-white/10 px-4 py-2 rounded-lg backdrop-blur">
              <span class="text-slate-300 block" data-i18n="call_opening">Apertura:</span>
              <strong class="text-white">01 de Septiembre, 2026</strong>
            </div>
            <div class="bg-white/10 px-4 py-2 rounded-lg backdrop-blur">
              <span class="text-slate-300 block" data-i18n="call_closing">Cierre de Convocatoria:</span>
              <strong class="text-amber-300">15 de Noviembre, 2026 - 23:59 ECT</strong>
            </div>
            <div class="bg-white/10 px-4 py-2 rounded-lg backdrop-blur">
              <span class="text-slate-300 block" data-i18n="call_pool">Fondo Total Disponible:</span>
              <strong class="text-emerald-300">USD $1,500,000</strong>
            </div>
          </div>
          <div class="pt-4 flex flex-wrap gap-3">
            <button onclick="navigateToView('applicant-create')" class="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg transition flex items-center">
              <i class="fa-solid fa-paper-plane mr-2"></i> <span data-i18n="btn_start_application">Iniciar Postulación en Línea</span>
            </button>
            <button onclick="downloadMockPDF('Bases_Convocatoria_GLF_2026.pdf')" class="bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-3 rounded-xl border border-slate-700 transition flex items-center">
              <i class="fa-solid fa-file-pdf mr-2 text-red-400"></i> <span data-i18n="btn_download_bases">Descargar Bases y Guía Formato (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- GRANT CATEGORIES (CONFIGURABLE) -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-slate-900" data-i18n="categories_title">Categorías de Subvención Habilitadas</h3>
        <p class="text-xs text-slate-500" data-i18n="categories_note">* Parámetros configurados por la administración GLF para la convocatoria activa actual.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Small Grant -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-4">
                <i class="fa-solid fa-seedling text-lg"></i>
              </div>
              <h4 class="text-lg font-bold text-slate-900" data-i18n="cat_small_name">Pequeña Subvención</h4>
              <p class="text-teal-700 font-extrabold text-2xl my-2">Hasta USD $100,000</p>
              <ul class="text-xs text-slate-600 space-y-2 mt-4">
                <li class="flex items-center"><i class="fa-solid fa-clock text-teal-600 mr-2"></i> <span data-i18n="cat_small_duration">Duración máxima: hasta 12 meses</span></li>
                <li class="flex items-center"><i class="fa-solid fa-hand-holding-dollar text-teal-600 mr-2"></i> <span data-i18n="cat_small_cofin">Cofinanciación: No obligatoria (Recomendada en especie)</span></li>
                <li class="flex items-center"><i class="fa-solid fa-user-group text-teal-600 mr-2"></i> <span data-i18n="cat_small_applicants">Dirigido a: Personas Naturales y Organizaciones locales</span></li>
              </ul>
            </div>
            <button onclick="selectCategoryAndStart('Pequeña Subvención')" class="mt-6 w-full py-2.5 bg-slate-100 hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl font-semibold text-xs transition">
              <span data-i18n="btn_apply_small">Postular a Pequeña Subvención</span> &rarr;
            </button>
          </div>

          <!-- Medium Grant -->
          <div class="bg-white rounded-2xl p-6 border-2 border-teal-500 shadow-sm hover:shadow-md transition relative flex flex-col justify-between">
            <span class="absolute -top-3 right-4 bg-teal-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow" data-i18n="badge_popular">Más Solicitada</span>
            <div>
              <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold mb-4">
                <i class="fa-solid fa-tree text-lg"></i>
              </div>
              <h4 class="text-lg font-bold text-slate-900" data-i18n="cat_medium_name">Mediana Subvención</h4>
              <p class="text-teal-700 font-extrabold text-2xl my-2">Hasta USD $250,000</p>
              <ul class="text-xs text-slate-600 space-y-2 mt-4">
                <li class="flex items-center"><i class="fa-solid fa-clock text-teal-600 mr-2"></i> <span data-i18n="cat_medium_duration">Duración máxima: hasta 24 meses</span></li>
                <li class="flex items-center"><i class="fa-solid fa-hand-holding-dollar text-teal-600 mr-2"></i> <span data-i18n="cat_medium_cofin">Cofinanciación exigida: Mínimo 10% (efectivo o especie)</span></li>
                <li class="flex items-center"><i class="fa-solid fa-building text-teal-600 mr-2"></i> <span data-i18n="cat_medium_applicants">Dirigido a: Organizaciones e Instituciones registradas</span></li>
              </ul>
            </div>
            <button onclick="selectCategoryAndStart('Mediana Subvención')" class="mt-6 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition shadow">
              <span data-i18n="btn_apply_medium">Postular a Mediana Subvención</span> &rarr;
            </button>
          </div>

          <!-- Large Grant -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold mb-4">
                <i class="fa-solid fa-earth-americas text-lg"></i>
              </div>
              <h4 class="text-lg font-bold text-slate-900" data-i18n="cat_large_name">Gran Subvención</h4>
              <p class="text-teal-700 font-extrabold text-2xl my-2">Desde USD $250,000+</p>
              <ul class="text-xs text-slate-600 space-y-2 mt-4">
                <li class="flex items-center"><i class="fa-solid fa-clock text-teal-600 mr-2"></i> <span data-i18n="cat_large_duration">Duración máxima: hasta 36 meses</span></li>
                <li class="flex items-center"><i class="fa-solid fa-hand-holding-dollar text-teal-600 mr-2"></i> <span data-i18n="cat_large_cofin">Cofinanciación exigida: Mínimo 25% del total</span></li>
                <li class="flex items-center"><i class="fa-solid fa-diagram-project text-teal-600 mr-2"></i> <span data-i18n="cat_large_applicants">Dirigido a: Consorcios y Alianzas institucionales</span></li>
              </ul>
            </div>
            <button onclick="selectCategoryAndStart('Gran Subvención')" class="mt-6 w-full py-2.5 bg-slate-100 hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl font-semibold text-xs transition">
              <span data-i18n="btn_apply_large">Postular a Gran Subvención</span> &rarr;
            </button>
          </div>
        </div>
      </div>

      <!-- FAQ & ELIGIBILITY SECTION -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 class="text-lg font-bold text-slate-900" data-i18n="faq_title">Requisitos Generales y Preguntas Frecuentes</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h5 class="font-bold text-slate-900 mb-1"><i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> ¿Quiénes pueden postular?</h5>
            <p>Personas naturales ecuatorianas o extranjeras con residencia legal, así como organizaciones jurídicas sin fines de lucro localizadas o con presencia operativa en Galápagos.</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h5 class="font-bold text-slate-900 mb-1"><i class="fa-solid fa-shield-virus text-amber-600 mr-1.5"></i> Salvaguardas en Formulario Web Interactivo</h5>
            <p>Todas las propuestas completan directamente en la plataforma web la matriz de evaluación de salvaguardas (Matriz de Ulf) eliminando la necesidad de archivos Excel externos.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: AUTH / REGISTRATION -->
    <div id="view-applicant-auth" class="view-panel max-w-md mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-lg space-y-6">
      <div class="text-center space-y-2">
        <img src="{logo_src}" alt="GLF" class="h-10 mx-auto object-contain">
        <h3 class="text-xl font-bold text-slate-900" data-i18n="auth_title">Acceso al Portal de Postulaciones</h3>
        <p class="text-xs text-slate-500" data-i18n="auth_subtitle">Inicie sesión o registre su cuenta para gestionar sus notas conceptuales</p>
      </div>

      <div class="flex border-b border-slate-200">
        <button id="tab-login" onclick="toggleAuthTab('login')" class="flex-1 py-2 text-center font-semibold text-xs tab-active" data-i18n="tab_login">Iniciar Sesión</button>
        <button id="tab-register" onclick="toggleAuthTab('register')" class="flex-1 py-2 text-center font-semibold text-xs text-slate-500 hover:text-slate-800" data-i18n="tab_register">Crear Cuenta</button>
      </div>

      <!-- Login Form -->
      <form id="form-login" onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1" data-i18n="lbl_email">Correo Electrónico</label>
          <input type="email" required value="postulante@fundaciongalapagos.org" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1" data-i18n="lbl_password">Contraseña</label>
          <input type="password" required value="••••••••••••" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none">
        </div>
        <div class="flex items-center justify-between text-xs">
          <label class="flex items-center text-slate-600">
            <input type="checkbox" checked class="rounded border-slate-300 text-teal-600 mr-2"> Recordarme
          </label>
          <a href="javascript:void(0)" onclick="alert('Enlace de recuperación enviado al correo (Simulación)')" class="text-teal-700 hover:underline">¿Olvidó su contraseña?</a>
        </div>
        <button type="submit" class="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow transition">
          <span data-i18n="btn_login">Ingresar al Portal</span>
        </button>
      </form>

      <!-- Register Form -->
      <form id="form-register" onsubmit="handleRegister(event)" class="space-y-4 hidden">
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1" data-i18n="lbl_applicant_type">Tipo de Aplicante</label>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <label class="flex items-center p-2 border border-teal-500 bg-teal-50 rounded-lg cursor-pointer">
              <input type="radio" name="reg_type" value="juridica" checked class="text-teal-600 mr-2"> Persona Jurídica / Org.
            </label>
            <label class="flex items-center p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input type="radio" name="reg_type" value="natural" class="text-teal-600 mr-2"> Persona Natural
            </label>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Nombre Completo o Razón Social</label>
          <input type="text" required placeholder="Ej. Fundación Conservación Galápagos" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico Institucional</label>
          <input type="email" required placeholder="correo@organizacion.org" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Contraseña Segura</label>
          <input type="password" required placeholder="Mínimo 8 caracteres" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
        <div class="text-[11px] text-slate-500 flex items-start">
          <input type="checkbox" required class="mt-0.5 mr-2 rounded border-slate-300 text-teal-600">
          <span>Acepto la Política de Privacidad y el tratamiento de datos para postulaciones GLF.</span>
        </div>
        <button type="submit" class="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow transition">
          <span data-i18n="btn_register">Crear Cuenta y Verificar Correo</span>
        </button>
      </form>
    </div>

    <!-- VIEW 3: APPLICANT DASHBOARD -->
    <div id="view-applicant-dashboard" class="view-panel space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-slate-900" data-i18n="dash_welcome">Mi Panel de Expedientes</h2>
          <p class="text-xs text-slate-500" data-i18n="dash_sub">Gestione sus borradores, postulaciones enviadas y solicitudes de observación</p>
        </div>
        <button onclick="navigateToView('applicant-create')" class="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition flex items-center text-xs">
          <i class="fa-solid fa-plus mr-2"></i> <span data-i18n="btn_new_expediente">Nueva Nota Conceptual</span>
        </button>
      </div>

      <!-- METRICS METERS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Convocatoria Activa</span>
          <strong class="text-lg font-bold text-slate-900">2026-I (Abierta)</strong>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Borradores en Preparación</span>
          <strong class="text-lg font-bold text-amber-600">1 Borrador</strong>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Solicitudes Enviadas</span>
          <strong class="text-lg font-bold text-emerald-600">1 Enviada (Bloqueada)</strong>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Observaciones GLF</span>
          <strong class="text-lg font-bold text-indigo-600">1 Ventana Autorizada</strong>
        </div>
      </div>

      <!-- EXPEDIENTES TABLE -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <h3 class="font-bold text-slate-900" data-i18n="tbl_expedientes_title">Historial de Mis Expedientes</h3>
          <span class="text-slate-500">Mostrando 2 expediente(s) de demostración</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3">Código ID</th>
                <th class="p-3">Título de la Propuesta</th>
                <th class="p-3">Categoría</th>
                <th class="p-3">Monto Solic.</th>
                <th class="p-3">Estado del Expediente</th>
                <th class="p-3">Última Modif.</th>
                <th class="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody id="applicant-expedientes-tbody" class="divide-y divide-slate-200">
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- VIEW 4: CREATE APPLICATION & ELIGIBILITY CHECK -->
    <div id="view-applicant-create" class="view-panel max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
      <div class="border-b border-slate-200 pb-4">
        <span class="text-xs text-teal-700 font-bold uppercase tracking-wider">Paso 1 de 2: Selección y Elegibilidad</span>
        <h2 class="text-xl font-bold text-slate-900">Crear Nuevo Expediente de Postulación</h2>
        <p class="text-xs text-slate-500">Seleccione la convocatoria y categoría correspondiente a su propuesta.</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Convocatoria Activa</label>
          <select id="create-call-select" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium">
            <option value="2026-I">Convocatoria 2026-I: Conservación Marina y Adaptación al Cambio Climático</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Categoría de Subvención</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label class="p-4 border rounded-xl cursor-pointer hover:border-teal-500 flex flex-col justify-between" id="opt-cat-small">
              <div>
                <input type="radio" name="new_exp_cat" value="Pequeña Subvención" onchange="updateEligibilityNotice(this.value)" checked class="text-teal-600">
                <span class="font-bold text-xs text-slate-900 block mt-1">Pequeña Subvención</span>
                <span class="text-[11px] text-slate-500">Hasta $100,000 | 12 meses</span>
              </div>
            </label>
            <label class="p-4 border border-teal-500 bg-teal-50/50 rounded-xl cursor-pointer flex flex-col justify-between" id="opt-cat-med">
              <div>
                <input type="radio" name="new_exp_cat" value="Mediana Subvención" onchange="updateEligibilityNotice(this.value)" class="text-teal-600">
                <span class="font-bold text-xs text-slate-900 block mt-1">Mediana Subvención</span>
                <span class="text-[11px] text-slate-500">Hasta $250,000 | 24 meses | 10% Cofin.</span>
              </div>
            </label>
            <label class="p-4 border rounded-xl cursor-pointer hover:border-teal-500 flex flex-col justify-between" id="opt-cat-large">
              <div>
                <input type="radio" name="new_exp_cat" value="Gran Subvención" onchange="updateEligibilityNotice(this.value)" class="text-teal-600">
                <span class="font-bold text-xs text-slate-900 block mt-1">Gran Subvención</span>
                <span class="text-[11px] text-slate-500">> $250,000 | 36 meses | 25% Cofin.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- PRELIMINARY ELIGIBILITY BOX -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
          <div class="flex items-center space-x-2 font-bold">
            <i class="fa-solid fa-clipboard-check text-amber-600"></i>
            <span>Verificación Preliminar de Elegibilidad</span>
          </div>
          <p id="eligibility-text">
            Ha seleccionado <strong>Mediana Subvención</strong>. Esta categoría requiere un cofinanciamiento mínimo del 10% (efectivo o especie) y no puede superar los 24 meses de ejecución.
          </p>
          <div class="text-[11px] text-amber-700 italic border-t border-amber-200/60 pt-2">
            Nota informativa: La verificación preliminar no garantiza la aprobación ni sustituye la evaluación del Comité Técnico GLF.
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Título Preliminar de la Propuesta</label>
          <input type="text" id="new-exp-title" value="Restauración de Ecosistemas de Manglar y Monitoreo Participativo de Tortugas Marinas en San Cristóbal" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs">
        </div>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-slate-200">
        <button onclick="navigateToView('applicant-dashboard')" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
          Cancelar
        </button>
        <button onclick="startNewExpedienteDraft()" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow transition">
          Confirmar y Comenzar Nota Conceptual &rarr;
        </button>
      </div>
    </div>

    <!-- VIEW 5: APPLICANT DATA -->
    <div id="view-applicant-info" class="view-panel max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
      <div class="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <span class="text-xs text-teal-700 font-bold uppercase tracking-wider">Información del Proponente</span>
          <h2 class="text-xl font-bold text-slate-900">Datos Generales e Identificación</h2>
        </div>
        <span class="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600">ID: GLF-2026-EXP-0842</span>
      </div>

      <form id="form-applicant-info" class="space-y-6 text-xs">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Tipo de Solicitante</label>
            <select class="w-full p-2 border border-slate-300 rounded-lg bg-slate-50">
              <option value="juridica" selected>Organización / Persona Jurídica</option>
              <option value="natural">Persona Natural</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nombre / Razón Social del Solicitante *</label>
            <input type="text" value="Fundación Conservación Galápagos" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">RUC / Registro Oficial / Documento Identidad *</label>
            <input type="text" value="2090012345001" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Representante Legal *</label>
            <input type="text" value="Dra. Lucía María Benítez" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Persona de Contacto Técnica *</label>
            <input type="text" value="Ing. Carlos Alfredo Mendoza" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico de Contacto *</label>
            <input type="email" value="contacto@fundaciongalapagos.org" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
            <input type="text" value="+593 5 252 0192 / +593 99 876 5432" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Dirección / Isla / Localidad *</label>
            <input type="text" value="Av. Charles Darwin y Pelícanos, Puerto Baquerizo Moreno, Isla San Cristóbal, Galápagos" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Organizaciones Asociadas / Socios Estratégicos de Implementación</label>
          <textarea rows="2" class="w-full p-2 border border-slate-300 rounded-lg" placeholder="Indicar si aplica y qué organizaciones apoyarán la ejecución...">Dirección del Parque Nacional Galápagos (DPNG), GAD Municipal de San Cristóbal y Asociación de Pescadores Artesanales de San Cristóbal.</textarea>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-slate-200">
          <button type="button" onclick="navigateToView('applicant-dashboard')" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold">Guardar Borrador</button>
          <button type="button" onclick="saveApplicantInfoAndNext()" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold">Continuar a Nota Conceptual &rarr;</button>
        </div>
      </form>
    </div>

    <!-- VIEW 6: CONCEPTUAL NOTE MULTI-STEP FORM -->
    <div id="view-applicant-conceptual-note" class="view-panel space-y-6">
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm no-print">
        <div class="flex items-center justify-between text-xs overflow-x-auto gap-2 pb-2 md:pb-0">
          <button onclick="setCnStep(1)" id="cn-step-btn-1" class="px-3 py-2 rounded-xl font-bold bg-teal-600 text-white whitespace-nowrap">
            1. Información General
          </button>
          <button onclick="setCnStep(2)" id="cn-step-btn-2" class="px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            2. Descripción & Objetivos
          </button>
          <button onclick="setCnStep(3)" id="cn-step-btn-3" class="px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            3. Presupuesto & Cofinanciamiento
          </button>
          <button onclick="setCnStep(4)" id="cn-step-btn-4" class="px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            4. Anexo 1: Experiencia
          </button>
          <button onclick="setCnStep(5)" id="cn-step-btn-5" class="px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            5. Anexo 2: Examen SGAS
          </button>
        </div>
      </div>

      <!-- STEP 1 CONTAINER -->
      <div id="cn-step-1" class="cn-step-panel bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Sección I: Información General del Proyecto</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 mb-1">Título Oficial del Proyecto *</label>
            <input type="text" id="cn-title" value="Restauración de Ecosistemas de Manglar y Monitoreo Participativo de Tortugas Marinas en San Cristóbal" class="w-full p-2.5 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Ubicación y Área de Influencia *</label>
            <input type="text" id="cn-location" value="Puerto Baquerizo Moreno, Bahía Rosa Blanca y Manglesito, Isla San Cristóbal, Galápagos" class="w-full p-2.5 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Duración (en meses) *</label>
            <input type="number" id="cn-duration" value="18" min="1" max="24" class="w-full p-2.5 border border-slate-300 rounded-lg" onchange="validateDurationCategory(this.value)">
            <span class="text-[11px] text-slate-500">Límite para Mediana Subvención: máximo 24 meses.</span>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Presupuesto Total Solicitado al GLF (USD $) *</label>
            <input type="number" id="cn-budget-req" value="180000" class="w-full p-2.5 border border-slate-300 rounded-lg" onchange="recalcBudgetSummary()">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Cofinanciación Indicativa Aportada (USD $) *</label>
            <input type="number" id="cn-budget-cofin" value="20000" class="w-full p-2.5 border border-slate-300 rounded-lg" onchange="recalcBudgetSummary()">
            <span class="text-[11px] text-emerald-700 font-semibold" id="cofin-pct-label">Equivalente al 11.1% (Cumple requisito mínimo del 10%)</span>
          </div>
        </div>
      </div>

      <!-- STEP 2 CONTAINER -->
      <div id="cn-step-2" class="cn-step-panel bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 hidden text-xs">
        <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Sección II: Descripción del Proyecto</h3>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="font-semibold text-slate-700">Resumen del Proyecto (Máximo 500 palabras) *</label>
            <span class="text-[11px] text-slate-500" id="word-count-badge">Contador: 142 / 500 palabras</span>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">Describa brevemente el contexto, problema a solucionar, amenazas, justificación y solución propuesta con principales resultados esperados. Indique expresamente si existe solapamiento con otros donantes.</p>
          <textarea id="cn-summary" rows="6" onkeyup="updateWordCount(this.value)" class="w-full p-3 border border-slate-300 rounded-xl leading-relaxed">El presente proyecto aborda la degradación de hábitats de nidificación de tortugas marinas (Chelonia mydas) y zonas de manglar en Bahía Rosa Blanca, Isla San Cristóbal. Mediante un enfoque de conservación comunitaria y restauración ecológica activa, se implementarán 5 hectáreas de reforestación de manglar rojo y se establecerá un programa de monitoreo participativo con pescadores locales y guías naturalistas. La iniciativa solucionará la presión por pisoteo turístico no regulado y especies introducidas depredadoras. No existe duplicación con proyectos previos del GLF; la propuesta complementa el plan de manejo de la DPNG de forma coordinada.</textarea>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Objetivos del Proyecto (General y Específicos) *</label>
          <textarea id="cn-objectives" rows="4" class="w-full p-3 border border-slate-300 rounded-xl">Objetivo General: Fortalecer la resiliencia costera y la protección de sitios clave de anidación de tortugas marinas en San Cristóbal mediante restauración de manglares y gobernanza comunitaria.
Objetivos Específicos:
1. Restaurar 5 hectáreas de ecosistema de manglar degradado en Bahía Rosa Blanca.
2. Capacitar a 30 pescadores y guías en protocolos de monitoreo biológico participativo.
3. Establecer 2 estructuras de protección física contra la erosión costera.</textarea>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Beneficiarios y Contribución a Medios de Vida *</label>
          <textarea id="cn-beneficiaries" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">Beneficiarios directos: 30 familias de la Asociación de Pescadores Artesanales de San Cristóbal y 15 guías naturalistas locales que diversificarán sus ingresos con ecoturismo. Beneficiarios indirectos: 4,000 habitantes de Puerto Baquerizo Moreno beneficiados por servicios ecosistémicos de protección costera.</textarea>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Resultados e Indicadores de Impacto *</label>
          <textarea id="cn-results" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">Resultado 1: 5 hectáreas de manglar reforestadas con tasa de supervivencia > 85%.
Resultado 2: 1 base de datos comunitaria de nidificación con 100% de registros geo-referenciados.
Entregable: 1 Manual de Buenas Prácticas de Monitoreo Comunitario publicado y entregado a la DPNG.</textarea>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Alineación Estratégica (Prioridades GLF, ODS y Plan Galápagos 2030) *</label>
          <textarea id="cn-alignment" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">Alineado directamente con la Prioridad 2 de la Convocatoria GLF 2026-I (Restauración de Ecosistemas Marinos y Costeros), ODS 14 (Vida Submarina), ODS 13 (Acción por el Clima) y el Eje de Conservación Marina del Plan Galápagos 2030.</textarea>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Seguimiento y Evaluación (M&E) *</label>
          <textarea id="cn-me" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">Monitoreo trimestral de parcelas de restauración, auditorías semestrales de campo con la DPNG y reportes de avance de indicadores clave de desempeño (KPIs) subidos al sistema GLF.</textarea>
        </div>
      </div>

      <!-- STEP 3 CONTAINER: BUDGET -->
      <div id="cn-step-3" class="cn-step-panel bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 hidden text-xs">
        <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Sección III: Presupuesto Resumido y Cofinanciación</h3>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
          <i class="fa-solid fa-triangle-exclamation text-amber-600 mr-2"></i>
          <strong>Regla de Validación GLF:</strong> Los Gastos Administrativos (costos indirectos) no pueden superar el <strong>10%</strong> del costo total del proyecto.
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead class="bg-slate-100 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-2.5">Categoría de Gasto</th>
                <th class="p-2.5 text-right">Solicitado GLF (USD)</th>
                <th class="p-2.5 text-right">Cofinanciación (USD)</th>
                <th class="p-2.5 text-right">Total Presupuesto</th>
                <th class="p-2.5 text-right">% del Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-2.5 font-medium">1. Bienes y Equipos de Campo</td>
                <td class="p-2.5 text-right"><input type="number" value="40000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-glf"></td>
                <td class="p-2.5 text-right"><input type="number" value="5000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-cof"></td>
                <td class="p-2.5 text-right font-semibold" id="row-tot-1">$45,000</td>
                <td class="p-2.5 text-right" id="row-pct-1">22.5%</td>
              </tr>
              <tr>
                <td class="p-2.5 font-medium">2. Servicios Legales y Logística Marítima</td>
                <td class="p-2.5 text-right"><input type="number" value="50000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-glf"></td>
                <td class="p-2.5 text-right"><input type="number" value="8000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-cof"></td>
                <td class="p-2.5 text-right font-semibold" id="row-tot-2">$58,000</td>
                <td class="p-2.5 text-right" id="row-pct-2">29.0%</td>
              </tr>
              <tr>
                <td class="p-2.5 font-medium">3. Consultorías y Estudios Especializados</td>
                <td class="p-2.5 text-right"><input type="number" value="35000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-glf"></td>
                <td class="p-2.5 text-right"><input type="number" value="3000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-cof"></td>
                <td class="p-2.5 text-right font-semibold" id="row-tot-3">$38,000</td>
                <td class="p-2.5 text-right" id="row-pct-3">19.0%</td>
              </tr>
              <tr>
                <td class="p-2.5 font-medium">4. Honorarios Técnicos del Equipo</td>
                <td class="p-2.5 text-right"><input type="number" value="40000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-glf"></td>
                <td class="p-2.5 text-right"><input type="number" value="4000" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right b-input-cof"></td>
                <td class="p-2.5 text-right font-semibold" id="row-tot-4">$44,000</td>
                <td class="p-2.5 text-right" id="row-pct-4">22.0%</td>
              </tr>
              <tr class="bg-amber-50/60">
                <td class="p-2.5 font-bold text-amber-900">5. Gastos Administrativos Indirectos (Máx 10%)</td>
                <td class="p-2.5 text-right"><input type="number" value="15000" id="b-admin-glf" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border border-amber-400 rounded text-right font-bold text-amber-900"></td>
                <td class="p-2.5 text-right"><input type="number" value="0" id="b-admin-cof" onchange="recalcBudgetSummaryTable()" class="w-28 p-1 border rounded text-right"></td>
                <td class="p-2.5 text-right font-bold text-amber-900" id="row-tot-5">$15,000</td>
                <td class="p-2.5 text-right font-bold text-amber-900" id="row-pct-5">7.5% <i class="fa-solid fa-check text-emerald-600"></i></td>
              </tr>
              <tr class="bg-slate-900 text-white font-bold">
                <td class="p-3">COSTO TOTAL DEL PROYECTO</td>
                <td class="p-3 text-right" id="table-tot-glf">$180,000</td>
                <td class="p-3 text-right" id="table-tot-cof">$20,000</td>
                <td class="p-3 text-right" id="table-tot-grand">$200,000</td>
                <td class="p-3 text-right">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- STEP 4 CONTAINER: ANNEX 1 -->
      <div id="cn-step-4" class="cn-step-panel bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 hidden text-xs">
        <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Anexo 1: Experiencia y Capacidad del Proponente</h3>
        <p class="text-slate-600">Facilite una lista anotada de proyectos similares ejecutados previamente o adjunte los currículums del equipo clave.</p>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Resumen de Proyectos Anteriores Relacionados</label>
          <textarea rows="4" class="w-full p-3 border border-slate-300 rounded-xl">1. Proyecto Restauración Marina San Cristóbal (2023-2024), financiado por Fondo Conservación Ecuador. Monto: $85,000. Resultado: 3 hectáreas restauradas.
2. Programa Monitoreo Tortugas Marinas (2021-2023), ejecutado en coordinación con DPNG. Monto: $60,000.</textarea>
        </div>

        <div class="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 transition">
          <i class="fa-solid fa-cloud-arrow-up text-3xl text-slate-400 mb-2"></i>
          <p class="font-bold text-slate-800">Adjuntar Hojas de Vida del Equipo Técnico (PDF)</p>
          <p class="text-[11px] text-slate-500">Formatos permitidos: PDF. Tamaño máximo: 10 MB.</p>
          <span class="inline-block mt-3 px-4 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold">CV_Equipo_Tecnico_GLF.pdf (3.4 MB) <i class="fa-solid fa-check text-emerald-600 ml-1"></i></span>
        </div>
      </div>

      <!-- STEP 5 CONTAINER: ANNEX 2 SGAS EXAM -->
      <div id="cn-step-5" class="cn-step-panel bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 hidden text-xs">
        <div class="border-b border-slate-200 pb-3">
          <h3 class="text-lg font-bold text-slate-900">Anexo 2: Examen de Evaluación del Sistema de Gestión Ambiental y Social (SGAS)</h3>
          <p class="text-slate-500 text-xs">Cuestionario oficial de 9 preguntas obligatorias para verificar el cumplimiento institucional del SGAS de GLF.</p>
        </div>

        <div class="space-y-4" id="sgas-questions-container">
        </div>
      </div>

      <!-- STEP NAVIGATION FOOTER -->
      <div class="flex items-center justify-between pt-4 bg-white p-4 rounded-2xl border border-slate-200 no-print">
        <button onclick="prevCnStep()" id="btn-cn-prev" class="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
          &larr; Paso Anterior
        </button>

        <span class="text-xs text-slate-500" id="cn-step-counter-text">Paso 1 de 5</span>

        <button onclick="nextCnStep()" id="btn-cn-next" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow transition">
          Siguiente Paso &rarr;
        </button>
      </div>
    </div>

    <!-- VIEW 7: ACTIVITIES & RISK MANAGEMENT -->
    <div id="view-applicant-activities-risks" class="view-panel space-y-6 text-xs">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span class="text-xs font-bold text-teal-700 uppercase">Estructuración Jerárquica del Proyecto</span>
          <h2 class="text-xl font-bold text-slate-900">Registro de Actividades, Riesgos A&S y Acciones de Mitigación</h2>
          <p class="text-slate-500">Relación directa: Actividad &rarr; Riesgos Asociados &rarr; Medidas de Mitigación</p>
        </div>
        <button onclick="alert('Añadir nueva actividad (Simulación)')" class="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl shadow hover:bg-teal-700 transition">
          <i class="fa-solid fa-plus mr-1.5"></i> Añadir Nueva Actividad
        </button>
      </div>

      <div id="activities-list-container" class="space-y-4">
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-200">
        <button onclick="navigateToView('applicant-conceptual-note')" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold">&larr; Volver a Nota Conceptual</button>
        <button onclick="navigateToView('applicant-safeguards-matrix')" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold">Ir a Matriz de Salvaguardas (Ulf) &rarr;</button>
      </div>
    </div>

    <!-- VIEW 8: SAFEGUARDS FORM / ULF RISK MATRIX -->
    <div id="view-applicant-safeguards-matrix" class="view-panel space-y-6 text-xs">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <div class="inline-flex items-center px-2.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[11px] mb-1">
              <i class="fa-solid fa-laptop-code mr-1.5"></i> FORMULARIO WEB INTERACTIVO (REEMPLAZA LA PLANTILLA EXCEL)
            </div>
            <h2 class="text-xl font-bold text-slate-900">Matriz en Línea de Riesgos, Salvaguardas y Planificación (Matriz de Ulf)</h2>
            <p class="text-slate-500">Este formulario digitaliza 100% la matriz de Ulf en el navegador. Reemplaza el examen VEAS y la hoja Excel manual.</p>
          </div>
          <button onclick="downloadMockPDF('Matriz_Salvaguardas_Ulf.pdf')" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow flex items-center">
            <i class="fa-solid fa-file-pdf mr-2 text-red-400"></i> Previsualizar Matriz PDF
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px]">
          <div>
            <span class="font-bold text-slate-800 block">Regla 1: Categoría de Riesgo</span>
            <code>Categoría = Probabilidad (1-5) &times; Gravedad (1-5)</code>
            <span class="text-slate-500 block mt-1">Resultado: Rango de 1 a 25.</span>
          </div>
          <div>
            <span class="font-bold text-slate-800 block">Regla 2: Escala Cualitativa</span>
            <div class="flex items-center space-x-1 mt-1">
              <span class="px-1.5 py-0.5 rounded badge-bajo">1-4 BAJO</span>
              <span class="px-1.5 py-0.5 rounded badge-medio">5-9 MEDIO</span>
              <span class="px-1.5 py-0.5 rounded badge-alto">10-16 ALTO</span>
              <span class="px-1.5 py-0.5 rounded badge-muy-alto">17-25 MUY ALTO</span>
            </div>
          </div>
          <div>
            <span class="font-bold text-slate-800 block">Estado del Catálogo de Salvaguardas</span>
            <span class="inline-block mt-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
              <i class="fa-solid fa-gears mr-1"></i> Formulario web configurado en plataforma
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-[11px] min-w-[1200px]">
            <thead class="bg-slate-800 text-white font-semibold">
              <tr>
                <th class="p-2.5 border-r border-slate-700 w-36">1. Actividad Principal</th>
                <th class="p-2.5 border-r border-slate-700 w-36">2. Riesgo A&S</th>
                <th class="p-2.5 border-r border-slate-700 w-44">3. Descripción del Riesgo</th>
                <th class="p-2.5 border-r border-slate-700 text-center w-16">4. Prob (1-5)</th>
                <th class="p-2.5 border-r border-slate-700 text-center w-16">5. Grav (1-5)</th>
                <th class="p-2.5 border-r border-slate-700 text-center w-24">6-7. Nivel Inicial</th>
                <th class="p-2.5 border-r border-slate-700 w-48">8. Medidas de Mitigación / Salvaguarda</th>
                <th class="p-2.5 border-r border-slate-700 text-center w-16">9. Prob Mitig</th>
                <th class="p-2.5 border-r border-slate-700 text-center w-16">10. Grav Mitig</th>
                <th class="p-2.5 border-r border-slate-700 text-center w-24">11. Nivel Residual</th>
                <th class="p-2.5 border-r border-slate-700 w-28">12-15. Ubicación / Resp / Costo / Periodo</th>
              </tr>
            </thead>
            <tbody id="ulf-matrix-tbody" class="divide-y divide-slate-200 bg-white">
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-200">
        <button onclick="navigateToView('applicant-activities-risks')" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold">&larr; Volver a Actividades</button>
        <button onclick="navigateToView('applicant-annexes')" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold">Ir a Carga de Anexos &rarr;</button>
      </div>
    </div>

    <!-- VIEW 9: ANNEXES UPLOAD -->
    <div id="view-applicant-annexes" class="view-panel max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6 text-xs">
      <div class="border-b border-slate-200 pb-3">
        <span class="text-xs font-bold text-teal-700 uppercase">Documentación Adjunta</span>
        <h2 class="text-xl font-bold text-slate-900">Carga de Anexos Requeridos por Convocatoria</h2>
        <p class="text-slate-500">Verifique que todos los documentos obligatorios estén adjuntados en formato PDF.</p>
      </div>

      <div class="space-y-4">
        <div class="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50">
          <div>
            <h4 class="font-bold text-slate-900">1. Anexo 1: Experiencia y Capacidad del Proponente *</h4>
            <p class="text-slate-500">Documento PDF con listado de proyectos o CVs del equipo clave.</p>
          </div>
          <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold"><i class="fa-solid fa-circle-check mr-1"></i> Adjuntado (3.4 MB)</span>
        </div>

        <div class="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50">
          <div>
            <h4 class="font-bold text-slate-900">2. RUC / Nombramiento Legal del Representante *</h4>
            <p class="text-slate-500">Copia digitalizada vigente del registro legal.</p>
          </div>
          <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold"><i class="fa-solid fa-circle-check mr-1"></i> Adjuntado (1.2 MB)</span>
        </div>

        <div class="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50">
          <div>
            <h4 class="font-bold text-slate-900">3. Carta de Apoyo Institucional (DPNG o Socios)</h4>
            <p class="text-slate-500">Cartas de aval de socios estratégicos.</p>
          </div>
          <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold"><i class="fa-solid fa-circle-check mr-1"></i> Adjuntado (850 KB)</span>
        </div>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-200">
        <button onclick="navigateToView('applicant-safeguards-matrix')" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold">&larr; Volver a Matriz</button>
        <button onclick="navigateToView('applicant-final-review')" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold">Ir a Revisión Final &rarr;</button>
      </div>
    </div>

    <!-- VIEW 10: PRE-SUBMISSION FINAL REVIEW & DECLARATION -->
    <div id="view-applicant-final-review" class="view-panel max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6 text-xs">
      <div class="border-b border-slate-200 pb-3">
        <span class="text-xs font-bold text-teal-700 uppercase">Paso Final antes del Envío</span>
        <h2 class="text-xl font-bold text-slate-900">Revisión Consolidada y Declaración Jurada</h2>
        <p class="text-slate-500">Revise la integridad del expediente. Una vez enviado, el expediente quedará bloqueado para edición directa.</p>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h4 class="font-bold text-slate-900 text-sm">Estado de Compleitud de Secciones</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div class="flex items-center text-emerald-700"><i class="fa-solid fa-circle-check mr-2"></i> Datos del Aplicante Completo</div>
          <div class="flex items-center text-emerald-700"><i class="fa-solid fa-circle-check mr-2"></i> Nota Conceptual (Secciones I a III)</div>
          <div class="flex items-center text-emerald-700"><i class="fa-solid fa-circle-check mr-2"></i> Anexo 1 & 2 (Cuestionario SGAS)</div>
          <div class="flex items-center text-emerald-700"><i class="fa-solid fa-circle-check mr-2"></i> Formulario Web de Salvaguardas (Ulf)</div>
          <div class="flex items-center text-emerald-700"><i class="fa-solid fa-circle-check mr-2"></i> Presupuesto & Cofinanciación Validado</div>
          <div class="flex items-center text-emerald-700"><i class="fa-solid fa-circle-check mr-2"></i> Anexos Requeridos Adjuntados</div>
        </div>
      </div>

      <div class="p-4 border border-slate-300 rounded-xl bg-white space-y-2">
        <label class="flex items-start cursor-pointer">
          <input type="checkbox" id="chk-declaration" class="mt-0.5 mr-3 rounded border-slate-300 text-teal-600 text-base">
          <span class="text-slate-800 leading-relaxed">
            Declaro bajo juramento que toda la información provista en esta Nota Conceptual y Matriz de Salvaguardas es verídica, exacta y respaldada por nuestra organización. Entiendo que la presentación de información falsa acarreará el rechazo inmediato del expediente.
          </span>
        </label>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-200">
        <button onclick="navigateToView('applicant-annexes')" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold">&larr; Volver a Anexos</button>
        <button onclick="submitFinalExpediente()" class="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-lg transition flex items-center">
          <i class="fa-solid fa-paper-plane mr-2"></i> Confirmar y Enviar Expediente al GLF
        </button>
      </div>
    </div>

    <!-- VIEW 11: SUBMITTED DETAIL & PDF DOWNLOAD VIEW -->
    <div id="view-applicant-expediente-view" class="view-panel space-y-6 text-xs">
      <div class="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div class="inline-flex items-center px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px] mb-2">
            <i class="fa-solid fa-lock mr-1.5"></i> EXPEDIENTE ENVIADO - BLOQUEADO PARA EDICIÓN DIRECTA
          </div>
          <h2 class="text-2xl font-bold">Expediente Código: <span id="view-exp-id-label" class="text-teal-300">GLF-2026-EXP-0842</span></h2>
          <p class="text-slate-300 mt-1">Fecha de Envío: 15 de Septiembre, 2026 - 14:32 ECT | Convocatoria 2026-I</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button onclick="openPDFModal('conceptual')" class="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow flex items-center">
            <i class="fa-solid fa-file-pdf mr-2"></i> Descargar Nota Conceptual (PDF)
          </button>
          <button onclick="openPDFModal('safeguards')" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 shadow flex items-center">
            <i class="fa-solid fa-file-excel mr-2 text-emerald-400"></i> Descargar Matriz Salvaguardas (PDF)
          </button>
        </div>
      </div>

      <div id="correction-banner-in-view" class="hidden bg-indigo-50 border-2 border-indigo-500 p-5 rounded-2xl text-indigo-950 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-sm text-indigo-900 flex items-center">
            <i class="fa-solid fa-clock-rotate-left mr-2 text-indigo-600 text-base"></i> VENTANA TEMPORAL DE EDICIÓN HABILITADA POR EL GLF
          </h4>
          <span class="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full" id="corr-expiry-tag">Vence: 05 Oct 2026, 23:59</span>
        </div>
        <p class="text-xs" id="corr-obs-text">
          Observación del Técnico GLF: "Por favor especificar con mayor detalle la ubicación de las estructuras de contención en Bahía Rosa Blanca y adjuntar el aval actualizado de la DPNG."
        </p>
        <button onclick="navigateToView('applicant-correction-window')" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow">
          Responder Observaciones y Editar Expediente &rarr;
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">Resumen de la Propuesta Enviada</h3>
          <div>
            <span class="text-slate-500 block">Título:</span>
            <strong class="text-slate-900 text-sm">Restauración de Ecosistemas de Manglar y Monitoreo Participativo de Tortugas Marinas en San Cristóbal</strong>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-slate-500 block">Categoría:</span>
              <strong>Mediana Subvención</strong>
            </div>
            <div>
              <span class="text-slate-500 block">Monto Solicitado:</span>
              <strong class="text-teal-700">$180,000 USD</strong>
            </div>
            <div>
              <span class="text-slate-500 block">Duración:</span>
              <strong>18 Meses</strong>
            </div>
            <div>
              <span class="text-slate-500 block">Cofinanciación:</span>
              <strong>$20,000 USD (11.1%)</strong>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">Trazabilidad de Eventos</h3>
          <ul class="space-y-3 text-[11px] text-slate-600">
            <li class="flex items-start">
              <span class="w-2 h-2 rounded-full bg-emerald-500 mt-1 mr-2"></span>
              <div>
                <strong>Envío Exitoso del Expediente</strong>
                <p class="text-slate-400">15 Sept 2026, 14:32 por Lucía Benítez</p>
              </div>
            </li>
            <li class="flex items-start">
              <span class="w-2 h-2 rounded-full bg-teal-500 mt-1 mr-2"></span>
              <div>
                <strong>Recepción en Mesa Técnica GLF</strong>
                <p class="text-slate-400">15 Sept 2026, 14:33 (Asignado a Revisión)</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- VIEW 12: CORRECTION WINDOW INTERFACE -->
    <div id="view-applicant-correction-window" class="view-panel max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-500 shadow-xl space-y-6 text-xs">
      <div class="border-b border-slate-200 pb-3">
        <span class="text-xs font-bold text-indigo-700 uppercase">Atención de Observaciones</span>
        <h2 class="text-xl font-bold text-slate-900">Ventana Temporal de Edición Autorizada por el GLF</h2>
        <p class="text-slate-500">Personal técnico del GLF ha autorizado la edición temporal de su expediente para corregir las siguientes observaciones.</p>
      </div>

      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-900 space-y-2">
        <div class="flex justify-between items-center font-bold">
          <span><i class="fa-solid fa-user-shield text-indigo-600 mr-2"></i> Autorizado por: Dra. María Elena Torres (Técnico GLF)</span>
          <span class="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">Vence: 05 Oct 2026 - 23:59 ECT</span>
        </div>
        <div class="border-t border-indigo-200/60 pt-2">
          <strong>Detalle de Observaciones Enviadas:</strong>
          <p class="mt-1 bg-white p-3 rounded-lg border border-indigo-200 text-slate-800 leading-relaxed">
            "Por favor especificar con mayor detalle la ubicación exacta de las estructuras de contención en Bahía Rosa Blanca y adjuntar el aval institucional actualizado de la Dirección del Parque Nacional Galápagos (DPNG)."
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-bold text-slate-900">Respuesta del Aplicante</h4>
        <textarea rows="4" class="w-full p-3 border border-slate-300 rounded-xl" placeholder="Describa los cambios realizados en el expediente para subsanar las observaciones...">Hemos actualizado el campo de ubicación detallando coordenadas exactas en Bahía Rosa Blanca y adjuntado en la sección de Anexos el oficio N.º DPNG-2026-0841 de aval institucional.</textarea>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-200">
        <button onclick="navigateToView('applicant-conceptual-note')" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow">
          <i class="fa-solid fa-pen-to-square mr-2"></i> Abrir Formulario para Editar Campos
        </button>
        <button onclick="resubmitCorrectionExpediente()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow">
          Re-enviar Expediente Corregido &rarr;
        </button>
      </div>
    </div>

    <!-- VIEW 13: ACCOUNT & SECURITY SETTINGS -->
    <div id="view-applicant-account" class="view-panel max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6 text-xs">
      <h2 class="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">Perfil de Cuenta y Preferencias de Seguridad</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nombre de Usuario</label>
          <input type="text" value="postulante_galapagos" readonly class="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico Verificado</label>
          <input type="email" value="contacto@fundaciongalapagos.org" readonly class="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg">
        </div>
      </div>
      <div>
        <h4 class="font-bold text-slate-900 mb-2">Sesiones Activas y Auditoría de Acceso</h4>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div class="flex justify-between font-semibold text-slate-800">
            <span>Navegador Web (Windows / Chrome) - IP: 190.152.12.44</span>
            <span class="text-emerald-600">Sesión Actual</span>
          </div>
          <span class="text-slate-400 text-[11px]">Última actividad: Hace 2 minutos en Puerto Baquerizo Moreno</span>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- MODULE 2 VIEWS (PANEL PERSONAL GLF ADMIN & TECH)                   -->
    <!-- =================================================================== -->

    <!-- VIEW ADMIN 1: DASHBOARD -->
    <div id="view-admin-dashboard" class="view-panel space-y-6 text-xs">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div>
          <span class="text-xs text-teal-300 font-bold uppercase tracking-wider">Panel de Control Técnico GLF</span>
          <h2 class="text-2xl font-bold">Gestión de Convocatorias y Expedientes</h2>
          <p class="text-slate-300 text-xs mt-0.5">Monitoreo en tiempo real de postulaciones, salvaguardas y revisiones técnicas</p>
        </div>
        <button onclick="navigateToView('admin-calls')" class="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-4 py-2 rounded-xl shadow transition">
          <i class="fa-solid fa-gear mr-1.5"></i> Administrar Convocatorias
        </button>
      </div>

      <!-- KPI METRICS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Convocatorias Publicadas</span>
          <strong class="text-xl font-bold text-slate-900">1 Activa / 1 Borrador</strong>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Expedientes Recibidos</span>
          <strong class="text-xl font-bold text-teal-700">14 Expedientes</strong>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Pendientes de Revisión Técnica</span>
          <strong class="text-xl font-bold text-amber-600">5 Pendientes</strong>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-slate-500 block">Ventanas de Corrección Activas</span>
          <strong class="text-xl font-bold text-indigo-600">2 Autorizadas</strong>
        </div>
      </div>

      <!-- RECENT EXPEDIENTES QUEUE TABLE -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 class="font-bold text-sm text-slate-900">Bandeja Técnica de Expedientes Recibidos</h3>
          <button onclick="navigateToView('admin-expedientes')" class="text-teal-700 font-bold hover:underline">Ver Todos los Expedientes &rarr;</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3">Código ID</th>
                <th class="p-3">Organización / Aplicante</th>
                <th class="p-3">Categoría</th>
                <th class="p-3">Nivel Riesgo Residual</th>
                <th class="p-3">Estado Evaluación</th>
                <th class="p-3 text-right">Acción Técnica</th>
              </tr>
            </thead>
            <tbody id="admin-expedientes-dashboard-tbody" class="divide-y divide-slate-200">
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- VIEW ADMIN 2: CALLS MANAGEMENT & PARAMETER EDITOR -->
    <div id="view-admin-calls" class="view-panel space-y-6 text-xs">
      <div class="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Gestión de Convocatorias y Editor de Parámetros</h2>
          <p class="text-slate-500">Configure montos, fechas, reglas de cofinanciación y vigencia/versionado.</p>
        </div>
        <button onclick="alert('Formulario de creación de nueva convocatoria (Simulación)')" class="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl shadow">
          <i class="fa-solid fa-plus mr-1.5"></i> Crear Nueva Convocatoria
        </button>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 class="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">Parámetros de la Convocatoria Activa (2026-I)</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nombre de la Convocatoria *</label>
            <input type="text" value="Convocatoria 2026-I: Conservación Marina y Adaptación al Cambio Climático" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Fecha de Apertura *</label>
            <input type="date" value="2026-09-01" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Fecha Límite de Cierre *</label>
            <input type="date" value="2026-11-15" class="w-full p-2 border border-slate-300 rounded-lg">
          </div>
        </div>

        <div class="border-t border-slate-200 pt-4 space-y-4">
          <h4 class="font-bold text-slate-800">Reglas por Categoría de Subvención</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <strong class="font-bold text-slate-900">Pequeña Subvención</strong>
              <div><span class="text-slate-500">Monto Máximo:</span> <input type="number" value="100000" class="w-full p-1 border rounded"></div>
              <div><span class="text-slate-500">Duración Máx (meses):</span> <input type="number" value="12" class="w-full p-1 border rounded"></div>
              <div><span class="text-slate-500">Cofinanciación exigida:</span> <input type="text" value="0% (Recomendada)" class="w-full p-1 border rounded"></div>
            </div>
            <div class="p-3 border border-teal-300 rounded-xl bg-teal-50/50 space-y-2">
              <strong class="font-bold text-slate-900">Mediana Subvención</strong>
              <div><span class="text-slate-500">Monto Máximo:</span> <input type="number" value="250000" class="w-full p-1 border rounded"></div>
              <div><span class="text-slate-500">Duración Máx (meses):</span> <input type="number" value="24" class="w-full p-1 border rounded"></div>
              <div><span class="text-slate-500">Cofinanciación exigida:</span> <input type="text" value="10%" class="w-full p-1 border rounded"></div>
            </div>
            <div class="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <strong class="font-bold text-slate-900">Gran Subvención</strong>
              <div><span class="text-slate-500">Monto Mínimo:</span> <input type="number" value="250000" class="w-full p-1 border rounded"></div>
              <div><span class="text-slate-500">Duración Máx (meses):</span> <input type="number" value="36" class="w-full p-1 border rounded"></div>
              <div><span class="text-slate-500">Cofinanciación exigida:</span> <input type="text" value="25%" class="w-full p-1 border rounded"></div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <button onclick="navigateToView('applicant-public-call')" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold">Previsualizar Vista Pública Bilingüe</button>
          <button onclick="alert('Parámetros guardados y versionados correctamente (v1.2)')" class="px-6 py-2 bg-teal-600 text-white font-bold rounded-xl shadow">Guardar Cambios de Convocatoria</button>
        </div>
      </div>
    </div>

    <!-- VIEW ADMIN 3: EXTERNAL USERS MANAGEMENT -->
    <div id="view-admin-users" class="view-panel space-y-6 text-xs">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-xl font-bold text-slate-900">Gestión de Usuarios Externos y Organizaciones</h2>
        <div class="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Buscar por RUC, nombre de organización o correo..." class="flex-1 p-2 border border-slate-300 rounded-xl">
          <select class="p-2 border border-slate-300 rounded-xl">
            <option>Todos los Tipos de Aplicante</option>
            <option>Persona Jurídica</option>
            <option>Persona Natural</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3">Organización / Usuario</th>
                <th class="p-3">RUC / Identificación</th>
                <th class="p-3">Tipo</th>
                <th class="p-3">Expedientes Asociados</th>
                <th class="p-3">Estado Acceso</th>
                <th class="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr>
                <td class="p-3 font-bold text-slate-900">Fundación Conservación Galápagos<br><span class="text-[11px] text-slate-500 font-normal">contacto@fundaciongalapagos.org</span></td>
                <td class="p-3">2090012345001</td>
                <td class="p-3">Persona Jurídica</td>
                <td class="p-3 font-semibold text-teal-700">GLF-2026-EXP-0842</td>
                <td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                <td class="p-3 text-right">
                  <button onclick="alert('Trazabilidad de acciones del usuario consultada')" class="text-slate-600 hover:text-slate-900 mr-2"><i class="fa-solid fa-clock-rotate-left"></i> Auditoría</button>
                  <button onclick="alert('Estado de acceso actualizado')" class="text-red-600 hover:underline">Desactivar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- VIEW ADMIN 4: CATALOGUES CONFIGURATION -->
    <div id="view-admin-catalogues" class="view-panel space-y-6 text-xs">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="border-b border-slate-200 pb-3">
          <h2 class="text-xl font-bold text-slate-900">Configuración Web de Catálogos y Reglas de Salvaguardas</h2>
          <p class="text-slate-500">Módulo interno para administrar catálogos de salvaguardas, escalas y medidas directamente en la plataforma web (opción de importación masiva desde Excel referencial).</p>
        </div>

        <div class="p-6 border-2 border-dashed border-teal-400 bg-teal-50/40 rounded-2xl text-center space-y-2">
          <i class="fa-solid fa-sliders text-4xl text-teal-600 mb-1"></i>
          <h4 class="font-bold text-slate-900 text-sm">Administrador del Formulario Web de Salvaguardas</h4>
          <p class="text-slate-600 text-xs">Permite a los administradores GLF editar las medidas de mitigación en línea y cargar masivamente catálogos desde archivos Excel de referencia.</p>
          <button onclick="alert('Catálogo maestro actualizado exitosamente con 18 medidas estándar GLF en el formulario web')" class="mt-3 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow">
            Simular Actualización de Catálogo Web
          </button>
        </div>
      </div>
    </div>

    <!-- VIEW ADMIN 5: EXPEDIENTES MANAGEMENT & HUMAN TECHNICAL REVIEW -->
    <div id="view-admin-expediente-review" class="view-panel space-y-6 text-xs">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="text-xs text-teal-700 font-bold uppercase tracking-wider">Mesa de Evaluación Técnica GLF</span>
          <h2 class="text-2xl font-bold text-slate-900">Revisión Humana del Expediente: <span class="text-teal-700">GLF-2026-EXP-0842</span></h2>
          <p class="text-slate-500">Aplicante: Fundación Conservación Galápagos | Categoría: Mediana Subvención ($180,000 USD)</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button onclick="openPDFModal('conceptual')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-300">
            <i class="fa-solid fa-file-pdf mr-1 text-red-500"></i> Ver Nota Conceptual
          </button>
          <button onclick="openPDFModal('safeguards')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-300">
            <i class="fa-solid fa-file-excel mr-1 text-emerald-600"></i> Ver Matriz Ulf
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 class="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">Verificación de Salvaguardas y Cálculo de Riesgo Residual</h3>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-800">Resultado Calculado de la Matriz:</span>
                <span class="px-2.5 py-1 rounded badge-medio font-bold">Nivel Residual: MEDIO (Categoría 6)</span>
              </div>
              <p class="text-slate-600">
                La propuesta presenta 2 actividades principales con riesgos evaluados. Tras aplicar las medidas de reforestación y vallado participativo, la gravedad mitigada desciende de 4 a 2.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-lg space-y-4">
          <h3 class="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 flex items-center">
            <i class="fa-solid fa-user-check text-teal-600 mr-2"></i> Dictamen del Técnico Revisor
          </h3>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nombre del Técnico Evaluador</label>
            <input type="text" value="Dra. María Elena Torres (Especialista A&S GLF)" readonly class="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg">
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Observaciones / Justificación Obligatoria *</label>
            <textarea id="admin-review-notes" rows="4" class="w-full p-2.5 border border-slate-300 rounded-xl" placeholder="Escriba los hallazgos de la revisión técnica..."></textarea>
          </div>

          <div class="space-y-2 pt-2">
            <button onclick="grantCorrectionWindowModal()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center">
              <i class="fa-solid fa-clock-rotate-left mr-2"></i> Autorizar Ventana Temporal de Corrección
            </button>
            <button onclick="changeExpedienteState('Aprobado')" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition">
              <i class="fa-solid fa-circle-check mr-2"></i> Aprobar Expediente
            </button>
            <button onclick="changeExpedienteState('Rechazado')" class="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition">
              <i class="fa-solid fa-circle-xmark mr-2"></i> Rechazar Expediente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW ADMIN 6: FUTURE RAG ASSISTANT -->
    <div id="view-admin-rag-assistant" class="view-panel max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6 text-xs">
      <div class="border-b border-slate-200 pb-3 flex justify-between items-start">
        <div>
          <span class="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wider">
            <i class="fa-solid fa-robot mr-1"></i> Asistencia RAG Futura (En Preparación / No Ejecutiva)
          </span>
          <h2 class="text-xl font-bold text-slate-900 mt-2">Consulta Inteligente del Corpus Normativo GLF</h2>
          <p class="text-slate-500">Herramienta técnica interna para rápida referencia del Manual SGAS y bases oficiales. La decisión final corresponde siempre al especialista humano.</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex gap-2">
          <input type="text" id="rag-query-input" value="¿Cuáles son las actividades no subvencionables según la Lista de Exclusión del GLF?" class="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
          <button onclick="executeMockRAGQuery()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow">
            Consultar Corpus
          </button>
        </div>

        <div id="rag-results-box" class="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <span class="font-bold text-slate-900">Resultado de Búsqueda RAG (Fragmentos Citados)</span>
            <span class="text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full font-bold">Nivel de Confianza: 91% (Alta)</span>
          </div>

          <div class="space-y-3">
            <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <div class="flex justify-between text-indigo-900 font-bold">
                <span><i class="fa-solid fa-file-contract mr-1"></i> Manual_SGAS_GLF_2025.pdf (Sección 3.2 - Lista de Exclusión)</span>
                <a href="javascript:void(0)" onclick="alert('Abriendo documento original en página 14')" class="text-indigo-600 hover:underline">Ver Fuente Pág. 14 &rarr;</a>
              </div>
              <p class="text-slate-700 leading-relaxed italic">
                "3.2 Actividades No Subvencionables: Se excluyen expresamente proyectos que involucren introducción de especies exóticas invasoras, alteración directa de ecosistemas marinos protegidos sin aval de la DPNG, y actividades que vulneren derechos colectivos."
              </p>
            </div>
          </div>

          <div class="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <i class="fa-solid fa-circle-exclamation mr-1"></i> <strong>Aviso Técnico:</strong> Este resultado es una asistencia de consulta rápida sobre el corpus normativo autorizado y no constituye una aprobación automática ni dictamen institucional.
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW ADMIN 7: REPORTS & EXPORTING -->
    <div id="view-admin-reports" class="view-panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
      <h2 class="text-xl font-bold text-slate-900">Reportes y Exportación Auditada de Datos</h2>
      <p class="text-slate-500">Exporte listados consolidados de expedientes con protección de privacidad de datos sensibles.</p>
      <div class="flex flex-wrap gap-3">
        <button onclick="alert('Descargando reporte consolidado en formato CSV auditado')" class="px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow">
          <i class="fa-solid fa-file-csv mr-2"></i> Exportar Expedientes Convocatoria 2026-I (CSV)
        </button>
      </div>
    </div>

    <!-- VIEW ADMIN 8: SECURITY AUDIT LOG -->
    <div id="view-admin-audit" class="view-panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
      <h2 class="text-xl font-bold text-slate-900">Historial de Auditoría de Seguridad y Trazabilidad</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th class="p-2.5">Fecha y Hora</th>
              <th class="p-2.5">Usuario / Rol</th>
              <th class="p-2.5">Acción Realizada</th>
              <th class="p-2.5">Objeto Afectado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr>
              <td class="p-2.5 font-mono">2026-09-15 14:32:01</td>
              <td class="p-2.5">postulante_galapagos</td>
              <td class="p-2.5 font-semibold text-emerald-700">ENVÍO_EXPEDIENTE</td>
              <td class="p-2.5">GLF-2026-EXP-0842</td>
            </tr>
            <tr>
              <td class="p-2.5 font-mono">2026-09-16 09:15:22</td>
              <td class="p-2.5">dra_torres (Técnico GLF)</td>
              <td class="p-2.5 font-semibold text-indigo-700">AUTORIZAR_VENTANA_CORRECCION</td>
              <td class="p-2.5">GLF-2026-EXP-0842 (Vence: 05-Oct)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VIEW ADMIN 9: ROLES & PERMISSIONS -->
    <div id="view-admin-roles" class="view-panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
      <h2 class="text-xl font-bold text-slate-900">Roles y Matriz de Permisos GLF</h2>
      <p class="text-slate-500">Principio de mínimo privilegio aplicado para personal interno GLF.</p>
    </div>

  </main>

  <!-- ================= MODALS & OVERLAYS ================= -->

  <!-- PDF SIMULATOR PREVIEW MODAL -->
  <div id="pdf-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <i class="fa-solid fa-file-pdf text-red-400 text-xl"></i>
          <div>
            <h3 id="pdf-modal-title" class="font-bold text-sm">Vista Previa de Documento PDF Generado</h3>
            <span class="text-slate-400 text-xs">Documento Oficial GLF con Código QR de Verificación</span>
          </div>
        </div>
        <button onclick="closePDFModal()" class="text-slate-400 hover:text-white text-xl font-bold px-2">&times;</button>
      </div>

      <div id="pdf-modal-body" class="p-8 overflow-y-auto flex-1 space-y-6 text-xs bg-slate-100 custom-scrollbar">
      </div>

      <div class="bg-slate-200 p-4 flex justify-between items-center text-xs">
        <span class="text-slate-600">Verificación Segura GLF activa</span>
        <div class="space-x-2">
          <button onclick="closePDFModal()" class="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold rounded-xl">Cerrar</button>
          <button onclick="window.print()" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow">
            <i class="fa-solid fa-print mr-1.5"></i> Imprimir / Descargar PDF
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- GRANT CORRECTION WINDOW MODAL -->
  <div id="grant-correction-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
      <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
        <i class="fa-solid fa-clock-rotate-left text-indigo-600 mr-2"></i> Autorizar Ventana Temporal de Corrección
      </h3>

      <div>
        <label class="block font-semibold text-slate-700 mb-1">Fecha y Hora Límite de Vencimiento *</label>
        <input type="datetime-local" id="grant-expiry-datetime" value="2026-10-05T23:59" class="w-full p-2 border border-slate-300 rounded-lg">
        <span class="text-[11px] text-slate-500">No puede ser posterior al cierre de la convocatoria (15 Nov 2026).</span>
      </div>

      <div>
        <label class="block font-semibold text-slate-700 mb-1">Observaciones Específicas para el Aplicante *</label>
        <textarea id="grant-obs-text" rows="4" class="w-full p-2.5 border border-slate-300 rounded-xl">Por favor especificar con mayor detalle la ubicación exacta de las estructuras de contención en Bahía Rosa Blanca y adjuntar el aval institucional actualizado de la DPNG.</textarea>
      </div>

      <div class="flex justify-end space-x-2 pt-2">
        <button onclick="closeGrantCorrectionModal()" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold">Cancelar</button>
        <button onclick="confirmGrantCorrectionWindow()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow">
          Confirmar y Notificar al Aplicante
        </button>
      </div>
    </div>
  </div>

  <!-- ================= JAVASCRIPT LOGIC ENGINE ================= -->
  <script>
    const GLF_LOGO_WHITE = "{logo_white_src}";

    const state = {{
      currentModule: 'applicant',
      currentView: 'applicant-public-call',
      currentLang: 'es',
      activeExpedienteId: 'GLF-2026-EXP-0842',
      cnCurrentStep: 1,
      expedientes: [
        {{
          id: 'GLF-2026-EXP-0842',
          title: 'Restauración de Ecosistemas de Manglar y Monitoreo Participativo de Tortugas Marinas en San Cristóbal',
          applicant: 'Fundación Conservación Galápagos',
          ruc: '2090012345001',
          category: 'Mediana Subvención',
          requested: 180000,
          cofinancing: 20000,
          duration: 18,
          status: 'Enviado',
          riskLevel: 'MEDIO',
          lastModified: '15/09/2026 14:32',
          correctionActive: false,
          correctionExpiry: '05/10/2026 23:59',
          correctionObs: ''
        }},
        {{
          id: 'GLF-2026-EXP-0843',
          title: 'Monitoreo de Microplásticos y Calidad de Agua en Reservas Marinas de Santa Cruz',
          applicant: 'Asociación EcoGalápagos',
          ruc: '2090098765001',
          category: 'Pequeña Subvención',
          requested: 75000,
          cofinancing: 5000,
          duration: 12,
          status: 'Borrador',
          riskLevel: 'BAJO',
          lastModified: '28/09/2026 10:15',
          correctionActive: false,
          correctionExpiry: '',
          correctionObs: ''
        }}
      ],
      activities: [
        {{
          id: 1,
          name: 'Coordinación Interinstitucional y Talleres Comunitarios',
          risks: [
            {{
              id: 101,
              desc: 'Desacuerdo inicial con sectores pesqueros sobre la delimitación de zonas protegidas',
              prob: 3,
              grav: 3,
              mitigation: 'Implementar mesas de diálogo inclusivo y consultas previas con la DPNG',
              mitProb: 2,
              mitGrav: 2,
              location: 'Puerto Baquerizo Moreno',
              resp: 'Ing. Carlos Mendoza',
              cost: 4500,
              period: 'Año 1 - T1'
            }}
          ]
        }},
        {{
          id: 2,
          name: 'Reforestación de Manglar Rojo y Vallado de Protección',
          risks: [
            {{
              id: 102,
              desc: 'Pérdida accidental de plántulas por marejadas atípicas durante la siembra',
              prob: 4,
              grav: 4,
              mitigation: 'Instalar mallas de disipación de oleaje y siembra programada en marea baja',
              mitProb: 2,
              mitGrav: 2,
              location: 'Bahía Rosa Blanca',
              resp: 'Bióloga Sofía Castro',
              cost: 12000,
              period: 'Año 1 - T2'
            }}
          ]
        }}
      ]
    }};

    const i18n = {{
      es: {{
        demo_tag: "PROTOTIPO VISUAL INTERACTIVO GLF",
        mod_applicant: "Módulo 1: Portal Postulantes",
        mod_admin: "Módulo 2: Panel Personal GLF",
        header_subtitle: "Sistema de Convocatorias, Notas Conceptuales y Salvaguardas Ambientales y Sociales",
        call_status_open: "CONVOCATORIA ABIERTA 2026-I",
        call_title: "Conservación Marina, Resiliencia Costera y Adaptación al Cambio Climático en Galápagos",
        call_desc: "El Galapagos Life Fund convoca a personas naturales, organizaciones sin fines de lucro, instituciones académicas y comunitarias a presentar Notas Conceptuales para financiar proyectos enfocados en la preservación de la biodiversidad marina.",
        call_opening: "Apertura:",
        call_closing: "Cierre de Convocatoria:",
        call_pool: "Fondo Total Disponible:",
        btn_start_application: "Iniciar Postulación en Línea",
        btn_download_bases: "Descargar Bases y Guía Formato (PDF)",
        categories_title: "Categorías de Subvención Habilitadas",
        categories_note: "* Parámetros configurados por la administración GLF para la convocatoria activa actual.",
        cat_small_name: "Pequeña Subvención",
        cat_small_duration: "Duración máxima: hasta 12 meses",
        cat_small_cofin: "Cofinanciación: No obligatoria (Recomendada en especie)",
        cat_small_applicants: "Dirigido a: Personas Naturales y Organizaciones locales",
        btn_apply_small: "Postular a Pequeña Subvención",
        badge_popular: "Más Solicitada",
        cat_medium_name: "Mediana Subvención",
        cat_medium_duration: "Duración máxima: hasta 24 meses",
        cat_medium_cofin: "Cofinanciación exigida: Mínimo 10% (efectivo o especie)",
        cat_medium_applicants: "Dirigido a: Organizaciones e Instituciones registradas",
        btn_apply_medium: "Postular a Mediana Subvención",
        cat_large_name: "Gran Subvención",
        cat_large_duration: "Duración máxima: hasta 36 meses",
        cat_large_cofin: "Cofinanciación exigida: Mínimo 25% del total",
        cat_large_applicants: "Dirigido a: Consorcios y Alianzas institucionales",
        btn_apply_large: "Postular a Gran Subvención",
        faq_title: "Requisitos Generales y Preguntas Frecuentes",
        auth_title: "Acceso al Portal de Postulaciones",
        auth_subtitle: "Inicie sesión o registre su cuenta para gestionar sus notas conceptuales",
        tab_login: "Iniciar Sesión",
        tab_register: "Crear Cuenta",
        lbl_email: "Correo Electrónico",
        lbl_password: "Contraseña",
        btn_login: "Ingresar al Portal",
        lbl_applicant_type: "Tipo de Aplicante",
        btn_register: "Crear Cuenta y Verificar Correo",
        dash_welcome: "Mi Panel de Expedientes",
        dash_sub: "Gestione sus borradores, postulaciones enviadas y solicitudes de observación",
        btn_new_expediente: "Nueva Nota Conceptual",
        tbl_expedientes_title: "Historial de Mis Expedientes"
      }},
      en: {{
        demo_tag: "INTERACTIVE VISUAL PROTOTYPE GLF",
        mod_applicant: "Module 1: Applicants Portal",
        mod_admin: "Module 2: GLF Admin Panel",
        header_subtitle: "System for Calls, Conceptual Notes and Environmental & Social Safeguards",
        call_status_open: "CALL OPEN 2026-I",
        call_title: "Marine Conservation, Coastal Resilience and Climate Adaptation in Galápagos",
        call_desc: "The Galapagos Life Fund invites natural persons, non-profit organizations, academic and community institutions to submit Conceptual Notes for marine biodiversity funding.",
        call_opening: "Opening Date:",
        call_closing: "Call Deadline:",
        call_pool: "Total Fund Available:",
        btn_start_application: "Start Online Application",
        btn_download_bases: "Download Guidelines & Format (PDF)",
        categories_title: "Enabled Grant Categories",
        categories_note: "* Parameters configured by GLF administration for the current active call.",
        cat_small_name: "Small Grant",
        cat_small_duration: "Maximum duration: up to 12 months",
        cat_small_cofin: "Cofinancing: Optional (In-kind recommended)",
        cat_small_applicants: "Target: Individuals and local entities",
        btn_apply_small: "Apply for Small Grant",
        badge_popular: "Most Requested",
        cat_medium_name: "Medium Grant",
        cat_medium_duration: "Maximum duration: up to 24 months",
        cat_medium_cofin: "Required cofinancing: Minimum 10% (cash/in-kind)",
        cat_medium_applicants: "Target: Registered Organizations & Institutions",
        btn_apply_medium: "Apply for Medium Grant",
        cat_large_name: "Large Grant",
        cat_large_duration: "Maximum duration: up to 36 months",
        cat_large_cofin: "Required cofinancing: Minimum 25% of total",
        cat_large_applicants: "Target: Institutional Consortia & Alliances",
        btn_apply_large: "Apply for Large Grant",
        faq_title: "General Requirements & FAQ",
        auth_title: "Application Portal Access",
        auth_subtitle: "Log in or register your account to manage conceptual notes",
        tab_login: "Log In",
        tab_register: "Register Account",
        lbl_email: "Email Address",
        lbl_password: "Password",
        btn_login: "Access Portal",
        lbl_applicant_type: "Applicant Type",
        btn_register: "Register & Verify Email",
        dash_welcome: "My Application Dashboard",
        dash_sub: "Manage your drafts, submitted proposals, and reviewer observations",
        btn_new_expediente: "New Conceptual Note",
        tbl_expedientes_title: "My Expedientes History"
      }}
    }};

    const sgasQuestions = [
      "¿Ha revisado el Manual del Sistema de Gestión Ambiental y Social (SGAS) del GLF, incluidos los procedimientos? ¿Podrá cumplir con él?",
      "¿Puede confirmar que ha revisado la Lista de Exclusión actualizada del GLF y que su proyecto no incluye ninguna de estas actividades excluidas?",
      "¿Ha estado involucrada su organización en alguna violación de los derechos humanos en los últimos cinco años?",
      "¿Tiene su organización experiencia en la aplicación de normas de salvaguardia internacionales? (ej. Banco Mundial, etc.)",
      "¿Tiene experiencia en la realización de evaluaciones ambientales y sociales (EIA, EIAS) y desarrollo de herramientas de salvaguardas?",
      "¿Tiene su organización expertos en salvaguardias Ambientales y Sociales (A&S)?",
      "¿Tiene su organización expertos en igualdad de género?",
      "¿Trabajará con personal interno para realizar evaluaciones A&S adicionales (si es necesario)?",
      "Si trabaja con personal externo, ¿ha identificado la experiencia adecuada para el desarrollo de herramientas de salvaguardia?"
    ];

    window.addEventListener('DOMContentLoaded', () => {{
      renderSGASQuestions();
      renderApplicantExpedientesTable();
      renderActivitiesList();
      renderUlfMatrix();
      renderAdminDashboardTable();
      populateQuickViewSelect();
      updateLanguageUI();
    }});

    function setLanguage(lang) {{
      state.currentLang = lang;
      document.getElementById('btn-lang-es').className = lang === 'es' ? 'px-2 py-0.5 rounded text-xs font-medium bg-teal-600 text-white' : 'px-2 py-0.5 rounded text-xs font-medium text-slate-400 hover:text-white';
      document.getElementById('btn-lang-en').className = lang === 'en' ? 'px-2 py-0.5 rounded text-xs font-medium bg-teal-600 text-white' : 'px-2 py-0.5 rounded text-xs font-medium text-slate-400 hover:text-white';
      updateLanguageUI();
    }}

    function updateLanguageUI() {{
      const dict = i18n[state.currentLang];
      document.querySelectorAll('[data-i18n]').forEach(el => {{
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      }});
    }}

    function switchModule(mod) {{
      state.currentModule = mod;
      document.getElementById('btn-mod-applicant').className = mod === 'applicant' ? 'px-3 py-1 rounded-md text-xs font-semibold transition bg-teal-600 text-white flex items-center' : 'px-3 py-1 rounded-md text-xs font-semibold transition text-slate-300 hover:text-white flex items-center';
      document.getElementById('btn-mod-admin').className = mod === 'admin' ? 'px-3 py-1 rounded-md text-xs font-semibold transition bg-teal-600 text-white flex items-center' : 'px-3 py-1 rounded-md text-xs font-semibold transition text-slate-300 hover:text-white flex items-center';

      if (mod === 'applicant') {{
        document.getElementById('active-user-label').textContent = 'Aplicante: Fundación Conservación Galápagos (RUC: 2090012345001)';
        navigateToView('applicant-dashboard');
      }} else {{
        document.getElementById('active-user-label').textContent = 'Personal GLF: Dra. María Elena Torres (Especialista A&S)';
        navigateToView('admin-dashboard');
      }}
      populateQuickViewSelect();
    }}

    function navigateToView(viewId) {{
      state.currentView = viewId;
      document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
      const target = document.getElementById('view-' + viewId);
      if (target) target.classList.remove('hidden');

      const select = document.getElementById('quick-view-select');
      if (select) select.value = viewId;

      window.scrollTo({{ top: 0, behavior: 'smooth' }});
    }}

    function populateQuickViewSelect() {{
      const select = document.getElementById('quick-view-select');
      select.innerHTML = '';
      const views = state.currentModule === 'applicant' ? [
        {{ id: 'applicant-public-call', name: '1. Página Pública Convocatoria' }},
        {{ id: 'applicant-auth', name: '2. Registro e Inicio de Sesión' }},
        {{ id: 'applicant-dashboard', name: '3. Inicio del Aplicante (Panel)' }},
        {{ id: 'applicant-create', name: '4. Crear Expediente y Categoría' }},
        {{ id: 'applicant-info', name: '5. Datos del Aplicante' }},
        {{ id: 'applicant-conceptual-note', name: '6. Nota Conceptual (Formulario)' }},
        {{ id: 'applicant-activities-risks', name: '7. Actividades y Riesgos A&S' }},
        {{ id: 'applicant-safeguards-matrix', name: '8. Formulario Web Salvaguardas (Ulf)' }},
        {{ id: 'applicant-annexes', name: '9. Carga de Anexos' }},
        {{ id: 'applicant-final-review', name: '10. Revisión Final y Envío' }},
        {{ id: 'applicant-expediente-view', name: '11. Expediente Enviado & PDFs' }},
        {{ id: 'applicant-correction-window', name: '12. Ventana Temporal Corrección' }},
        {{ id: 'applicant-account', name: '13. Perfil y Seguridad' }}
      ] : [
        {{ id: 'admin-dashboard', name: '1. Inicio Técnico / Dashboard' }},
        {{ id: 'admin-calls', name: '2. Convocatorias y Editor Parámetros' }},
        {{ id: 'admin-users', name: '3. Usuarios Externos' }},
        {{ id: 'admin-catalogues', name: '4. Configuración Web Catálogos' }},
        {{ id: 'admin-expediente-review', name: '5. Revisión Técnica de Expediente' }},
        {{ id: 'admin-rag-assistant', name: '6. Asistencia RAG Normativa' }},
        {{ id: 'admin-reports', name: '7. Reportes y Exportación' }},
        {{ id: 'admin-audit', name: '8. Auditoría de Seguridad' }},
        {{ id: 'admin-roles', name: '9. Roles y Permisos' }}
      ];

      views.forEach(v => {{
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        select.appendChild(opt);
      }});
      select.value = state.currentView;
    }}

    function renderSGASQuestions() {{
      const container = document.getElementById('sgas-questions-container');
      container.innerHTML = '';
      sgasQuestions.forEach((q, idx) => {{
        const div = document.createElement('div');
        div.className = 'p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2';
        div.innerHTML = `
          <div class="flex items-start justify-between">
            <span class="font-bold text-slate-900">${{idx + 1}}. ${{q}}</span>
            <div class="flex space-x-3 ml-4">
              <label class="flex items-center font-bold text-emerald-700 cursor-pointer">
                <input type="radio" name="sgas_q_${{idx}}" value="SI" checked class="mr-1 text-emerald-600"> SÍ
              </label>
              <label class="flex items-center font-bold text-red-700 cursor-pointer">
                <input type="radio" name="sgas_q_${{idx}}" value="NO" class="mr-1 text-red-600"> NO
              </label>
            </div>
          </div>
          <input type="text" placeholder="Observación / Justificación breve si aplica..." class="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
        `;
        container.appendChild(div);
      }});
    }}

    function setCnStep(step) {{
      state.cnCurrentStep = step;
      document.querySelectorAll('.cn-step-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById('cn-step-' + step).classList.remove('hidden');

      for (let i = 1; i <= 5; i++) {{
        const btn = document.getElementById('cn-step-btn-' + i);
        if (i === step) {{
          btn.className = 'px-3 py-2 rounded-xl font-bold bg-teal-600 text-white whitespace-nowrap shadow';
        }} else {{
          btn.className = 'px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap';
        }}
      }}
      document.getElementById('cn-step-counter-text').textContent = `Paso ${{step}} de 5`;
    }}

    function nextCnStep() {{
      if (state.cnCurrentStep < 5) setCnStep(state.cnCurrentStep + 1);
      else navigateToView('applicant-activities-risks');
    }}

    function prevCnStep() {{
      if (state.cnCurrentStep > 1) setCnStep(state.cnCurrentStep - 1);
      else navigateToView('applicant-info');
    }}

    function updateWordCount(text) {{
      const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
      const badge = document.getElementById('word-count-badge');
      badge.textContent = `Contador: ${{words}} / 500 palabras`;
      if (words > 500) badge.className = 'text-[11px] font-bold text-red-600';
      else badge.className = 'text-[11px] text-slate-500';
    }}

    function renderApplicantExpedientesTable() {{
      const tbody = document.getElementById('applicant-expedientes-tbody');
      tbody.innerHTML = '';
      state.expedientes.forEach(exp => {{
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        let statusBadge = '';
        if (exp.status === 'Enviado') statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold"><i class="fa-solid fa-lock mr-1"></i> Enviado (Bloqueado)</span>';
        else if (exp.status === 'Borrador') statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold"><i class="fa-solid fa-pen mr-1"></i> Borrador</span>';
        else if (exp.status === 'En Corrección') statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold"><i class="fa-solid fa-clock-rotate-left mr-1"></i> Ventana Abierta</span>';

        tr.innerHTML = `
          <td class="p-3 font-mono font-bold text-teal-700">${{exp.id}}</td>
          <td class="p-3 font-medium text-slate-900 max-w-xs truncate">${{exp.title}}</td>
          <td class="p-3">${{exp.category}}</td>
          <td class="p-3 font-semibold">$${{exp.requested.toLocaleString()}} USD</td>
          <td class="p-3">${{statusBadge}}</td>
          <td class="p-3 text-slate-500">${{exp.lastModified}}</td>
          <td class="p-3 text-right">
            ${{exp.status === 'Borrador' ? `<button onclick="navigateToView('applicant-conceptual-note')" class="px-3 py-1 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Continuar &rarr;</button>` : ''}}
            ${{exp.status === 'Enviado' ? `<button onclick="navigateToView('applicant-expediente-view')" class="px-3 py-1 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900">Ver Expediente</button>` : ''}}
            ${{exp.status === 'En Corrección' ? `<button onclick="navigateToView('applicant-correction-window')" class="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Atender Observaciones</button>` : ''}}
          </td>
        `;
        tbody.appendChild(tr);
      }});
    }}

    function renderActivitiesList() {{
      const container = document.getElementById('activities-list-container');
      container.innerHTML = '';
      state.activities.forEach(act => {{
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm';
        let risksHtml = '';
        act.risks.forEach(r => {{
          risksHtml += `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div class="flex justify-between items-start">
                <span class="font-bold text-slate-800"><i class="fa-solid fa-triangle-exclamation text-amber-500 mr-1.5"></i> Riesgo: ${{r.desc}}</span>
                <span class="px-2 py-0.5 rounded badge-medio font-bold">Inicial: Prob ${{r.prob}} &times; Grav ${{r.grav}} = ${{r.prob * r.grav}}</span>
              </div>
              <div class="pl-4 border-l-2 border-teal-500 space-y-1">
                <span class="font-semibold text-teal-800 block"><i class="fa-solid fa-shield-halved mr-1"></i> Medida de Mitigación: ${{r.mitigation}}</span>
                <div class="flex flex-wrap gap-3 text-slate-500 text-[11px]">
                  <span>Responsable: <strong>${{r.resp}}</strong></span>
                  <span>Costo Est: <strong>$${{r.cost.toLocaleString()}} USD</strong></span>
                  <span>Ejecución: <strong>${{r.period}}</strong></span>
                </div>
              </div>
            </div>
          `;
        }});

        card.innerHTML = `
          <div class="flex justify-between items-center border-b border-slate-200 pb-3">
            <h4 class="font-bold text-sm text-slate-900"><i class="fa-solid fa-list-check text-teal-600 mr-2"></i> Actividad ${{act.id}}: ${{act.name}}</h4>
            <button onclick="alert('Formulario para añadir riesgo a actividad (Simulación)')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border">
              + Añadir Riesgo
            </button>
          </div>
          <div class="space-y-3">
            ${{risksHtml}}
          </div>
        `;
        container.appendChild(card);
      }});
    }}

    function renderUlfMatrix() {{
      const tbody = document.getElementById('ulf-matrix-tbody');
      tbody.innerHTML = '';
      state.activities.forEach(act => {{
        act.risks.forEach(r => {{
          const scoreInit = r.prob * r.grav;
          let badgeInit = 'badge-bajo';
          let levelInitText = 'BAJO';
          if (scoreInit >= 17) {{ badgeInit = 'badge-muy-alto'; levelInitText = 'MUY ALTO'; }}
          else if (scoreInit >= 10) {{ badgeInit = 'badge-alto'; levelInitText = 'ALTO'; }}
          else if (scoreInit >= 5) {{ badgeInit = 'badge-medio'; levelInitText = 'MEDIO'; }}

          const scoreMit = r.mitProb * r.mitGrav;
          let badgeMit = 'badge-bajo';
          let levelMitText = 'BAJO';
          if (scoreMit >= 17) {{ badgeMit = 'badge-muy-alto'; levelMitText = 'MUY ALTO'; }}
          else if (scoreMit >= 10) {{ badgeMit = 'badge-alto'; levelMitText = 'ALTO'; }}
          else if (scoreMit >= 5) {{ badgeMit = 'badge-medio'; levelMitText = 'MEDIO'; }}

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50';
          tr.innerHTML = `
            <td class="p-2.5 border-r border-slate-200 font-semibold text-slate-900">${{act.name}}</td>
            <td class="p-2.5 border-r border-slate-200">${{r.desc}}</td>
            <td class="p-2.5 border-r border-slate-200 text-slate-500">Riesgo socioambiental identificado en campo</td>
            <td class="p-2.5 border-r border-slate-200 text-center font-mono font-bold">${{r.prob}}</td>
            <td class="p-2.5 border-r border-slate-200 text-center font-mono font-bold">${{r.grav}}</td>
            <td class="p-2.5 border-r border-slate-200 text-center">
              <span class="px-2 py-0.5 rounded ${{badgeInit}} font-bold">${{scoreInit}} (${{levelInitText}})</span>
            </td>
            <td class="p-2.5 border-r border-slate-200 font-medium text-teal-800">${{r.mitigation}}</td>
            <td class="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-teal-700">${{r.mitProb}}</td>
            <td class="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-teal-700">${{r.mitGrav}}</td>
            <td class="p-2.5 border-r border-slate-200 text-center">
              <span class="px-2 py-0.5 rounded ${{badgeMit}} font-bold">${{scoreMit}} (${{levelMitText}})</span>
            </td>
            <td class="p-2.5 border-r border-slate-200 text-slate-600">
              <strong>${{r.location}}</strong><br>
              ${{r.resp}} | $${{r.cost.toLocaleString()}} | ${{r.period}}
            </td>
          `;
          tbody.appendChild(tr);
        }});
      }});
    }}

    function renderAdminDashboardTable() {{
      const tbody = document.getElementById('admin-expedientes-dashboard-tbody');
      tbody.innerHTML = '';
      state.expedientes.forEach(exp => {{
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="p-3 font-mono font-bold text-teal-700">${{exp.id}}</td>
          <td class="p-3 font-semibold text-slate-900">${{exp.applicant}}<br><span class="text-[11px] text-slate-500 font-normal">RUC: ${{exp.ruc}}</span></td>
          <td class="p-3">${{exp.category}}</td>
          <td class="p-3"><span class="px-2.5 py-0.5 rounded badge-medio font-bold">Residual: ${{exp.riskLevel}}</span></td>
          <td class="p-3"><span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">${{exp.status}}</span></td>
          <td class="p-3 text-right">
            <button onclick="navigateToView('admin-expediente-review')" class="px-3 py-1 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Revisar &rarr;</button>
          </td>
        `;
        tbody.appendChild(tr);
      }});
    }}

    function openPDFModal(type) {{
      const modal = document.getElementById('pdf-modal');
      const title = document.getElementById('pdf-modal-title');
      const body = document.getElementById('pdf-modal-body');
      const activeExp = state.expedientes[0];

      modal.classList.remove('hidden');

      if (type === 'conceptual') {{
        title.textContent = `NOTA CONCEPTUAL COMPLETA - ${{activeExp.id}}`;
        body.innerHTML = `
          <div class="bg-white p-8 rounded-xl shadow border border-slate-300 space-y-6 text-slate-900 max-w-2xl mx-auto">
            <div class="flex justify-between items-start border-b border-slate-300 pb-4">
              <div>
                <img src="${{GLF_LOGO_WHITE}}" alt="GLF Logo" class="h-10 object-contain mb-2">
                <h2 class="font-extrabold text-base uppercase tracking-wider text-slate-800">DOCUMENTO OFICIAL DE NOTA CONCEPTUAL</h2>
                <span class="text-xs text-slate-500">Galapagos Life Fund - Convocatoria 2026-I</span>
              </div>
              <div class="text-right">
                <div class="w-20 h-20 bg-slate-900 p-1.5 rounded-lg flex items-center justify-center text-white text-center text-[9px] leading-tight font-mono border">
                  [ QR SEGURO DE VERIFICACIÓN GLF ]
                </div>
                <span class="text-[10px] text-slate-500 block mt-1">ID: ${{activeExp.id}}</span>
              </div>
            </div>

            <div class="space-y-3">
              <h3 class="font-bold text-sm bg-slate-100 p-2 rounded text-teal-800 border">I. INFORMACIÓN GENERAL</h3>
              <p><strong>Título:</strong> ${{activeExp.title}}</p>
              <p><strong>Solicitante:</strong> ${{activeExp.applicant}} (RUC: ${{activeExp.ruc}})</p>
              <p><strong>Categoría:</strong> ${{activeExp.category}} | <strong>Presupuesto GLF:</strong> $${{activeExp.requested.toLocaleString()}} USD</p>
            </div>

            <div class="space-y-3">
              <h3 class="font-bold text-sm bg-slate-100 p-2 rounded text-teal-800 border">II. DESCRIPCIÓN Y OBJETIVOS</h3>
              <p><strong>Resumen Ejecutado:</strong> Restauración activa de 5 hectáreas de manglar en Bahía Rosa Blanca...</p>
            </div>

            <div class="text-[10px] text-slate-400 border-t border-slate-200 pt-4 text-center">
              Este documento fue generado por el sistema GLF. El código QR redirige a la página segura de verificación institucional y no expone datos personales públicamente.
            </div>
          </div>
        `;
      }} else {{
        title.textContent = `MATRIZ DE RIESGOS Y SALVAGUARDAS (ULF) - ${{activeExp.id}}`;
        body.innerHTML = `
          <div class="bg-white p-8 rounded-xl shadow border border-slate-300 space-y-6 text-slate-900 max-w-3xl mx-auto">
            <div class="flex justify-between items-start border-b border-slate-300 pb-4">
              <div>
                <img src="${{GLF_LOGO_WHITE}}" alt="GLF Logo" class="h-10 object-contain mb-2">
                <h2 class="font-extrabold text-base uppercase tracking-wider text-slate-800">MATRIZ DE RIESGOS Y SALVAGUARDAS AMBIENTALES Y SOCIALES</h2>
                <span class="text-xs text-slate-500">Evaluación Oficial con Reglas Transparentes</span>
              </div>
              <div class="text-right">
                <div class="w-20 h-20 bg-slate-900 p-1.5 rounded-lg flex items-center justify-center text-white text-center text-[9px] leading-tight font-mono border">
                  [ QR SEGURO DE VERIFICACIÓN GLF ]
                </div>
                <span class="text-[10px] text-slate-500 block mt-1">ID: ${{activeExp.id}}</span>
              </div>
            </div>

            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-bold">
              Resultado Calificado: Nivel Residual MEDIO | Categoría 6
            </div>

            <div class="text-[10px] text-slate-400 border-t border-slate-200 pt-4 text-center">
              Matriz de Ulf generada conforme a la especificación normativa oficial del GLF.
            </div>
          </div>
        `;
      }}
    }}

    function closePDFModal() {{
      document.getElementById('pdf-modal').classList.add('hidden');
    }}

    function grantCorrectionWindowModal() {{
      document.getElementById('grant-correction-modal').classList.remove('hidden');
    }}

    function closeGrantCorrectionModal() {{
      document.getElementById('grant-correction-modal').classList.add('hidden');
    }}

    function confirmGrantCorrectionWindow() {{
      const obs = document.getElementById('grant-obs-text').value;
      const expiry = document.getElementById('grant-expiry-datetime').value;

      state.expedientes[0].status = 'En Corrección';
      state.expedientes[0].correctionActive = true;
      state.expedientes[0].correctionExpiry = expiry;
      state.expedientes[0].correctionObs = obs;

      closeGrantCorrectionModal();
      showAlert('Ventana Temporal de Corrección Autorizada', `Se ha habilitado la edición para el expediente hasta el ${{expiry}}. Notificación enviada al aplicante.`, 'info');
      renderApplicantExpedientesTable();
      renderAdminDashboardTable();

      document.getElementById('correction-banner-in-view').classList.remove('hidden');
    }}

    function submitFinalExpediente() {{
      if (!document.getElementById('chk-declaration').checked) {{
        alert('Debe aceptar la declaración jurada antes de enviar.');
        return;
      }}
      state.expedientes[0].status = 'Enviado';
      state.expedientes[0].lastModified = new Date().toLocaleString();
      showAlert('Expediente Enviado con Éxito', 'Su expediente ha sido remitido al GLF y ha quedado bloqueado para edición directa.', 'success');
      renderApplicantExpedientesTable();
      renderAdminDashboardTable();
      navigateToView('applicant-expediente-view');
    }}

    function resubmitCorrectionExpediente() {{
      state.expedientes[0].status = 'Enviado';
      state.expedientes[0].correctionActive = false;
      document.getElementById('correction-banner-in-view').classList.add('hidden');
      showAlert('Expediente Re-enviado', 'Las correcciones han sido remitidas a la mesa técnica del GLF.', 'success');
      renderApplicantExpedientesTable();
      renderAdminDashboardTable();
      navigateToView('applicant-expediente-view');
    }}

    function recalcBudgetSummaryTable() {{
      const glfInputs = document.querySelectorAll('.b-input-glf');
      const cofInputs = document.querySelectorAll('.b-input-cof');

      let totGlf = 0;
      let totCof = 0;

      glfInputs.forEach(inp => totGlf += (parseFloat(inp.value) || 0));
      cofInputs.forEach(inp => totCof += (parseFloat(inp.value) || 0));

      const adminGlf = parseFloat(document.getElementById('b-admin-glf').value) || 0;
      const adminCof = parseFloat(document.getElementById('b-admin-cof').value) || 0;
      const adminTot = adminGlf + adminCof;

      totGlf += adminGlf;
      totCof += adminCof;

      const grandTotal = totGlf + totCof;
      const adminPct = grandTotal > 0 ? ((adminTot / grandTotal) * 100).toFixed(1) : '0.0';

      document.getElementById('table-tot-glf').textContent = '$' + totGlf.toLocaleString();
      document.getElementById('table-tot-cof').textContent = '$' + totCof.toLocaleString();
      document.getElementById('table-tot-grand').textContent = '$' + grandTotal.toLocaleString();

      const pctEl = document.getElementById('row-pct-5');
      if (parseFloat(adminPct) <= 10.0) {{
        pctEl.className = 'p-2.5 text-right font-bold text-amber-900';
        pctEl.innerHTML = `${{adminPct}}% <i class="fa-solid fa-check text-emerald-600"></i>`;
      }} else {{
        pctEl.className = 'p-2.5 text-right font-bold text-red-600';
        pctEl.innerHTML = `${{adminPct}}% <i class="fa-solid fa-triangle-exclamation text-red-600"></i> Excede 10%`;
      }}
    }}

    function executeMockRAGQuery() {{
      showAlert('Consulta RAG Procesada', 'Se han obtenido 3 fragmentos de citación con referencia de documento y página.', 'info');
    }}

    function showAlert(title, msg, type) {{
      const banner = document.getElementById('alert-banner');
      const t = document.getElementById('alert-title');
      const m = document.getElementById('alert-message');
      const icon = document.getElementById('alert-icon');

      t.textContent = title;
      m.textContent = msg;

      if (type === 'success') {{
        banner.className = 'rounded-xl p-4 border bg-emerald-50 border-emerald-200 text-emerald-900 text-sm flex items-start justify-between shadow-sm';
        icon.className = 'fa-solid fa-circle-check mt-0.5 text-lg text-emerald-600';
      }} else {{
        banner.className = 'rounded-xl p-4 border bg-indigo-50 border-indigo-200 text-indigo-900 text-sm flex items-start justify-between shadow-sm';
        icon.className = 'fa-solid fa-circle-info mt-0.5 text-lg text-indigo-600';
      }}
      banner.classList.remove('hidden');
      window.scrollTo({{ top: 0, behavior: 'smooth' }});
    }}

    function hideAlert() {{
      document.getElementById('alert-banner').classList.add('hidden');
    }}

    function resetDemoData() {{
      if (confirm('¿Restablecer los datos de demostración a su estado inicial?')) {{
        location.reload();
      }}
    }}

    function downloadMockPDF(filename) {{
      alert(`Descargando archivo simulado: ${{filename}}`);
    }}
  </script>
</body>
</html>
'''

with open(target_html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Successfully generated prototype at: {target_html_path}")
