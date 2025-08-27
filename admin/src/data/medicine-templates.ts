// Common medicine templates for automatic prescription generation
export interface MedicineTemplate {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  category: string;
}

export interface IllnessTemplate {
  name: string;
  symptoms: string[];
  diagnosis: string;
  medicines: MedicineTemplate[];
  generalInstructions: string[];
}

// Common illness templates with Indian medicines
export const ILLNESS_TEMPLATES: IllnessTemplate[] = [
  {
    name: 'Common Cold',
    symptoms: ['runny nose', 'sneezing', 'cough', 'sore throat'],
    diagnosis: 'Common Cold (Viral Upper Respiratory Infection)',
    medicines: [
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6-8 hours',
        duration: '3-5 days',
        instructions: 'After meals',
        category: 'Antipyretic/Analgesic'
      },
      {
        name: 'Cetirizine',
        genericName: 'Cetirizine Hydrochloride',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '5-7 days',
        instructions: 'At bedtime',
        category: 'Antihistamine'
      },
      {
        name: 'Dextromethorphan',
        dosage: '15mg',
        frequency: 'Every 4-6 hours',
        duration: '3-5 days',
        instructions: 'For dry cough only',
        category: 'Cough suppressant'
      }
    ],
    generalInstructions: [
      'Rest and increase fluid intake',
      'Use saline nasal drops if needed',
      'Avoid cold foods and drinks',
      'Return if symptoms worsen or fever persists beyond 3 days'
    ]
  },
  {
    name: 'Fever',
    symptoms: ['high body temperature', 'headache', 'body ache', 'fatigue'],
    diagnosis: 'Fever (Pyrexia) - cause to be determined',
    medicines: [
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6 hours',
        duration: '3-5 days or until fever subsides',
        instructions: 'After meals with plenty of water',
        category: 'Antipyretic/Analgesic'
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 8 hours if needed',
        duration: '2-3 days',
        instructions: 'After meals, avoid if stomach issues',
        category: 'NSAID'
      }
    ],
    generalInstructions: [
      'Monitor temperature regularly',
      'Increase fluid intake - water, fresh juices, soups',
      'Take bed rest',
      'Sponge with lukewarm water if temperature >101°F',
      'Seek immediate medical attention if fever >103°F or persists >3 days'
    ]
  },
  {
    name: 'Cough',
    symptoms: ['persistent cough', 'throat irritation', 'chest congestion'],
    diagnosis: 'Acute Cough (likely viral origin)',
    medicines: [
      {
        name: 'Dextromethorphan',
        dosage: '15mg',
        frequency: 'Every 6 hours',
        duration: '5-7 days',
        instructions: 'For dry cough, take with warm water',
        category: 'Cough suppressant'
      },
      {
        name: 'Guaifenesin',
        dosage: '200mg',
        frequency: 'Every 4 hours',
        duration: '5-7 days',
        instructions: 'For productive cough, take with plenty of fluids',
        category: 'Expectorant'
      },
      {
        name: 'Honey with ginger',
        dosage: '1 teaspoon',
        frequency: '3-4 times daily',
        duration: '5-7 days',
        instructions: 'Natural remedy, can be taken with warm water',
        category: 'Natural remedy'
      }
    ],
    generalInstructions: [
      'Avoid cold foods and beverages',
      'Use steam inhalation 2-3 times daily',
      'Stay hydrated',
      'Avoid smoking and dust exposure',
      'Return if cough persists beyond 2 weeks or blood in sputum'
    ]
  },
  {
    name: 'Headache',
    symptoms: ['head pain', 'sensitivity to light', 'neck stiffness'],
    diagnosis: 'Tension Headache',
    medicines: [
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6-8 hours as needed',
        duration: '2-3 days',
        instructions: 'After meals',
        category: 'Analgesic'
      },
      {
        name: 'Aspirin',
        dosage: '325mg',
        frequency: 'Every 4-6 hours as needed',
        duration: '2-3 days',
        instructions: 'After meals, avoid if stomach ulcer history',
        category: 'NSAID'
      }
    ],
    generalInstructions: [
      'Rest in quiet, dark room',
      'Apply cold compress to forehead',
      'Ensure adequate sleep (7-8 hours)',
      'Stay hydrated',
      'Avoid stress and screen time',
      'Consult if headache is severe or persists'
    ]
  },
  {
    name: 'Stomach Upset',
    symptoms: ['nausea', 'stomach pain', 'indigestion', 'bloating'],
    diagnosis: 'Gastritis/Dyspepsia',
    medicines: [
      {
        name: 'Ranitidine',
        dosage: '150mg',
        frequency: 'Twice daily',
        duration: '5-7 days',
        instructions: '30 minutes before meals',
        category: 'H2 blocker'
      },
      {
        name: 'Domperidone',
        dosage: '10mg',
        frequency: '3 times daily',
        duration: '3-5 days',
        instructions: '30 minutes before meals',
        category: 'Prokinetic agent'
      },
      {
        name: 'ENO/Digene',
        dosage: '5ml',
        frequency: 'As needed after meals',
        duration: 'As required',
        instructions: 'For immediate relief from acidity',
        category: 'Antacid'
      }
    ],
    generalInstructions: [
      'Eat small, frequent meals',
      'Avoid spicy, oily, and acidic foods',
      'Do not lie down immediately after eating',
      'Avoid alcohol and smoking',
      'Drink plenty of water between meals'
    ]
  },
  {
    name: 'Body Pain',
    symptoms: ['muscle pain', 'joint pain', 'body ache', 'stiffness'],
    diagnosis: 'Myalgia/Arthralgia',
    medicines: [
      {
        name: 'Diclofenac',
        dosage: '50mg',
        frequency: 'Twice daily',
        duration: '5-7 days',
        instructions: 'After meals',
        category: 'NSAID'
      },
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 8 hours',
        duration: '5-7 days',
        instructions: 'Can be combined with Diclofenac',
        category: 'Analgesic'
      },
      {
        name: 'Volini Gel',
        dosage: 'Apply thin layer',
        frequency: '2-3 times daily',
        duration: '1-2 weeks',
        instructions: 'For external use only, massage gently',
        category: 'Topical analgesic'
      }
    ],
    generalInstructions: [
      'Rest the affected area',
      'Apply hot/cold compress as comfortable',
      'Light stretching exercises',
      'Avoid heavy physical activity',
      'Consult if pain persists beyond a week'
    ]
  }
];

// Indian Medicine Dataset structure based on the JSON
export interface IndianMedicine {
  id: string;
  name: string;
  price: string;
  Is_discontinued: string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  short_composition1: string;
  short_composition2: string;
  category?: string; // We'll add this for categorization
}

// Common Indian medicines database (subset from actual dataset)
export const INDIAN_MEDICINES: IndianMedicine[] = [
  {
    id: "1",
    name: "Augmentin 625 Duo Tablet",
    price: "223.42",
    Is_discontinued: "FALSE",
    manufacturer_name: "Glaxo SmithKline Pharmaceuticals Ltd",
    type: "allopathy",
    pack_size_label: "strip of 10 tablets",
    short_composition1: "Amoxycillin (500mg)",
    short_composition2: "Clavulanic Acid (125mg)",
    category: "Antibiotic"
  },
  {
    id: "2",
    name: "Azithral 500 Tablet",
    price: "132.36",
    Is_discontinued: "FALSE",
    manufacturer_name: "Alembic Pharmaceuticals Ltd",
    type: "allopathy",
    pack_size_label: "strip of 5 tablets",
    short_composition1: "Azithromycin (500mg)",
    short_composition2: "",
    category: "Antibiotic"
  },
  {
    id: "3",
    name: "Ascoril LS Syrup",
    price: "118",
    Is_discontinued: "FALSE",
    manufacturer_name: "Glenmark Pharmaceuticals Ltd",
    type: "allopathy",
    pack_size_label: "bottle of 100 ml Syrup",
    short_composition1: "Ambroxol (30mg/5ml)",
    short_composition2: "Levosalbutamol (1mg/5ml)",
    category: "Cough Syrup"
  },
  {
    id: "4",
    name: "Allegra 120mg Tablet",
    price: "218.81",
    Is_discontinued: "FALSE",
    manufacturer_name: "Sanofi India Ltd",
    type: "allopathy",
    pack_size_label: "strip of 10 tablets",
    short_composition1: "Fexofenadine (120mg)",
    short_composition2: "",
    category: "Antihistamine"
  },
  {
    id: "5",
    name: "Crocin 650 Advance Tablet",
    price: "47.5",
    Is_discontinued: "FALSE",
    manufacturer_name: "GlaxoSmithKline Pharmaceuticals Ltd",
    type: "allopathy",
    pack_size_label: "strip of 15 tablets",
    short_composition1: "Paracetamol (650mg)",
    short_composition2: "",
    category: "Antipyretic"
  },
  {
    id: "6",
    name: "Dolo 650 Tablet",
    price: "30.45",
    Is_discontinued: "FALSE",
    manufacturer_name: "Micro Labs Ltd",
    type: "allopathy",
    pack_size_label: "strip of 15 tablets",
    short_composition1: "Paracetamol (650mg)",
    short_composition2: "",
    category: "Antipyretic"
  },
  {
    id: "7",
    name: "Combiflam Tablet",
    price: "20.93",
    Is_discontinued: "FALSE",
    manufacturer_name: "Sanofi India Ltd",
    type: "allopathy",
    pack_size_label: "strip of 20 tablets",
    short_composition1: "Ibuprofen (400mg)",
    short_composition2: "Paracetamol (325mg)",
    category: "Analgesic"
  },
  {
    id: "8",
    name: "Cetirizine 10mg Tablet",
    price: "15.0",
    Is_discontinued: "FALSE",
    manufacturer_name: "Various",
    type: "allopathy",
    pack_size_label: "strip of 10 tablets",
    short_composition1: "Cetirizine (10mg)",
    short_composition2: "",
    category: "Antihistamine"
  },
  {
    id: "9",
    name: "ENO Regular Antacid Sachet",
    price: "5.0",
    Is_discontinued: "FALSE",
    manufacturer_name: "GlaxoSmithKline Consumer Healthcare",
    type: "allopathy",
    pack_size_label: "sachet of 5g",
    short_composition1: "Sodium Bicarbonate",
    short_composition2: "Citric Acid",
    category: "Antacid"
  },
  {
    id: "10",
    name: "Digene Gel",
    price: "65.0",
    Is_discontinued: "FALSE",
    manufacturer_name: "Abbott Healthcare Pvt Ltd",
    type: "allopathy",
    pack_size_label: "bottle of 200ml gel",
    short_composition1: "Magnesium Hydroxide",
    short_composition2: "Simethicone",
    category: "Antacid"
  },
  {
    id: "11",
    name: "Pantoprazole 40mg Tablet",
    price: "85.0",
    Is_discontinued: "FALSE",
    manufacturer_name: "Various",
    type: "allopathy",
    pack_size_label: "strip of 15 tablets",
    short_composition1: "Pantoprazole (40mg)",
    short_composition2: "",
    category: "PPI"
  },
  {
    id: "12",
    name: "Voveran 50 Tablet",
    price: "25.8",
    Is_discontinued: "FALSE",
    manufacturer_name: "Novartis India Ltd",
    type: "allopathy",
    pack_size_label: "strip of 10 tablets",
    short_composition1: "Diclofenac (50mg)",
    short_composition2: "",
    category: "NSAID"
  }
];

export function searchMedicines(query: string): IndianMedicine[] {
  return INDIAN_MEDICINES.filter(medicine => 
    medicine.name.toLowerCase().includes(query.toLowerCase()) ||
    medicine.short_composition1.toLowerCase().includes(query.toLowerCase()) ||
    medicine.short_composition2.toLowerCase().includes(query.toLowerCase()) ||
    medicine.category?.toLowerCase().includes(query.toLowerCase()) ||
    medicine.manufacturer_name.toLowerCase().includes(query.toLowerCase())
  );
}

export function getMedicinesByCategory(category: string): IndianMedicine[] {
  return INDIAN_MEDICINES.filter(medicine => 
    medicine.category?.toLowerCase() === category.toLowerCase()
  );
}

export function getTemplateByIllness(illnessName: string): IllnessTemplate | null {
  return ILLNESS_TEMPLATES.find(template => 
    template.name.toLowerCase().includes(illnessName.toLowerCase()) ||
    template.symptoms.some(symptom => 
      symptom.toLowerCase().includes(illnessName.toLowerCase())
    )
  ) || null;
}

export function generatePrescriptionFromTemplate(templateName: string, patientName: string): any {
  const template = getTemplateByIllness(templateName);
  if (!template) return null;

  return {
    diagnosis: template.diagnosis,
    medications: template.medicines,
    notes: `General Instructions for ${patientName}:\n\n${template.generalInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}`,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}