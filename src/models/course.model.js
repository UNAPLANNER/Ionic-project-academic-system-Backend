const courseSchema = {
  id: String,
  name: String,
  code: String,
  teacherId: String,
  credits: Number,
  schedule: String,
  students: Array
};

const REQUIRED_FIELDS = ['name', 'code', 'credits', 'schedule'];

function validateCourseFields(body) {
  return REQUIRED_FIELDS.filter(field => body[field] === undefined || body[field] === '');
}

module.exports = { courseSchema, validateCourseFields };
