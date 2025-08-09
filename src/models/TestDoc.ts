import { Schema, model, models } from 'mongoose';

const TestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'testdocs' }
);

export default models.TestDoc || model('TestDoc', TestSchema);
