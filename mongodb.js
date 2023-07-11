const {MongoClient} = require("mongodb")

require("dotenv").config()

const client = new MongoClient(process.env.DB_URL)

async function connect() {
    console.log("Connecting ...")
    let connection = null
    try {
        connection = await client.connect()
        console.log("\tConnected !!");
    } catch (error) {
        console.log("\tError: " + error.message);
    }
    return connection
}

async function disconnect() {
    try {
        await client.close()
        console.log("\tDisconnected !!");
    } catch (error) {
        console.log("\tError: " + error.message);
    }
}

async function getCollection(collectionName) {
    const connectionToDB = await connect()
    const db = connectionToDB.db(process.env.DB_NAME)
    const collection = db.collection(collectionName)
    return collection
}

//Obtener el mayor ID de la collection autos y sumarle 1
async function nextID() {
    const collection = await getCollection("autos")
    const collectionArray = await collection.find().toArray()
    let maxID = 0
    collectionArray.forEach(item => {
        if (item.id > maxID) maxID = item.id
    })
    return maxID + 1
}

module.exports = { getCollection, disconnect, nextID}