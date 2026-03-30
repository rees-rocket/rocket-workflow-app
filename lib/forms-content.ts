export const EMERGENCY_CONTACT_SAFETY_GUARDIAN_FORM_KEY = "emergency-contact-safety-guardian";
export const INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY = "independent-contractor-agreement";
export const W9_FORM_KEY = "w9-form";
export const W9_FORM_PDF_PATH = "/forms/w9-form.pdf";
export const EMPLOYEE_HANDBOOK_FORM_KEY = "employee-handbook-acknowledgment";
export const EMPLOYEE_HANDBOOK_VERSION = "Employee Handbook v1 - 2026";

export const SAFETY_TEXT = `I understand that working with Rocket Ribs & BBQ involves a fast-paced environment with potential hazards, including hot equipment, sharp tools, and confined working spaces.

I agree to follow all safety practices while working, including:

- Using proper protective equipment when required:
  - Cut-resistant gloves when using knives
  - Cotton liners and heat-resistant gloves when handling hot items
- Handling knives carefully and using proper cutting techniques
- Staying aware of hot surfaces such as steam tables, smokers, and pans
- Practicing safe movement when entering and exiting the food truck:
  - Do not step up or down with both hands full
  - Set items down before stepping in or out if needed
  - Use the door bar/handle for support when stepping down
- Avoiding rushing or unsafe movements in tight working spaces
- Keeping my work area clean and free of hazards
- Following all instructions given during training and service

I understand that these practices are in place to protect both myself and others.`;

export const SAFE_WORK_BEHAVIOR_TEXT = `I agree to work safely at all times and to use good judgment while performing my duties.

I understand that I should:
- Stay aware of my surroundings
- Communicate clearly with team members
- Ask for help if unsure about a task
- Stop and address unsafe situations when they arise`;

export const INCIDENT_REPORTING_TEXT = `I agree to report any injury, accident, or unsafe condition to a supervisor immediately.

This includes:
- Cuts or burns
- Equipment issues
- Spills or hazards
- Any situation that could cause harm`;

export const WORKER_ACK_TEXT = `I acknowledge that I have read and understand the safety expectations outlined above.

I agree to follow all safety procedures and understand that failure to do so may result in removal from work.`;

export const GUARDIAN_TEXT = `I confirm that I am the parent or legal guardian of the worker listed above.

I have reviewed the safety expectations and understand the nature of the work being performed, including working with hot equipment, sharp tools, and a fast-paced environment.

I give permission for my child to work with Rocket Ribs & BBQ under these conditions and acknowledge that they are expected to follow all safety procedures and training provided.

I understand that it is my child's responsibility to follow all safety guidelines and to report any unsafe conditions or injuries immediately.`;

export const CONTRACTOR_AGREEMENT_TITLE = "INDEPENDENT CONTRACTOR AGREEMENT";

export const CONTRACTOR_AGREEMENT_INTRO = `This Independent Contractor Agreement ("Agreement") is made and entered into as of the date of signing ("Effective Date") by and between Rocket Ribs and BBQ, a business registered in MN ("Company"), and the independent contractor identified below ("Contractor").`;

export const CONTRACTOR_AGREEMENT_SECTIONS = [
  {
    heading: "1. Engagement",
    body: `Company hereby engages Contractor to provide the following services:

Assisting in the preparation and serving of food at local events, ensuring quality food presentation and adherence to health and safety standards. Additionally, Contractor will provide customer service, including taking orders, handling payments, and interacting with customers in a professional and friendly manner. Contractor will be responsible for their own transportation to and from events unless otherwise agreed upon.

Contractor agrees to perform the Services as an independent contractor, not as an employee of the Company.`
  },
  {
    heading: "2. Independent Contractor Relationship",
    body: `Contractor acknowledges and agrees that:

a. Contractor has full control over how the work is performed, including the manner, means, and methods of providing the Services.
b. Contractor is free to perform similar services for other clients and maintains their own business operations.
c. Contractor is responsible for providing all necessary tools, equipment, and materials for the completion of the Services, unless otherwise agreed or provided by Company.
d. Contractor is responsible for their own business expenses and will not be reimbursed for travel, equipment, or other business-related costs unless explicitly agreed upon.
e. Contractor is solely responsible for all tax obligations, including federal, state, and local taxes. Company will not withhold any taxes from Contractor's compensation.
f. Contractor is not entitled to Company-provided benefits, including health insurance, retirement plans, paid time off, or workers' compensation.`
  },
  {
    heading: "3. Payment Terms",
    body: `a. Company agrees to pay Contractor $13 per hour.
b. Payments will be made biweekly upon submission of an invoice by Contractor.
c. Contractor is responsible for all applicable business expenses unless otherwise agreed in writing.`
  },
  {
    heading: "4. Term & Termination",
    body: `a. This Agreement shall commence on 20 July 2025 and continue until 15 October 2025 or until the completion of the Services unless terminated earlier as provided herein.
b. Either party may terminate this Agreement with 14 days' written notice. Termination will not affect any outstanding obligations for work already completed.
c. Company may terminate the Agreement immediately for cause if Contractor fails to perform the Services as agreed.`
  },
  {
    heading: "5. Confidentiality & Intellectual Property",
    body: `a. Contractor agrees to keep all non-public information received from the Company confidential and not disclose or use it for personal gain. This includes all recipes, methods, sources and resources of the Company.
b. Any work product created under this Agreement shall be owned by Company, if applicable.`
  },
  {
    heading: "6. Non-Exclusivity",
    body: `Contractor is free to contract with other businesses and individuals while engaged under this Agreement.`
  },
  {
    heading: "7. Compliance with Laws",
    body: `Contractor shall comply with all applicable federal, state, and local laws, including obtaining all required licenses and permits necessary to perform the Services.`
  },
  {
    heading: "8. Indemnification",
    body: `Contractor agrees to indemnify and hold Company harmless from any claims, damages, or liabilities arising from the performance of the Services.`
  },
  {
    heading: "9. Governing Law & Dispute Resolution",
    body: `This Agreement shall be governed by the laws of the State of Minnesota. Any disputes shall first be attempted to be resolved through good-faith negotiations.`
  },
  {
    heading: "10. Entire Agreement",
    body: `This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements, whether written or oral.`
  }
] as const;

export const CONTRACTOR_ACK_TEXT = `I acknowledge that I have read and understand this Independent Contractor Agreement.

I understand that I am signing as an independent contractor and not as an employee of Rocket Ribs and BBQ. I agree to the terms above.`;

export const CONTRACTOR_GUARDIAN_TEXT = `If the contractor is under 18 years of age, a parent or legal guardian must complete this section.

I confirm that I am the parent or legal guardian of the contractor listed above.

I have reviewed this Independent Contractor Agreement and understand the nature of the work being performed.

I give permission for my child to work with Rocket Ribs and BBQ under these conditions.`;

export const EMPLOYEE_HANDBOOK_TITLE = "Rocket Ribs & BBQ Employee Handbook (Field Operations)";

export const EMPLOYEE_HANDBOOK_SECTIONS = [
  {
    heading: "1. Mission & Culture",
    points: [
      "Serve high-quality barbecue",
      "Deliver a great customer experience",
      "Work as a team",
      "Take pride in what we do",
      "We operate in a fast-paced environment where everyone contributes."
    ]
  },
  {
    heading: "2. Work Expectations",
    points: [
      "Be on time and ready to work",
      "Stay engaged and productive",
      "Communicate clearly and respectfully with your team",
      "Help wherever needed",
      "Take initiative",
      "If you have time to lean, you have time to clean."
    ]
  },
  {
    heading: "3. Appearance & Hygiene",
    points: [
      "Wear a clean Rocket Ribs t-shirt and hat",
      "Shorts allowed but must be clean and work-appropriate",
      "No open-toe shoes; closed-toe required",
      "Maintain good hygiene and clean hands"
    ]
  },
  {
    heading: "4. Safety & Work Environment",
    points: [
      "Use cut gloves and heat protection",
      "Be aware of hot surfaces",
      "Handle knives safely",
      "Do not step in/out of truck with hands full",
      "Use door bar when stepping down",
      "Unsafe behavior results in removal"
    ]
  },
  {
    heading: "5. Food Safety",
    points: [
      "Do not work while sick",
      "Prevent contamination",
      "Follow temperature rules",
      "Maintain clean surfaces"
    ]
  },
  {
    heading: "6. Scheduling & Attendance",
    points: [
      "Schedules based on events",
      "You are responsible for your schedule",
      "No call/no show = removal"
    ]
  },
  {
    heading: "7. Timekeeping & Pay",
    points: [
      "Clock in/out accurately",
      "Submit corrections if needed",
      "Do not falsify time"
    ]
  },
  {
    heading: "8. Breaks",
    points: [
      "Allowed when business permits",
      "Must be approved",
      "Wash hands after breaks"
    ]
  },
  {
    heading: "9. Cell Phone Policy",
    points: [
      "No phone use during service",
      "Allowed when slow with discretion"
    ]
  },
  {
    heading: "10. Customer Interaction",
    points: [
      "Be friendly and efficient",
      "Stay calm under pressure",
      "Escalate issues when needed"
    ]
  },
  {
    heading: "11. Cash Handling",
    points: [
      "All items must be rung in",
      "No giving away product",
      "Report mistakes immediately"
    ]
  },
  {
    heading: "12. Cleanliness",
    points: [
      "Clean as you go",
      "Keep workspace organized",
      "Everyone is responsible"
    ]
  },
  {
    heading: "13. Conduct & Discipline",
    points: [
      "Respect others",
      "Follow instructions",
      "Warning to removal policy",
      "Unsafe behavior or no call/no show = removal"
    ]
  },
  {
    heading: "14. Acknowledgment",
    points: ["By working with Rocket Ribs & BBQ, you agree to follow all policies and expectations."]
  }
] as const;

export const EMPLOYEE_HANDBOOK_ACK_TEXT = `I acknowledge that I have received access to the Rocket Ribs & BBQ Employee Handbook.

I understand that it is my responsibility to read and understand the information contained in this handbook.

I agree to follow all policies, procedures, and expectations outlined in the handbook.

I understand that these policies may be updated at any time, and I am responsible for following the most current version.

I understand that this handbook is not a contract of employment and does not guarantee continued work.`;

export const EMPLOYEE_HANDBOOK_GUARDIAN_TEXT = `I confirm that I am the parent or legal guardian of the worker listed above.

I have reviewed the Employee Handbook and understand the expectations, policies, and safety requirements outlined within it.

I give permission for my child to work under these conditions and agree that they are expected to follow all policies and safety procedures.`;

const ONBOARDING_FORM_KEYS = new Set([
  EMERGENCY_CONTACT_SAFETY_GUARDIAN_FORM_KEY,
  INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY,
  W9_FORM_KEY,
  EMPLOYEE_HANDBOOK_FORM_KEY
]);

export function isOnboardingForm(formKey: string | null | undefined) {
  return Boolean(formKey && ONBOARDING_FORM_KEYS.has(formKey));
}
