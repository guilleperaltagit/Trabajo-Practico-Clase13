const express = require("express")

const { getCollection, disconnect, nextID } = require("../mongodb");

const server = express()

//Middleware: Establece el manejo de datos en formato JSON (propio de express)
server.use(express.json())

//Middleware: Codifica la url + params/query
server.use(express.urlencoded({extended: true}))

// Bienvenida
server.get("/", (req, res) => {
    res.status(200).send("<h1>Bienvenido a la web de COCHES<h1>")
})

//Obtener un coche específico por ID con url params
server.get("/coches/:id", async (req, res) => {
    const {id} = req.params
    const collection = await getCollection("autos")
    const coche = await collection.findOne({id: Number(id)})
    if (!coche) {
        res.status(400).send("<h1>ERROR. El id no corresponde a un coche válido</h1>")
    } else{
        res.status(200).send(JSON.stringify(coche))
    }
    disconnect()
})

//Listado de todos los coches, y búsqueda específica por Marca, Modelo, desde año (incluido), desde precio (incluido)
server.get("/coches", async (req, res) => {
    const {marca, modelo, desde_anio, desde_precio} = req.query
    let filtros = {}
    if (marca) filtros.marca = marca
    if (modelo) filtros.modelo = modelo
    if (desde_anio) filtros.anio = {$gte : Number(desde_anio)}
    if (desde_precio) filtros.precio = { $gte: Number(desde_precio) }
    console.log(filtros);
    const collection = await getCollection("autos")
    const coches = await collection.find(filtros).toArray()
    res.status(200).send(coches)
    disconnect()
})

//Crear un nuevo coche. Se deben mandar los datos por query: marca, modelo, año y precio
//descuento, velocidad_crucero y es_0km son opcionales
server.post("/coches", async (req, res) => {
    const { marca, modelo, anio, precio, descuento, velocidad_crucero, es_0km } = req.query
    if (!marca || !modelo || !anio || !precio) return res.status(400).send("<h1>ERROR. Datos incompletos</h1>")
    const id = await nextID()
    const coche = { id, marca, modelo, anio, precio }
    if (descuento) coche.descuento = descuento
    if (velocidad_crucero) coche.velocidad_crucero = velocidad_crucero
    if (es_0km) coche.es_0km = es_0km
    const collection = await getCollection("autos")
    await collection.insertOne(coche)
    res.status(200).send(coche)
    disconnect()
})

//Actualizar los datos de un coche existente. Se debe mandar ID por url
//Se deben mandar los datos por query: marca, modelo, año y precio
//descuento, velocidad_crucero y es_0km son opcionales
server.put("/coches/:id", async (req, res) => {
    const {id} = req.params
    const { marca, modelo, anio, precio, descuento, velocidad_crucero, es_0km } = req.query
    if (!id && !marca && !modelo && !anio && !precio) return res.status(400).send("<h1>ERROR. Datos incompletos</h1>")
    const coche = { marca, modelo, anio, precio }
    if (descuento) coche.descuento = descuento
    if (velocidad_crucero) coche.velocidad_crucero = velocidad_crucero
    if (es_0km) coche.es_0km = es_0km
    try {
        const collection = await getCollection("autos")

        //Validar si el ID ingresado existe en la BD
        const collectionArray = await collection.find().toArray()
        const cocheBuscadoPorID = collectionArray.find((item) => item.id === Number(id))
        if (!cocheBuscadoPorID) return res.status(404).send("<h1>ERROR 404</h1><br><h2>El ID solicitado no existe</h2>")
        // FIN Validación

        await collection.updateOne({id: Number(id)}, {$set: coche})
        res.status(200).send(coche)
    } catch (error) {
        console.log(error.message)
        res.status(500).send("<h1>ERROR 500 SERVER ERROR") 
    } finally {
        await disconnect()
    }    
})

//Eliminar un coche por ID enviado por url
server.delete("/coches/:id", async (req, res) => {
    const { id } = req.params
    if (!id ) return res.status(400).send("<h1>ERROR. No se envió ID</h1>")
    try {
        const collection = await getCollection("autos")

        //Validar si el ID ingresado existe en la BD
        const collectionArray = await collection.find().toArray()
        const cocheBuscadoPorID = collectionArray.find((item) => item.id === Number(id))
        if (!cocheBuscadoPorID) return res.status(404).send("<h1>ERROR 404</h1><br><h2>El ID solicitado no existe</h2>")
        // FIN Validación

        await collection.deleteOne({ id: Number(id) })
        res.status(200).send(`Se eliminó el coche con ID = ${Number(id)}`)
    } catch (error) {
        console.log(error.message)
        res.status(500).send("<h1>ERROR 500 SERVER ERROR")
    } finally {
        await disconnect()
    }
})

//Manejo de rutas inexistentes
server.use("*", (req, res) => {
    res.status(404).send("<h1>ERROR 404</h1><br><h2>La URL solicitada no existe</h2>")
})

//Escucha de peticiones
server.listen(process.env.PORT, process.env.HOST, console.log(`EscuchandoServer escuchando en http://${process.env.HOST}:${process.env.PORT}`))

