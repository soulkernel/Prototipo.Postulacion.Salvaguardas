export type ManualChapter = {
  id: string;
  title: [string, string];
  intro: [string, string];
  steps: [string, string][];
  rows: [string, string, string, string][];
  tip: [string, string];
  screen: [string, string][];
};
export const manualUpdatedDate = [
  "21 de octubre de 2026",
  "21 October 2026",
] as const;
export const manualFormSteps = [
  ["Información general", "General information", "datos"],
  ["Descripción", "Description", "descripcion"],
  ["Presupuesto", "Budget", "presupuesto"],
  ["Actividades y riesgos", "Activities and risks", "screening"],
  ["Experiencia SGAS", "ESMS experience", "experiencia-sgas"],
  ["Revisar y enviar", "Review and submit", "documentos"],
] as const;
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
        "Entre 12 y 128 caracteres. Use una contraseña única y no la comparta. El icono del ojo permite mostrarla u ocultarla; inicialmente está oculta.",
        "Password",
        "12–128 characters. Use a unique password and do not share it. Use the eye icon to show or hide it; it is initially hidden.",
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
      "Use únicamente su cuenta del portal. La activación del correo habilita el acceso; no constituye una postulación ni una aprobación del GLF.",
      "Use your own portal account. Email activation enables access; it is neither an application nor GLF approval.",
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
      [
        "Lista de exclusión",
        "Abra la consulta del encabezado en otra pestaña sin abandonar el borrador. Use su buscador y filtros; este recurso no decide la elegibilidad de su proyecto.",
        "Exclusion list",
        "Open the header reference in another tab without leaving your draft. Use its search and filters; this resource does not determine project eligibility.",
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
      "La nota conceptual es la primera presentación de la idea del proyecto. La tarjeta de inicio reúne la introducción, convocatoria, temas y plazo; las tarjetas de categorías muestran los montos, duración y cofinanciamiento aplicables.",
      "The concept note is the initial presentation of your project idea. The opening card groups the introduction, call, topics and deadline; category cards show applicable funding, duration and cofinancing requirements.",
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
        "En la configuración vigente: monto GLF mayor que cero y hasta USD 100.000; máximo 12 meses. El aporte de cofinanciamiento no es obligatorio: registre 0 si no contempla aportes adicionales.",
        "Small",
        "Under current settings: GLF funding above zero and up to USD 100,000; maximum 12 months. No cofinancing contribution is required: enter 0 if there are no additional contributions.",
      ],
      [
        "Mediana",
        "Más de USD 100.000 y hasta USD 250.000; máximo 24 meses. Cofinanciamiento mínimo del 10 % del monto solicitado al GLF, en especie o efectivo.",
        "Medium",
        "Over USD 100,000 and up to USD 250,000; maximum 24 months. Minimum cofinancing of 10% of the amount requested from GLF, in kind or cash.",
      ],
      [
        "Grande",
        "Más de USD 250.000; máximo 36 meses. Cofinanciamiento mínimo equivalente al 25 % del monto solicitado al GLF.",
        "Large",
        "Over USD 250,000; maximum 36 months. Minimum cofinancing equivalent to 25% of the amount requested from GLF.",
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
      "Revise siempre las tarjetas y reglas de la convocatoria elegida. Una persona natural solo puede optar a la categoría pequeña según las reglas actuales. Crear un borrador nuevo no continúa el proyecto anterior: verifique sus datos precargados.",
      "Always check the cards and rules for the selected call. Under current rules, individuals may only apply for small grants. Creating a new draft does not resume a previous project: review any prefilled details.",
    ],
    screen: [
      ["Prepare su nota conceptual", "Prepare your concept note"],
      ["Convocatoria · plazo · prioridades", "Call · deadline · priorities"],
      ["Pequeña | Mediana | Grande", "Small | Medium | Large"],
      ["Preparar nota conceptual", "Prepare concept note"],
    ],
  },
  {
    id: "exclusiones",
    title: ["Consultar la lista de exclusión", "Consult the exclusion list"],
    intro: [
      "Consulte las actividades que el Galápagos Life Fund no financia ni apoya antes de preparar su propuesta y al responder Experiencia SGAS. La consulta conserva el texto, notas y excepciones del Anexo B suministrado.",
      "Consult the activities Galápagos Life Fund does not finance or support before preparing your proposal and when answering ESMS experience. The reference retains the supplied Annex B text, notes and exceptions.",
    ],
    steps: [
      [
        "Abra Lista de exclusión, a la izquierda de Manual de uso en el encabezado. Se abre en otra pestaña; puede regresar al borrador.",
        "Open Exclusion list, to the left of User manual in the header. It opens in another tab; you can return to your draft.",
      ],
      [
        "Busque términos relacionados con sus actividades, compras, lugares y organizaciones participantes. Combine la búsqueda con un tema y lea el texto completo de cada coincidencia.",
        "Search terms related to activities, purchases, locations and participating organizations. Combine search with a topic and read each matching entry in full.",
      ],
      [
        "Revise las notas y excepciones y, cuando necesite contrastarlas, abra Ver PDF original o Descargar PDF. Borre los filtros para volver a la lista completa.",
        "Review notes and exceptions and use View original PDF or Download PDF to compare the source. Clear filters to return to the complete list.",
      ],
    ],
    rows: [
      [
        "Buscador y temas",
        "Las coincidencias y resaltados sirven para localizar contenido; que no aparezcan resultados no acredita que la actividad sea financiable.",
        "Search and topics",
        "Matches and highlights help locate content; no matches does not establish that an activity is eligible for funding.",
      ],
      [
        "PDF y notas de la fuente",
        "La fuente disponible es el Anexo B en español de octubre de 2024. Las notas forman parte de la lectura; no omita las condiciones o excepciones.",
        "Source PDF and notes",
        "The available source is the October 2024 Spanish Annex B. Notes must be read with the entries; do not omit conditions or exceptions.",
      ],
      [
        "ES / EN",
        "Se traducen los controles y las orientaciones de consulta. El texto normativo disponible y el PDF original permanecen en español; no se presentan como una traducción inglesa aprobada.",
        "ES / EN",
        "Reference controls and guidance are translated. The available normative text and original PDF remain in Spanish; they are not presented as an approved English translation.",
      ],
    ],
    tip: [
      "La búsqueda no clasifica ni aprueba una postulación. Si identifica una posible relación con una exclusión, revise la disposición completa y consulte al GLF antes de asumir que su proyecto cumple.",
      "Search does not classify or approve an application. If an exclusion may apply, read the full provision and consult GLF before assuming compliance.",
    ],
    screen: [
      ["Lista de exclusión → otra pestaña", "Exclusion list → another tab"],
      [
        "Buscar actividad + Filtrar por tema",
        "Search activity + Filter by topic",
      ],
      [
        "Texto completo · notas · excepciones",
        "Full text · notes · exceptions",
      ],
      ["Ver PDF original | Descargar PDF", "View original PDF | Download PDF"],
    ],
  },
  {
    id: "orientacion",
    title: [
      "Cómo recorrer y completar el formulario",
      "How to navigate and complete the form",
    ],
    intro: [
      "La nota conceptual del proyecto tiene seis pasos. Las franjas azul claro con acento turquesa indican el comienzo de una sección; las fichas numeradas agrupan sus objetivos, actividades, resultados y estrategias.",
      "The project concept note has six steps. Pale blue headings with a teal accent mark section starts; numbered cards group objectives, activities, outcomes and strategies.",
    ],
    steps: [
      [
        "Recorra Información general → Descripción → Presupuesto → Actividades y riesgos → Experiencia SGAS → Revisar y enviar. En móvil, desplace horizontalmente la barra si no ve todos los botones.",
        "Follow General information → Description → Budget → Activities and risks → ESMS experience → Review and submit. On mobile, scroll the step bar horizontally if some buttons are out of view.",
      ],
      [
        "Escriba en las cajas, seleccione las referencias que ya ingresó y atienda los mensajes junto a cada campo. Las etiquetas permanecen visibles aunque desaparezca el mensaje gris dentro de la caja al enfocarla.",
        "Type in the boxes, select references already entered and follow messages beside each field. Labels remain visible when the grey in-box prompt disappears on focus.",
      ],
      [
        "Espere el guardado antes de cerrar. Guardar borrador, Finalizar y anexar, Preparar documentos y Enviar al GLF son acciones distintas; el último botón es el que presenta el expediente.",
        "Wait for saving before closing. Save draft, Complete and attach, Prepare documents and Submit to GLF are distinct actions; only the final submission button presents the dossier.",
      ],
    ],
    rows: [
      [
        "Asterisco y campos condicionales",
        "El asterisco indica un dato requerido cuando corresponda. Algunos controles aparecen o cambian según el tipo de solicitante, categoría, fase o una respuesta previa. Puede guardar un borrador incompleto, pero debe corregirlo antes de completar o enviar.",
        "Asterisks and conditional fields",
        "An asterisk marks a required item where applicable. Some controls appear or change according to applicant type, category, phase or an earlier answer. Incomplete drafts can be saved, but must be corrected before completion or submission.",
      ],
      [
        "Mensaje gris dentro de la caja",
        "Es una orientación, no una respuesta ni un ejemplo que deba conservar. Desaparece al enfocar la caja y al escribir; si vuelve a dejarla vacía, puede aparecer de nuevo.",
        "Grey in-box prompt",
        "It is guidance, not an answer or example you must retain. It disappears on focus and while typing; it may return if the box is left empty.",
      ],
      [
        "Caracteres utilizados / permitidos / disponibles",
        "El contador muestra cuánto ha escrito y cuánto puede añadir, por ejemplo, 120 de 2.000 caracteres permitidos · 1.880 disponibles. Cada caja usa su propio límite; el resumen del proyecto se cuenta en palabras.",
        "Used / allowed / remaining characters",
        "The counter shows how much you have entered and can still add, for example, 120 of 2,000 allowed characters · 1,880 remaining. Each box has its own limit; the project summary is counted in words.",
      ],
      [
        "Fichas, botón + y papelera",
        "Use el botón de agregar para crear otra ficha. La papelera está en su encabezado, con una descripción accesible del elemento. Lea la confirmación: retirar un elemento puede dejar vínculos pendientes en otras secciones.",
        "Cards, + buttons and trash icons",
        "Use the add button to create another card. Its heading contains a trash icon with an accessible item description. Read confirmations: removing an item may leave links needing attention elsewhere.",
      ],
      [
        "Idioma y ayudas",
        "ES / EN cambia etiquetas, orientaciones y mensajes, pero no traduce sus respuestas. Abrir ayudas, plegar fichas o consultar la lista de exclusión no presenta la propuesta al GLF.",
        "Language and guidance",
        "ES / EN changes labels, guidance and messages, but does not translate your answers. Opening guidance, collapsing cards or consulting the exclusion list does not submit a proposal to GLF.",
      ],
    ],
    tip: [
      "Complete primero los objetivos específicos y actividades: después podrá seleccionarlos en resultados, presupuesto, riesgos, seguimiento y sostenibilidad, sin escribirlos de nuevo.",
      "Enter specific objectives and activities first: you can then select them in outcomes, budget, risks, monitoring and sustainability without retyping them.",
    ],
    screen: [
      ["Seis pasos · seleccione una sección", "Six steps · choose a section"],
      [
        "Etiqueta visible + orientación gris + caja",
        "Visible label + grey prompt + box",
      ],
      ["Utilizados / permitidos · disponibles", "Used / allowed · remaining"],
      [
        "Guardar ≠ Anexar ≠ Preparar ≠ Enviar",
        "Save ≠ Attach ≠ Prepare ≠ Submit",
      ],
    ],
  },
  {
    id: "datos",
    title: ["Paso 1 · Información general", "Step 1 · General information"],
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
        "Número de cédula de identidad",
        "Obligatorio para personas naturales. Ingrese 10 dígitos, sin espacios ni guiones, conservando los ceros iniciales. Se solicita además del número de credencial de residencia permanente. El control de formato no verifica su identidad ante el Registro Civil.",
        "Identity card number",
        "Required for individuals. Enter 10 digits without spaces or hyphens, retaining leading zeros. This is requested in addition to the permanent residence card number. Format validation does not verify your identity with the Civil Registry.",
      ],
      [
        "Credencial de residencia permanente / RUC",
        "Persona natural: ingrese su número de credencial. La credencial de residencia permanente que se presente debe estar vigente. Organización: ingrese el RUC de 13 dígitos. La organización debe tener domicilio tributario en la provincia de Galápagos; si no cumple, su postulación podría ser descalificada. El GLF revisará los documentos.",
        "Permanent residence card / RUC",
        "Individuals enter their card number; the card presented must be current. Organizations enter their 13-digit RUC and must have tax domicile in Galápagos province; otherwise their application could be disqualified. GLF will review documents.",
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
        "Indique el domicilio del proponente. Las organizaciones deben tener domicilio en Galápagos y la provincia se muestra fijada. La dirección del proponente es distinta de la ubicación y área de influencia del proyecto.",
        "Province / City or locality / Street address",
        "Enter the applicant’s domicile. Organizations must be domiciled in Galápagos and the province is fixed. The applicant’s address differs from the project location and area of influence.",
      ],
      [
        "Organizaciones asociadas (opcional)",
        "Registre nombre y Descripción del apoyo en la implementación del proyecto en la misma fila. Ambos datos son necesarios cuando incorpora una organización. Agregue otras con + Agregar organización; la carta de cada una se carga al final, en Anexos.",
        "Partner organizations (optional)",
        "Enter the name and Description of support for project implementation on the same row. Both are needed when adding an organization. Use + Add organization for more partners; upload each letter in Attachments at the end.",
      ],
      [
        "Presupuesto total solicitado",
        "A la izquierda se ingresan el monto GLF y el cofinanciamiento. La tarjeta de la derecha calcula el total; respete los límites de la categoría.",
        "Total requested budget",
        "Enter GLF funding and cofinancing on the left. The card on the right calculates the total; respect the category limits.",
      ],
      [
        "Ubicación y área de influencia / Otras islas",
        "Seleccione una o varias islas, o Todo Galápagos, según el alcance real. Si marca Otras islas, escriba sus nombres. Describa los sitios y el área en la caja amplia Ubicación específica y ámbito del proyecto.",
        "Location and area of influence / Other islands",
        "Select one or more islands, or All Galápagos, matching the actual scope. Enter names when selecting Other islands. Describe sites and area in the full-width Specific project location and scope box.",
      ],
      [
        "Ubicación específica y ámbito",
        "En esta caja amplia, describa los sitios concretos de intervención y el área que abarcará el proyecto. No se limite a repetir los nombres de las islas.",
        "Specific project location and scope",
        "In this larger box, describe the specific intervention sites and the area the project will cover. Go beyond listing the island names.",
      ],
      [
        "Tema de aplicación",
        "Seleccione el tema de la convocatoria que mejor represente la propuesta.",
        "Application topic",
        "Select the call topic that best represents your proposal.",
      ],
      [
        "Duración y principales fechas del proyecto",
        "Fecha de inicio a la izquierda y finalización a la derecha. El cálculo muestra meses, días restantes y días totales, incluyendo ambas fechas. El final debe ser posterior al inicio y no superar la duración de su categoría; la duración puede ser menor que el máximo. Cambiar estas fechas puede requerir revisar los calendarios de actividades.",
        "Duration and principal project dates",
        "Start date is on the left and end date on the right. The calculation shows calendar months, remaining days and total days, including both dates. End must follow start and respect the category duration; a shorter duration is allowed. Changing these dates may require reviewing activity schedules.",
      ],
      [
        "Monto solicitado al GLF (USD)",
        "Ingrese el aporte que solicita al Fondo, mayor que cero y dentro del rango de la categoría. Si aparece una advertencia de categoría, compruebe la categoría y el importe; no sustituya el aporte GLF por el costo total del proyecto.",
        "Amount requested from GLF (USD)",
        "Enter the contribution requested from the Fund, above zero and within the category range. For a category warning, check the category and amount; do not enter total project cost as the GLF contribution.",
      ],
      [
        "Cofinanciamiento (USD)",
        "Pequeña: sin asterisco de obligatoriedad de aporte; ingrese 0 si no hay aportes adicionales. Mediana: al menos 10 % del monto GLF. Grande: al menos 25 % del monto GLF. La ayuda muestra el mínimo calculado. No se ha establecido un máximo propio de cofinanciamiento.",
        "Co-financing (USD)",
        "Small: no required-contribution asterisk; enter 0 if there are no additional contributions. Medium: at least 10% of GLF funding. Large: at least 25% of GLF funding. Guidance displays the calculated minimum. No separate cofinancing maximum is defined.",
      ],
      [
        "Costo total estimado",
        "Se calcula automáticamente: monto solicitado + cofinanciamiento. Compruebe el total mientras ingresa los valores.",
        "Estimated total cost",
        "Automatically calculated as requested amount + co-financing. Check the total as you enter values.",
      ],
      [
        "Eliminar una organización asociada",
        "La papelera abre una confirmación que identifica la organización y advierte que se eliminarán sus datos y la carta vinculada si ya se cargó. Cancelar no cambia nada. Los documentos de versiones previamente enviadas se conservan; no se asignan cartas a otro socio. Revise también los actores de sostenibilidad relacionados.",
        "Delete a partner organization",
        "The trash icon opens a confirmation identifying the partner and warning that its details and linked letter will be removed if uploaded. Cancel makes no changes. Documents belonging to previously submitted versions are preserved; letters are not reassigned to another partner. Also review linked sustainability actors.",
      ],
      [
        "Ingresar importes con punto o coma",
        "Escriba 12500,50 o 12500.50, con hasta dos decimales y preferentemente sin separadores de miles. Mientras escribe puede completar el decimal; al salir se aplica el formato del idioma. Los controles de monto, categoría y cofinanciamiento siguen vigentes.",
        "Entering amounts with a point or comma",
        "Enter 12500.50 or 12500,50, using up to two decimal places and preferably no thousands separators. You can finish the decimal while typing; leaving the field applies the language’s display format. Funding, category and cofinancing checks still apply.",
      ],
    ],
    tip: [
      "Los mensajes junto a los campos explican qué corregir. No basta con guardar un borrador para que esté listo para enviar.",
      "Messages beside fields explain what to correct. Saving a draft does not mean it is ready to submit.",
    ],
    screen: [
      [
        "Tipo de solicitante | Categoría de subvención",
        "Applicant type | Grant category",
      ],
      [
        "Nombre de organización o proponente | Tema de aplicación",
        "Organization or applicant name | Application topic",
      ],
      [
        "Título · Identificación aplicable · Contacto · Domicilio",
        "Title · Applicable identification · Contact · Domicile",
      ],
      [
        "Organizaciones asociadas → cartas en Anexos",
        "Partner organizations → letters in Attachments",
      ],
      [
        "Duración: Inicio | Finalización → meses y días",
        "Duration: Start | End → months and days",
      ],
      [
        "Monto GLF + Cofinanciamiento = Costo total estimado",
        "GLF amount + Cofinancing = Estimated total cost",
      ],
    ],
  },
  {
    id: "descripcion",
    title: ["Paso 2 · Descripción", "Step 2 · Description"],
    intro: [
      "Escriba de forma concreta y comprensible. El resumen del proyecto se redacta en una sola caja, con párrafos si los necesita. Su contador muestra el límite total de palabras establecido para la convocatoria.",
      "Write clearly and concisely. Write the project summary in a single box, using paragraphs if needed. Its counter shows the total word limit set for the call.",
    ],
    steps: [
      [
        "Integre en el resumen el contexto, el problema, las amenazas, la justificación, la solución propuesta y los resultados esperados. Si supera el límite, puede guardar el borrador, pero debe reducir el texto antes de continuar.",
        "Include the context, problem, threats, rationale, proposed solution and expected results in the summary. If you exceed the limit, you can save the draft, but must shorten the text before continuing.",
      ],
      [
        "Si hay solapamiento o duplicación con actividades de un proyecto anterior o en curso financiado por el Fondo u otro donante, explique por qué esta propuesta es diferente y/o necesaria; de lo contrario, será automáticamente rechazada. Indique también si forma parte de una propuesta coordinada a varios donantes simultáneamente.",
        "If activities overlap with or duplicate a previous or ongoing project funded by the Fund or another donor, explain why this proposal is different and/or necessary; otherwise, it will be automatically rejected. Also state whether it is part of a coordinated proposal submitted to several donors simultaneously.",
      ],
      [
        "Complete en este orden: Resumen del proyecto; Objetivos del proyecto y alineación; Actividades; Beneficiarios y contribuciones a medios de vida; Resultados e indicadores de impacto; Riesgos ambientales y sociales potenciales; Seguimiento y evaluación; Sostenibilidad y replicabilidad.",
        "Complete in this order: Project summary; Objective/s and alignment; Activities; Beneficiaries and contributions to livelihoods; Outcomes and impact indicators; Potential environmental and social risks; Monitoring and evaluation; Sustainability and replication.",
      ],
    ],
    rows: [
      [
        "Resumen del proyecto",
        "Redacte una sola respuesta con contexto, problema o amenazas, justificación, solución propuesta y principales resultados esperados. Siga las viñetas y los avisos de declaración adicional. Respete el límite de palabras mostrado por la convocatoria; las partes históricas se muestran unidas en su orden original.",
        "Project summary",
        "Write one response covering context, problem or threats, rationale, proposed solution and main expected outcomes. Follow the bullets and additional-declaration notices. Observe the call’s displayed word limit; historical summary parts appear together in their original order.",
      ],
      [
        "Beneficiarios y contribuciones a medios de vida",
        "En la caja de ancho útil completo, identifique quién o qué se beneficia: especies, ecosistemas, personas, hogares u otros grupos, y cómo. Añada cantidades justificadas cuando sea posible. Complete este apartado antes de enviar.",
        "Beneficiaries and contributions to livelihoods",
        "Use the full-width box to identify who or what benefits: species, ecosystems, people, households or other groups, and how. Add justified quantities where possible. Complete this section before submission.",
      ],
      [
        "Sostenibilidad y replicabilidad",
        "Explique cómo se mantendrán los beneficios y si el enfoque puede replicarse.",
        "Sustainability and replication",
        "Explain how benefits will be sustained and whether the approach can be replicated.",
      ],
      [
        "Seguimiento y evaluación",
        "Complete fichas con un parámetro, una actividad o resultado existente, un indicador propuesto y su estrategia de seguimiento. Los indicadores sí se recogen en la nota conceptual; el método detallado y las metas se desarrollan después.",
        "Monitoring and evaluation",
        "Complete cards with a parameter, an existing activity or outcome, a proposed indicator and its monitoring strategy. Indicators are collected in the concept note; detailed methods and targets are developed later.",
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
        "Resumen: contexto · problema · justificación · solución",
        "Summary: context · problem · rationale · solution",
      ],
      [
        "Objetivos y alineación → Actividades",
        "Objective/s and alignment → Activities",
      ],
      [
        "Beneficiarios → Resultados → Riesgos potenciales",
        "Beneficiaries → Outcomes → Potential risks",
      ],
      ["Seguimiento → Sostenibilidad", "Monitoring → Sustainability"],
    ],
  },
  {
    id: "objetivos",
    title: [
      "Objetivos del proyecto y alineación estratégica",
      "Objective/s and strategic alignment",
    ],
    intro: [
      "Cada objetivo se escribe por separado. Solo el objetivo general se alinea con el Plan Galápagos 2030 y los ODS. Los objetivos específicos no requieren alineación. La selección expresa su aporte previsto; no es una certificación de impacto.",
      "Write each objective separately. Align only the general objective with Plan Galápagos 2030 and SDGs. Specific objectives do not require alignment. Selections express expected contributions; they do not certify impact.",
    ],
    steps: [
      [
        "Indique solamente el objetivo general en su caja: qué problema o cuestión abordará y qué busca lograr. Después seleccione sus alineaciones.",
        "Enter only the general objective in its box: what problem or issue it addresses and what it aims to achieve. Then select its alignments.",
      ],
      [
        "Seleccione los objetivos del Plan Galápagos 2030 y los ODS a los que contribuye. Otro instrumento de planificación es complementario y no sustituye estas selecciones.",
        "Select the objectives of Galapagos Plan 2030 and the SDGs to which it contributes. Other planning instruments complement rather than replace these selections.",
      ],
      [
        "Bajo Objetivos específicos, pulse Agregar objetivo específico de su proyecto y escriba cada objetivo en una caja distinta. No copie aquí objetivos del plan externo.",
        "Under Specific objectives, select Add a specific objective for your project and enter each one in a separate box. Do not copy external plan objectives here.",
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
        "Agregar objetivo específico de su proyecto",
        "Crea otra ficha numerada Objetivo específico 1, 2, etc. Después podrá seleccionarla por su código y texto en actividades y resultados.",
        "Add a specific objective for your project",
        "Creates another numbered Specific objective card, 1, 2, etc. You can later select it by code and text in activities and outcomes.",
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
        "Papelera: quitar selección u objetivo",
        "Retira una asociación o un objetivo específico. Revise después las actividades y resultados que lo utilizaban.",
        "Trash icon: remove selection or objective",
        "Removes an alignment or specific objective. Afterwards, review activities and results linked to it.",
      ],
      [
        "Otros instrumentos de planificación (opcional)",
        "Pulse Añadir otro instrumento y complete el nombre del instrumento y el objetivo externo con el que se alinea el objetivo general. Puede añadir hasta 10, con 2.000 caracteres por campo. Si añade una ficha, complete ambos campos antes de continuar; la papelera retira solo esa alineación.",
        "Other planning instruments (optional)",
        "Select Add another instrument and enter its name and the external objective aligned with the project’s general objective. Up to 10 instruments, with 2,000 characters per field. Complete both fields on each added card before continuing; its trash icon removes only that alignment.",
      ],
      [
        "Alcance de la alineación",
        "Plan Galápagos 2030 y Plan 2030 se refieren al mismo plan. No se vuelve a exigir una alineación independiente con prioridades del GLF: la convocatoria y el tema de aplicación ya establecen esa relación.",
        "Alignment scope",
        "Galapagos Plan 2030 and Plan 2030 refer to the same plan. A separate alignment with GLF priorities is not requested again: the call and application topic establish that relationship.",
      ],
    ],
    tip: [
      "Ejemplo ilustrativo: «Fortalecer capacidades de jóvenes para la conservación marina» → seleccione el objetivo pertinente del Plan y los ODS correspondientes.",
      "Illustrative example: ‘Strengthen young people's capacity for marine conservation’ → select the relevant Plan objective and SDGs.",
    ],
    screen: [
      ["Objetivo general * → Plan · ODS", "General objective * → Plan · SDGs"],
      [
        "OE1: objetivo específico (sin alineación)",
        "SO1: specific objective (no alignment)",
      ],
      [
        "+ Agregar objetivo específico de su proyecto",
        "+ Add a specific objective for your project",
      ],
    ],
  },
  {
    id: "actividades",
    title: [
      "Actividades y registro de riesgos potenciales",
      "Activities and potential risk register",
    ],
    intro: [
      "Actividades aparece inmediatamente después de los objetivos y sus alineaciones. Sus registros se reutilizan en el presupuesto y en Actividades y riesgos; no vuelva a crear una actividad para cada sección.",
      "Activities appears immediately after objectives and alignments. These records are reused in Budget and Activities and risks; do not recreate activities for each section.",
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
        "Fechas preliminares de la actividad (opcionales)",
        "Puede dejar ambas vacías. Si completa una fecha, complete también la otra antes de continuar o enviar. Se permite que una actividad dure un solo día y que distintas actividades coincidan. Las fechas deben estar dentro del período general; cambiarlo no reescribe las fechas de las actividades. Puede guardar un borrador incompleto y corregirlo después. Estas fechas se conservan al pasar a fase 2 y no sustituyen la planificación de medidas de salvaguardas.",
        "Preliminary activity dates (optional)",
        "You may leave both blank. If you enter one date, complete the other before continuing or submitting. An activity may last one day and activities may overlap. Dates must fall within the overall project period; changing it does not rewrite activity dates. You may save an incomplete draft and correct it later. These dates are retained in phase 2 and do not replace safeguard measure planning.",
      ],
      [
        "Nombre de la actividad",
        "Acción concreta que ejecutará; no sustituye al objetivo.",
        "Activity name",
        "Specific action you will carry out; it does not replace the objective.",
      ],
      [
        "Descripción de la actividad",
        "Explique qué hará, su alcance, si parte de un proyecto existente y las fases o períodos previstos. La descripción debe permitir valorar sus riesgos; las fechas de los calendarios complementan esta explicación.",
        "Activity description",
        "Explain the action, scope, whether it builds on an existing project and planned phases or periods. The description must support risk assessment; date pickers complement this explanation.",
      ],
      [
        "Objetivos específicos a los que contribuye",
        "Marque uno o más objetivos pertinentes. Cada opción muestra el código y el texto completo.",
        "Specific objectives contributed to",
        "Check one or more relevant objectives. Each option displays its code and full text.",
      ],
      [
        "Agregar / Papelera: quitar actividad",
        "Añade o retira una actividad con confirmación. Si tiene evaluaciones de riesgo, retírelas primero. Después de eliminarla, revise costos pendientes, indicadores de seguimiento y estrategias de sostenibilidad que la referenciaban; no se asignan a otra actividad automáticamente.",
        "Add / Trash icon: remove activity",
        "Adds or removes an activity with confirmation. Remove its risk assessments first if any exist. After deletion, review pending costs, monitoring indicators and sustainability strategies referencing it; they are not automatically reassigned.",
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
        "Agregar / Papelera: quitar riesgo potencial",
        "Mantiene un catálogo común para las actividades. Si cambia o elimina un riesgo ya utilizado, revise las evaluaciones relacionadas.",
        "Add / Trash icon: remove potential risk",
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
    id: "resultados",
    title: [
      "Resultados e indicadores de impacto",
      "Outcomes and impact indicators",
    ],
    intro: [
      "En la nota conceptual, seleccione un objetivo específico y describa qué espera conseguir al finalizar el proyecto y qué entregará. El detalle de medición se completa en la fase de proyecto completo.",
      "In the concept note, select a specific objective and describe the likely outcomes at project end and what will be delivered. Measurement details are completed in the full proposal phase.",
    ],
    steps: [
      [
        "Seleccione un objetivo específico ya registrado y escriba el resultado esperado. Puede agregar varios resultados para el mismo objetivo.",
        "Select a specific objective already entered and write the expected outcome. You can add several results for the same objective.",
      ],
      [
        "En fase 2, complete el indicador de impacto, la meta propuesta, la unidad y la evidencia para esos mismos resultados.",
        "In phase 2, complete the impact indicator, proposed target, unit and evidence for those same results.",
      ],
    ],
    rows: [
      [
        "Objetivo específico al que se asocia el resultado",
        "Seleccione un objetivo ya escrito. Si fue eliminado, elija otro válido.",
        "Specific objective associated with the result",
        "Select an objective already entered. If it was deleted, choose another valid one.",
      ],
      [
        "Resultado esperado",
        "Describa qué conseguirá y qué entregará: elementos físicos, materiales, infraestructura, formación o desarrollo de capacidades. Hasta 2.000 caracteres.",
        "Expected result",
        "Describe what will be achieved and delivered: physical items, materials, infrastructure, training or skills development. Up to 2,000 characters.",
      ],
      [
        "Agregar / Papelera: quitar resultado",
        "Añade o retira una ficha, con confirmación antes de eliminar. Hasta 30 resultados.",
        "Add / Trash icon: remove result",
        "Adds or removes a card, with confirmation before deletion. Up to 30 results.",
      ],
      [
        "Borradores narrativos anteriores",
        "Si el borrador anterior contiene texto, puede editarlo en Resultados previstos y entregables. Organizar en resultados individuales (opcional) permite crear fichas conservando la fuente, sin convertirla automáticamente. En formularios nuevos se completan directamente las fichas; la primera se guarda al empezar a editarla.",
        "Older narrative drafts",
        "If an older draft contains text, edit it under Expected outcomes and deliverables. Organize into individual results (optional) creates cards while retaining the source without automatic conversion. New forms use cards directly; the first is saved when you start editing it.",
      ],
      [
        "Medición en la propuesta completa",
        "En la fase 1, las fichas nuevas piden solo el objetivo específico asociado y el resultado esperado. El indicador de impacto, la meta propuesta, unidad y evidencia de ese resultado se completan en fase 2; no confunda estos datos con los indicadores propuestos que sí se capturan ahora en Seguimiento y evaluación.",
        "Measurement in the full proposal",
        "In phase 1, new cards request only the associated specific objective and expected outcome. The outcome’s impact indicator, proposed target, unit and evidence are completed in phase 2; distinguish these from proposed indicators already collected under Monitoring and evaluation.",
      ],
    ],
    tip: [
      "Ejemplo ilustrativo de nota conceptual: objetivo: fortalecer capacidades locales; resultado: jóvenes con conocimientos para conservar el entorno marino y materiales de formación disponibles.",
      "Illustrative concept note example: objective: strengthen local capacities; outcome: young people equipped to conserve the marine environment and training materials available.",
    ],
    screen: [
      ["Objetivo específico * → OE1", "Specific objective * → SO1"],
      ["Resultado esperado *", "Expected result *"],
      ["+ Agregar otro resultado", "+ Add another result"],
      [
        "Fase 2: indicador · meta · unidad · evidencia",
        "Phase 2: indicator · target · unit · evidence",
      ],
    ],
  },
  {
    id: "seguimiento",
    title: ["Seguimiento y evaluación", "Monitoring and evaluation"],
    intro: [
      "Después de los riesgos potenciales, registre al menos una ficha completa vinculada a una actividad o resultado válido. Las fichas son la propuesta actual de seguimiento, también cuando el borrador conserva una narrativa anterior.",
      "After potential risks, enter at least one complete card linked to a valid activity or outcome. Cards form the current monitoring proposal, including when a draft retains an earlier narrative.",
    ],
    steps: [
      [
        "Seleccione el parámetro y una actividad o resultado ya ingresado. Se mostrarán sus objetivos específicos asociados.",
        "Select the parameter and an activity or outcome already entered. Its associated specific objectives will be displayed.",
      ],
      [
        "Describa el indicador y la estrategia de seguimiento. Puede agregar otros para el mismo registro; no se exige uno para cada actividad o resultado.",
        "Describe the indicator and monitoring strategy. You can add others for the same record; one is not required for every activity or outcome.",
      ],
    ],
    rows: [
      [
        "Parámetro de evaluación que propone",
        "Avance de una actividad o logro de un resultado.",
        "Proposed evaluation parameter",
        "Progress of an activity or achievement of an outcome.",
      ],
      [
        "Actividad o resultado al que dará seguimiento",
        "Seleccione entre los registros previos con objetivos específicos válidos. Si elimina el registro, la ficha se conserva y requiere revisar el vínculo.",
        "Activity or outcome to monitor",
        "Choose an existing record with valid specific objectives. If the record is deleted, the card is kept and its link must be reviewed.",
      ],
      [
        "Indicador propuesto",
        "Qué observará o medirá. Hasta 1.000 caracteres.",
        "Proposed indicator",
        "What you will observe or measure. Up to 1,000 characters.",
      ],
      [
        "Estrategia y actividades de seguimiento",
        "Cómo observará o comprobará el indicador. Hasta 2.000 caracteres.",
        "Monitoring strategy and activities",
        "How you will observe or verify the indicator. Up to 2,000 characters.",
      ],
      [
        "Agregar / Papelera",
        "Hasta 30 fichas. La papelera pide confirmación y conserva la actividad, el resultado y los objetivos.",
        "Add / Trash icon",
        "Up to 30 cards. Deletion requires confirmation and retains the activity, outcome and objectives.",
      ],
      [
        "Borradores anteriores",
        "El texto anterior se conserva en Consultar propuesta anterior. Complete las fichas seleccionando sus vínculos; no se convierte el texto automáticamente. Antes de preparar o enviar, se exige al menos una ficha completa. Puede guardar un borrador incompleto.",
        "Older drafts",
        "The original text is retained under View previous proposal. Complete the cards and select their links; text is not converted automatically. At least one complete card is required before preparing or submitting. Incomplete drafts can be saved.",
      ],
    ],
    tip: [
      "Ejemplo: actividad: talleres; indicador: número de talleres realizados; seguimiento: revisión de registros después de cada taller.",
      "Example: activity: workshops; indicator: number of workshops delivered; monitoring: review records after each workshop.",
    ],
    screen: [
      ["Parámetro → Actividad / Resultado", "Parameter → Activity / Outcome"],
      ["Objetivos asociados (automático)", "Associated objectives (automatic)"],
      ["Indicador propuesto *", "Proposed indicator *"],
      [
        "Estrategia y actividades de seguimiento *",
        "Monitoring strategy and activities *",
      ],
      ["+ Agregar indicador de seguimiento", "+ Add monitoring indicator"],
    ],
  },
  {
    id: "sostenibilidad",
    title: [
      "Sostenibilidad y replicabilidad",
      "Sustainability and replication",
    ],
    intro: [
      "Después de Seguimiento y evaluación, registre estrategias breves para dar continuidad al trabajo o sus beneficios. Cada ficha numerada puede asociarse a varios resultados o actividades.",
      "After Monitoring and evaluation, enter brief strategies for continuity of the work or its benefits. Each numbered card can link to several outcomes or activities.",
    ],
    steps: [
      [
        "Seleccione los registros existentes a los que aplica la estrategia. Consulte sus objetivos asociados sin volver a escribirlos.",
        "Select the existing records to which the strategy applies. View their associated objectives without entering them again.",
      ],
      [
        "Explique cómo se mantendrán los beneficios, el actor previsto y las condiciones de ampliación o réplica. Puede indicar No prevista o Por definir, explicando el motivo.",
        "Explain how benefits will be sustained, the expected actor and conditions for scaling up or replication. You may select Not planned or To be defined and explain why.",
      ],
      [
        "Puede vincular un indicador ya registrado, si corresponde. Las fichas completas se pueden plegar; la papelera siempre solicita confirmación.",
        "You may link an existing indicator where appropriate. Complete cards can be collapsed; deletion always requires confirmation.",
      ],
    ],
    rows: [
      [
        "Registros asociados y estrategia",
        "Seleccione uno o más resultados o actividades existentes, consulte sus objetivos y describa cómo mantendrá sus beneficios. No crea de nuevo esos registros ni se vinculan automáticamente por similitud del texto.",
        "Associated records and strategy",
        "Select one or more existing outcomes or activities, view their objectives and explain how their benefits will be sustained. Do not recreate these records; similar text does not establish a link automatically.",
      ],
      [
        "Actor previsto",
        "Proponente, organización asociada, otro actor con nombre o Por definir en el proyecto completo. No implica un compromiso confirmado.",
        "Expected actor",
        "Applicant, partner organization, another named actor or To be defined in the full proposal. This does not imply a confirmed commitment.",
      ],
      [
        "Asociaciones",
        "Los nombres se actualizan desde los registros originales. Si se elimina un referente, la estrategia se conserva y pide revisar el vínculo.",
        "Links",
        "Names update from their original records. If a referenced record is removed, the strategy is kept and its link needs review.",
      ],
      [
        "Borradores anteriores",
        "El texto previo permanece editable. Organizarlo en fichas es opcional y conserva el original sin conversión automática.",
        "Older drafts",
        "Existing text remains editable. Organizing it into cards is optional and preserves the original without automatic conversion.",
      ],
      [
        "Ampliación o réplica y condiciones",
        "Seleccione Ampliación, Réplica, ambas, No prevista o Por definir en el proyecto completo. Describa condiciones y pasos; si no se prevé réplica, explique el motivo. No prevista no implica rechazo.",
        "Scaling up or replication and conditions",
        "Select Scaling up, Replication, both, Not planned or To be defined in the full proposal. Describe conditions and steps; explain why when replication is not planned. Not planned does not mean rejection.",
      ],
      [
        "Vincular indicador (opcional)",
        "Puede asociar un indicador válido de Seguimiento y evaluación. No lo vuelva a redactar; si lo elimina después, revise el vínculo de la estrategia.",
        "Link indicator (optional)",
        "Optionally associate a valid Monitoring and evaluation indicator. Do not rewrite it; if later deleted, review the strategy’s link.",
      ],
      [
        "Plegar y ampliar fichas",
        "Cada ficha tiene número, borde y tono de fondo para distinguirla. Puede plegar una ficha completa para ahorrar espacio y volver a abrirla para editar. Plegar no elimina su contenido.",
        "Collapse and expand cards",
        "Each card has a number, border and background tint to distinguish it. Collapse completed cards to save space and reopen them to edit. Collapsing does not remove their content.",
      ],
    ],
    tip: [
      "No necesita una ficha por cada resultado. Una estrategia puede cubrir varios registros. Los borradores incompletos se guardan; complete las fichas y revise sus vínculos antes de enviar.",
      "One card per outcome is not required. One strategy can cover several records. Incomplete drafts can be saved; complete the cards and review their links before submission.",
    ],
    screen: [
      [
        "Estrategia de sostenibilidad 1 | Plegar | Papelera",
        "Sustainability strategy 1 | Collapse | Trash",
      ],
      [
        "Registros asociados → Estrategia → Actor y réplica → Condiciones",
        "Linked records → Strategy → Actor and replication → Conditions",
      ],
      ["Vincular indicador (opcional)", "Link indicator (optional)"],
      ["+ Agregar otra estrategia", "+ Add another strategy"],
    ],
  },
  {
    id: "presupuesto",
    title: ["Paso 3 · Presupuesto resumido", "Step 3 · Summary budget"],
    intro: [
      "Estime los costos de las actividades ya ingresadas. El presupuesto resumido debe coincidir con el monto GLF más el cofinanciamiento de Información general. El detalle anual corresponde a fase 2.",
      "Estimate costs for activities already entered. The summary budget must match GLF funding plus cofinancing in General information. Annual detail belongs to phase 2.",
    ],
    steps: [
      [
        "Consigne Bienes, Servicios, Consultorías y Honorarios por actividad; use 0 si no aplica.",
        "Enter Goods, Services, Consultancies and Fees per activity; use 0 if not applicable.",
      ],
      [
        "Identifique los gastos administrativos y el SGAS ya incluidos. Honorarios incluye remuneraciones y salarios; declare aparte solo los incluidos en otros rubros, sin sumarlos nuevamente.",
        "Identify administrative and ESMS costs already included. Fees include remuneration and salaries; separately identify only those included in other categories, without adding them again.",
      ],
      [
        "Administración: máximo 10 % del costo total del proyecto. Remuneraciones, honorarios y salarios: máximo 30 % del monto solicitado al GLF. Son bases diferentes; el portal muestra los límites calculados.",
        "Administration: maximum 10% of total project cost. Remuneration, fees and salaries: maximum 30% of the amount requested from GLF. These use different bases; the portal displays the calculated limits.",
      ],
      [
        "Puede guardar un borrador incompleto. Complete las actividades y corrija diferencias y límites antes de preparar los documentos y enviar.",
        "You can save an incomplete draft. Complete the activities and resolve differences and limits before preparing documents and submitting.",
      ],
    ],
    rows: [
      [
        "Totales",
        "No se modifican automáticamente los montos generales. El aviso indica cuánto falta distribuir o cuánto se excede.",
        "Totals",
        "General amounts are not changed automatically. A notice shows the remaining allocation or excess.",
      ],
      [
        "Vínculos",
        "Renombrar o reordenar actividades conserva los importes. Si elimina una actividad, revise y confirme la retirada de sus costos pendientes.",
        "Links",
        "Renaming or reordering activities preserves amounts. If an activity is deleted, review and confirm removal of its pending costs.",
      ],
      [
        "Bienes / Servicios / Consultorías / Honorarios",
        "Para cada actividad, distribuya su costo total en los cuatro rubros, incluyendo GLF y cofinanciamiento. No vuelva a introducir el mismo costo como otra actividad. Use 0 donde no aplique.",
        "Goods / Services / Consultancies / Fees",
        "For each activity, allocate total cost across the four categories, including GLF funding and cofinancing. Do not duplicate the cost as another activity. Enter 0 where not applicable.",
      ],
      [
        "Gastos administrativos incluidos",
        "Identifique el importe que ya está dentro de los cuatro rubros; no lo sume nuevamente. Su máximo es 10 % del costo total del proyecto, no solo del aporte GLF.",
        "Included administrative costs",
        "Identify the amount already within the four categories; do not add it again. The maximum is 10% of total project cost, not just GLF funding.",
      ],
      [
        "Otras remuneraciones incluidas fuera de Honorarios",
        "Honorarios debe incluir remuneraciones y salarios. Registre aquí solo los importes de ese tipo que estén en otros rubros. El control del 30 % suma Honorarios más esas otras remuneraciones.",
        "Other remuneration included outside Fees",
        "Fees should include remuneration and salaries. Enter here only such amounts included in other categories. The 30% check adds Fees and this other remuneration.",
      ],
      [
        "Elaboración e implementación del SGAS incluidas",
        "Identifique su importe ya incluido en los costos de actividades. No se añade como recargo al presupuesto ni se inventa una cantidad mínima no indicada en el formulario.",
        "Included ESMS preparation and implementation",
        "Identify the amount already included in activity costs. It is not added as a surcharge and the form does not define a new minimum amount.",
      ],
      [
        "Diferencia, subtotales y porcentajes",
        "El presupuesto debe igualar exactamente Monto GLF + Cofinanciamiento de Información general. La tabla resume por objetivo y actividad; el porcentaje se calcula sobre el total presupuestado. Use Editar Información general o Editar actividades para corregir el origen de una diferencia.",
        "Difference, subtotals and percentages",
        "The budget must equal Amount requested from GLF + Cofinancing in General information exactly. The table groups by objective and activity; percentages use the budgeted total. Use Edit General information or Edit activities to correct the source of a difference.",
      ],
    ],
    tip: [
      "Los importes incluidos de administración, remuneraciones y SGAS son parte del total, no cargos adicionales.",
      "Included administration, remuneration and ESMS amounts are part of the total, not additional charges.",
    ],
    screen: [
      [
        "Actividad → cuatro rubros → total y porcentaje",
        "Activity → four categories → total and percentage",
      ],
      [
        "Información general = Total presupuestado",
        "General information = Budgeted total",
      ],
    ],
  },
  {
    id: "screening",
    title: ["Paso 4 · Actividades y riesgos", "Step 4 · Activities and risks"],
    intro: [
      "El encabezado del paso desarrolla Actividades y Riesgos A&S. El examen inicial identifica y califica riesgos por actividad, reutilizando los registros de Descripción. La nota conceptual no pide medidas, costos, responsables ni planificación de mitigación: pertenecen a la fase 2.",
      "The step heading expands Activities and E&S Risks. Initial screening identifies and rates risks per activity using Description records. The concept note does not request mitigation measures, costs, responsible persons or schedules: these belong to phase 2.",
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
        "Se muestran desde la nota conceptual. Use Editar actividad y objetivos en Descripción del proyecto para corregirlos allí.",
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
        "Seleccione de 1 a 5 y consulte el significado original del GLF que aparece debajo. Puede comparar los cinco niveles en Consultar claves de calificación.",
        "Probability of occurrence (1–5)",
        "Select from 1 to 5 and review the original GLF definition shown below. Compare all five levels under View rating interpretation keys.",
      ],
      [
        "Gravedad del riesgo (1–5)",
        "Seleccione de 1 a 5 según la magnitud de las consecuencias y la definición original que aparece debajo del campo.",
        "Risk severity (1–5)",
        "Select from 1 to 5 based on the magnitude of consequences and the original definition displayed below the field.",
      ],
      [
        "Categoría del riesgo",
        "Cálculo automático: probabilidad × gravedad. 1–4: bajo; 5–9: medio; 10–15: alto; 16–25: muy alto. Sin ambas calificaciones queda incompleto.",
        "Risk category",
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
        "Filtre por dimensión o actividad. Pulse una casilla ocupada para consultar las evaluaciones. La categoría usa verde, amarillo, naranja y rojo, junto a su texto; el mapa no decide selección ni aprobación.",
        "Map: Risk type / Activity / Cells",
        "Filter by dimension or activity. Select an occupied cell to inspect assessments. Categories use green, yellow, orange and red alongside text; the map does not decide selection or approval.",
      ],
      [
        "Papelera: quitar evaluación de riesgo",
        "Retira esa evaluación de la actividad; el riesgo del catálogo se administra en la nota conceptual.",
        "Trash icon: remove risk assessment",
        "Removes that assessment from the activity; the risk register is managed in the concept note.",
      ],
      [
        "Claves de calificación",
        "Las definiciones originales del GLF aparecen bajo Probabilidad y Gravedad al seleccionar un valor. Consulte la tabla desplegable para comparar los niveles; el color de una variable no sustituye la categoría combinada probabilidad × gravedad.",
        "Rating interpretation keys",
        "Original GLF definitions appear below Probability and Severity when a value is selected. Expand the guide to compare levels; a variable’s colour does not replace the combined likelihood × severity category.",
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
        "Categoría del riesgo: Alto · Cálculo: 3 × 4 = 12",
        "Risk category: High · Calculation: 3 × 4 = 12",
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
      "La barra de avance incluye los requisitos de información, declaraciones y anexos aplicables a la fase; guardar no equivale a cumplirlos. Llegar al 100% no envía la postulación ni significa aprobación. Guardar conserva su trabajo; Enviar lo remite al GLF.",
      "The progress bar includes information, declarations and attachments applicable to the phase; saving does not establish completeness. Reaching 100% neither submits nor approves the application. Saving preserves your work; submitting sends it to GLF.",
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
        "Papelera: eliminar borrador / Cancelar / Confirmar eliminación",
        "Solo para borradores que nunca se han enviado. Revise la advertencia: la eliminación no se puede deshacer. Cancelar conserva el expediente.",
        "Trash icon: delete draft / Cancel / Confirm deletion",
        "Only for drafts that have never been submitted. Review the warning: deletion cannot be undone. Cancel preserves the dossier.",
      ],
      [
        "Abrir expediente enviado",
        "Consulta el registro presentado; no permite eliminarlo ni modificarlo por cuenta propia.",
        "Open submitted dossier",
        "Views the submitted record; it cannot be deleted or independently edited.",
      ],
      [
        "Refrescar y conservar el paso",
        "La sección seleccionada se refleja en la dirección del navegador. Al refrescar esa misma dirección se restaura el paso. Esto no recupera cambios todavía no guardados; confirme el guardado antes de recargar. Un enlace distinto puede abrir otra sección.",
        "Refresh and keep your step",
        "The selected section is reflected in the browser address. Refreshing the same address restores that step. This does not recover changes that were not saved; confirm saving before refreshing. A different link may open another section.",
      ],
      [
        "Aviso de autoguardado",
        "La explicación extensa se muestra únicamente en Información general. En los demás pasos continúan funcionando el autoguardado, su estado y Guardar borrador. Finalizar SGAS o preparar documentos no equivale a enviar.",
        "Autosave notice",
        "The full explanation appears only in General information. Autosave, save status and Save draft continue working in other steps. Completing ESMS or preparing documents does not submit the application.",
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
        "Continuar borrador | Papelera: eliminar borrador",
        "Continue draft | Trash icon: delete draft",
      ],
    ],
  },
  {
    id: "experiencia-sgas",
    title: ["Paso 5 · Experiencia SGAS", "Step 5 · ESMS experience"],
    intro: [
      "Declare su experiencia con el Sistema de Gestión Ambiental y Social. El cuestionario complementa la experiencia y el currículo del Anexo 1.",
      "Declare your Environmental and Social Management System experience. This questionnaire complements the experience summary and CV in Annex 1.",
    ],
    steps: [
      [
        "Responda Sí o No sin dejar preguntas aplicables pendientes. Una respuesta No sobre experiencia no implica rechazo automático.",
        "Answer Yes or No for each applicable question. A No about experience does not imply automatic rejection.",
      ],
      [
        "Si declara antecedentes en derechos humanos, indique el estado de cualquier investigación. Si usa personal externo, responda sobre su experiencia; puede combinarlo con personal interno.",
        "If declaring human rights involvement, state the status of any investigation. When using external staff, answer about their expertise; you may also use internal staff.",
      ],
      [
        "Pulse Finalizar y anexar. Espere la confirmación de que se guardaron las respuestas y se incorporó el PDF. No tiene que descargarlo, firmarlo ni volver a subirlo.",
        "Select Complete and attach. Wait for confirmation that answers were saved and the PDF attached. No download, signature or manual upload is required.",
      ],
      [
        "Consulte el documento Experiencia SGAS en el paso 6 Revisar y enviar → Anexos. Si cambia respuestas o los datos de su encabezado, pulse Actualizar anexo.",
        "View ESMS experience in step 6 Review and submit → Attachments. After changing answers or heading details, select Update attachment.",
      ],
    ],
    rows: [
      [
        "Manual SGAS y Lista de Exclusión",
        "Responda cada pregunta de revisión documental con Sí o No después de leer las referencias enlazadas. No hay respuestas marcadas de antemano.",
        "ESMS manual and Exclusion List",
        "Answer each document-review question Yes or No after reading the linked references. No answers are preselected.",
      ],
      [
        "Antecedentes en derechos humanos",
        "Si responde Sí a la pregunta sobre los últimos cinco años, se despliega Indique el estado de cualquier investigación y debe completarlo. Al volver a No se oculta; el PDF muestra solo la rama aplicable.",
        "Human rights background",
        "A Yes to the question about the last five years reveals State the status of any investigation, which must be completed. Selecting No hides it; the PDF shows only the applicable branch.",
      ],
      [
        "Experiencia y expertos",
        "Responda sobre normas internacionales, evaluaciones y herramientas A&S, expertos ambientales y sociales y expertos en igualdad de género. Los detalles breves sobre normas o evaluaciones aparecen si responde Sí y son opcionales.",
        "Experience and experts",
        "Answer about international standards, E&S assessments and tools, environmental and social experts and gender equality experts. Brief standards or assessment details appear after Yes and are optional.",
      ],
      [
        "Personal interno / Personal externo",
        "Responda ambas preguntas; puede combinar personal interno y externo. Solo al responder Sí a personal externo se solicita si ha identificado experiencia adecuada para desarrollar herramientas de salvaguardia.",
        "Internal staff / External staff",
        "Answer both questions; internal and external staff may be combined. Only Yes to external staff asks whether appropriate expertise for safeguard tools has been identified.",
      ],
      [
        "Personas naturales",
        "Las preguntas sobre su organización se adaptan a usted o su equipo. Registre su experiencia real; no invente una organización para responder.",
        "Individuals",
        "Questions about your organization adapt to you or your team. Enter your actual experience; do not invent an organization to answer.",
      ],
      [
        "Finalizar y anexar",
        "Valida las respuestas aplicables, guarda y genera el PDF. Espere Guardando y anexando… y la confirmación Formulario completado y anexado. No hace falta completar los otros pasos ni firmar o cargar manualmente este PDF.",
        "Complete and attach",
        "Validates applicable answers, saves and generates the PDF. Wait for Saving and attaching… and Form completed and attached. Other steps need not be complete and this PDF requires neither signature nor manual upload.",
      ],
      [
        "Ver en Anexos / Consultar Experiencia SGAS",
        "Ver en Anexos abre el paso 6 y lleva al documento incorporado. Consultar Experiencia SGAS permite obtener su PDF. La incorporación automática no se confirma hasta que el archivo y su registro existen.",
        "View in Attachments / View ESMS experience",
        "View in Attachments opens step 6 at the attached document. View ESMS experience retrieves its PDF. Automatic attachment is confirmed only after the file and its record exist.",
      ],
      [
        "Actualizar anexo",
        "Si cambia respuestas, tipo o nombre del proponente o título del proyecto, el documento puede quedar pendiente de actualización. Pulse Actualizar anexo al concluir. Se conservan las versiones anteriores; la propuesta usa el documento que representa las respuestas actuales.",
        "Update attachment",
        "Changes to answers, applicant type or name, or project title may make the document outdated. Select Update attachment when finished. Earlier versions remain in history; the proposal uses the document representing current answers.",
      ],
      [
        "Error al anexar",
        "Las respuestas guardadas se conservan. Revise el mensaje y reintente; no considere anexado un documento sin confirmación. Evite pulsar repetidamente mientras procesa.",
        "Attachment error",
        "Saved answers are retained. Check the message and retry; do not consider a document attached without confirmation. Avoid repeated clicks while processing.",
      ],
      [
        "Anexo 1 y envío al GLF",
        "Este PDF se anexa como Experiencia SGAS, separado del Anexo 1 de experiencia/proyectos o currículo. Finalizar y anexar no envía la propuesta; ese envío se hace en Revisar y enviar.",
        "Annex 1 and submission to GLF",
        "This PDF is attached as ESMS experience, separately from Annex 1 experience/projects or CV. Complete and attach does not submit the proposal; submission takes place in Review and submit.",
      ],
    ],
    tip: [
      "Finalizar este cuestionario incorpora un anexo; el envío al GLF se realiza en el último paso.",
      "Completing this questionnaire adds an attachment; submission to GLF takes place in the final step.",
    ],
    screen: [
      [
        "Revisión documental → Antecedentes y capacidad → Equipo",
        "Document review → Background and capacity → Team",
      ],
      [
        "Sí / No → Detalle si corresponde",
        "Yes / No → Details where applicable",
      ],
      [
        "Finalizar y anexar → Guardando y anexando…",
        "Complete and attach → Saving and attaching…",
      ],
      [
        "Formulario completado y anexado → Ver en Anexos",
        "Form completed and attached → View in Attachments",
      ],
    ],
  },
  {
    id: "documentos",
    title: [
      "Paso 6 · Revisar, preparar y firmar",
      "Step 6 · Review, prepare and sign",
    ],
    intro: [
      "Revise el resumen del expediente, los pendientes y las declaraciones. En este paso hay una zona de Documentos firmados y otra de Anexos. La nota conceptual y el examen A&S requieren firma; el PDF automático Experiencia SGAS no.",
      "Review the dossier summary, outstanding items and declarations. This step separates Signed documents from Attachments. The concept note and E&S screening require signatures; the automatic ESMS experience PDF does not.",
    ],
    steps: [
      [
        "Revise el expediente, lea el aviso de privacidad y marque las declaraciones cuando reflejen su decisión.",
        "Review the dossier, read the privacy notice and check declarations when they reflect your decision.",
      ],
      [
        "Guarde los cambios, finalice Experiencia SGAS y pulse Preparar documentos para firma. Si hay pendientes, siga sus enlaces para corregirlos y vuelva a revisar.",
        "Save changes, complete ESMS experience and select Prepare documents for signing. Follow links to correct outstanding items and return to review.",
      ],
      [
        "Descargue ambos PDF, compruebe su contenido y el nombre del responsable, y firme los archivos con su herramienta de firma electrónica.",
        "Download both PDFs, check their content and responsible person's name, and sign the files using your electronic signature tool.",
      ],
      [
        "Seleccione cada PDF firmado en su casilla y pulse Guardar documento. Lea la advertencia de firma; use Revisar archivo para volver o Continuar y guardar para registrar la carga. Espere su confirmación antes de enviar.",
        "Select each signed PDF in its slot and select Save document. Read the signature warning; select Review file to go back or Continue and save to register the upload. Wait for confirmation before submitting.",
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
        "Después de guardar y finalizar Experiencia SGAS, valida el contenido y prepara los dos PDF vigentes. No envía la postulación ni incorpora una firma. Si el botón no está disponible, revise el estado de guardado y los importes.",
        "Prepare documents for signing",
        "After saving and completing ESMS experience, validates the content and prepares the two current PDFs. It neither submits the application nor adds a signature. If unavailable, check save status and monetary entries.",
      ],
      [
        "Descargar nota conceptual",
        "Descarga el PDF con la información del proyecto. El nombre incluye la referencia del expediente y el momento de generación.",
        "Download concept note",
        "Downloads the project information PDF. Its filename includes the dossier reference and generation timestamp.",
      ],
      [
        "Descargar evaluación A&S",
        "Obtiene por separado el examen ambiental y social inicial. Tras firmarlo, cárguelo en Anexo 2. Resultados del examen ambiental y social — PDF firmado, dentro de Documentos firmados.",
        "Download E&S screening",
        "Retrieves the initial environmental and social screening separately. After signing, upload it under Annex 2. Environmental and social screening results — signed PDF, within Signed documents.",
      ],
      [
        "Seleccionar archivo / Guardar documento",
        "En Documentos firmados, seleccione un PDF para la nota conceptual y otro para el Anexo 2 de examen A&S; máximo 4 MB cada uno. Pulse Guardar documento, lea la advertencia y confirme Continuar y guardar. Seleccionar el archivo por sí solo no completa la carga.",
        "Choose file / Save document",
        "Under Signed documents, select one PDF for the concept note and another for Annex 2 E&S screening; maximum 4 MB each. Select Save document, read the warning and confirm Continue and save. Selecting a file alone does not complete the upload.",
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
      [
        "Revisión del expediente · Declaraciones · Pendientes",
        "Application review · Declarations · Outstanding items",
      ],
      ["Preparar documentos para firma", "Prepare documents for signing"],
      [
        "Descargar nota conceptual | Descargar evaluación A&S",
        "Download concept note | Download E&S screening",
      ],
      [
        "Firmar fuera del portal → Documentos firmados → Guardar documento",
        "Sign outside the portal → Signed documents → Save document",
      ],
      [
        "Anexos: SGAS automático + cargas manuales",
        "Attachments: automatic ESMS + manual uploads",
      ],
    ],
  },
  {
    id: "anexos",
    title: [
      "Paso 6 · Anexos y documentos que debe cargar",
      "Step 6 · Attachments and documents to upload",
    ],
    intro: [
      "Todos los documentos se reúnen al final, en Revisar y enviar. No se suben cartas en la ficha de organizaciones ni se exige descargar y volver a subir el PDF de Experiencia SGAS.",
      "All documents are collected at the end under Review and submit. Letters are not uploaded on partner cards, and the ESMS experience PDF does not need downloading and re-uploading.",
    ],
    steps: [
      [
        "Distinga Documentos firmados de Anexos. Compruebe que cada archivo esté en la tarjeta con el nombre correcto.",
        "Distinguish Signed documents from Attachments. Check each file is on the correctly named card.",
      ],
      [
        "En las cargas manuales, guarde primero los cambios del formulario, seleccione o arrastre un archivo, pulse Guardar anexo y espere Archivo cargado. Revise formatos, tamaño y condiciones de cada tarjeta.",
        "For manual uploads, save form changes first, select or drop a file, select Save attachment and wait for File uploaded. Check the formats, size and conditions on each card.",
      ],
      [
        "Revise que Experiencia SGAS esté vigente y que no falten el Anexo 1, cartas aplicables u otros requisitos de la convocatoria antes de enviar.",
        "Check ESMS experience is current and that Annex 1, applicable letters and other call requirements are complete before submitting.",
      ],
    ],
    rows: [
      [
        "Anexo 1. Experiencia y capacidad del proponente y socios",
        "Carga manual independiente de SGAS. Organización: resumen de experiencia y lista comentada de proyectos similares ejecutados. Persona natural: currículo. Incluya experiencia de los socios cuando corresponda. Use los formatos indicados por la tarjeta.",
        "Annex 1. Applicant and partners’ experience and capacity",
        "Manual upload separate from ESMS. Organizations: experience summary and annotated list of similar completed projects. Individuals: CV. Include partner experience where applicable. Use the formats shown on the card.",
      ],
      [
        "Anexo 2. Resultados del examen ambiental y social",
        "Se genera a partir de las actividades y evaluaciones registradas. En fase 1, descargue, firme electrónicamente y cargue el PDF en Documentos firmados, sin volver a redactar el examen.",
        "Annex 2. Environmental and social screening results",
        "Generated from registered activities and assessments. In phase 1, download, sign electronically and upload the PDF under Signed documents; do not write the screening again.",
      ],
      [
        "Anexo 3. Cartas de apoyo de socios ejecutores",
        "Una tarjeta por organización asociada, con su nombre. Cargue la carta correcta y confirme Archivo cargado. Sin socios no se exige carta. Renombrar conserva el vínculo; eliminar un socio borra su carta de borrador cuando corresponda, respetando documentos de versiones enviadas. Las cartas antiguas sin vínculo deben cargarse en la tarjeta correcta; no se reasignan automáticamente.",
        "Annex 3. Letters of support from implementing partners",
        "One named card per partner. Upload the matching letter and confirm File uploaded. No partner means no letter requirement. Renaming keeps its link; deleting a partner removes its draft letter where applicable, preserving documents of submitted versions. Re-upload unlinked older letters in the correct card; they are not reassigned automatically.",
      ],
      [
        "Experiencia SGAS",
        "Documento adicional generado e incorporado por el sistema al finalizar el paso 5. No se firma ni se carga manualmente y no sustituye el Anexo 1. Si aparece pendiente de actualización, vuelva al cuestionario y actualícelo.",
        "ESMS experience",
        "Additional document automatically generated and attached after completing step 5. No signature or manual upload is required, and it does not replace Annex 1. Return to the questionnaire and update it if marked outdated.",
      ],
      [
        "Otros documentos de la convocatoria",
        "Las tarjetas indican nombre, formatos admitidos, máximo de 4 MB y condiciones, incluida firma electrónica o notarización si la convocatoria las exige. No todos los anexos requieren firma. El GLF revisa la autenticidad de firmas y notarizaciones.",
        "Other call documents",
        "Cards show the name, accepted formats, 4 MB maximum and conditions, including electronic signature or notarization if required by the call. Not all attachments require signatures. GLF reviews signature and notarization authenticity.",
      ],
    ],
    tip: [
      "Guardar documento o Guardar anexo confirma una carga concreta; todavía debe pulsar Enviar al GLF para presentar toda la propuesta.",
      "Save document or Save attachment confirms a particular upload; Submit to GLF is still required to present the entire proposal.",
    ],
    screen: [
      [
        "Documentos firmados: Nota conceptual + Anexo 2",
        "Signed documents: Concept note + Annex 2",
      ],
      [
        "Anexos: Experiencia SGAS (automático)",
        "Attachments: ESMS experience (automatic)",
      ],
      [
        "Anexo 1 + Anexo 3 por socio + Otros requisitos",
        "Annex 1 + Annex 3 per partner + Other requirements",
      ],
      [
        "Seleccionar archivo → Guardar anexo → Archivo cargado",
        "Choose file → Save attachment → File uploaded",
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
      "El envío definitivo registra la versión presentada. Antes de Enviar al GLF, compruebe la información, presupuesto, evaluaciones, declaraciones, dos PDF firmados vigentes, Experiencia SGAS anexada, Anexo 1 y cartas u otros anexos aplicables.",
      "Final submission records the submitted version. Before Submit to GLF, check information, budget, assessments, declarations, two current signed PDFs, attached ESMS experience, Annex 1 and applicable letters or other attachments.",
    ],
    steps: [
      [
        "Compruebe que cada documento esté vigente y cargado, incluidos SGAS y los anexos manuales aplicables. Pulse Enviar al GLF una sola vez y espere la respuesta.",
        "Check each document is current and uploaded, including ESMS and applicable manual attachments. Select Submit to GLF once and wait for the response.",
      ],
      [
        "Confirme que el estado cambió a Enviada al GLF y que aparece la fecha del envío. Descargue el comprobante de recepción.",
        "Confirm the status changed to Submitted to GLF and the submission date appears. Download the receipt.",
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
        "Enviada al GLF / Versión presentada",
        "Indica que existe un envío registrado. El comprobante acredita recepción; no selección ni aprobación del financiamiento.",
        "Submitted to GLF / Submitted version",
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
        "Enviada al GLF · fecha y hora Galápagos",
        "Submitted to GLF · Galápagos date and time",
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
        "En revisión por GLF / No seleccionada",
        "Son estados distintos de Enviada al GLF. Consulte el registro del expediente; no infiera una decisión solo por haber enviado.",
        "Under review by GLF / Not selected",
        "These differ from Submitted to GLF. Check the dossier record; do not infer a decision merely from submission.",
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
      "Las versiones presentadas y los documentos preparados anteriormente conservan su contenido. Una invitación a fase 2 no convierte el presupuesto resumido en un presupuesto anual detallado ni equivale a financiamiento aprobado.",
      "Submitted versions and previously prepared documents retain their content. A phase-two invitation neither converts the summary budget into a detailed annual budget nor means funding approval.",
    ],
    screen: [
      [
        "Mis postulaciones → Abrir expediente",
        "My applications → Open dossier",
      ],
      [
        "Enviada al GLF → En revisión por GLF → Decisión GLF",
        "Submitted to GLF → Under review by GLF → GLF decision",
      ],
      [
        "Si hay invitación: Fase 2 · Propuesta completa",
        "If invited: Phase 2 · Full proposal",
      ],
      ["Aprobación ≠ Convenio firmado", "Approval ≠ Signed agreement"],
    ],
  },
  {
    id: "fase-dos",
    title: [
      "Fase 2 · Preparar la propuesta completa",
      "Phase 2 · Prepare the full proposal",
    ],
    intro: [
      "Solo quienes reciban una invitación del GLF pueden completar esta etapa dentro del plazo habilitado. La información de la nota conceptual se reutiliza, pero aparecen más detalles y campos oficiales de la convocatoria.",
      "Only applicants invited by GLF can complete this stage within the enabled deadline. Concept note information is reused, with additional details and official call fields.",
    ],
    steps: [
      [
        "Entre desde Mis postulaciones al expediente habilitado. Revise la fase y su plazo; no cree otra nota conceptual para sustituirlo.",
        "Open the enabled dossier from My applications. Check its phase and deadline; do not create another concept note to replace it.",
      ],
      [
        "Complete Proyecto completo, detalle anual de Presupuesto y evaluación completa de riesgos y PGAS. Revise todos los vínculos y los mensajes de campos obligatorios.",
        "Complete Full proposal, annual Budget detail and Full risk assessment and ESMP. Review links and required-field messages.",
      ],
      [
        "En Revisar y enviar, guarde, pulse Preparar documentos y revise Descargar propuesta completa y Descargar evaluación A&S. Cargue los anexos que muestre esta convocatoria y envíe solo cuando esté completo.",
        "Under Review and submit, save, select Prepare documents and check Download full proposal and Download E&S screening. Upload the attachments required by this call and submit only when complete.",
      ],
    ],
    rows: [
      [
        "Resultados e indicadores de impacto",
        "En las fichas vinculadas a los objetivos, complete indicador de impacto, meta propuesta no negativa, unidad de medida y evidencia prevista. Para porcentaje la meta debe estar entre 0 y 100; si elige Otra unidad, descríbala. Se mantienen los resultados y vínculos de origen.",
        "Outcomes and impact indicators",
        "Complete impact indicator, non-negative proposed target, unit and expected evidence in objective-linked cards. Percentage targets must be between 0 and 100; describe Other units. Original outcomes and links are retained.",
      ],
      [
        "Campos oficiales de la convocatoria",
        "Complete los apartados habilitados: el asterisco distingue los obligatorios. PGAS es Plan de Gestión Ambiental y Social; PPPI, Plan de Participación de las Partes Interesadas; MGQ, Mecanismo de Gestión de Quejas. No todas las convocatorias habilitan los mismos instrumentos.",
        "Official call fields",
        "Complete enabled sections; asterisks identify required fields. ESMP means Environmental and Social Management Plan, SEP means Stakeholder Engagement Plan, and GRM means Grievance Redress Mechanism. Calls may enable different instruments.",
      ],
      [
        "Presupuesto anual GLF y Otros",
        "Prepare partidas por año, categoría y descripción, separando GLF y Otros. Los años deben corresponder a la duración del proyecto, hasta tres. Una vez que hay partidas, sus sumas actualizan los importes generales; el resumen de fase 1 se conserva como referencia y no se distribuye automáticamente.",
        "Annual GLF and Other budget",
        "Create lines by year, category and description, separating GLF and Other funding. Years must match the project duration, up to three. Once lines exist, their sums update general amounts; the phase-one summary is retained as reference, without automatic allocation.",
      ],
      [
        "Clasificación de remuneraciones",
        "Indique si cada partida incluye remuneraciones, honorarios o salarios; divida las partidas mixtas para clasificarlas. No deje importes con clasificación pendiente. El control de remuneraciones usa el 30 % del monto GLF; revise la ayuda de administración aplicable a la convocatoria.",
        "Remuneration classification",
        "Indicate whether each line includes remuneration, fees or salaries; split mixed lines for classification. Do not leave funded lines unclassified. The remuneration check uses 30% of GLF funding; review the applicable call’s administration guidance.",
      ],
      [
        "Salvaguardas y riesgo residual",
        "Para cada riesgo, proponga medidas o seleccione del catálogo disponible y complete probabilidad y gravedad residuales, ubicación, costo, responsable, trimestres inicial/final y observaciones cuando proceda. Las propuestas no sustituyen su validación por GLF.",
        "Safeguards and residual risk",
        "For each risk, propose measures or choose from the available catalogue and complete residual probability and severity, location, cost, responsible person, start/end quarters and observations where applicable. Proposals remain subject to GLF validation.",
      ],
      [
        "Experiencia SGAS de la nota conceptual",
        "En el paso 5 se consulta como referencia lo declarado en la nota conceptual; no se exige un cuestionario nuevo de fase 2. Los documentos de esa fase siguen en el historial.",
        "Concept-note ESMS experience",
        "Step 5 shows the concept-note declaration for reference; a new phase-two questionnaire is not required. Documents from that phase remain in history.",
      ],
      [
        "Documentos de fase 2",
        "Prepare y consulte los documentos de esta fase y respete los formatos y condiciones de sus tarjetas de anexos. No suponga que todos son las mismas cargas ni que tienen idéntico requisito de firma que en fase 1.",
        "Phase-two documents",
        "Prepare and view this phase’s documents and follow attachment-card formats and conditions. Do not assume they are the same uploads or have identical signing requirements to phase 1.",
      ],
    ],
    tip: [
      "Los requisitos efectivos son los que muestra el expediente de la convocatoria habilitada. El portal organiza y valida la completitud; la revisión técnica y la aprobación corresponden al GLF.",
      "The effective requirements are those displayed in the enabled call dossier. The portal organizes and checks completeness; GLF performs technical review and approval.",
    ],
    screen: [
      ["Invitación GLF → Proyecto completo", "GLF invitation → Full proposal"],
      [
        "Resultados detallados + Campos oficiales",
        "Detailed outcomes + Official fields",
      ],
      [
        "Presupuesto anual GLF / Otros + PGAS",
        "Annual GLF / Other budget + ESMP",
      ],
      [
        "Preparar documentos → Revisar anexos → Enviar",
        "Prepare documents → Check attachments → Submit",
      ],
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
        "Objetivo, actividad, resultado o indicador eliminado",
        "Revise las referencias en actividades, resultados, presupuesto, screening, seguimiento y sostenibilidad. Las fichas que pierden un vínculo no se trasladan automáticamente a otro elemento; elija una referencia válida o elimine la ficha con confirmación si corresponde.",
        "Objective, activity, outcome or indicator deleted",
        "Review references in activities, outcomes, budget, screening, monitoring and sustainability. Cards with missing links are not automatically moved to another item; select a valid reference or confirm removal of the card where appropriate.",
      ],
      [
        "No se prepara el PDF",
        "Revise el listado de pendientes, límites de texto, fechas, montos y declaraciones; luego vuelva a preparar.",
        "PDF preparation fails",
        "Review outstanding items, text limits, dates, amounts and declarations; then prepare again.",
      ],
      [
        "Archivo rechazado",
        "Revise la tarjeta: formato admitido, máximo 4 MB y firma solo si se exige. Los documentos firmados de fase 1 deben ser PDF con firma electrónica; otros anexos pueden admitir formatos distintos. Seleccione un archivo válido y guárdelo de nuevo.",
        "File rejected",
        "Check the card: accepted format, 4 MB maximum and signature only when required. Phase-one signed documents must be electronically signed PDFs; other attachments may accept different formats. Select a valid file and save it again.",
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
      [
        "El presupuesto no coincide",
        "Revise el total GLF + cofinanciamiento de Información general y distribúyalo entre las actividades. Compruebe administración (10 % del total), remuneraciones (30 % del GLF) e importes de actividades eliminadas. No añada nuevamente los componentes ya incluidos.",
        "Budget mismatch",
        "Check GLF funding + cofinancing in General information and allocate it across activities. Check administration (10% of total), remuneration (30% of GLF) and amounts from deleted activities. Do not add included components again.",
      ],
      [
        "SGAS pendiente o anexo desactualizado",
        "Complete las respuestas aplicables del paso 5 y pulse Finalizar y anexar o Actualizar anexo. Si falla, espere el resultado, conserve el borrador y reintente; la confirmación de incorporación es distinta de la confirmación de envío al GLF.",
        "ESMS pending or outdated attachment",
        "Complete applicable answers in step 5 and select Complete and attach or Update attachment. On failure, wait for the result, keep the draft and retry; attachment confirmation differs from confirmation of submission to GLF.",
      ],
      [
        "Importe o cofinanciamiento no válido",
        "Revise el formato decimal y la categoría por separado. Pequeña permite cofinanciamiento 0; mediana y grande deben cumplir el mínimo calculado respecto del monto GLF. Un valor superior al rango de la categoría no se corrige agregando decimales.",
        "Invalid amount or cofinancing",
        "Check decimal format and category separately. Small allows cofinancing of 0; medium and large must meet the calculated minimum based on GLF funding. Adding decimal places does not fix an amount outside the category range.",
      ],
    ],
    tip: [
      "Antes de enviar: información completa; presupuesto coherente; riesgos evaluados; declaraciones aceptadas; dos PDF vigentes firmados y cargados; Experiencia SGAS anexada; Anexo 1, cartas y otros requisitos aplicables cargados.",
      "Before submitting: complete information; consistent budget; assessed risks; accepted declarations; two current signed PDFs uploaded; ESMS experience attached; Annex 1, letters and other applicable requirements uploaded.",
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
