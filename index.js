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

// app.delete("/api/persons/:id", (req, res) => {
//     const id = Number(req.params.id);
//     const person = persons.find(person => person.id === id);
//     if (!person) {
//         return res.status(404).end();
//     }
//     persons = persons.filter(person => person.id !== id);
//     res.status(204).end();
// });

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

// app.post("/api/persons", (req, res) => {
//     const body = req.body;
//     if (!body.name || !body.number) {
//         return res.status(400).json({
//             error: "name or number missing"
//         })
//     }

//     if (persons.find(person => person.name === body.name)) {
//         return res.status(400).json({
//             error: "name must be unique"
//         })
//     }

//     const newPerson = {
//         "id": generateId(),
//         "name": body.name,
//         "number": body.number
//     }
//     persons = persons.concat(newPerson);
//     res.status(201).json(newPerson);
// })

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

const unknownEndpoint = (req, res) => {
    res.status(404).json({ error: "unknown endpoint" });
}

app.use(unknownEndpoint);

const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).end();
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})