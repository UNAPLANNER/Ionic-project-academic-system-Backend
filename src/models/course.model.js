const courseSchema = {
  id: String,
  name: String,
  code: String,
  teacherId: String,
  credits: Number,
  schedule: String,
  students: Array
};

module.exports = courseSchema;