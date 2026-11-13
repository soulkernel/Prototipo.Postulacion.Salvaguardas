import type { ManualChapter, ManualGuide } from "./manual-types";

// User instructions verified against the internal screens and workflow permissions.
export const internalManualChapters: ManualChapter[] = [
  {
    id: "inicio",
    title: ["Orientación y recorrido de trabajo", "Orientation and workflow"],
    intro: [
      "El módulo interno reúne las postulaciones enviadas y las herramientas para revisarlas. El menú muestra las funciones disponibles para su cuenta.",
      "The internal module brings together submitted applications and tools for reviewing them. The menu displays the functions available to your account.",
    ],
    audience: [
      "Personal interno y lectores autorizados. Los accesos académicos son de consulta.",
      "Internal staff and authorized readers. Academic access is read-only.",
    ],
    screen: [
      [
        "Menú: Expedientes · Convocatorias · Asistente RAG",
        "Menu: Applications · Calls · RAG assistant",
      ],
      [
        "Reportes · Respaldos · Gestión de usuarios",
        "Reports · Backups · User management",
      ],
      [
        "Manual interno · Buscar un tema · Índice",
        "Internal manual · Search a topic · Contents",
      ],
      [
        "Consultar → Revisar → Resolver → Registrar convenio",
        "Read → Review → Decide → Record agreement",
      ],
    ],
    steps: [
      [
        "Entre con su cuenta y revise el correo que aparece en el encabezado. Los permisos corresponden a esa cuenta.",
        "Sign in and check the email in the header. Permissions belong to that account.",
      ],
      [
        "Abra Expedientes, seleccione la convocatoria y pulse Revisar en el proyecto que necesita atender.",
        "Open Applications, select the call and click Review on the project you need to handle.",
      ],
      [
        "Lea la versión presentada y sus documentos. Complete la revisión que corresponda a su función; use el asistente RAG cuando requiera evidencia normativa.",
        "Read the submitted version and its documents. Complete the review appropriate to your role; use the RAG assistant when you need documentary evidence.",
      ],
      [
        "Verifique la confirmación y el historial después de guardar. Consulte Reportes para conocer el avance de la convocatoria.",
        "Check confirmation and history after saving. Use Reports to see the call's progress.",
      ],
    ],
    rows: [
      [
        "Manual interno",
        "Abra esta guía desde el menú en cualquier pantalla interna. Busque por campo, acción o error; el índice permite saltar a un tema.",
        "Internal manual",
        "Open this guide from the menu on any internal screen. Search a field, action or error; use the contents to jump to a topic.",
      ],
      [
        "ES / EN",
        "Cambia la interfaz y la guía. Los textos ingresados por los usuarios conservan su idioma original.",
        "ES / EN",
        "Changes the interface and guide. User-entered content keeps its original language.",
      ],
      [
        "Volver a expedientes / Volver al expediente",
        "Use estos botones para regresar al listado o al proyecto. El recorrido desde el listado conserva sus filtros y página.",
        "Back to applications / Back to application",
        "Use these buttons to return to the list or project. Navigation from the list retains its filters and page.",
      ],
      [
        "Guardando / Procesando",
        "Espere la confirmación. Un botón ocupado impide repetir la operación mientras se procesa; no significa que ya se guardó.",
        "Saving / Processing",
        "Wait for confirmation. A busy button prevents repeated submissions while processing; it does not mean the operation has already been saved.",
      ],
      [
        "Imprimir / Guardar PDF",
        "Imprime esta guía completa, incluso con una búsqueda activa. En el diálogo del navegador seleccione Guardar como PDF si necesita una copia.",
        "Print / Save PDF",
        "Prints the entire guide, even during a search. Choose Save as PDF in the browser dialog if you need a copy.",
      ],
    ],
    outcome: [
      "Identifica dónde realizar cada tarea y cómo comprobar que quedó registrada.",
      "You know where to perform each task and how to confirm it was recorded.",
    ],
    tip: [
      "La secuencia institucional es: presentación, revisión, resolución y, cuando corresponde, convenio. Consultar o descargar información no cambia la etapa del expediente.",
      "The institutional sequence is submission, review, decision and, where applicable, agreement. Viewing or downloading information does not change the application stage.",
    ],
  },
  {
    id: "acceso",
    title: [
      "Ingreso, activación y seguridad",
      "Sign-in, activation and security",
    ],
    intro: [
      "El personal interno ingresa con una cuenta habilitada y segundo factor de autenticación. Una invitación pendiente todavía no equivale a una cuenta activada.",
      "Internal staff sign in with an enabled account and a second authentication factor. A pending invitation is not yet an activated account.",
    ],
    screen: [
      [
        "Invitación del GLF → Activar cuenta",
        "GLF invitation → Activate account",
      ],
      ["Correo y contraseña", "Email and password"],
      ["Seguridad → Aplicación autenticadora", "Security → Authenticator app"],
      ["Ingresar al módulo autorizado", "Enter the authorized module"],
    ],
    steps: [
      [
        "En su primer ingreso abra el enlace de invitación recibido por el canal acordado y siga la pantalla de activación para definir su contraseña.",
        "On first access, open the invitation link received through the agreed channel and follow the activation screen to set your password.",
      ],
      [
        "Configure el segundo factor en Seguridad mediante su aplicación autenticadora y confirme el código vigente. Mantenga la hora del dispositivo sincronizada.",
        "Set up the second factor in Security using your authenticator app and confirm the current code. Keep your device clock synchronized.",
      ],
      [
        "En ingresos posteriores use su correo, contraseña y el segundo factor solicitado. Si vuelve a Seguridad, complete la verificación antes de continuar.",
        "On subsequent visits use your email, password and the requested second factor. If redirected to Security, complete verification before continuing.",
      ],
      [
        "Si el enlace venció, solicite una nueva invitación al administrador. Al terminar, pulse Cerrar sesión, especialmente en equipos compartidos.",
        "If the link expired, ask the administrator for a new invitation. When finished, click Sign out, particularly on shared devices.",
      ],
    ],
    rows: [
      [
        "Correo del encabezado",
        "Identifica la cuenta conectada. Si no corresponde a su cuenta, cierre sesión e ingrese nuevamente.",
        "Header email",
        "Identifies the signed-in account. If it is not yours, sign out and sign in again.",
      ],
      [
        "Segundo factor",
        "Utilice el código actual de su autenticador. No comparta contraseñas, códigos ni enlaces de activación.",
        "Second factor",
        "Use the current code from your authenticator. Do not share passwords, codes or activation links.",
      ],
      [
        "Cuenta interna sin función asignada",
        "Puede ver la pantalla de acceso y esta guía; un responsable debe asignarle las funciones para operar expedientes.",
        "Internal account without assigned duties",
        "Can view the access screen and this guide; an authorized manager must assign duties before it can handle applications.",
      ],
      [
        "Cuenta inactiva o sesión revocada",
        "El sistema impide continuar. Consulte al administrador y vuelva a iniciar sesión cuando el acceso esté habilitado.",
        "Inactive account or revoked session",
        "The system prevents further access. Contact the administrator and sign in again once access is enabled.",
      ],
      [
        "Evaluador académico",
        "Utiliza acceso temporal con correo y contraseña, sin segundo factor. Consulta los datos habilitados; no administra ni modifica expedientes.",
        "Academic evaluator",
        "Uses temporary email/password access without a second factor. Views authorized data; cannot administer or modify applications.",
      ],
    ],
    outcome: [
      "Su sesión queda verificada y el menú corresponde a sus funciones vigentes.",
      "Your session is verified and the menu matches your current duties.",
    ],
    tip: [
      "Si pierde el autenticador, solicite asistencia al administrador. Crear otra cuenta no recupera automáticamente sus permisos ni su historial.",
      "If you lose your authenticator, contact the administrator. Creating another account does not automatically recover permissions or history.",
    ],
  },
  {
    id: "permisos",
    title: ["Funciones y permisos de cada perfil", "Roles and permissions"],
    intro: [
      "Las opciones dependen del perfil y de la etapa del expediente. Leer este manual no habilita acciones que su cuenta no tenga autorizadas.",
      "Options depend on your role and the application stage. Reading this manual does not enable actions your account is not authorized to perform.",
    ],
    screen: [
      ["Cuenta → Función asignada", "Account → Assigned role"],
      [
        "Menú disponible según permisos",
        "Available menu depends on permissions",
      ],
      ["Etapa y versión presentada", "Stage and submitted version"],
      [
        "Acciones habilitadas para esa función",
        "Actions enabled for that role",
      ],
    ],
    steps: [
      [
        "Revise el perfil mostrado en Expedientes.",
        "Check the role displayed in Applications.",
      ],
      [
        "Ubique su función en la tabla siguiente antes de iniciar una actuación.",
        "Find your role in the table below before taking action.",
      ],
      [
        "Si falta un botón, compruebe primero la etapa, si existe una corrección abierta y si su función puede ejecutar esa acción.",
        "If a button is missing, first check the stage, any open correction window and whether your role can perform the action.",
      ],
      [
        "Solicite al administrador revisar una asignación incorrecta; no use la cuenta de otra persona.",
        "Ask the administrator to review an incorrect assignment; do not use someone else's account.",
      ],
    ],
    rows: [
      [
        "Gestión de subvenciones",
        "Consulta expedientes y reportes; administra convocatorias, revisión administrativa, revisión de su área, correcciones y convenios. Gestiona usuarios de Proyectos solo con delegación.",
        "Grants management",
        "Views applications and reports; manages calls, administrative review, own-area review, corrections and agreements. Manages Project users only with delegation.",
      ],
      [
        "Sostenibilidad",
        "Consulta expedientes y reportes; registra revisión de salvaguardas y categoría global confirmada; utiliza RAG y guarda observaciones. Administra usuarios de su área solo con delegación.",
        "Sustainability",
        "Views applications and reports; records safeguards reviews and a confirmed overall category; uses RAG and saves observations. Manages area users only with delegation.",
      ],
      [
        "Coordinación de proyectos",
        "Consulta expedientes y reportes, realiza revisión administrativa y registra la revisión de coordinación y notas de seguimiento.",
        "Project coordination",
        "Views applications and reports, performs administrative review, and records coordination reviews and follow-up notes.",
      ],
      [
        "Comité / Consejo",
        "Consulta expedientes y reportes, guarda su evaluación individual y registra resoluciones según las condiciones del flujo.",
        "Committee / Council",
        "Views applications and reports, saves individual evaluations and records decisions subject to workflow requirements.",
      ],
      [
        "Administración",
        "Administra convocatorias, cuentas, descargas y corpus; consulta expedientes, evaluaciones y RAG. El rol no sustituye las atribuciones de revisión técnica, resolución o firma de otras funciones.",
        "Administration",
        "Manages calls, accounts, downloads and corpus; views applications, evaluations and RAG. The role does not replace other roles' technical review, decision or signing responsibilities.",
      ],
      [
        "Personal interno / acceso académico",
        "El personal sin función operativa conserva acceso limitado. El evaluador académico tiene consulta temporal y RAG sin guardar actuaciones; los controles operativos siguen protegidos.",
        "Internal member / academic access",
        "Staff without operational duties retain limited access. Academic evaluators have temporary read access and RAG without saving actions; operational controls remain protected.",
      ],
    ],
    tip: [
      "Las funciones de lectura, evaluación, resolución y administración están separadas. Un permiso de administración de usuarios del área no equivale a administración general.",
      "Reading, evaluation, decision-making and administration are separate duties. Area user management is not the same as general administration.",
    ],
  },
  {
    id: "expedientes",
    title: [
      "Expedientes: encontrar y abrir una postulación",
      "Applications: find and open a submission",
    ],
    intro: [
      "Esta bandeja reúne expedientes recibidos. Los borradores que el aplicante aún no ha enviado no forman parte del listado de recibidos.",
      "This inbox contains received applications. Applicant drafts that have not been submitted are not included in the received list.",
    ],
    screen: [
      [
        "Convocatoria · Categoría · Filas por página",
        "Call · Category · Rows per page",
      ],
      [
        "Buscar expedientes → Buscar / Limpiar",
        "Search applications → Search / Clear",
      ],
      [
        "Tarjetas de avance de los expedientes filtrados",
        "Progress cards for filtered applications",
      ],
      [
        "Referencia · Proyecto · Proponente · Etapa · Último envío",
        "Reference · Project · Applicant · Stage · Latest submission",
      ],
      ["Revisar → Expediente", "Review → Application"],
    ],
    steps: [
      [
        "Abra Expedientes y compruebe la convocatoria seleccionada; puede iniciar con una convocatoria predeterminada.",
        "Open Applications and check the selected call; a default call may be selected initially.",
      ],
      [
        "Seleccione convocatoria, categoría y cantidad de filas; el listado se actualiza al cambiar cada selector y vuelve a la primera página.",
        "Select call, category and number of rows; the list updates when each selector changes and returns to the first page.",
      ],
      [
        "Escriba parte del código, título, nombre del proponente u organización, o persona de contacto; pulse Buscar o Enter. La búsqueda ignora mayúsculas y tildes y consulta todas las páginas de los filtros seleccionados. Use Todas las convocatorias para buscar en años anteriores.",
        "Enter part of the reference, title, applicant or organization name, or contact person; click Search or press Enter. Search ignores case and accents and covers all pages within the selected filters. Use All calls to search previous years.",
      ],
      [
        "Limpiar elimina el texto de búsqueda y conserva convocatoria, categoría y filas por página. Al revisar un expediente y volver, se conservan búsqueda, filtros y página. Si no hay coincidencias, cambie el texto o amplíe los filtros.",
        "Clear removes the search text and keeps call, category and page size. Opening an application and returning preserves search, filters and page. If there are no matches, change the text or broaden the filters.",
      ],
      [
        "Compare referencia, título, proponente y etapa. Recorra las páginas si hay más resultados que filas visibles.",
        "Compare reference, title, applicant and stage. Browse pages if there are more results than visible rows.",
      ],
      [
        "Pulse Revisar, identificado con el icono de un ojo. Para regresar, use Volver a expedientes y conservará el contexto del listado.",
        "Click Review, identified by an eye icon. Use Back to applications to return with the list context preserved.",
      ],
    ],
    rows: [
      [
        "Convocatoria y categoría",
        "Delimitan qué expedientes se muestran. Un listado vacío puede deberse a filtros muy restrictivos.",
        "Call and category",
        "Determine which applications appear. An empty list can result from overly restrictive filters.",
      ],
      [
        "10, 25 o 50 filas",
        "Controla el tamaño de la página; no limita el total de expedientes disponibles ni el alcance de los indicadores.",
        "10, 25 or 50 rows",
        "Controls page size; does not limit the total available applications or the scope of the indicators.",
      ],
      [
        "Tarjetas de indicadores",
        "Resumen convocatorias, expedientes recibidos, en revisión, notas preseleccionadas y convenios firmados del conjunto consultado, no solo de la página visible.",
        "Indicator cards",
        "Summarize calls, received applications, applications under review, shortlisted notes and signed agreements for the queried set, not just the visible page.",
      ],
      [
        "Etapa / último envío",
        "Permiten identificar el estado y el envío más reciente. Las fechas operativas se presentan en hora de Galápagos.",
        "Stage / latest submission",
        "Identify status and latest submission. Operational dates use Galápagos time.",
      ],
      [
        "Revisar",
        "Abre la versión presentada del proyecto. El acceso está sujeto a los permisos de lectura de su cuenta.",
        "Review",
        "Opens the project's submitted version. Access is subject to your account's read permissions.",
      ],
    ],
    outcome: [
      "Abre el expediente correcto sin perder los filtros de su bandeja.",
      "You open the correct application without losing inbox filters.",
    ],
    tip: [
      "Si no encuentra un proyecto, amplíe convocatoria y categoría y confirme con el aplicante que lo envió; guardar un borrador no lo remite al GLF.",
      "If a project is missing, broaden call and category filters and confirm that the applicant submitted it; saving a draft does not send it to GLF.",
    ],
  },
  {
    id: "documentos",
    title: [
      "Documentos, versiones y anexos",
      "Documents, versions and attachments",
    ],
    intro: [
      "El encabezado indica la versión presentada y el estado actual. La consulta interna utiliza los datos enviados, aunque el aplicante tenga cambios posteriores en un borrador de corrección.",
      "The header shows the submitted version and current status. Internal review uses submitted data even if the applicant has later changes in a correction draft.",
    ],
    screen: [
      [
        "Referencia · Versión presentada · Estado",
        "Reference · Submitted version · Status",
      ],
      [
        "Documentos y versiones → Idioma del documento",
        "Documents and versions → Document language",
      ],
      [
        "Comprobante · Nota conceptual / Propuesta · Evaluación A&S",
        "Receipt · Concept note / Proposal · E&S assessment",
      ],
      [
        "Archivos firmados y anexos → Descargar",
        "Signed files and attachments → Download",
      ],
    ],
    steps: [
      [
        "Confirme referencia, fase y número de versión antes de revisar o descargar.",
        "Confirm reference, phase and version number before reviewing or downloading.",
      ],
      [
        "En Documentos y versiones escoja Español o English. Descargue el comprobante y los PDF correspondientes a la versión necesaria.",
        "In Documents and versions choose Español or English. Download the receipt and PDFs for the version you need.",
      ],
      [
        "Los botones de descarga entregan directamente el formato actual con los datos de esa versión enviada. Si necesita la presentación anterior, abra Historial de esta versión y descargue el documento original.",
        "Download buttons provide the current format using that submitted version's data. If you need the earlier presentation, open History of this version and download the original document.",
      ],
      [
        "Descargue por separado los archivos firmados y anexos. Despliegue Nota Conceptual completa y, en fase 2, Propuesta completa remitida para leer los datos en pantalla.",
        "Download signed files and attachments separately. Expand Complete Concept Note and, in phase 2, Submitted full proposal to read data on screen.",
      ],
    ],
    rows: [
      [
        "Idioma del documento",
        "Traduce títulos y etiquetas, no las respuestas del proponente ni el contenido de un archivo firmado.",
        "Document language",
        "Translates headings and labels, not applicant responses or signed-file content.",
      ],
      [
        "Historial de esta versión",
        "Disponible para envíos con formato anterior. Conserva las descargas originales del comprobante, nota conceptual o propuesta, y evaluación A&S. Los botones principales siempre usan la presentación actual; los datos enviados y los archivos firmados se conservan.",
        "History of this version",
        "Available for submissions using an earlier format. Preserves original receipt, concept note or proposal, and E&S assessment downloads. Main buttons always use the current presentation; submitted data and signed files are preserved.",
      ],
      [
        "Comprobante de recepción",
        "Identifica la recepción de esa versión y permite contrastar la fase y los datos registrados en el envío.",
        "Submission receipt",
        "Identifies receipt of that version and lets you cross-check its stage and recorded submission data.",
      ],
      [
        "Identificación del proponente",
        "En comprobantes y notas conceptuales del formato actual: persona natural, nombre del responsable del proyecto y su cédula; organización, nombre de la organización y su RUC. La persona de contacto se mantiene separada. Las copias de consulta de envíos anteriores usan sus datos registrados; no completan datos faltantes ni sustituyen originales o firmas.",
        "Applicant identification",
        "Current-format receipts and concept notes show the individual project lead with their identity card, or the organization name with its RUC. The contact person remains separate. Updated reference copies use the historical submission's recorded data; they do not fill missing data or replace originals or signatures.",
      ],
      [
        "Anexo 1",
        "Experiencia y capacidad: proyectos similares de la organización o currículo de la persona, cargados por el aplicante.",
        "Annex 1",
        "Experience and capacity: similar organization projects or the individual's CV, uploaded by the applicant.",
      ],
      [
        "Anexo 2 y Experiencia SGAS",
        "La evaluación ambiental y social mantiene su documento firmado. Experiencia SGAS es un PDF generado y anexado por el sistema al finalizar ese formulario; no requiere firma ni recarga.",
        "Annex 2 and ESMS experience",
        "The environmental and social assessment retains its signed document. ESMS experience is a PDF generated and attached by the system on form completion; it needs no signature or re-upload.",
      ],
      [
        "Anexo 3",
        "Cartas de apoyo de socios ejecutores. Contraste la organización asociada y el apoyo declarado en la versión remitida.",
        "Annex 3",
        "Implementation partner support letters. Cross-check the associated organization and support declared in the submitted version.",
      ],
    ],
    outcome: [
      "Distingue el contenido presentado, su copia de consulta y los originales firmados.",
      "You distinguish submitted content, its reference copy and signed originals.",
    ],
    tip: [
      "Si una descarga falla, conserve la referencia y versión, vuelva a intentar y revise la sesión. No interprete un archivo que no se descargó como un anexo inexistente.",
      "If a download fails, retain the reference and version, retry and check your session. A failed download does not mean the attachment is absent.",
    ],
  },
  {
    id: "riesgos",
    title: [
      "Leer el mapa y las evaluaciones de riesgo",
      "Read the risk map and assessments",
    ],
    intro: [
      "Cada evaluación corresponde a un riesgo de una actividad. El mapa agrupa evaluaciones que comparten probabilidad y gravedad; no asigna una categoría global al proyecto.",
      "Each assessment represents one risk in an activity. The map groups assessments sharing probability and severity; it does not assign an overall category to the project.",
    ],
    screen: [
      [
        "Eje horizontal: probabilidad de ocurrencia, 1–5",
        "Horizontal axis: probability of occurrence, 1–5",
      ],
      ["Eje vertical: gravedad, 1–5", "Vertical axis: severity, 1–5"],
      [
        "Celda: cantidad de riesgos evaluados",
        "Cell: number of assessed risks",
      ],
      [
        "Seleccionar celda → Identificar actividades y riesgos",
        "Select cell → Identify activities and risks",
      ],
    ],
    steps: [
      [
        "Revise el resumen de evaluaciones completas y las que faltan por calificar.",
        "Review the complete-assessment summary and those still needing ratings.",
      ],
      [
        "Ubique la probabilidad en el eje horizontal y la gravedad en el vertical. El número de evaluaciones de la celda es un conteo, no el puntaje de riesgo.",
        "Locate probability on the horizontal axis and severity on the vertical one. The assessment count in a cell is not the risk score.",
      ],
      [
        "Seleccione una celda ocupada en la web para consultar los códigos, actividades y riesgos que la componen. En el PDF use el detalle y la leyenda.",
        "Select an occupied cell on the web to see the codes, activities and risks it contains. In the PDF use the details and legend.",
      ],
      [
        "Lea las justificaciones de cada actividad y, en fase 2, las medidas, responsables, costos, calendario y riesgo residual.",
        "Read each activity's explanations and, in phase 2, measures, responsible parties, costs, schedule and residual risk.",
      ],
    ],
    rows: [
      [
        "Probabilidad × gravedad",
        "El producto de ambas calificaciones determina la categoría individual: Bajo 1–4; Medio 5–9; Alto 10–15; Muy alto 16–25.",
        "Probability × severity",
        "The product determines the individual category: Low 1–4; Medium 5–9; High 10–15; Very high 16–25.",
      ],
      [
        "Verde, amarillo, naranja y rojo",
        "Orientan de menor a mayor categoría. Lea también los nombres y valores; el color por sí solo no explica una evaluación.",
        "Green, yellow, orange and red",
        "Indicate increasing category. Also read names and values; color alone does not explain an assessment.",
      ],
      [
        "Varias evaluaciones en una celda",
        "Comparten calificaciones, pero pueden pertenecer a actividades distintas. Por ejemplo, seis evaluaciones con 3 × 3 son seis riesgos de puntaje 9.",
        "Several assessments in one cell",
        "Share ratings but may belong to different activities. For example, six assessments at 3 × 3 are six risks with a score of 9.",
      ],
      [
        "Sin calificar",
        "No se representan como riesgo cero ni se suman a una celda completa. Revise qué dato falta.",
        "Unrated",
        "Are not represented as zero risk or added to a complete cell. Check which value is missing.",
      ],
      [
        "Inicial / residual",
        "El inicial refleja la evaluación declarada; el residual corresponde a la situación tras las medidas en fase 2. No intercambie ambos mapas.",
        "Initial / residual",
        "Initial reflects the declared assessment; residual describes the situation after measures in phase 2. Do not interchange the two maps.",
      ],
      [
        "Categoría global",
        "Solo el especialista puede consignar una categoría global confirmada en su revisión. El mapa no la infiere por sumas o promedios.",
        "Overall category",
        "Only the specialist can record a confirmed overall category in their review. The map does not infer one from sums or averages.",
      ],
    ],
    tip: [
      "Un mapa sin evaluaciones completas requiere leer los riesgos y sus justificaciones; no demuestra ausencia de riesgo.",
      "A map without complete assessments requires reading risks and their explanations; it does not prove the absence of risk.",
    ],
  },
  {
    id: "evaluaciones",
    title: [
      "Revisión administrativa y evaluación individual",
      "Administrative review and individual evaluation",
    ],
    intro: [
      "El botón Revisión administrativa y evaluación abre un espacio de trabajo asociado a la versión presentada. Sus borradores individuales no emiten una resolución.",
      "Administrative review and evaluation opens a workspace tied to the submitted version. Individual drafts do not issue a decision.",
    ],
    audience: [
      "Gestión y Coordinación: revisión administrativa. Comité: evaluación técnica. Administración: ambas herramientas.",
      "Grants and Coordination: administrative review. Committee: technical evaluation. Administration: both tools.",
    ],
    screen: [
      [
        "Expediente → Revisión administrativa y evaluación",
        "Application → Administrative review and evaluation",
      ],
      [
        "Criterios de la plantilla y respuestas",
        "Template criteria and answers",
      ],
      ["Observaciones · Total o suma parcial", "Notes · Total or partial sum"],
      [
        "Guardar mi borrador → Historial de mis borradores",
        "Save my draft → My draft history",
      ],
    ],
    steps: [
      [
        "Compruebe el proyecto, la versión y la fase en el encabezado.",
        "Check project, version and phase in the header.",
      ],
      [
        "Responda cada criterio de la plantilla que muestra su perfil; puede conservar criterios sin responder mientras trabaja.",
        "Answer the template criteria available to your role; you can leave items unanswered while working.",
      ],
      [
        "Escriba sus observaciones y pulse Guardar mi borrador. Espere Borrador guardado antes de salir.",
        "Write your notes and click Save my draft. Wait for Draft saved before leaving.",
      ],
      [
        "Consulte Historial de mis borradores y use Volver al expediente para continuar con la revisión formal cuando corresponda.",
        "Check My draft history and use Back to application to continue with formal review when appropriate.",
      ],
    ],
    rows: [
      [
        "Checklist administrativo",
        "Opciones: Sí, No, Pendiente y No aplica. Fundamente dudas en Observaciones.",
        "Administrative checklist",
        "Options: Yes, No, Pending and Not applicable. Explain doubts in Notes.",
      ],
      [
        "Evaluación técnica",
        "Escala 1–5: Muy deficiente, Deficiente, Adecuado, Bueno y Muy bueno. El máximo mostrado depende del número de criterios.",
        "Technical evaluation",
        "Scale 1–5: Very poor, Poor, Adequate, Good and Very good. The displayed maximum depends on the number of criteria.",
      ],
      [
        "Sin responder",
        "No equivale a cero. La suma es parcial mientras falte algún criterio; no la interprete como calificación definitiva.",
        "Unanswered",
        "Does not mean zero. The sum remains partial while any criterion is missing; do not treat it as a final score.",
      ],
      [
        "Observaciones",
        "Hasta 5.000 caracteres. Registre la evidencia o explicación que sustenta su respuesta.",
        "Notes",
        "Up to 5,000 characters. Record the evidence or explanation supporting your answer.",
      ],
      [
        "Guardar mi borrador",
        "Guarda solo su trabajo y registra su revisión. No sustituye Guardar revisión ni Registrar resolución. No hay promedio definitivo ni cierre automático de evaluaciones.",
        "Save my draft",
        "Saves only your work and records its revision. Does not replace Save review or Record decision. There is no final average or automatic evaluation closure.",
      ],
      [
        "Edición bloqueada",
        "La etapa o una corrección autorizada pueden impedir editar. Consulte el estado del expediente; no intente revisar un borrador no reenviado.",
        "Editing locked",
        "The stage or an authorized correction may prevent editing. Check application status; do not review an unsubmitted correction draft.",
      ],
    ],
    tip: [
      "Para pequeñas subvenciones sigue permitido el cofinanciamiento cero. No use un criterio del checklist para imponer una obligación distinta de las reglas del expediente.",
      "Zero cofinancing remains allowed for small grants. Do not use a checklist item to impose a requirement different from the application's rules.",
    ],
  },
  {
    id: "revision",
    title: [
      "Registrar la revisión técnica de su área",
      "Record your area's technical review",
    ],
    intro: [
      "Esta actuación formal guarda hallazgos y recomendación para la revisión vigente. Se diferencia del borrador de evaluación y de una nota de seguimiento.",
      "This formal action records findings and recommendations for the current revision. It differs from an evaluation draft or follow-up note.",
    ],
    audience: [
      "Gestión de subvenciones, Sostenibilidad y Coordinación de proyectos, cada una en su área.",
      "Grants management, Sustainability and Project coordination, each for their own area.",
    ],
    screen: [
      ["Registrar revisión de mi área", "Record my area's review"],
      ["Hallazgos y evidencia", "Findings and evidence"],
      [
        "Recomendación técnica · Categoría global, si corresponde",
        "Technical recommendation · Overall category, if applicable",
      ],
      [
        "Guardar revisión → Operación registrada",
        "Save review → Operation recorded",
      ],
    ],
    steps: [
      [
        "Revise los documentos y confirme que el expediente se encuentra en revisión y no está esperando una corrección del aplicante.",
        "Review documents and confirm the application is under review and not awaiting an applicant correction.",
      ],
      [
        "Complete Hallazgos y evidencia con hechos verificables; cite documentos o secciones que sustenten su análisis.",
        "Complete Findings and evidence with verifiable facts; cite supporting documents or sections.",
      ],
      [
        "Escriba la Recomendación técnica. Si es especialista de Sostenibilidad puede consignar la categoría global que haya confirmado.",
        "Write the Technical recommendation. As a Sustainability specialist, you may record an overall category you have confirmed.",
      ],
      [
        "Pulse Guardar revisión y compruebe Operación registrada y la nueva entrada en Historia de revisión.",
        "Click Save review and check Operation recorded and the new entry in Review history.",
      ],
    ],
    rows: [
      [
        "Hallazgos y evidencia",
        "Campo obligatorio de hasta 12.000 caracteres. Describa lo observado y su fundamento.",
        "Findings and evidence",
        "Required, up to 12,000 characters. Describe observations and their basis.",
      ],
      [
        "Recomendación técnica",
        "Campo obligatorio de hasta 12.000 caracteres. Es la recomendación de su área, no una decisión automática del comité.",
        "Technical recommendation",
        "Required, up to 12,000 characters. Your area's recommendation, not an automatic committee decision.",
      ],
      [
        "Categoría global confirmada",
        "Opcional y exclusiva de Sostenibilidad, hasta 100 caracteres. No proviene automáticamente del mapa ni de RAG.",
        "Confirmed overall category",
        "Optional and exclusive to Sustainability, up to 100 characters. Not automatically produced by the map or RAG.",
      ],
      [
        "Guardar revisión",
        "Conserva la actuación vinculada a la revisión vigente. El primer registro puede pasar una nota enviada a En revisión.",
        "Save review",
        "Preserves the action linked to the current revision. The first review can move a submitted note to Under review.",
      ],
      [
        "Conflicto de versión",
        "Si otra actuación cambió el expediente, conserve su texto, actualice la pantalla y contraste la nueva versión antes de volver a guardar.",
        "Version conflict",
        "If another action changed the application, retain your text, refresh the screen and compare the new version before saving again.",
      ],
    ],
    outcome: [
      "La revisión queda identificada por área, autor y versión en el historial.",
      "The review is identified by area, author and version in history.",
    ],
    tip: [
      "Las revisiones registradas se conservan. Si necesita ampliar o aclarar una actuación, añada el registro correspondiente; no presuponga que puede sobrescribir el historial.",
      "Recorded reviews are retained. To expand or clarify an action, add the appropriate record; do not assume you can overwrite history.",
    ],
  },
  {
    id: "historial",
    title: [
      "Notas de seguimiento e historia de revisión",
      "Follow-up notes and review history",
    ],
    intro: [
      "Las notas permiten registrar observaciones posteriores sin cambiar decisiones ni sustituir revisiones técnicas. Siempre quedan vinculadas a una versión presentada.",
      "Notes record subsequent observations without changing decisions or replacing technical reviews. They are always linked to a submitted version.",
    ],
    screen: [
      ["Añadir nota de seguimiento", "Add follow-up note"],
      [
        "Observación · Recomendación opcional",
        "Observation · Optional recommendation",
      ],
      ["Guardar nota en el historial", "Save note to history"],
      [
        "Historia de revisión → Versiones, actuaciones y fechas",
        "Review history → Versions, actions and dates",
      ],
    ],
    steps: [
      [
        "En el expediente, lea primero Historia de revisión para conocer las actuaciones existentes.",
        "In the application, first read Review history to understand existing actions.",
      ],
      [
        "Si su función permite añadir notas, describa la observación y, cuando corresponda, la siguiente acción recomendada.",
        "If your role allows adding notes, describe the observation and, where appropriate, the recommended next action.",
      ],
      [
        "Pulse Guardar nota en el historial. Compruebe la confirmación y localice el registro nuevo.",
        "Click Save note to history. Check confirmation and locate the new record.",
      ],
      [
        "Al consultar el historial distinga revisiones técnicas, notas, resoluciones y eventos; contraste siempre versión, fecha y área.",
        "When reading history distinguish technical reviews, notes, decisions and events; always compare version, date and area.",
      ],
    ],
    rows: [
      [
        "Observación de seguimiento",
        "Obligatoria, hasta 12.000 caracteres. Registre una observación concreta de la etapa.",
        "Follow-up observation",
        "Required, up to 12,000 characters. Record a specific observation for the stage.",
      ],
      [
        "Recomendación o siguiente acción",
        "Opcional, hasta 12.000 caracteres. No configura por sí misma un plazo ni reabre el formulario.",
        "Recommendation or next action",
        "Optional, up to 12,000 characters. Does not itself set a deadline or reopen the form.",
      ],
      [
        "Versión vinculada",
        "Identifica el envío al que se refiere la nota. No la confunda con cambios posteriores del borrador.",
        "Linked version",
        "Identifies the submission to which the note refers. Do not confuse it with later draft changes.",
      ],
      [
        "Historia de revisión",
        "Conserva revisiones y notas, junto con resoluciones y eventos. Los registros no se borran para ocultar una actuación anterior.",
        "Review history",
        "Retains reviews and notes alongside decisions and events. Records are not deleted to conceal a previous action.",
      ],
      [
        "Alcance de una nota",
        "No reemplaza la revisión de salvaguardas requerida para una decisión ni envía automáticamente un mensaje al aplicante.",
        "Scope of a note",
        "Does not replace the safeguards review required for a decision or automatically send a message to the applicant.",
      ],
    ],
    tip: [
      "Para pedir una corrección use Autorizar corrección, cuando proceda. Para resolver use Registrar resolución. Una nota deja constancia, pero no ejecuta esos procesos.",
      "To request a correction use Authorize a correction when applicable. To decide use Record a decision. A note documents information but does not execute those processes.",
    ],
  },
  {
    id: "correcciones",
    title: [
      "Autorizar y revisar una corrección",
      "Authorize and review a correction",
    ],
    intro: [
      "La reapertura concede al aplicante una ventana para corregir y reenviar. La versión recibida se conserva como antecedente.",
      "Reopening gives the applicant a window to correct and resubmit. The received version remains as historical evidence.",
    ],
    audience: [
      "Solo Gestión de subvenciones autoriza la reapertura.",
      "Only Grants management authorizes reopening.",
    ],
    screen: [
      ["Autorizar corrección", "Authorize a correction"],
      ["Fecha límite en Galápagos", "Deadline in Galápagos time"],
      [
        "Corrección solicitada al aplicante",
        "Correction requested from applicant",
      ],
      [
        "Autorizar reapertura → Esperar reenvío",
        "Authorize reopening → Await resubmission",
      ],
    ],
    steps: [
      [
        "Describa de forma precisa lo que debe corregirse y dónde se encuentra; evite instrucciones contradictorias con las reglas de la convocatoria.",
        "Describe precisely what must be corrected and where; avoid instructions conflicting with call rules.",
      ],
      [
        "Defina una fecha límite futura dentro del plazo de la convocatoria o de fase 2, según corresponda.",
        "Set a future deadline within the call or phase 2 deadline, as applicable.",
      ],
      [
        "Pulse Autorizar reapertura y compruebe la confirmación y el aviso de corrección autorizada.",
        "Click Authorize reopening and check confirmation and the authorized-correction notice.",
      ],
      [
        "Espere el reenvío del aplicante. Revise la nueva versión y sus documentos antes de registrar revisión o resolución.",
        "Wait for applicant resubmission. Review the new version and documents before recording a review or decision.",
      ],
    ],
    rows: [
      [
        "Fecha límite",
        "Se interpreta en hora de Galápagos. El calendario limita el ingreso a fechas futuras que no superen el cierre aplicable. Si la fase está cerrada, los controles quedan deshabilitados y se explica el motivo.",
        "Deadline",
        "Uses Galápagos time. The calendar allows future dates up to the applicable deadline. If the phase has closed, controls are disabled and the reason is displayed.",
      ],
      [
        "Motivo de corrección",
        "Es obligatorio. La autorización se registra en el historial con el motivo y plazo.",
        "Correction reason",
        "Required. Authorization is recorded in history with its reason and deadline.",
      ],
      [
        "Ventana abierta",
        "El aviso señala que se espera al aplicante. No emita una resolución mientras esté abierta.",
        "Open window",
        "The notice indicates the application is awaiting the applicant. Do not issue a decision while it is open.",
      ],
      [
        "Plazo vencido sin reenvío",
        "El vencimiento no convierte cambios no enviados en una versión presentada. Revise el estado y coordine la actuación con Gestión.",
        "Expired deadline without resubmission",
        "Expiry does not turn unsubmitted edits into a submitted version. Check status and coordinate with Grants management.",
      ],
    ],
    outcome: [
      "La autorización queda registrada; solo un reenvío genera el contenido presentado que debe revisarse nuevamente.",
      "Authorization is recorded; only resubmission provides the submitted content to be reviewed again.",
    ],
    tip: [
      "Guardar una corrección como borrador no completa el reenvío. El aplicante debe cumplir nuevamente las validaciones y los documentos correspondientes a sus cambios.",
      "Saving a correction draft does not complete resubmission. The applicant must satisfy validations and document requirements for the changes.",
    ],
  },
  {
    id: "resoluciones",
    title: [
      "Resoluciones e invitación a fase 2",
      "Decisions and phase 2 invitations",
    ],
    intro: [
      "Una resolución es una actuación institucional sustentada en un acta o referencia y una fundamentación. No se genera a partir de los puntajes o de una respuesta del asistente.",
      "A decision is an institutional action supported by minutes or a reference and a rationale. It is not generated from scores or an assistant answer.",
    ],
    audience: [
      "Perfil Comité / Consejo. El CAT registra recomendaciones.",
      "Committee / Council role. CAT records recommendations.",
    ],
    screen: [
      ["Órgano · Decisión", "Decision-making body · Decision"],
      ["Referencia de acta · Fundamentación", "Minutes reference · Rationale"],
      [
        "Plazo de fase 2 o monto aprobado, según decisión",
        "Phase 2 deadline or approved amount, depending on decision",
      ],
      [
        "Registrar resolución → Verificar estado e historial",
        "Record decision → Check status and history",
      ],
    ],
    steps: [
      [
        "Verifique que la versión actual esté enviada, no haya una corrección abierta y exista la revisión técnica requerida.",
        "Verify that the current version is submitted, there is no open correction and the required technical review exists.",
      ],
      [
        "Seleccione el órgano y una decisión coherente con la fase. El CAT únicamente emite recomendación.",
        "Select the body and a decision appropriate to the phase. CAT only issues recommendations.",
      ],
      [
        "Complete referencia y fundamentación. Para invitar a fase 2 establezca un plazo futuro; para aprobar fase 2 registre el monto aprobado.",
        "Complete reference and rationale. For phase 2 invitations set a future deadline; for phase 2 approval record the approved amount.",
      ],
      [
        "Pulse Registrar resolución. Compruebe el estado y la entrada de resolución en el historial antes de continuar.",
        "Click Record decision. Check status and the decision entry in history before continuing.",
      ],
    ],
    rows: [
      [
        "Fase 1",
        "Permite recomendación CAT, invitar a fase 2 o no seleccionar. La invitación habilita la siguiente fase; no aprueba financiamiento.",
        "Phase 1",
        "Allows CAT recommendation, phase 2 invitation or non-selection. Invitation enables the next phase; it does not approve funding.",
      ],
      [
        "Fase 2",
        "Permite aprobar o no aprobar el proyecto completo. La aprobación requiere un monto positivo.",
        "Phase 2",
        "Allows approval or non-approval of the full proposal. Approval requires a positive amount.",
      ],
      [
        "Revisión de salvaguardas",
        "Las decisiones distintas de la recomendación requieren una revisión de salvaguardas de la revisión vigente. Una nota de seguimiento o borrador no la sustituye.",
        "Safeguards review",
        "Decisions other than a recommendation require a safeguards review for the current revision. A follow-up note or draft does not replace it.",
      ],
      [
        "Invitación",
        "Exige plazo futuro y que la convocatoria tenga configurados los apartados oficiales de fase 2.",
        "Invitation",
        "Requires a future deadline and configured official phase 2 sections in the call.",
      ],
      [
        "Acta y fundamentación",
        "Ambas son obligatorias. Permiten rastrear el sustento institucional de la resolución.",
        "Minutes and rationale",
        "Both are required. They provide traceability to the institutional basis for the decision.",
      ],
      [
        "Error de versión o estado",
        "Actualice y compruebe si otra actuación o un reenvío cambió el expediente; no repita la resolución sin revisar su historial.",
        "Version or state error",
        "Refresh and check whether another action or resubmission changed the application; do not repeat a decision without checking history.",
      ],
    ],
    tip: [
      "La recomendación CAT no cambia por sí sola el estado a aprobado ni habilita un convenio. La decisión debe registrarse por el órgano y la función correspondientes.",
      "A CAT recommendation does not itself approve the application or enable an agreement. The decision must be recorded by the appropriate body and role.",
    ],
  },
  {
    id: "convenios",
    title: ["Registrar un convenio firmado", "Record a signed agreement"],
    intro: [
      "Esta sección aparece para Gestión de subvenciones cuando el proyecto está aprobado. Cargar el archivo y registrar el convenio son dos acciones diferentes.",
      "This section appears for Grants management when a project is approved. Uploading the file and recording the agreement are two separate actions.",
    ],
    screen: [
      [
        "Convenio firmado → Subir documento",
        "Signed agreement → Upload document",
      ],
      ["Documento firmado · Referencia", "Signed document · Reference"],
      [
        "Monto · Cofinanciamiento · Fechas de ambas firmas",
        "Amount · Cofinancing · Both signature dates",
      ],
      ["Registrar convenio firmado", "Record signed agreement"],
    ],
    steps: [
      [
        "Abra el expediente aprobado y cargue el convenio firmado en la sección correspondiente.",
        "Open the approved application and upload the signed agreement in the relevant section.",
      ],
      [
        "Seleccione el archivo cargado en Documento firmado e ingrese la referencia del convenio.",
        "Select the uploaded file in Signed document and enter the agreement reference.",
      ],
      [
        "Registre monto aprobado, cofinanciamiento y las fechas de firma del GLF y del beneficiario; contrástelos con el documento.",
        "Record approved amount, cofinancing and GLF and grantee signature dates; compare them with the document.",
      ],
      [
        "Pulse Registrar convenio firmado y compruebe la confirmación, el estado y su reflejo en los reportes.",
        "Click Record signed agreement and check confirmation, status and its appearance in reports.",
      ],
    ],
    rows: [
      [
        "Documento firmado",
        "Debe ser un archivo de convenio cargado en este expediente. Una selección vacía impide registrar.",
        "Signed document",
        "Must be an agreement file uploaded to this application. An empty selection prevents recording.",
      ],
      [
        "Referencia",
        "Identifica el convenio institucional y es obligatoria.",
        "Reference",
        "Identifies the institutional agreement and is required.",
      ],
      [
        "Monto aprobado / cofinanciamiento",
        "Consigne USD: monto positivo y cofinanciamiento cero o mayor. Compruebe coherencia con la resolución y el documento.",
        "Approved amount / cofinancing",
        "Enter USD: positive amount and nonnegative cofinancing. Check consistency with the decision and document.",
      ],
      [
        "Firma GLF / firma beneficiario",
        "Registre ambas fechas reales; cargar el archivo no completa estos campos.",
        "GLF signature / grantee signature",
        "Record both actual dates; uploading the file does not fill these fields.",
      ],
    ],
    outcome: [
      "El convenio queda asociado al expediente con archivo, referencia, montos y fechas de firma.",
      "The agreement is linked to the application with its file, reference, amounts and signature dates.",
    ],
    tip: [
      "Una aprobación y un convenio firmado son hitos distintos. No registre un convenio solo porque la propuesta esté aprobada.",
      "Approval and a signed agreement are different milestones. Do not record an agreement merely because the proposal is approved.",
    ],
  },
  {
    id: "convocatorias",
    title: ["Convocatorias: preparar un borrador", "Calls: prepare a draft"],
    intro: [
      "Gestión de subvenciones y Administración pueden preparar convocatorias, comprobarlas y publicarlas. Guardar un borrador permite continuar su configuración sin abrir postulaciones.",
      "Grants management and Administration can prepare, check and publish calls. Saving a draft lets you continue configuration without opening applications.",
    ],
    screen: [
      [
        "Convocatorias → Preparar nueva convocatoria",
        "Calls → Prepare a new call",
      ],
      [
        "Temas · Código · Versión de bases · Títulos ES/EN",
        "Topics · Code · Rules version · ES/EN titles",
      ],
      [
        "Apertura y cierre · Descripciones · Solicitantes",
        "Opening and closing · Descriptions · Applicants",
      ],
      ["Guardar borrador", "Save draft"],
    ],
    steps: [
      [
        "Abra Convocatorias. Prepare una nueva o use Duplicar como borrador en una existente para partir de sus parámetros.",
        "Open Calls. Prepare a new call or use Duplicate as draft on an existing one to start from its parameters.",
      ],
      [
        "Revise las líneas temáticas y el código sugerido. Complete la versión de bases y los títulos en español e inglés.",
        "Review thematic lines and the suggested code. Complete the rules version and Spanish and English titles.",
      ],
      [
        "Establezca apertura y cierre en hora de Galápagos, las descripciones en ambos idiomas y los tipos de solicitante admitidos.",
        "Set opening and closing in Galápagos time, descriptions in both languages and eligible applicant types.",
      ],
      [
        "Pulse Guardar borrador. Continúe con categorías, anexos y demás parámetros antes de usar Vista previa y Publicar convocatoria.",
        "Click Save draft. Complete categories, attachments and other parameters before using Preview and Publish call.",
      ],
    ],
    rows: [
      [
        "Preparar nueva convocatoria",
        "Inicia una configuración nueva; no publica ni abre la recepción por sí sola.",
        "Prepare a new call",
        "Starts a new configuration; does not itself publish or open submission.",
      ],
      [
        "Duplicar como borrador",
        "Permite reutilizar una convocatoria como punto de partida. Revise código, fechas, temas y requisitos antes de publicar la nueva.",
        "Duplicate as draft",
        "Reuses a call as a starting point. Review code, dates, topics and requirements before publishing the new one.",
      ],
      [
        "Líneas temáticas",
        "Seleccione o edite los temas y sus rótulos ES/EN. Termine de añadir o editar cada tema antes de guardar el conjunto.",
        "Thematic lines",
        "Select or edit topics and their ES/EN labels. Finish adding or editing each topic before saving the full configuration.",
      ],
      [
        "Código / versión de bases",
        "Identifican la convocatoria y sus reglas. Revise los valores sugeridos y use una identificación institucional coherente.",
        "Code / rules version",
        "Identify the call and its rules. Review suggested values and use consistent institutional identifiers.",
      ],
      [
        "Apertura y cierre",
        "Controlan el período de recepción. Compruebe fecha, hora y secuencia; la zona horaria es Galápagos.",
        "Opening and closing",
        "Control the submission period. Check date, time and order; the time zone is Galápagos.",
      ],
      [
        "Tipos de solicitante",
        "Personas naturales y organizaciones se habilitan según las bases; esta elección afecta el formulario externo.",
        "Applicant types",
        "Individuals and organizations are enabled according to the rules; this choice affects the external form.",
      ],
    ],
    outcome: [
      "Tiene un borrador guardado, identificado y editable para completar sus parámetros.",
      "You have a saved, identified, editable draft whose parameters can be completed.",
    ],
    tip: [
      "Al duplicar no presuponga que las fechas o requisitos de la convocatoria anterior siguen vigentes. La nueva convocatoria requiere su propia revisión.",
      "When duplicating, do not assume the previous dates or requirements still apply. The new call needs its own review.",
    ],
  },
  {
    id: "reglas",
    title: [
      "Configurar categorías, anexos y fase 2",
      "Configure categories, attachments and phase 2",
    ],
    intro: [
      "Estos parámetros conectan las bases con las validaciones del formulario. Configure lo aprobado para la convocatoria y revise ambos idiomas.",
      "These parameters connect call rules to form validations. Configure the approved requirements and review both languages.",
    ],
    screen: [
      [
        "Categorías habilitadas: montos, meses y cofinanciamiento",
        "Enabled categories: amounts, months and cofinancing",
      ],
      [
        "Límite del resumen · Tope administrativo",
        "Summary limit · Administrative cap",
      ],
      [
        "Requisitos de anexos · Privacidad ES/EN",
        "Attachment requirements · ES/EN privacy",
      ],
      [
        "Apartados de fase 2 → Guardar borrador",
        "Phase 2 sections → Save draft",
      ],
    ],
    steps: [
      [
        "Revise cada categoría habilitada: mínimo, máximo si existe, plazo máximo en meses y porcentaje mínimo de cofinanciamiento.",
        "Review each enabled category: minimum, maximum where applicable, maximum term in months and minimum cofinancing percentage.",
      ],
      [
        "Compruebe el límite de palabras del resumen. La nota conceptual aplica un máximo administrativo fijo del 10 % del costo total; el límite configurable corresponde a la propuesta completa de fase 2.",
        "Check the summary word limit. The concept note uses a fixed administrative cap of 10% of total cost; the configurable cap applies to the phase-two full proposal.",
      ],
      [
        "Configure los requisitos de anexos y los avisos de privacidad en español e inglés. Distinga documentos firmados, anexos manuales y documentos generados.",
        "Configure attachment requirements and Spanish and English privacy notices. Distinguish signed documents, manual attachments and generated documents.",
      ],
      [
        "Para fase 2 registre un apartado por línea en ambos idiomas y en el mismo orden. Guarde y atienda los mensajes de validación.",
        "For phase 2 enter one section per line in both languages in the same order. Save and address validation messages.",
      ],
    ],
    rows: [
      [
        "Habilitar categoría",
        "Determina si la categoría se ofrece al aplicante. Los rangos deben ser coherentes entre categorías.",
        "Enable category",
        "Determines whether applicants can select the category. Ranges must be consistent across categories.",
      ],
      [
        "Monto mínimo / máximo",
        "Se expresan en USD. El máximo vacío solo corresponde cuando la categoría no establece un techo; respete los rangos del conjunto de reglas.",
        "Minimum / maximum amount",
        "Expressed in USD. A blank maximum is appropriate only when the category has no ceiling; follow the ruleset ranges.",
      ],
      [
        "Plazo y cofinanciamiento",
        "El plazo es el máximo permitido, no una duración obligatoria. Un mínimo de cofinanciamiento cero permite no aportar fondos adicionales.",
        "Term and cofinancing",
        "The term is the maximum allowed, not a mandatory duration. A zero minimum cofinancing rate allows no additional funding.",
      ],
      [
        "Presupuesto resumido",
        "En la nota conceptual se exige concordancia con GLF más cofinanciamiento. Los componentes administrativos y remuneraciones forman parte del total; no se agregan dos veces.",
        "Summary budget",
        "The concept-note budget must match GLF funding plus cofinancing. Administrative costs and remuneration are included components, not added twice.",
      ],
      [
        "Anexos",
        "Revise cada requisito en el editor. Experiencia SGAS se genera al finalizar el paso 5; el aplicante gestiona los anexos y documentos firmados al final, en Revisar y enviar.",
        "Attachments",
        "Review each requirement in the editor. ESMS experience is generated on step 5 completion; applicants manage attachments and signed documents at the end, in Review and submit.",
      ],
      [
        "Campos oficiales de fase 2",
        "Ambas listas deben corresponder línea por línea. Sin esa configuración no pueden emitirse invitaciones a la segunda fase.",
        "Official phase 2 fields",
        "Both lists must correspond line by line. Phase 2 invitations cannot be issued without this configuration.",
      ],
    ],
    tip: [
      "La convocatoria publicada conserva sus reglas y cada expediente su referencia de reglas. No cambie parámetros para eludir una validación de un expediente existente.",
      "Published calls retain their rules and each application its rules reference. Do not change parameters to bypass an existing application's validation.",
    ],
  },
  {
    id: "publicacion",
    title: [
      "Vista previa y publicación de convocatorias",
      "Preview and publish calls",
    ],
    intro: [
      "La publicación es explícita y exige una confirmación final. Al completarse, el sistema muestra la convocatoria publicada y un mensaje de confirmación. Un enlace anterior de edición abre su vista de consulta si ya fue publicada. La vista previa usa la última configuración guardada.",
      "Publishing is explicit and requires final confirmation. On completion, the system displays the published call and a confirmation. An older edit link opens the read-only view if the call has already been published. Preview uses the latest saved configuration.",
    ],
    screen: [
      [
        "Guardar borrador → Revisar validaciones",
        "Save draft → Review validations",
      ],
      ["Vista previa → Español / English", "Preview → Español / English"],
      [
        "Publicar convocatoria → Confirmar publicación",
        "Publish call → Confirm publication",
      ],
      [
        "Confirmar y publicar → Estado Publicada",
        "Confirm and publish → Published status",
      ],
    ],
    steps: [
      [
        "Guarde los cambios. Si hay edición sin guardar, la vista previa y publicación de esa edición no están listas.",
        "Save changes. If edits are unsaved, preview and publication of those edits are not ready.",
      ],
      [
        "Revise Para publicar, complete lo siguiente; corrija cada punto y vuelva a guardar.",
        "Review Before publishing, complete the following; correct each item and save again.",
      ],
      [
        "Abra Vista previa y examine ambos idiomas, temas, fechas, categorías y requisitos. Use Volver a editar si necesita corregir.",
        "Open Preview and examine both languages, topics, dates, categories and requirements. Use Back to editing if corrections are needed.",
      ],
      [
        "Pulse Publicar convocatoria, lea la confirmación y confirme solo cuando esté conforme. Espere el estado Convocatoria publicada.",
        "Click Publish call, read the confirmation and confirm only when satisfied. Wait for Call published status.",
      ],
    ],
    rows: [
      [
        "Vista previa deshabilitada",
        "Guarde primero el borrador y cualquier cambio pendiente. La vista previa no sustituye el guardado.",
        "Preview disabled",
        "Save the draft and any pending edits first. Preview does not replace saving.",
      ],
      [
        "Publicar deshabilitado",
        "Revise los requisitos pendientes, cambios sin guardar y estado del registro. La publicación no permite un borrador incompleto.",
        "Publish disabled",
        "Check missing requirements, unsaved edits and record status. Publishing does not allow an incomplete draft.",
      ],
      [
        "Confirmar y publicar",
        "Hace efectiva la publicación. La disponibilidad para recibir postulaciones depende también de las fechas de apertura y cierre.",
        "Confirm and publish",
        "Makes publication effective. Submission availability also depends on opening and closing dates.",
      ],
      [
        "Convocatoria publicada",
        "El editor queda protegido frente a modificaciones ordinarias. Use Duplicar como borrador para preparar una nueva convocatoria.",
        "Published call",
        "The editor is protected against ordinary changes. Use Duplicate as draft to prepare a new call.",
      ],
      [
        "Conflicto de revisión",
        "Otro usuario pudo actualizar el borrador. Recargue y compare los datos vigentes antes de volver a publicar.",
        "Revision conflict",
        "Another user may have updated the draft. Reload and compare current data before publishing again.",
      ],
    ],
    outcome: [
      "La convocatoria queda publicada con los parámetros revisados y el período de recepción establecido.",
      "The call is published with reviewed parameters and a defined submission period.",
    ],
    tip: [
      "Guardar, previsualizar y publicar son tres acciones distintas. Compruebe el estado final para saber cuál se completó.",
      "Saving, previewing and publishing are three different actions. Check final status to know which was completed.",
    ],
  },
  {
    id: "rag",
    title: [
      "Asistente RAG: contexto y consulta",
      "RAG assistant: context and query",
    ],
    intro: [
      "RAG significa generación aumentada por recuperación: el asistente consulta documentos para apoyar el análisis de salvaguardas. Ofrece búsqueda semántica E5 y respuestas fundamentadas con BM25 + Qwen.",
      "RAG means retrieval-augmented generation: the assistant consults documents to support safeguards analysis. It offers E5 semantic search and grounded answers with BM25 + Qwen.",
    ],
    audience: [
      "Sostenibilidad y Administración. Los evaluadores académicos consultan sin guardar actuaciones.",
      "Sustainability and Administration. Academic evaluators query without saving actions.",
    ],
    screen: [
      [
        "1. Desde un proyecto / Consulta libre",
        "1. From a project / Free query",
      ],
      [
        "Convocatoria → Proyecto enviado → Riesgo",
        "Call → Submitted project → Risk",
      ],
      [
        "2. Respuesta con fuentes / Buscar fragmentos",
        "2. Answer with sources / Find passages",
      ],
      ["Su consulta → Consultar", "Your question → Submit query"],
    ],
    steps: [
      [
        "Abra Asistente RAG o Revisar riesgos con el asistente RAG desde un expediente. Elija Desde un proyecto para conservar el vínculo con un riesgo.",
        "Open RAG assistant or Review risks with the RAG assistant from an application. Choose From a project to retain the risk link.",
      ],
      [
        "Seleccione la convocatoria y busque el proyecto por título o referencia. Use Anterior y Siguiente para recorrer los resultados, de 20 en 20. Al escoger el proyecto se cargan sus riesgos y consultas guardadas. Seleccione Riesgo y actividad relacionada y compruebe versión, fase y calificación. Para una pregunta general use Consulta libre.",
        "Select the call and search projects by title or reference. Use Previous and Next to browse 20 results at a time. Selecting a project loads its risks and saved queries. Select Risk and related activity and check version, phase and rating. Use Free query for a general question.",
      ],
      [
        "Elija Obtener una respuesta con fuentes o Buscar fragmentos en los documentos. En contexto de proyecto seleccione Qué desea revisar.",
        "Choose Get an answer with sources or Find passages in documents. In project context select Review focus.",
      ],
      [
        "Revise la pregunta sugerida o escriba una propia en español. Elija respuesta breve o análisis ampliado cuando use Qwen y pulse Consultar.",
        "Review the suggested question or write your own in Spanish. Choose brief answer or expanded analysis when using Qwen and click Submit query.",
      ],
    ],
    rows: [
      [
        "Desde un proyecto",
        "Vincula consulta, actividad, riesgo y versión enviada. Cambiar convocatoria o proyecto reinicia las selecciones dependientes.",
        "From a project",
        "Links query, activity, risk and submitted version. Changing call or project resets dependent selections.",
      ],
      [
        "Consulta libre",
        "Consulta normativa sin asociarla a un expediente. Los ejemplos completan la pregunta, pero no la envían hasta pulsar Consultar.",
        "Free query",
        "Queries sources without linking to an application. Examples fill the question but do not submit it until Submit query is clicked.",
      ],
      [
        "Multilingual E5",
        "Busca fragmentos por significado en fuentes aprobadas. No redacta una respuesta. La consulta admite de 10 a 1.500 caracteres.",
        "Multilingual E5",
        "Searches approved sources by meaning. Does not draft an answer. Queries allow 10–1,500 characters.",
      ],
      [
        "BM25 + Qwen",
        "BM25 recupera pasajes por términos y Qwen redacta con esas fuentes. La consulta admite de 3 a 600 caracteres. La respuesta se produce en español.",
        "BM25 + Qwen",
        "BM25 retrieves passages by terms and Qwen drafts using those sources. Queries allow 3–600 characters. Answers are produced in Spanish.",
      ],
      [
        "Breve / ampliado",
        "Breve prioriza la respuesta directa. Ampliado añade condiciones y aplicación al caso si las fuentes lo permiten; puede tardar más.",
        "Brief / expanded",
        "Brief prioritizes a direct answer. Expanded adds conditions and case applicability where supported; it may take longer.",
      ],
      [
        "Privacidad",
        "No incluya nombres, correos ni información confidencial. La consulta y pasajes públicos se procesan en servicios externos.",
        "Privacy",
        "Do not include names, emails or confidential information. Queries and public passages are processed by external services.",
      ],
    ],
    outcome: [
      "Obtiene fragmentos o una respuesta con fuentes, manteniendo visible el contexto elegido.",
      "You receive passages or an answer with sources while retaining the selected context.",
    ],
    tip: [
      "La IA no modifica las calificaciones del aplicante ni decide elegibilidad, financiamiento o aprobación. Formule una pregunta concreta: actividad, posible efecto y aspecto normativo que necesita revisar.",
      "AI does not change applicant ratings or decide eligibility, funding or approval. Ask a specific question: activity, potential effect and the rule you need to review.",
    ],
  },
  {
    id: "rag-evidencia",
    title: [
      "RAG: interpretar y comprobar la evidencia",
      "RAG: interpret and check evidence",
    ],
    intro: [
      "Una respuesta útil debe poder contrastarse con sus fuentes. Un resultado recuperado no demuestra por sí solo que la interpretación sea correcta o que el requisito aplique al proyecto.",
      "A useful answer must be verifiable against its sources. A retrieved result does not itself prove that the interpretation is correct or the requirement applies to the project.",
    ],
    screen: [
      [
        "Procesando → Modelo, etapa y tiempo transcurrido",
        "Processing → Model, stage and elapsed time",
      ],
      [
        "Respuesta fundamentada o evidencia insuficiente",
        "Grounded answer or insufficient evidence",
      ],
      [
        "Compruebe la evidencia → Documento y pasaje",
        "Check the evidence → Document and passage",
      ],
      [
        "Detalles de esta ejecución · Copiar / Descargar",
        "Execution details · Copy / Download",
      ],
    ],
    steps: [
      [
        "Durante el proceso lea el nombre del modelo, la etapa informada y el tiempo transcurrido. Espere el resultado o use Detener espera si necesita cancelar la espera.",
        "During processing read the model name, reported stage and elapsed time. Wait for the result or use Stop waiting if necessary.",
      ],
      [
        "Lea la respuesta y sus referencias. Si informa evidencia insuficiente, no interprete esa ausencia como permiso para ejecutar la actividad.",
        "Read the answer and references. If evidence is insufficient, do not treat that absence as permission to perform the activity.",
      ],
      [
        "En Compruebe la evidencia lea cada fragmento, documento, versión o página y abra la fuente cuando esté disponible.",
        "In Check the evidence read each passage, document, version or page and open the source when available.",
      ],
      [
        "Compare el fragmento con el caso real. Use los controles de copiar o descargar para conservar el resultado y los detalles de ejecución para rastrear una consulta.",
        "Compare the passage with the actual case. Use copy or download controls to retain the result and execution details to trace a query.",
      ],
    ],
    rows: [
      [
        "Etapas y reloj",
        "El reloj mide el tiempo transcurrido. Las etapas indican el procesamiento informado; no son un porcentaje garantizado ni una promesa de tiempo restante.",
        "Stages and clock",
        "The clock measures elapsed time. Stages show reported processing; they are not a guaranteed percentage or a remaining-time promise.",
      ],
      [
        "Detener espera",
        "Cancela la espera del portal. No garantiza que el servidor externo interrumpa inmediatamente todo su cómputo.",
        "Stop waiting",
        "Cancels the portal's wait. Does not guarantee that the external server immediately stops all computation.",
      ],
      [
        "Referencias y pasajes",
        "Distinga una fuente citada en la respuesta de un pasaje recuperado para revisión. Lea ambos en su contexto.",
        "References and passages",
        "Distinguish a source cited in the answer from a passage retrieved for review. Read both in context.",
      ],
      [
        "Similitud / relevancia",
        "Orienta la recuperación de documentos. No equivale a probabilidad del riesgo ni a porcentaje de certeza de una conclusión.",
        "Similarity / relevance",
        "Guides document retrieval. Does not equal risk probability or confidence percentage for a conclusion.",
      ],
      [
        "Detalles de esta ejecución",
        "Muestra método/modelo, duración y datos técnicos disponibles. Si reporta un problema, incluya el identificador de la consulta cuando aparezca.",
        "Execution details",
        "Shows method/model, duration and available technical information. When reporting a problem include the query identifier if displayed.",
      ],
      [
        "Copiar / descargar",
        "Conserva el resultado para consulta. No lo convierte en revisión técnica ni lo envía automáticamente al aplicante.",
        "Copy / download",
        "Retains the result for reference. Does not turn it into a technical review or automatically send it to the applicant.",
      ],
    ],
    tip: [
      "Si las fuentes son parciales, reformule la pregunta, consulte el otro método o revise directamente el documento. La valoración final corresponde al técnico.",
      "If sources are partial, rephrase the question, try the other method or read the document directly. Final judgment belongs to the reviewer.",
    ],
  },
  {
    id: "rag-observaciones",
    title: [
      "RAG: guardar una observación vinculada",
      "RAG: save a linked observation",
    ],
    intro: [
      "Desde un proyecto puede seleccionar evidencia y redactar una observación para ese riesgo. El texto se revisa y confirma antes de guardarse en el expediente.",
      "From a project you can select evidence and draft an observation for that risk. The text is reviewed and confirmed before being saved to the application.",
    ],
    screen: [
      ["Marcar evidencia pertinente", "Select relevant evidence"],
      ["Preparar observación al aplicante", "Prepare applicant observation"],
      [
        "Revisar texto y confirmar referencias",
        "Review text and confirm references",
      ],
      [
        "Guardar observación en el expediente",
        "Save observation to application",
      ],
    ],
    steps: [
      [
        "Ejecute la consulta desde un proyecto y riesgo. Marque los pasajes que realmente respaldan la observación.",
        "Run the query from a project and risk. Select the passages that actually support the observation.",
      ],
      [
        "Si lo desea, indique qué debe aclarar el aplicante y pulse Preparar borrador de observación. También puede escribir su observación.",
        "Optionally specify what the applicant should clarify and click Prepare observation draft. You may also write your observation.",
      ],
      [
        "Revise la redacción, los vínculos y las referencias. Marque He revisado la observación y la pertinencia de las referencias seleccionadas.",
        "Review wording, links and references. Check I have reviewed the observation and the relevance of the selected references.",
      ],
      [
        "Pulse Guardar observación en el expediente. Busque la confirmación y las consultas recientes guardadas para ese riesgo.",
        "Click Save observation to application. Look for confirmation and recent saved consultations for that risk.",
      ],
    ],
    rows: [
      [
        "Evidencia pertinente",
        "Seleccione al menos un pasaje. No basta con ejecutar la consulta para habilitar el guardado.",
        "Relevant evidence",
        "Select at least one passage. Running the query alone does not enable saving.",
      ],
      [
        "Aclaración solicitada",
        "Opcional, hasta 1.000 caracteres. Ayuda a orientar el borrador hacia la duda concreta.",
        "Requested clarification",
        "Optional, up to 1,000 characters. Helps focus the draft on the specific question.",
      ],
      [
        "Observación del técnico",
        "Obligatoria, hasta 5.000 caracteres. El técnico debe revisar el texto aunque parta de un borrador generado.",
        "Reviewer observation",
        "Required, up to 5,000 characters. The reviewer must check the text even if it starts from a generated draft.",
      ],
      [
        "Reemplazar borrador",
        "Si ya hay texto, el sistema pide elegir entre conservarlo o reemplazarlo. Revise antes de aceptar la sustitución.",
        "Replace draft",
        "If text already exists, the system asks whether to retain or replace it. Review before accepting replacement.",
      ],
      [
        "Cambios posteriores",
        "Si cambia evidencia o aclaración, actualice el borrador y confirme nuevamente. Modificar el texto también exige revisar la confirmación.",
        "Subsequent changes",
        "If evidence or clarification changes, update the draft and confirm again. Editing the text also requires reviewing confirmation.",
      ],
      [
        "Consulta guardada",
        "Conserva método, pregunta, evidencia, observación, riesgo y versión. No envía por sí sola un correo, no reabre el formulario y no reemplaza la revisión formal de salvaguardas.",
        "Saved consultation",
        "Retains method, query, evidence, observation, risk and version. Does not itself send email, reopen the form or replace the formal safeguards review.",
      ],
    ],
    outcome: [
      "La evidencia y la observación revisada quedan vinculadas al riesgo y a la versión consultada.",
      "Evidence and the reviewed observation are linked to the risk and queried version.",
    ],
    tip: [
      "La consulta libre y el acceso académico no permiten guardar esta actuación. Si la versión cambió, vuelva a seleccionar el proyecto y compruebe el riesgo antes de repetir la consulta.",
      "Free queries and academic access cannot save this action. If the version changed, reselect the project and check the risk before querying again.",
    ],
  },
  {
    id: "rag-incidencias",
    title: [
      "RAG: mensajes y recuperación de errores",
      "RAG: messages and error recovery",
    ],
    intro: [
      "Los mensajes distinguen falta de evidencia, problemas de conexión y restricciones del servicio. Un fallo de consulta no modifica el expediente.",
      "Messages distinguish missing evidence, connection problems and service restrictions. A failed query does not modify the application.",
    ],
    screen: [
      ["Mensaje del resultado o del error", "Result or error message"],
      ["Consulta conservada → Revisar causa", "Retained query → Check cause"],
      [
        "Reintentar / Ajustar pregunta / Otro método",
        "Retry / Refine question / Other method",
      ],
      [
        "Detalles e identificador para soporte",
        "Details and identifier for support",
      ],
    ],
    steps: [
      [
        "Lea el mensaje completo y distinga si la consulta terminó sin evidencia o si no pudo procesarse.",
        "Read the full message and distinguish a completed query without evidence from a processing failure.",
      ],
      [
        "Corrija la causa según la tabla. Revise la pregunta conservada antes de reintentar.",
        "Correct the cause using the table. Review the retained query before retrying.",
      ],
      [
        "Use Ajustar pregunta para concretar actividad, lugar o criterio. Pruebe el otro método solo si está disponible y responde al objetivo de la consulta.",
        "Use Refine question to clarify activity, place or criterion. Try the other method only if available and appropriate for the query.",
      ],
      [
        "Si persiste el fallo, informe método, hora, mensaje e identificador de ejecución al administrador, sin contraseñas ni datos confidenciales.",
        "If failure persists, report method, time, message and execution identifier to the administrator, without passwords or confidential data.",
      ],
    ],
    rows: [
      [
        "Consulta inválida",
        "Respete el mínimo y máximo del método y escriba una pregunta concreta; no basta con espacios.",
        "Invalid query",
        "Follow the method's minimum and maximum length and enter a specific question; spaces are not sufficient.",
      ],
      [
        "Sin conexión / tiempo agotado",
        "Compruebe Internet y reintente. Un modelo que está iniciando puede tardar; no lance consultas repetidas simultáneas.",
        "Offline / timeout",
        "Check Internet and retry. A model starting up may take time; do not submit repeated simultaneous queries.",
      ],
      [
        "Límite de solicitudes",
        "Espere antes de reintentar. Si se mantiene, el administrador debe comprobar la disponibilidad o cuota del servicio.",
        "Request limit",
        "Wait before retrying. If it persists, the administrator should check service availability or quota.",
      ],
      [
        "Sesión vencida / sin permiso",
        "Inicie sesión nuevamente y compruebe el perfil. Un cambio de rol o una sesión revocada puede impedir continuar.",
        "Expired session / forbidden",
        "Sign in again and check your role. A role change or revoked session may prevent further access.",
      ],
      [
        "Método o fuentes no disponibles",
        "Use el otro método habilitado o consulte al administrador. El técnico no necesita modificar claves ni servidores.",
        "Method or sources unavailable",
        "Use the other enabled method or contact the administrator. Reviewers do not need to change keys or servers.",
      ],
      [
        "Respuesta inválida / servicio no disponible",
        "No use contenido incompleto como evidencia concluyente. Reintente y conserve el identificador para soporte si persiste.",
        "Invalid response / service unavailable",
        "Do not use incomplete content as conclusive evidence. Retry and retain the identifier for support if it persists.",
      ],
      [
        "Evidencia insuficiente",
        "Es un resultado posible, no necesariamente un error del servicio. Reformule o revise otras fuentes; no invente una conclusión.",
        "Insufficient evidence",
        "A possible outcome, not necessarily a service error. Rephrase or review other sources; do not invent a conclusion.",
      ],
      [
        "La respuesta no superó el control de calidad",
        "El modelo devolvió repeticiones o caracteres anómalos. El texto defectuoso se descarta y los pasajes recuperados siguen disponibles. Pulse Volver a consultar o use el buscador E5; no se modifica la evaluación del proyecto.",
        "The answer failed quality checks",
        "The model returned repetitions or abnormal characters. The broken answer is discarded and retrieved passages remain available. Click Retry query or use E5 search; the project assessment is not changed.",
      ],
    ],
    tip: [
      "La consulta no aprueba ni rechaza proyectos, aunque el asistente encuentre una condición de exclusión. Contraste la norma y registre la valoración humana correspondiente.",
      "Queries do not approve or reject projects, even if the assistant finds an exclusion condition. Check the rule and record the appropriate human assessment.",
    ],
  },
  {
    id: "corpus",
    title: [
      "Administración de fuentes del buscador E5",
      "E5 search-source administration",
    ],
    intro: [
      "El corpus es el conjunto de fragmentos documentales disponibles para el buscador. Esta pantalla importa archivos preparados; no es una carga de anexos de postulaciones.",
      "The corpus is the set of document passages available to the search engine. This screen imports prepared files; it is not an application-attachment upload.",
    ],
    audience: [
      "Solo Administración. La revisión y aprobación de fuentes es una tarea técnica separada.",
      "Administration only. Source review and approval is a separate technical task.",
    ],
    screen: [
      [
        "Asistente RAG → Fuentes del buscador E5",
        "RAG assistant → E5 search sources",
      ],
      ["Archivo preparado del corpus (JSON)", "Prepared corpus file (JSON)"],
      [
        "Importar e indexar → Progreso por fragmentos",
        "Import and index → Passage progress",
      ],
      [
        "Carga completada → Aprobación técnica separada",
        "Import completed → Separate technical approval",
      ],
    ],
    steps: [
      [
        "Obtenga el JSON preparado y revisado por el responsable técnico, con fuentes normativas y referencias trazables.",
        "Obtain the JSON prepared and reviewed by the technical lead, with normative sources and traceable references.",
      ],
      [
        "Seleccione el archivo en Importar corpus normativo; no use expedientes ni información personal.",
        "Select the file in Import normative corpus; do not use applications or personal information.",
      ],
      [
        "Pulse Importar e indexar y observe el progreso. Si se pausa, conserve la misma pantalla y el mismo archivo para reanudar.",
        "Click Import and index and monitor progress. If paused, retain the same screen and file to resume.",
      ],
      [
        "Al completar, coordine la aprobación técnica de las fuentes. Importar no las habilita automáticamente para búsqueda.",
        "After completion arrange technical source approval. Importing does not automatically enable sources for search.",
      ],
    ],
    rows: [
      [
        "Formato y tamaño",
        "JSON preparado, hasta 10 MB, con un arreglo no vacío de hasta 10.000 fragmentos. No cargue directamente PDF o Word en este control.",
        "Format and size",
        "Prepared JSON, up to 10 MB, containing a nonempty array of up to 10,000 passages. Do not upload PDF or Word directly through this control.",
      ],
      [
        "Procesando N / total",
        "Indica el avance de los lotes de importación e indexación. Espere la confirmación de carga completada.",
        "Processing N / total",
        "Indicates import and indexing batch progress. Wait for completion confirmation.",
      ],
      [
        "Carga pausada",
        "Pulse Importar para reanudar con el mismo archivo; los fragmentos guardados no se duplican. Si el formato es inválido, solicite un archivo corregido.",
        "Import paused",
        "Click Import to resume with the same file; saved passages are not duplicated. If the format is invalid, request a corrected file.",
      ],
      [
        "Fuentes pendientes de aprobación",
        "Es el estado posterior a la importación, no un fallo. La aprobación no se realiza mediante un botón de esta pantalla.",
        "Sources awaiting approval",
        "This is the post-import state, not a failure. Approval is not performed through a button on this screen.",
      ],
    ],
    tip: [
      "La importación descrita corresponde al corpus E5. No presuponga que actualiza simultáneamente el corpus o el modelo del servicio BM25 + Qwen.",
      "This import concerns the E5 corpus. Do not assume it simultaneously updates the BM25 + Qwen service corpus or model.",
    ],
  },
  {
    id: "reportes",
    title: [
      "Reportes de cierre y exportaciones",
      "Closing reports and exports",
    ],
    intro: [
      "Reportes presenta indicadores y montos de una convocatoria a una fecha de corte. Las exportaciones permiten consultar y compartir ese estado en Excel, PDF o CSV.",
      "Reports presents indicators and amounts for a call at a cut-off time. Exports allow reviewing and sharing that state in Excel, PDF or CSV.",
    ],
    screen: [
      [
        "Reportería de cierre → Convocatoria → Consultar",
        "Closing reports → Call → View",
      ],
      [
        "Fecha de corte · Indicadores de avance",
        "Cut-off time · Progress indicators",
      ],
      [
        "Montos USD · Postulaciones por tema",
        "USD amounts · Applications by topic",
      ],
      [
        "Descargar Excel / PDF · Otras opciones: CSV",
        "Download Excel / PDF · Other options: CSV",
      ],
    ],
    steps: [
      [
        "Seleccione la convocatoria y pulse Consultar. Compruebe el título y la fecha de corte en hora de Galápagos.",
        "Select the call and click View. Check the title and cut-off time in Galápagos time.",
      ],
      [
        "Revise recibidas, invitadas a fase 2, proyectos completos, aprobadas, convenios firmados y no seleccionadas.",
        "Review received applications, phase 2 invitations, full proposals, approvals, signed agreements and non-selected applications.",
      ],
      [
        "Contraste solicitado, aprobado y con convenio firmado. Revise también la distribución por tema de aplicación.",
        "Compare requested, approved and signed-agreement amounts. Also review distribution by application topic.",
      ],
      [
        "Seleccione el idioma de descarga y use Excel o PDF; en Otras opciones de exportación encontrará CSV. Abra el archivo para confirmar convocatoria y corte.",
        "Select the download language and use Excel or PDF; CSV is under Other export options. Open the file to confirm call and cut-off time.",
      ],
    ],
    rows: [
      [
        "Fecha de corte",
        "Identifica cuándo se obtuvo el estado del reporte. Descargas realizadas en momentos distintos pueden reflejar nuevas actuaciones.",
        "Cut-off time",
        "Identifies when report status was obtained. Downloads at different times may reflect new actions.",
      ],
      [
        "Indicadores de avance",
        "Representan hitos distintos del flujo. No los sume como si fueran categorías mutuamente excluyentes.",
        "Progress indicators",
        "Represent different workflow milestones. Do not add them as if they were mutually exclusive categories.",
      ],
      [
        "Montos USD",
        "Solicitado, aprobado y con convenio firmado tienen significados diferentes; una solicitud no es todavía un compromiso firmado.",
        "USD amounts",
        "Requested, approved and signed-agreement amounts have different meanings; a request is not yet a signed commitment.",
      ],
      [
        "Excel / PDF / CSV",
        "Excel facilita análisis, PDF facilita lectura y CSV sirve para intercambio de datos. Cada exportación corresponde a la convocatoria seleccionada.",
        "Excel / PDF / CSV",
        "Excel supports analysis, PDF supports reading and CSV supports data exchange. Each export corresponds to the selected call.",
      ],
      [
        "Indicadores sociales y ambientales",
        "Se consultan en cada expediente como metas narrativas. No se agregan automáticamente resultados con unidades o definiciones diferentes.",
        "Social and environmental indicators",
        "Are read in each application as narrative targets. Results with different units or definitions are not automatically aggregated.",
      ],
    ],
    tip: [
      "Si el conteo no coincide con una lista, compare convocatoria, filtros y fecha de corte antes de concluir que falta un expediente.",
      "If a count differs from a list, compare call, filters and cut-off time before concluding an application is missing.",
    ],
  },
  {
    id: "respaldos",
    title: [
      "Descargas y respaldos de expedientes",
      "Application downloads and backups",
    ],
    intro: [
      "Administración puede descargar un listado Excel o un ZIP de expedientes seleccionados. Son copias de información de negocio; no constituyen por sí solas una recuperación completa del sistema.",
      "Administration can download an Excel list or a ZIP of selected applications. These are business-information copies; they do not themselves provide full system recovery.",
    ],
    screen: [
      [
        "Elegir: listado Excel / expedientes ZIP",
        "Choose: Excel list / application ZIP",
      ],
      [
        "1. Qué descargar → Filtros y selección",
        "1. What to download → Filters and selection",
      ],
      [
        "2. Destino → Descargar / Guardar como",
        "2. Destination → Download / Save as",
      ],
      [
        "3. Revisar y descargar → Comprobar archivo",
        "3. Review and download → Check file",
      ],
    ],
    steps: [
      [
        "Abra Respaldos y elija Descargar listado en Excel o Descargar expedientes.",
        "Open Backups and choose Download Excel list or Download applications.",
      ],
      [
        "Seleccione todos los expedientes que coincidan con los filtros o expedientes específicos. Filtre por convocatoria y categoría y revise la cantidad incluida.",
        "Choose all applications matching the filters or specific applications. Filter by call and category and review the included count.",
      ],
      [
        "En selección específica busque por referencia o proyecto y marque las filas. Revise nuevamente la selección después de cambiar filtros.",
        "For specific selection, search by reference or project and check rows. Review selection again after changing filters.",
      ],
      [
        "Elija Descargar archivo o Guardar como, compruebe el resumen y genere la copia. Abra el archivo y verifique su contenido antes de considerarlo conservado.",
        "Choose Download file or Save as, check the summary and generate the copy. Open the file and verify its contents before considering it retained.",
      ],
    ],
    rows: [
      [
        "Listado Excel",
        "Una fila por expediente para consulta y análisis. No contiene por sí solo todos los documentos.",
        "Excel list",
        "One row per application for review and analysis. Does not itself contain all documents.",
      ],
      [
        "Expedientes ZIP",
        "Incluye documentos y listado Excel de los expedientes elegidos. Los borradores nunca enviados no se incluyen.",
        "Application ZIP",
        "Includes documents and Excel list for selected applications. Never-submitted drafts are excluded.",
      ],
      [
        "Alcance",
        "El resumen indica convocatoria, categoría y número incluido. Si aparece un límite, elija una convocatoria o hasta 200 expedientes por copia.",
        "Scope",
        "The summary shows call, category and included count. If a limit appears, choose one call or up to 200 applications per copy.",
      ],
      [
        "Guardar como",
        "Si el navegador lo permite, elija nombre y ubicación local, unidad sincronizada o dispositivo externo. De lo contrario se utiliza descarga normal.",
        "Save as",
        "If supported by the browser, choose name and location on a local, synchronized or external drive. Otherwise normal download is used.",
      ],
      [
        "Respaldo completo del sistema",
        "La pantalla lo identifica como No configurado y no permite ejecutarlo. Estas descargas no recuperan por sí solas autenticación, base completa y configuración del despliegue.",
        "Full system backup",
        "The screen identifies it as Not configured and does not allow running it. These downloads alone cannot restore authentication, the complete database and deployment configuration.",
      ],
      [
        "Copias automáticas",
        "No están activadas desde esta pantalla. Guardar en una carpeta sincronizada no crea una programación diaria o semanal.",
        "Automatic copies",
        "Are not enabled from this screen. Saving to a synchronized folder does not create a daily or weekly schedule.",
      ],
    ],
    tip: [
      "Conserve la copia en una ubicación institucional autorizada. Si cancela el diálogo o la descarga falla, compruebe el archivo: un clic no garantiza que la copia exista.",
      "Keep copies in an authorized institutional location. If you cancel the dialog or downloading fails, check the file: clicking does not guarantee the copy exists.",
    ],
  },
  {
    id: "usuarios",
    title: [
      "Gestión de usuarios y control de acceso",
      "User management and access control",
    ],
    intro: [
      "Esta pantalla permite buscar cuentas, gestionar su acceso y asignar funciones dentro del alcance autorizado. Las actuaciones requieren motivo y preservan las restricciones sobre su propia cuenta y el último administrador.",
      "This screen allows finding accounts, managing access and assigning duties within authorized scope. Actions require a reason and retain restrictions on your own account and the last administrator.",
    ],
    audience: [
      "Administración; Gestión o Sostenibilidad con delegación limitada a su área.",
      "Administration; Grants or Sustainability with delegation limited to their area.",
    ],
    screen: [
      [
        "Cuentas existentes → Nombre o correo",
        "Existing accounts → Name or email",
      ],
      ["Estado · Tipo de acceso · Rol", "Status · Access type · Role"],
      ["Gestionar acceso → Acción → Motivo", "Manage access → Action → Reason"],
      ["Confirmar → Listado actualizado", "Confirm → Updated list"],
    ],
    steps: [
      [
        "Busque la cuenta por nombre o correo y contraste estado, rol y tipo de acceso antes de actuar.",
        "Find the account by name or email and compare status, role and access type before acting.",
      ],
      [
        "En Gestionar acceso seleccione la acción apropiada, lea sus efectos e indique el motivo solicitado.",
        "In Manage access select the appropriate action, read its effects and enter the requested reason.",
      ],
      [
        "Confirme y espere Operación completada. Compruebe el estado actualizado de la cuenta.",
        "Confirm and wait for Operation completed. Check the account's updated status.",
      ],
      [
        "Para cambiar funciones abra Asignación de roles y delegación. Seleccione el rol permitido y pulse Actualizar rol; la delegación se guarda por separado.",
        "To change duties open Role assignment and delegation. Select a permitted role and click Update role; delegation is saved separately.",
      ],
    ],
    rows: [
      [
        "Desactivar / reactivar",
        "Desactivar impide continuar con el acceso y conserva el historial. Para reactivar una cuenta archivada primero debe desarchivarla; un acceso académico vencido no se reactiva.",
        "Deactivate / reactivate",
        "Deactivation prevents access while preserving history. Unarchive an archived account before reactivating; expired academic access cannot be reactivated.",
      ],
      [
        "Revocar sesiones",
        "Bloquea las sesiones actuales; la persona debe iniciar sesión de nuevo. No borra sus expedientes.",
        "Revoke sessions",
        "Blocks current sessions; the person must sign in again. Does not delete their applications.",
      ],
      [
        "Archivar / desarchivar",
        "Archivar requiere desactivar primero. Desarchivar recupera la cuenta del archivo, pero no debe confundirse con reactivarla.",
        "Archive / unarchive",
        "Archiving requires deactivation first. Unarchiving returns the account from the archive but is not the same as reactivation.",
      ],
      [
        "Eliminar",
        "Irreversible; solo se permite bajo las condiciones del sistema, sin expedientes, documentos ni actuaciones vinculadas y con cuenta previamente desactivada y archivada.",
        "Delete",
        "Irreversible; allowed only under system conditions, without linked applications, documents or actions, and after deactivation and archiving.",
      ],
      [
        "Motivo",
        "De 3 a 500 caracteres. Describa la razón institucional; no escriba contraseñas ni códigos.",
        "Reason",
        "3–500 characters. Describe the institutional reason; do not enter passwords or codes.",
      ],
      [
        "Rol / delegación",
        "El rol define funciones. La delegación permite a responsables de Proyectos o Sostenibilidad administrar usuarios de su área; no otorga administración general.",
        "Role / delegation",
        "The role defines duties. Delegation allows Project or Sustainability managers to administer area users; it does not grant general administration.",
      ],
      [
        "Protecciones",
        "No puede cambiar su propio rol o acceso aquí; debe permanecer un administrador activo. Un conflicto de cambios exige actualizar el listado antes de reintentar.",
        "Protections",
        "You cannot change your own role or access here; an active administrator must remain. A concurrent-change conflict requires refreshing the list before retrying.",
      ],
    ],
    tip: [
      "Si una cuenta tiene historial, consérvela desactivada y archivada cuando ya no necesite acceso. Eliminar una cuenta no es un mecanismo para borrar actuaciones institucionales.",
      "If an account has history, retain it inactive and archived when access is no longer needed. Deletion is not a way to erase institutional actions.",
    ],
  },
  {
    id: "invitaciones",
    title: [
      "Invitar personal y crear accesos académicos",
      "Invite staff and create academic access",
    ],
    intro: [
      "La invitación de personal se prepara, revisa y envía en pasos separados. El acceso académico temporal sigue un proceso distinto y se limita a la evaluación autorizada.",
      "Staff invitations are prepared, reviewed and sent in separate steps. Temporary academic access follows a different process and is limited to authorized evaluation.",
    ],
    screen: [
      [
        "Nombre · Correo · Funciones y delegación",
        "Name · Email · Duties and delegation",
      ],
      ["Guardar invitación pendiente", "Save pending invitation"],
      [
        "Revisar destinatario → Enviar invitación",
        "Check recipient → Send invitation",
      ],
      [
        "Estado enviada / aceptada · Vigencia",
        "Sent / accepted status · Validity",
      ],
    ],
    steps: [
      [
        "En Invitar personal interno del GLF complete nombre, correo institucional y funciones. Revise cuidadosamente cualquier permiso administrativo.",
        "In Invite GLF staff complete name, institutional email and duties. Carefully review any administrative permissions.",
      ],
      [
        "Pulse Guardar invitación pendiente y revise la ficha en Invitaciones y estado de activación. Guardar no envía un correo.",
        "Click Save pending invitation and review the entry in Invitations and activation status. Saving does not send email.",
      ],
      [
        "Cuando corresponda pulse Enviar invitación. Compruebe el estado y solicite al destinatario activar su cuenta y configurar segundo factor.",
        "When appropriate click Send invitation. Check status and ask the recipient to activate the account and set up a second factor.",
      ],
      [
        "Para evaluación académica, Administración usa Crear acceso académico temporal: verifica el servicio, registra nombre/correo y confirma la creación. Guarde la contraseña mostrada antes de salir y compártala por el canal autorizado.",
        "For academic evaluation, Administration uses Create temporary academic access: checks the service, enters name/email and confirms creation. Retain the displayed password before leaving and share it through the authorized channel.",
      ],
    ],
    rows: [
      [
        "Invitación pendiente",
        "Permite revisar y editar los datos antes del envío. No confiere acceso por el solo hecho de guardarla.",
        "Pending invitation",
        "Allows checking and editing before sending. Saving it alone does not grant access.",
      ],
      [
        "Enviada",
        "Significa que el servicio aceptó el envío, no que se confirmó la llegada a la bandeja del destinatario. Compruebe dirección y correo no deseado si no llega.",
        "Sent",
        "Means the service accepted sending, not confirmed inbox delivery. Check address and spam if it does not arrive.",
      ],
      [
        "Vencida / revocada / aceptada",
        "Revise el estado y las acciones disponibles. Use reenvío cuando proceda; una invitación aceptada debe gestionarse como cuenta existente.",
        "Expired / revoked / accepted",
        "Check status and available actions. Resend when appropriate; an accepted invitation should be managed as an existing account.",
      ],
      [
        "Enlace de activación manual",
        "Cuando utilice la opción de enlace manual, entréguelo solo al destinatario previsto. Es un acceso sensible, no un enlace público.",
        "Manual activation link",
        "When using the manual-link option, deliver it only to the intended recipient. It is sensitive access, not a public link.",
      ],
      [
        "Acceso académico",
        "Vigencia de tres meses desde su creación. Permite consultas habilitadas, archivos, formularios, reportes y ambos métodos RAG; no modifica datos ni administra usuarios.",
        "Academic access",
        "Valid for three months from creation. Allows authorized queries, files, forms, reports and both RAG methods; cannot modify data or administer users.",
      ],
      [
        "Contraseña académica",
        "Se muestra tras crear la cuenta y no vuelve a mostrarse. Crear el acceso no envía un correo automático; guárdela antes de pulsar Ya guardé la contraseña · ocultar.",
        "Academic password",
        "Displayed after creation and not shown again. Creating access does not send automatic email; retain it before clicking Password saved · hide.",
      ],
    ],
    tip: [
      "Los postulantes crean su cuenta desde el acceso externo. No use invitaciones de personal para incorporar a un aplicante.",
      "Applicants create accounts through external sign-in. Do not use staff invitations to onboard applicants.",
    ],
  },
  {
    id: "incidencias",
    title: [
      "Solución de problemas y comprobación final",
      "Troubleshooting and final checks",
    ],
    intro: [
      "Si una pantalla no carga, use Reintentar. Una dirección inexistente ofrece Ir al inicio. Antes de repetir una operación de guardado o publicación, compruebe si ya quedó registrada. Los estados, versiones y permisos explican por qué algunos controles no aparecen o no permiten continuar.",
      "If a screen fails to load, use Retry. A nonexistent address offers Go to home. Before repeating a save or publication, check whether it was already recorded. Status, versions and permissions explain why some controls are missing or disabled.",
    ],
    screen: [
      [
        "Leer mensaje y conservar el texto de trabajo",
        "Read message and retain working text",
      ],
      ["Comprobar cuenta · Etapa · Versión", "Check account · Stage · Version"],
      [
        "Revisar historial o listado actualizado",
        "Review history or refreshed list",
      ],
      [
        "Corregir / Reintentar / Solicitar soporte",
        "Correct / Retry / Request support",
      ],
    ],
    steps: [
      [
        "Lea el mensaje y conserve el contenido que esté editando antes de recargar o salir de la pantalla.",
        "Read the message and retain content you are editing before refreshing or leaving the screen.",
      ],
      [
        "Compruebe cuenta, permisos, estado, versión y plazo; contraste la última entrada en el historial si la acción podía guardar cambios.",
        "Check account, permissions, status, version and deadline; compare the latest history entry if the action could save changes.",
      ],
      [
        "Corrija campos pendientes o recupere la sesión y reintente una vez. No repita un envío, una invitación o una resolución sin verificar el resultado anterior.",
        "Correct missing fields or recover your session and retry once. Do not repeat a submission, invitation or decision without checking the previous result.",
      ],
      [
        "Si persiste, informe pantalla, referencia del expediente o convocatoria, acción, fecha/hora y mensaje exacto. Adjunte una captura sin datos sensibles.",
        "If it persists, report screen, application or call reference, action, date/time and exact message. Attach a screenshot without sensitive data.",
      ],
    ],
    rows: [
      [
        "No aparece una opción",
        "Compruebe perfil y etapa. Algunas funciones corresponden a otra área o solo aparecen con el expediente enviado, aprobado o sin corrección abierta.",
        "An option is missing",
        "Check role and stage. Some functions belong to another area or appear only for submitted, approved applications or when no correction is open.",
      ],
      [
        "No se registró la operación",
        "Revise los campos obligatorios, la revisión vigente y el estado. Consulte el historial antes de intentar de nuevo.",
        "Operation was not recorded",
        "Check required fields, current revision and status. Read history before retrying.",
      ],
      [
        "GLF_VERSION_CONFLICT / GLF_CONCURRENT_CHANGE",
        "Otra modificación cambió los datos esperados. Conserve su texto, actualice la pantalla y compare antes de guardar de nuevo.",
        "GLF_VERSION_CONFLICT / GLF_CONCURRENT_CHANGE",
        "Another update changed the expected data. Retain your text, refresh and compare before saving again.",
      ],
      [
        "GLF_RESUBMISSION_REQUIRED",
        "Se requiere una nueva versión presentada. Una autorización de corrección o un borrador guardado no equivalen a reenvío.",
        "GLF_RESUBMISSION_REQUIRED",
        "A new submitted version is required. Correction authorization or a saved draft is not resubmission.",
      ],
      [
        "GLF_TECHNICAL_REVIEW_REQUIRED",
        "Debe existir la revisión de salvaguardas de la revisión vigente. Una nota, una consulta RAG o una evaluación individual no la sustituyen.",
        "GLF_TECHNICAL_REVIEW_REQUIRED",
        "A safeguards review must exist for the current revision. A note, RAG query or individual evaluation does not replace it.",
      ],
      [
        "GLF_PHASE2_CONFIGURATION_REQUIRED",
        "Compruebe los apartados de fase 2 de la convocatoria y un plazo de invitación válido.",
        "GLF_PHASE2_CONFIGURATION_REQUIRED",
        "Check the call's phase 2 sections and a valid invitation deadline.",
      ],
      [
        "Descarga fallida o vacía",
        "Compruebe sesión, filtros y archivo. Los bloqueos del navegador o una interrupción no prueban que el documento no exista.",
        "Failed or empty download",
        "Check session, filters and file. Browser blocking or interruption does not prove the document is absent.",
      ],
      [
        "¿Se guardó?",
        "Busque confirmación y el registro esperado en historial o listado. Las pantallas internas usan guardado explícito; no suponga guardado automático por haber escrito.",
        "Was it saved?",
        "Look for confirmation and the expected entry in history or list. Internal screens use explicit saving; do not assume typing automatically saves.",
      ],
    ],
    outcome: [
      "Resuelve incidencias frecuentes y puede reportar un problema con contexto suficiente para atenderlo.",
      "You can resolve common issues and report problems with enough context for support.",
    ],
    tip: [
      "Nunca incluya contraseñas, códigos de segundo factor, claves de servicios o enlaces privados de activación en un reporte de soporte.",
      "Never include passwords, second-factor codes, service keys or private activation links in a support report.",
    ],
  },
];

export const internalManualGuide: ManualGuide = {
  title: ["Manual interno", "Internal manual"],
  kicker: ["GUÍA DEL EQUIPO GLF", "GLF TEAM GUIDE"],
  headline: ["Cada pantalla. Cada proceso.", "Every screen. Every workflow."],
  lead: [
    "Encuentre qué hacer, qué significa cada control y cómo comprobar el resultado. Una guía paso a paso para expedientes, convocatorias, consultas de salvaguardas y administración, con permisos y soluciones a los problemas habituales.",
    "Find what to do, what each control means and how to check the outcome. A step-by-step guide to applications, calls, safeguards queries and administration, including permissions and common troubleshooting.",
  ],
  audience: [
    "Personal interno y consulta autorizada",
    "Internal staff and authorized readers",
  ],
  updated: ["12 de noviembre de 2026", "12 November 2026"],
  journey: [
    ["Expedientes", "Applications", "expedientes"],
    ["Convocatorias", "Calls", "convocatorias"],
    ["Asistente RAG", "RAG assistant", "rag"],
    ["Reportes", "Reports", "reportes"],
    ["Respaldos", "Backups", "respaldos"],
    ["Usuarios", "Users", "usuarios"],
  ],
  icons: ["folder", "calendar", "search", "chart", "archive", "users"],
  chapters: internalManualChapters,
  backLabel: ["Volver a mi espacio de trabajo", "Back to my workspace"],
  empty: [
    "No encontramos ese tema. Pruebe «revisión», «convocatoria», «Qwen», «descargar» o «contraseña», o limpie la búsqueda.",
    "No matching topic. Try ‘review’, ‘call’, ‘Qwen’, ‘download’ or ‘password’, or clear the search.",
  ],
};
