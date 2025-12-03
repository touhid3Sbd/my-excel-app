import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true },
});

const Person = mongoose.models.Person || mongoose.model('Person', personSchema);

export default Person;