const express = require('express');
const morgan = require('morgan');
const cors = require('cors')
require('dotenv').config()

const Person = require('./models/person')

const app = express();
app.use(cors())

morgan.token('postData', (req) => {
    return JSON.stringify(req.body);
});


app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postData'));
app.use(express.static('build'));
app.use(express.json());

// const generateId = () => {
//     return Math.floor(Math.random() * 1000000);
// }

let persons = [

];

app.get('/api/persons', (req, res) => {
    Person.find({}).then((persons) => {
        res.json(persons);
    })
})

app.get("/info", (req, res) => {
    res.send(
        `<p>Phonebook has info for ${persons.length} people</p>
         <p>${new Date()}</p>`
    )
})

app.get("/api/persons/:id", (req, res) => {
    const id = Number(req.params.id);
    const person = persons.find(person => person.id === id);
    if (person) {
        res.json(person);
    } else {
        res.status(404).end();
    }
})

app.delete("/api/persons/:id", (req, res, next) => {
    const id = req.params.id;
    Person.findByIdAndRemove(id)
        .then(entry => {
            if (entry === null) {
                res.status(404).end();
            } else {
                res.status(204).end();
            }
        })
        .catch(next);
});

app.post("/api/persons", async (req, res) => {
    const body = req.body;
    if (!body.name || !body.number) {
        return res.status(400).json({
            error: "name or number missing"
        })
    }

    const existingPerson = await Person.findOne({ name: body.name });
    if (existingPerson) {
        return res.status(400).json({
            error: "name must be unique"
        })
    }

    const newPerson = new Person({
        name: body.name,
        number: body.number
    });

    const savedPerson = await newPerson.save();
    res.status(201).json(savedPerson);
});

// This block of code handles the PUT request to update a person's details
app.put('/api/persons/:id', (req, res, next) => {
    // Destructure the name and number from the request body
    const { name, number } = req.body;
    // Get the id from the request parameters
    const id = req.params.id;

    // Find the person with the specified id
    Person.findById(id)
        .then(person => {
            // If the person with the specified id is not found, throw an error
            if (person === null) {
                const error = new Error('Person not found');
                error.name = 'NotFoundError';
                next(error);
            } else {
                // If the person with the specified id is found and the number or name is the same as the existing person object, throw an error
                if (number === '' || person.name === name) {
                    const error = new Error('Name or number must be different than the existing one');
                    error.name = 'ValidationError';
                    next(error);
                } else {
                    // If the person with the specified id is found and the number and name are different, update their number if it has changed
                    if (person.number !== number) {
                        person.number = number;
                        // Save the updated person object
                        return person.save();
                    } else {
                        // If the number is not changed, return the existing person object
                        return person;
                    }
                }
            }
        })
        .then(updatedPerson => {
            // Send the updated person object as a JSON response
            res.json(updatedPerson);
        })
        .catch(error => {
            // Pass any errors to the error handling middleware
            next(error);
        });
});



const unknownEndpoint = (req, res) => {
    res.status(404).json({ error: "unknown endpoint" });
}

app.use(unknownEndpoint);

const errorHandler = (error, req, res, next) => {
    const errorMessage = error.message || 'Internal Server Error';
    res.status(500).send(errorMessage);
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})