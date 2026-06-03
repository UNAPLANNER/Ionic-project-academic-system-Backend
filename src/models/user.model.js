const userSchema = {
  id: String,
  email: String,
  role: String, // 'teacher' | 'student'
  name: String
};

module.exports = userSchema;
