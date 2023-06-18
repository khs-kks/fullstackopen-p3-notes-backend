const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const Person = require('./models/person');

const app = express();
app.use(cors());

morgan.token('postData', (req) => JSON.stringify(req.body));

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postData'));
app.use(express.static('build'));
app.use(express.json());

// const generateId = () => {
//     return Math.floor(Math.random() * 1000000);
// }

app.get('/api/persons', (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  });
});

// app.get("/info", (req, res) => {
//     res.send(
//         `<p>Phonebook has info for ${persons.length} people</p>
//          <p>${new Date()}</p>`
//     )
// })

app.get('/info', async (req, res, next) => {
  try {
    // retrieve the count of documents from the person collection
    const count = await Person.countDocuments();

    // send the response with the count of persons and current date
    res.send(
      `<p>Phonebook has info for ${count} people</p>
             <p>${new Date()}</p>`,
    );
  } catch (error) {
    // pass the error to the error handling middleware
    next(error);
  }
});

app.get('/api/persons/:id', (req, res) => {
  const { id } = req.params;
  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).json({ error: 'Person not found' });
      }
    })
    .catch((error) => {
      console.log(error.message);
      res.status(404).json({ error: 'Person not found' });
    });
});

app.delete('/api/persons/:id', (req, res, next) => {
  const { id } = req.params;
  Person.findByIdAndRemove(id)
    .then((entry) => {
      if (entry === null) {
        res.status(404).end();
      } else {
        res.status(204).end();
      }
    })
    .catch(next);
});

// app.post("/api/persons", async (req, res) => {
//     const body = req.body;
//     if (!body.name || !body.number) {
//         return res.status(400).json({
//             error: "name or number missing!"
//         })
//     }

//     const existingPerson = await Person.findOne({ name: body.name });
//     if (existingPerson) {
//         return res.status(400).json({
//             error: "name must be unique!"
//         })
//     }

//     const newPerson = new Person({
//         name: body.name,
//         number: body.number
//     });

//     const savedPerson = await newPerson.save();
//     res.status(201).json(savedPerson);
// });

app.post('/api/persons', async (req, res, next) => {
  const person = new Person({
    name: req.body.name,
    number: req.body.number,
  });

  try {
    const savedPerson = await person.save({ runValidators: true });
    res.status(201).json(savedPerson);
  } catch (error) {
    next(error);
  }
});

app.put('/api/persons/:id', async (req, res, next) => {
  const person = {
    name: req.body.name,
    number: req.body.number,
  };

  try {
    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      person,
      {
        new: true,
        runValidators: true,
        context: 'query',
      },
    );

    if (!updatedPerson) {
      return res.status(404).json({ error: 'person not found' });
    }

    res.json(updatedPerson);
  } catch (err) {
    next(err);
  }
});

const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: 'unknown endpoint' });
};

app.use(unknownEndpoint);

// const errorHandler = (error, req, res, next) => {
//     const errorMessage = error.message || 'Internal Server Error!';
//     res.status(500).send(errorMessage);
// };

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' });
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

app.use(errorHandler);

const { PORT } = process.env;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
