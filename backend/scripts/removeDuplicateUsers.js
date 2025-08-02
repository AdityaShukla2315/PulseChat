const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
});
const User = mongoose.model('User', userSchema, 'users');

async function removeDuplicates() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const users = await User.find({});
  const seen = {};
  let deleted = 0;
  for (const user of users) {
    if (seen[user.fullName]) {
      await User.deleteOne({ _id: user._id });
      console.log('Deleted duplicate:', user.fullName, user.email);
      deleted++;
    } else {
      seen[user.fullName] = true;
    }
  }
  await mongoose.disconnect();
  console.log(`Done. Deleted ${deleted} duplicate users.`);
}

removeDuplicates().catch(console.error);
