import mongoose, { Schema, Document, models } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  idade: number;
  role: string;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    idade: { type: Number, required: true },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.User || mongoose.model<IUser>('User', UserSchema);
