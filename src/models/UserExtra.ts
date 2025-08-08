import mongoose from 'mongoose';

const UserExtraSchema = new mongoose.Schema(
  {
    wpUserId: { type: Number, required: true, unique: true },
    idade: { type: Number },
    avatarUrl: { type: String },
    ofertasAplicadas: [{ type: String }], // ids ou nomes
  },
  { timestamps: true }
);

export default mongoose.models.UserExtra || mongoose.model('UserExtra', UserExtraSchema);
