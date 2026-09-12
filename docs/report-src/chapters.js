/* Chapters One to Three of the SAPTS project report. */
const path = require("path");
const B = require("./build_report");
const { body, chapterHeading, h2, h3, bullet, numItem, figure, table, blank, DIAG, SHOTS } = B;

/* ============================ CHAPTER ONE ============================ */
const chapterOne = [
  ...chapterHeading("ONE", "Introduction"),

  h2("1.1 Background to Study"),
  body(
    "The contemporary academic environment at institutions such as Ghana Communication Technology " +
    "University (GCTU) presents students with challenges that extend well beyond the comprehension of " +
    "course content. In an era characterised by information abundance and by competing demands on " +
    "student attention, effective self-management has emerged as a decisive determinant of academic " +
    "success. The digital transformation of education has, paradoxically, both simplified and " +
    "complicated the student experience: technology provides unprecedented access to learning resources, " +
    "yet it also fragments attention and produces an information load that undermines systematic " +
    "academic tracking.",
  ),
  body(
    "Traditional methods of academic self-regulation prove increasingly inadequate against modular " +
    "course structures and continuous assessment. Manual grade calculations in physical notebooks, " +
    "mental tallies of study hours and disjointed goal-setting across different platforms lack " +
    "integration, forcing students to maintain several disconnected records that never combine into a " +
    "single view of academic standing. The cognitive effort required to reconcile information drawn from " +
    "such disparate sources leads predictably to oversight, miscalculation and reactive rather than " +
    "proactive management of the semester.",
  ),
  body(
    "The pedagogical shift towards student-centred learning places a correspondingly greater " +
    "responsibility on the learner to monitor personal progress. Zimmerman (2002) demonstrated that " +
    "metacognitive awareness, the capacity to reflect upon one's own learning process, correlates " +
    "strongly with academic achievement, and Zimmerman and Schunk (2011) established that this capacity " +
    "is developed rather than innate. Most students, however, lack the structural tools with which to " +
    "develop that awareness systematically. A clear opportunity therefore exists for a technological " +
    "intervention that bridges educational theory and daily practice.",
  ),
  body(
    "Within GCTU's specific context as a technology-focused institution, a digital progress tracker " +
    "represents more than a convenience: it is the practical application of the university's own core " +
    "competencies to a problem experienced by its own students. By employing modern web technologies " +
    "such as responsive layout, client-side data persistence and interactive visualisation, this project " +
    "sets out to transform academic self-management from a burdensome clerical chore into an insightful " +
    "and motivating process.",
  ),

  h2("1.2 Statement of the Problem"),
  body(
    "The central problem addressed by this project is the systematic inefficiency of academic " +
    "self-monitoring among university students, an inefficiency that produces suboptimal performance, " +
    "avoidable stress and missed opportunities for timely correction. The problem manifests along four " +
    "interconnected dimensions.",
  ),
  body(
    "First, students operate within fragmented data ecosystems. Grades reside on portals or in electronic " +
    "mail, deadlines in calendar applications, notes in physical books or scattered files, and personal " +
    "targets in memory. Reconciling these sources imposes a cognitive overhead heavy enough that many " +
    "students abandon systematic tracking altogether and fall back on intuition, which is unreliable for " +
    "academic planning.",
  ),
  body(
    "Second, in the absence of visualised progress metrics, students struggle to form an accurate " +
    "picture of where they stand. Progress evaluated through isolated numerical marks alone conceals " +
    "trends, obscures patterns of strength and weakness, and hides incremental improvement. Students " +
    "consequently misjudge their position within a course, becoming complacent when they are behind or " +
    "anxious when they are in fact performing adequately.",
  ),
  body(
    "Third, a temporal disconnect separates effort from outcome. Students may invest substantial hours " +
    "in study without ever relating that investment to a specific result. Without a means of logging " +
    "study sessions against particular courses, no return-on-investment analysis of study strategy is " +
    "possible, and ineffective methods persist unchallenged from one semester to the next.",
  ),
  body(
    "Fourth, the absence of structured goal-setting and milestone tracking denies students the " +
    "motivational benefit of perceived progress. Where larger objectives are never broken into " +
    "manageable tasks, the academic year is experienced as an undifferentiated marathon rather than a " +
    "series of achievable stages, raising the likelihood of disengagement.",
  ),
  body(
    "Generic productivity tools do not resolve these difficulties because they lack domain-specific " +
    "design. They require the student to adapt a general instrument to an academic purpose, adding " +
    "configuration burden while still failing to supply integrated academic intelligence such as " +
    "weighted grade projection. This project therefore addresses a clear and identifiable gap: the need " +
    "for a purpose-built system that consolidates academic tracking, visualises progress meaningfully, " +
    "connects effort to outcome, and structures goal achievement for the university learning context.",
  ),

  h2("1.3 Aim and Objectives"),
  body(
    "The aim of this project is to design, develop and evaluate a web-based Student Academic Progress " +
    "Tracking System in which each student holds an account, enabling them to monitor, understand and " +
    "improve their academic performance from a single integrated interface, deployed on the Apache and " +
    "MySQL services supplied by XAMPP.",
  ),
  body("In pursuit of this aim, the following specific objectives were set:", { noIndent: true }),
  numItem("To analyse the academic tracking needs of university students through a review of the relevant literature, interviews with students and lecturers, and an examination of the tools currently in use."),
  numItem("To design an intuitive and responsive user interface that minimises cognitive load while surfacing the information a student most needs to act upon."),
  numItem("To develop the core functional modules of the system, namely course management, assessment and grade recording, study session logging, revision through flashcards, document storage, and goal and task tracking."),
  numItem("To implement a relational data layer in MySQL, with account-based access control, so that each student's academic records persist across sessions and devices and remain unreadable to every other student."),
  numItem("To provide an enrolment mechanism by which an administrator registers students, issues credentials and manages accounts, and to deploy the completed system on the Apache and MySQL services provided by XAMPP."),
  numItem("To test the system for functional correctness, usability and performance, and to evaluate the outcome against each of the objectives stated above."),

  h2("1.4 Significance of the Study"),
  body(
    "The significance of this study is both practical and academic. Practically, it delivers a working " +
    "instrument that a department may deploy on one machine at no cost and without an internet " +
    "connection, addressing a need that the researchers themselves experienced throughout their " +
    "programme. Because the installation is entirely local, academic records never leave the " +
    "institution's own hardware, which avoids the privacy exposure that accompanies cloud-hosted " +
    "student data.",
  ),
  body(
    "Academically, the study contributes a concrete demonstration that the principles of self-regulated " +
    "learning described by Zimmerman (2002) can be operationalised in software: each of the three phases " +
    "of the cycle is represented by a specific module of the system, and the report traces that mapping " +
    "explicitly. The project further demonstrates that a complete multi-user information system, with " +
    "authentication, role-based authorisation and a normalised relational store, can be delivered on the " +
    "free and widely available XAMPP stack, which is a result of interest to institutions working under " +
    "constrained infrastructure.",
  ),
  body(
    "For the Faculty, the work provides a documented reference implementation of a locally hosted, " +
    "multi-user academic application, together with the analysis, design models and testing evidence that " +
    "accompany it, and may therefore serve as a template for subsequent student projects of a similar nature.",
  ),

  h2("1.5 Scope of the Study"),
  body(
    "The boundaries of this project were drawn deliberately, so that a complete and dependable system " +
    "could be delivered within the time available while leaving clear room for later expansion.",
  ),
  body("The following fall within the scope of the project:", { noIndent: true }),
  bullet("A web application built with HTML5, CSS3 and vanilla JavaScript on the client and PHP on the server, with Chart.js as the only external library, hosted on the Apache and MySQL components of XAMPP."),
  bullet("Eight integrated functional modules for the student: dashboard, course management, grades and grade point average analysis, study tracking, flashcards, document vault, goals and tasks, and settings; together with an enrolment console for the administrator."),
  bullet("Account management: sign-in, administrator enrolment with temporary credentials, a forced first-password change, password reset, and the deactivation or removal of accounts."),
  bullet("A relational data layer in MySQL holding accounts and academic records, with validation, transactional writes, error handling and backup export and import in JSON format."),
  bullet("A responsive interface that adapts to desktop, tablet and mobile displays, with both a light and a dark theme."),
  bullet("Functional, usability and performance testing with a representative sample of students, and complete project documentation."),
  body("The following are excluded from the scope of the project:", { noIndent: true }),
  bullet("Deployment beyond a single machine: the system is installed on one computer and reached at the local host. Hosting it on the institutional network, or over the public internet, would require certificates, hardening and administration that fall outside this project."),
  bullet("Integration with institutional systems: no direct connection is made to the university's learning management system or student information system, and all data is entered manually."),
  bullet("Collaborative or social features such as sharing progress with peers, comparison against class averages, or interaction with lecturers."),
  bullet("Predictive analytics driven by machine learning; only deterministic projection from weighted averages is implemented."),
  bullet("Support for legacy browsers. The system targets current versions of Chrome, Edge, Firefox and Safari with full support for ES6 and CSS Grid."),

  h2("1.6 Organization of the Study"),
  body(
    "This report follows the structure prescribed by the Faculty of Computing and Information Systems " +
    "for final-year undergraduate projects, and its five chapters mirror the system development " +
    "lifecycle.",
  ),
  body(
    "Chapter One, the present chapter, introduces the study. It establishes the background, states the " +
    "problem, sets out the aim and objectives, explains the significance and scope of the work, and " +
    "describes the organisation of the report.",
  ),
  body(
    "Chapter Two reviews the relevant literature. It examines scholarship on student information " +
    "systems and academic performance tracking, presents the theoretical framework of self-regulated " +
    "learning upon which the design rests, analyses previous studies and related systems, and identifies " +
    "the research gap that the project addresses.",
  ),
  body(
    "Chapter Three covers system specification and design. It sets out the research methodology and the " +
    "development model adopted, documents the requirements analysis, stakeholder analysis, functional " +
    "and non-functional requirements and use cases, and then presents the architectural design, data " +
    "design, interface design and security considerations of the system.",
  ),
  body(
    "Chapter Four reports the implementation of the system. It describes the programming languages and " +
    "tools used, explains how the principal modules were constructed and deployed under XAMPP, and " +
    "presents the testing and quality assurance activities together with their results.",
  ),
  body(
    "Chapter Five concludes the report. It discusses the completed system in comparison with existing " +
    "solutions, records the challenges encountered and the lessons drawn from them, states the " +
    "contribution of the work, and makes recommendations for future development.",
  ),

  h2("1.7 Conclusion"),
  body(
    "This chapter has established that university students lack an integrated means of monitoring their " +
    "academic progress, and that the fragmented tools presently in use fail them along four specific " +
    "dimensions: dispersed data, absent visualisation, an unmeasured relationship between effort and " +
    "outcome, and unstructured goal-setting. The aim and six objectives set out in section 1.3 define " +
    "the response to that problem, and the scope stated in section 1.5 bounds it to what can be " +
    "delivered and defended. The chapter that follows examines the body of literature and the existing " +
    "systems against which this response must be justified.",
  ),
];

/* ============================ CHAPTER TWO ============================ */
const chapterTwo = [
  ...chapterHeading("TWO", "Literature Review"),

  h2("2.1 Overview of Relevant Literature"),
  body(
    "This chapter examines the theoretical foundations, the existing solutions and the technological " +
    "frameworks that bear upon academic progress tracking. The purpose of the review is to establish " +
    "what is already known, what tools are already available, and which gaps remain open and therefore " +
    "justify the development of the proposed system.",
  ),

  h3("2.1.1 Student Information Systems"),
  body(
    "Student Information Systems are computer-based platforms used by educational institutions to " +
    "manage student data, including academic records, attendance registers, fee accounts and personal " +
    "information. Bharamagoudar, Geeta and Totad (2013) describe the migration of such systems onto the " +
    "web as a decisive improvement in the accessibility and accuracy of institutional records, since a " +
    "single authoritative store replaces the duplicated ledgers that preceded it. Ellis (2009) draws the " +
    "related distinction between a student information system, which is administrative in purpose, and a " +
    "learning management system, which is instructional; both are institution-facing.",
  ),
  body(
    "That orientation is precisely the limitation relevant to this project. Institutional systems are " +
    "designed to serve the registry rather than the learner. They publish a final mark once an " +
    "assessment has been ratified, but they do not help a student to reason about a mark before it is " +
    "earned, to project the result of a pending examination, or to relate a disappointing score to the " +
    "hours that preceded it. Sarker, Davis and Tiropanis (2010), reviewing how higher education " +
    "institutions use student data, observe that the overwhelming majority of that use is " +
    "administrative and that comparatively little of it is returned to students in a form they can act upon.",
  ),

  h3("2.1.2 Academic Performance Tracking"),
  body(
    "Academic performance tracking is the continuous assessment and evaluation of learning outcomes for " +
    "the purpose of identifying strengths and weaknesses while there is still time to act. Black and " +
    "Wiliam (1998), in their influential review of formative assessment, established that frequent " +
    "low-stakes feedback produces learning gains substantially larger than those obtained from summative " +
    "examination alone. Hattie and Timperley (2007) refined this finding, showing that feedback is most " +
    "effective when it addresses the gap between current performance and a defined goal, and least " +
    "effective when it consists of a bare grade.",
  ),
  body(
    "The implication for system design is direct. A tracker that reports only a mark reproduces the " +
    "least effective form of feedback. A tracker that situates that mark against a target, a trend and " +
    "a record of effort supplies the three elements Hattie and Timperley identify as necessary, namely " +
    "where the learner is going, how the learner is progressing, and what should be done next. Siemens " +
    "and Long (2011) extend the same logic to learning analytics, arguing that the value of educational " +
    "data lies in its timely return to the learner rather than in its accumulation.",
  ),

  h2("2.2 Theoretical Framework"),
  body(
    "The system rests upon the theory of Self-Regulated Learning developed by Zimmerman (2002), which " +
    "models effective learning as a cycle of three phases. The design of the system maps each phase onto " +
    "a specific group of features, and this mapping is the principal justification for the module " +
    "structure presented in Chapter Three.",
  ),
  body(
    "In the forethought phase the learner analyses the task, sets goals and plans a strategy. The " +
    "system supports this phase through its goals and tasks module, in which academic objectives are " +
    "recorded with due dates and priorities, and through course management, in which the assessment " +
    "structure of each course is declared in advance so that the weight of what is coming is visible " +
    "before it arrives.",
  ),
  body(
    "In the performance phase the learner executes the plan while monitoring attention and progress. " +
    "The system supports this phase through the study tracker, which times focused work using the " +
    "interval technique described by Cirillo (2018) and logs each completed session against a course, " +
    "and through the flashcard module, which applies the retrieval practice shown by Roediger and " +
    "Karpicke (2006) to produce durable retention superior to repeated re-reading.",
  ),
  body(
    "In the reflection phase the learner evaluates the outcome and attributes it to a cause. The system " +
    "supports this phase through grade analysis and the dashboard, which display the weighted average " +
    "and grade point average, the distribution of letter grades and the relationship between weekly " +
    "study hours and performance, so that attribution rests on recorded evidence rather than on " +
    "recollection.",
  ),
  body(
    "Two further bodies of theory inform the design. Pintrich (2004) supplies the framework by which " +
    "motivation and self-regulation are assessed jointly, supporting the decision to display progress " +
    "towards a weekly study goal alongside academic results. Dunlosky and colleagues (2013), in their " +
    "systematic evaluation of learning techniques, rank distributed practice and practice testing as the " +
    "two most effective strategies available to students, and both are directly represented in the " +
    "system's study and flashcard modules.",
  ),

  h2("2.3 Previous Studies and Related Works"),
  body(
    "Five categories of existing solution were examined. Each was assessed against four criteria drawn " +
    "from the problem statement: integration of academic functions, visualisation connecting effort to " +
    "outcome, academic specificity, and accessibility in terms of cost and connectivity.",
  ),

  h3("2.3.1 MyStudyLife"),
  body(
    "MyStudyLife is a cross-platform student planner offering timetable management, homework tracking " +
    "and examination reminders. Its scheduling model is genuinely academic, which distinguishes it from " +
    "general planners, and synchronisation across devices is handled well. It nevertheless stops at " +
    "scheduling: the application records that an assessment exists and when it is due, but not what was " +
    "scored, and it therefore offers neither weighted grade computation nor any analysis of performance " +
    "over time. It also requires an account and a network connection for its principal features.",
  ),

  h3("2.3.2 Todoist and general productivity tools"),
  body(
    "Todoist, and comparable task managers such as Microsoft To Do and Notion, provide mature task " +
    "capture, recurring reminders and project hierarchies. They are, however, domain-neutral by design. " +
    "A student wishing to track a course must first construct an academic structure out of generic " +
    "projects and labels, and even then the tool has no concept of credit hours, assessment weighting or " +
    "grade points, so no academic calculation can be performed. The configuration burden falls entirely " +
    "on the student, and the analytical benefit remains unavailable.",
  ),

  h3("2.3.3 Grade calculator applications"),
  body(
    "A large class of web and mobile grade calculators performs exactly one function: given a set of " +
    "component marks and their weights, it returns a course average or the mark required in a final " +
    "examination. These tools are academically specific and computationally correct, and many are free. " +
    "Their limitation is that they are stateless. Figures are typed in, a result is read off, and " +
    "nothing is retained, so no history accumulates, no trend can be observed, and the calculation must " +
    "be repeated in full whenever a new mark is received.",
  ),

  h3("2.3.4 Institutional learning management and student information systems"),
  body(
    "Platforms such as Moodle, Blackboard and the portals operated by individual universities hold " +
    "authoritative records and are the natural source of truth for a student's marks. As established in " +
    "section 2.1.1, however, their orientation is administrative. Marks appear only after ratification, " +
    "the presentation is tabular rather than analytical, study effort is not represented at all, and the " +
    "student has no ability to model a hypothetical outcome. Access additionally depends on institutional " +
    "credentials and on network availability, both of which fail at inconvenient moments.",
  ),

  h3("2.3.5 Learning analytics dashboards"),
  body(
    "Course Signals, developed at Purdue University and reported by Arnold and Pistilli (2012), is the " +
    "best-documented example of a learning analytics dashboard that returns predictive information to " +
    "students, using a traffic-light indicator to signal risk of failure. Reported improvements in " +
    "retention were substantial. Such systems demonstrate the value of returning analysis to the learner, " +
    "but they are institutional deployments requiring integration with enrolment and activity data, " +
    "significant infrastructure and institutional consent. They are not available to an individual " +
    "student, and no equivalent exists at GCTU.",
  ),

  h2("2.4 Summary of Literature Review"),
  body(
    "The literature establishes a consistent case for computerised academic tracking. The benefits " +
    "reported across the studies reviewed above are improved accuracy of data, since calculation is " +
    "performed rather than remembered; faster generation of reports and summaries; secure and durable " +
    "storage of records; and convenient access to a complete academic history. Where visualisation " +
    "accompanies these benefits, the literature further reports gains in motivation and in metacognitive " +
    "awareness, because a trend that is seen is understood more readily than a column of figures.",
  ),
  body(
    "The review of related systems, however, identifies three deficiencies that persist across every " +
    "category examined. The first is a lack of integration: scheduling, grade calculation, effort " +
    "logging and revision are each served by a different tool, and students must therefore operate " +
    "several applications that do not communicate, which reproduces at the level of software the " +
    "fragmentation described in section 1.2. The second is the absence of visualisation connecting " +
    "effort to outcome: no tool examined records study time and academic results in the same data set, " +
    "so no tool can display the relationship between them. The third is a lack of simple, free and " +
    "academically specific design: the tools that are academically specific are narrow, and the tools " +
    "that are broad are not academically specific.",
  ),
  body(
    "The research gap follows directly from these findings. No existing tool combines client-side " +
    "privacy, zero-cost accessibility that does not depend on a network connection, an academically " +
    "specific workflow encompassing credit hours and weighted assessment, and comprehensive visual " +
    "analytics, within a single integrated system. It is this combination that the present project sets " +
    "out to provide.",
  ),

  h2("2.5 Conclusion"),
  body(
    "This chapter has reviewed the literature on student information systems and academic performance " +
    "tracking, established self-regulated learning as the theoretical framework for the design, and " +
    "assessed five categories of existing system against the criteria derived from the problem " +
    "statement. The review demonstrates that the proposed system is theoretically grounded in an " +
    "established model of learning, that it is technologically justified by the capabilities of the " +
    "modern browser, and that it is practically necessary because the gap it addresses remains open. " +
    "The chapter that follows translates this justification into a specification and a design.",
  ),
];

/* =========================== CHAPTER THREE =========================== */
const chapterThree = [
  ...chapterHeading("THREE", "System Specification and Design"),

  h2("3.1 Methodology"),
  body(
    "This section sets out the research design adopted for the project, the methods by which " +
    "requirements were gathered, and the software development model that governed the sequence of work.",
  ),

  h3("3.1.1 Research Design"),
  body(
    "The project adopts a system development research design. Rather than testing a hypothesis by " +
    "experiment, the study answers its research question by constructing an artefact and evaluating it " +
    "against stated requirements. The design proceeds through analysis, specification, construction and " +
    "evaluation, and the evidence offered for the claims made in Chapter Five is the measured behaviour " +
    "of the completed system.",
  ),

  h3("3.1.2 Data Collection Methods"),
  body("Three methods were used to gather the information from which the requirements were derived:", { noIndent: true }),
  bullet("Interviews. Semi-structured interviews were conducted with students across several levels of study and with lecturers responsible for continuous assessment, in order to establish how marks are currently recorded, what students find difficult to determine about their own standing, and which calculations they perform by hand."),
  bullet("Observation. The record-keeping practices actually in use were observed directly, including notebooks, spreadsheet files and calculator applications, so that the description of the existing arrangement rests on what students do rather than on what they report doing."),
  bullet("Review of existing systems and records. The tools examined in section 2.3 were used in practice, and published academic records and assessment structures were reviewed, to establish the data a system of this kind must hold and the calculations it must perform."),
  body(
    "The findings from these three sources were consolidated into the requirements presented in " +
    "section 3.2, and any requirement supported by only one source was verified against the others " +
    "before it was accepted.",
  ),

  h3("3.1.3 System Development Model"),
  body(
    "The Waterfall model, first described by Royce (1970) and treated as a standard reference model by " +
    "Sommerville (2016), was selected to govern the development. The choice was made on three grounds. " +
    "The requirements of the system were well understood at the outset and were not expected to change " +
    "materially, which is the condition under which a sequential model performs well. The project " +
    "operated to a fixed academic timetable with defined deliverables, which a phase-based model " +
    "supports directly. And the documentation produced at the end of each phase corresponds to the " +
    "structure required of this report.",
  ),
  body(
    "The five phases were applied as shown in Figure 3.1. Requirements analysis produced the " +
    "specification in section 3.2; system design produced the models in section 3.3; implementation " +
    "produced the working application and its deployment under XAMPP; testing verified the result " +
    "against the frozen requirements; and deployment and maintenance covered installation, user " +
    "documentation and corrective work arising from testing.",
  ),
  ...figure(path.join(DIAG, "waterfall.png"), 452, 261, "Figure 3.1: The Waterfall model as applied to the project"),

  h3("3.1.4 Tools and Technologies"),
  body(
    "The technologies listed in Table 3.6 were selected against three criteria: that they impose no " +
    "licensing cost on the institution, that they are supported by every current browser without a " +
    "plug-in, and that they can be demonstrated on a single machine without an internet connection. " +
    "Apache, MySQL, PHP and phpMyAdmin are obtained together in the XAMPP distribution, which is why that " +
    "distribution was chosen as the deployment platform: one installer supplies the whole stack.",
  ),
  ...table(
    "Table 3.6: Development tools and technologies",
    ["Category", "Technology", "Purpose in the project"],
    [
      ["Markup and styling", "HTML5, CSS3", "Document structure and the responsive presentation layer, laid out with Grid and Flexbox"],
      ["Client programming", "JavaScript (ES6+)", "Routing, grade computation, the study timer and the interface"],
      ["Server programming", "PHP 8 with PDO", "Authentication, session and CSRF control, input validation and every write to the database"],
      ["Visualisation", "Chart.js", "The bar, line and doughnut charts on the dashboard and grade analysis pages"],
      ["Web server", "Apache 2.4 (XAMPP)", "Serves the application at http://localhost/sapts/, runs the PHP and applies the .htaccess configuration"],
      ["Database", "MySQL / MariaDB (XAMPP)", "The authoritative store: accounts with hashed passwords, and every academic record"],
      ["Client cache", "Web Storage API, IndexedDB", "Holds the signed-in student's rows so the interface stays responsive between writes"],
      ["Database administration", "phpMyAdmin (XAMPP)", "Importing the schema and inspecting the stored data directly"],
      ["Development environment", "Visual Studio Code", "Editing, integrated terminal and debugging"],
      ["Version control", "Git and GitHub", "Change history and the repository required by the Faculty"],
      ["Testing", "Chrome, Edge and Firefox developer tools", "Functional, responsive and performance testing across target browsers"],
    ],
    [1900, 2300, 4021],
  ),

  h2("3.2 System Specification"),

  h3("3.2.1 Analysis of Requirements"),
  body(
    "Analysis of the material gathered by the methods described above produced a consistent account of " +
    "the existing arrangement. Students maintain course details in one place, marks in another and study " +
    "intentions in a third; averages are computed by hand when they are computed at all; credit-weighted " +
    "grade point averages are typically estimated rather than calculated; and study time is not recorded " +
    "in any systematic form. No participant was able to state, without recalculation, the current " +
    "weighted standing in a named course.",
  ),
  body(
    "From this account the required capabilities of the system follow. The system must hold courses " +
    "with their credit hours, hold assessments with their weights and scores, calculate weighted " +
    "averages and the grade point average automatically, record study sessions against courses, allow " +
    "goals and tasks to be tracked to completion, present the resulting data visually, and retain " +
    "everything across browser sessions without a server. These capabilities are stated formally in " +
    "the two sections that follow.",
  ),

  h3("3.2.2 Stakeholder Analysis"),
  body(
    "Four groups hold an interest in the system. Their concerns, and the way the design responds to " +
    "each, are summarised in Table 3.1.",
  ),
  ...table(
    "Table 3.1: Stakeholder analysis",
    ["Stakeholder", "Interest in the system", "How the design responds"],
    [
      ["Student (primary user)", "An accurate, immediate view of academic standing; a record of effort; timely warning of what is due; assurance that nobody else can read it", "All eight modules; the dashboard aggregates standing, effort and outstanding work on one screen; records are reachable only through the student's own account"],
      ["Administrator (secondary user)", "A means of registering students and managing their access without handling their academic data", "The enrolment console issues and resets credentials and activates or removes accounts, but exposes no student's marks"],
      ["Lecturer", "Students who arrive at consultation with an informed account of their own performance", "Grade analysis and per-course status provide evidence a student can bring to a consultation"],
      ["Faculty / Department", "A demonstrable final-year artefact; no burden on institutional infrastructure", "The system is self-contained and runs on a local Apache server with no institutional integration"],
      ["Project team", "A system deliverable within the academic timetable and defensible on technical grounds", "Scope bounded as in section 1.5; a documented three-tier architecture"],
    ],
    [1900, 3100, 3221],
  ),

  h3("3.2.3 Functional Requirements"),
  body(
    "The functional requirements state what the system does. Each is identified so that the testing " +
    "reported in Chapter Four may be traced back to it.",
  ),
  ...table(
    "Table 3.2: Functional requirements of the system",
    ["ID", "Requirement", "Description"],
    [
      ["FR1", "Authenticate users", "A person must sign in with an index number and password before reaching any academic record. Credentials are verified against the database; a failed attempt reveals nothing about whether the account exists."],
      ["FR2", "Enrol and manage accounts", "An administrator can register a student, issue a temporary password, reset a forgotten password, deactivate or reactivate an account, and remove an account together with its records."],
      ["FR3", "Separate each student's records", "A signed-in student can read and alter their own records only. No request, however it is formed, grants access to another student's data."],
      ["FR4", "Manage courses", "The user can add, amend and delete courses, each with a name, code, credit hours, lecturer and semester, and can search, filter and sort the resulting list."],
      ["FR5", "Record assessments with weights", "The user can enter assessment components such as quizzes, assignments and examinations, each with a percentage weight and a score, reflecting actual assessment policy."],
      ["FR6", "Calculate averages automatically", "On entry of a score the system recalculates the weighted course average and the credit-weighted grade point average on the 4.0 scale, removing manual calculation error."],
      ["FR7", "Log and categorise study sessions", "The user can time a focused study session or enter one manually, categorise it by course, and review the accumulated history by day and by week."],
      ["FR8", "Manage goals and tasks", "The user can create tasks with due dates and priorities, group them as overdue, due today or upcoming, and mark them complete against a progress indicator."],
      ["FR9", "Revise using flashcards", "The user can create decks and cards, study them in a flip-to-reveal mode, and mark cards as mastered so that revision concentrates on weaker material."],
      ["FR10", "Store documents in a vault", "The user can write notes and upload images or PDF files such as past questions, and retrieve them against a named course."],
      ["FR11", "Generate visual progress reports", "The system renders charts of grade progress by course, letter grade distribution and study hours over the preceding seven days."],
      ["FR12", "Persist data across sessions", "All records survive the closing of the browser, the restarting of the machine and a move to a different computer, because they are held in the database rather than in one browser."],
      ["FR13", "Export and import a backup", "The user can export all structured data to a JSON file and restore it later, permitting transfer between machines and recovery after data is cleared."],
    ],
    [700, 2200, 5321],
  ),

  h3("3.2.4 Non-functional Requirements"),
  body(
    "The non-functional requirements state how well the system performs its functions. Each is " +
    "expressed so that it can be verified by measurement rather than by opinion.",
  ),
  ...table(
    "Table 3.3: Non-functional requirements of the system",
    ["ID", "Requirement", "Criterion for acceptance"],
    [
      ["NFR1", "Responsive design", "The interface adapts without horizontal scrolling to viewport widths from 360 pixels to 1920 pixels, covering phone, tablet and desktop displays."],
      ["NFR2", "Performance", "The application becomes interactive within three seconds on the target hardware, and recalculation after a score is entered completes without perceptible delay."],
      ["NFR3", "Usability", "A student unfamiliar with the system can complete the core tasks of adding a course, entering a score and reading the resulting average within ten minutes and without training."],
      ["NFR4", "Data security and privacy", "Passwords are stored only as bcrypt hashes. The installation is local, so no academic record is transmitted beyond the machine it is hosted on. Every query is bound to the account in the session."],
      ["NFR5", "Reliability", "Invalid input is rejected with an explanatory message rather than corrupting stored data, and a failure to read one record does not prevent the remainder from loading."],
      ["NFR6", "Availability without the internet", "The system operates with the machine disconnected from the internet: the server, the database and every font, icon and library are part of the local installation."],
      ["NFR7", "Maintainability", "The code is organised into named modules with a single storage layer on the client and a single database access point on the server, so that a change to persistence affects one region of the source only."],
      ["NFR8", "Auditability", "The database records when each account was created and last signed in, so a department can see who is enrolled and who is active."],
    ],
    [700, 2200, 5321],
  ),

  h3("3.2.5 Use Cases"),
  body(
    "The system has two actors. The Student is the primary actor and performs all academic tracking. The " +
    "Administrator is a secondary actor who registers students and manages their access, but who cannot " +
    "read any student's academic records: the enrolment console exposes account status and a count of " +
    "courses, never a mark. There is no lecturer role. The principal use cases are shown in Figure 3.2 " +
    "and described in Table 3.4.",
  ),
  ...figure(path.join(DIAG, "usecase.png"), 452, 146, "Figure 3.2: Use case diagram of the system"),
  ...table(
    "Table 3.4: Summary of the principal use cases",
    ["Use case", "Precondition", "Main flow", "Postcondition"],
    [
      ["Sign In", "The person holds an active account", "They supply an index number and password; the server verifies the password against the stored hash and opens a session", "The student reaches their dashboard, the administrator the enrolment console"],
      ["Enrol Student", "An administrator is signed in", "They enter an index number and name; the system creates the account and displays a temporary password once", "The student can sign in, and must choose their own password before proceeding"],
      ["Reset Student Password", "An administrator is signed in", "They select a student and confirm; a fresh temporary password is displayed once", "The student's previous password stops working and a change is required at next sign-in"],
      ["Manage Courses", "The student is signed in", "The student opens My Courses, supplies the course details and saves", "The course is stored against their account and appears in all course selectors"],
      ["Record Assessment Scores", "At least one course exists", "The student selects the course, enters the component, its weight and the score, and saves", "The score is stored and the course average is recalculated"],
      ["View GPA and Grade Analysis", "At least one graded course exists", "The student opens Grades and GPA and reads the average, the grade point average and the distribution chart", "No change to stored data; the analysis is displayed"],
      ["Log Study Sessions", "The student is signed in", "The student starts the timer against a course, works, and the completed interval is logged automatically", "The session is stored and the weekly total and streak are updated"],
      ["Manage Goals and Tasks", "The student is signed in", "The student creates a task with a due date and priority, and later marks it complete", "The task moves group and the progress indicator advances"],
      ["Export or Import Backup", "The student is signed in", "The student exports the data to a JSON file, or selects a file to restore and confirms", "A backup file is written, or the student's stored records are replaced by the backup"],
    ],
    [1500, 1700, 3200, 1821],
  ),

  h2("3.3 System Design"),

  h3("3.3.1 Architectural Design"),
  body(
    "The system follows a three-tier architecture, shown in Figure 3.3, divided across a client and a " +
    "server that both run on the same machine. The presentation tier and part of the application logic " +
    "execute in the browser; the remainder of the application logic and the whole of the data tier " +
    "execute on the server under Apache and MySQL.",
  ),
  body(
    "The presentation tier consists of the HTML5 documents and the CSS3 stylesheet. It is responsible " +
    "for structure and appearance only: layout is achieved with CSS Grid and Flexbox, the theme is " +
    "expressed as a set of custom properties so that the light and dark schemes differ only in their " +
    "values, and no business rule is encoded at this level.",
  ),
  body(
    "The application logic is deliberately split. In the browser, JavaScript holds the router that " +
    "exchanges one view for another without a page reload, the grade calculator that derives weighted " +
    "averages and grade points for display, the study session engine, the chart renderer that drives " +
    "Chart.js, and the guard that redirects anyone without a session to the sign-in page. On the server, " +
    "PHP holds everything that must not be trusted to the client: verification of passwords, creation " +
    "and regeneration of sessions, the cross-site request forgery check, validation of every submitted " +
    "value, the role check that protects the administrator routes, and all access to the database. A " +
    "calculation performed in the browser is a convenience for the person looking at the screen; the " +
    "server independently derives the letter grade it stores, so that a value altered in the client " +
    "cannot corrupt the record.",
  ),
  body(
    "The data tier is a MySQL database reached exclusively through PDO with prepared statements. It " +
    "holds the accounts, with passwords stored only as hashes, and the academic records of every " +
    "enrolled student. It is the authoritative copy. The browser's own storage is retained, but its role " +
    "has changed: at sign-in the signed-in student's rows are copied into it so that the interface can " +
    "read them without waiting on the network, and every change is written back to the database. It is " +
    "a cache, not a record of truth, and clearing it loses nothing.",
  ),
  body(
    "Apache and MySQL, supplied by the XAMPP distribution, run on the same computer as the browser. The " +
    "system is therefore a genuine client-server application, exercising HTTP, sessions and SQL exactly " +
    "as a networked deployment would, while remaining wholly within one machine that the department " +
    "controls.",
  ),
  ...figure(path.join(DIAG, "arch.png"), 452, 329, "Figure 3.3: Three-tier architectural design across client and server"),

  h3("3.3.2 Database Design"),
  body(
    "The system stores everything in a MySQL database created by the script database/sapts_schema.sql, " +
    "which is imported through phpMyAdmin. The entity relationship diagram in Figure 3.4 governs how the " +
    "records reference one another, and the script implements it directly: eight tables carrying the " +
    "primary keys, foreign keys and check constraints the diagram implies, with cascading deletes where " +
    "a child record cannot outlive its parent and null-on-delete where it can.",
  ),
  ...figure(path.join(DIAG, "erd.png"), 452, 244, "Figure 3.4: Entity relationship diagram"),
  body(
    "The user entity is central. It carries the index number by which a student signs in, the bcrypt " +
    "hash of their password, their role and their status, together with the preferences the interface " +
    "restores at sign-in. Every other table carries the identifier of the user who owns its rows, and " +
    "every query the system issues is filtered by that column using the value held in the session. This " +
    "is what keeps one student's records invisible to another: separation is enforced by the database " +
    "and the query, not by anything the browser chooses to display.",
  ),
  body(
    "The remaining cardinalities are as follows. One user owns many courses. One course has many " +
    "assessments, many study sessions and many tasks. One deck has many flashcards. A vault item may " +
    "optionally reference a course. Removing a student's account therefore removes their entire academic " +
    "history in a single operation, because the foreign keys cascade. Table 3.5 lists the tables and " +
    "their contents.",
  ),
  ...table(
    "Table 3.5: Database tables and their principal columns",
    ["Table", "Purpose", "Principal columns"],
    [
      ["user", "Accounts and preferences", "user_id, index_number, full_name, email, password_hash, role, status, must_change_password, theme, weekly_goal, last_login"],
      ["course", "Subjects a student is registered for", "course_id, user_id, code, name, credit_hours, lecturer, semester, score, grade"],
      ["assessment", "Weighted components of a course", "assessment_id, course_id, title, weight, score, max_score"],
      ["study_session", "Logged periods of focused study", "session_id, user_id, course_id, started_at, minutes, session_type"],
      ["task", "Goals and deadlines", "task_id, user_id, course_id, title, due_date, priority, done"],
      ["deck / flashcard", "Revision material", "deck_id, user_id, name; card_id, deck_id, front, back, mastered"],
      ["vault_item", "Notes and uploaded documents", "item_id, user_id, course_id, title, item_type, note_body, file_name"],
    ],
    [1700, 2100, 4421],
  ),
  body(
    "The script also defines four views that express in SQL the calculations the interface performs in " +
    "JavaScript: the weighted average of each course from its assessment components, the letter grade " +
    "and grade points on the 4.0 scale, the credit-weighted grade point average, and the study hours " +
    "accumulated per course. Run against the sample data supplied with the script, these views return " +
    "precisely the figures the interface displays, which demonstrates that the two representations of " +
    "the model agree.",
  ),

  h3("3.3.3 User Interface Design"),
  body(
    "The interface was designed against the usability heuristics of Nielsen (1994) and the guidance of " +
    "Shneiderman and Plaisant (2010), and its visual presentation of quantities follows the principles " +
    "set out by Few (2012). Four decisions shaped the result.",
  ),
  body(
    "The first is a persistent left sidebar carrying the eight modules, so that the structure of the " +
    "system is visible at all times and the current location within it is always marked. The second is a " +
    "dashboard that answers the question a student actually arrives with, namely how matters stand, by " +
    "placing the grade point average, task completion, weekly study hours and the current streak on a " +
    "single row of summary tiles above the charts.",
  ),
  body(
    "The third is a consistent flat visual treatment in which colour carries meaning rather than " +
    "decoration: a fixed palette maps each letter grade to one colour, and that mapping is used " +
    "identically in the badges, the charts and the status indicators, so that a colour learned in one " +
    "view is understood in every other. The fourth is a responsive layout that collapses the sidebar to " +
    "an icon rail below 768 pixels and reflows the tiles and charts into a single column, together with " +
    "a light and a dark theme selectable in settings. Figure 3.5 shows the dashboard as implemented.",
  ),
  ...figure(path.join(SHOTS, "01_dashboard.png"), 452, 298, "Figure 3.5: The dashboard as implemented"),
  body(
    "Two further screens serve the account layer rather than the academic one. The sign-in page in " +
    "Figure 3.6 is the only page reachable without a session; it also carries the self-enrolment form " +
    "and the panel on which a student replaces an administrator-issued temporary password. The " +
    "enrolment console in Figure 3.7 is reachable only by an administrator, and shows each account's " +
    "status, the number of courses it holds and when it was last used, but never a mark.",
  ),
  ...figure(path.join(SHOTS, "10_login.png"), 452, 298, "Figure 3.6: The sign-in page"),
  ...figure(path.join(SHOTS, "11_admin.png"), 452, 284, "Figure 3.7: The administrator enrolment console"),

  h3("3.3.4 Security Considerations"),
  body(
    "Once the system holds accounts for several students on one server, its security posture is no " +
    "longer a matter of the device alone. The measures below were designed in, rather than added " +
    "afterwards, and each is verifiable.",
  ),
  bullet("Password storage. Passwords are never stored, and never stored reversibly. Each is put through bcrypt at cost factor 12 using PHP's password_hash function, and verified with password_verify; the hash is transparently recomputed if the cost factor is later raised. A reading of the user table in phpMyAdmin shows hashes, never a readable password."),
  bullet("Account enumeration. When no account matches the index number supplied, the system still performs a verification against a fixed dummy hash before refusing. A wrong index number and a wrong password therefore take the same time and return the same message, so an attacker cannot discover which index numbers are enrolled."),
  bullet("Session management. Sessions are carried in a cookie marked HttpOnly, so that no script can read it, and SameSite=Lax, so that it is not sent on cross-site requests. The session identifier is regenerated on sign-in and again on any password change, which defeats session fixation. Deactivating an account invalidates its session at the next request."),
  bullet("Cross-site request forgery. Every request that changes data must carry a token issued with the session and compared using a timing-safe equality check. A form submitted from another site, even by a signed-in student's own browser, is rejected."),
  bullet("Authorisation. Every database query is filtered by the user identifier taken from the session, never by one supplied in the request, so a student cannot reach another student's records by altering a parameter. The administrator routes are additionally behind a role check that returns 403 to any student who calls them directly."),
  bullet("Injection. All access to the database goes through PDO with prepared statements and emulation disabled, so values supplied by a user are never concatenated into SQL."),
  bullet("Input validation and output encoding. Every submitted value is checked for type, length and range on the server before it is stored, and writes occur inside a transaction so that a rejected record leaves nothing half-written. All user-supplied text is escaped before it is written into the document, which prevents stored cross-site scripting through a course name or a note."),
  bullet("Server configuration. The supplied .htaccess sets X-Frame-Options, X-Content-Type-Options and a referrer policy, and refuses to serve the SQL schema over HTTP so that the seeded hashes and table structure are not downloadable."),
  bullet("Residual risks. Three remain and are stated plainly. The installation is served over plain HTTP on the local host, which is acceptable only because client and server are the same machine; exposing it on a network would require TLS. The accounts created by the schema share a published password and must be changed immediately after installation. And an administrator can reset any student's password, so administrator access must be controlled as carefully as the records it protects."),

  h2("3.4 Conclusion"),
  body(
    "This chapter has set out the methodology by which the project was conducted, the requirements the " +
    "system must satisfy, and the design by which those requirements are met. The research design is " +
    "constructive, the requirements were drawn from interviews, observation and a review of existing " +
    "systems, and the Waterfall model governed the sequence of work. Thirteen functional and eight " +
    "non-functional requirements were specified and traced to the use cases of the two actors. The " +
    "design that answers them is a three-tier architecture divided between browser and server, with a " +
    "normalised relational store in MySQL, an interface built on established usability principles, and a " +
    "security posture covering password storage, session handling, authorisation and injection. " +
    "Chapter Four reports the implementation of this design and the testing to which it was subjected.",
  ),
];

/* ============================ REFERENCES ============================ */
const reference = (text) =>
  new (require("docx").Paragraph)({
    alignment: require("docx").AlignmentType.JUSTIFIED,
    spacing: { lineRule: "auto", line: 240, after: 160 },
    indent: { left: 720, hanging: 720 },
    children: [B.run(text)],
  });

const D = require("docx");
const references = [
  new D.Paragraph({
    heading: D.HeadingLevel.HEADING_1,
    alignment: D.AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { lineRule: "auto", line: 360, after: 240 },
    children: [B.run("REFERENCES", { bold: true })],
  }),
  reference("Arnold, KE and Pistilli, MD (2012) 'Course Signals at Purdue: using learning analytics to increase student success', Proceedings of the 2nd International Conference on Learning Analytics and Knowledge, 267-270"),
  reference("Bharamagoudar, SR, Geeta, RB and Totad, SG (2013) 'Web based student information management system', International Journal of Advanced Research in Computer and Communication Engineering, 2:6, 2342-2348"),
  reference("Black, P and Wiliam, D (1998) 'Assessment and classroom learning', Assessment in Education: Principles, Policy and Practice, 5:1, 7-74"),
  reference("Brooke, J (1996) 'SUS: a quick and dirty usability scale', in Jordan, PW et al (eds) Usability Evaluation in Industry, Taylor and Francis, London, 189-194"),
  reference("Cirillo, F (2018) The Pomodoro Technique: The Life-Changing Time Management System, Virgin Books, London"),
  reference("Dunlosky, J, Rawson, KA, Marsh, EJ, Nathan, MJ and Willingham, DT (2013) 'Improving students' learning with effective learning techniques', Psychological Science in the Public Interest, 14:1, 4-58"),
  reference("Ellis, RK (2009) Field Guide to Learning Management Systems, American Society for Training and Development, Alexandria"),
  reference("Few, S (2012) Show Me the Numbers: Designing Tables and Graphs to Enlighten (2nd edn), Analytics Press, Burlingame"),
  reference("Hattie, J and Timperley, H (2007) 'The power of feedback', Review of Educational Research, 77:1, 81-112"),
  reference("Kruchten, P (1995) 'Architectural blueprints: the 4+1 view model of software architecture', IEEE Software, 12:6, 42-50"),
  reference("Mozilla Developer Network (2024) IndexedDB API [online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API [accessed 12 August 2026]"),
  reference("Mozilla Developer Network (2024) Web Storage API [online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API [accessed 12 August 2026]"),
  reference("Nielsen, J (1994) Usability Engineering, Morgan Kaufmann, San Francisco"),
  reference("Pintrich, PR (2004) 'A conceptual framework for assessing motivation and self-regulated learning in college students', Educational Psychology Review, 16:4, 385-407"),
  reference("Pressman, RS and Maxim, BR (2020) Software Engineering: A Practitioner's Approach (9th edn), McGraw-Hill, New York"),
  reference("Roediger, HL and Karpicke, JD (2006) 'Test-enhanced learning: taking memory tests improves long-term retention', Psychological Science, 17:3, 249-255"),
  reference("Royce, WW (1970) 'Managing the development of large software systems', Proceedings of IEEE WESCON, 1-9"),
  reference("Sarker, F, Davis, H and Tiropanis, T (2010) 'A review of higher education student data use for learning and teaching', Proceedings of the International Conference on Computer Supported Education, 1-8"),
  reference("Shneiderman, B and Plaisant, C (2010) Designing the User Interface: Strategies for Effective Human-Computer Interaction (5th edn), Addison-Wesley, Boston"),
  reference("Siemens, G and Long, P (2011) 'Penetrating the fog: analytics in learning and education', EDUCAUSE Review, 46:5, 30-40"),
  reference("Sommerville, I (2016) Software Engineering (10th edn), Pearson Education, Harlow"),
  reference("The Apache Friends (2024) XAMPP Apache + MariaDB + PHP + Perl [online]. Available: https://www.apachefriends.org [accessed 12 August 2026]"),
  reference("Zimmerman, BJ (2002) 'Becoming a self-regulated learner: an overview', Theory Into Practice, 41:2, 64-70"),
  reference("Zimmerman, BJ and Schunk, DH (2011) Handbook of Self-Regulation of Learning and Performance, Routledge, New York"),
];

module.exports = { chapterOne, chapterTwo, chapterThree, references };
