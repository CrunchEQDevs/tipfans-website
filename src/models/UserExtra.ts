import mongoose from 'mongoose';

const UserExtraSchema = new mongoose.Schema({
  nome: String,
  idade: Number,
  email: String,
});

export default mongoose.models.UserExtra || mongoose.model('UserExtra', UserExtraSchema);
