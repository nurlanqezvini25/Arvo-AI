import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/* =========================================================
   TYPES
========================================================= */

type Lesson = {
  id?: string;
  title: string;
  objective: string;
  sourceFacts: string[];
};

type CourseModule = {
  id?: string;
  title: string;
  summary: string;
  imageSearchQuery: string;
  lessons: Lesson[];
};

type AssessmentPlan = {
  totalQuestions: number;
  knowledgeQuestions: number;
  scenarioQuestions: number;
  skills: string[];
  reasoning?: string;
};

type CourseData = {
  course: {
    title: string;
    description: string;
    modules: CourseModule[];
  };

  assessmentPlan?: AssessmentPlan;
};

type KnowledgeItem = {
  title: string;
  description: string;
  importance: "critical" | "important" | "normal";
};

type KnowledgeQuestion = {
  questionType: "knowledge";

  question: string;

  options: string[];

  correctIndex: number;

  explanation: string;

  difficulty:
    | "easy"
    | "medium"
    | "hard";

  skill: string;

  scenarioTitle: "";

  scenarioContext: "";

  imageSearchQuery: "";
};

type ScenarioQuestion = {
  questionType: "scenario";

  question: string;

  options: string[];

  correctIndex: number;

  explanation: string;

  difficulty:
    | "easy"
    | "medium"
    | "hard";

  skill: string;

  scenarioTitle: string;

  scenarioContext: string;

  imageSearchQuery: string;
};

type KnowledgeData = {
  documentTitle: string;

  importantKnowledge: KnowledgeItem[];

  questions: KnowledgeQuestion[];
};

type ScenarioData = {
  questions: ScenarioQuestion[];
};

/* =========================================================
   HELPERS
========================================================= */

function cleanAndParse<T>(
  text: string
): T {
  let cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1
  ) {
    throw new Error(
      "AI düzgün JSON qaytarmadı."
    );
  }

  cleaned = cleaned.slice(
    firstBrace,
    lastBrace + 1
  );

  return JSON.parse(cleaned) as T;
}

function getClaudeText(
  response: Anthropic.Messages.Message
) {
  const textBlock =
    response.content.find(
      (item) =>
        item.type === "text"
    );

  if (
    !textBlock ||
    textBlock.type !== "text"
  ) {
    throw new Error(
      "AI mətn qaytarmadı."
    );
  }

  return textBlock.text;
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

function cleanStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item === "string"
    )
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

function normalizeOptions(
  options: unknown
): string[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .filter(
      (item) =>
        typeof item === "string"
    )
    .map((item) =>
      item.trim()
    )
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeDifficulty(
  value: unknown
):
  | "easy"
  | "medium"
  | "hard" {
  if (value === "easy") {
    return "easy";
  }

  if (value === "hard") {
    return "hard";
  }

  return "medium";
}

/* =========================================================
   QUESTION OPTION SHUFFLING
   Keeps the correct answer attached to its text while
   preventing predictable A/B/C/D answer positions.
========================================================= */

function shuffleQuestionOptions<
  T extends {
    options: string[];
    correctIndex: number;
  }
>(question: T): T {
  const pairs = question.options.map((text, index) => ({
    text,
    correct: index === question.correctIndex,
  }));

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return {
    ...question,
    options: pairs.map((item) => item.text),
    correctIndex: pairs.findIndex(
      (item) => item.correct
    ),
  };
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* -----------------------------------------------------
       API KEY
    ----------------------------------------------------- */

    if (
      !process.env
        .ANTHROPIC_API_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY tapılmadı.",
        },
        {
          status: 500,
        }
      );
    }

    /* -----------------------------------------------------
       FORM DATA
    ----------------------------------------------------- */

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const language =
      String(
        formData.get(
          "language"
        ) || "az"
      );

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "PDF faylı tapılmadı.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.type !==
        "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      return NextResponse.json(
        {
          error:
            "Yalnız PDF faylı qəbul edilir.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       LANGUAGE
    ----------------------------------------------------- */

    const languages: Record<
      string,
      string
    > = {
      az: "Azerbaijani",
      en: "English",
      ru: "Russian",
    };

    const outputLanguage =
      languages[language] ||
      "Azerbaijani";

    /* -----------------------------------------------------
       PDF → BASE64
    ----------------------------------------------------- */

    const fileBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    const pdfBase64 =
      fileBuffer.toString(
        "base64"
      );

    const documentBlock = {
      type: "document" as const,

      source: {
        type:
          "base64" as const,

        media_type:
          "application/pdf" as const,

        data: pdfBase64,
      },
    };

    /* =====================================================
       CALL 1
       COURSE STRUCTURE + ADAPTIVE ASSESSMENT PLAN
    ===================================================== */

    const courseResponse =
      await anthropic.messages.create(
        {
          model:
            "claude-haiku-4-5-20251001",

          max_tokens: 6000,

          temperature: 0.1,

          messages: [
            {
              role: "user",

              content: [
                documentBlock,

                {
                  type: "text",

                  text: `
You are the AI Course Architect and Assessment Planner of Praktik AI.

OUTPUT LANGUAGE:
${outputLanguage}

You are given a company SOP, procedure, policy, manual or training PDF.

Your job has TWO parts:

1. Build a structured employee training course.
2. Decide how many assessment questions are genuinely required.

=========================================================
COURSE RULES
=========================================================

Analyze the actual document.

Create between 3 and 6 modules when the material supports it.

Do NOT create unnecessary modules merely to reach a number.

Each module should normally contain 2 to 5 lessons.

Every lesson must contain:

- title
- objective
- 3 to 7 sourceFacts

sourceFacts are extremely important.

They must be concrete facts, procedures, rules, numbers, requirements or decisions DIRECTLY supported by the PDF.

Do not invent company policy.

Do not add generic facts not supported by the document.

For every module also create:

imageSearchQuery

imageSearchQuery MUST be in ENGLISH.

It must contain 3 to 7 visual keywords suitable for finding a realistic professional workplace photo.

Examples:

"customer service call center agent"

"warehouse logistics inventory worker"

"cold chain transport warehouse"

"office cybersecurity employee"

=========================================================
ADAPTIVE ASSESSMENT RULES
=========================================================

You decide the appropriate total number of questions.

HARD LIMITS:

Minimum:
8 questions

Typical:
around 15 questions

Maximum:
25 questions

Do NOT automatically choose 15.

Choose the number based on:

- document length
- number of distinct procedures
- number of important rules
- number of decision points
- number of job responsibilities
- complexity of the material
- number of meaningful skills that need testing

A short/simple document may need 8-11 questions.

A normal SOP may need approximately 12-17 questions.

A long or complex SOP may need approximately 18-25 questions.

Do not inflate the number merely because the document is long.

If the document repeats the same information, do not create extra questions.

At the same time, do not choose too few questions if important areas would remain untested.

=========================================================
KNOWLEDGE VS SCENARIO
=========================================================

Split the assessment into:

knowledgeQuestions
scenarioQuestions

Scenario questions should normally be the larger portion when the document describes practical work.

Typical approximate ratio:

35-45% knowledge
55-65% scenario

But use professional judgment based on the document.

knowledgeQuestions + scenarioQuestions MUST equal totalQuestions.

=========================================================
SKILLS
=========================================================

Identify the meaningful JOB SKILLS that should be measured from THIS document.

Do NOT use a fixed universal skill list.

Examples depend on the document.

A call-center SOP may produce skills such as:

- Communication
- Complaint Handling
- Escalation Handling
- Billing Knowledge
- Policy Compliance
- Customer Retention
- Technical Troubleshooting

A logistics SOP may produce:

- Documentation
- Customs Compliance
- Cold Chain
- Warehouse Operations
- Incident Handling
- Inventory Control
- Transport Planning

Only include skills genuinely supported by the PDF.

Usually identify approximately 3 to 8 meaningful skills.

Avoid creating too many tiny or overlapping skills.

The selected skills must be realistically measurable with the number of questions you choose.

=========================================================
RETURN ONLY VALID JSON
=========================================================

{
  "course": {
    "title": "string",
    "description": "string",
    "modules": [
      {
        "title": "string",
        "summary": "string",
        "imageSearchQuery": "english visual keywords",
        "lessons": [
          {
            "title": "string",
            "objective": "string",
            "sourceFacts": [
              "fact directly supported by PDF",
              "fact directly supported by PDF"
            ]
          }
        ]
      }
    ]
  },

  "assessmentPlan": {
    "totalQuestions": 15,
    "knowledgeQuestions": 6,
    "scenarioQuestions": 9,
    "skills": [
      "Skill 1",
      "Skill 2",
      "Skill 3"
    ],
    "reasoning": "One short sentence explaining why this assessment size is appropriate."
  }
}
`,
                },
              ],
            },
          ],
        }
      );

    const courseData =
      cleanAndParse<CourseData>(
        getClaudeText(
          courseResponse
        )
      );

    /* =====================================================
       NORMALIZE COURSE
    ===================================================== */

    const rawModules =
      Array.isArray(
        courseData.course
          ?.modules
      )
        ? courseData.course
            .modules
        : [];

    if (
      rawModules.length === 0
    ) {
      throw new Error(
        "AI kurs modulları yaratmadı."
      );
    }

    const normalizedModules =
      rawModules.map(
        (
          module,
          moduleIndex
        ) => {
          const moduleId = `m${
            moduleIndex + 1
          }`;

          const lessons =
            Array.isArray(
              module.lessons
            )
              ? module.lessons
              : [];

          return {
            id: moduleId,

            title:
              module.title ||
              `Module ${
                moduleIndex + 1
              }`,

            summary:
              module.summary || "",

            imageSearchQuery:
              module.imageSearchQuery ||
              "professional workplace training",

            lessons:
              lessons.map(
                (
                  lesson,
                  lessonIndex
                ) => ({
                  id: `${moduleId}-l${
                    lessonIndex +
                    1
                  }`,

                  title:
                    lesson.title ||
                    `Lesson ${
                      lessonIndex +
                      1
                    }`,

                  objective:
                    lesson.objective ||
                    "",

                  sourceFacts:
                    cleanStringArray(
                      lesson.sourceFacts
                    ),
                })
              ),
          };
        }
      );

    const totalLessons =
      normalizedModules.reduce(
        (total, module) =>
          total +
          module.lessons.length,
        0
      );

    /* =====================================================
       NORMALIZE ASSESSMENT PLAN
    ===================================================== */

    const rawPlan =
      courseData.assessmentPlan;

    let totalQuestions =
      clamp(
        Number(
          rawPlan
            ?.totalQuestions
        ) || 15,
        8,
        25
      );

    let knowledgeQuestions =
      Number(
        rawPlan
          ?.knowledgeQuestions
      );

    if (
      !Number.isFinite(
        knowledgeQuestions
      )
    ) {
      knowledgeQuestions =
        Math.round(
          totalQuestions * 0.4
        );
    }

    knowledgeQuestions =
      clamp(
        knowledgeQuestions,
        3,
        totalQuestions - 4
      );

    let scenarioQuestions =
      totalQuestions -
      knowledgeQuestions;

    /*
      Safety:
      At least 4 scenario questions.
    */

    if (
      scenarioQuestions < 4
    ) {
      scenarioQuestions = 4;

      knowledgeQuestions =
        totalQuestions -
        scenarioQuestions;
    }

    /*
      Final mathematical check.
    */

    totalQuestions =
      knowledgeQuestions +
      scenarioQuestions;

    let assessmentSkills =
      cleanStringArray(
        rawPlan?.skills
      );

    if (
      assessmentSkills.length ===
      0
    ) {
      assessmentSkills = [
        "Core Knowledge",
        "Procedure Application",
        "Decision Making",
      ];
    }

    /*
      Avoid absurdly large skill list.
    */

    assessmentSkills =
      assessmentSkills.slice(
        0,
        10
      );

    /* =====================================================
       CALL 2
       IMPORTANT KNOWLEDGE + KNOWLEDGE QUESTIONS
    ===================================================== */

    const knowledgeResponse =
      await anthropic.messages.create(
        {
          model:
            "claude-haiku-4-5-20251001",

          max_tokens: 6500,

          temperature: 0.1,

          messages: [
            {
              role: "user",

              content: [
                documentBlock,

                {
                  type: "text",

                  text: `
You are the Assessment Engine of Praktik AI.

OUTPUT LANGUAGE:
${outputLanguage}

Analyze ONLY the supplied PDF.

Do not invent company rules or procedures.

=========================================================
ASSESSMENT PLAN
=========================================================

Total assessment questions:
${totalQuestions}

Knowledge questions required:
${knowledgeQuestions}

Scenario questions will be generated separately:
${scenarioQuestions}

Skills identified from this document:

${assessmentSkills
  .map(
    (skill, index) =>
      `${index + 1}. ${skill}`
  )
  .join("\n")}

=========================================================
IMPORTANT KNOWLEDGE
=========================================================

Extract exactly 5 of the most important knowledge areas from the PDF.

Each item:

- title
- description
- importance

importance must be one of:

critical
important
normal

=========================================================
KNOWLEDGE QUESTIONS
=========================================================

Create EXACTLY ${knowledgeQuestions} knowledge questions.

Every question MUST:

- be directly supported by the PDF
- test meaningful employee knowledge
- have exactly 4 options
- have only one correct answer
- include a useful explanation
- include a difficulty
- include a skill

OPTION QUALITY RULES:

- All 4 options must be similar in length and grammatical structure.
- Do NOT make the correct answer significantly longer than the distractors.
- Do NOT make the correct answer more detailed, professional-looking, or specific merely to signal that it is correct.
- Distractors must be plausible, relevant, and based on realistic misunderstandings.
- Avoid obvious wording clues that reveal the correct answer.
- Do not use absolute words or unusually precise wording only in the correct answer.
- Each option should be independently understandable.

questionType must ALWAYS be:

"knowledge"

scenarioTitle must ALWAYS be:

""

scenarioContext must ALWAYS be:

""

imageSearchQuery must ALWAYS be:

""

=========================================================
SKILL RULE
=========================================================

Whenever possible, use one of these exact skill names:

${assessmentSkills
  .map(
    (skill) =>
      `"${skill}"`
  )
  .join(", ")}

Distribute the questions across the skills sensibly.

Do not force every skill into the assessment if the PDF does not support a good knowledge question for it.

=========================================================
DIFFICULTY
=========================================================

Use a sensible mix of:

easy
medium
hard

Approximately:

25% easy
45% medium
30% hard

The later questions should generally become more challenging.

=========================================================
RETURN ONLY VALID JSON
=========================================================

{
  "documentTitle": "string",

  "importantKnowledge": [
    {
      "title": "string",
      "description": "string",
      "importance": "critical"
    }
  ],

  "questions": [
    {
      "questionType": "knowledge",
      "question": "string",

      "options": [
        "option A",
        "option B",
        "option C",
        "option D"
      ],

      "correctIndex": 0,

      "explanation": "string",

      "difficulty": "easy",

      "skill": "one meaningful skill",

      "scenarioTitle": "",

      "scenarioContext": "",

      "imageSearchQuery": ""
    }
  ]
}
`,
                },
              ],
            },
          ],
        }
      );

    const knowledgeData =
      cleanAndParse<KnowledgeData>(
        getClaudeText(
          knowledgeResponse
        )
      );

    /* =====================================================
       NORMALIZE KNOWLEDGE QUESTIONS
    ===================================================== */

    let normalizedKnowledgeQuestions: KnowledgeQuestion[] =
      (
        Array.isArray(
          knowledgeData.questions
        )
          ? knowledgeData.questions
          : []
      )
        .map(
          (
            question
          ): KnowledgeQuestion => ({
            questionType:
              "knowledge",

            question:
              question.question ||
              "",

            options:
              normalizeOptions(
                question.options
              ),

            correctIndex:
              clamp(
                Number(
                  question.correctIndex
                ) || 0,
                0,
                3
              ),

            explanation:
              question.explanation ||
              "",

            difficulty:
              normalizeDifficulty(
                question.difficulty
              ),

            skill:
              question.skill ||
              assessmentSkills[0] ||
              "Core Knowledge",

            scenarioTitle: "",

            scenarioContext: "",

            imageSearchQuery: "",
          })
        )
        .filter(
          (question) =>
            question.question &&
            question.options
              .length === 4
        )
        .slice(
          0,
          knowledgeQuestions
        );

    if (
      normalizedKnowledgeQuestions.length !==
      knowledgeQuestions
    ) {
      throw new Error(
        `AI ${knowledgeQuestions} knowledge sualı əvəzinə ${normalizedKnowledgeQuestions.length} düzgün sual yaratdı. Yenidən analiz et.`
      );
    }

    /* =====================================================
       CALL 3
       SCENARIO QUESTIONS
    ===================================================== */

    const scenarioResponse =
      await anthropic.messages.create(
        {
          model:
            "claude-haiku-4-5-20251001",

          max_tokens: 8000,

          temperature: 0.15,

          messages: [
            {
              role: "user",

              content: [
                documentBlock,

                {
                  type: "text",

                  text: `
You are the Workplace Scenario Assessment Engine of Praktik AI.

OUTPUT LANGUAGE:
${outputLanguage}

Use ONLY the supplied PDF as the factual basis.

Do not invent company rules, penalties, numbers, procedures or policies.

=========================================================
ASSESSMENT PLAN
=========================================================

Total assessment:
${totalQuestions}

Scenario questions required:
${scenarioQuestions}

Skills identified from the document:

${assessmentSkills
  .map(
    (skill, index) =>
      `${index + 1}. ${skill}`
  )
  .join("\n")}

=========================================================
TASK
=========================================================

Create EXACTLY ${scenarioQuestions} realistic workplace scenario questions.

These should test whether the employee can APPLY the PDF knowledge in realistic work situations.

Do not simply rewrite knowledge questions as stories.

Create situations involving:

- decisions
- priorities
- procedures
- customer or colleague interactions where relevant
- incident handling where relevant
- compliance choices where relevant
- operational decisions where relevant

Use only scenarios that make sense for THIS PDF.

=========================================================
EACH QUESTION
=========================================================

Every question must have:

questionType:
"scenario"

scenarioTitle:
a short professional title

scenarioContext:
2 to 5 sentences describing the workplace situation

question:
the decision the employee must make

options:
exactly 4 plausible options

OPTION QUALITY RULES:

- All 4 options must be similar in length and grammatical structure.
- Do NOT make the correct answer significantly longer than the other options.
- All distractors must be realistic, plausible, and relevant to the workplace situation.
- Do NOT use wording, detail level, or professionalism as a clue to the correct answer.
- Avoid obviously absurd distractors.
- Avoid absolute wording that makes one option obviously correct.
- Each option should represent a realistic action an employee might actually take.

correctIndex:
0, 1, 2 or 3

explanation:
why the answer is correct according to the PDF

difficulty:
easy, medium or hard

skill:
the main skill being measured

imageSearchQuery:
3 to 7 ENGLISH visual keywords suitable for a realistic workplace stock photo

=========================================================
SKILLS
=========================================================

Whenever possible, use one of these exact skill names:

${assessmentSkills
  .map(
    (skill) =>
      `"${skill}"`
  )
  .join(", ")}

Distribute scenarios across meaningful skills.

Prioritize practical skills that are best assessed through workplace scenarios.

=========================================================
DIFFICULTY
=========================================================

Use a progression.

Approximately:

20% easy
45% medium
35% hard

Later scenarios should generally require stronger judgment.

=========================================================
RETURN ONLY VALID JSON
=========================================================

{
  "questions": [
    {
      "questionType": "scenario",

      "scenarioTitle": "string",

      "scenarioContext": "string",

      "question": "string",

      "options": [
        "option A",
        "option B",
        "option C",
        "option D"
      ],

      "correctIndex": 0,

      "explanation": "string",

      "difficulty": "medium",

      "skill": "one meaningful skill",

      "imageSearchQuery": "english visual keywords"
    }
  ]
}
`,
                },
              ],
            },
          ],
        }
      );

    const scenarioData =
      cleanAndParse<ScenarioData>(
        getClaudeText(
          scenarioResponse
        )
      );

    /* =====================================================
       NORMALIZE SCENARIO QUESTIONS
    ===================================================== */

    let normalizedScenarioQuestions: ScenarioQuestion[] =
      (
        Array.isArray(
          scenarioData.questions
        )
          ? scenarioData.questions
          : []
      )
        .map(
          (
            question
          ): ScenarioQuestion => ({
            questionType:
              "scenario",

            question:
              question.question ||
              "",

            options:
              normalizeOptions(
                question.options
              ),

            correctIndex:
              clamp(
                Number(
                  question.correctIndex
                ) || 0,
                0,
                3
              ),

            explanation:
              question.explanation ||
              "",

            difficulty:
              normalizeDifficulty(
                question.difficulty
              ),

            skill:
              question.skill ||
              assessmentSkills[0] ||
              "Procedure Application",

            scenarioTitle:
              question.scenarioTitle ||
              "Workplace Scenario",

            scenarioContext:
              question.scenarioContext ||
              "",

            imageSearchQuery:
              question.imageSearchQuery ||
              "professional workplace employee",
          })
        )
        .filter(
          (question) =>
            question.question &&
            question.options
              .length === 4
        )
        .slice(
          0,
          scenarioQuestions
        );

    if (
      normalizedScenarioQuestions.length !==
      scenarioQuestions
    ) {
      throw new Error(
        `AI ${scenarioQuestions} scenario sualı əvəzinə ${normalizedScenarioQuestions.length} düzgün sual yaratdı. Yenidən analiz et.`
      );
    }

    /* =====================================================
       FINAL QUESTIONS
    ===================================================== */

    const questions = [
      ...normalizedKnowledgeQuestions,
      ...normalizedScenarioQuestions,
    ].map((question) =>
      shuffleQuestionOptions(question)
    );

    // Final safety check after shuffling.
    for (const question of questions) {
      if (
        question.options.length !== 4 ||
        question.correctIndex < 0 ||
        question.correctIndex > 3
      ) {
        throw new Error(
          "Test suallarının cavab variantlarında daxili xəta yarandı."
        );
      }
    }

    /* =====================================================
       IMPORTANT KNOWLEDGE
    ===================================================== */

    const importantKnowledge =
      (
        Array.isArray(
          knowledgeData.importantKnowledge
        )
          ? knowledgeData.importantKnowledge
          : []
      )
        .map((item) => ({
          title:
            item.title || "",

          description:
            item.description || "",

          importance:
            item.importance ===
              "critical" ||
            item.importance ===
              "important"
              ? item.importance
              : ("normal" as const),
        }))
        .filter(
          (item) =>
            item.title &&
            item.description
        )
        .slice(0, 5);

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return NextResponse.json({
      documentTitle:
        knowledgeData.documentTitle ||
        courseData.course.title ||
        file.name,

      course: {
        title:
          courseData.course.title ||
          knowledgeData.documentTitle ||
          file.name,

        description:
          courseData.course
            .description || "",

        totalModules:
          normalizedModules.length,

        totalLessons,

        modules:
          normalizedModules,
      },

      assessmentPlan: {
        totalQuestions,

        knowledgeQuestions,

        scenarioQuestions,

        skills:
          assessmentSkills,

        reasoning:
          rawPlan?.reasoning ||
          "",
      },

      importantKnowledge,

      questions,

      stats: {
        modules:
          normalizedModules.length,

        lessons:
          totalLessons,

        knowledgeQuestions,

        scenarioQuestions,

        totalQuestions:
          questions.length,

        skills:
          assessmentSkills.length,
      },
    });
  } catch (error) {
    console.error(
      "ANALYZE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "PDF analiz edilərkən xəta baş verdi.",
      },
      {
        status: 500,
      }
    );
  }
}