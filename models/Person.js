// models/Person.js → FULLY DYNAMIC (NO REQUIRED FIELDS EVER!)
import mongoose from 'mongoose';

const personSchema = new mongoose.Schema(
  {}, 
  { 
    strict: false,      // Accept ANY fields from Excel
    timestamps: true,   // Keep createdAt/updatedAt
    collection: 'people'
  }
);

const Person = mongoose.models.Person || mongoose.model('Person', personSchema);
export default Person;