// models/Person.js → FULLY DYNAMIC: ACCEPTS ANY FIELDS
import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({}, {
  strict: false,  // Allows ANY fields from Excel
  timestamps: true
});

export default mongoose.models.Person || mongoose.model('Person', personSchema);