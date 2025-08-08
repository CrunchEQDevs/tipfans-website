import { connectDB } from '@/lib/mongo';
import UserExtra from '@/models/UserExtra';

export async function GET() {
  await connectDB();
  const usuarios = await UserExtra.find({});
  return Response.json(usuarios);
}
