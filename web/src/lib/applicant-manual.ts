export type ManualChapter = {
  id: string;
  title: [string, string];
  intro: [string, string];
  steps: [string, string][];
  rows: [string, string, string, string][];
  tip: [string, string];
  screen: [string, string][];
};
export const manualChapters: ManualChapter[] = [
  {
    id: "cuenta",
    title: ["Crear y activar su cuenta", "Create and activate your account"],
    intro: [
      "Use una cuenta propia para conservar sus postulaciones y retomarlas desde distintos dispositivos.",
      "Use your own account to keep your applications and resume them across devices.",
    ],
    steps: [
      [
        "En la pantalla de acceso, pulse Crear cuenta y complete sus datos.",
        "On the sign-in screen, select Create account and enter your details.",
      ],
      [
        "Revise su correo, incluida la carpeta de spam. Abra el mensaje de confirmación y pulse el enlace; puede hacerlo desde otro dispositivo.",
        "Check your inbox, including spam. Open the confirmation email and follow its link; you may use another device.",
      ],
      [
        "Regrese al portal e ingrese con el correo y la contraseña registrados. Confirmar el correo no sustituye el inicio de sesión.",
        "Return to the portal and sign in with your registered email and password. Email confirmation does not replace signing in.",
      ],
    ],
    rows: [
      [
        "Nombre de contacto",
        "Su nombre completo; entre 2 y 200 caracteres.",
        "Contact name",
        "Your full name; 2–200 characters.",
      ],
      [
        "Correo electrónico",
        "Use una dirección que controle. Revísela antes de enviar: allí recibirá el enlace de activación.",
        "Email",
        "Use an address you control. Check it carefully: the activation link will be sent there.",
      ],
      [
        "Contraseña",
        "Entre 12 y 128 caracteres. Use una contraseña única y no la comparta.",
        "Password",
        "12–128 characters. Use a unique password and do not share it.",
      ],
      [
        "Crear cuenta",
        "Solicita el registro y muestra las instrucciones de confirmación. Todavía no envía ningún proyecto.",
        "Create account",
        "Requests registration and displays confirmation instructions. No project is submitted.",
      ],
      [
        "Ya tengo una cuenta / Ingresar",
        "Vuelve al acceso para cuentas registradas.",
        "Already have an account / Sign in",
        "Returns to sign-in for registered accounts.",
      ],
    ],
    tip: [
      "No necesita una cuenta de Vercel ni de Supabase para postular. El correo de activación puede identificar al proveedor de autenticación.",
      "You do not need a Vercel or Supabase account to apply. The activation email may identify the authentication provider.",
    ],
    screen: [
      ["Crear cuenta", "Create account"],
      ["Nombre de contacto *", "Contact name *"],
      ["Correo electrónico *", "Email *"],
      [
        "Contraseña · mínimo 12 caracteres",
        "Password · at least 12 characters",
      ],
      [
        "Crear cuenta → Confirmar correo → Ingresar",
        "Create account → Confirm email → Sign in",
      ],
    ],
  },
  {
    id: "acceso",
    title: ["Ingresar y orientarse", "Sign in and find your way"],
    intro: [
      "La misma cuenta permite gestionar varias postulaciones. El menú externo contiene las herramientas para preparar y consultar sus propios expedientes.",
      "One account can manage multiple applications. The applicant menu contains tools to prepare and view your own dossiers.",
    ],
    steps: [
      [
        "Ingrese su correo y contraseña y pulse Ingresar una sola vez. Espere el indicador de procesamiento.",
        "Enter your email and password and select Sign in once. Wait for the progress indicator.",
      ],
      [
        "Use Nueva postulación para empezar y Mis postulaciones para retomar o consultar expedientes existentes.",
        "Use New application to start and My applications to resume or view existing dossiers.",
      ],
    ],
    rows: [
      [
        "Mantenerme conectado durante 90 días",
        "Opcional. Úselo solo en un dispositivo personal; una sesión puede terminar antes por cierre de sesión o controles de seguridad.",
        "Keep me signed in for 90 days",
        "Optional. Only use on a personal device; signing out or security controls may end the session earlier.",
      ],
      [
        "Olvidé mi contraseña → Enviar instrucciones",
        "Escriba su correo y revise el enlace recibido. Establezca la nueva contraseña e ingrese nuevamente.",
        "Forgot password → Send instructions",
        "Enter your email and check the link received. Set a new password and sign in again.",
      ],
      [
        "Reenviar correo de confirmación",
        "Si aparece esta opción, solicite un nuevo enlace de activación. Use el más reciente.",
        "Resend confirmation email",
        "When this option appears, request a new activation link. Use the most recent one.",
      ],
      [
        "ES / EN",
        "Cambia el idioma de la interfaz; no traduce automáticamente los textos que usted escribió.",
        "ES / EN",
        "Changes the interface language; it does not automatically translate your own text.",
      ],
      [
        "Cómo postular / Manual de uso",
        "Cómo postular resume etapas y condiciones. Este manual explica cómo utilizar las pantallas.",
        "How to apply / User manual",
        "How to apply summarises stages and conditions. This manual explains how to use the screens.",
      ],
      [
        "Cerrar sesión",
        "Finaliza su acceso en este navegador. Espere a que el borrador esté guardado antes de salir.",
        "Sign out",
        "Ends access in this browser. Wait until your draft is saved before leaving.",
      ],
    ],
    tip: [
      "Nunca comparta su contraseña ni enlaces privados de recuperación. El portal solo muestra expedientes asociados a su cuenta.",
      "Never share your password or private recovery links. The portal only shows dossiers associated with your account.",
    ],
    screen: [
      ["Correo electrónico", "Email"],
      ["Contraseña", "Password"],
      ["□ Mantenerme conectado", "□ Keep me signed in"],
      ["Ingresar", "Sign in"],
      [
        "Nueva postulación · Mis postulaciones · Cómo postular",
        "New application · My applications · How to apply",
      ],
    ],
  },
  {
    id: "nueva",
    title: [
      "Elegir convocatoria y subvención",
      "Choose a call and grant category",
    ],
    intro: [
      "La nota conceptual es la primera presentación de la idea del proyecto: qué propone, para qué, dónde, con qué presupuesto y cuáles son sus riesgos.",
      "The concept note is the initial presentation of your project idea: what you propose, why, where, the budget and its risks.",
    ],
    steps: [
      [
        "Entre en Nueva postulación. Revise la convocatoria disponible, su plazo y prioridades.",
        "Open New application. Review the available call, deadline and priorities.",
      ],
      [
        "Lea las tarjetas y pulse Preparar nota conceptual en la categoría adecuada. El portal crea un borrador; no lo envía al GLF.",
        "Read the cards and select Prepare concept note for the appropriate category. The portal creates a draft; it does not submit it to GLF.",
      ],
    ],
    rows: [
      [
        "Pequeña",
        "Hasta USD 100.000; hasta 12 meses. Cofinanciamiento no obligatorio; se recomienda en especie.",
        "Small",
        "Up to USD 100,000; up to 12 months. Co-financing is optional; in-kind support is recommended.",
      ],
      [
        "Mediana",
        "Hasta USD 250.000; hasta 24 meses. Cofinanciamiento del 10%, en especie o efectivo.",
        "Medium",
        "Up to USD 250,000; up to 24 months. 10% co-financing, in-kind or cash.",
      ],
      [
        "Grande",
        "Desde USD 250.000; hasta 36 meses. Cofinanciamiento equivalente al 25% del monto solicitado al Fondo.",
        "Large",
        "From USD 250,000; up to 36 months. Co-financing equivalent to 25% of the amount requested from the Fund.",
      ],
      [
        "Preparar nota conceptual",
        "Abre un expediente nuevo e independiente. Para continuar uno existente, use Mis postulaciones.",
        "Prepare concept note",
        "Opens a new, independent dossier. To continue an existing one, use My applications.",
      ],
      [
        "Convocatoria no disponible",
        "Si no hay una convocatoria abierta o una categoría está deshabilitada, no podrá iniciar esa postulación.",
        "Call unavailable",
        "If no call is open or a category is disabled, you cannot start that application.",
      ],
    ],
    tip: [
      "La elegibilidad y las prioridades se consultan en Cómo postular y en la convocatoria. Una persona natural solo puede optar a la categoría pequeña según las reglas actuales.",
      "Check eligibility and priorities in How to apply and the call. Under current rules, individuals may only apply for small grants.",
    ],
    screen: [
      ["Prepare su nota conceptual", "Prepare your concept note"],
      ["Convocatoria · plazo · prioridades", "Call · deadline · priorities"],
      ["Pequeña | Mediana | Grande", "Small | Medium | Large"],
      ["Preparar nota conceptual", "Prepare concept note"],
    ],
  },
  {
    id: "datos",
    title: ["Paso 1 · Datos del proyecto", "Step 1 · Project details"],
    intro: [
      "Identifique al proponente y defina la ubicación, fechas y presupuesto. Los campos con asterisco son obligatorios para enviar; el borrador puede estar incompleto.",
      "Identify the applicant and define location, dates and budget. Asterisked fields are required to submit; drafts may be incomplete.",
    ],
    steps: [
      [
        "Revise la información precargada de su cuenta o de postulaciones anteriores y actualícela si corresponde. El título de un proyecto nuevo empieza vacío.",
        "Review details prefilled from your account or previous applications and update them when necessary. A new project's title starts blank.",
      ],
      [
        "Complete los datos y pulse Continuar. Si hay errores, revise tanto los campos vacíos como las observaciones de presupuesto y fechas.",
        "Complete the details and select Continue. If errors appear, review empty fields as well as budget and date issues.",
      ],
    ],
    rows: [
      [
        "Tipo de solicitante / Categoría",
        "Seleccione la condición real del proponente y la categoría de subvención. Deben ser compatibles con la convocatoria.",
        "Applicant type / Category",
        "Select the applicant's actual status and grant category. They must be compatible with the call.",
      ],
      [
        "Título del proyecto",
        "Escriba un nombre claro que identifique esta propuesta; no use el título de otro expediente.",
        "Project title",
        "Enter a clear name identifying this proposal; do not reuse another dossier's title.",
      ],
      [
        "Nombre de organización o proponente",
        "Nombre del solicitante que presenta el proyecto.",
        "Organization or applicant name",
        "Name of the applicant submitting the project.",
      ],
      [
        "Persona de contacto",
        "Nombre de la persona responsable de atender comunicaciones. Revíselo: se utiliza en los documentos generados.",
        "Contact person",
        "Name of the person responsible for communications. Check carefully: it is used in generated documents.",
      ],
      [
        "Correo electrónico de contacto",
        "Se propone el de su cuenta; puede cambiarlo por el contacto adecuado. Cambiarlo no cambia el correo de acceso.",
        "Contact email",
        "Defaults to your account email; change it if needed. This does not change your sign-in email.",
      ],
      [
        "Teléfono de contacto",
        "Seleccione primero el código del país e ingrese el número válido de celular o teléfono fijo.",
        "Contact phone",
        "Select the country calling code first, then enter a valid mobile or landline number.",
      ],
      [
        "Provincia / Ciudad o localidad / Dirección específica",
        "Indique dónde se encuentra el proponente. La dirección no sustituye la ubicación de ejecución del proyecto.",
        "Province / City or locality / Street address",
        "Specify where the applicant is located. This does not replace the project's implementation location.",
      ],
      [
        "Islas de ejecución / Otras islas",
        "Seleccione todas las islas donde actuará. Si elige otras, especifíquelas. Para todo Galápagos, utilice la opción que corresponda al alcance real.",
        "Project islands / Other islands",
        "Select all implementation islands. Specify any other islands selected. For archipelago-wide work, use the option matching the actual scope.",
      ],
      [
        "Ubicación específica y ámbito",
        "Describa los sitios concretos y el alcance territorial de la intervención.",
        "Specific project location and scope",
        "Describe the specific sites and territorial scope of the intervention.",
      ],
      [
        "Tipo de proyecto",
        "Seleccione la clasificación que mejor represente la propuesta.",
        "Project type",
        "Select the classification that best represents your proposal.",
      ],
      [
        "Fechas de inicio y finalización propuestas",
        "Use los calendarios. El fin debe ser posterior al inicio y respetar la duración máxima de la categoría.",
        "Proposed start and end dates",
        "Use the calendars. End must follow start and comply with the category's maximum duration.",
      ],
      [
        "Monto solicitado al GLF (USD)",
        "Indique el aporte solicitado dentro del límite de la categoría; no el costo total.",
        "Amount requested from GLF (USD)",
        "Enter the requested contribution within the category limit; not the total cost.",
      ],
      [
        "Cofinanciamiento (USD)",
        "Indique los aportes adicionales y cumpla el porcentaje que corresponda a la categoría.",
        "Co-financing (USD)",
        "Enter additional contributions and meet the percentage required for the category.",
      ],
      [
        "Gastos administrativos (USD)",
        "Son parte del presupuesto solicitado, no un aporte adicional. No pueden superar el 10% del monto solicitado al GLF.",
        "Administrative expenses (USD)",
        "These are part of the requested budget, not an additional contribution. They cannot exceed 10% of the amount requested from GLF.",
      ],
      [
        "Costo total estimado",
        "Se calcula automáticamente: monto solicitado + cofinanciamiento. Compruebe el total mientras ingresa los valores.",
        "Estimated total cost",
        "Automatically calculated as requested amount + co-financing. Check the total as you enter values.",
      ],
    ],
    tip: [
      "Los mensajes junto a los campos explican qué corregir. No basta con guardar un borrador para que esté listo para enviar.",
      "Messages beside fields explain what to correct. Saving a draft does not mean it is ready to submit.",
    ],
    screen: [
      [
        "1 Datos → 2 Nota conceptual → 3 Screening → 4 Revisar y enviar",
        "1 Details → 2 Concept note → 3 Screening → 4 Review and submit",
      ],
      ["Título del proyecto *", "Project title *"],
      ["Contacto · teléfono · ubicación *", "Contact · phone · location *"],
      [
        "Monto GLF + Cofinanciamiento = Costo total",
        "GLF amount + Co-financing = Total cost",
      ],
      ["Guardar borrador | Continuar", "Save draft | Continue"],
    ],
  },
  {
    id: "descripcion",
    title: ["Paso 2 · Explicar la propuesta", "Step 2 · Describe the proposal"],
    intro: [
      "Escriba de forma concreta y comprensible. Los contadores del formulario indican la extensión disponible; seis cajas de resumen comparten un solo límite total.",
      "Write clearly and concisely. Form counters show available space; the six summary boxes share a single total word limit.",
    ],
    steps: [
      [
        "Distribuya el resumen entre sus seis secciones. Evite repetir el mismo texto en todas.",
        "Distribute the summary across its six sections. Avoid repeating the same text in every box.",
      ],
      [
        "Complete beneficiarios, sostenibilidad y seguimiento, y registre las organizaciones asociadas si las hay.",
        "Complete beneficiaries, sustainability and monitoring, and register partner organizations if any.",
      ],
    ],
    rows: [
      [
        "Contexto",
        "Describa la situación actual y el lugar de intervención.",
        "Context",
        "Describe the current situation and intervention location.",
      ],
      [
        "Problema",
        "Explique qué necesidad concreta resolverá el proyecto.",
        "Problem",
        "Explain the specific need the project addresses.",
      ],
      [
        "Amenazas",
        "Indique las presiones o causas que agravan el problema.",
        "Threats",
        "Identify pressures or causes worsening the problem.",
      ],
      [
        "Justificación",
        "Explique por qué la intervención es necesaria y pertinente.",
        "Rationale",
        "Explain why the intervention is necessary and relevant.",
      ],
      [
        "Solución",
        "Describa el enfoque propuesto para responder al problema.",
        "Solution",
        "Describe the proposed approach to addressing the problem.",
      ],
      [
        "Resultados del resumen",
        "Sintetice qué cambiará con el proyecto; después detállelo en Resultados e indicadores esperados.",
        "Summary results",
        "Summarise what the project will change; detail it later under Expected results and indicators.",
      ],
      [
        "Beneficiarios y contribuciones a los medios de vida",
        "Identifique a quién beneficia y cómo; use cantidades justificadas cuando sea posible.",
        "Beneficiaries and contributions to livelihoods",
        "Identify who benefits and how; use justified numbers where possible.",
      ],
      [
        "Sostenibilidad y replicabilidad",
        "Explique cómo se mantendrán los beneficios y si el enfoque puede replicarse.",
        "Sustainability and replicability",
        "Explain how benefits will be sustained and whether the approach can be replicated.",
      ],
      [
        "Seguimiento y evaluación propuestos",
        "Resuma cómo comprobará el avance y los resultados. El plan detallado corresponde a la propuesta completa.",
        "Proposed monitoring and evaluation",
        "Summarise how progress and results will be checked. The detailed plan belongs in the full proposal.",
      ],
      [
        "Organizaciones asociadas (opcional)",
        "Registre cada organización por separado. Use + para añadir otra y Quitar para retirar una entrada; no incluya organizaciones sin participación prevista.",
        "Partner organizations (optional)",
        "Register each organization separately. Use + to add another and Remove to delete an entry; only include organizations expected to participate.",
      ],
      [
        "Contadores / revisión ortográfica",
        "Respete el límite que muestra cada bloque. El navegador puede subrayar errores según sus diccionarios; no verifica la exactitud técnica del contenido.",
        "Counters / spellcheck",
        "Observe the limit displayed for each block. The browser may underline errors depending on its dictionaries; it does not check technical accuracy.",
      ],
    ],
    tip: [
      "Ejemplo ilustrativo: el problema describe una necesidad; el objetivo expresa el cambio buscado; la actividad indica lo que hará para lograrlo.",
      "Illustrative example: the problem describes a need; the objective states the desired change; the activity describes what you will do to achieve it.",
    ],
    screen: [
      [
        "Resumen del proyecto · contador total",
        "Project summary · total word counter",
      ],
      ["Contexto | Problema | Amenazas", "Context | Problem | Threats"],
      [
        "Justificación | Solución | Resultados",
        "Rationale | Solution | Results",
      ],
      [
        "Beneficiarios · Sostenibilidad · Seguimiento",
        "Beneficiaries · Sustainability · Monitoring",
      ],
    ],
  },
  {
    id: "objetivos",
    title: [
      "Objetivos y alineación estratégica",
      "Objectives and strategic alignment",
    ],
    intro: [
      "Cada objetivo se escribe por separado y se relaciona con los planes mediante listas de selección. La selección expresa su aporte previsto; no es una certificación de impacto.",
      "Write each objective separately and link it to plans using selection lists. Selections express expected contributions; they do not certify impact.",
    ],
    steps: [
      [
        "Redacte el objetivo general y añada los objetivos específicos que necesite.",
        "Write the general objective and add the specific objectives you need.",
      ],
      [
        "Para cada objetivo, seleccione la alineación pertinente y explique el beneficio esperado. Revise las sugerencias de ODS antes de elegir.",
        "For each objective, select relevant alignments and explain the expected benefit. Review suggested SDGs before choosing.",
      ],
    ],
    rows: [
      [
        "Objetivo general / Objetivo específico",
        "Un solo objetivo por caja, hasta 2.000 caracteres. Exprese el cambio que pretende conseguir.",
        "General / Specific objective",
        "One objective per box, up to 2,000 characters. State the change you intend to achieve.",
      ],
      [
        "Añadir objetivo específico",
        "Crea otra caja numerada OE1, OE2, etc. Los códigos permiten vincular actividades y resultados.",
        "Add specific objective",
        "Creates another numbered box, SO1, SO2, etc. Codes link activities and results.",
      ],
      [
        "Alinear con el Plan Galápagos 2030",
        "Escoja los objetivos del Plan a los que aporta. Las selecciones se muestran y pueden retirarse individualmente.",
        "Align with the Galápagos 2030 Plan",
        "Choose the Plan objectives your project contributes to. Selected entries are displayed and can be removed individually.",
      ],
      [
        "Alinear con los ODS",
        "Revise los ODS sugeridos por el Plan seleccionado o consulte los demás. Seleccione los que correspondan realmente; la sugerencia no reemplaza su criterio.",
        "Align with the SDGs",
        "Review SDGs suggested by the selected Plan objective or browse others. Select those genuinely relevant; suggestions do not replace your judgement.",
      ],
      [
        "Prioridades estratégicas del GLF",
        "Seleccione las prioridades disponibles para la convocatoria. No invente una prioridad ni elija una sin relación con su objetivo.",
        "GLF strategic priorities",
        "Select priorities available for the call. Do not invent a priority or choose one unrelated to your objective.",
      ],
      [
        "Contribución o beneficio esperado",
        "Explique cómo el objetivo aporta a la alineación elegida; hasta 600 caracteres.",
        "Expected contribution or benefit",
        "Explain how the objective contributes to the selected alignment; up to 600 characters.",
      ],
      [
        "Quitar selección / Eliminar este objetivo",
        "Retira una asociación o un objetivo específico. Revise después las actividades y resultados que lo utilizaban.",
        "Remove selection / Remove this objective",
        "Removes an alignment or specific objective. Afterwards, review activities and results linked to it.",
      ],
    ],
    tip: [
      "Ejemplo ilustrativo: «Fortalecer capacidades de jóvenes para la conservación marina» → seleccione el objetivo pertinente del Plan, el ODS y la prioridad GLF, y explique el aporte concreto.",
      "Illustrative example: ‘Strengthen young people's capacity for marine conservation’ → select the relevant Plan objective, SDG and GLF priority, and explain the specific contribution.",
    ],
    screen: [
      [
        "Objetivo general * → Plan · ODS · Prioridad GLF",
        "General objective * → Plan · SDGs · GLF priority",
      ],
      [
        "Contribución o beneficio esperado *",
        "Expected contribution or benefit *",
      ],
      [
        "OE1: objetivo específico → alineaciones",
        "SO1: specific objective → alignments",
      ],
      ["+ Añadir objetivo específico", "+ Add specific objective"],
    ],
  },
  {
    id: "resultados",
    title: ["Resultados e indicadores", "Results and indicators"],
    intro: [
      "En la nota conceptual basta con definir qué logrará, cuánto espera lograr y qué evidencia permitirá comprobarlo. La fórmula detallada de cálculo se desarrolla en la propuesta completa.",
      "For the concept note, define what you will achieve, how much and what evidence will verify it. Detailed calculation formulas belong in the full proposal.",
    ],
    steps: [
      [
        "Pulse + Agregar resultado y complete todos sus campos.",
        "Select + Add result and complete all its fields.",
      ],
      [
        "Vincule cada resultado con un objetivo específico y compruebe que indicador, meta, unidad y evidencia sean coherentes.",
        "Link each result to a specific objective and check consistency between indicator, target, unit and evidence.",
      ],
    ],
    rows: [
      [
        "Resultado esperado",
        "Cambio o producto concreto, hasta 2.000 caracteres.",
        "Expected result",
        "Specific change or output, up to 2,000 characters.",
      ],
      [
        "Objetivo específico asociado",
        "Seleccione un objetivo ya escrito. Si fue eliminado, elija otro válido.",
        "Associated specific objective",
        "Select an objective already written. If it was deleted, choose another valid one.",
      ],
      [
        "Indicador",
        "Qué medirá: por ejemplo, número de personas que completan una capacitación. Hasta 1.000 caracteres.",
        "Indicator",
        "What you will measure: for example, number of people completing training. Up to 1,000 characters.",
      ],
      [
        "Meta preliminar",
        "Cantidad esperada, no negativa; si es porcentaje, entre 0 y 100.",
        "Preliminary target",
        "Expected non-negative quantity; percentages must be between 0 and 100.",
      ],
      [
        "Unidad de medida / Especifique la unidad",
        "Seleccione personas, porcentaje u otra unidad disponible. Si elige Otra, descríbala (hasta 100 caracteres).",
        "Unit of measure / Specify the unit",
        "Select people, percentage or another available unit. If you choose Other, describe it (up to 100 characters).",
      ],
      [
        "Evidencia prevista",
        "Documento o registro que comprobará el resultado, hasta 1.000 caracteres; por ejemplo, asistencia y evaluación de aprendizaje.",
        "Expected evidence",
        "Document or record verifying the result, up to 1,000 characters; for example, attendance and learning assessment.",
      ],
      [
        "Agregar / Quitar resultado",
        "Añade o retira un bloque. El formulario admite hasta 30 resultados.",
        "Add / Remove result",
        "Adds or removes a block. The form supports up to 30 results.",
      ],
      [
        "Organizar resultados / Consultar texto anterior",
        "Si aparece en un borrador anterior, permite estructurar los resultados conservando el texto previo como referencia.",
        "Organise results / View previous text",
        "When shown in an older draft, lets you structure results while keeping previous text for reference.",
      ],
    ],
    tip: [
      "Ejemplo ilustrativo: resultado: jóvenes capacitados; indicador: número que completa la formación; meta: 60; unidad: personas; evidencia: asistencia y evaluación.",
      "Illustrative example: result: trained young people; indicator: number completing training; target: 60; unit: people; evidence: attendance and assessment.",
    ],
    screen: [
      ["Resultado 1 * → OE1", "Result 1 * → SO1"],
      ["Indicador *", "Indicator *"],
      ["Meta: 60 | Unidad: personas", "Target: 60 | Unit: people"],
      ["Evidencia prevista *", "Expected evidence *"],
      ["+ Agregar resultado", "+ Add result"],
    ],
  },
  {
    id: "actividades",
    title: [
      "Registrar actividades y riesgos potenciales",
      "Register activities and potential risks",
    ],
    intro: [
      "Primero describa las actividades en la nota conceptual. Después, el screening utiliza esas mismas actividades y el catálogo de riesgos que usted registró.",
      "First describe activities in the concept note. Screening then uses those same activities and the risk register you created.",
    ],
    steps: [
      [
        "Añada una actividad, escriba su nombre y descripción y marque los objetivos específicos a los que contribuye.",
        "Add an activity, enter its name and description and check the specific objectives it contributes to.",
      ],
      [
        "Registre cada riesgo ambiental y social potencial en su propia caja; utilice + para añadir otros.",
        "Register each potential environmental and social risk in its own box; use + to add more.",
      ],
    ],
    rows: [
      [
        "Nombre de la actividad",
        "Acción concreta que ejecutará; no sustituye al objetivo.",
        "Activity name",
        "Specific action you will carry out; it does not replace the objective.",
      ],
      [
        "Descripción de la actividad",
        "Explique qué hará y su alcance, de modo que sea posible valorar sus riesgos.",
        "Activity description",
        "Explain what you will do and its scope so risks can be assessed.",
      ],
      [
        "Objetivos específicos a los que contribuye",
        "Marque uno o más objetivos pertinentes. Cada opción muestra el código y el texto completo.",
        "Specific objectives contributed to",
        "Check one or more relevant objectives. Each option displays its code and full text.",
      ],
      [
        "Agregar / Quitar actividad",
        "Añade o retira una actividad. Quitarla también retira las evaluaciones de riesgo que contiene: revise antes de hacerlo.",
        "Add / Remove activity",
        "Adds or removes an activity. Removing it also removes its risk assessments: review before doing so.",
      ],
      [
        "Riesgos ambientales potenciales",
        "Una entrada por riesgo sobre el ambiente. La etiqueta numerada permite reconocerlo después en el screening.",
        "Potential environmental risks",
        "One entry per environmental risk. Numbered labels identify it later in screening.",
      ],
      [
        "Riesgos sociales potenciales",
        "Una entrada por riesgo sobre personas o comunidades. No confunda un beneficio previsto con un riesgo.",
        "Potential social risks",
        "One entry per risk to people or communities. Do not confuse an expected benefit with a risk.",
      ],
      [
        "Agregar / Quitar riesgo potencial",
        "Mantiene un catálogo común para las actividades. Si cambia o elimina un riesgo ya utilizado, revise las evaluaciones relacionadas.",
        "Add / Remove potential risk",
        "Maintains a shared register for activities. If you change or delete a risk already used, review related assessments.",
      ],
    ],
    tip: [
      "Un mismo riesgo puede afectar varias actividades, con probabilidad y gravedad distintas en cada una. Una actividad puede tener varios riesgos.",
      "The same risk can affect several activities with different likelihood and severity in each. One activity can have several risks.",
    ],
    screen: [
      [
        "Actividad 1: nombre y descripción *",
        "Activity 1: name and description *",
      ],
      [
        "☑ OE1: texto del objetivo específico",
        "☑ SO1: specific objective text",
      ],
      ["+ Agregar actividad", "+ Add activity"],
      [
        "Riesgo ambiental 1 | Riesgo social 1",
        "Environmental risk 1 | Social risk 1",
      ],
      ["+ Agregar riesgo potencial", "+ Add potential risk"],
    ],
  },
  {
    id: "screening",
    title: ["Paso 3 · Evaluar riesgos A&S", "Step 3 · Assess E&S risks"],
    intro: [
      "El screening inicial identifica y evalúa riesgos por actividad. En esta fase no se solicitan medidas de mitigación, costos, responsables ni planificación del PGAS.",
      "Initial screening identifies and assesses risks by activity. This stage does not request mitigation measures, costs, responsible persons or ESMP planning.",
    ],
    steps: [
      [
        "En cada actividad, añada un riesgo y selecciónelo del registro de la nota conceptual.",
        "For each activity, add a risk and select it from the concept note's risk register.",
      ],
      [
        "Describa cómo podría ocurrir y escoja probabilidad y gravedad. Repita para los demás riesgos de esa actividad.",
        "Describe how it could occur and choose likelihood and severity. Repeat for other risks in that activity.",
      ],
      [
        "Abra Ver mapa de riesgos para comparar las evaluaciones y detectar las que aún faltan.",
        "Open View risk map to compare assessments and identify incomplete ones.",
      ],
    ],
    rows: [
      [
        "Actividad y objetivos asociados",
        "Se muestran desde la nota conceptual. Use Editar actividad y objetivos en Nota conceptual para corregirlos allí.",
        "Activity and associated objectives",
        "Displayed from the concept note. Use Edit activity and objectives in project description to correct them there.",
      ],
      [
        "Añadir riesgo / Seleccione un riesgo registrado",
        "Crea una evaluación y la vincula a un riesgo existente. No repita el mismo riesgo dentro de la misma actividad.",
        "Add risk / Select a registered risk",
        "Creates an assessment linked to an existing risk. Do not repeat the same risk within one activity.",
      ],
      [
        "Dimensión / Riesgo o impacto",
        "Se completan desde el riesgo seleccionado. Corrija el registro original si necesita cambiar su nombre o dimensión.",
        "Dimension / Risk or impact",
        "Filled from the selected risk. Edit the original register if its name or dimension must change.",
      ],
      [
        "Descripción concisa del riesgo",
        "Explique la relación entre la actividad y el posible impacto, quién o qué se vería afectado.",
        "Concise risk description",
        "Explain the relationship between the activity and potential impact, including who or what could be affected.",
      ],
      [
        "Probabilidad de ocurrencia (1–5)",
        "Seleccione de muy baja (1) a muy alta (5), según la posibilidad de que ocurra.",
        "Probability of occurrence (1–5)",
        "Select from very low (1) to very high (5), according to how likely it is to occur.",
      ],
      [
        "Gravedad del riesgo (1–5)",
        "Seleccione de muy baja (1) a muy alta (5), según la magnitud de las consecuencias.",
        "Risk severity (1–5)",
        "Select from very low (1) to very high (5), according to the magnitude of consequences.",
      ],
      [
        "Puntaje / Nivel de riesgo",
        "Cálculo automático: probabilidad × gravedad. 1–4: bajo; 5–9: medio; 10–15: alto; 16–25: muy alto. Sin ambas calificaciones queda incompleto.",
        "Score / Risk level",
        "Automatic calculation: likelihood × severity. 1–4: low; 5–9: medium; 10–15: high; 16–25: very high. Both ratings are required.",
      ],
      [
        "Justificación si no identifica riesgos",
        "Si una actividad no tiene riesgos registrados, explique por qué. No deje la ausencia de riesgos sin sustento.",
        "Explanation if no risks are identified",
        "If an activity has no registered risks, explain why. Do not leave an unsupported absence of risks.",
      ],
      [
        "Mapa: Tipo de riesgo / Actividad / Casillas",
        "Filtre por dimensión o actividad. Pulse una casilla ocupada para ver las evaluaciones. El gráfico resume puntajes; no decide la aprobación.",
        "Map: Risk type / Activity / Cells",
        "Filter by dimension or activity. Select an occupied cell to view assessments. The chart summarises scores; it does not decide approval.",
      ],
      [
        "Quitar riesgo",
        "Retira esa evaluación de la actividad; el riesgo del catálogo se administra en la nota conceptual.",
        "Remove risk",
        "Removes that assessment from the activity; the risk register is managed in the concept note.",
      ],
    ],
    tip: [
      "Si cambia el riesgo seleccionado, vuelva a calificarlo: el formulario reinicia sus valores para evitar reutilizar una evaluación que ya no corresponde.",
      "If you change the selected risk, rate it again: the form resets values to avoid reusing an unrelated assessment.",
    ],
    screen: [
      ["Actividad 1 → Riesgo registrado *", "Activity 1 → Registered risk *"],
      ["Descripción concisa *", "Concise description *"],
      [
        "Probabilidad: 3 × Gravedad: 4 = 12 · Alto",
        "Likelihood: 3 × Severity: 4 = 12 · High",
      ],
      [
        "Ver mapa de riesgos → filtrar → consultar",
        "View risk map → filter → inspect",
      ],
    ],
  },
  {
    id: "borradores",
    title: [
      "Guardar, retomar y eliminar borradores",
      "Save, resume and delete drafts",
    ],
    intro: [
      "Guardar conserva su trabajo. Enviar lo remite al GLF. Son operaciones distintas: un borrador guardado no es una postulación presentada.",
      "Saving preserves your work. Submitting sends it to GLF. These are different actions: a saved draft is not a submitted application.",
    ],
    steps: [
      [
        "Después de escribir, espere a que el estado indique Guardado con fecha y hora. También puede pulsar Guardar borrador.",
        "After typing, wait for the Saved status with date and time. You can also select Save draft.",
      ],
      [
        "Para retomar, ingrese con la misma cuenta y vaya a Mis postulaciones → Continuar borrador.",
        "To resume, sign in with the same account and go to My applications → Continue draft.",
      ],
    ],
    rows: [
      [
        "Guardado automático / Estado Borrador",
        "Se activa después de dejar de escribir. Compruebe el estado de guardado antes de cerrar o cambiar de dispositivo.",
        "Autosave / Draft status",
        "Runs after you stop typing. Check save status before closing or switching devices.",
      ],
      [
        "Guardar borrador",
        "Guarda lo ingresado aunque falten campos. Si falla, conserve la pantalla abierta, revise conexión y reintente.",
        "Save draft",
        "Saves entered data even when fields are missing. If it fails, keep the screen open, check connectivity and retry.",
      ],
      [
        "Anterior / Continuar / Pestañas de pasos",
        "Permiten recorrer las secciones y corregir datos mientras el expediente sea editable. Continuar puede señalar pendientes del paso.",
        "Previous / Continue / Step tabs",
        "Navigate sections and correct data while the dossier is editable. Continue may identify missing items in that step.",
      ],
      [
        "Mis postulaciones / Continuar borrador",
        "Lista sus expedientes y abre el borrador elegido. Revise título, código y categoría para evitar confusiones.",
        "My applications / Continue draft",
        "Lists your dossiers and opens the selected draft. Check title, code and category to avoid confusion.",
      ],
      [
        "Eliminar borrador / Cancelar / Confirmar eliminación",
        "Solo para borradores que nunca se han enviado. Revise la advertencia: la eliminación no se puede deshacer. Cancelar conserva el expediente.",
        "Delete draft / Cancel / Confirm deletion",
        "Only for drafts that have never been submitted. Review the warning: deletion cannot be undone. Cancel preserves the dossier.",
      ],
      [
        "Abrir expediente enviado",
        "Consulta el registro presentado; no permite eliminarlo ni modificarlo por cuenta propia.",
        "Open submitted dossier",
        "Views the submitted record; it cannot be deleted or independently edited.",
      ],
    ],
    tip: [
      "Evite editar el mismo borrador a la vez en varias pestañas o dispositivos. Si aparece un conflicto de versión, revise qué copia está guardada antes de continuar.",
      "Avoid editing the same draft simultaneously in several tabs or devices. If a version conflict appears, check the saved copy before continuing.",
    ],
    screen: [
      ["Borrador · Guardado: fecha y hora", "Draft · Saved: date and time"],
      ["Mis postulaciones", "My applications"],
      [
        "Proyecto · código · categoría · estado",
        "Project · code · category · status",
      ],
      [
        "Continuar borrador | Eliminar borrador",
        "Continue draft | Delete draft",
      ],
    ],
  },
  {
    id: "documentos",
    title: [
      "Paso 4 · Preparar y firmar documentos",
      "Step 4 · Prepare and sign documents",
    ],
    intro: [
      "Revise el contenido antes de generar los dos PDF. Debe firmarlos electrónicamente fuera del portal y cargar cada archivo en su casilla correspondiente.",
      "Review the content before generating both PDFs. Sign them electronically outside the portal and upload each file in its corresponding slot.",
    ],
    steps: [
      [
        "Revise el expediente, lea el aviso de privacidad y marque las declaraciones cuando reflejen su decisión.",
        "Review the dossier, read the privacy notice and check declarations when they reflect your decision.",
      ],
      [
        "Pulse Preparar documentos para firma. Si hay pendientes, use sus enlaces para ir al campo indicado, corregirlo y volver a la revisión.",
        "Select Prepare documents for signature. If issues appear, use their links to reach the indicated field, correct it and return to review.",
      ],
      [
        "Descargue ambos PDF, compruebe su contenido y el nombre del responsable, y firme los archivos con su herramienta de firma electrónica.",
        "Download both PDFs, check their content and responsible person's name, and sign the files using your electronic signature tool.",
      ],
      [
        "Seleccione y guarde cada PDF firmado en su casilla. Espere la confirmación de carga antes de enviar.",
        "Select and save each signed PDF in its slot. Wait for upload confirmation before submitting.",
      ],
    ],
    rows: [
      [
        "Confirmación de información / Aceptación de privacidad",
        "Ambas declaraciones son obligatorias. Marque solo después de revisar su contenido.",
        "Information confirmation / Privacy acceptance",
        "Both declarations are required. Check them only after reviewing their content.",
      ],
      [
        "Listado de pendientes / Ir al campo",
        "Expone campos faltantes, límites y declaraciones. El enlace abre el paso y resalta el elemento que requiere atención.",
        "Outstanding items / Go to field",
        "Lists missing fields, limits and declarations. Links open the step and highlight the item needing attention.",
      ],
      [
        "Preparar documentos para firma",
        "Guarda y genera los PDF de esta versión. No envía la postulación ni incorpora una firma electrónica.",
        "Prepare documents for signature",
        "Saves and generates PDFs for this version. It neither submits the application nor adds an electronic signature.",
      ],
      [
        "Descargar nota conceptual",
        "Descarga el PDF con la información del proyecto. El nombre incluye la referencia del expediente y el momento de generación.",
        "Download concept note",
        "Downloads the project information PDF. Its filename includes the dossier reference and generation timestamp.",
      ],
      [
        "Descargar evaluación de riesgos ambientales y sociales",
        "Descarga por separado el screening de actividades y riesgos A&S.",
        "Download environmental and social risk assessment",
        "Downloads the activity and E&S risk screening separately.",
      ],
      [
        "Seleccionar archivo / Guardar anexo",
        "Cargue un PDF firmado en cada casilla: nota conceptual y evaluación A&S. Máximo 4 MB por archivo. Guardar anexo registra la carga; no envía todo el expediente.",
        "Choose file / Save attachment",
        "Upload one signed PDF per slot: concept note and E&S assessment. Maximum 4 MB per file. Save attachment registers the upload; it does not submit the whole dossier.",
      ],
      [
        "Advertencia de firma",
        "Una imagen de firma o un nombre escrito no equivalen a firma electrónica. El portal detecta su presencia estructural; GLF revisa su validez. Si no la detecta, firme correctamente y cargue otra vez.",
        "Signature warning",
        "A signature image or typed name is not an electronic signature. The portal detects structural presence; GLF reviews validity. If no signature is detected, sign correctly and upload again.",
      ],
      [
        "Documento de versión anterior",
        "Si modifica el contenido después de preparar o firmar, genere, descargue, firme y cargue nuevamente ambos documentos para que coincidan con la versión vigente.",
        "Document from previous version",
        "If you edit content after preparation or signing, generate, download, sign and upload both documents again to match the current version.",
      ],
      [
        "Enlaces recuperados al retomar",
        "Los documentos preparados pueden volver a descargarse al abrir el borrador. Confirme que correspondan al contenido actual.",
        "Recovered download links",
        "Prepared documents can be downloaded again when you reopen the draft. Confirm they match the current content.",
      ],
    ],
    tip: [
      "Cargar un PDF sin firma, podría no cumplir los requisitos de presentación. No cambie ni vuelva a imprimir el PDF después de firmarlo: podría afectar la firma.",
      "Uploading an unsigned PDF could fail presentation requirements. Do not modify or reprint the PDF after signing: this could affect its signature.",
    ],
    screen: [
      ["Revisar pendientes → corregir", "Review outstanding items → correct"],
      [
        "□ Información veraz · □ Privacidad",
        "□ Accurate information · □ Privacy",
      ],
      ["Preparar documentos para firma", "Prepare documents for signature"],
      [
        "Descargar nota conceptual | Descargar evaluación A&S",
        "Download concept note | Download E&S assessment",
      ],
      [
        "Firmar fuera del portal → Cargar 2 PDF → Guardar anexos",
        "Sign outside portal → Upload 2 PDFs → Save attachments",
      ],
    ],
  },
  {
    id: "envio",
    title: [
      "Enviar y conservar el comprobante",
      "Submit and keep your receipt",
    ],
    intro: [
      "El envío definitivo crea un registro de la versión presentada. Compruebe que ambos anexos firmados correspondan al expediente antes de pulsar Enviar al GLF.",
      "Final submission creates a record of the submitted version. Verify that both signed attachments match the dossier before selecting Submit to GLF.",
    ],
    steps: [
      [
        "Compruebe los campos, declaraciones y dos PDF firmados. Pulse Enviar al GLF una vez y espere la respuesta.",
        "Check fields, declarations and both signed PDFs. Select Submit to GLF once and wait for the response.",
      ],
      [
        "Confirme que el estado cambió a Recibida y que aparece la fecha del envío. Descargue el comprobante de recepción.",
        "Confirm the status changed to Received and the submission date appears. Download the receipt.",
      ],
      [
        "Conserve comprobante y documentos. Para consultarlos después, use Mis postulaciones y abra el expediente.",
        "Keep the receipt and documents. To view them later, use My applications and open the dossier.",
      ],
    ],
    rows: [
      [
        "Enviar al GLF",
        "Valida y presenta el expediente. Si faltan datos, hay archivos no vigentes o el plazo no lo permite, el envío no se confirma.",
        "Submit to GLF",
        "Validates and submits the dossier. Missing data, outdated files or deadline restrictions prevent confirmation.",
      ],
      [
        "Recibida / Versión presentada",
        "Indica que existe un envío registrado. El comprobante acredita recepción; no selección ni aprobación del financiamiento.",
        "Received / Submitted version",
        "Indicates a recorded submission. The receipt confirms reception, not selection or funding approval.",
      ],
      [
        "Descargar comprobante de recepción",
        "PDF con proyecto, referencia, responsable, fecha y hora registradas y dos QR de los documentos. Puede volver a descargarlo si la descarga inicial no comienza.",
        "Download receipt",
        "PDF containing project, reference, responsible person, recorded date and time and two document QR codes. Download again if the initial download does not start.",
      ],
      [
        "Versiones presentadas",
        "Muestra proyecto, fecha y hora de cada envío, versión y Fase 1 (Presentación de nota conceptual), con sus descargas.",
        "Submitted versions",
        "Shows the project, date and time of each submission, version and Phase 1 (Concept note submission), with downloads.",
      ],
      [
        "QR de documentos",
        "Abre la referencia del documento en el portal. Los permisos de acceso siguen aplicando; un QR no convierte el expediente en público.",
        "Document QR codes",
        "Opens the document reference in the portal. Access permissions still apply; a QR does not make the dossier public.",
      ],
      [
        "Expediente bloqueado",
        "No puede borrarlo ni editarlo libremente después de enviarlo. GLF debe autorizar las correcciones.",
        "Locked dossier",
        "You cannot delete or freely edit it after submission. GLF must authorise corrections.",
      ],
    ],
    tip: [
      "Si aparece un error técnico, consulte primero Mis postulaciones y el historial antes de repetir el envío. No dé por presentado un expediente sin confirmación registrada.",
      "If a technical error appears, first check My applications and submission history before retrying. Do not assume submission without a recorded confirmation.",
    ],
    screen: [
      ["2 documentos firmados cargados ✓", "2 signed documents uploaded ✓"],
      ["Enviar al GLF → Procesando…", "Submit to GLF → Processing…"],
      [
        "Recibida · fecha y hora Galápagos",
        "Received · Galápagos date and time",
      ],
      ["Descargar comprobante de recepción", "Download receipt"],
      [
        "Versión · Fase 1 (Presentación de nota conceptual)",
        "Version · Phase 1 (Concept note submission)",
      ],
    ],
  },
  {
    id: "despues",
    title: [
      "Después del envío y segunda fase",
      "After submission and the second phase",
    ],
    intro: [
      "Consulte el estado en Mis postulaciones. La revisión y las decisiones corresponden al GLF; enviar una nota conceptual no garantiza financiamiento.",
      "Check status in My applications. GLF handles review and decisions; submitting a concept note does not guarantee funding.",
    ],
    steps: [
      [
        "Abra el expediente para consultar la versión presentada y sus documentos.",
        "Open the dossier to view the submitted version and its documents.",
      ],
      [
        "Si GLF autoriza correcciones, atiéndalas dentro del plazo habilitado y realice un nuevo envío con documentos actualizados.",
        "If GLF authorises corrections, address them within the enabled deadline and resubmit with updated documents.",
      ],
      [
        "La propuesta completa solo se habilita tras la invitación del GLF. Siga las instrucciones y campos que se habiliten para esa etapa.",
        "The full proposal is only enabled after GLF's invitation. Follow the instructions and fields enabled for that stage.",
      ],
    ],
    rows: [
      [
        "En revisión / No seleccionada",
        "Son estados distintos de Recibida. Consulte el registro del expediente; no infiera una decisión solo por haber enviado.",
        "Under review / Not selected",
        "These differ from Received. Check the dossier record; do not infer a decision merely from submission.",
      ],
      [
        "Invitada a Fase 2",
        "Permite continuar hacia la propuesta completa. No equivale a aprobación ni a convenio firmado.",
        "Invited to Phase 2",
        "Allows continuation towards the full proposal. It does not mean approval or a signed agreement.",
      ],
      [
        "Corrección autorizada",
        "Revise todos los cambios relacionados: objetivos, actividades, riesgos y documentos. La versión anterior permanece en el historial.",
        "Authorised correction",
        "Review all related changes: objectives, activities, risks and documents. The previous version remains in history.",
      ],
      [
        "Propuesta completa",
        "Profundiza el diseño técnico, presupuesto, evaluación completa A&S, PGAS y medidas de mitigación según los requerimientos habilitados por GLF.",
        "Full proposal",
        "Develops technical design, budget, full E&S assessment, ESMP and mitigation measures according to GLF's enabled requirements.",
      ],
      [
        "Aprobada / Convenio pendiente / Convenio firmado",
        "Representan pasos posteriores y diferentes. La aprobación y formalización requieren decisiones del GLF.",
        "Approved / Agreement pending / Agreement signed",
        "These are separate subsequent steps. Approval and formalisation require GLF decisions.",
      ],
    ],
    tip: [
      "Este manual desarrolla la postulación externa de la nota conceptual. Las instrucciones detalladas de la propuesta completa se incorporarán conforme se concluya su flujo.",
      "This manual details the external concept note application. Full proposal instructions will be added as that workflow is completed.",
    ],
    screen: [
      [
        "Mis postulaciones → Abrir expediente",
        "My applications → Open dossier",
      ],
      [
        "Recibida → En revisión → Decisión GLF",
        "Received → Under review → GLF decision",
      ],
      [
        "Si hay invitación: Fase 2 · Propuesta completa",
        "If invited: Phase 2 · Full proposal",
      ],
      ["Aprobación ≠ Convenio firmado", "Approval ≠ Signed agreement"],
    ],
  },
  {
    id: "ayuda",
    title: ["Resolver dificultades frecuentes", "Resolve common issues"],
    intro: [
      "Lea el mensaje completo y corrija el punto indicado. Evite pulsar varias veces mientras una operación muestra su indicador de procesamiento.",
      "Read the full message and correct the indicated item. Avoid repeated clicks while an operation shows its progress indicator.",
    ],
    steps: [
      [
        "Identifique en qué paso ocurre el problema y revise el mensaje junto al control.",
        "Identify the step where the problem occurs and review the message beside the control.",
      ],
      [
        "Si necesita asistencia del GLF, indique código del expediente, paso, hora y mensaje exacto; no envíe contraseñas ni enlaces de recuperación.",
        "If you need GLF assistance, provide the dossier code, step, time and exact message; never send passwords or recovery links.",
      ],
    ],
    rows: [
      [
        "No llega el correo de activación",
        "Revise spam y que escribió bien su dirección. Si se habilita, solicite un nuevo enlace y espere antes de repetir.",
        "Activation email not received",
        "Check spam and the address entered. When available, request a new link and wait before retrying.",
      ],
      [
        "No puedo ingresar",
        "Revise correo y contraseña, activación y mensajes de error. Use recuperación si olvidó la contraseña.",
        "Cannot sign in",
        "Check email, password, activation and error messages. Use recovery if you forgot your password.",
      ],
      [
        "Continuar no avanza",
        "Consulte los errores cerca del botón y los campos resaltados. Puede faltar información y existir errores financieros al mismo tiempo.",
        "Continue does not advance",
        "Check errors near the button and highlighted fields. Missing information and financial errors may coexist.",
      ],
      [
        "No se guardó / Sin conexión",
        "Mantenga la pantalla abierta, recupere la conexión y reintente guardar. No asuma que el último cambio quedó guardado.",
        "Not saved / Offline",
        "Keep the screen open, restore connectivity and retry saving. Do not assume the latest change was saved.",
      ],
      [
        "Objetivo o riesgo eliminado",
        "Vuelva a seleccionar una referencia válida en actividades, resultados y screening y revise sus calificaciones.",
        "Objective or risk deleted",
        "Reselect a valid reference in activities, results and screening and review ratings.",
      ],
      [
        "No se prepara el PDF",
        "Revise el listado de pendientes, límites de texto, fechas, montos y declaraciones; luego vuelva a preparar.",
        "PDF preparation fails",
        "Review outstanding items, text limits, dates, amounts and declarations; then prepare again.",
      ],
      [
        "Archivo rechazado",
        "Compruebe que sea PDF, no supere 4 MB, esté firmado electrónicamente y no sea ilegible o esté protegido de forma incompatible.",
        "File rejected",
        "Check it is a PDF no larger than 4 MB, electronically signed and not unreadable or protected incompatibly.",
      ],
      [
        "No detecta la firma",
        "No use una fotografía de firma. Firme el PDF original con una herramienta de firma electrónica y cargue el archivo resultante sin modificarlo.",
        "Signature not detected",
        "Do not use a signature photograph. Sign the original PDF with an electronic signature tool and upload the resulting file unchanged.",
      ],
      [
        "No se confirma el envío",
        "Revise vigencia de convocatoria, documentos y pendientes. Ante error técnico, compruebe primero el estado y el historial antes de reintentar.",
        "Submission not confirmed",
        "Check the call deadline, documents and outstanding items. For technical errors, check status and history before retrying.",
      ],
      [
        "No inicia la descarga",
        "Revise las descargas del navegador y vuelva a usar el enlace del documento o comprobante. Si terminó la sesión, ingrese con su cuenta.",
        "Download does not start",
        "Check browser downloads and use the document or receipt link again. If your session ended, sign in again.",
      ],
    ],
    tip: [
      "Antes de enviar: información completa ✓ presupuesto coherente ✓ riesgos evaluados ✓ declaraciones aceptadas ✓ dos PDF actuales firmados y cargados ✓.",
      "Before submitting: complete information ✓ consistent budget ✓ assessed risks ✓ accepted declarations ✓ two current signed PDFs uploaded ✓.",
    ],
    screen: [
      [
        "Mensaje → campo o acción indicada",
        "Message → indicated field or action",
      ],
      ["Corregir → Guardar → Reintentar", "Correct → Save → Retry"],
      [
        "Asistencia: código · paso · hora · mensaje",
        "Support: code · step · time · message",
      ],
    ],
  },
];
