const userSchema = {
  id: String,
  email: String,
  role: String, // 'admin' | 'teacher' | 'student'
  name: String,
  createdAt: Date
};

const REQUIRED_FIELDS = ['name', 'email'];

function validateUserFields(body) {
  return REQUIRED_FIELDS.filter(field => body[field] === undefined || body[field] === '');
}

function toUserResponse(doc, fallbackRole = null) {
  const data = doc.data();
  return {
    id: data.id ?? doc.id,
    name: data.name ?? '',
    email: data.email ?? '',
    role: data.role ?? fallbackRole
  };
}

module.exports = { userSchema, validateUserFields, toUserResponse };
