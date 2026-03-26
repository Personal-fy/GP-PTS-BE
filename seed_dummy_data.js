const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const connectDB = require('./src/config/db');

const User = require('./src/modules/users/user.model');
const Student = require('./src/modules/students/student.model');
const Course = require('./src/modules/courses/course.model');
const Grade = require('./src/modules/grades/grade.model');
const Attendance = require('./src/modules/attendance/attendance.model');
const Discipline = require('./src/modules/discipline/discipline.model');
const Message = require('./src/modules/messages/message.model');

async function main() {
  await connectDB();

  const PASSWORD = 'password';

  const usernames = {
    admin: 'admin@university.edu',
    teacher: 'teacher@university.edu',
    registry: 'registry@university.edu',
    student: 'student@university.edu',
    parent1: 'parent1@university.edu',
    parent2: 'parent2@university.edu'
  };

  // We will set the child's matric number to `password`
  // so that parent login password=`password` authorizes to this child.
  const seededStudentId = 'password';

  const seedCourseName = 'CSC 301 — Data Structures';
  const seedCourseSubject = 'Computer Science';

  // 1) Delete existing seeded records to keep the script idempotent.
  // We delete children/course-scoped data by looking up existing IDs first.
  const existingStudent = await Student.findOne({ studentId: seededStudentId }).select('_id userId');
  if (existingStudent?._id) {
    await Promise.all([
      Grade.deleteMany({ studentId: existingStudent._id }),
      Attendance.deleteMany({ studentId: existingStudent._id }),
      Discipline.deleteMany({ studentId: existingStudent._id })
    ]);
  }

  // Messages don't have a direct unique key, so we delete by our seeded subject.
  await Message.deleteMany({ subject: 'Dummy Welcome' }).catch(() => {});

  await Course.deleteMany({ courseName: seedCourseName, subject: seedCourseSubject });
  await Student.deleteMany({ studentId: seededStudentId });
  await User.deleteMany({ username: Object.values(usernames) });

  const today = new Date();
  const isoDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const dob = new Date('2006-01-15T00:00:00.000Z');

  // 2) Create base users (password should be `password` for all roles)
  // Note: user.model.js hashes passwords in a pre-save hook, so we provide plaintext.
  const [admin, teacher, registry, studentUser, parent1, parent2] = await Promise.all([
    User.create({
      username: usernames.admin,
      password: PASSWORD,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: usernames.admin
    }),
    User.create({
      username: usernames.teacher,
      password: PASSWORD,
      role: 'teacher',
      firstName: 'Test',
      lastName: 'Lecturer',
      email: usernames.teacher
    }),
    User.create({
      username: usernames.registry,
      password: PASSWORD,
      role: 'registry',
      firstName: 'System',
      lastName: 'Registry',
      email: usernames.registry
    }),
    User.create({
      username: usernames.student,
      password: PASSWORD,
      role: 'student',
      firstName: 'Dummy',
      lastName: 'Student',
      email: usernames.student
    }),
    User.create({
      username: usernames.parent1,
      password: PASSWORD,
      role: 'parent',
      firstName: 'Parent',
      lastName: 'One',
      email: usernames.parent1
    }),
    User.create({
      username: usernames.parent2,
      password: PASSWORD,
      role: 'parent',
      firstName: 'Parent',
      lastName: 'Two',
      email: usernames.parent2
    })
  ]);

  // 3) Create a course and a student (child)
  const course = await Course.create({
    courseName: seedCourseName,
    subject: seedCourseSubject,
    teacherId: teacher._id
  });

  const child = await Student.create({
    studentId: seededStudentId,
    firstName: 'Child',
    lastName: 'One',
    dateOfBirth: dob,
    userId: studentUser._id,
    program: 'General',
    level: '100 Level',
    parentIds: [parent1._id, parent2._id],
    courseIds: [course._id]
  });

  // 4) Seed grades, attendance, and discipline for that child
  // Teacher UI defaults to `Mid-term Exam` so we seed exactly one record per student.
  await Grade.create({
    studentId: child._id,
    courseId: course._id,
    assignmentName: 'Mid-term Exam',
    score: 85,
    totalPoints: 100,
    dateAssigned: new Date(),
    teacherComments: 'Dummy seeded mid-term score.'
  });

  await Attendance.create({
    studentId: child._id,
    date: new Date(isoDate),
    status: 'present',
    notes: 'Seeded attendance.'
  });

  // Frontend expects type/dateOfIncident but backend discipline model uses
  // `incidentType` and `date`. We seed incidentType values; the UI can map them.
  await Discipline.create({
    studentId: child._id,
    teacherId: teacher._id,
    date: new Date(isoDate),
    incidentType: 'Positive',
    description: 'Seeded positive conduct.',
    actionTaken: 'Keep it up.'
  });

  // 5) Seed a simple message thread between teacher and each parent
  await Message.create({
    senderId: teacher._id,
    receiverId: parent1._id,
    subject: 'Dummy Welcome',
    body: 'Welcome to the portal (seeded message).',
    isRead: false
  });

  await Message.create({
    senderId: teacher._id,
    receiverId: parent2._id,
    subject: 'Dummy Welcome',
    body: 'Welcome to the portal (seeded message).',
    isRead: false
  });

  console.log('Dummy data seeded successfully.');
  console.log('Login credentials (password = password):');
  console.log(`- Admin: ${usernames.admin} / ${PASSWORD}`);
  console.log(`- Teacher: ${usernames.teacher} / ${PASSWORD}`);
  console.log(`- Registry: ${usernames.registry} / ${PASSWORD}`);
  console.log(`- Parent1: ${usernames.parent1} / ${PASSWORD} (uses child matric)`);
  console.log(`- Parent2: ${usernames.parent2} / ${PASSWORD} (uses child matric)`);
  console.log(`- Child matric (Student.studentId): ${seededStudentId}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

