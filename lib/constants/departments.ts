// Covenant University Departments organized by Colleges
export const COVENANT_DEPARTMENTS = {
  "College of Engineering": [
    "Civil Engineering",
    "Electrical and Information Engineering", 
    "Computer Engineering",
    "Electrical and Electronics Engineering", 
    "Information and Communication Engineering",
    "Mechanical Engineering",
    "Petroleum Engineering", 
    "Chemical Engineering"
  ],
  "College of Science and Technology": [
    "Architecture",
    "Building Technology", 
    "Estate Management",
    "Biological Sciences",
    "Applied Biology and Biotechnology",
    "Microbiology",
    "Biochemistry",
    "Molecular Biology", 
    "Chemistry",
    "Industrial Chemistry",
    "Computer and Information Sciences",
    "Mathematics", 
    "Industrial Mathematics",
    "Physics",
    "Industrial Physics"
  ],
  "College of Management and Social Sciences": [
    "Accounting",
    "Banking and Finance", 
    "Business Management",
    "Business Administration",
    "Industrial Relations and Human Resource Management",
    "Marketing and Entrepreneurship",
    "Economics",
    "Demography and Social Statistics", 
    "Mass Communication",
    "Sociology"
  ],
  "College of Leadership and Development Studies": [
    "Political Science and International Relations",
    "International Relations",
    "Policy and Strategic Studies", 
    "Political Science",
    "Psychology",
    "Languages and General Studies",
    "English Language",
    "French Language", 
    "Leadership Studies"
  ]
};

// Flattened list for quick access
export const ALL_DEPARTMENTS = Object.values(COVENANT_DEPARTMENTS).flat();

// HOD Token for demo purposes
export const HOD_TOKEN = "Faith123";