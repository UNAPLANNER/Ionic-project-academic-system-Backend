const studentSchema = {
  id: String,
  name: String,
  email: String,
  career: String,
  semester: Number,
  photoUrl: String,
  createdAt: Date
};

const REQUIRED_FIELDS = ['name', 'email', 'career', 'semester'];

function validateStudentFields(body) {
  const missing = REQUIRED_FIELDS.filter(f => body[f] === undefined || body[f] === '');
  return missing;
}

module.exports = { studentSchema, validateStudentFields };