import { Schema, model, models } from 'mongoose';

const TestSchema = new Schema(
  {
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'testdocs' }
);

export default models.TestDoc || model('TestDoc', TestSchema);
