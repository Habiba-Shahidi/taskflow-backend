const exp = require('express');
const app = exp();
app.use(exp.json());  //Middleware for POST Request

// Fake "database" for now — just an array in memory
const tasks = [
    { id: 1, title: 'Learn Node js' },
    { id: 2, title: 'Learn EXpress js' },
    { id: 3, title: 'Connect to mysql' }
]

//CRUD- create read update delete

//GET request
app.get('/', (req, res) => {
    res.send('Welcome Backend User!');
});


app.get('/tasks', (req, res) => {
    res.json(tasks)
});

app.get('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(item => item.id === id)
    console.log('task', task)
    if (!task) {
        return res.status(404).send('Task Not Found')
    }
    res.json(task)
});


//POST Request
// app.post('/tasks', (req,res) => {
//      console.log(req.body);
//     res.send('received')
// })

//Create a new task
app.post('/tasks', (req, res) => {
    const newID = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

    const newTask = {
        id: newID,
        title: req.body.title
    }

    tasks.push(newTask)

    res.status(201).json(newTask);
})

//PUT Request : Update the task. - /tasks/:id (update) - "replace or update an existing thing."


app.put('/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) {
        return res.status(404).send('Task Not Found')
    }
    task.title = req.body.title
    res.json(task)
})

//DELETE Request
app.delete('/tasks/:id', (req, res) => {
    const index = tasks.findIndex(t => t.id === parseInt(req.params.id))
    if (index === -1) {
       return res.status(404).send('No Task Found!!')
    }
    tasks.splice(index, 1);   //tasks.splice(index, 1) means "starting at this position, remove 1 item"
    res.status(204).send()  //204 No Content is the convention for "done, and there's nothing to send back"
})


app.listen(4000, () => {
    console.log('restart Server running on http://localhost:4000');
})