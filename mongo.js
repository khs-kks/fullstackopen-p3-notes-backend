// This program connects to a MongoDB database using a password provided as a command line argument.
// It can be used to add a person to the phonebook or to print out the existing entries in the phonebook.
// To add a person, use the following command: node mongo.js <password> <person name> <person number>
// To print out the entries, use the following command: node mongo.js <password>
// Note that the password is required in both cases.

const mongoose = require('mongoose');

const password = process.argv[2];

if (!password) {
    console.error('Please provide a password');
    process.exit(1);
}

const url = `mongodb+srv://kks35khs:${password}@cluster0.fbsbufq.mongodb.net/phonebook-app?retryWrites=true&w=majority`;
mongoose.set('strictQuery', false);
mongoose.connect(url);

const personSchema = new mongoose.Schema({
    name: String,
    number: String,
});

const Person = mongoose.model('Person', personSchema);

const personName = process.argv[3];
const personNumber = process.argv[4];

if (personName && personNumber) {
    const person = new Person({
        name: personName,
        number: personNumber,
    });

    person.save().then(() => {
        console.log(`added ${person.name} number ${person.number} to phonebook`);
        mongoose.connection.close();
    });
} else {
    Person.find({}).then((result) => {
        result.forEach((person) => {
            console.log(person.name, person.number);
        });
        mongoose.connection.close();
    });
}
