"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Filter,
  Globe2,
  Leaf,
  LockKeyhole,
  LogIn,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";

type Screen =
  | "home"
  | "applicant"
  | "application"
  | "staff"
  | "review"
  | "calls"
  | "committee"
  | "phase2"
  | "contracts"
  | "reports"
  | "rag";
type Role =
  | "grants_manager"
  | "sustainability_reviewer"
  | "project_coordinator"
  | "committee_member";
type Risk = {
  id: number;
  activity: string;
  dimension: "ambiental" | "social";
  risk: string;
  probability: number;
  severity: number;
  measures: string;
  residualProbability: number;
  residualSeverity: number;
  location: string;
  cost: string;
  responsible: string;
  start: string;
  end: string;
};

const copy = {
  es: {
    navCalls: "Convocatorias",
    navHow: "Cómo postular",
    signIn: "Ingresar",
    staff: "Personal GLF",
    demo: "Demostración · no ingrese datos reales",
    heroTag: "Convocatoria demostrativa",
    heroTitle: "Ideas locales para conservar Galápagos",
    heroText:
      "Prepare su Nota Conceptual y la matriz de riesgos y salvaguardas en un solo expediente, con guía paso a paso y guardado de borrador.",
    start: "Iniciar postulación",
    requirements: "Ver requisitos",
    open: "Convocatoria abierta",
    days: "Cierre demostrativo · 30 días",
    small: "Pequeña",
    medium: "Mediana",
    large: "Grande",
    upTo: "Hasta",
    from: "Desde",
    months: "meses",
    max: "plazo máximo",
    cofinance: "Cofinanciamiento según bases de convocatoria.",
    processTitle: "Un proceso claro, en dos fases",
    phase1: "1 · Nota Conceptual",
    phase1Text:
      "Todas las personas y organizaciones admitidas por la convocatoria pueden preparar su idea y evaluación preliminar de riesgos.",
    phase2: "2 · Proyecto completo",
    phase2Text:
      "Solo los postulantes invitados por decisión documentada del comité acceden a esta fase.",
    human:
      "Las decisiones de evaluación y selección corresponden al personal y a las instancias del GLF.",
    footer: "Galápagos Life Fund · Portal de postulación",
    portal: "Portal de postulantes",
    dashboard: "Mis postulaciones",
    newApplication: "Nueva postulación",
    continue: "Continuar borrador",
    view: "Ver convocatoria",
    saved: "Guardado en este navegador",
    saveInfo:
      "La demostración guarda el borrador localmente. Conecte Supabase antes de usar datos personales.",
    formTitle: "Nota Conceptual y matriz de salvaguardas",
    step: "Paso",
    of: "de",
    back: "Anterior",
    next: "Continuar",
    saveDraft: "Guardar borrador",
    reviewSend: "Revisar y enviar",
    call: "Convocatoria",
    applicantType: "Tipo de aplicante",
    individual: "Persona natural",
    organization: "Organización",
    projectTitle: "Título del proyecto",
    island: "Isla principal",
    summary: "Resumen del proyecto",
    objectives: "Objetivo general y objetivos específicos",
    beneficiaries: "Beneficiarios y contribuciones a medios de vida",
    results: "Resultados e indicadores de impacto esperados",
    activities: "Actividades principales",
    schedule: "Duración y principales fechas",
    sustainability: "Sostenibilidad y replicabilidad",
    alignment: "Alineación estratégica",
    evaluation: "Seguimiento y evaluación propuesta",
    socialRisks: "Riesgos sociales potenciales",
    environmentalRisks: "Riesgos ambientales potenciales",
    budget: "Presupuesto resumido solicitado al GLF (USD)",
    cofinanceAmount: "Cofinanciamiento indicativo (USD)",
    riskBlock: "Matriz de riesgos y salvaguardas de Ulf",
    riskHelp:
      "Vincule cada riesgo con una actividad. Los puntajes se calculan con la matriz; la valoración del aplicante será revisada por GLF.",
    addRisk: "Agregar riesgo",
    activity: "Actividad",
    risk: "Riesgo o impacto",
    dimension: "Dimensión",
    probability: "Probabilidad",
    severity: "Gravedad",
    score: "Puntaje inicial",
    level: "Nivel",
    measures: "Salvaguardas o medidas propuestas",
    residual: "Valoración residual después de las medidas",
    location: "Ubicación",
    cost: "Costo estimado USD",
    responsible: "Responsable",
    quarterStart: "Inicio previsto",
    quarterEnd: "Fin previsto",
    riskDuration: "Duración",
    quarters: "trimestres",
    proposed: "Medida propuesta por el aplicante · pendiente de validación GLF",
    noCatalog:
      "El catálogo oficial de medidas está pendiente de validación. Describa la acción propuesta.",
    review: "Resumen de postulación",
    conceptPdf: "Descargar Nota Conceptual PDF",
    matrixPdf: "Descargar matriz PDF",
    submit: "Enviar a GLF",
    submitInfo:
      "Al enviar, esta versión queda bloqueada. GLF puede autorizar una reapertura registrada para corregirla antes del cierre.",
    sent: "Postulación de demostración enviada",
    notConnected:
      "En una versión desplegada, el envío se guardará en Supabase con autenticación y trazabilidad.",
    applicantRows: "Postulaciones",
    statusDraft: "Borrador",
    statusReceived: "Recibida",
    statusReview: "En revisión",
    statusSelected: "Invitada a Fase 2",
    phaseTwo: "Propuesta completa",
    phases: "Fases",
    staffWorkspace: "Panel interno GLF",
    role: "Vista de rol",
    grantsManager: "Paulina · Convocatorias y subvenciones",
    sustainabilityReviewer: "Ulf · Sostenibilidad",
    coordinator: "Gabriela · Coordinación de proyectos · San Cristóbal",
    committeeRole: "Comité / consejo",
    overview: "Resumen",
    applications: "Expedientes",
    safeguards: "Revisión A&S",
    callsAdmin: "Convocatorias",
    decisions: "Comité y decisiones",
    proposals: "Fase 2",
    agreements: "Contratos",
    reporting: "Reportería",
    rag: "Asistente RAG",
    search: "Buscar expediente o proyecto",
    tasks: "Pendiente de mi área",
    openTask: "Abrir expediente",
    all: "Todos",
    filter: "Filtros",
    received: "Recibidas",
    selected: "Seleccionadas para Fase 2",
    signedContracts: "Contratos firmados",
    amountSigned: "Monto contratado firmado",
    notQualified: "No avanzan / no calificadas",
    expectedIndicators: "Indicadores esperados informados",
    notImpact: "Metas declaradas en propuestas; no son impactos verificados.",
    funnel: "Embudo de convocatoria",
    stage: "Etapa",
    count: "Cantidad",
    amount: "Monto GLF",
    byType: "Por tipo de proyecto",
    exportCsv: "Exportar reporte CSV",
    reportInternal:
      "Reporte interno de cierre para el equipo de Comunicación. El sistema no publica ni redacta noticias.",
    callsTitle: "Gestión de convocatorias",
    createCall: "Crear convocatoria",
    editParams: "Editar parámetros",
    dates: "Fechas",
    categories: "Categorías y montos",
    requirementFiles: "Requisitos y anexos",
    version: "Versión de reglas",
    save: "Guardar cambios",
    projectCommittee: "Decisiones de comité",
    recommendation: "Recomendación del CAT",
    resolution: "Resolución de comité / consejo",
    invitation: "Invitar a Fase 2",
    approve: "Aprobar propuesta completa",
    contract: "Registrar contrato",
    signedDate: "Fecha de firma",
    signedAmount: "Monto firmado",
    confirmed: "Decisión registrada por persona autorizada",
    distinction:
      "Invitación, aprobación y firma de contrato son hitos distintos.",
    phase2Title: "Propuestas completas invitadas",
    invite: "Invitada",
    pendingReview: "Revisión de propuesta completa",
    config: "Formulario parametrizable por GLF",
    configInfo:
      "El formato oficial completo de proyecto debe definir aquí los campos y anexos antes de exigirlos.",
    signed: "Firmado",
    pending: "Pendiente",
    status: "Estado",
    assigned: "Responsable interno",
    noExec: "El seguimiento de ejecución se diseñará en un sistema futuro.",
    ragTitle:
      "Asistente RAG para identificar riesgos y salvaguardas ambientales y sociales en proyectos financiados por el GLF (Galapagos Life Fund)",
    ragStatus: "Servicio local E5 · no conectado",
    ragInfo:
      "El modelo E5 debe ejecutarse en un equipo autorizado del GLF. Esta pantalla no envía información a un modelo ni genera decisiones automáticas.",
    query: "Consulta una norma o un riesgo…",
    retrieve: "Buscar evidencia",
    noModel:
      "Al conectar el servicio local, se mostrarán fragmentos con documento, página o sección. La persona especialista decide si aplican.",
    staffOnly: "Acceso interno GLF",
    authInfo:
      "La autenticación y los roles reales se activarán al configurar Supabase.",
    access: "Entrar al portal",
    close: "Cerrar sesión demo",
    welcome: "Bienvenido al Portal GLF",
    example: "Datos completamente ficticios para visualizar el flujo.",
    projectType: "Tipo de proyecto",
    organizationName: "Nombre de organización / proponente",
    duration: "Duración solicitada (meses)",
    adminShare: "Gastos administrativos",
    adminMax:
      "Los gastos administrativos no pueden exceder el 10% del costo total según el formato de Nota Conceptual revisado.",
    stageSelection: "Selección para Fase 2",
    stageApproved: "Aprobada",
    contractSigned: "Contrato firmado",
    total: "Total",
    projects: "Proyectos",
    phase1Received: "Nota Conceptual recibida",
    phase1Selected: "Invitación Fase 2",
    phase2Received: "Propuesta completa recibida",
    approved: "Aprobada para subvención",
    contracted: "Contrato firmado",
    applicantName: "Proponente demo",
    committeeNote:
      "Registrar recomendación, acta o resolución de la instancia competente.",
    reviewerNote: "Observación técnica para el aplicante",
    sendObservation: "Guardar observación",
    positive: "Riesgos vinculados a actividades",
    negative: "Riesgo sin actividad asociada",
    portfolio: "Cartera y seguimiento de casos",
    dataSource:
      "Con datos conectados, estas vistas leen las tablas protegidas de Supabase.",
    configure: "Configuración necesaria",
    settings: "Parámetros institucionales",
    reportPeriod: "Periodo de convocatoria",
    year: "Año",
    showAll: "Ver expediente",
    privacy: "Privacidad",
    statusNote: "Este estado no equivale a aprobación o selección.",
    reportHeading: "Cierre de convocatoria y resultados de selección",
    totalReceived: "Total de expedientes recibidos",
    lowRisk: "Puntajes de riesgo por dimensión",
    committeeQueue: "Casos para decisión humana",
    noDecisions: "No se tomará ninguna decisión automática.",
    home: "Inicio",
    backHome: "Volver al portal",
  },
  en: {
    navCalls: "Calls",
    navHow: "How to apply",
    signIn: "Sign in",
    staff: "GLF staff",
    demo: "Demonstration · do not enter real data",
    heroTag: "Demonstration call",
    heroTitle: "Local ideas to conserve Galápagos",
    heroText:
      "Prepare your Concept Note and environmental and social risk matrix in one file, with step-by-step guidance and draft saving.",
    start: "Start application",
    requirements: "View requirements",
    open: "Open call",
    days: "Demonstration deadline · 30 days",
    small: "Small",
    medium: "Medium",
    large: "Large",
    upTo: "Up to",
    from: "From",
    months: "months",
    max: "maximum term",
    cofinance: "Co-financing depends on the call rules.",
    processTitle: "A clear process in two phases",
    phase1: "1 · Concept Note",
    phase1Text:
      "All applicant types accepted by the call can prepare their concept and preliminary risk assessment.",
    phase2: "2 · Full proposal",
    phase2Text:
      "Only applicants invited through a documented committee decision can access this phase.",
    human:
      "GLF staff and governing bodies make all assessment and selection decisions.",
    footer: "Galápagos Life Fund · Application Portal",
    portal: "Applicant portal",
    dashboard: "My applications",
    newApplication: "New application",
    continue: "Continue draft",
    view: "View call",
    saved: "Saved in this browser",
    saveInfo:
      "This demo saves the draft locally. Connect Supabase before using personal data.",
    formTitle: "Concept Note and safeguards matrix",
    step: "Step",
    of: "of",
    back: "Back",
    next: "Continue",
    saveDraft: "Save draft",
    reviewSend: "Review and submit",
    call: "Call",
    applicantType: "Applicant type",
    individual: "Individual",
    organization: "Organization",
    projectTitle: "Project title",
    island: "Main island",
    summary: "Project summary",
    objectives: "Overall and specific objectives",
    beneficiaries: "Beneficiaries and livelihood contribution",
    results: "Expected results and impact indicators",
    activities: "Main activities",
    schedule: "Duration and main dates",
    sustainability: "Sustainability and replicability",
    alignment: "Strategic alignment",
    evaluation: "Proposed monitoring and evaluation",
    socialRisks: "Potential social risks",
    environmentalRisks: "Potential environmental risks",
    budget: "GLF amount requested (USD)",
    cofinanceAmount: "Indicative co-financing (USD)",
    riskBlock: "Ulf risk and safeguards matrix",
    riskHelp:
      "Link each risk to an activity. Scores follow the matrix; GLF will review the applicant's assessment.",
    addRisk: "Add risk",
    activity: "Activity",
    risk: "Risk or impact",
    dimension: "Dimension",
    probability: "Probability",
    severity: "Severity",
    score: "Initial score",
    level: "Level",
    measures: "Proposed safeguards or measures",
    residual: "Residual rating after measures",
    location: "Location",
    cost: "Estimated cost USD",
    responsible: "Responsible person",
    quarterStart: "Planned start",
    quarterEnd: "Planned end",
    riskDuration: "Duration",
    quarters: "quarters",
    proposed: "Applicant-proposed measure · pending GLF validation",
    noCatalog:
      "The official measures catalogue is pending validation. Describe the proposed action.",
    review: "Application summary",
    conceptPdf: "Download Concept Note PDF",
    matrixPdf: "Download safeguards matrix PDF",
    submit: "Submit to GLF",
    submitInfo:
      "After submission, this version is locked. GLF may authorize and record reopening for corrections before the deadline.",
    sent: "Demo application submitted",
    notConnected:
      "When deployed, submissions will be saved in Supabase with authentication and an audit trail.",
    applicantRows: "Applications",
    statusDraft: "Draft",
    statusReceived: "Received",
    statusReview: "Under review",
    statusSelected: "Invited to Phase 2",
    phaseTwo: "Full proposal",
    phases: "Phases",
    staffWorkspace: "GLF internal workspace",
    role: "Role view",
    grantsManager: "Paulina · Calls and grants",
    sustainabilityReviewer: "Ulf · Sustainability",
    coordinator: "Gabriela · Project coordination · San Cristóbal",
    committeeRole: "Committee / board",
    overview: "Overview",
    applications: "Cases",
    safeguards: "E&S review",
    callsAdmin: "Calls",
    decisions: "Committee decisions",
    proposals: "Phase 2",
    agreements: "Contracts",
    reporting: "Reporting",
    rag: "RAG assistant",
    search: "Search case or project",
    tasks: "My team's queue",
    openTask: "Open case",
    all: "All",
    filter: "Filters",
    received: "Received",
    selected: "Selected for Phase 2",
    signedContracts: "Signed contracts",
    amountSigned: "Signed contract amount",
    notQualified: "Not advanced / not qualified",
    expectedIndicators: "Expected indicators submitted",
    notImpact: "Targets reported in proposals; these are not verified impacts.",
    funnel: "Call funnel",
    stage: "Stage",
    count: "Count",
    amount: "GLF amount",
    byType: "By project type",
    exportCsv: "Export CSV report",
    reportInternal:
      "Internal closing report for Communications. The system does not publish or write news.",
    callsTitle: "Call management",
    createCall: "Create call",
    editParams: "Edit parameters",
    dates: "Dates",
    categories: "Categories and amounts",
    requirementFiles: "Requirements and attachments",
    version: "Rules version",
    save: "Save changes",
    projectCommittee: "Committee decisions",
    recommendation: "Technical Committee recommendation",
    resolution: "Committee / board resolution",
    invitation: "Invite to Phase 2",
    approve: "Approve full proposal",
    contract: "Record contract",
    signedDate: "Signature date",
    signedAmount: "Signed amount",
    confirmed: "Decision recorded by an authorized person",
    distinction:
      "Invitation, approval, and contract signing are separate milestones.",
    phase2Title: "Invited full proposals",
    invite: "Invited",
    pendingReview: "Full proposal review",
    config: "Configurable form managed by GLF",
    configInfo:
      "The official full project format must define fields and attachments here before they are required.",
    signed: "Signed",
    pending: "Pending",
    status: "Status",
    assigned: "Internal owner",
    noExec:
      "Project implementation tracking will be designed in a future system.",
    ragTitle:
      "RAG Assistant for identifying environmental and social risks and safeguards in GLF-funded projects (Galapagos Life Fund)",
    ragStatus: "Local E5 service · not connected",
    ragInfo:
      "The E5 model must run on an authorized GLF computer. This screen does not send data to a model or make automated decisions.",
    query: "Search a standard or risk…",
    retrieve: "Retrieve evidence",
    noModel:
      "Once connected, results will show document, page, or section. The specialist decides whether they apply.",
    staffOnly: "GLF staff only",
    authInfo:
      "Live authentication and roles will activate when Supabase is configured.",
    access: "Open portal",
    close: "Exit demo",
    welcome: "Welcome to the GLF Portal",
    example: "All sample data is fictitious and illustrates the workflow.",
    projectType: "Project type",
    organizationName: "Organization / applicant name",
    duration: "Requested term (months)",
    adminShare: "Administrative expenses",
    adminMax:
      "Administrative expenses may not exceed 10% of total project costs under the reviewed Concept Note form.",
    stageSelection: "Selected for Phase 2",
    stageApproved: "Approved",
    contractSigned: "Contract signed",
    total: "Total",
    projects: "Projects",
    phase1Received: "Concept Note received",
    phase1Selected: "Phase 2 invitation",
    phase2Received: "Full proposal received",
    approved: "Grant approved",
    contracted: "Contract signed",
    applicantName: "Demo applicant",
    committeeNote:
      "Record the recommendation, minutes, or resolution of the competent body.",
    reviewerNote: "Technical note for the applicant",
    sendObservation: "Save observation",
    positive: "Risks linked to activities",
    negative: "Risk without linked activity",
    portfolio: "Portfolio and case coordination",
    dataSource:
      "With live connection, these views read protected Supabase tables.",
    configure: "Configuration needed",
    settings: "Institutional parameters",
    reportPeriod: "Call period",
    year: "Year",
    showAll: "Open case",
    privacy: "Privacy",
    statusNote: "This status does not mean approval or selection.",
    reportHeading: "Call close and selection results",
    totalReceived: "Total cases received",
    lowRisk: "Risk scores by dimension",
    committeeQueue: "Cases awaiting human decision",
    noDecisions: "No automated decisions will be made.",
    home: "Home",
    backHome: "Back to portal",
  },
} as const;

const quarters = [
  "Año 1 - T1",
  "Año 1 - T2",
  "Año 1 - T3",
  "Año 1 - T4",
  "Año 2 - T1",
  "Año 2 - T2",
  "Año 2 - T3",
  "Año 2 - T4",
  "Año 3 - T1",
  "Año 3 - T2",
  "Año 3 - T3",
  "Año 3 - T4",
];
const applicants = [
  {
    id: "GLF-26-014",
    name: "Asociación Demo Azul",
    title: "Restauración de hábitat costero",
    phase: "Fase 1 · Nota Conceptual",
    status: "En revisión",
    type: "Conservación marina",
    requested: 85000,
    role: "sustainability_reviewer" as Role,
    sum: 18,
  },
  {
    id: "GLF-26-021",
    name: "Iniciativa Demo Isabela",
    title: "Ciencia comunitaria y monitoreo",
    phase: "Fase 1 · Nota Conceptual",
    status: "Selección registrada",
    type: "Educación y comunidad",
    requested: 118000,
    role: "grants_manager" as Role,
    sum: 12,
  },
  {
    id: "GLF-26-026",
    name: "Fundación Demo Pacífico",
    title: "Gestión sostenible de residuos",
    phase: "Fase 2 · Proyecto completo",
    status: "Invitada",
    type: "Economía azul",
    requested: 245000,
    role: "project_coordinator" as Role,
    sum: 31,
  },
  {
    id: "GLF-26-031",
    name: "Colectivo Demo Chatham",
    title: "Protección de áreas de anidación",
    phase: "Fase 2 · Proyecto completo",
    status: "Contrato firmado",
    type: "Conservación marina",
    requested: 96000,
    role: "committee_member" as Role,
    sum: 9,
  },
];

const navItems: {
  id: Screen;
  label: keyof typeof copy.es;
  icon: typeof Leaf;
}[] = [
  { id: "staff", label: "overview", icon: BarChart3 },
  { id: "review", label: "safeguards", icon: ShieldCheck },
  { id: "calls", label: "callsAdmin", icon: CalendarDays },
  { id: "committee", label: "decisions", icon: ClipboardCheck },
  { id: "phase2", label: "proposals", icon: FileText },
  { id: "contracts", label: "agreements", icon: WalletCards },
  { id: "reports", label: "reporting", icon: BarChart3 },
  { id: "rag", label: "rag", icon: Sparkles },
];

function score(probability: number, severity: number) {
  return probability * severity;
}
function level(value: number) {
  return value <= 4
    ? "BAJO"
    : value <= 9
      ? "MEDIO"
      : value <= 15
        ? "ALTO"
        : "MUY ALTO";
}
function money(value: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function initialRisk(id = 1): Risk {
  return {
    id,
    activity: "",
    dimension: "ambiental",
    risk: "",
    probability: 2,
    severity: 2,
    measures: "",
    residualProbability: 1,
    residualSeverity: 2,
    location: "",
    cost: "",
    responsible: "",
    start: "Año 1 - T1",
    end: "Año 1 - T2",
  };
}

export function PortalApp({
  internal = false,
  role: initialRole = "grants_manager",
}: {
  internal?: boolean;
  role?: Role;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<"es" | "en">(() =>
    typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("en")
      ? "en"
      : "es",
  );
  const [screen, setScreen] = useState<Screen>(internal ? "staff" : "home");
  const [role, setRole] = useState<Role>(initialRole);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [risks, setRisks] = useState<Risk[]>([initialRisk()]);
  const [form, setForm] = useState({
    title: "",
    applicantType: "Organización",
    applicant: "",
    island: "Santa Cruz",
    projectType: "Conservación marina",
    summary: "",
    objectives: "",
    beneficiaries: "",
    results: "",
    activities: "",
    schedule: "",
    sustainability: "",
    alignment: "",
    evaluation: "",
    socialRisks: "",
    environmentalRisks: "",
    requested: "",
    cofinance: "",
    duration: "12",
    admin: "",
  });
  const t = copy[lang];
  const isStaff = [
    "staff",
    "review",
    "calls",
    "committee",
    "phase2",
    "contracts",
    "reports",
    "rag",
  ].includes(screen);
  const activeRoleName =
    role === "sustainability_reviewer"
      ? t.sustainabilityReviewer
      : role === "project_coordinator"
        ? t.coordinator
        : role === "committee_member"
          ? t.committeeRole
          : t.grantsManager;
  const totalRisk = useMemo(
    () => risks.reduce((n, r) => n + score(r.probability, r.severity), 0),
    [risks],
  );
  const completedRisks = useMemo(
    () =>
      risks.filter(
        (r) =>
          r.risk &&
          r.activity &&
          r.location &&
          r.measures &&
          r.cost &&
          r.responsible,
      ).length,
    [risks],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (screen !== "application" || submitted) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem("glf-demo-draft", JSON.stringify({ form, risks }));
      const stamp = new Date().toLocaleTimeString(
        lang === "es" ? "es-EC" : "en-US",
        { hour: "2-digit", minute: "2-digit" },
      );
      setLastSaved(stamp);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, risks, screen, submitted, lang]);

  function changeLang(value: "es" | "en") {
    setLang(value);
    localStorage.setItem("glf-lang", value);
  }
  function updateForm<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateRisk(id: number, key: keyof Risk, value: string | number) {
    setRisks((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [key]: value } as Risk) : r)),
    );
  }
  function addRisk() {
    setRisks((prev) => [
      ...prev,
      initialRisk(Math.max(0, ...prev.map((r) => r.id)) + 1),
    ]);
  }
  function deleteRisk(id: number) {
    setRisks((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : [initialRisk(id)],
    );
  }
  function navigate(id: Screen) {
    setScreen(id);
    setMobileMenu(false);
    setNotice("");
  }

  async function downloadPdf(kind: "concept" | "matrix") {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const navy = rgb(0.08, 0.18, 0.32);
    const teal = rgb(0.0, 0.55, 0.58);
    const pages = [pdf.addPage([595, 842])];
    let page = pages[0];
    let y = 790;
    const clean = (input: string) =>
      input
        .replace(/[\u2010-\u2015]/g, "-")
        .replace(/[\u2022]/g, "•")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"');
    const line = (label: string, value = "") => {
      const text = clean(value ? `${label}: ${value}` : label);
      const wrapped = text.match(/.{1,86}(?:\s|$)/g) || [text];
      for (const row of wrapped) {
        if (y < 72) {
          page = pdf.addPage([595, 842]);
          y = 790;
        }
        page.drawText(row.trim(), {
          x: 52,
          y,
          size: 10,
          font,
          color: rgb(0.12, 0.16, 0.21),
        });
        y -= 17;
      }
    };
    page.drawText("GALÁPAGOS LIFE FUND", {
      x: 52,
      y,
      size: 13,
      font: bold,
      color: navy,
    });
    y -= 34;
    page.drawText(
      kind === "concept"
        ? "NOTA CONCEPTUAL · DEMOSTRACIÓN"
        : "MATRIZ DE RIESGOS Y SALVAGUARDAS · DEMOSTRACIÓN",
      { x: 52, y, size: 15, font: bold, color: teal },
    );
    y -= 34;
    line("Código de expediente", "GLF-DEMO-2026-001");
    if (kind === "concept") {
      line("Convocatoria", "Convocatoria demostrativa GLF");
      line(t.projectTitle, form.title || "Sin completar");
      line(t.applicantName, form.applicant || "Organización de demostración");
      line(t.applicantType, form.applicantType);
      line(t.island, form.island);
      line(t.projectType, form.projectType);
      line(t.duration, `${form.duration} ${t.months}`);
      line(t.budget, form.requested || "0");
      line(t.cofinanceAmount, form.cofinance || "0");
      const fields: [string, string][] = [
        [t.summary, form.summary],
        [t.objectives, form.objectives],
        [t.beneficiaries, form.beneficiaries],
        [t.results, form.results],
        [t.activities, form.activities],
        [t.schedule, form.schedule],
        [t.sustainability, form.sustainability],
        [t.alignment, form.alignment],
        [t.evaluation, form.evaluation],
        [t.socialRisks, form.socialRisks],
        [t.environmentalRisks, form.environmentalRisks],
      ];
      for (const [label, value] of fields) {
        if (value.trim()) {
          y -= 8;
          line(label);
          line(value);
        }
      }
      y -= 12;
      if (y < 200) {
        page = pdf.addPage([595, 842]);
        y = 790;
      }
      page.drawText(
        "Este documento de demostración no es una postulación oficial.",
        { x: 52, y, size: 9, font: bold, color: navy },
      );
      y -= 18;
      page.drawText(
        "El QR de esta versión muestra el flujo visual; la descarga privada con token requiere Supabase.",
        { x: 52, y, size: 8, font, color: navy },
      );
      const qrData = await QRCode.toDataURL(
        `${window.location.origin}/demo-descarga?doc=nota-conceptual`,
      );
      const qr = await pdf.embedPng(await (await fetch(qrData)).arrayBuffer());
      const qrPage = pdf.addPage([595, 842]);
      qrPage.drawText("Recuperación del documento", {
        x: 52,
        y: 770,
        size: 15,
        font: bold,
        color: navy,
      });
      qrPage.drawImage(qr, { x: 52, y: 570, width: 170, height: 170 });
      qrPage.drawText(
        "QR ilustrativo. El enlace privado se habilita al conectar autenticación y almacenamiento Supabase.",
        { x: 52, y: 535, size: 9, font, color: navy, maxWidth: 470 },
      );
    } else {
      line(
        "Nota de uso",
        "Puntajes automáticos según la matriz; validación final humana a cargo de GLF.",
      );
      for (const risk of risks) {
        y -= 14;
        line(t.activity, risk.activity || "Sin completar");
        line(t.dimension, risk.dimension);
        line(t.risk, risk.risk || "Sin completar");
        line(t.probability, String(risk.probability));
        line(t.severity, String(risk.severity));
        line(
          t.score,
          `${score(risk.probability, risk.severity)} · ${level(score(risk.probability, risk.severity))}`,
        );
        line(
          t.measures,
          risk.measures || "Medida propuesta pendiente de validar",
        );
        line(
          t.residual,
          `${score(risk.residualProbability, risk.residualSeverity)} · ${level(score(risk.residualProbability, risk.residualSeverity))}`,
        );
        line(t.location, risk.location || "Sin completar");
        line(t.cost, risk.cost || "0");
        line(t.responsible, risk.responsible || "Sin completar");
        line(t.schedule, `${risk.start} - ${risk.end}`);
        line(
          t.riskDuration,
          `${Math.max(1, quarters.indexOf(risk.end) - quarters.indexOf(risk.start) + 1)} ${t.quarters}`,
        );
      }
      y -= 15;
      line("Suma de puntajes por actividad", String(totalRisk));
      line(
        "Categoría global",
        "Pendiente de confirmación humana; no se aplica una banda total no aprobada.",
      );
      if (y > 70)
        page.drawText(
          "Este archivo es una demostración y no constituye una determinación de cumplimiento.",
          { x: 52, y: y - 8, size: 8, font: bold, color: navy },
        );
    }
    const bytes = await pdf.save();
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      kind === "concept"
        ? "GLF_Nota_Conceptual_DEMO.pdf"
        : "GLF_Matriz_Salvaguardas_DEMO.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportReport() {
    const rows = [
      ["Etapa", "Cantidad", "Monto solicitado USD"],
      [t.phase1Received, "126", "12300000"],
      [t.phase1Selected, "21", "3180000"],
      [t.phase2Received, "13", "2440000"],
      [t.approved, "10", "1860000"],
      [t.contracted, "8", "1520000"],
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "GLF_reporte_cierre_DEMO.csv";
    a.click();
    URL.revokeObjectURL(href);
  }

  const header = (
    <header className="public-header">
      <button
        className="logo-button"
        onClick={() => navigate("home")}
        aria-label={t.home}
      >
        <Image
          src="/glf-logo.png"
          alt="Galápagos Life Fund"
          width={180}
          height={78}
          priority
        />
      </button>
      <nav className="public-nav">
        <button onClick={() => navigate("home")}>{t.navCalls}</button>
        <button onClick={() => navigate("home")}>{t.navHow}</button>
      </nav>
      <div className="header-actions">
        <div className="language-switch" aria-label="Language">
          <button aria-pressed={lang === "es"} onClick={() => changeLang("es")}>
            ES
          </button>
          <button aria-pressed={lang === "en"} onClick={() => changeLang("en")}>
            EN
          </button>
        </div>
        <button
          className="button secondary small"
          onClick={() => navigate("applicant")}
        >
          <LogIn size={15} /> {t.signIn}
        </button>
        <button
          className="button dark small"
          onClick={() => {
            router.push("/internal");
          }}
        >
          <LockKeyhole size={15} /> {t.staff}
        </button>
      </div>
      <button
        className="mobile-menu"
        onClick={() => setMobileMenu((v) => !v)}
        aria-label="Open menu"
      >
        <Menu />
      </button>
    </header>
  );

  if (!isStaff && screen !== "applicant" && screen !== "application")
    return (
      <main className="site-shell">
        {header}
        <div className="demo-banner">
          <ShieldCheck size={15} />
          {t.demo}
        </div>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot" />
              {t.heroTag} <span className="eyebrow-divider">·</span>{" "}
              <span>{t.open}</span>
            </div>
            <h1>{t.heroTitle}</h1>
            <p className="hero-lede">{t.heroText}</p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => navigate("application")}
              >
                <FilePlus2 size={17} /> {t.start}
                <ArrowRight size={16} />
              </button>
              <button
                className="button outline"
                onClick={() =>
                  document
                    .getElementById("requirements")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t.requirements}
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="hero-meta">
              <span>
                <CalendarDays size={15} />
                {t.days}
              </span>
              <span>
                <Globe2 size={15} />
                Galápagos, Ecuador
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-island">
              <span className="island-line" />
              <span className="island-peak" />
              <span className="island-coast" />
              <Leaf className="island-leaf" size={52} />
              <span className="bird bird-a">⌁</span>
              <span className="bird bird-b">⌁</span>
            </div>
            <div className="visual-caption">
              <span className="visual-kicker">GALÁPAGOS</span>
              <span>Conservación, comunidad y futuro</span>
            </div>
            <div className="visual-stat">
              <span>01</span>
              <small>
                Concepto
                <br />
                de proyecto
              </small>
            </div>
          </div>
        </section>
        <section className="grant-section" id="requirements">
          <div className="section-heading">
            <div>
              <div className="section-overline">GLF · FINANCIAMIENTO</div>
              <h2>
                {lang === "es"
                  ? "Categorías de subvención"
                  : "Grant categories"}
              </h2>
            </div>
            <p>
              {lang === "es"
                ? "Los montos, los plazos y los requisitos se configuran para cada convocatoria."
                : "Amounts, terms, and requirements are configured for each call."}
            </p>
          </div>
          <div className="grant-grid">
            <article className="grant-card">
              <span className="grant-index">01</span>
              <span className="grant-name">{t.small}</span>
              <strong>
                {t.upTo} <b>USD 100.000</b>
              </strong>
              <small>12 {t.max}</small>
            </article>
            <article className="grant-card featured">
              <span className="grant-index">02</span>
              <span className="grant-name">{t.medium}</span>
              <strong>
                {t.upTo} <b>USD 250.000</b>
              </strong>
              <small>24 {t.max}</small>
            </article>
            <article className="grant-card">
              <span className="grant-index">03</span>
              <span className="grant-name">{t.large}</span>
              <strong>
                {t.from} <b>USD 250.000</b>
              </strong>
              <small>36 {t.max}</small>
            </article>
          </div>
          <p className="grant-footnote">
            <CircleHelp size={15} /> {t.cofinance}
          </p>
        </section>
        <section className="two-phases">
          <div className="phases-intro">
            <div className="section-overline">
              POSTULACIÓN · REVISIÓN · SELECCIÓN
            </div>
            <h2>{t.processTitle}</h2>
            <p>{t.human}</p>
          </div>
          <div className="phase-cards">
            <article>
              <span className="phase-icon">
                <FileText size={18} />
              </span>
              <div>
                <h3>{t.phase1}</h3>
                <p>{t.phase1Text}</p>
              </div>
            </article>
            <article>
              <span className="phase-icon dark-icon">
                <Users size={18} />
              </span>
              <div>
                <h3>{t.phase2}</h3>
                <p>{t.phase2Text}</p>
              </div>
            </article>
          </div>
        </section>
        <footer className="site-footer">
          <span>{t.footer}</span>
          <span>Salvaguardas · Transparencia · Galápagos</span>
        </footer>
      </main>
    );

  if (screen === "applicant")
    return (
      <main className="site-shell">
        {header}
        <div className="demo-banner">
          <ShieldCheck size={15} />
          {t.demo}
        </div>
        <section className="workspace applicant-workspace">
          <div className="workspace-heading">
            <div>
              <p className="section-overline">{t.portal}</p>
              <h1>{t.dashboard}</h1>
              <p>{t.saveInfo}</p>
            </div>
            <button
              className="button primary"
              onClick={() => {
                setStep(1);
                setSubmitted(false);
                navigate("application");
              }}
            >
              <Plus size={17} />
              {t.newApplication}
            </button>
          </div>
          <article className="call-card">
            <div className="call-top">
              <span className="call-open">
                <span className="status-dot" />
                {t.open}
              </span>
              <span className="muted-label">GLF · 2026 · DEMO</span>
            </div>
            <h2>Convocatoria demostrativa de conservación marina y costera</h2>
            <p>
              {lang === "es"
                ? "Proyectos de conservación de biodiversidad marina, gestión sostenible y adaptación climática basada en ecosistemas."
                : "Marine biodiversity conservation, sustainable management, and ecosystem-based climate adaptation projects."}
            </p>
            <div className="call-params">
              <div>
                <span>{t.small}</span>
                <b>≤ USD 100.000</b>
                <small>12 {t.months}</small>
              </div>
              <div>
                <span>{t.medium}</span>
                <b>≤ USD 250.000</b>
                <small>24 {t.months}</small>
              </div>
              <div>
                <span>{t.large}</span>
                <b>≥ USD 250.000</b>
                <small>36 {t.months}</small>
              </div>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("application")}
            >
              {t.view} <ArrowRight size={15} />
            </button>
          </article>
          <div className="section-heading compact">
            <div>
              <div className="section-overline">GLF-DEMO</div>
              <h2>{t.applicantRows}</h2>
            </div>
            <span className="status-pill neutral">{t.saved}</span>
          </div>
          <article className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>{t.projectTitle}</th>
                    <th>{t.phases}</th>
                    <th>{t.status}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GLF-DEMO-001</td>
                    <td>
                      <strong>
                        {form.title || "Proyecto de conservación (demo)"}
                      </strong>
                      <small>{t.applicantName}</small>
                    </td>
                    <td>Fase 1 · Nota Conceptual</td>
                    <td>
                      <span className="status-pill amber">{t.statusDraft}</span>
                    </td>
                    <td>
                      <button
                        className="button tiny secondary"
                        onClick={() => navigate("application")}
                      >
                        {t.continue}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
          <button className="text-button" onClick={() => navigate("home")}>
            <ArrowLeft size={15} />
            {t.backHome}
          </button>
        </section>
        <footer className="site-footer">
          <span>{t.footer}</span>
          <span>{t.privacy}</span>
        </footer>
      </main>
    );

  if (screen === "application")
    return (
      <main className="site-shell">
        {header}
        <div className="demo-banner">
          <ShieldCheck size={15} />
          {t.demo}
          <span className="banner-separator">·</span>
          {lastSaved ? `${t.saved} ${lastSaved}` : t.saveInfo}
        </div>
        <section className="workspace form-workspace">
          <div className="workspace-heading form-heading">
            <div>
              <button
                className="text-button"
                onClick={() => navigate("applicant")}
              >
                <ArrowLeft size={15} />
                {t.dashboard}
              </button>
              <p className="section-overline">Fase 1 · GLF-DEMO-001</p>
              <h1>{t.formTitle}</h1>
              <p>{t.notConnected}</p>
            </div>
            <span className="status-pill neutral">
              <Clock3 size={13} />
              {t.statusDraft}
            </span>
          </div>
          {submitted && (
            <div className="success-callout">
              <CheckCircle2 />{" "}
              <div>
                <strong>{t.sent}</strong>
                <p>{t.notConnected}</p>
              </div>
            </div>
          )}
          <div className="form-progress">
            <div className="steps-line">
              <span className={step >= 1 ? "done" : ""}>01</span>
              <i />
              <span className={step >= 2 ? "done" : ""}>02</span>
              <i />
              <span className={step >= 3 ? "done" : ""}>03</span>
            </div>
            <div className="steps-caption">
              <strong>
                {t.step} {step} {t.of} 3
              </strong>
              <span>
                {step === 1
                  ? "Datos y narrativa"
                  : step === 2
                    ? "Actividades y riesgos"
                    : t.review}
              </span>
            </div>
          </div>
          {!submitted && (
            <div className="form-card">
              {step === 1 && (
                <div className="form-section">
                  <div className="form-section-head">
                    <span>01</span>
                    <div>
                      <h2>
                        {lang === "es"
                          ? "Información general"
                          : "Project overview"}
                      </h2>
                      <p>
                        {lang === "es"
                          ? "Datos de proponente y descripción del proyecto."
                          : "Applicant information and project description."}
                      </p>
                    </div>
                  </div>
                  <div className="form-grid two">
                    <label>
                      {t.call}
                      <select defaultValue="demo">
                        <option value="demo">
                          Convocatoria demostrativa GLF 2026
                        </option>
                      </select>
                    </label>
                    <label>
                      {t.applicantType}
                      <select
                        value={form.applicantType}
                        onChange={(e) =>
                          updateForm("applicantType", e.target.value)
                        }
                      >
                        <option>{t.organization}</option>
                        <option>{t.individual}</option>
                      </select>
                    </label>
                    <label className="span-two">
                      {t.organizationName}
                      <input
                        value={form.applicant}
                        onChange={(e) =>
                          updateForm("applicant", e.target.value)
                        }
                        placeholder={t.applicantName}
                      />
                    </label>
                    <label>
                      {t.projectTitle}
                      <input
                        value={form.title}
                        onChange={(e) => updateForm("title", e.target.value)}
                        placeholder={
                          lang === "es"
                            ? "Escriba un título claro y breve"
                            : "Enter a clear, short title"
                        }
                      />
                    </label>
                    <label>
                      {t.island}
                      <select
                        value={form.island}
                        onChange={(e) => updateForm("island", e.target.value)}
                      >
                        {[
                          "Santa Cruz",
                          "San Cristóbal",
                          "Isabela",
                          "Floreana",
                          "Santiago",
                          "Área marina",
                          "Varias islas",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t.projectType}
                      <select
                        value={form.projectType}
                        onChange={(e) =>
                          updateForm("projectType", e.target.value)
                        }
                      >
                        {[
                          "Conservación marina",
                          "Educación y comunidad",
                          "Pesca sostenible",
                          "Restauración de ecosistemas",
                          "Investigación",
                          "Economía azul",
                          "Otro según convocatoria",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t.duration}
                      <select
                        value={form.duration}
                        onChange={(e) => updateForm("duration", e.target.value)}
                      >
                        {Array.from({ length: 36 }, (_, i) =>
                          String(i + 1),
                        ).map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t.budget}
                      <input
                        type="number"
                        min="0"
                        value={form.requested}
                        onChange={(e) =>
                          updateForm("requested", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      {t.cofinanceAmount}
                      <input
                        type="number"
                        min="0"
                        value={form.cofinance}
                        onChange={(e) =>
                          updateForm("cofinance", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      {t.adminShare}
                      <input
                        type="number"
                        min="0"
                        value={form.admin}
                        onChange={(e) => updateForm("admin", e.target.value)}
                        placeholder="0.00"
                      />
                      <small className="field-help">{t.adminMax}</small>
                    </label>
                  </div>
                  <div className="form-section-head subhead">
                    <span>02</span>
                    <div>
                      <h2>
                        {lang === "es"
                          ? "Descripción del proyecto"
                          : "Project description"}
                      </h2>
                      <p>
                        {lang === "es"
                          ? "Los apartados siguen el formato oficial de Nota Conceptual revisado."
                          : "Sections follow the reviewed official Concept Note form."}
                      </p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <label>
                      {t.summary}
                      <textarea
                        maxLength={3500}
                        rows={4}
                        value={form.summary}
                        onChange={(e) => updateForm("summary", e.target.value)}
                        placeholder={
                          lang === "es"
                            ? "Contexto, problema, amenazas, justificación, solución y resultados esperados (máximo configurado por convocatoria)."
                            : "Context, problem, threats, rationale, proposed solution, and expected results."
                        }
                      />
                      <small className="field-help">
                        {
                          form.summary.trim().split(/\s+/).filter(Boolean)
                            .length
                        }{" "}
                        / 500{" "}
                        {lang === "es"
                          ? "palabras demostrativas"
                          : "demo words"}
                      </small>
                    </label>
                    <label>
                      {t.objectives}
                      <textarea
                        rows={3}
                        value={form.objectives}
                        onChange={(e) =>
                          updateForm("objectives", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.beneficiaries}
                      <textarea
                        rows={3}
                        value={form.beneficiaries}
                        onChange={(e) =>
                          updateForm("beneficiaries", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.results}
                      <textarea
                        rows={3}
                        value={form.results}
                        onChange={(e) => updateForm("results", e.target.value)}
                        placeholder={
                          lang === "es"
                            ? "Metas previstas, no resultados verificados."
                            : "Expected targets, not verified results."
                        }
                      />
                    </label>
                    <label>
                      {t.activities}
                      <textarea
                        rows={3}
                        value={form.activities}
                        onChange={(e) =>
                          updateForm("activities", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.schedule}
                      <textarea
                        rows={2}
                        value={form.schedule}
                        onChange={(e) => updateForm("schedule", e.target.value)}
                      />
                    </label>
                    <label>
                      {t.sustainability}
                      <textarea
                        rows={2}
                        value={form.sustainability}
                        onChange={(e) =>
                          updateForm("sustainability", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.alignment}
                      <textarea
                        rows={2}
                        value={form.alignment}
                        onChange={(e) =>
                          updateForm("alignment", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.evaluation}
                      <textarea
                        rows={2}
                        value={form.evaluation}
                        onChange={(e) =>
                          updateForm("evaluation", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.socialRisks}
                      <textarea
                        rows={2}
                        value={form.socialRisks}
                        onChange={(e) =>
                          updateForm("socialRisks", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.environmentalRisks}
                      <textarea
                        rows={2}
                        value={form.environmentalRisks}
                        onChange={(e) =>
                          updateForm("environmentalRisks", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="form-section">
                  <div className="form-section-head">
                    <span>02</span>
                    <div>
                      <h2>{t.riskBlock}</h2>
                      <p>{t.riskHelp}</p>
                    </div>
                    <button
                      className="button secondary small"
                      onClick={addRisk}
                    >
                      <Plus size={15} />
                      {t.addRisk}
                    </button>
                  </div>
                  <div className="risk-summary-strip">
                    <div>
                      <span>
                        {lang === "es"
                          ? "Riesgos registrados"
                          : "Risks recorded"}
                      </span>
                      <b>{risks.length}</b>
                    </div>
                    <div>
                      <span>
                        {lang === "es"
                          ? "Suma de puntajes individuales"
                          : "Sum of individual scores"}
                      </span>
                      <b>{totalRisk}</b>
                    </div>
                    <div>
                      <span>
                        {lang === "es"
                          ? "Categoría global del proyecto"
                          : "Overall project category"}
                      </span>
                      <b className="status-pill neutral">
                        {lang === "es"
                          ? "Validación humana"
                          : "Human validation"}
                      </b>
                    </div>
                  </div>
                  <p className="field-help">
                    {lang === "es"
                      ? "Ulf confirmó que la categoría total parte de la suma de riesgos de actividades. Las bandas globales de suma no están definidas; GLF confirma la categoría."
                      : "Ulf confirmed that the overall category starts from summing activity risks. Global sum bands are undefined; GLF confirms the category."}
                  </p>
                  {risks.map((r, i) => (
                    <article className="risk-card" key={r.id}>
                      <div className="risk-card-head">
                        <div className="risk-number">0{i + 1}</div>
                        <div>
                          <strong>
                            {lang === "es"
                              ? "Riesgo asociado a actividad"
                              : "Activity-linked risk"}{" "}
                            {i + 1}
                          </strong>
                          <small>
                            {r.activity ||
                              (lang === "es"
                                ? "Vincule con una actividad"
                                : "Link to an activity")}
                          </small>
                        </div>
                        <button
                          className="icon-button danger-icon"
                          aria-label="Eliminar riesgo"
                          onClick={() => deleteRisk(r.id)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                      <div className="form-grid two">
                        <label>
                          {t.activity}
                          <input
                            value={r.activity}
                            onChange={(e) =>
                              updateRisk(r.id, "activity", e.target.value)
                            }
                            placeholder={
                              lang === "es"
                                ? "Actividad del proyecto relacionada"
                                : "Related project activity"
                            }
                          />
                        </label>
                        <label>
                          {t.dimension}
                          <select
                            value={r.dimension}
                            onChange={(e) =>
                              updateRisk(r.id, "dimension", e.target.value)
                            }
                          >
                            <option value="ambiental">
                              {lang === "es" ? "Ambiental" : "Environmental"}
                            </option>
                            <option value="social">
                              {lang === "es" ? "Social" : "Social"}
                            </option>
                          </select>
                        </label>
                        <label className="span-two">
                          {t.risk}
                          <textarea
                            rows={2}
                            value={r.risk}
                            onChange={(e) =>
                              updateRisk(r.id, "risk", e.target.value)
                            }
                            placeholder={
                              lang === "es"
                                ? "Describa el riesgo específico de esta actividad"
                                : "Describe the specific risk linked to this activity"
                            }
                          />
                        </label>
                        <div className="score-group">
                          <label>
                            {t.probability}
                            <select
                              value={r.probability}
                              onChange={(e) =>
                                updateRisk(
                                  r.id,
                                  "probability",
                                  Number(e.target.value),
                                )
                              }
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} ·{" "}
                                  {lang === "es"
                                    ? [
                                        "Muy baja",
                                        "Baja",
                                        "Media",
                                        "Alta",
                                        "Muy alta",
                                      ][n - 1]
                                    : [
                                        "Very low",
                                        "Low",
                                        "Medium",
                                        "High",
                                        "Very high",
                                      ][n - 1]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            {t.severity}
                            <select
                              value={r.severity}
                              onChange={(e) =>
                                updateRisk(
                                  r.id,
                                  "severity",
                                  Number(e.target.value),
                                )
                              }
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} ·{" "}
                                  {lang === "es"
                                    ? [
                                        "Insignificante",
                                        "Baja",
                                        "Media",
                                        "Alta",
                                        "Muy alta",
                                      ][n - 1]
                                    : [
                                        "Insignificant",
                                        "Low",
                                        "Medium",
                                        "High",
                                        "Very high",
                                      ][n - 1]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="score-output">
                            <span>{t.score}</span>
                            <strong>{score(r.probability, r.severity)}</strong>
                            <span
                              className={`risk-level risk-${level(score(r.probability, r.severity)).toLowerCase().replace(" ", "-")}`}
                            >
                              {level(score(r.probability, r.severity))}
                            </span>
                          </div>
                        </div>
                        <label className="span-two">
                          {t.measures}
                          <textarea
                            rows={2}
                            value={r.measures}
                            onChange={(e) =>
                              updateRisk(r.id, "measures", e.target.value)
                            }
                            placeholder={t.noCatalog}
                          />
                          <small className="field-help">{t.proposed}</small>
                        </label>
                        <div className="score-group residual-group">
                          <label>
                            {lang === "es"
                              ? "Probabilidad residual"
                              : "Residual probability"}
                            <select
                              value={r.residualProbability}
                              onChange={(e) =>
                                updateRisk(
                                  r.id,
                                  "residualProbability",
                                  Number(e.target.value),
                                )
                              }
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            {lang === "es"
                              ? "Gravedad residual"
                              : "Residual severity"}
                            <select
                              value={r.residualSeverity}
                              onChange={(e) =>
                                updateRisk(
                                  r.id,
                                  "residualSeverity",
                                  Number(e.target.value),
                                )
                              }
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="score-output">
                            <span>{t.residual}</span>
                            <strong>
                              {score(r.residualProbability, r.residualSeverity)}
                            </strong>
                            <span
                              className={`risk-level risk-${level(score(r.residualProbability, r.residualSeverity)).toLowerCase().replace(" ", "-")}`}
                            >
                              {level(
                                score(
                                  r.residualProbability,
                                  r.residualSeverity,
                                ),
                              )}
                            </span>
                          </div>
                        </div>
                        <label>
                          {t.location}
                          <input
                            value={r.location}
                            onChange={(e) =>
                              updateRisk(r.id, "location", e.target.value)
                            }
                            placeholder={
                              lang === "es"
                                ? "Sitio, isla, área o grupo"
                                : "Site, island, area, or group"
                            }
                          />
                        </label>
                        <label>
                          {t.cost}
                          <input
                            type="number"
                            min="0"
                            value={r.cost}
                            onChange={(e) =>
                              updateRisk(r.id, "cost", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </label>
                        <label>
                          {t.responsible}
                          <input
                            value={r.responsible}
                            onChange={(e) =>
                              updateRisk(r.id, "responsible", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          {t.quarterStart}
                          <select
                            value={r.start}
                            onChange={(e) =>
                              updateRisk(r.id, "start", e.target.value)
                            }
                          >
                            {quarters.map((q) => (
                              <option key={q}>{q}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {t.quarterEnd}
                          <select
                            value={r.end}
                            onChange={(e) =>
                              updateRisk(r.id, "end", e.target.value)
                            }
                          >
                            {quarters.map((q) => (
                              <option key={q}>{q}</option>
                            ))}
                          </select>
                          <small className="field-help">
                            {t.riskDuration}:{" "}
                            {Math.max(
                              1,
                              quarters.indexOf(r.end) -
                                quarters.indexOf(r.start) +
                                1,
                            )}{" "}
                            {t.quarters}
                          </small>
                        </label>
                      </div>
                    </article>
                  ))}
                  <aside className="info-callout">
                    <ShieldCheck size={17} />
                    <p>
                      {lang === "es"
                        ? "Las medidas del catálogo oficial se habilitarán al recibir y validar la versión de GLF. Esta demostración no trata las acciones escritas como catálogo aprobado."
                        : "Official catalog measures will be enabled once GLF provides and approves them. This demo does not treat typed actions as an approved catalog."}
                    </p>
                  </aside>
                </div>
              )}
              {step === 3 && (
                <div className="form-section">
                  <div className="form-section-head">
                    <span>03</span>
                    <div>
                      <h2>{t.review}</h2>
                      <p>
                        {lang === "es"
                          ? "Compruebe su expediente antes de enviar. Las decisiones de cumplimiento y elegibilidad corresponden a GLF."
                          : "Review the file before submitting. GLF makes eligibility and compliance decisions."}
                      </p>
                    </div>
                  </div>
                  <div className="review-grid">
                    <div className="review-tile">
                      <FileText />
                      <small>{t.projectTitle}</small>
                      <strong>{form.title || "Sin completar"}</strong>
                    </div>
                    <div className="review-tile">
                      <Users />
                      <small>{t.applicantType}</small>
                      <strong>{form.applicantType}</strong>
                    </div>
                    <div className="review-tile">
                      <WalletCards />
                      <small>{t.budget}</small>
                      <strong>
                        {form.requested
                          ? money(Number(form.requested))
                          : "USD 0"}
                      </strong>
                    </div>
                    <div className="review-tile">
                      <ShieldCheck />
                      <small>{t.riskBlock}</small>
                      <strong>
                        {risks.length} · {completedRisks}/{risks.length}{" "}
                        {lang === "es" ? "completos" : "complete"}
                      </strong>
                    </div>
                  </div>
                  <div className="review-warning">
                    <LockKeyhole />
                    <div>
                      <strong>
                        {lang === "es"
                          ? "Envío y versiones"
                          : "Submission and versions"}
                      </strong>
                      <p>{t.submitInfo}</p>
                    </div>
                  </div>
                  <div className="review-check">
                    <label>
                      <input type="checkbox" />
                      {lang === "es"
                        ? "Confirmo que la información refleja la propuesta que presento."
                        : "I confirm that the information reflects the proposal I am submitting."}
                    </label>
                    <label>
                      <input type="checkbox" />
                      {lang === "es"
                        ? "Acepto el aviso de privacidad y tratamiento de los documentos según esta convocatoria."
                        : "I accept the privacy notice and processing of documents under this call."}
                    </label>
                  </div>
                  <div className="pdf-actions">
                    <button
                      className="button secondary"
                      onClick={() => downloadPdf("concept")}
                    >
                      <ArrowDownToLine size={16} />
                      {t.conceptPdf}
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => downloadPdf("matrix")}
                    >
                      <ArrowDownToLine size={16} />
                      {t.matrixPdf}
                    </button>
                  </div>
                  <div className="file-drop">
                    <FilePlus2 size={19} />
                    <div>
                      <strong>
                        {lang === "es"
                          ? "Anexos de convocatoria"
                          : "Call attachments"}
                      </strong>
                      <small>
                        {lang === "es"
                          ? "En demostración, seleccione un archivo para ver el estado. No se almacena."
                          : "In demo, select a file to preview status. It is not stored."}
                      </small>
                    </div>
                    <label className="button outline small">
                      {lang === "es" ? "Seleccionar archivo" : "Select file"}
                      <input
                        type="file"
                        hidden
                        onChange={(e) =>
                          setNotice(
                            e.target.files?.[0]
                              ? `${e.target.files[0].name} · ${lang === "es" ? "seleccionado en modo demo" : "selected in demo mode"}`
                              : "",
                          )
                        }
                      />
                    </label>
                    {notice && <span className="file-name">{notice}</span>}
                  </div>
                </div>
              )}
              <div className="form-footer">
                <div className="saved-note">
                  <Check size={14} />
                  {t.saved}
                  {lastSaved ? ` · ${lastSaved}` : ""}
                </div>
                <div className="form-buttons">
                  {step > 1 && (
                    <button
                      className="button outline"
                      onClick={() => setStep((v) => Math.max(1, v - 1))}
                    >
                      <ArrowLeft size={15} />
                      {t.back}
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      className="button primary"
                      onClick={() => setStep((v) => Math.min(3, v + 1))}
                    >
                      {t.next}
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      className="button primary"
                      onClick={() => {
                        setSubmitted(true);
                        setNotice("");
                      }}
                    >
                      <CheckCircle2 size={15} />
                      {t.submit}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {submitted && (
            <div className="form-card">
              <div className="success-panel">
                <span className="success-icon">
                  <CheckCircle2 size={28} />
                </span>
                <h2>{t.sent}</h2>
                <p>{t.notConnected}</p>
                <div className="receipt-demo">
                  <span>GLF-DEMO-001</span>
                  <span>Fase 1 · Nota Conceptual</span>
                  <span>
                    {new Date().toLocaleString(
                      lang === "es" ? "es-EC" : "en-US",
                    )}
                  </span>
                </div>
                <div className="pdf-actions">
                  <button
                    className="button secondary"
                    onClick={() => downloadPdf("concept")}
                  >
                    <Download size={15} />
                    {t.conceptPdf}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => downloadPdf("matrix")}
                  >
                    <Download size={15} />
                    {t.matrixPdf}
                  </button>
                </div>
                <p className="field-help">{t.submitInfo}</p>
              </div>
            </div>
          )}
          {!submitted && (
            <button
              className="text-button"
              onClick={() => {
                localStorage.setItem(
                  "glf-demo-draft",
                  JSON.stringify({ form, risks }),
                );
                setLastSaved(new Date().toLocaleTimeString());
              }}
            >
              <Check size={14} />
              {t.saveDraft}
            </button>
          )}
        </section>
        <footer className="site-footer">
          <span>{t.footer}</span>
          <span>{t.privacy}</span>
        </footer>
      </main>
    );

  const rows = applicants.filter(
    (row) =>
      (role === "grants_manager" ||
        row.role === role ||
        role === "committee_member") &&
      `${row.id} ${row.name} ${row.title}`
        .toLowerCase()
        .includes(searchText.toLowerCase()),
  );
  const roleLabel = (key: Role) =>
    key === "grants_manager"
      ? t.grantsManager
      : key === "sustainability_reviewer"
        ? t.sustainabilityReviewer
        : key === "project_coordinator"
          ? t.coordinator
          : t.committeeRole;
  const setResult = (label: string) => setNotice(label);

  return (
    <main className="staff-app">
      <aside className={`staff-sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="staff-logo">
          <Image
            src="/glf-logo.png"
            alt="Galápagos Life Fund"
            width={150}
            height={66}
            priority
          />
        </div>
        <div className="staff-env">
          <span className="status-dot" />
          DEMO · SIN DATOS REALES
        </div>
        <div className="sidebar-workspace">
          <span className="staff-avatar">GL</span>
          <div>
            <strong>Workspace GLF</strong>
            <small>Galápagos · Ecuador</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav className="staff-nav">
          <span className="nav-caption">
            {lang === "es" ? "ESPACIO DE TRABAJO" : "WORKSPACE"}
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={screen === item.id ? "selected" : ""}
                onClick={() => navigate(item.id)}
              >
                <Icon size={17} />
                {t[item.label]}
                {item.id === "review" && <span className="nav-count">4</span>}
              </button>
            );
          })}
          <span className="nav-caption second-caption">
            {lang === "es" ? "POSTULANTE" : "APPLICANT"}
          </span>
          <button onClick={() => navigate("applicant")}>
            <Users size={17} />
            {t.portal}
          </button>
          <button onClick={() => navigate("home")}>
            <Globe2 size={17} />
            {t.backHome}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <LockKeyhole size={15} />
            <span>{t.authInfo}</span>
          </div>
          <button
            className="sidebar-user"
            onClick={() => setResult(t.authInfo)}
          >
            <span className="user-avatar">GLF</span>
            <span>
              <strong>{roleLabel(role).split("·")[0]}</strong>
              <small>{t.staffOnly}</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <section className="staff-main">
        <header className="staff-topbar">
          <div className="top-left">
            <button
              className="mobile-menu staff-mobile-menu"
              onClick={() => setMobileMenu((v) => !v)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            <div className="breadcrumbs">
              <span>GLF</span>
              <ChevronRight size={13} />
              <strong>{t.staffWorkspace}</strong>
            </div>
          </div>
          <div className="top-actions">
            <label className="staff-search">
              <Search size={15} />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t.search}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button top-bell" aria-label="Notifications">
              <Bell size={17} />
              <i />
            </button>
            <div className="language-switch">
              <button
                aria-pressed={lang === "es"}
                onClick={() => changeLang("es")}
              >
                ES
              </button>
              <button
                aria-pressed={lang === "en"}
                onClick={() => changeLang("en")}
              >
                EN
              </button>
            </div>
            <button className="staff-avatar top-avatar" title={roleLabel(role)}>
              GL
            </button>
          </div>
        </header>
        <div className="staff-content">
          <div className="demo-warning">
            <ShieldCheck size={15} />
            {t.demo}
            <span>{t.authInfo}</span>
          </div>
          <div className="role-switcher">
            <span>
              <strong>{t.role}</strong> <small>{activeRoleName}</small>
            </span>
            <div>
              {(
                [
                  "grants_manager",
                  "sustainability_reviewer",
                  "project_coordinator",
                  "committee_member",
                ] as Role[]
              ).map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    setRole(x);
                    setScreen(
                      x === "sustainability_reviewer"
                        ? "review"
                        : x === "committee_member"
                          ? "committee"
                          : "staff",
                    );
                  }}
                >
                  {roleLabel(x).split("·")[0].trim()}
                </button>
              ))}
            </div>
          </div>
          {notice && (
            <div className="toast-message">
              <CheckCircle2 size={16} />
              {notice}
              <button onClick={() => setNotice("")}>
                <X size={14} />
              </button>
            </div>
          )}
          {screen === "staff" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">
                    {t.staffWorkspace} · {activeRoleName.split("·")[0]}
                  </div>
                  <h1>{t.overview}</h1>
                  <p>
                    {role === "sustainability_reviewer"
                      ? lang === "es"
                        ? "Revisión de riesgos, salvaguardas y documentos de respaldo."
                        : "Review risks, safeguards, and supporting evidence."
                      : role === "project_coordinator"
                        ? lang === "es"
                          ? "Coordinación de expedientes, proyectos y próximos hitos en San Cristóbal."
                          : "Coordinate cases, projects, and next steps in San Cristóbal."
                        : role === "committee_member"
                          ? t.noDecisions
                          : lang === "es"
                            ? "Administre convocatorias y acompañe postulaciones en sus dos fases."
                            : "Manage calls and follow applications through both phases."}
                  </p>
                </div>
                <button className="button outline small">
                  <CalendarDays size={15} /> {t.year} 2026{" "}
                  <ChevronDown size={13} />
                </button>
              </div>
              <div className="stats-grid">
                <article className="stat-card">
                  <span>{t.received}</span>
                  <strong>126</strong>
                  <small className="stat-good">
                    +18% <span>vs. convocatoria anterior · demo</span>
                  </small>
                  <i className="stat-icon blue">
                    <FileText size={16} />
                  </i>
                </article>
                <article className="stat-card">
                  <span>{t.selected}</span>
                  <strong>21</strong>
                  <small>17% del total recibido · demo</small>
                  <i className="stat-icon turquoise">
                    <CheckCircle2 size={16} />
                  </i>
                </article>
                <article className="stat-card">
                  <span>{t.signedContracts}</span>
                  <strong>8</strong>
                  <small>Separadas de las seleccionadas</small>
                  <i className="stat-icon green">
                    <FileCheck2 size={16} />
                  </i>
                </article>
                <article className="stat-card">
                  <span>{t.amountSigned}</span>
                  <strong>$1,52M</strong>
                  <small>Solo contratos con firma registrada · demo</small>
                  <i className="stat-icon sand">
                    <WalletCards size={16} />
                  </i>
                </article>
              </div>
              <div className="staff-main-grid">
                <section className="panel-card">
                  <div className="panel-heading">
                    <div>
                      <h2>{t.tasks}</h2>
                      <p>
                        {role === "grants_manager"
                          ? "Convocatorias, completitud y coordinación de postulaciones"
                          : role === "sustainability_reviewer"
                            ? "Riesgos, salvaguardas y evidencia para revisión técnica"
                            : role === "project_coordinator"
                              ? "Casos asignados y coordinación local en San Cristóbal"
                              : "Resoluciones y recomendaciones para registro"}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        navigate(
                          role === "grants_manager"
                            ? "calls"
                            : role === "sustainability_reviewer"
                              ? "review"
                              : role === "project_coordinator"
                                ? "phase2"
                                : "committee",
                        )
                      }
                    >
                      {t.showAll}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="task-list">
                    {rows.slice(0, 3).map((row, i) => (
                      <article className="task-row" key={row.id}>
                        <div className={`task-icon task-icon-${i}`}>
                          <FileText size={16} />
                        </div>
                        <div className="task-desc">
                          <div className="task-id">
                            {row.id} <span>· {row.type}</span>
                          </div>
                          <strong>{row.title}</strong>
                          <small>
                            {row.name} · {row.phase}
                          </small>
                        </div>
                        <div className="task-meta">
                          <span
                            className={`status-pill ${row.status.includes("firmado") ? "green" : row.status.includes("revisión") ? "blue" : "amber"}`}
                          >
                            {row.status}
                          </span>
                          <small>{money(row.requested)}</small>
                        </div>
                        <button
                          className="icon-button"
                          onClick={() =>
                            navigate(
                              role === "sustainability_reviewer"
                                ? "review"
                                : row.phase.includes("Fase 2")
                                  ? "phase2"
                                  : "committee",
                            )
                          }
                          aria-label={t.openTask}
                        >
                          <ChevronRight size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="panel-card stage-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t.funnel}</h2>
                      <p>
                        {lang === "es"
                          ? "Estados no equivalentes"
                          : "Distinct milestones"}
                      </p>
                    </div>
                    <ClipboardList size={18} />
                  </div>
                  {[
                    ["Recibidas · Fase 1", 126, "100%"],
                    ["Calificadas", 76, "60%"],
                    ["Invitadas a Fase 2", 21, "17%"],
                    ["Propuesta completa recibida", 13, "10%"],
                    ["Aprobadas", 10, "8%"],
                    ["Contrato firmado", 8, "6%"],
                  ].map(([label, count, pct]) => (
                    <div className="funnel-row" key={String(label)}>
                      <span>{label}</span>
                      <strong>{count}</strong>
                      <div className="funnel-track">
                        <i
                          style={{
                            width: `${Number(String(pct).replace("%", ""))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </section>
              </div>
              <section className="panel-card recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t.portfolio}</h2>
                    <p>{t.dataSource}</p>
                  </div>
                  <button
                    className="button secondary small"
                    onClick={() => navigate("reports")}
                  >
                    <BarChart3 size={14} />
                    {t.reporting}
                  </button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Expediente</th>
                        <th>Proyecto</th>
                        <th>{t.phases}</th>
                        <th>{t.status}</th>
                        <th>{t.assigned}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.id}</strong>
                          </td>
                          <td>
                            {row.title}
                            <small>{row.type}</small>
                          </td>
                          <td>{row.phase}</td>
                          <td>
                            <span
                              className={`status-pill ${row.status.includes("firmado") ? "green" : row.status.includes("revisión") ? "blue" : "amber"}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td>
                            {role === "sustainability_reviewer"
                              ? "Ulf · Sostenibilidad"
                              : role === "project_coordinator"
                                ? "Gabriela · San Cristóbal"
                                : "Paulina · Convocatorias"}
                          </td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() =>
                                navigate(
                                  row.phase.includes("Fase 2")
                                    ? "phase2"
                                    : "review",
                                )
                              }
                            >
                              {t.showAll}
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {screen === "review" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">Ulf · SOSTENIBILIDAD</div>
                  <h1>{t.safeguards}</h1>
                  <p>
                    {lang === "es"
                      ? "El especialista registra observaciones; todas las valoraciones y decisiones quedan bajo revisión humana."
                      : "The specialist records observations; all assessments and decisions remain human-led."}
                  </p>
                </div>
                <button className="button outline small">
                  <Filter size={15} />
                  {t.filter}
                </button>
              </div>
              <div className="review-top-summary">
                <article>
                  <span>
                    {lang === "es"
                      ? "Pendientes de revisión A&S"
                      : "Pending E&S reviews"}
                  </span>
                  <strong>4</strong>
                  <small>Fase 1: 3 · Fase 2: 1 · demo</small>
                </article>
                <article>
                  <span>
                    {lang === "es"
                      ? "Suma de riesgos individuales"
                      : "Sum of individual risk scores"}
                  </span>
                  <strong>70</strong>
                  <small>
                    {lang === "es"
                      ? "Total aritmético · no es categoría global"
                      : "Arithmetic total · not an overall category"}
                  </small>
                </article>
                <article>
                  <span>
                    {lang === "es"
                      ? "Puntajes sin valoración residual"
                      : "Missing residual ratings"}
                  </span>
                  <strong>2</strong>
                  <small>
                    {lang === "es"
                      ? "Requieren observación técnica"
                      : "Need technical follow-up"}
                  </small>
                </article>
              </div>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>{t.tasks}</h2>
                    <p>
                      Actividad → riesgo → medidas → residual → responsable /
                      plazo
                    </p>
                  </div>
                  <label className="table-filter">
                    <Search size={14} />
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder={t.search}
                    />
                  </label>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Expediente</th>
                        <th>Proyecto</th>
                        <th>Riesgos / suma</th>
                        <th>{t.phaseTwo}</th>
                        <th>{t.status}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.id}</strong>
                          </td>
                          <td>
                            {row.title}
                            <small>{row.name}</small>
                          </td>
                          <td>
                            <strong>{row.sum}</strong>{" "}
                            {lang === "es" ? "puntos totales" : "sum points"}
                            <small>
                              {lang === "es"
                                ? "Categoría global pendiente de confirmación humana"
                                : "Overall category pending human confirmation"}
                            </small>
                          </td>
                          <td>{row.phase}</td>
                          <td>
                            <span className="status-pill blue">
                              {lang === "es" ? "Asignado" : "Assigned"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="button tiny primary"
                              onClick={() => navigate("review")}
                            >
                              {t.openTask}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel-card selected-case">
                <div className="selected-case-head">
                  <div>
                    <span className="status-pill blue">
                      GLF-26-014 · FASE 1
                    </span>
                    <h2>Restauración de hábitat costero</h2>
                    <p>Asociación Demo Azul · Santa Cruz · USD 85.000</p>
                  </div>
                  <button
                    className="button secondary small"
                    onClick={() => navigate("rag")}
                  >
                    <Sparkles size={14} />
                    {t.rag}
                  </button>
                </div>
                <div className="risk-review-details">
                  <article>
                    <span>01 · Actividad</span>
                    <strong>Restauración de vegetación costera</strong>
                  </article>
                  <article>
                    <span>Riesgo ambiental</span>
                    <strong>
                      Alteración de suelo y vegetación durante preparación del
                      sitio
                    </strong>
                  </article>
                  <article>
                    <span>{t.score}</span>
                    <strong>
                      12 · ALTO <small>4 × 3</small>
                    </strong>
                  </article>
                  <article>
                    <span>{t.measures}</span>
                    <strong>
                      Medida de ejemplo aportada por aplicante{" "}
                      <small>Catálogo pendiente de aprobación</small>
                    </strong>
                  </article>
                  <article>
                    <span>{t.residual}</span>
                    <strong>
                      6 · MEDIO <small>2 × 3</small>
                    </strong>
                  </article>
                  <article>
                    <span>
                      {t.location} · {t.responsible} · {t.schedule}
                    </span>
                    <strong>
                      Bahía Demo · Coordinación técnica · Año 1 - T1 a T2
                    </strong>
                  </article>
                </div>
                <label className="staff-field">
                  {t.reviewerNote}
                  <textarea
                    rows={3}
                    placeholder={
                      lang === "es"
                        ? "Identifique evidencia y solicite aclaraciones concretas. La postulación permanece bajo decisión humana."
                        : "Cite evidence and ask for clear corrections. The application remains under human decision."
                    }
                  />
                </label>
                <div className="selected-case-actions">
                  <button
                    className="button outline"
                    onClick={() =>
                      setResult(
                        lang === "es"
                          ? "Observación guardada (solo en esta sesión demo)."
                          : "Observation saved (demo session only).",
                      )
                    }
                  >
                    <MessageSquareText size={15} />
                    {t.sendObservation}
                  </button>
                  <button
                    className="button primary"
                    onClick={() =>
                      setResult(
                        lang === "es"
                          ? "Revisión registrada en la sesión demostrativa; no afecta la selección."
                          : "Review recorded for demo; it does not change selection.",
                      )
                    }
                  >
                    <CheckCircle2 size={15} />
                    {lang === "es"
                      ? "Guardar revisión técnica"
                      : "Save technical review"}
                  </button>
                </div>
              </section>
              <div className="info-callout">
                <ShieldCheck size={17} />
                <p>
                  {lang === "es"
                    ? "La clasificación total depende de la suma de riesgos por actividad según la consignación más reciente de Ulf. El sistema presenta la suma y solicita confirmación profesional; no inventa umbrales globales."
                    : "Overall classification follows the sum of activity risk scores per Ulf's latest input. The system shows the sum and requests professional confirmation; it does not invent global thresholds."}
                </p>
              </div>
            </>
          )}
          {screen === "calls" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">
                    PAULINA · CONVOCATORIAS Y SUBVENCIONES
                  </div>
                  <h1>{t.callsTitle}</h1>
                  <p>
                    {lang === "es"
                      ? "Configure cada ronda con parámetros versionados y requisitos visibles para las personas postulantes."
                      : "Configure each round with versioned parameters and visible applicant requirements."}
                  </p>
                </div>
                <button
                  className="button primary small"
                  onClick={() =>
                    setResult(
                      lang === "es"
                        ? "Borrador de convocatoria creado en la vista de demostración."
                        : "Call draft created in demo view.",
                    )
                  }
                >
                  <Plus size={15} />
                  {t.createCall}
                </button>
              </div>
              <section className="call-admin-grid">
                <article className="call-admin-card active-call">
                  <div className="call-admin-kicker">
                    <span className="status-dot" />
                    ABIERTA · DEMO
                  </div>
                  <h2>Convocatoria demostrativa 2026</h2>
                  <p>Versión 1.0 · parámetros editables por rol autorizado</p>
                  <div className="call-admin-metrics">
                    <span>
                      <small>{t.dates}</small>
                      <b>01 Oct — 30 Nov 2026</b>
                    </span>
                    <span>
                      <small>{t.categories}</small>
                      <b>Pequeña · Mediana · Grande</b>
                    </span>
                  </div>
                  <button
                    className="button secondary small"
                    onClick={() =>
                      setResult(
                        lang === "es"
                          ? "Edición de reglas disponible al enlazar los permisos de administración de Supabase."
                          : "Rules editing is available after connecting Supabase admin permissions.",
                      )
                    }
                  >
                    <ClipboardCheck size={14} />
                    {t.editParams}
                  </button>
                </article>
                <article className="settings-card">
                  <h2>{t.settings}</h2>
                  <p>{t.configInfo}</p>
                  <div className="settings-list">
                    {[t.categories, t.requirementFiles, t.dates, t.version].map(
                      (x, i) => (
                        <div key={x}>
                          <span className="settings-icon">
                            {i === 0 ? (
                              <WalletCards size={15} />
                            ) : i === 1 ? (
                              <FileCheck2 size={15} />
                            ) : i === 2 ? (
                              <CalendarDays size={15} />
                            ) : (
                              <Clock3 size={15} />
                            )}
                          </span>
                          <span>{x}</span>
                          <small>
                            {lang === "es"
                              ? "Configurable por convocatoria"
                              : "Configurable per call"}
                          </small>
                        </div>
                      ),
                    )}
                  </div>
                  <button
                    className="text-button"
                    onClick={() =>
                      setResult(
                        lang === "es"
                          ? "Cada modificación debe generar una versión y conservar convocatorias históricas."
                          : "Each change must create a version and preserve past call rules.",
                      )
                    }
                  >
                    {t.version}
                    <ArrowRight size={14} />
                  </button>
                </article>
              </section>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {lang === "es"
                        ? "Solicitantes y tipos admitidos"
                        : "Eligible applicant types"}
                    </h2>
                    <p>
                      {lang === "es"
                        ? "La convocatoria define la población habilitada."
                        : "Each call defines eligible applicant groups."}
                    </p>
                  </div>
                </div>
                <div className="eligible-types">
                  <span>
                    <Users size={16} />{" "}
                    {lang === "es" ? "Personas naturales" : "Individuals"}
                  </span>
                  <span>
                    <BriefcaseBusiness size={16} />{" "}
                    {lang === "es"
                      ? "Organizaciones no gubernamentales ambientales"
                      : "Environmental NGOs"}
                  </span>
                  <span>
                    <Leaf size={16} />{" "}
                    {lang === "es"
                      ? "Iniciativas de residentes permanentes de Galápagos"
                      : "Permanent Galápagos resident initiatives"}
                  </span>
                  <span>
                    <FileCheck2 size={16} />{" "}
                    {lang === "es"
                      ? "Otras categorías habilitadas por esta convocatoria"
                      : "Other applicant types admitted by this call"}
                  </span>
                </div>
              </section>
            </>
          )}
          {screen === "committee" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">CAT · COMITÉ / CONSEJO</div>
                  <h1>{t.projectCommittee}</h1>
                  <p>{t.noDecisions}</p>
                </div>
                <button className="button outline small">
                  <Filter size={15} />
                  {t.filter}
                </button>
              </div>
              <div className="info-callout">
                <ClipboardCheck size={17} />
                <p>
                  {t.distinction}{" "}
                  {lang === "es"
                    ? "La recomendación del CAT y la resolución de aprobación se registran en momentos y con autoridades distintas."
                    : "The Technical Advisory Committee recommendation and approval resolution are recorded as distinct actions."}
                </p>
              </div>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>{t.committeeQueue}</h2>
                    <p>
                      {lang === "es"
                        ? "La decisión habilita o no una invitación a la Fase 2."
                        : "The decision determines whether a Phase 2 invitation may be issued."}
                    </p>
                  </div>
                  <span className="status-pill amber">3 DEMO</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Expediente</th>
                        <th>Proyecto</th>
                        <th>{t.recommendation}</th>
                        <th>{t.resolution}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.slice(0, 3).map((row, i) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.id}</strong>
                          </td>
                          <td>
                            {row.title}
                            <small>{row.type}</small>
                          </td>
                          <td>
                            <span className="status-pill neutral">
                              {i === 0
                                ? lang === "es"
                                  ? "Pendiente de CAT"
                                  : "Pending CAT"
                                : lang === "es"
                                  ? "Recomendada"
                                  : "Recommended"}
                            </span>
                          </td>
                          <td>
                            <span className="status-pill neutral">
                              {lang === "es"
                                ? "Sin resolución"
                                : "No resolution"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="button tiny secondary"
                              onClick={() => setResult(t.confirmed)}
                            >
                              {lang === "es"
                                ? "Registrar acta"
                                : "Record minutes"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel-card decision-entry">
                <h2>{t.resolution}</h2>
                <p>{t.committeeNote}</p>
                <div className="form-grid two">
                  <label>
                    {lang === "es" ? "Expediente" : "Case"}
                    <select>
                      <option>
                        GLF-26-021 · Ciencia comunitaria y monitoreo
                      </option>
                    </select>
                  </label>
                  <label>
                    {lang === "es" ? "Decisión" : "Decision"}
                    <select>
                      <option>
                        {lang === "es"
                          ? "Seleccionar para Fase 2"
                          : "Select for Phase 2"}
                      </option>
                      <option>
                        {lang === "es" ? "No seleccionar" : "Do not select"}
                      </option>
                      <option>
                        {lang === "es"
                          ? "Devolver para deliberación"
                          : "Return for deliberation"}
                      </option>
                    </select>
                  </label>
                  <label>
                    {lang === "es" ? "Reunión / acta" : "Meeting / minutes"}
                    <input type="text" placeholder="CAT-2026-XX" />
                  </label>
                  <label>
                    {lang === "es" ? "Fecha de resolución" : "Resolution date"}
                    <input type="date" />
                  </label>
                  <label className="span-two">
                    {t.committeeNote}
                    <textarea rows={3} />
                  </label>
                </div>
                <button
                  className="button primary small"
                  onClick={() =>
                    setResult(
                      lang === "es"
                        ? "En la demo se registró una decisión ilustrativa. En producción el registro requerirá rol de comité y quedará auditado."
                        : "An illustrative decision was recorded in demo. Production requires committee access and creates an audit event.",
                    )
                  }
                >
                  <CheckCircle2 size={14} />
                  {t.invitation}
                </button>
              </section>
            </>
          )}
          {screen === "phase2" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">
                    PROYECTO COMPLETO · SOLO INVITADOS
                  </div>
                  <h1>{t.phase2Title}</h1>
                  <p>{t.distinction}</p>
                </div>
                <button className="button outline small">
                  <Filter size={15} />
                  {t.filter}
                </button>
              </div>
              <div className="info-callout">
                <LockKeyhole size={17} />
                <p>
                  {lang === "es"
                    ? "El aplicante ve esta fase solo después de recibir una invitación asociada a una decisión registrada del comité. Campos y anexos se parametrizan usando el formato oficial vigente."
                    : "Applicants see this phase only after an invitation linked to a recorded committee decision. Fields and attachments are configured from the current official format."}
                </p>
              </div>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>{t.config}</h2>
                    <p>{t.configInfo}</p>
                  </div>
                  <button
                    className="button secondary small"
                    onClick={() => navigate("calls")}
                  >
                    <ClipboardCheck size={14} />
                    {t.settings}
                  </button>
                </div>
                <div className="phase-two-flow">
                  <div className="flow-step done">
                    <span>
                      <Check size={14} />
                    </span>
                    <strong>{t.phase1Received}</strong>
                    <small>Nota Conceptual + matriz Ulf</small>
                  </div>
                  <ChevronRight />
                  <div className="flow-step done">
                    <span>
                      <Check size={14} />
                    </span>
                    <strong>{t.phase1Selected}</strong>
                    <small>CAT / comité / consejo</small>
                  </div>
                  <ChevronRight />
                  <div className="flow-step active">
                    <span>03</span>
                    <strong>{t.phase2Received}</strong>
                    <small>Revisión GLF</small>
                  </div>
                  <ChevronRight />
                  <div className="flow-step">
                    <span>04</span>
                    <strong>{t.approved}</strong>
                    <small>
                      {lang === "es" ? "Aprobación formal" : "Formal approval"}
                    </small>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Expediente</th>
                        <th>Proyecto</th>
                        <th>{t.status}</th>
                        <th>{t.assigned}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants
                        .filter((x) => x.phase.includes("Fase 2"))
                        .map((row) => (
                          <tr key={row.id}>
                            <td>
                              <strong>{row.id}</strong>
                            </td>
                            <td>
                              {row.title}
                              <small>{row.name}</small>
                            </td>
                            <td>
                              <span className="status-pill amber">
                                {row.status}
                              </span>
                            </td>
                            <td>
                              {row.role === "project_coordinator"
                                ? "Gabriela · San Cristóbal"
                                : "Paulina · Convocatorias"}
                            </td>
                            <td>
                              <button
                                className="button tiny secondary"
                                onClick={() => setResult(t.configInfo)}
                              >
                                {t.openTask}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {lang === "es"
                        ? "Indicadores esperados declarados"
                        : "Applicant-declared expected indicators"}
                    </h2>
                    <p>{t.notImpact}</p>
                  </div>
                </div>
                <div className="indicator-row">
                  <span>
                    <Leaf size={17} />
                    {lang === "es" ? "Ambientales" : "Environmental"}
                  </span>
                  <span>2.400 plántulas nativas · meta demostrativa</span>
                  <span>Santa Cruz</span>
                  <span>
                    {lang === "es" ? "Meta propuesta" : "Proposed target"}
                  </span>
                </div>
                <div className="indicator-row">
                  <span>
                    <Users size={17} />
                    {lang === "es" ? "Sociales" : "Social"}
                  </span>
                  <span>120 participantes · meta demostrativa</span>
                  <span>San Cristóbal</span>
                  <span>
                    {lang === "es" ? "Meta propuesta" : "Proposed target"}
                  </span>
                </div>
              </section>
            </>
          )}
          {screen === "contracts" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">ADJUDICACIÓN · FIRMA</div>
                  <h1>{t.agreements}</h1>
                  <p>
                    {lang === "es"
                      ? "Registre aprobación, monto y firmas por separado de la selección a Fase 2."
                      : "Record approval, amount, and signatures separately from Phase 2 selection."}
                  </p>
                </div>
                <button
                  className="button primary small"
                  onClick={() =>
                    setResult(
                      lang === "es"
                        ? "Registro de contrato en modo demostración."
                        : "Contract record in demo mode.",
                    )
                  }
                >
                  <Plus size={14} />
                  {t.contract}
                </button>
              </div>
              <div className="stats-grid three">
                <article className="stat-card">
                  <span>
                    {lang === "es"
                      ? "Propuestas aprobadas"
                      : "Approved proposals"}
                  </span>
                  <strong>10</strong>
                  <small>{t.statusNote}</small>
                </article>
                <article className="stat-card">
                  <span>{t.signedContracts}</span>
                  <strong>8</strong>
                  <small>
                    {lang === "es"
                      ? "Firma registrada en ambas partes"
                      : "Signatures recorded by both parties"}
                  </small>
                </article>
                <article className="stat-card">
                  <span>{t.amountSigned}</span>
                  <strong>$1,52M</strong>
                  <small>
                    {lang === "es"
                      ? "No incluye contratos pendientes"
                      : "Excludes pending contracts"}
                  </small>
                </article>
              </div>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {lang === "es"
                        ? "Aprobación y estado contractual"
                        : "Approval and contract status"}
                    </h2>
                    <p>{t.distinction}</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Expediente</th>
                        <th>Proyecto</th>
                        <th>{t.stageApproved}</th>
                        <th>{t.signedAmount}</th>
                        <th>{t.signedDate}</th>
                        <th>{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.slice(1).map((row, i) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.id}</strong>
                          </td>
                          <td>{row.title}</td>
                          <td>
                            <span
                              className={`status-pill ${i === 2 ? "green" : "amber"}`}
                            >
                              {i === 2 ? t.approved : t.pending}
                            </span>
                          </td>
                          <td>{i === 2 ? money(row.requested) : "—"}</td>
                          <td>{i === 2 ? "12 Oct 2026" : "—"}</td>
                          <td>
                            <span
                              className={`status-pill ${row.status.includes("firmado") ? "green" : "neutral"}`}
                            >
                              {row.status.includes("firmado")
                                ? t.signed
                                : t.pending}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="info-callout">
                <FileCheck2 size={17} />
                <p>
                  {lang === "es"
                    ? "Solo se suma como comprometido el monto de contratos con estado firmado y fecha documentada. La firma debe contrastarse con el expediente y el archivo cargado."
                    : "Only signed contracts with a documented date count as committed amounts. Verify each signature against the uploaded contract file."}
                </p>
              </div>
            </>
          )}
          {screen === "reports" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">
                    REPORTE INTERNO · CIERRE DE CONVOCATORIA
                  </div>
                  <h1>{t.reportHeading}</h1>
                  <p>{t.reportInternal}</p>
                </div>
                <button className="button primary small" onClick={exportReport}>
                  <Download size={15} />
                  {t.exportCsv}
                </button>
              </div>
              <div className="report-filter-row">
                <label>
                  {t.call}
                  <select>
                    <option>Convocatoria demostrativa GLF 2026</option>
                  </select>
                </label>
                <label>
                  {t.reportPeriod}
                  <select>
                    <option>2026 · DEMO</option>
                  </select>
                </label>
                <label>
                  {lang === "es" ? "Fecha de corte" : "Cut-off date"}
                  <input type="date" defaultValue="2026-10-05" />
                </label>
              </div>
              <div className="stats-grid">
                <article className="stat-card">
                  <span>{t.totalReceived}</span>
                  <strong>126</strong>
                  <small>
                    {lang === "es"
                      ? "Incluye casos que no avanzaron · demo"
                      : "Includes cases that did not advance · demo"}
                  </small>
                </article>
                <article className="stat-card">
                  <span>{t.notQualified}</span>
                  <strong>50</strong>
                  <small>
                    {lang === "es"
                      ? "Desglose por estado documentado"
                      : "Breakdown by recorded status"}
                  </small>
                </article>
                <article className="stat-card">
                  <span>{t.selected}</span>
                  <strong>21</strong>
                  <small>
                    {lang === "es"
                      ? "Decisión CAT / comité registrada"
                      : "CAT / committee decision recorded"}
                  </small>
                </article>
                <article className="stat-card">
                  <span>{t.signedContracts}</span>
                  <strong>8</strong>
                  <small>
                    {lang === "es"
                      ? "Firma contractual confirmada"
                      : "Contract signature confirmed"}
                  </small>
                </article>
              </div>
              <div className="report-grid">
                <section className="panel-card">
                  <div className="panel-heading">
                    <div>
                      <h2>{t.funnel}</h2>
                      <p>
                        {lang === "es"
                          ? "Recepción, selección, aprobación y contratación"
                          : "Receipt, selection, approval, and contracting"}
                      </p>
                    </div>
                  </div>
                  {[
                    [t.phase1Received, 126],
                    [t.phase1Selected, 21],
                    [t.phase2Received, 13],
                    [t.approved, 10],
                    [t.contracted, 8],
                  ].map(([label, count], i) => (
                    <div className="report-bar-row" key={String(label)}>
                      <span>{label}</span>
                      <strong>{count}</strong>
                      <div className="report-bar">
                        <i
                          style={{
                            width: `${Math.max(8, (Number(count) / 126) * 100)}%`,
                            background: [
                              "#42a9bf",
                              "#29788f",
                              "#366579",
                              "#286953",
                              "#184c42",
                            ][i],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </section>
                <section className="panel-card">
                  <div className="panel-heading">
                    <div>
                      <h2>{t.byType}</h2>
                      <p>
                        {lang === "es"
                          ? "Monto solicitado / monto con contrato firmado"
                          : "Requested amount / signed amount"}
                      </p>
                    </div>
                  </div>
                  {[
                    ["Conservación marina", 48, "$4,2M", "$0,72M"],
                    ["Educación y comunidad", 35, "$2,6M", "$0,31M"],
                    ["Economía azul", 24, "$3,5M", "$0,34M"],
                    ["Investigación", 19, "$1,9M", "$0,15M"],
                  ].map((x) => (
                    <div className="type-row" key={String(x[0])}>
                      <span>{x[0]}</span>
                      <b>{x[1]}</b>
                      <small>
                        {x[2]} / <strong>{x[3]}</strong>
                      </small>
                    </div>
                  ))}
                </section>
              </div>
              <section className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h2>{t.expectedIndicators}</h2>
                    <p>{t.notImpact}</p>
                  </div>
                </div>
                <div className="report-indicators">
                  <div>
                    <span className="indicator-symbol nature">
                      <Leaf size={16} />
                    </span>
                    <div>
                      <strong>Restauración ecológica</strong>
                      <small>
                        {lang === "es"
                          ? "Meta reportada por proyectos de demostración"
                          : "Target reported by demo projects"}
                      </small>
                    </div>
                    <b>
                      6.200 <small>plantas</small>
                    </b>
                  </div>
                  <div>
                    <span className="indicator-symbol community">
                      <Users size={16} />
                    </span>
                    <div>
                      <strong>
                        {lang === "es"
                          ? "Participación comunitaria"
                          : "Community participation"}
                      </strong>
                      <small>
                        {lang === "es"
                          ? "Meta reportada por proyectos de demostración"
                          : "Target reported by demo projects"}
                      </small>
                    </div>
                    <b>
                      490 <small>{lang === "es" ? "personas" : "people"}</small>
                    </b>
                  </div>
                  <div>
                    <span className="indicator-symbol ocean">
                      <Globe2 size={16} />
                    </span>
                    <div>
                      <strong>
                        {lang === "es"
                          ? "Áreas con acciones previstas"
                          : "Areas with planned actions"}
                      </strong>
                      <small>
                        {lang === "es"
                          ? "Cobertura declarada en proyectos"
                          : "Coverage declared in projects"}
                      </small>
                    </div>
                    <b>
                      7{" "}
                      <small>
                        {lang === "es" ? "islas / zonas" : "islands / areas"}
                      </small>
                    </b>
                  </div>
                </div>
              </section>
              <div className="info-callout">
                <BarChart3 size={17} />
                <p>
                  {t.reportInternal}{" "}
                  {lang === "es"
                    ? "El archivo exportado identificará periodo, fecha de corte y que las métricas están en demostración."
                    : "The export identifies the period, cut-off date, and demo status."}
                </p>
              </div>
            </>
          )}
          {screen === "rag" && (
            <>
              <div className="staff-page-title">
                <div>
                  <div className="section-overline">
                    Ulf · REVISIÓN TÉCNICA CON EVIDENCIA
                  </div>
                  <h1>{t.ragTitle}</h1>
                  <p>{t.ragInfo}</p>
                </div>
                <span className="status-pill amber">
                  <span className="status-dot" />
                  {t.ragStatus}
                </span>
              </div>
              <section className="rag-layout">
                <article className="rag-panel">
                  <div className="rag-panel-head">
                    <span className="rag-mark">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <strong>
                        {lang === "es"
                          ? "Consulta de evidencia GLF"
                          : "GLF evidence search"}
                      </strong>
                      <small>
                        multilingual-e5-small · CPU · ejecución local
                      </small>
                    </div>
                  </div>
                  <label className="rag-search">
                    {lang === "es" ? "Pregunta de revisión" : "Review question"}
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={4}
                      placeholder={t.query}
                    />
                  </label>
                  <label className="rag-search">
                    {lang === "es"
                      ? "Expediente (opcional)"
                      : "Case (optional)"}
                    <select>
                      <option>
                        {lang === "es" ? "Sin expediente" : "No case"}
                      </option>
                      <option>
                        GLF-26-014 · Restauración de hábitat costero
                      </option>
                    </select>
                  </label>
                  <button
                    className="button primary"
                    onClick={() => setResult(t.noModel)}
                  >
                    <Search size={15} />
                    {t.retrieve}
                  </button>
                </article>
                <article className="rag-results">
                  <div className="rag-empty">
                    <span>
                      <BookOpen size={22} />
                    </span>
                    <h2>
                      {lang === "es"
                        ? "Evidencia verificable"
                        : "Verifiable evidence"}
                    </h2>
                    <p>{t.noModel}</p>
                    <small>
                      {lang === "es"
                        ? "Cada resultado conserva documento y localizador. El E5 recupera pasajes; no asigna puntuación, elegibilidad ni cumplimiento."
                        : "Each result retains document and locator. E5 retrieves passages; it does not score or decide eligibility or compliance."}
                    </small>
                  </div>
                </article>
              </section>
              <div className="info-callout">
                <LockKeyhole size={17} />
                <p>
                  {lang === "es"
                    ? "El servicio E5 corre localmente en el equipo autorizado del GLF y no se expondrá en Vercel. Se conectará a Supabase usando permisos de personal y solo consultará el corpus autorizado."
                    : "The E5 service runs locally on an authorized GLF computer and is not exposed on Vercel. It connects to Supabase with staff access and only queries the authorized corpus."}
                </p>
              </div>
            </>
          )}
          <div className="mobile-bottom-nav">
            <button onClick={() => navigate("staff")}>
              <BarChart3 size={18} />
              <span>{t.overview}</span>
            </button>
            <button onClick={() => navigate("review")}>
              <ShieldCheck size={18} />
              <span>{t.safeguards}</span>
            </button>
            <button onClick={() => navigate("reports")}>
              <BarChart3 size={18} />
              <span>{t.reporting}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
