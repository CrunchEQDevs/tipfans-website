// src/models/UserExtra.ts
import mongoose from 'mongoose';

const UserExtraSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  avatarUrl: String,
  memberSince: String,
  stats: Object,
});

export default mongoose.models.UserExtra || mongoose.model('UserExtra', UserExtraSchema);
