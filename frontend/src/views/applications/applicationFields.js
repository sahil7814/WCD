export const initialApplicationForm = {
  womanName: '',
  fatherHusbandName: '',
  mobileNumber: '',
  womanCategory: '',
  disabilityType: '',
  disabilityPercentage: '',
  villageName: '',
  postOffice: '',
  anganwadiCentre: '',
  gramPanchayat: '',
  district: '',
  assemblyConstituency: '',
  cdpoBlock: '',
  annualIncome: '',
  daughtersUnder18: '',
  unmarriedDaughters18To45: '',
  sonsUnder18: '',
  unmarriedSons18To27: '',
  socialCategory: '',
  aadhaarNumber: '',
  isBpl: ''
}

export const applicationFieldLabels = {
  womanName: ['Name of Woman', 'महिला का पूरा नाम'],
  fatherHusbandName: ["Father's / Husband's Name", 'पिता / पति का नाम'],
  mobileNumber: ['Mobile / Contact Number', 'मोबाइल नंबर / संपर्क नंबर'],
  womanCategory: ['Category to which the woman belongs', 'महिला श्रेणी, जिससे संबंधित है'],
  disabilityType: ['Disability type, if applicable', 'दिव्यांगता का प्रकार'],
  disabilityPercentage: ['Percentage of disability', 'विकलांगता का प्रतिशत'],
  villageName: ['Name of Village', 'गाँव का नाम'],
  postOffice: ['Post Office', 'डाकघर'],
  anganwadiCentre: ['Name of Anganwadi Centre', 'आंगनवाड़ी केंद्र का नाम'],
  gramPanchayat: ['Gram Panchayat / Urban Body', 'ग्राम पंचायत / शहरी निकाय का नाम'],
  district: ['District', 'जिला'],
  assemblyConstituency: ['Assembly Constituency', 'विधानसभा निर्वाचन क्षेत्र'],
  cdpoBlock: ['CDPO Block', 'बाल विकास परियोजना अधिकारी (सीडीपीओ) का विकास खंड'],
  annualIncome: ['Total Annual Income from All Sources', 'सभी स्रोतों से प्राप्त कुल वार्षिक आय'],
  daughtersUnder18: ['Daughters aged 0–18 years', '0–18 वर्ष की आयु वर्ग में आने वाली पुत्रियों की संख्या'],
  unmarriedDaughters18To45: ['Unmarried daughters aged 18–45 years', '18–45 वर्ष की आयु वर्ग में आने वाली अविवाहित पुत्रियों की संख्या'],
  sonsUnder18: ['Sons aged 0–18 years', '0–18 वर्ष की आयु वर्ग में आने वाले पुत्रों की संख्या'],
  unmarriedSons18To27: ['Unmarried sons aged 18–27 years', '18–27 वर्ष की आयु वर्ग में आने वाले अविवाहित पुत्रों की संख्या'],
  socialCategory: ['Category to which the woman belongs', 'वर्ग, जिससे महिला संबंधित है'],
  aadhaarNumber: ["Woman's Aadhaar Number", 'महिला का आधार नंबर'],
  isBpl: ['Does the woman belong to a BPL family?', 'क्या महिला बीपीएल परिवार से संबंधित है?']
}

export const districtOptions = [
  'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu',
  'Lahaul & Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'
]

export const womanCategoryOptions = [
  'Pregnant Woman',
  'Lactating Mother',
  'Widow',
  'Divorced Woman',
  'Unmarried Woman',
  'Single Woman',
  'Other'
]

export const disabilityTypeOptions = [
  'No Disability',
  'Visual Disability',
  'Hearing Disability',
  'Speech and Language Disability',
  'Locomotor Disability',
  'Intellectual Disability',
  'Multiple Disabilities',
  'Other'
]

export const socialCategoryOptions = [
  'General',
  'Scheduled Caste',
  'Scheduled Tribe',
  'Other Backward Class'
]

export const yesNoOptions = ['Yes', 'No']

export const genderOptions = ['Female', 'Male', 'Other']

export const categoryOptions = [
  'General',
  'Scheduled Caste',
  'Scheduled Tribe',
  'Other Backward Class',
  'Below Poverty Line'
]

export const schemeOptions = [
  'Matru Vandana Yojana',
  'Sakhi One Stop Centre',
  'Beti Hai Anmol',
  'Integrated Child Development Services',
  'Women Safety Scheme'
]
